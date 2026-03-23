const Helpers = require('../helpers/includes'),
	eachOfLimit = require('async/eachOfLimit'),
	{ seedCookies, getBrowser } = require('../helpers/browser'),
	{ decryptField } = require('../controllers/users')

const requestDelay = () => Number(process.env.FB_REQUEST_DELAY_MS) || 3000
const detailDelay = () => Number(process.env.FB_DETAIL_DELAY_MS) || 1500
const requestErrorDelay = () => Number(process.env.FB_ERROR_DELAY_MS) || 60000
const scrollPauseMs = () => Number(process.env.FB_SCROLL_PAUSE_MS) || 2000

function jitteredDelay(base) {
	const jitter = base * 0.25
	return Math.round(base + (Math.random() * jitter * 2 - jitter))
}

function humanDelay() {
	const base = requestDelay()
	if (Math.random() < 0.2) return Math.round(base * (2 + Math.random() * 2))
	return Math.round(base * (0.5 + Math.random()))
}

/**
 * Log into Facebook using Puppeteer with email/password.
 * Returns true if login succeeded, false otherwise.
 */
async function loginWithCredentials(page, email, password, jobId) {
	try {
		Helpers.logger.log({ print: 'Logging into Facebook...', channels: jobId + 'jobUpdate' })
		await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2', timeout: 30000 })
		await new Promise(r => setTimeout(r, 2000))

		// Accept cookie consent if present
		try {
			const cookieBtn = await page.$('[data-cookiebanner="accept_button"], [data-testid="cookie-policy-manage-dialog-accept-button"]')
			if (cookieBtn) { await cookieBtn.click(); await new Promise(r => setTimeout(r, 1000)) }
		} catch(e) {}

		// Fill in credentials
		await page.waitForSelector('#email', { timeout: 10000 })
		await page.type('#email', email, { delay: 50 + Math.random() * 80 })
		await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
		await page.type('#pass', password, { delay: 50 + Math.random() * 80 })
		await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
		await page.click('[name="login"], #loginbutton, button[type="submit"]')
		await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {})
		await new Promise(r => setTimeout(r, 3000))

		// Check if login succeeded — look for the marketplace link or user menu
		const loggedIn = await page.evaluate(() => {
			return !!document.querySelector('[aria-label="Facebook"], [aria-label="Your profile"], [data-testid="royal_blue_bar"]')
				|| document.cookie.includes('c_user')
				|| !!document.querySelector('a[href*="/marketplace"]')
		})

		if (loggedIn) {
			Helpers.logger.log({ print: 'Facebook login successful', channels: jobId + 'jobUpdate' })
			return true
		}

		// Check for checkpoint/2FA
		const pageText = await page.evaluate(() => document.body.innerText)
		if (/two-factor|confirm your identity|security check|checkpoint/i.test(pageText)) {
			Helpers.logger.log({ print: 'Facebook requires 2FA or security check — please log in manually and provide FB_COOKIES in .env instead', channels: jobId + 'jobWarning' })
			return false
		}

		Helpers.logger.log({ print: 'Facebook login may have failed — continuing anyway', channels: jobId + 'jobWarning' })
		return false
	} catch(e) {
		Helpers.logger.log({ print: 'Facebook login error: ' + e.message, channels: jobId + 'jobWarning' })
		return false
	}
}

/**
 * Scroll a Puppeteer page to the bottom to trigger lazy-loaded listings.
 * Returns the number of new listing elements found after scrolling.
 */
async function autoScroll(page, maxScrolls = 15) {
	let previousCount = 0
	let stableRounds = 0
	for (let i = 0; i < maxScrolls; i++) {
		await page.evaluate(() => window.scrollBy(0, window.innerHeight))
		await new Promise(r => setTimeout(r, scrollPauseMs()))
		const currentCount = await page.$$eval('a[href*="/marketplace/item/"]', els => els.length)
		if (currentCount === previousCount) {
			stableRounds++
			if (stableRounds >= 3) break
		} else {
			stableRounds = 0
		}
		previousCount = currentCount
	}
	return previousCount
}

/**
 * Extract listing card data from the current Marketplace search page.
 * Works with Facebook's rendered DOM (data-testid or href patterns).
 */
async function extractListingsFromPage(page) {
	return page.evaluate(() => {
		const listings = []
		const seen = new Set()
		// Facebook Marketplace listing links contain /marketplace/item/<id>
		const links = document.querySelectorAll('a[href*="/marketplace/item/"]')
		links.forEach(link => {
			const href = link.getAttribute('href') || ''
			const match = href.match(/\/marketplace\/item\/(\d+)/)
			if (!match) return
			const id = match[1]
			if (seen.has(id)) return
			seen.add(id)

			// Try to extract price and title from the card
			const texts = []
			link.querySelectorAll('span').forEach(span => {
				const t = (span.textContent || '').trim()
				if (t) texts.push(t)
			})

			// Price is usually the first monetary value
			let price = 0
			let title = ''
			for (const t of texts) {
				if (!price && /^\$[\d,.]+/.test(t)) {
					price = parseFloat(t.replace(/[^0-9.]/g, '')) || 0
				} else if (!title && t.length > 3 && !/^\$/.test(t)) {
					title = t
				}
			}

			// Try to get image from the card
			const img = link.querySelector('img')
			const picture_url = img ? (img.src || img.getAttribute('data-src') || '') : ''

			listings.push({ id, title, price, picture_url, href })
		})
		return listings
	})
}

/**
 * Visit a single listing detail page and extract full info.
 */
async function fetchListingDetails(listingId) {
	const browser = await getBrowser()
	const page = await browser.newPage()
	try {
		await page.setViewport({ width: 1920, height: 1080 })
		await page.evaluateOnNewDocument(() => {
			Object.defineProperty(navigator, 'webdriver', { get: () => false })
		})
		const url = 'https://www.facebook.com/marketplace/item/' + listingId + '/'
		await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
		// Wait a moment for dynamic content
		await new Promise(r => setTimeout(r, 2000))

		const details = await page.evaluate(() => {
			const result = {
				title: '',
				price: 0,
				description: '',
				location: '',
				lat: 0,
				lon: 0,
				picture_urls: [],
				seller: ''
			}

			// Title — often the first large heading on the page
			const headings = document.querySelectorAll('h1, [role="heading"][aria-level="1"]')
			if (headings.length) result.title = (headings[0].textContent || '').trim()

			// All visible text spans — scan for price, location, description
			const allSpans = document.querySelectorAll('span')
			const spanTexts = []
			allSpans.forEach(s => {
				const t = (s.textContent || '').trim()
				if (t) spanTexts.push(t)
			})

			// Price
			for (const t of spanTexts) {
				if (/^\$[\d,.]+/.test(t) || /^CA\$[\d,.]+/.test(t) || /^C\s?\$[\d,.]+/.test(t)) {
					result.price = parseFloat(t.replace(/[^0-9.]/g, '')) || 0
					break
				}
			}

			// Description — look for the listing description container
			// Facebook typically places description in a div after the price/title area
			const descEls = document.querySelectorAll('[data-testid="marketplace_listing_description"], [class*="description"]')
			if (descEls.length) {
				result.description = (descEls[0].textContent || '').trim()
			} else {
				// Fallback: find the longest text block that isn't the title
				let longest = ''
				allSpans.forEach(s => {
					const t = (s.textContent || '').trim()
					if (t.length > longest.length && t !== result.title && t.length > 30) {
						longest = t
					}
				})
				if (longest) result.description = longest
			}

			// Location text — often contains city name near "Listed in" or similar
			for (const t of spanTexts) {
				if (/listed\s+(in|on)/i.test(t) || /location/i.test(t)) {
					// Next non-trivial span after this is usually the location
					result.location = t.replace(/listed\s+(in|on)\s*/i, '').trim()
					break
				}
			}

			// Images — collect all listing photos
			const imgSet = new Set()
			document.querySelectorAll('img').forEach(img => {
				const src = img.src || ''
				// Filter for Facebook CDN images that are listing photos (not icons/avatars)
				if (src && /scontent/.test(src) && img.naturalWidth > 200) {
					imgSet.add(src)
				}
			})
			result.picture_urls = Array.from(imgSet)

			// Try to get lat/lon from any embedded map or structured data
			const scripts = document.querySelectorAll('script[type="application/ld+json"]')
			scripts.forEach(s => {
				try {
					const data = JSON.parse(s.textContent)
					if (data.geo) {
						result.lat = parseFloat(data.geo.latitude) || 0
						result.lon = parseFloat(data.geo.longitude) || 0
					}
					if (data.availableAtOrFrom && data.availableAtOrFrom.geo) {
						result.lat = parseFloat(data.availableAtOrFrom.geo.latitude) || 0
						result.lon = parseFloat(data.availableAtOrFrom.geo.longitude) || 0
					}
				} catch(e) {}
			})

			// Seller name
			const sellerLinks = document.querySelectorAll('a[href*="/marketplace/profile/"], a[href*="/people/"]')
			if (sellerLinks.length) {
				result.seller = (sellerLinks[0].textContent || '').trim()
			}

			return result
		})

		return details
	} catch(e) {
		return null
	} finally {
		await page.close()
	}
}

/**
 * Parse Facebook Marketplace price range from URL (minPrice, maxPrice query params)
 */
function parseFbPriceFromUrl(url) {
	try {
		const urlObj = new URL(url)
		const min = urlObj.searchParams.get('minPrice')
		const max = urlObj.searchParams.get('maxPrice')
		if (!min && !max) return null
		return { min: min ? Number(min) : 0, max: max ? Number(max) : null }
	} catch(e) { return null }
}

/**
 * Set Facebook Marketplace price range on a URL
 */
function setFbUrlPrice(url, min, max) {
	try {
		const urlObj = new URL(url)
		if (min != null) urlObj.searchParams.set('minPrice', String(min))
		if (max != null) urlObj.searchParams.set('maxPrice', String(max))
		return urlObj.toString()
	} catch(e) { return url }
}

module.exports = {
	processPage: async function(params, callback = null) {
		Helpers.logger.log({ print: 'Processing Facebook Marketplace listings for: ' + params.jobName, channels: params.jobId + 'jobUpdate' })
		if (!params.pageUrl || params.pageUrl == '')
			return
		params.index_site = 0
		params.startTime = Date.now()
		params.totalListingsFound = 0
		params.fingerprint = Math.floor(Math.random() * (99999999999999 - 1 + 1)) + 1

		// Authenticate: try user credentials first, then env cookies
		let fbEmail = '', fbPassword = ''
		if (params.userId) {
			try {
				const user = await params.db.get('users').findOne({ _id: params.userId })
				if (user && user.fbEmail && user.fbPasswordEnc) {
					fbEmail = user.fbEmail
					fbPassword = decryptField(user.fbPasswordEnc)
				}
			} catch(e) {}
		}
		if (!fbEmail && process.env.FB_COOKIES) {
			await seedCookies(process.env.FB_COOKIES, '.facebook.com')
		}

		// Price folds: split into sub-ranges and scrape each
		if (params.priceFolds && params.priceFolds >= 2) {
			const price = parseFbPriceFromUrl(params.pageUrl)
			if (price && price.max) {
				const step = Math.ceil((price.max - (price.min || 0)) / params.priceFolds)
				const ranges = []
				for (let i = 0; i < params.priceFolds; i++) {
					const lo = (price.min || 0) + (step * i)
					const hi = (i === params.priceFolds - 1) ? price.max : (price.min || 0) + (step * (i + 1))
					ranges.push({min: lo, max: hi})
				}
				Helpers.logger.log({print: `Splitting Facebook search into ${ranges.length} price folds`, channels:params.jobId+'jobUpdate'})
				params.totalFolds = ranges.length
				let idx = 0
				let totalPageNumber = 0
				for (const range of ranges) {
					idx++
					params.foldIndex = idx
					params.foldListingsFound = 0
					// Check job status before each fold
					let user = await params.db.get('users').findOne({'jobs.id':params.jobId})
					let jobStatusCode = user ? user.jobs.find(job => job.id == params.jobId).statusCode : 0
					if(!user || !jobStatusCode || jobStatusCode < 2) {
						Helpers.logger.log({print: `Job ${params.jobId} ${params.jobName} stopped`, channels:params.jobId+'jobUpdate'})
						break
					}
					const rangeLabel = `$${range.min}-$${range.max}`
					const foldUrl = setFbUrlPrice(params.pageUrl, range.min, range.max)
					Helpers.logger.log({print: `Scraping Facebook price fold: ${rangeLabel}`, channels:params.jobId+'jobUpdate'})
					const foldPages = await module.exports._scrapeSinglePage(params, foldUrl, fbEmail, fbPassword)
					if (foldPages === 0) {
						Helpers.logger.log({print: `Fold ${rangeLabel} returned 0 listings — skipped. Verify manually (may be empty or soft-blocked): ${foldUrl}`, channels:params.jobId+'jobWarning'})
					}
					totalPageNumber += foldPages
				}
				// Cleanup and finish
				return module.exports._finishJob(params, totalPageNumber, callback)
			} else {
				Helpers.logger.log({print: `Cannot split by price: URL has no minPrice/maxPrice params. Running without folds.`, channels:params.jobId+'jobWarning'})
			}
		}

		const pageNumber = await module.exports._scrapeSinglePage(params, params.pageUrl, fbEmail, fbPassword)
		return module.exports._finishJob(params, pageNumber, callback)
	},

	_scrapeSinglePage: async function(params, pageUrl, fbEmail, fbPassword) {
		const browser = await getBrowser()
		let page = null
		let pageNumber = 0

		try {
			page = await browser.newPage()
			await page.setViewport({ width: 1920, height: 1080 })
			await page.evaluateOnNewDocument(() => {
				Object.defineProperty(navigator, 'webdriver', { get: () => false })
			})

			// Log in with credentials if available
			if (fbEmail && fbPassword) {
				const loginOk = await loginWithCredentials(page, fbEmail, fbPassword, params.jobId)
				if (!loginOk) {
					Helpers.logger.log({ print: 'Continuing without login — results may be limited', channels: params.jobId + 'jobWarning' })
				}
			}

			Helpers.logger.log({ print: 'Navigating to: ' + pageUrl, channels: params.jobId + 'jobUpdate' })
			await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 45000 })
			await new Promise(r => setTimeout(r, 3000))

			// Check if we need to dismiss login prompts or cookie dialogs
			try {
				const closeBtn = await page.$('[aria-label="Close"], [data-testid="cookie-policy-manage-dialog-accept-button"]')
				if (closeBtn) await closeBtn.click()
				await new Promise(r => setTimeout(r, 1000))
			} catch(e) {}

			// Check for login wall — if the page has no marketplace items and shows a login form
			const hasListings = await page.$$eval('a[href*="/marketplace/item/"]', els => els.length)
			if (hasListings === 0) {
				const bodyText = await page.evaluate(() => document.body.innerText)
				if (/log\s*in/i.test(bodyText) && /sign\s*up/i.test(bodyText)) {
					Helpers.logger.log({ print: 'Facebook login wall detected — set your Facebook credentials in Profile, or provide FB_COOKIES in .env', channels: params.jobId + 'jobWarning' })
					if (page) await page.close().catch(() => {})
					return 0
				}
			}

			// Scroll to load all listings
			Helpers.logger.log({ print: 'Scrolling to load listings...', channels: params.jobId + 'jobUpdate' })
			const totalListings = await autoScroll(page)
			Helpers.logger.log({ print: `Found ${totalListings} listings after scrolling`, channels: params.jobId + 'jobUpdate' })

			// Extract all listing cards
			const listings = await extractListingsFromPage(page)
			Helpers.logger.log({ print: `Extracted ${listings.length} unique listings`, channels: params.jobId + 'jobUpdate' })

			// Close the search page — we'll open individual pages for details
			await page.close()
			page = null

			if (listings.length > 0) {
				pageNumber = 1
				params.pageNumber = (params.pageNumber || 0) + 1
				await module.exports.processPageListings(params, listings)
			}
		} catch(e) {
			Helpers.logger.log({ print: `Error processing Facebook Marketplace: ${e}`, channels: params.jobId + 'jobWarning' })
		} finally {
			if (page) await page.close().catch(() => {})
		}

		return pageNumber
	},

	_finishJob: async function(params, pageNumber, callback = null) {
		// Cleanup expired ads
		try {
			const result = await params.db.get('ads').remove({
				$and: [
					{ ['jobs.' + params.jobId]: { $exists: true } },
					{ ['jobs.' + params.jobId + '.fingerprint']: { $ne: params.fingerprint } }
				]
			})
			Helpers.logger.log({ print: `All expired ads have been removed! Removed: ${result.result.n} ads.`, channels: params.jobId + 'jobUpdate' })
		} catch(err) {
			Helpers.logger.log({ print: err, channels: params.jobId + 'jobWarning' })
		}

		try {
			await params.db.get('users').update({ 'jobs.id': params.jobId }, { '$set': { 'jobs.$.statusCode': 1 } })
		} catch(err) {
			Helpers.logger.log({ print: err, channels: params.jobId + 'jobWarning' })
		}

		Helpers.logger.log({ command: 'doneProc', print: pageNumber, params: { startTime: params.startTime, totalListingsFound: params.totalListingsFound }, channels: params.jobId + 'command' })
		if (callback) callback(null, pageNumber)
		return pageNumber
	},

	processPageListings: async function(params, listings, callback = null) {
		if (params.foldListingsFound !== undefined) params.foldListingsFound += listings.length
		if (params.totalListingsFound !== undefined) params.totalListingsFound += listings.length

		Helpers.logger.log({
			command: 'procPageNumber', 
			print: params.pageNumber, 
			params: { 
				startTime: params.startTime, 
				foldIndex: params.foldIndex, 
				totalFolds: params.totalFolds,
				foldListingsFound: params.foldListingsFound,
				totalListingsFound: params.totalListingsFound
			}, 
			channels: params.jobId + 'command' 
		})
		params.newAdsFound = false
		await eachOfLimit(listings, 1, module.exports.processSingleListing.bind(null, params))
		Helpers.logger.log({
			command: 'donePageNumber', 
			params: { 
				refresh: params.newAdsFound, 
				startTime: params.startTime,
				foldIndex: params.foldIndex,
				totalFolds: params.totalFolds,
				foldListingsFound: params.foldListingsFound,
				totalListingsFound: params.totalListingsFound
			}, 
			print: params.pageNumber, 
			channels: params.jobId + 'command' 
		})
		if (callback) callback(null, true)
		return params.newAdsFound
	},

	processSingleListing: async function(params, listing, index) {
		while (true) {
			const url = 'https://www.facebook.com/marketplace/item/' + listing.id + '/'
			try {
				// Check cache first
				let doc = await params.db.get('ads').findOneAndUpdate(
					{ 'facebookId': String(listing.id), ['jobs.' + params.jobId]: { $exists: true } },
					{ $set: { ['jobs.' + params.jobId]: { fingerprint: params.fingerprint }, url } }
				)
				if (doc) {
					Helpers.logger.log({ print: 'Loading listing from cache: ' + url, channels: params.jobId + 'jobUpdate' })
					return
				}
			} catch(e) { console.log(e) }

			try {
				let title = listing.title || ''
				let price = listing.price || 0
				let lat = 0
				let lon = 0
				let description = ''
				let picture_urls = listing.picture_url ? [listing.picture_url] : []
				let location = ''

				// Fetch full details from the listing page
				try {
					Helpers.logger.log({ print: `Fetching details for listing ${listing.id}...`, channels: params.jobId + 'jobUpdate' })
					const details = await fetchListingDetails(listing.id)
					if (details) {
						if (details.title) title = details.title
						if (details.price) price = details.price
						if (details.lat) lat = details.lat
						if (details.lon) lon = details.lon
						if (details.description) description = details.description
						if (details.picture_urls && details.picture_urls.length) picture_urls = details.picture_urls
						if (details.location) location = details.location
					}
				} catch(detailErr) {
					Helpers.logger.log({ print: `Could not fetch details for ${listing.id}: ${detailErr.message}`, channels: params.jobId + 'jobWarning' })
				}

				title = title.replace(/\"/g, '').replace(/\\/g, '').replace(/(\r\n|\n|\r)/gm, '').replace(/    /g, '')
				if (!title) return

				params.newAdsFound = true
				Helpers.logger.log({ print: title, channels: params.jobId + 'jobUpdate' })

				params.db.get('ads').insert({
					facebookId: String(listing.id),
					price, lat, lon, url, title,
					categories: location ? [location] : [],
					description,
					picture_url: picture_urls[0] || '',
					picture_urls,
					datetime: new Date(),
					pageUrl: params.pageUrl,
					platform: 'facebook',
					jobs: { [params.jobId]: { fingerprint: params.fingerprint } }
				}, function(err, doc) {
					if (err)
						Helpers.logger.log({ print: 'Error adding listing to DB: ' + err, channels: params.jobId + 'jobWarning' })
				})

				// Delay between detail page fetches
				await Helpers.common.sleep(jitteredDelay(detailDelay()))
				return
			} catch(e) {
				Helpers.logger.log({ print: `Retrying Facebook listing in ${requestErrorDelay() / 1000}s: ${e}`, channels: params.jobId + 'jobWarning' })
				await Helpers.common.sleep(requestErrorDelay())
			}
		}
	}
}
