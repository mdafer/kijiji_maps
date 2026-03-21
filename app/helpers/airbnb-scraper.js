const Helpers = require('../helpers/includes'),
	requestDelay = 2000,
	requestErrorDelay = 30000,
	cloneDeep = require('lodash.clonedeep'),
	axios = require('axios'),
	eachOfLimit = require('async/eachOfLimit'),
	AIRBNB_API_KEY = 'd306zoyjsyarp7ifhu67rjxn52tv0t20',
	requestConfig = {
	    headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Connection': 'keep-alive',
			'Accept-Encoding': 'gzip, deflate',
			'Accept': 'application/json',
			'Accept-Language': 'en-US,en;q=0.9'
		}
	}

/**
 * Convert an Airbnb search page URL into API query parameters
 */
function buildApiParams(pageUrl) {
	const urlObj = new URL(pageUrl)
	const params = new URLSearchParams()

	params.set('_format', 'for_explore_search_web')
	params.set('key', AIRBNB_API_KEY)
	params.set('items_per_grid', '50')

	// Map known search URL params to API params
	const directParams = [
		'checkin', 'checkout', 'adults', 'infants', 'children',
		'ne_lat', 'ne_lng', 'sw_lat', 'sw_lng',
		'search_by_map', 'zoom', 'zoom_level',
		'query', 'place_id', 'search_type',
		'price_min', 'price_max',
		'room_types[]', 'property_type_id[]',
		'min_bedrooms', 'min_beds', 'min_bathrooms',
		'refinement_paths[]'
	]

	for (const key of directParams) {
		const vals = urlObj.searchParams.getAll(key)
		vals.forEach(v => params.append(key, v))
	}

	// Handle amenities
	const amenities = urlObj.searchParams.getAll('amenities[]')
	amenities.forEach(v => params.append('amenities[]', v))

	// Fallback zoom from URL if not already set
	if (!params.get('zoom') && urlObj.searchParams.get('zoom_level')) {
		params.set('zoom', urlObj.searchParams.get('zoom_level'))
	}

	return params
}

/**
 * Extract listing objects from the explore_tabs API response
 */
function extractListingsFromApiResponse(data) {
	const listings = []
	const seenIds = new Set()

	try {
		const tabs = data.explore_tabs || []
		for (const tab of tabs) {
			const sections = tab.sections || []
			for (const section of sections) {
				const sectionListings = section.listings || []
				for (const item of sectionListings) {
					const listing = item.listing
					const pricing = item.pricing_quote || item.pricingQuote || {}

					if (!listing || !listing.id) continue
					if (seenIds.has(listing.id)) continue
					seenIds.add(listing.id)

					listings.push({
						id: listing.id,
						title: listing.name || listing.title || '',
						lat: listing.lat || (listing.coordinate && listing.coordinate.latitude) || 0,
						lon: listing.lng || (listing.coordinate && listing.coordinate.longitude) || 0,
						price: extractPrice(pricing),
						url: '/rooms/' + listing.id
					})
				}
			}
		}
	} catch(e) {
		// If structure doesn't match, try recursive search as fallback
		if (!listings.length) {
			findNestedListings(data, listings, new Set())
		}
	}

	return listings
}

function findNestedListings(obj, results = [], seenIds = new Set()) {
	if (!obj || typeof obj !== 'object') return results

	if (obj.listing && obj.listing.id && obj.listing.lat !== undefined) {
		if (!seenIds.has(obj.listing.id)) {
			seenIds.add(obj.listing.id)
			results.push({
				id: obj.listing.id,
				title: obj.listing.name || obj.listing.title || '',
				lat: obj.listing.lat,
				lon: obj.listing.lng,
				price: extractPrice(obj.pricing_quote || obj.pricingQuote || obj.pricing),
				url: '/rooms/' + obj.listing.id
			})
		}
		return results
	}

	if (Array.isArray(obj)) {
		obj.forEach(item => findNestedListings(item, results, seenIds))
	} else {
		Object.values(obj).forEach(val => findNestedListings(val, results, seenIds))
	}

	return results
}

function extractPrice(pricing) {
	if (!pricing) return 0
	try {
		if (pricing.rate && pricing.rate.amount) return pricing.rate.amount
		if (pricing.price) return parseFloat(String(pricing.price).replace(/[^0-9.]/g, '')) || 0
		if (pricing.structured_stay_display_price) {
			const primary = pricing.structured_stay_display_price.primary_line
			if (primary && primary.price) return parseFloat(String(primary.price).replace(/[^0-9.]/g, '')) || 0
		}
		if (pricing.structuredStayDisplayPrice) {
			const priceStr = pricing.structuredStayDisplayPrice.primaryLine &&
				pricing.structuredStayDisplayPrice.primaryLine.price
			if (priceStr) return parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0
		}
		const priceStr = JSON.stringify(pricing)
		const match = priceStr.match(/"amount[^"]*":\s*(\d+\.?\d*)/)
		if (match) return parseFloat(match[1])
	} catch(e) {}
	return 0
}

module.exports = {
	processPage: async function (params, callback=null){
		Helpers.logger.log({print: 'Processing Airbnb listings for: '+params.jobName, channels:params.jobId+'jobUpdate'})
		if (!params.pageUrl || params.pageUrl == "")
			return
		params.index_site = 0
		let jobStatusCode = 2
		params.fingerprint = Math.floor(Math.random() * (99999999999999 - 1 + 1) ) + 1
		let offset = 0
		const itemsPerPage = 50
		let hasMore = true

		while(params.pageUrl && hasMore){
			try{
				params.pageNumber++
				let user = await params.db.get('users').findOne({'jobs.id':params.jobId})
				if(user)
					jobStatusCode = user.jobs.find(job => { return job.id == params.jobId}).statusCode
				if(!user || !jobStatusCode || jobStatusCode<2)
				{
					if(callback)
						callback(`Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`,false)
					Helpers.logger.log({print: `Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`, channels:params.jobId+'jobUpdate'})
					return
				}

				// Build API URL from the search page URL
				const apiParams = buildApiParams(params.pageUrl)
				if (offset > 0) {
					apiParams.set('items_offset', String(offset))
				}
				const apiUrl = 'https://www.airbnb.com/api/v2/explore_tabs?' + apiParams.toString()

				Helpers.logger.log({print: `Fetching Airbnb API (offset: ${offset})`, channels:params.jobId+'jobUpdate'})
				let resp = await axios.get(apiUrl, requestConfig)

				let listings = []
				let paginationMeta = null

				if (resp.data && typeof resp.data === 'object') {
					listings = extractListingsFromApiResponse(resp.data)
					// Extract pagination info
					try {
						const tabs = resp.data.explore_tabs || []
						if (tabs.length) {
							paginationMeta = tabs[0].pagination_metadata
						}
					} catch(e) {}
				}

				if (!listings.length) {
					Helpers.logger.log({print: `No listings found (offset: ${offset}). Scraping complete.`, channels:params.jobId+'jobUpdate'})
					hasMore = false
					break
				}

				Helpers.logger.log({print: `Found ${listings.length} listings on page ${params.pageNumber}`, channels:params.jobId+'jobUpdate'})

				await module.exports.processPageListings(params, listings)

				// Check pagination
				if (paginationMeta && paginationMeta.has_next_page) {
					offset += itemsPerPage
				} else if (listings.length >= itemsPerPage) {
					// API might not report has_next_page correctly, try next offset anyway
					offset += itemsPerPage
				} else {
					hasMore = false
				}

				await Helpers.common.sleep(requestDelay)
			}
			catch(e){
				params.pageNumber--
				Helpers.logger.log({print: `Retrying Airbnb page in ${requestErrorDelay/1000}s: ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay)
			}
		}

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

		Helpers.logger.log({ command:'doneProc', print: params.pageNumber, channels:params.jobId+'command'})
		if(callback)
			callback(null, params.pageNumber)
		return params.pageNumber
	},

	processPageListings: async function(params, listings, callback=null){
		Helpers.logger.log({command: 'procPageNumber', print:params.pageNumber, channels:params.jobId+'command'})
		params.newAdsFound = false
		await eachOfLimit(listings, 2, module.exports.processSingleListing.bind(null, params))
		Helpers.logger.log({command: 'donePageNumber', params:{refresh:params.newAdsFound},print:params.pageNumber, channels:params.jobId+'command'})
		if(callback)
			callback(null,true)
		return params.newAdsFound
	},

	processSingleListing: async function(params, listing, index){
		while(true)
		{
			let url = 'https://www.airbnb.com/rooms/' + listing.id
			try{
		    	let doc = await params.db.get('ads').findOneAndUpdate({'url': url},{$set: {['jobs.'+params.jobId]: {fingerprint:params.fingerprint}}})
		    	if (doc){
		    		Helpers.logger.log({print:'Loading listing from cache: '+url, channels:params.jobId+'jobUpdate'})
			    	return
			    }
			}catch(e){console.log(e);}

			try{
				let title = listing.title || ''
				let price = listing.price || 0
				let lat = listing.lat || 0
				let lon = listing.lon || 0

				if (!title) return

				title = title.replace(/\"/g,'').replace(/\\/g,'').replace(/(\r\n|\n|\r)/gm,"").replace(/    /g,'')
		    	params.newAdsFound = true
				Helpers.logger.log({print: title, channels:params.jobId+'jobUpdate'})

			    params.db.get('ads').insert({
					airbnbId: String(listing.id),
					price, lat, lon, url, title,
					categories: [],
					description: listing.title || '',
					'datetime': new Date(),
					'pageUrl': params.pageUrl,
					'platform': 'airbnb',
					'jobs': {[params.jobId]:{fingerprint: params.fingerprint}}
			    }, function (err, doc) {
			        if (err)
						Helpers.logger.log({print: `Error adding listing to DB: `+ err, channels:params.jobId+'jobWarning'})
			    })
			    return
			}
			catch(e){
				Helpers.logger.log({print: `Retrying Airbnb listing in ${requestErrorDelay/1000}s: ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay)
			}
		}
	}
}
