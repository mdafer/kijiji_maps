const Helpers = require('../helpers/includes'),
	eachOfLimit = require('async/eachOfLimit'),
	axios = require('axios'),
	{ seedCookies, getBrowser, resolvePageDeps } = require('../helpers/browser'),
	{ decryptField, encryptField } = require('../controllers/users')

// Simple in-memory geocode cache to avoid repeated Nominatim calls
const geocodeCache = new Map()

async function geocodeLocation(locationText) {
	if (!locationText) return { lat: 0, lon: 0 }
	const cacheKey = locationText.toLowerCase().trim()
	if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)

	try {
		const resp = await axios.get('https://nominatim.openstreetmap.org/search', {
			params: { q: locationText, format: 'json', limit: 1 },
			headers: { 'User-Agent': 'KijijiMaps/1.0' },
			timeout: 10000
		})
		if (resp.data && resp.data.length > 0) {
			const result = { lat: parseFloat(resp.data[0].lat) || 0, lon: parseFloat(resp.data[0].lon) || 0 }
			geocodeCache.set(cacheKey, result)
			return result
		}
	} catch(e) {}
	const empty = { lat: 0, lon: 0 }
	geocodeCache.set(cacheKey, empty)
	return empty
}

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
 * Save browser cookies to the user record for reuse across sessions.
 */
async function saveFbCookies(page, db, userId) {
	if (!db || !userId) return
	try {
		const cookies = await page.cookies()
		const cookieStr = cookies
			.filter(c => c.domain.includes('facebook.com') || c.domain.includes('fbsbx.com'))
			.map(c => c.name + '=' + c.value)
			.join('; ')
		if (cookieStr) {
			await db.get('users').update({ _id: userId }, { $set: { fbCookiesEnc: encryptField(cookieStr), fbCookiesDate: new Date() } })
		}
	} catch(e) {}
}

/**
 * Try to restore saved cookies and check if they're still valid.
 * Returns true if session is still active.
 */
async function restoreFbCookies(page, db, userId, jobId) {
	if (!db || !userId) return false
	try {
		const user = await db.get('users').findOne({ _id: userId })
		if (!user || !user.fbCookiesEnc) return false

		// Check cookie age — expire after 30 days
		if (user.fbCookiesDate) {
			const age = Date.now() - new Date(user.fbCookiesDate).getTime()
			if (age > 30 * 24 * 60 * 60 * 1000) {
				Helpers.logger.log({ print: 'Saved Facebook cookies expired (>30 days)', channels: jobId + 'jobUpdate' })
				return false
			}
		}

		const cookieStr = decryptField(user.fbCookiesEnc)
		if (!cookieStr) return false

		Helpers.logger.log({ print: 'Restoring saved Facebook session...', channels: jobId + 'jobUpdate' })
		await seedCookies(cookieStr, '.facebook.com')

		// Quick check — navigate to Facebook and see if we're logged in
		await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20000 })
		await new Promise(r => setTimeout(r, 2000))
		const loggedIn = await page.evaluate(() => {
			return document.cookie.includes('c_user') || !!document.querySelector('a[href*="/marketplace"]')
		})
		if (loggedIn) {
			Helpers.logger.log({ print: 'Facebook session restored from saved cookies', channels: jobId + 'jobUpdate' })
			return true
		}
		Helpers.logger.log({ print: 'Saved Facebook cookies no longer valid', channels: jobId + 'jobUpdate' })
		return false
	} catch(e) {
		return false
	}
}

/**
 * Log into Facebook using Puppeteer with email/password.
 * Returns true if login succeeded, false otherwise.
 */
async function loginWithCredentials(page, email, password, jobId, db, userId) {
	try {
		Helpers.logger.log({ print: 'Logging into Facebook...', channels: jobId + 'jobUpdate' })
		await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
		await new Promise(r => setTimeout(r, 3000))

		// Accept cookie consent if present
		try {
			const cookieBtn = await page.$('[data-cookiebanner="accept_button"], [data-testid="cookie-policy-manage-dialog-accept-button"]')
			if (cookieBtn) { await cookieBtn.click(); await new Promise(r => setTimeout(r, 1000)) }
		} catch(e) {}

		// Fill in credentials — try multiple selectors for resilience
		const emailSelector = await page.waitForSelector('#email, input[name="email"], input[type="email"]', { timeout: 15000 })
		await emailSelector.type(email, { delay: 50 + Math.random() * 80 })
		await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
		const passField = await page.$('#pass, input[name="pass"], input[type="password"]')
		await passField.type(password, { delay: 50 + Math.random() * 80 })
		await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
		// Submit login — try clicking a button, fall back to pressing Enter
		const loginBtn = await page.$('[name="login"], #loginbutton, button[type="submit"], [data-testid="royal_login_button"], button[id="loginbutton"]')
		if (loginBtn) {
			await loginBtn.click()
		} else {
			await passField.press('Enter')
		}
		await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
		await new Promise(r => setTimeout(r, 3000))

		// Check if login succeeded — look for the marketplace link or user menu
		const loggedIn = await page.evaluate(() => {
			return !!document.querySelector('[aria-label="Facebook"], [aria-label="Your profile"], [data-testid="royal_blue_bar"]')
				|| document.cookie.includes('c_user')
				|| !!document.querySelector('a[href*="/marketplace"]')
		})

		if (loggedIn) {
			Helpers.logger.log({ print: 'Facebook login successful', channels: jobId + 'jobUpdate' })
			await saveFbCookies(page, db, userId)
			return true
		}

		// Check for checkpoint/CAPTCHA/2FA
		const pageText = await page.evaluate(() => document.body.innerText)

		// Arkose Labs CAPTCHA — stream screenshots to frontend so user can solve it
		if (/arkose|matchkey|funcaptcha/i.test(pageText)) {
			// Dynamically resolve any DNS dependencies the CAPTCHA page needs, then reload
			for (let attempt = 0; attempt < 3; attempt++) {
				const newHosts = await resolvePageDeps(page)
				if (newHosts.length === 0) break
				Helpers.logger.log({ print: 'Resolved DNS for: ' + newHosts.join(', '), channels: jobId + 'jobUpdate' })
				await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
				await new Promise(r => setTimeout(r, 3000))
			}

			Helpers.logger.log({ print: 'Facebook CAPTCHA detected — solve it in the info panel below', channels: jobId + 'jobUpdate' })

			const requestId = Math.random().toString(36).slice(2)
			Helpers.captchaSessions.set(requestId, { page })
			Helpers.io.emit('needCaptcha', { requestId, jobId })

			try {
				const solved = await new Promise((resolve, reject) => {
					const timeout = setTimeout(() => {
						Helpers.pendingManualResponses.delete(requestId)
						reject(new Error('CAPTCHA timeout (5 min)'))
					}, 300000)
					Helpers.pendingManualResponses.set(requestId, {
						resolve: (val) => { clearTimeout(timeout); resolve(val) },
						reject: (err) => { clearTimeout(timeout); reject(err) }
					})

					// Stream screenshots to the frontend
					const sendFrame = async () => {
						try {
							const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 70 })
							Helpers.io.emit('captchaFrame', { requestId, image: screenshot })
						} catch(e) {}
					}
					sendFrame() // send first frame immediately
					const frameInterval = setInterval(sendFrame, 600)

					// Also store interval so we can clean up
					Helpers.captchaSessions.get(requestId).frameInterval = frameInterval
				})

				if (solved === 'skip') {
					Helpers.logger.log({ print: 'CAPTCHA skipped by user', channels: jobId + 'jobWarning' })
					return false
				}

				// User indicated CAPTCHA is solved — check if we're past the checkpoint
				await new Promise(r => setTimeout(r, 2000))
				const postCaptchaText = await page.evaluate(() => document.body.innerText)
				if (!/arkose|matchkey|funcaptcha/i.test(postCaptchaText)) {
					Helpers.logger.log({ print: 'CAPTCHA solved — continuing login', channels: jobId + 'jobUpdate' })
					// Check if we're now logged in or need to continue
					const loggedIn = await page.evaluate(() => {
						return document.cookie.includes('c_user') || !!document.querySelector('a[href*="/marketplace"]')
					})
					if (loggedIn) {
						Helpers.logger.log({ print: 'Facebook login successful after CAPTCHA', channels: jobId + 'jobUpdate' })
						await saveFbCookies(page, db, userId)
						return true
					}
					// May still need 2FA after CAPTCHA — fall through to 2FA check below
				} else {
					Helpers.logger.log({ print: 'CAPTCHA may not be solved yet — continuing anyway', channels: jobId + 'jobWarning' })
					return false
				}
			} catch(e) {
				Helpers.logger.log({ print: 'CAPTCHA error: ' + e.message, channels: jobId + 'jobWarning' })
				return false
			} finally {
				const session = Helpers.captchaSessions.get(requestId)
				if (session && session.frameInterval) clearInterval(session.frameInterval)
				Helpers.captchaSessions.delete(requestId)
			}
		}

		if (/two-factor|code.*sent|enter.*code|verification code|approvals_code/i.test(pageText)) {
			Helpers.logger.log({ print: 'Facebook requires a verification code', channels: jobId + 'jobUpdate' })

			// Ask frontend for the 2FA code
			const requestId = Math.random().toString(36).slice(2)
			try {
				const code = await new Promise((resolve, reject) => {
					const timeout = setTimeout(() => {
						Helpers.pendingManualResponses.delete(requestId)
						reject(new Error('2FA code timeout (3 min)'))
					}, 180000)
					Helpers.pendingManualResponses.set(requestId, {
						resolve: (val) => { clearTimeout(timeout); resolve(val) },
						reject: (err) => { clearTimeout(timeout); reject(err) }
					})
					Helpers.io.emit('needFb2FA', { requestId, jobId })
				})

				if (!code || code === 'skip') {
					Helpers.logger.log({ print: '2FA skipped by user', channels: jobId + 'jobWarning' })
					return false
				}

				// Try to find the code input — wait for it to appear
				let codeInput = null
				try {
					codeInput = await page.waitForSelector(
						'input[name="approvals_code"], input[id="approvals_code"], ' +
						'input[autocomplete="one-time-code"], input[inputmode="numeric"], ' +
						'input[aria-label*="code" i], input[aria-label*="Code" i], ' +
						'input[placeholder*="code" i], input[placeholder*="Code" i]',
						{ timeout: 5000 }
					)
				} catch(e) {
					// Fallback: pick the first visible text/tel/number input that isn't email/password
					codeInput = await page.evaluateHandle(() => {
						const inputs = Array.from(document.querySelectorAll('input'))
						return inputs.find(i =>
							['text', 'tel', 'number', ''].includes(i.type) &&
							i.offsetParent !== null &&
							i.name !== 'email' && i.name !== 'pass'
						) || null
					})
					// evaluateHandle returns a JSHandle; unwrap to null if no element
					const isNull = await codeInput.evaluate(el => el === null).catch(() => true)
					if (isNull) codeInput = null
				}

				if (codeInput) {
					Helpers.logger.log({ print: 'Found 2FA input — entering code...', channels: jobId + 'jobUpdate' })
					await codeInput.click({ clickCount: 3 }) // select any existing text
					await codeInput.type(code.trim(), { delay: 50 + Math.random() * 80 })
					await new Promise(r => setTimeout(r, 500))
					// Submit the code — try button first, then Enter
					const submitBtn = await page.$('button[type="submit"], #checkpointSubmitButton, [name="submit[Continue]"], button[id*="submit"], div[role="button"][tabindex="0"]')
					if (submitBtn) {
						await submitBtn.click()
					} else {
						await codeInput.press('Enter')
					}
					await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
					await new Promise(r => setTimeout(r, 3000))

					// Check login success — loop through possible follow-up screens (device approval, etc.)
					for (let step = 0; step < 3; step++) {
						const loggedIn = await page.evaluate(() => {
							return !!document.querySelector('[aria-label="Facebook"], [aria-label="Your profile"]')
								|| document.cookie.includes('c_user')
								|| !!document.querySelector('a[href*="/marketplace"]')
						})
						if (loggedIn) {
							Helpers.logger.log({ print: 'Facebook login successful after 2FA', channels: jobId + 'jobUpdate' })
							await saveFbCookies(page, db, userId)
							return true
						}
						// Try clicking any "Continue" / "This was me" type buttons
						const nextBtn = await page.$('button[type="submit"], [name="submit[Continue]"], [name="submit[This was me]"], div[role="button"][tabindex="0"]')
						if (nextBtn) {
							Helpers.logger.log({ print: '2FA follow-up step ' + (step + 1) + ' — clicking continue...', channels: jobId + 'jobUpdate' })
							await nextBtn.click()
							await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
							await new Promise(r => setTimeout(r, 2000))
						} else {
							break
						}
					}

					const finalCheck = await page.evaluate(() => {
						return document.cookie.includes('c_user') || !!document.querySelector('a[href*="/marketplace"]')
					})
					if (finalCheck) {
						Helpers.logger.log({ print: 'Facebook login successful after 2FA', channels: jobId + 'jobUpdate' })
						return true
					}
				} else {
					Helpers.logger.log({ print: '2FA: could not find code input field on page', channels: jobId + 'jobWarning' })
				}
				Helpers.logger.log({ print: '2FA verification may have failed — continuing anyway', channels: jobId + 'jobWarning' })
				return false
			} catch(e) {
				Helpers.logger.log({ print: '2FA prompt error: ' + e.message, channels: jobId + 'jobWarning' })
				return false
			}
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
				if (!price && /^(?:R\$|CA\$|C\s?\$|\$|€|£)\s?[\d,.]+/.test(t)) {
					price = parseFloat(t.replace(/[^0-9.]/g, '')) || 0
				} else if (!title && t.length > 3 && !/^(?:R\$|CA\$|C\s?\$|\$|€|£)/.test(t)) {
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
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
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
				seller: '',
				category: '',
				propertyType: '',
				bedrooms: 0,
				bathrooms: 0,
				sqMeters: 0,
				parking: 0
			}

			// Title — h1 heading
			const h1 = document.querySelector('h1')
			if (h1) result.title = (h1.textContent || '').trim()

			// Price — find first span with a non-zero currency value
			const allSpans = document.querySelectorAll('span')
			for (const s of allSpans) {
				const t = (s.textContent || '').trim()
				if (/^(?:R\$|CA\$|C\s?\$|\$|€|£)\s?[\d,.]+$/.test(t) || /^[\d,.]+\s?(?:€|£|kr|zł)$/.test(t)) {
					const val = parseFloat(t.replace(/[^0-9.]/g, '')) || 0
					if (val > 0) { result.price = val; break }
				}
			}

			// Location — try role="listitem" with location pin SVG first
			const LOCATION_PIN_PATH = 'M10 .5A7.5'
			const listItems = document.querySelectorAll('[role="listitem"]')
			for (const item of listItems) {
				const text = (item.textContent || '').trim()
				if (text.length < 3) continue
				const svg = item.querySelector('svg')
				if (!svg) continue
				const pathD = svg.querySelector('path')?.getAttribute('d') || ''
				if (pathD.startsWith(LOCATION_PIN_PATH)) {
					result.location = text
					break
				}
			}
			// Fallback: some listing types have no listItems — scan all spans
			// for text near a location pin SVG anywhere on the page
			if (!result.location) {
				document.querySelectorAll('svg').forEach(svg => {
					if (result.location) return
					const pathD = svg.querySelector('path')?.getAttribute('d') || ''
					if (pathD.startsWith(LOCATION_PIN_PATH)) {
						// Get the text from the nearest sibling/parent container
						const container = svg.closest('div')
						if (container) {
							const text = container.textContent.trim()
							if (text.length > 2 && text.length < 80) result.location = text
						}
					}
				})
			}
			// Last fallback: look for "Listed in <location>" pattern in page text
			if (!result.location) {
				for (const s of allSpans) {
					const t = (s.textContent || '').trim()
					if (/^listed\s+in\s+/i.test(t)) {
						result.location = t.replace(/^listed\s+in\s+/i, '').trim()
						break
					}
					// Location-like text: "City, State" pattern
					if (!result.location && /^[A-Z\u00C0-\u024F][\w\s\u00C0-\u024F-]+,\s*[A-Z]{2}$/.test(t)) {
						result.location = t
					}
				}
			}

			// Category, property details — scan all spans for known patterns
			const spanTexts = []
			allSpans.forEach(s => { const t = (s.textContent || '').trim(); if (t) spanTexts.push(t) })

			// Category: "Home sales", "Property rentals", etc. — usually a link near the price
			const categoryLinks = document.querySelectorAll('a[href*="/marketplace/"][href*="property"], a[href*="/marketplace/"][href*="sale"], a[href*="/marketplace/"][href*="rental"]')
			if (categoryLinks.length) result.category = (categoryLinks[0].textContent || '').trim()

			// Beds · baths pattern: "2 beds · 3 baths"
			for (const t of spanTexts) {
				const bedMatch = t.match(/(\d+)\s*beds?/i)
				const bathMatch = t.match(/(\d+)\s*baths?/i)
				if (bedMatch) result.bedrooms = parseInt(bedMatch[1]) || 0
				if (bathMatch) result.bathrooms = parseInt(bathMatch[1]) || 0
				if (bedMatch || bathMatch) break
			}

			// Square meters: "92 square meters" or "67 m²"
			for (const t of spanTexts) {
				const sqMatch = t.match(/(\d+)\s*(?:square\s*met|m²|sq\s*m)/i)
				if (sqMatch) { result.sqMeters = parseInt(sqMatch[1]) || 0; break }
			}

			// Parking: "2 parking spaces"
			for (const t of spanTexts) {
				const parkMatch = t.match(/(\d+)\s*parking/i)
				if (parkMatch) { result.parking = parseInt(parkMatch[1]) || 0; break }
			}

			// Property type: "Apartment", "House", "Condo", etc.
			const propertyTypes = ['apartment', 'house', 'condo', 'townhouse', 'studio', 'loft', 'villa', 'duplex', 'flat', 'room']
			for (const t of spanTexts) {
				const lower = t.toLowerCase().trim()
				if (propertyTypes.includes(lower)) { result.propertyType = t; break }
			}

			// Description
			const descEls = document.querySelectorAll('[data-testid="marketplace_listing_description"]')
			if (descEls.length) {
				result.description = (descEls[0].textContent || '').trim()
			} else {
				let longest = ''
				allSpans.forEach(s => {
					const t = (s.textContent || '').trim()
					if (t.length > longest.length && t !== result.title && t.length > 30
						&& !t.includes(result.location) && !/^(?:R\$|CA\$|\$|€|£)/.test(t)) {
						longest = t
					}
				})
				if (longest) result.description = longest
			}

			// Images — confirmed: thumbnails sit inside div[aria-label="Thumbnail N"]
			// and listing photos have alt="Photo of ..."
			// In Docker naturalWidth is always 0, so don't rely on dimensions.
			const imgSet = new Set()
			document.querySelectorAll('[aria-label^="Thumbnail"] img').forEach(img => {
				const src = img.src || ''
				if (src && /scontent/.test(src)) imgSet.add(src)
			})
			// Fallback: any scontent img with alt starting "Photo of"
			if (imgSet.size === 0) {
				document.querySelectorAll('img[alt^="Photo of"]').forEach(img => {
					const src = img.src || ''
					if (src && /scontent/.test(src)) imgSet.add(src)
				})
			}
			// Last resort: all scontent imgs excluding avatar patterns
			if (imgSet.size === 0) {
				document.querySelectorAll('img').forEach(img => {
					const src = img.src || ''
					if (src && /scontent/.test(src) &&
						!/(?:\/p\d+x\d+\/|\/c\d+\.\d+\.\d+\.\d+\/|\/cp\d+\/)/.test(src)) {
						imgSet.add(src)
					}
				})
			}
			result.picture_urls = Array.from(imgSet)

			// Lat/lon from structured data
			const ldJsons = []
			document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
				try { ldJsons.push(JSON.parse(s.textContent)) } catch(e) {}
			})
			for (const ld of ldJsons) {
				if (ld.geo) {
					result.lat = parseFloat(ld.geo.latitude) || 0
					result.lon = parseFloat(ld.geo.longitude) || 0
				}
				if (ld.availableAtOrFrom && ld.availableAtOrFrom.geo) {
					result.lat = parseFloat(ld.availableAtOrFrom.geo.latitude) || 0
					result.lon = parseFloat(ld.availableAtOrFrom.geo.longitude) || 0
				}
			}

			// Seller name
			const sendBtn = document.querySelector('[aria-label^="Send message to"]')
			if (sendBtn) {
				const label = sendBtn.getAttribute('aria-label') || ''
				result.seller = label.replace(/^Send message to\s*/i, '').trim()
			}
			if (!result.seller) {
				const sellerLinks = document.querySelectorAll('a[href*="/marketplace/profile/"], a[href*="/people/"]')
				if (sellerLinks.length) result.seller = (sellerLinks[0].textContent || '').trim()
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

			// Try restoring saved session first, then fall back to credential login
			let loggedIn = false
			if (params.userId && params.db) {
				loggedIn = await restoreFbCookies(page, params.db, params.userId, params.jobId)
			}
			if (!loggedIn && fbEmail && fbPassword) {
				loggedIn = await loginWithCredentials(page, fbEmail, fbPassword, params.jobId, params.db, params.userId)
				if (!loggedIn) {
					Helpers.logger.log({ print: 'Continuing without login — results may be limited', channels: params.jobId + 'jobWarning' })
				}
			}

			Helpers.logger.log({ print: 'Navigating to: ' + pageUrl, channels: params.jobId + 'jobUpdate' })
			await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
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
			await params.db.get('users').update({ 'jobs': { $elemMatch: { id: params.jobId, statusCode: 2 } } }, { '$set': { 'jobs.$.statusCode': 1 } })
		} catch(err) {
			Helpers.logger.log({ print: err, channels: params.jobId + 'jobWarning' })
		}

		Helpers.logger.log({ command: 'doneProc', print: pageNumber, params: { startTime: params.startTime, totalListingsFound: params.totalListingsFound }, channels: params.jobId + 'command' })
		if (callback) callback(null, pageNumber)
		return pageNumber
	},

	processPageListings: async function(params, listings, callback = null) {
		if (params.totalListingsFound !== undefined) params.totalListingsFound += listings.length

		Helpers.logger.log({
			command: 'procPageNumber',
			print: params.pageNumber,
			params: {
				startTime: params.startTime,
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
					{ 'facebookId': String(listing.id) },
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
				let lat = 0, lon = 0
				let description = '', location = '', seller = '', category = '', propertyType = ''
				let bedrooms = 0, bathrooms = 0, sqMeters = 0, parking = 0
				let picture_urls = listing.picture_url ? [listing.picture_url] : []

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
						if (details.seller) seller = details.seller
						if (details.category) category = details.category
						if (details.propertyType) propertyType = details.propertyType
						if (details.bedrooms) bedrooms = details.bedrooms
						if (details.bathrooms) bathrooms = details.bathrooms
						if (details.sqMeters) sqMeters = details.sqMeters
						if (details.parking) parking = details.parking
					}
				} catch(detailErr) {
					Helpers.logger.log({ print: `Could not fetch details for ${listing.id}: ${detailErr.message}`, channels: params.jobId + 'jobWarning' })
				}

				// Geocode location text if we still have no coordinates
				if (!lat && !lon && location) {
					try {
						const geo = await geocodeLocation(location)
						lat = geo.lat
						lon = geo.lon
					} catch(e) {}
				}

				title = title.replace(/\"/g, '').replace(/\\/g, '').replace(/(\r\n|\n|\r)/gm, '').replace(/    /g, '')
				if (!title) return

				params.newAdsFound = true
				Helpers.logger.log({ print: title, channels: params.jobId + 'jobUpdate' })

				params.db.get('ads').insert({
					facebookId: String(listing.id),
					price, lat, lon, url, title, seller,
					categories: [category, location, propertyType].filter(Boolean),
					description,
					bedrooms, bathrooms, sqMeters, parking, propertyType,
					picture_url: picture_urls[0] || '',
					picture_urls,
					datetime: new Date(),
					pageUrl: params.pageUrl,
					platform: 'facebook',
					jobs: { [params.jobId]: { fingerprint: params.fingerprint } }
				}, function(err, doc) {
					if (err) {
						Helpers.logger.log({ print: 'Error adding listing to DB: ' + err, channels: params.jobId + 'jobWarning' })
						return
					}
					if (doc && Helpers.io) Helpers.io.emit('newAd', {jobId: params.jobId, ad: doc})
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
