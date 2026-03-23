const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

let _browser = null

async function getBrowser() {
	if (!_browser || !_browser.isConnected()) {
		_browser = await puppeteer.launch({
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
			headless: 'new',
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-blink-features=AutomationControlled',
				'--disable-features=IsolateOrigins,site-per-process',
				'--window-size=1920,1080',
				'--lang=en-CA,en'
			]
		})
	}
	return _browser
}

async function fetchPage(url, opts = {}) {
	const browser = await getBrowser()
	const page = await browser.newPage()
	try {
		await page.setViewport({ width: 1920, height: 1080 })
		await page.evaluateOnNewDocument(() => {
			Object.defineProperty(navigator, 'webdriver', { get: () => false })
		})
		const response = await page.goto(url, {
			waitUntil: opts.waitUntil || 'domcontentloaded',
			timeout: opts.timeout || 30000
		})
		const html = await page.content()
		return { status: response ? response.status() : 200, html }
	} finally {
		await page.close()
	}
}

async function seedCookies(cookieString, domain) {
	const browser = await getBrowser()
	const page = await browser.newPage()
	try {
		const cookies = cookieString.split(';').map(c => {
			const [name, ...rest] = c.trim().split('=')
			return name ? { name: name.trim(), value: rest.join('=').trim(), domain } : null
		}).filter(Boolean)
		if (cookies.length) await page.setCookie(...cookies)
	} finally {
		await page.close()
	}
}

module.exports = { getBrowser, fetchPage, seedCookies }
