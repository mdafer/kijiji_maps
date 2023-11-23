const Helpers = require('../helpers/includes'),
	requestDelay = 200,
	requestErrorDelay = 1000,
	cheerio = require('cheerio'),
	axios = require('axios'),
	requestConfig = {
	    method: 'get',
	    headers: {
			'User-Agent': 'Chrome/83.0.4103.97',
			'Connection': 'keep-alive',
			'Accept-Encoding': 'gzip, deflate'
		}
	}

module.exports = {
	processPage: async function (params, callback=null){
		Helpers.logger.log({print: 'Processing new ads for: '+params.jobName, channels:params.jobId+'jobUpdate'})
		if (!params.pageUrl || params.pageUrl == "")
			return
		params.sites=[]
		params.index_site = 0
		let jobStatusCode = 2
		params.fingerprint = Math.floor(Math.random() * (9999999 - 1 + 1) ) + 1 //between 1 and 9999999
		while(params.pageUrl){
			//Helpers.logger.log({print:'processing pageUrl: '+ params.pageUrl, channels:params.jobId+'jobUpdate'});
			try{
				let user = await params.db.get('users').findOne({'jobs.id':params.jobId})
				if(user)
					jobStatusCode = user.jobs.find(job => { return job.id == params.jobId}).statusCode
				if(!user || !jobStatusCode || jobStatusCode<2)
				{
					//Todo: clean ads that may have been processed after the job was deleted
					if(callback)
						callback(`Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`,false)
					Helpers.logger.log({print: `Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`, channels:params.jobId+'jobUpdate'})
					return
				}
				let resp = await axios.get(params.pageUrl, requestConfig)
				if(resp.data.includes("Security Violation"))
					throw('violation error detected')

				if((resp.data.includes("Some search tips") && resp.data.includes("found useful")))
					throw('Kijiji seems to be down, trying again')
				
				params.pageNumber++;
				var $ = cheerio.load(resp.data);

				let urls = [].map.call($('a.title'), function(link) {
					return link;
				});
				Object.keys(urls).forEach(function(trait) {
					params.sites.push(urls[trait].attribs.href);
				});
				const newAdsFound = await module.exports.processPageAds(params)
				/*if(!newAdsFound && params.pageNumber>200)
				{
					Helpers.logger.log({print: `Map seems to be up to date, skipping older pages.`, channels:params.jobId+'jobWarning'})
					break
				}*/
				let url_next = $(".pagination > a[title='Next']").attr('href')
				params.pageUrl = url_next? "https://www.kijiji.ca"+url_next : undefined;
			}
			catch(e){
				Helpers.logger.log({print: `Retrying to process page in ${requestErrorDelay/1000}s ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay);
			}
		}
		try{
			await params.db.get('ads').remove({$and:[{["jobs."+params.jobId]:{ $exists: true}},{['jobs.'+params.jobId+'.fingerprint']: {$ne: params.fingerprint}}]})
			Helpers.logger.log({print: `All expired ads have been removed!`, channels:params.jobId+'jobUpdate'})
			await params.db.get('users').update({"jobs.id":params.jobId},{"$set": {"jobs.$.statusCode":1}})
			.catch((err) => {Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'}); return})//.then(() => db.close())
		}
		catch(e)
		{
			console.log(e)
		}

		Helpers.logger.log({print: `All ads have been refreshed! Pages processed: ${params.pageNumber}`, channels:params.jobId+'jobUpdate'})
		Helpers.logger.log({ command:'doneProc', print: params.pageNumber, channels:params.jobId+'command'})
		if(callback)
			callback(null,true)
	},
	processPageAds: async function(params, callback=null){
		Helpers.logger.log({print: 'Processing new ads in page: '+params.pageNumber, channels:params.jobId+'jobUpdate'})
		Helpers.logger.log({command: 'procPageNumber', print:params.pageNumber, channels:params.jobId+'command'});
		let newAdsFound = false 
		while(params.sites[params.index_site])
		{
			let url = 'https://www.kijiji.ca'+params.sites[params.index_site];
			try{
		    	let doc = await params.db.get('ads').findOneAndUpdate({'url': url},{$set: {['jobs.'+params.jobId]: {fingerprint:params.fingerprint}}})
		    	
		    	if (doc){
		    		//Helpers.logger.log({print:'Loading ad from cache: '+url, channels:params.jobId+'jobUpdate'})
			    	params.index_site++
			    	continue
			    }
			}catch(e){console.log(e)}
			try{
				let resp = await axios.get(url, requestConfig)
			
				if(resp.data.includes("Security Violation"))
					throw('violation error detected')

				params.index_site++;
				let $ = cheerio.load(resp.data, {normalizeWhitespace: true});
				let title  = $('div[class*="itemTitleWrapper"] h1[class*="title"]').text(),
				 	price     = $('[class^="currentPrice"]').text(),
				 	categories ='',
				 	breadcrumbs
				title = title.replace(/\"/g,'').replace(/\\/g,'').replace(/(\r\n|\n|\r)/gm,"").replace(/    /g,'')
				
				if (!title)
					continue
		    	newAdsFound = true
				//Helpers.logger.log({print:title, channels:params.jobId+'jobUpdate'})
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
			            throw err
			    })
			}
			catch(e){
				Helpers.logger.log({print: `Retrying to process page ads in ${requestErrorDelay/1000}s ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay);
			}
		}
		Helpers.logger.log({command: 'donePageNumber', params:{refresh:newAdsFound},print:params.pageNumber, channels:params.jobId+'command'});
		if(callback)
			callback(null,true)
		return newAdsFound
	},
	/*validateJobAds: async function(params, callback=null){
	    let validationCmdInterval = setInterval(function(){ Helpers.logger.log({ command:'validatingAds', print: params.jobName, channels:params.jobId+'command'}) }, 15000);
		let docs
		try{
	    	docs = await params.db.get('ads').find({'jobId': params.jobId})
		}catch(e){
			Helpers.logger.log({print: e, channels:params.jobId+'jobWarning'})
		}
    	if (!docs || Object.keys(docs).length == 0){
    		Helpers.logger.log({print:`Job ${params.jobId} ${params.jobName} has no outdated ads`, channels:params.jobId+'jobUpdate'})
	    	return true
	    }
	    let index = 0
		while(docs.length>index)
		{
			try{
				let user = await params.db.get('users').findOne({'jobs.id':params.jobId})
				if(user)
					jobStatusCode = user.jobs.find(job => { return job.id == params.jobId}).statusCode
				if(!user || !jobStatusCode || jobStatusCode<2)
				{
					clearInterval(validationCmdInterval)
					if(callback)
						callback(`Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`,false)
					Helpers.logger.log({print: `Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`, channels:params.jobId+'jobUpdate'})
					return
				}
				//Helpers.logger.log({print: `Validating ad: ${docs[index].url}`, channels:params.jobId+'jobUpdate'})
				let resp = await axios.get(docs[index].url, requestConfig)
				if(resp.data.includes("Security Violation"))
					throw('violation error detected')

				let $ = cheerio.load(resp.data, {normalizeWhitespace: true});
				let title  = $('h1[class*="title"]').text()
				if (!title)
				{
					Helpers.logger.log({print: docs[index].url, command:'removeUrlMarker', channels:params.jobId+'command'})
				    params.db.get('ads').remove({jobId:params.jobId, url: docs[index].url}, function (err, doc) {
				        if (err)
				            throw err
				    })
				}
				index++;
			}
			catch(e){
				Helpers.logger.log({print: `Retrying to validate ad in ${requestErrorDelay/1000}s ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay);
			}
		}
		if(!params.pageUrl)
		{
			clearInterval(validationCmdInterval)
			Helpers.logger.log({print: `All expired ads have been removed!`, channels:params.jobId+'jobUpdate'})
			Helpers.logger.log({ command:'doneValid', print: '', channels:params.jobId+'command'})
			if(callback)
				callback(null,true)
		}
	}*/
}