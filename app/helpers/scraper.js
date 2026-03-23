const Helpers = require('../helpers/includes'),
	requestDelay = 1000,
	requestErrorDelay = 30000,
	cloneDeep = require('lodash.clonedeep'),
	cheerio = require('cheerio'),
	eachOfLimit = require('async/eachOfLimit'),
	{ fetchPage: browserFetch } = require('../helpers/browser')

async function fetchPage(url) {
	const { html } = await browserFetch(url)
	return html
}

/**
 * Parse Kijiji price range from URL query param (e.g. price=500__900)
 * Returns {min, max} or null if no price param
 */
function parsePriceFromUrl(url) {
	try {
		const urlObj = new URL(url)
		const priceParam = urlObj.searchParams.get('price')
		if (!priceParam) return null
		const parts = priceParam.split('__')
		return {
			min: parts[0] ? Number(parts[0]) : 0,
			max: parts[1] ? Number(parts[1]) : null
		}
	} catch(e) { return null }
}

/**
 * Set the price param on a Kijiji URL
 */
function setUrlPrice(url, min, max) {
	try {
		const urlObj = new URL(url)
		urlObj.searchParams.set('price', (min || '') + '__' + (max || ''))
		return urlObj.toString()
	} catch(e) { return url }
}

/**
 * Split a price range into N equal folds
 */
function splitPriceRange(min, max, folds) {
	const ranges = []
	const step = Math.ceil((max - min) / folds)
	for (let i = 0; i < folds; i++) {
		const lo = min + (step * i)
		const hi = (i === folds - 1) ? max : min + (step * (i + 1))
		ranges.push({min: lo, max: hi})
	}
	return ranges
}

module.exports = {
	processPage: async function (params, callback=null){
		Helpers.logger.log({print: 'Processing new ads for: '+params.jobName, channels:params.jobId+'jobUpdate'})
		if (!params.pageUrl || params.pageUrl == "")
			return
		params.index_site = 0
		params.startTime = Date.now()
		params.foldPageNumber = 0
		params.totalListingsFound = 0
		let jobStatusCode = 2
		params.fingerprint = Math.floor(Math.random() * (99999999999999 - 1 + 1) ) + 1 //between 1 and 99999999999999

		// Price folds: split into sub-ranges and scrape each
		if (params.priceFolds && params.priceFolds >= 2) {
			const price = parsePriceFromUrl(params.pageUrl)
			if (price && price.max) {
				const ranges = splitPriceRange(price.min || 0, price.max, params.priceFolds)
				Helpers.logger.log({print: `Splitting search into ${ranges.length} price folds`, channels:params.jobId+'jobUpdate'})
				params.totalFolds = ranges.length
				let idx = 0
				for (const range of ranges) {
					idx++
					params.foldIndex = idx
					params.foldPageNumber = 0
					params.foldListingsFound = 0
					const foldUrl = setUrlPrice(params.pageUrl, range.min, range.max)
					Helpers.logger.log({print: `Scraping price fold: $${range.min}-$${range.max}`, channels:params.jobId+'jobUpdate'})
					// Check job status before each fold
					let user = await params.db.get('users').findOne({'jobs.id':params.jobId})
					if(user) jobStatusCode = user.jobs.find(job => job.id == params.jobId).statusCode
					if(!user || !jobStatusCode || jobStatusCode < 2) {
						Helpers.logger.log({print: `Job ${params.jobId} ${params.jobName} stopped`, channels:params.jobId+'jobUpdate'})
						return
					}
					params.pageUrl = foldUrl
					const foldResult = await module.exports._scrapePaginatedPages(params)
					if (foldResult.aborted) return
					if (foldResult.sitesFound === 0) {
						Helpers.logger.log({print: `Fold $${range.min}-$${range.max} returned 0 listings — skipped. Verify manually (may be empty or soft-blocked): ${foldUrl}`, channels:params.jobId+'jobWarning'})
					}
				}
				// After all folds, clean up and finish
				return module.exports._finishJob(params, callback)
			} else {
				Helpers.logger.log({print: `Cannot split by price: URL has no price range (use price=MIN__MAX). Running without folds.`, channels:params.jobId+'jobWarning'})
			}
		}

		const result = await module.exports._scrapePaginatedPages(params)
		if (result.aborted) {
			if(callback) callback(`Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`,false)
			return
		}
		return module.exports._finishJob(params, callback)
	},
	_scrapePaginatedPages: async function(params) {
		let sitesFound = 0
		while(params.pageUrl){
			try{
				params.sites=[]
				params.pageNumber++
				if (params.foldPageNumber !== undefined) params.foldPageNumber++
				let user = await params.db.get('users').findOne({'jobs.id':params.jobId})
				let jobStatusCode = user ? user.jobs.find(job => { return job.id == params.jobId}).statusCode : 0
				if(!user || !jobStatusCode || jobStatusCode<2)
				{
					Helpers.logger.log({print: `Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`, channels:params.jobId+'jobUpdate'})
					return { aborted: true, sitesFound }
				}
				let html = await fetchPage(params.pageUrl, params)
				if(html.includes("Security Violation"))
					throw('violation error detected')

				let $ = cheerio.load(html)
				const hasNextPage = !!$('li[data-testid="pagination-next-link"]').text()
				const hasPrevPage = !!$('li[data-testid="pagination-previous-link"]').text()

				let urls = [].map.call($('a[data-testid="listing-link"]'), function(link) {
					return link
				})
				Object.keys(urls).forEach(function(trait) {
					params.sites.push(urls[trait].attribs.href)
				})

				if(!hasNextPage && !hasPrevPage) {
					if(params.sites.length === 0) {
						// Page loaded but 0 results — could be genuine empty or soft-blocked.
						// Skip this fold; warning is emitted by the caller with the fold URL.
						break
					}
					// Single page of results (no pagination) — process and stop
					await module.exports.processPageAds(params)
					sitesFound += params.sites.length
					break
				}

				await module.exports.processPageAds(params)
				sitesFound += params.sites.length

				let url_next = $('li[data-testid="pagination-next-link"]').find('a').attr('href')
				Helpers.logger.log({print: `Next page: `+url_next, channels:params.jobId+'jobUpdate'})
				params.pageUrl = url_next || undefined
			}
			catch(e){
				params.pageNumber--
				Helpers.logger.log({print: `Retrying to process page ${params.pageUrl} in ${requestErrorDelay/1000}s ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay)
			}
		}
		return { aborted: false, sitesFound }
	},
	_finishJob: async function(params, callback=null) {
		try{
			try{
				const result = await params.db.get('ads').remove({$and:[{["jobs."+params.jobId]:{ $exists: true}},{['jobs.'+params.jobId+'.fingerprint']: {$ne: params.fingerprint}}]})
				Helpers.logger.log({print: `All expired ads have been removed! Removed: ${result.result.n} ads.`, channels:params.jobId+'jobUpdate'})
			}
			catch(err){Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'})}

			try{
				await params.db.get('users').update({"jobs.id":params.jobId},{"$set": {"jobs.$.statusCode":1}})
			}
			catch(err){Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'})}
		}
		catch(e)
		{
			console.log(e)
		}

		Helpers.logger.log({ command:'doneProc', print: params.pageNumber, params: { startTime: params.startTime, totalListingsFound: params.totalListingsFound }, channels:params.jobId+'command'})
		if(callback)
			callback(null, params.pageNumber)
		return params.pageNumber
	},
	processPageAds: async function(params, callback=null){
		if (params.foldListingsFound !== undefined) params.foldListingsFound += params.sites.length
		if (params.totalListingsFound !== undefined) params.totalListingsFound += params.sites.length

		Helpers.logger.log({
			command: 'procPageNumber', 
			print: params.pageNumber, 
			params: { 
				startTime: params.startTime, 
				foldIndex: params.foldIndex, 
				totalFolds: params.totalFolds, 
				foldPageNumber: params.foldPageNumber,
				foldListingsFound: params.foldListingsFound,
				totalListingsFound: params.totalListingsFound
			}, 
			channels: params.jobId+'command'
		})
		params.newAdsFound = false
		const sites = cloneDeep(params.sites)
		await eachOfLimit(sites, 2, module.exports.processSingleAd.bind(null, params))
		Helpers.logger.log({
			command: 'donePageNumber', 
			params: { 
				refresh: params.newAdsFound, 
				startTime: params.startTime,
				foldIndex: params.foldIndex,
				totalFolds: params.totalFolds,
				foldPageNumber: params.foldPageNumber,
				foldListingsFound: params.foldListingsFound,
				totalListingsFound: params.totalListingsFound
			}, 
			print: params.pageNumber, 
			channels: params.jobId+'command'
		})
		if(callback)
			callback(null,true)
		return params.newAdsFound
	},
	processSingleAd: async function(params, site, index){
		while(true)//retry while not succeeded
		{
			let url = 'https://www.kijiji.ca'+site
			try{
		    	let doc = await params.db.get('ads').findOneAndUpdate({'url': url},{$set: {['jobs.'+params.jobId]: {fingerprint:params.fingerprint}}})

		    	if (doc){
		    		Helpers.logger.log({print:'Loading ad from cache: '+url, channels:params.jobId+'jobUpdate'})
			    	return
			    }
			}catch(e){console.log(e);}
			await Helpers.common.sleep(requestDelay*((index+1)%5));

			try{
				let html = await fetchPage(url, params)

				if(html.includes("Security Violation"))
					throw('violation error detected')

				let $ = cheerio.load(html, {normalizeWhitespace: true});
				let title  = $('div[class*="itemTitleWrapper"] h1[class*="title"]').text(),
				 	price     = $('[class^="currentPrice"]').text(),
				 	categories ='',
				 	breadcrumbs
				title = title.replace(/\"/g,'').replace(/\\/g,'').replace(/(\r\n|\n|\r)/gm,"").replace(/    /g,'')

				if (!title)
					return
		    	params.newAdsFound = true
				Helpers.logger.log({print:title, channels:params.jobId+'jobUpdate'})
				const datetime     = $('time').attr('datetime'),
					  lat  = $('meta[property="og:latitude"]').attr('content')*1,
					  lon = $('meta[property="og:longitude"]').attr('content')*1,
					  description = $("div[class*='descriptionContainer']").text().slice(11)

				categories = $("li[class*='crumbItem']").contents().map(function() {return $(this).text()}).get()
				const kijijiId = $("li[class*='crumbItem']").text()
				price = Number(price.replace(/\"/g,'').replace(/[^0-9\.]+/g,""))

			    params.db.get('ads').insert({
					kijijiId, price, lat, lon, url, title, categories,description,
					'datetime': new Date(datetime),
					'pageUrl': params.pageUrl,
					'jobs': {[params.jobId]:{fingerprint: params.fingerprint}}
			    }, function (err, doc) {
			        if (err)
						Helpers.logger.log({print: `Error adding ad to DB: `+ err, channels:params.jobId+'jobWarning'})
			    })
			    return
			}
			catch(e){
				Helpers.logger.log({print: `Retrying to process page ads in ${requestErrorDelay/1000}s ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay);
			}
		}
	}
}
