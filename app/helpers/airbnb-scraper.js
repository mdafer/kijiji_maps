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

					const amenities = listing.preview_amenities || listing.amenities || listing.preview_amenity_names
						|| item.preview_amenities || item.amenities || []

					listings.push({
						id: listing.id,
						title: listing.name || listing.title || '',
						lat: listing.lat || (listing.coordinate && listing.coordinate.latitude) || 0,
						lon: listing.lng || (listing.coordinate && listing.coordinate.longitude) || 0,
						price: extractPrice(pricing),
						url: '/rooms/' + listing.id,
						picture_url: listing.picture_url || listing.xl_picture_url || listing.picture || '',
						picture_urls: extractPictureUrls(listing),
						bedrooms: listing.bedrooms || 0,
						bathrooms: listing.bathrooms || 0,
						beds: listing.beds || 0,
						person_capacity: listing.person_capacity || 0,
						amenities
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
				url: '/rooms/' + obj.listing.id,
				picture_url: obj.listing.picture_url || obj.listing.xl_picture_url || obj.listing.picture || '',
				picture_urls: extractPictureUrls(obj.listing),
				bedrooms: obj.listing.bedrooms || 0,
				bathrooms: obj.listing.bathrooms || 0,
				beds: obj.listing.beds || 0,
				person_capacity: obj.listing.person_capacity || 0,
				amenities: obj.listing.preview_amenities || obj.listing.amenities || obj.listing.preview_amenity_names || []
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

function extractPictureUrls(listing) {
	if (!listing) return []
	// Try various known fields for photo arrays
	if (listing.picture_urls && listing.picture_urls.length) return listing.picture_urls
	if (listing.photos && listing.photos.length) {
		return listing.photos.map(p => p.picture || p.large || p.medium || p.small || p.xl_picture || '').filter(Boolean)
	}
	if (listing.images && listing.images.length) {
		return listing.images.map(p => p.url || p.picture || '').filter(Boolean)
	}
	// Fallback: return the single picture if available
	const single = listing.picture_url || listing.xl_picture_url || listing.picture || ''
	return single ? [single] : []
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

/**
 * Fetch full details (photos, amenities) for a single listing via the Airbnb API
 * and update the DB record. Returns the updated fields.
 */
/**
 * Fetch listing details by scraping the listing page HTML and parsing
 * the embedded data-deferred-state JSON (niobeClientData).
 * The old v2 API (api/v2/listings/) is dead.
 */
async function fetchListingDetails(listingId, bookingParams) {
	const qp = new URLSearchParams()
	if (bookingParams) {
		for (const [k, v] of Object.entries(bookingParams)) {
			if (v) qp.set(k, v)
		}
	}
	const qs = qp.toString()
	const url = 'https://www.airbnb.com/rooms/' + listingId + (qs ? '?' + qs : '')

	const resp = await axios.get(url, {
		...requestConfig,
		maxRedirects: 5,
		timeout: 15000
	})

	const html = typeof resp.data === 'string' ? resp.data : ''
	if (!html) return null

	// Extract the data-deferred-state-0 script tag content
	const match = html.match(/<script\s+id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/)
	if (!match) return null

	const deferred = JSON.parse(match[1])
	const niobe = deferred.niobeClientData
	if (!niobe || !niobe.length) return null

	// Find the StaysPdpSections entry
	const pdpEntry = niobe.find(entry => Array.isArray(entry) && typeof entry[0] === 'string' && entry[0].startsWith('StaysPdpSections'))
	if (!pdpEntry) return null

	const sections = pdpEntry[1]
		&& pdpEntry[1].data
		&& pdpEntry[1].data.presentation
		&& pdpEntry[1].data.presentation.stayProductDetailPage
		&& pdpEntry[1].data.presentation.stayProductDetailPage.sections
		&& pdpEntry[1].data.presentation.stayProductDetailPage.sections.sections
	if (!sections || !sections.length) return null

	const photos = []
	const amenityNames = []
	const amenityIdMap = {}

	for (const s of sections) {
		const sid = s.sectionId || ''

		// Extract photos from PHOTO_TOUR (full set) or HERO (preview set)
		if (sid === 'PHOTO_TOUR_SCROLLABLE_MODAL' && !photos.length) {
			const items = (s.section && s.section.mediaItems) || []
			items.forEach(img => {
				if (img.baseUrl) photos.push(img.baseUrl)
			})
		}
		if (sid === 'HERO_DEFAULT' && !photos.length) {
			const items = (s.section && s.section.previewImages) || []
			items.forEach(img => {
				if (img.baseUrl) photos.push(img.baseUrl)
			})
		}

		// Extract amenities
		if (sid === 'AMENITIES_DEFAULT') {
			const groups = (s.section && s.section.seeAllAmenitiesGroups) || (s.section && s.section.previewAmenitiesGroups) || []
			groups.forEach(grp => {
				(grp.amenities || []).forEach(a => {
					if (a.available !== false && a.title) {
						amenityNames.push(a.title)
						if (a.id) amenityIdMap[a.title] = a.id
					}
				})
			})
		}
	}

	return {
		picture_urls: photos,
		amenities: amenityNames,
		amenityIdMap
	}
}

/**
 * Scrape a single price range. Returns total listing count found.
 * Does NOT handle cleanup or job status — caller handles that.
 */
async function scrapeRange(params, priceMin, priceMax) {
	const maxResults = Number(process.env.AIRBNB_MAX_RESULTS) || 270
	const rangeLabel = priceMax != null ? `$${priceMin}-$${priceMax}` : `$${priceMin}+`
	Helpers.logger.log({print: `Scraping price range: ${rangeLabel}`, channels:params.jobId+'jobUpdate'})

	let offset = 0
	let hasMore = true
	let totalFound = 0

	while (params.pageUrl && hasMore) {
		try {
			params.pageNumber++
			let user = await params.db.get('users').findOne({'jobs.id': params.jobId})
			let jobStatusCode = user ? user.jobs.find(job => job.id == params.jobId).statusCode : 0
			if (!user || !jobStatusCode || jobStatusCode < 2) {
				Helpers.logger.log({print: `Job ${params.jobId} ${params.jobName} statusCode changed abruptly or job not found`, channels:params.jobId+'jobUpdate'})
				return -1 // signal abort
			}

			const apiParams = buildApiParams(params.pageUrl)
			// Override price range for this sub-range
			apiParams.set('price_min', String(priceMin))
			if (priceMax != null) apiParams.set('price_max', String(priceMax))
			else apiParams.delete('price_max')
			if (offset > 0) apiParams.set('items_offset', String(offset))
			const apiUrl = 'https://www.airbnb.com/api/v2/explore_tabs?' + apiParams.toString()

			Helpers.logger.log({print: `[${rangeLabel}] Fetching Airbnb API (offset: ${offset}) - ${apiUrl}`, channels:params.jobId+'jobUpdate'})
			let resp = await axios.get(apiUrl, requestConfig)

			let listings = []
			let paginationMeta = null
			if (resp.data && typeof resp.data === 'object') {
				listings = extractListingsFromApiResponse(resp.data)
				try {
					const tabs = resp.data.explore_tabs || []
					if (tabs.length) paginationMeta = tabs[0].pagination_metadata
				} catch(e) {}
			}

			if (!listings.length) {
				Helpers.logger.log({print: `[${rangeLabel}] No listings found (offset: ${offset}). Range complete.`, channels:params.jobId+'jobUpdate'})
				hasMore = false
				break
			}

			totalFound += listings.length
			Helpers.logger.log({print: `[${rangeLabel}] Found ${listings.length} listings on page ${params.pageNumber} (${totalFound} total in range)`, channels:params.jobId+'jobUpdate'})

			await module.exports.processPageListings(params, listings)

			if (paginationMeta && paginationMeta.has_next_page === false) {
				hasMore = false
			} else {
				offset += listings.length
			}

			await Helpers.common.sleep(requestDelay)
		} catch(e) {
			params.pageNumber--
			Helpers.logger.log({print: `[${rangeLabel}] Retrying Airbnb page in ${requestErrorDelay/1000}s: ${e}`, channels:params.jobId+'jobWarning'})
			await Helpers.common.sleep(requestErrorDelay)
		}
	}

	Helpers.logger.log({print: `[${rangeLabel}] Range complete: ${totalFound} listings found`, channels:params.jobId+'jobUpdate'})

	// If we hit the max, split this range in half and recurse
	if (totalFound >= maxResults && priceMax != null && priceMax - priceMin > 1) {
		const mid = Math.floor((priceMin + priceMax) / 2)
		Helpers.logger.log({print: `[${rangeLabel}] Hit max results (${maxResults}), splitting into $${priceMin}-$${mid} and $${mid}-$${priceMax}`, channels:params.jobId+'jobUpdate'})
		const countLow = await scrapeRange(params, priceMin, mid)
		if (countLow === -1) return -1
		const countHigh = await scrapeRange(params, mid, priceMax)
		if (countHigh === -1) return -1
		return totalFound + countLow + countHigh
	}

	return totalFound
}

module.exports = {
	processPage: async function (params, callback=null){
		Helpers.logger.log({print: 'Processing Airbnb listings for: '+params.jobName, channels:params.jobId+'jobUpdate'})
		if (!params.pageUrl || params.pageUrl == "")
			return
		params.index_site = 0
		params.fingerprint = Math.floor(Math.random() * (99999999999999 - 1 + 1) ) + 1

		// Extract booking params from search URL and remap to listing page format
		try {
			const searchUrl = new URL(params.pageUrl)
			params.bookingParams = {}
			const paramMap = {
				checkin: 'check_in',
				checkout: 'check_out',
				adults: 'adults',
				children: 'children',
				infants: 'infants',
				pets: 'pets'
			}
			for (const [searchKey, listingKey] of Object.entries(paramMap)) {
				const val = searchUrl.searchParams.get(searchKey)
				if (val) params.bookingParams[listingKey] = val
			}
		} catch(e) {
			params.bookingParams = {}
		}

		// Extract the user's original price range from the search URL
		let origPriceMin = 0
		let origPriceMax = null
		try {
			const searchUrl = new URL(params.pageUrl)
			if (searchUrl.searchParams.get('price_min')) origPriceMin = Number(searchUrl.searchParams.get('price_min'))
			if (searchUrl.searchParams.get('price_max')) origPriceMax = Number(searchUrl.searchParams.get('price_max'))
		} catch(e) {}

		// If no max price set, use a large default so we can still split
		if (origPriceMax == null) origPriceMax = 50000

		await scrapeRange(params, origPriceMin, origPriceMax)

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
			// Append booking params (checkin, checkout, guests) to the listing URL
			const bp = params.bookingParams || {}
			if (Object.keys(bp).length) {
				const qp = new URLSearchParams(bp)
				url += '?' + qp.toString()
			}
			try{
		    	let doc = await params.db.get('ads').findOneAndUpdate({'airbnbId': String(listing.id), ['jobs.'+params.jobId]: {$exists: true}},{$set: {['jobs.'+params.jobId]: {fingerprint:params.fingerprint}, url}})
		    	if (doc){
		    		// If cached listing is missing amenities/photos, fetch them now
		    		if ((!doc.amenities || !doc.amenities.length) || (!doc.picture_urls || doc.picture_urls.length <= 1)) {
		    			try {
		    				const details = await fetchListingDetails(listing.id, params.bookingParams)
		    				if (details) {
		    					const update = {}
		    					if (details.amenities.length) update.amenities = details.amenities
		    					if (details.picture_urls.length > 1) update.picture_urls = details.picture_urls
		    					if (details.amenityIdMap && Object.keys(details.amenityIdMap).length) update.amenityIdMap = details.amenityIdMap
		    					if (Object.keys(update).length) {
		    						await params.db.get('ads').update({'airbnbId': String(listing.id)}, {$set: update})
		    						Helpers.logger.log({print: `Updated details for cached listing: ${listing.id}`, channels:params.jobId+'jobUpdate'})
		    					}
		    				}
		    			} catch(e) {
		    				Helpers.logger.log({print: `Could not update cached listing ${listing.id}: ${e.message}`, channels:params.jobId+'jobWarning'})
		    			}
		    			await Helpers.common.sleep(requestDelay)
		    		}
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

				// Fetch full details (photos + amenities) from listing page
				let fullPhotos = listing.picture_urls || []
				let fullAmenities = listing.amenities || []
				let fullAmenityIdMap = {}
				try {
					const details = await fetchListingDetails(listing.id, params.bookingParams)
					if (details) {
						if (details.picture_urls.length) fullPhotos = details.picture_urls
						if (details.amenities.length) fullAmenities = details.amenities
						if (details.amenityIdMap) fullAmenityIdMap = details.amenityIdMap
					}
				} catch(detailErr) {
					Helpers.logger.log({print: `Could not fetch details for ${listing.id}: ${detailErr.message}`, channels:params.jobId+'jobWarning'})
				}

			    params.db.get('ads').insert({
					airbnbId: String(listing.id),
					price, lat, lon, url, title,
					categories: [],
					description: listing.title || '',
					picture_url: listing.picture_url || '',
					picture_urls: fullPhotos,
					bedrooms: listing.bedrooms || 0,
					bathrooms: listing.bathrooms || 0,
					beds: listing.beds || 0,
					person_capacity: listing.person_capacity || 0,
					amenities: fullAmenities,
					amenityIdMap: fullAmenityIdMap,
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
