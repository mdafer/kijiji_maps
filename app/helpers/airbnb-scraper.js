function sanitizeKeys(obj) {
	if(!obj || typeof obj !== 'object') return obj
	const result = {}
	for(const key of Object.keys(obj)) {
		const safeKey = key.replace(/\./g, '\u2024').replace(/\$/g, '\uFF04')
		result[safeKey] = obj[key]
	}
	return result
}

const Helpers = require('../helpers/includes'),
	eachOfLimit = require('async/eachOfLimit'),
	axios = require('axios'),
	{ fetchPage, seedCookies } = require('../helpers/browser'),
	AIRBNB_API_KEY = 'd306zoyjsyarp7ifhu67rjxn52tv0t20',
	AIRBNB_AVAILABILITY_HASH = 'b23335819df0dc391a338d665e2ee2f5d3bff19181d05c0b39bc6c5aac403914'

const detailDelay = () => Number(process.env.AIRBNB_DETAIL_DELAY_MS) || 1000
const requestErrorDelay = () => Number(process.env.AIRBNB_ERROR_DELAY_MS) || 60000
// Minimum bbox dimension (in degrees) before we stop subdividing (~110m)
const MIN_BBOX_SPAN = 0.001

/**
 * Split a bounding box into 4 quadrants (NW, NE, SW, SE).
 * Each quadrant is { ne_lat, ne_lng, sw_lat, sw_lng }.
 */
function splitBbox(bbox) {
	const midLat = (bbox.ne_lat + bbox.sw_lat) / 2
	const midLng = (bbox.ne_lng + bbox.sw_lng) / 2
	const quads = [
		{ ne_lat: bbox.ne_lat, ne_lng: midLng,    sw_lat: midLat,    sw_lng: bbox.sw_lng }, // NW
		{ ne_lat: bbox.ne_lat, ne_lng: bbox.ne_lng, sw_lat: midLat,    sw_lng: midLng },     // NE
		{ ne_lat: midLat,    ne_lng: midLng,    sw_lat: bbox.sw_lat, sw_lng: bbox.sw_lng }, // SW
		{ ne_lat: midLat,    ne_lng: bbox.ne_lng, sw_lat: bbox.sw_lat, sw_lng: midLng },     // SE
	]
	// Propagate original zoom calibration to children
	if (bbox._origZoom !== undefined) {
		quads.forEach(q => { q._origZoom = bbox._origZoom; q._origLngSpan = bbox._origLngSpan })
	}
	return quads
}

/**
 * Extract bounding box from a search URL, if present.
 */
function extractBbox(pageUrl) {
	try {
		const u = new URL(pageUrl)
		const ne_lat = parseFloat(u.searchParams.get('ne_lat'))
		const ne_lng = parseFloat(u.searchParams.get('ne_lng'))
		const sw_lat = parseFloat(u.searchParams.get('sw_lat'))
		const sw_lng = parseFloat(u.searchParams.get('sw_lng'))
		if ([ne_lat, ne_lng, sw_lat, sw_lng].every(v => !isNaN(v))) {
			const bbox = { ne_lat, ne_lng, sw_lat, sw_lng }
			// Capture original zoom and lng span so subdivided cells can scale zoom proportionally
			const zoom = parseFloat(u.searchParams.get('zoom') || u.searchParams.get('zoom_level'))
			if (!isNaN(zoom)) {
				bbox._origZoom = zoom
				bbox._origLngSpan = Math.abs(ne_lng - sw_lng)
			}
			return bbox
		}
	} catch(e) {}
	return null
}

async function airbnbGet(url) {
	const { status, html } = await fetchPage(url)
	if (status >= 400) throw new Error(`Airbnb API returned ${status}`)
	// Chromium wraps JSON responses in HTML — extract the text content
	const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/) || html.match(/<body[^>]*>([\s\S]*?)<\/body>/)
	const text = match ? match[1].replace(/<[^>]+>/g, '') : html.replace(/<[^>]+>/g, '')
	try { return JSON.parse(text) } catch(e) { return text }
}

async function browserNavigate(url) {
	const resp = await axios.get(url, {
		headers: {
			'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'accept-language': 'en-US,en;q=0.9',
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
		},
		timeout: 15000,
	})
	return typeof resp.data === 'string' ? resp.data : ''
}

function jitteredDelay(base) {
	// Add ±25% jitter to avoid predictable request intervals
	const jitter = base * 0.25
	return Math.round(base + (Math.random() * jitter * 2 - jitter))
}

/**
 * Human-like random delay between page fetches.
 * Varies widely to avoid pattern detection: base ± 50%, with occasional
 * longer pauses (simulating a user reading results before clicking next).
 */
function humanDelay() {
	const base = Number(process.env.AIRBNB_REQUEST_DELAY_MS) || 3500
	// 20% chance of a longer "reading" pause (2x-4x base)
	if (Math.random() < 0.2) {
		return Math.round(base * (2 + Math.random() * 2))
	}
	// Normal: base ± 50%
	return Math.round(base * (0.5 + Math.random()))
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

					const listingId = listing.id_str || String(listing.id)
					if (!listing || !listingId) continue
					if (seenIds.has(listingId)) continue
					seenIds.add(listingId)

					const amenities = listing.preview_amenities || listing.amenities || listing.preview_amenity_names
						|| item.preview_amenities || item.amenities || []

					listings.push({
						id: listingId,
						title: listing.name || listing.title || '',
						lat: listing.lat || (listing.coordinate && listing.coordinate.latitude) || 0,
						lon: listing.lng || (listing.coordinate && listing.coordinate.longitude) || 0,
						price: extractPrice(pricing),
						url: '/rooms/' + listingId,
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

	if (obj.listing && (obj.listing.id_str || obj.listing.id) && obj.listing.lat !== undefined) {
		const listingId = obj.listing.id_str || String(obj.listing.id)
		if (!seenIds.has(listingId)) {
			seenIds.add(listingId)
			results.push({
				id: listingId,
				title: obj.listing.name || obj.listing.title || '',
				lat: obj.listing.lat,
				lon: obj.listing.lng,
				price: extractPrice(obj.pricing_quote || obj.pricingQuote || obj.pricing),
				url: '/rooms/' + listingId,
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

	const html = await browserNavigate(url)
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
	const photoCategories = {}
	const amenityNames = []
	const amenityIdMap = {}

	for (const s of sections) {
		const sid = s.sectionId || ''

		// Extract photos from PHOTO_TOUR (full set) or HERO (preview set)
		if (sid === 'PHOTO_TOUR_SCROLLABLE_MODAL' && !photos.length) {
			const items = (s.section && s.section.mediaItems) || []
			items.forEach(img => {
				if (img.baseUrl) {
					photos.push(img.baseUrl)
					const rawCat = img.caption || img.accessibilityLabel || img.roomInfo || ''
					if (rawCat) {
						// Normalize: "Bedroom 1 image 3" -> "Bedroom 1", "Photo 2 of Kitchen" -> "Kitchen"
						const cat = rawCat
							.replace(/\s*(image|photo|picture|img|pic)\s*\d+\s*$/i, '')
							.replace(/^\s*(image|photo|picture|img|pic)\s*\d+\s*[-–—:.]?\s*(of\s+)?/i, '')
							.trim()
						const key = cat || rawCat
						if (!photoCategories[key]) photoCategories[key] = []
						photoCategories[key].push(img.baseUrl)
					}
				}
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
		photo_categories: Object.keys(photoCategories).length ? sanitizeKeys(photoCategories) : null,
		amenities: amenityNames,
		amenityIdMap: sanitizeKeys(amenityIdMap)
	}
}

/**
 * Fetch availability calendar for a listing for the next 12 months.
 */
async function fetchListingAvailability(listingId) {
	const now = new Date()
	const month = now.getUTCMonth() + 1
	const year = now.getUTCFullYear()

	const variables = {
		request: {
			count: 12,
			listingId: String(listingId),
			month: month,
			year: year,
			returnPropertyLevelCalendarIfApplicable: false
		}
	}

	const extensions = {
		persistedQuery: {
			version: 1,
			sha256Hash: AIRBNB_AVAILABILITY_HASH
		}
	}

	const params = new URLSearchParams()
	params.set('operationName', 'PdpAvailabilityCalendar')
	params.set('locale', 'en')
	params.set('currency', 'USD')
	params.set('variables', JSON.stringify(variables))
	params.set('extensions', JSON.stringify(extensions))

	const url = `https://www.airbnb.com/api/v3/PdpAvailabilityCalendar/${AIRBNB_AVAILABILITY_HASH}?${params.toString()}`

	try {
		const response = await airbnbGet(url)
		if (!response || !response.data) return null

		const calendarMonths = (response.data.merlin && response.data.merlin.pdpAvailabilityCalendar && response.data.merlin.pdpAvailabilityCalendar.calendarMonths) || []
		const availability = {}
		calendarMonths.forEach(m => {
			if (m.days) {
				m.days.forEach(d => {
					availability[d.calendarDate] = {
						available: d.available,
						price: d.price ? d.price.localPriceFormatted : null
					}
				})
			}
		})
		return availability
	} catch(e) {
		Helpers.logger.log({print: `Error fetching availability for ${listingId}: ${e.message}`, channels: 'jobWarning'})
		return null
	}
}

/**
 * Scrape a single price range. Returns total listing count found.
 * Does NOT handle cleanup or job status — caller handles that.
 */
async function scrapeRange(params, priceMin, priceMax, startOffset = 0, bbox = null) {
	const maxResults = Number(process.env.AIRBNB_MAX_RESULTS) || 270
	const rangeLabel = priceMax != null ? `$${priceMin}-$${priceMax}` : `$${priceMin}+`
	if (startOffset > 0) Helpers.logger.log({print: `Resuming price range: ${rangeLabel} from offset ${startOffset}`, channels:params.jobId+'jobUpdate'})
	else Helpers.logger.log({print: `Scraping price range: ${rangeLabel}`, channels:params.jobId+'jobUpdate'})

	let offset = startOffset
	let sectionOffset = 0
	let searchSessionId = null
	let hasMore = true
	let totalFound = 0
	// Track all listing IDs we've seen in this range to detect end-of-results
	// (Airbnb repeats listings instead of returning empty when past the last page)
	const seenListingIds = new Set()

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
			// Override bounding box if a grid cell was provided
			if (bbox) {
				apiParams.set('ne_lat', String(bbox.ne_lat))
				apiParams.set('ne_lng', String(bbox.ne_lng))
				apiParams.set('sw_lat', String(bbox.sw_lat))
				apiParams.set('sw_lng', String(bbox.sw_lng))
				apiParams.set('search_by_map', 'true')
				// Scale zoom relative to the original search URL's zoom and bbox.
				// zoom = origZoom + log2(origLngSpan / cellLngSpan)
				const lngSpan = Math.abs(bbox.ne_lng - bbox.sw_lng) || 0.001
				if (bbox._origZoom && bbox._origLngSpan) {
					const cellZoom = bbox._origZoom + Math.log2(bbox._origLngSpan / lngSpan)
					const zoomStr = String(Math.round(cellZoom * 100) / 100)
					apiParams.set('zoom', zoomStr)
					if (apiParams.has('zoom_level')) apiParams.set('zoom_level', zoomStr)
				}
			}
			if (offset > 0) apiParams.set('items_offset', String(offset))
			// Airbnb requires search_session_id and section_offset from previous
			// responses to maintain pagination state — without these, later pages
			// return empty listing sections (soft-block).
			if (searchSessionId) apiParams.set('search_session_id', searchSessionId)
			if (sectionOffset > 0) apiParams.set('section_offset', String(sectionOffset))
			const apiUrl = 'https://www.airbnb.com/api/v2/explore_tabs?' + apiParams.toString()

			Helpers.logger.log({print: `[${rangeLabel}] Fetching Airbnb API (offset: ${offset}) - ${apiUrl}`, channels:params.jobId+'jobUpdate'})
			const apiData = await airbnbGet(apiUrl)

			if (!apiData || typeof apiData !== 'object' || !apiData.explore_tabs) {
				throw new Error('Invalid Airbnb API response (possibly rate limited or blocked)')
			}

			let listings = []
			let paginationMeta = null
			try {
				listings = extractListingsFromApiResponse(apiData)
				const tabs = apiData.explore_tabs || []
				if (tabs.length) paginationMeta = tabs[0].pagination_metadata
			} catch(e) {}

			if (!listings.length) {
				// Check if the response explicitly says 0 total results — in this case it's not a soft-block
				const totalCount = paginationMeta ? (paginationMeta.total_count || paginationMeta.totalCount) : null
				if (offset === 0 && totalCount === 0) {
					Helpers.logger.log({print: `[${rangeLabel}] Genuinely empty (total_count: 0) — skipping fold`, channels:params.jobId+'jobUpdate'})
					hasMore = false
					break
				}

				// Soft-block: Airbnb returns valid JSON but strips listing sections.
				// Ask user to open URL in browser and paste the response.
				Helpers.logger.log({print: `[${rangeLabel}] Soft-blocked at offset ${offset} — requesting manual response`, channels:params.jobId+'jobWarning'})
				const requestId = Math.random().toString(36).slice(2)
				try {
					const manualJson = await new Promise((resolve, reject) => {
						const timeout = setTimeout(() => {
							Helpers.pendingManualResponses.delete(requestId)
							reject(new Error('Manual response timeout (5 min)'))
						}, 300000)
						Helpers.pendingManualResponses.set(requestId, {
							resolve: (json) => { clearTimeout(timeout); resolve(json) },
							reject: (err) => { clearTimeout(timeout); reject(err) }
						})
						Helpers.io.emit('needManualResponse', { requestId, url: apiUrl, jobId: params.jobId })
					})
					const manualData = JSON.parse(manualJson)
					if (manualData.manualEmpty) {
						Helpers.logger.log({print: `[${rangeLabel}] Manual response confirmed empty search — skipping fold`, channels:params.jobId+'jobUpdate'})
						hasMore = false
						break
					}
					listings = extractListingsFromApiResponse(manualData)
					const tabs = manualData.explore_tabs || []
					if (tabs.length) paginationMeta = tabs[0].pagination_metadata
					if (!listings.length) {
						// If user pasted something but it's still empty, check total_count again
						const manualTotalCount = paginationMeta ? (paginationMeta.total_count || paginationMeta.totalCount || 0) : null
						if (manualTotalCount === 0 && paginationMeta) {
							Helpers.logger.log({print: `[${rangeLabel}] Manual response confirmed empty search`, channels:params.jobId+'jobUpdate'})
							hasMore = false
							break
						}
						throw new Error('Pasted response also contained no listings')
					}
					Helpers.logger.log({print: `[${rangeLabel}] Manual response accepted — ${listings.length} listings extracted`, channels:params.jobId+'jobUpdate'})
				} catch(manualErr) {
					if (manualErr.message === 'manual-break') {
						hasMore = false
						break
					}
					Helpers.logger.log({print: `[${rangeLabel}] Manual response failed/skipped: ${manualErr.message} — retrying after delay`, channels:params.jobId+'jobWarning'})
					params.pageNumber--
					await Helpers.common.sleep(jitteredDelay(requestErrorDelay()))
					continue
				}
			}

			// Reset soft-block counter on success
			softBlockRetries = 0

			// Detect end-of-results: Airbnb repeats listings once past the real last page
			const newListings = listings.filter(l => !seenListingIds.has(l.id))
			if (newListings.length === 0) {
				Helpers.logger.log({print: `[${rangeLabel}] All ${listings.length} listings at offset ${offset} are duplicates — end of results`, channels:params.jobId+'jobUpdate'})
				hasMore = false
				break
			}
			listings.forEach(l => seenListingIds.add(l.id))
			if (newListings.length < listings.length) {
				Helpers.logger.log({print: `[${rangeLabel}] ${listings.length - newListings.length} duplicate listings filtered at offset ${offset}`, channels:params.jobId+'jobUpdate'})
			}

			totalFound += newListings.length
			Helpers.logger.log({print: `[${rangeLabel}] Found ${newListings.length} new listings on page ${params.pageNumber} (${totalFound} total in range)`, channels:params.jobId+'jobUpdate'})

			await module.exports.processPageListings(params, newListings)

			// Capture pagination state for next request
			if (paginationMeta) {
				if (paginationMeta.search_session_id) searchSessionId = paginationMeta.search_session_id
				if (paginationMeta.section_offset != null) sectionOffset = paginationMeta.section_offset
			}

			if (paginationMeta && paginationMeta.has_next_page === false) {
				hasMore = false
			} else if (paginationMeta && paginationMeta.items_offset) {
				// Use Airbnb's own next-page offset instead of calculating it ourselves
				offset = paginationMeta.items_offset
			} else {
				offset += listings.length
			}

			// Save offset so job can resume here on restart
			await params.db.get('users').update({"jobs.id": params.jobId}, {$set: {"jobs.$.resumeOffset": offset}}).catch(() => {})

			// Human-like random delay between pages
			const delay = humanDelay()
			Helpers.logger.log({print: `[${rangeLabel}] Waiting ${(delay/1000).toFixed(1)}s before next page`, channels:params.jobId+'jobUpdate'})
			await Helpers.common.sleep(delay)
		} catch(e) {
			params.pageNumber--
			const backoff = jitteredDelay(requestErrorDelay())
			Helpers.logger.log({print: `[${rangeLabel}] Retrying Airbnb page in ${Math.round(backoff/1000)}s: ${e}`, channels:params.jobId+'jobWarning'})
			await Helpers.common.sleep(backoff)
		}
	}

	Helpers.logger.log({print: `[${rangeLabel}] Range complete: ${totalFound} listings found`, channels:params.jobId+'jobUpdate'})

	return totalFound
}

/**
 * Recursively scrape a bounding box by subdividing into quadrants when
 * the result count is saturated (hits maxResults). This ensures dense
 * areas are scraped at higher resolution while sparse areas use a single
 * request. Deduplication by listing ID happens at the DB layer (airbnbId).
 */
async function scrapeGrid(params, priceMin, priceMax, bbox, depth = 0) {
	const maxResults = Number(process.env.AIRBNB_MAX_RESULTS) || 270
	const maxGridDepth = Number(process.env.AIRBNB_MAX_GRID_DEPTH) || 6
	const minGridDepth = params.gridDepth || Number(process.env.AIRBNB_MIN_GRID_DEPTH) || 1
	const bboxLabel = `[${bbox.sw_lat.toFixed(3)},${bbox.sw_lng.toFixed(3)} → ${bbox.ne_lat.toFixed(3)},${bbox.ne_lng.toFixed(3)}]`

	const latSpan = bbox.ne_lat - bbox.sw_lat
	const lngSpan = bbox.ne_lng - bbox.sw_lng

	// Always subdivide until we reach minimum depth, then only if saturated
	const mustSplit = depth < minGridDepth && latSpan > MIN_BBOX_SPAN && lngSpan > MIN_BBOX_SPAN
	const canSplit = depth < maxGridDepth && latSpan > MIN_BBOX_SPAN && lngSpan > MIN_BBOX_SPAN

	if (mustSplit) {
		Helpers.logger.log({print: `Splitting grid cell ${bboxLabel} into 4 quadrants (depth ${depth + 1})`, channels: params.jobId+'jobUpdate'})
		const quadrants = splitBbox(bbox)
		let total = 0
		for (const quad of quadrants) {
			const result = await scrapeGrid(params, priceMin, priceMax, quad, depth + 1)
			if (result === -1) return -1
			total += result
		}
		return total
	}

	Helpers.logger.log({print: `Grid cell ${bboxLabel} (depth ${depth})`, channels: params.jobId+'jobUpdate'})

	const count = await scrapeRange(params, priceMin, priceMax, 0, bbox)
	if (count === -1) return -1 // job aborted

	if (count >= maxResults && canSplit) {
		Helpers.logger.log({print: `Grid cell ${bboxLabel} saturated (${count} >= ${maxResults}), splitting into 4 quadrants (depth ${depth + 1})`, channels: params.jobId+'jobUpdate'})
		const quadrants = splitBbox(bbox)
		let subTotal = 0
		for (const quad of quadrants) {
			const result = await scrapeGrid(params, priceMin, priceMax, quad, depth + 1)
			if (result === -1) return -1
			subTotal += result
		}
		return count + subTotal
	}

	return count
}

module.exports = {
	processPage: async function (params, callback=null){
		Helpers.logger.log({print: 'Processing Airbnb listings for: '+params.jobName, channels:params.jobId+'jobUpdate'})
		if (!params.pageUrl || params.pageUrl == "")
			return
		params.index_site = 0
		params.startTime = Date.now()
		params.totalListingsFound = 0
		const resuming = !!params.fingerprint
		if (!resuming)
			params.fingerprint = Math.floor(Math.random() * (99999999999999 - 1 + 1) ) + 1
		// Persist fingerprint so job can resume after a restart with the same fingerprint (avoids wiping scraped ads)
		const fingerprintUpdate = resuming
			? {"$set": {"jobs.$.fingerprint": params.fingerprint}}
			: {"$set": {"jobs.$.fingerprint": params.fingerprint}, "$unset": {"jobs.$.resumePageUrl": ""}}
		await params.db.get('users').update({"jobs.id":params.jobId}, fingerprintUpdate).catch(() => {})

		// Seed Airbnb cookies from env into the shared browser
		if (process.env.AIRBNB_COOKIES) {
			await seedCookies(process.env.AIRBNB_COOKIES, '.airbnb.com')
		}

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

		// If no max price set, use a large default
		if (origPriceMax == null) origPriceMax = 50000

		// Extract bounding box from URL for grid subdivision
		const origBbox = extractBbox(params.pageUrl)
		if (origBbox) {
			Helpers.logger.log({print: `Bounding box detected — grid subdivision enabled`, channels:params.jobId+'jobUpdate'})
			await scrapeGrid(params, origPriceMin, origPriceMax, origBbox)
		} else {
			await scrapeRange(params, origPriceMin, origPriceMax, params.resumeOffset || 0)
		}

		// Clear resume offset now that the job finished
		await params.db.get('users').update({"jobs.id": params.jobId}, {$unset: {"jobs.$.resumeOffset": ""}}).catch(() => {})

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

	processPageListings: async function(params, listings, callback=null){
			if (params.totalListingsFound !== undefined) params.totalListingsFound += listings.length

		Helpers.logger.log({
			command: 'procPageNumber',
			print: params.pageNumber,
			params: {
				startTime: params.startTime,
				totalListingsFound: params.totalListingsFound
			},
			channels: params.jobId+'command'
		})
		params.newAdsFound = false
		await eachOfLimit(listings, 1, module.exports.processSingleListing.bind(null, params))
		Helpers.logger.log({
			command: 'donePageNumber',
			params: {
				refresh: params.newAdsFound,
				startTime: params.startTime,
				totalListingsFound: params.totalListingsFound
			},
			print: params.pageNumber,
			channels: params.jobId+'command'
		})
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
		    	let doc = await params.db.get('ads').findOneAndUpdate({'airbnbId': String(listing.id)},{$set: {['jobs.'+params.jobId]: {fingerprint:params.fingerprint}, url}})
		    	if (doc){
		    		// Optionally backfill missing details/availability for cached listings
		    		const needsDetails = params.fetchDetails && ((!doc.amenities || !doc.amenities.length) || (!doc.picture_urls || doc.picture_urls.length <= 1))
		    		const needsAvailability = params.fetchAvailability && !doc.availability
		    		if (needsDetails || needsAvailability) {
		    			try {
		    				const update = {}
		    				if (needsDetails) {
		    					const details = await fetchListingDetails(listing.id, params.bookingParams)
		    					if (details) {
		    						if (details.amenities.length) update.amenities = details.amenities
		    						if (details.picture_urls.length > 1) update.picture_urls = details.picture_urls
		    						if (details.amenityIdMap && Object.keys(details.amenityIdMap).length) update.amenityIdMap = details.amenityIdMap
		    						if (details.photo_categories) update.photo_categories = details.photo_categories
		    					}
		    				}
		    				if (needsAvailability) {
		    					const availability = await fetchListingAvailability(listing.id)
		    					if (availability) update.availability = availability
		    				}
		    				if (Object.keys(update).length) {
		    					await params.db.get('ads').update({'airbnbId': String(listing.id)}, {$set: update})
		    					Helpers.logger.log({print: `Updated details for cached listing: ${listing.id}`, channels:params.jobId+'jobUpdate'})
		    				}
		    			} catch(e) {
		    				Helpers.logger.log({print: `Could not update cached listing ${listing.id}: ${e.message}`, channels:params.jobId+'jobWarning'})
		    			}
		    			await Helpers.common.sleep(jitteredDelay(detailDelay()))
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

				// Optionally fetch full details (photos + amenities) from listing page
				let fullPhotos = listing.picture_urls || []
				let fullAmenities = listing.amenities || []
				let fullAmenityIdMap = {}
				let fullPhotoCategories = null
				if (params.fetchDetails) {
					try {
						const details = await fetchListingDetails(listing.id, params.bookingParams)
						if (details) {
							if (details.picture_urls.length) fullPhotos = details.picture_urls
							if (details.amenities.length) fullAmenities = details.amenities
							if (details.amenityIdMap) fullAmenityIdMap = details.amenityIdMap
							if (details.photo_categories) fullPhotoCategories = details.photo_categories
						}
					} catch(detailErr) {
						Helpers.logger.log({print: `Could not fetch details for ${listing.id}: ${detailErr.message}`, channels:params.jobId+'jobWarning'})
					}
				}

				let availability = null
				if (params.fetchAvailability) {
					try {
						availability = await fetchListingAvailability(listing.id)
					} catch(availErr) {
						Helpers.logger.log({print: `Could not fetch availability for ${listing.id}: ${availErr.message}`, channels:params.jobId+'jobWarning'})
					}
				}

			    params.db.get('ads').insert({
					airbnbId: String(listing.id),
					price, lat, lon, url, title,
					categories: [],
					description: listing.title || '',
					picture_url: listing.picture_url || '',
					picture_urls: fullPhotos,
					photo_categories: fullPhotoCategories,
					bedrooms: listing.bedrooms || 0,
					bathrooms: listing.bathrooms || 0,
					beds: listing.beds || 0,
					person_capacity: listing.person_capacity || 0,
					amenities: fullAmenities,
					amenityIdMap: fullAmenityIdMap,
					'datetime': new Date(),
					'pageUrl': params.pageUrl,
					'platform': 'airbnb',
					'availability': availability,
					'jobs': {[params.jobId]:{fingerprint: params.fingerprint}}
			    }, function (err, doc) {
			        if (err)
						Helpers.logger.log({print: `Error adding listing to DB: `+ err, channels:params.jobId+'jobWarning'})
			    })
			    return
			}
			catch(e){
				Helpers.logger.log({print: `Retrying Airbnb listing in ${requestErrorDelay()/1000}s: ${e}`, channels:params.jobId+'jobWarning'})
			    await Helpers.common.sleep(requestErrorDelay())
			}
		}
	}
}
