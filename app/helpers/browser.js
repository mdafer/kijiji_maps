const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const https = require('https')
const fs = require('fs')

puppeteer.use(StealthPlugin())

// Resolve a hostname via Cloudflare DoH and pin it in /etc/hosts
const _resolvedHosts = new Set()
async function resolveHost(hostname) {
	if (_resolvedHosts.has(hostname)) return
	_resolvedHosts.add(hostname)
	return new Promise((resolve) => {
		const req = https.get(
			`https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
			{ headers: { 'Accept': 'application/dns-json' }, timeout: 5000 },
			(res) => {
				let data = ''
				res.on('data', c => data += c)
				res.on('end', () => {
					try {
						const json = JSON.parse(data)
						const ip = json.Answer && json.Answer.find(a => a.type === 1)
						if (ip) {
							fs.appendFileSync('/etc/hosts', `${ip.data} ${hostname}\n`)
						}
					} catch(e) {}
					resolve()
				})
			}
		)
		req.on('error', () => resolve())
		req.on('timeout', () => { req.destroy(); resolve() })
	})
}

/**
 * Resolve multiple hostnames via DoH and pin in /etc/hosts.
 * Call this before navigating to pages that load cross-origin resources.
 */
async function resolveHosts(hostnames) {
	await Promise.all(hostnames.map(h => resolveHost(h)))
}

/**
 * Scan a Puppeteer page for all cross-origin hostnames in iframes/scripts
 * and resolve any unresolved ones via DoH.
 */
async function resolvePageDeps(page) {
	const hosts = await page.evaluate(() => {
		const set = new Set()
		document.querySelectorAll('iframe[src], script[src], link[href]').forEach(el => {
			try { set.add(new URL(el.src || el.href).hostname) } catch(e) {}
		})
		return Array.from(set)
	})
	// Also check iframes' contents
	for (const frame of page.frames()) {
		try {
			const frameHosts = await frame.evaluate(() => {
				const set = new Set()
				document.querySelectorAll('iframe[src], script[src], link[href]').forEach(el => {
					try { set.add(new URL(el.src || el.href).hostname) } catch(e) {}
				})
				return Array.from(set)
			})
			hosts.push(...frameHosts)
		} catch(e) {}
	}
	const newHosts = [...new Set(hosts)].filter(h => !_resolvedHosts.has(h))
	if (newHosts.length > 0) await resolveHosts(newHosts)
	return newHosts
}

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

module.exports = { getBrowser, fetchPage, seedCookies, resolveHosts, resolvePageDeps }
