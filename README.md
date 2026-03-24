# Place Kijiji, Airbnb & Facebook Marketplace listings on a map with advanced search and filters
Fun with node and express.
Search across Kijiji, Airbnb, and Facebook Marketplace from one unified interface. All listings are scraped, placed on an interactive map, and cached in MongoDB for instant filtering.

## Screenshots

**Map View** - Visualize listings on an interactive map
![Map view](screenshots/grid_view.jpg)

**Grid Gallery** - Browse property photos in a grid layout
![Grid gallery](screenshots/grid_gallery.jpg)

**Column View** - Alternative list view for listings
![Column view](screenshots/column_view.jpg)

**Map Drawing Filters** - Draw custom areas on the map to filter results
![Map draw filter](screenshots/map_draw_filter.jpg)

**Advanced Search Filters** - Filter by amenities, price, and custom criteria
![Search filters](screenshots/search_filters.jpg)

**Saved Searches** - Manage and organize your searches
![Searches](screenshots/searches.jpg)

**Live Scraping** - Monitor scraping progress with info modal
![Info modal scraping](screenshots/info_modal_scraping.jpg)

## Supported Platforms

| Platform | Listings | Photos | Location | Details |
|----------|----------|--------|----------|---------|
| **Kijiji** | Title, price, description | Listing photos | Coordinates from meta tags | Categories |
| **Airbnb** | Title, price, description | Multi-photo gallery with categories | Coordinates from API | Bedrooms, beds, bathrooms, amenities, availability calendar |
| **Facebook Marketplace** | Title, price, description | Multi-photo gallery | Geocoded from location text | Bedrooms, bathrooms, sq. meters, parking, property type, seller, category |

## Features

✨ **See All Results at Once** - No pagination, no infinite scroll. All listings are loaded upfront and available immediately on the map.

🗺️ **Complete Map Visualization** - Unlike standard map interfaces, every single listing is visible at all zoom levels. No hidden results that only appear when you zoom in.

🎯 **Custom Geometry Filtering** - Draw circles or polygons directly on the map to filter listings by area.

🏠 **Multi-Source Search** - Search Kijiji, Airbnb, and Facebook Marketplace listings in one unified interface. Compare properties across platforms instantly.

📸 **Photo Gallery** - Browse property photos in a grid layout. Facebook and Airbnb listings support multi-photo galleries.

⚡ **Local Caching** - All results are cached locally in MongoDB. Filter and search instantly without waiting for server responses.

❤️ **Save Favorites** - Mark your favorite listings for quick access. Your favorites persist across sessions.

🔍 **Advanced Filtering** - Filter by price, bedrooms, bathrooms, square meters, parking, property type, category/location, amenities, keywords, and more. Saved filters remember your preferences. Filter by **any amenity** listed in the properties — even ones the platforms don't let you filter by.

📊 **Multiple Views** - Switch between map view, grid gallery, and column view to find properties the way you prefer.

🔄 **Persistent State** - Your search filters, sorting preferences, and view settings are remembered automatically.

### Facebook Marketplace

The Facebook scraper uses Puppeteer with stealth plugins to browse Marketplace listings. It supports:

- **Credential login** with interactive CAPTCHA solving (streamed to the browser) and 2FA code entry
- **Session persistence** — cookies are saved after successful login so you don't need to solve CAPTCHAs every time
- **Price fold splitting** — divide large searches into sub-ranges for more complete results
- **Automatic geocoding** — location text (e.g. "São Paulo, SP") is geocoded via Nominatim to place listings on the map
- **DNS-over-HTTPS** — Docker environments that block standard DNS are handled by resolving hostnames dynamically via DoH

## Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/your-username/kijiji-maps.git
cd kijiji-maps

# Copy and configure environment variables
cp example.env .env
# Edit .env — at minimum set your GOOGLE_MAPS_KEY, MongoDB credentials, and JWT secret

# Start everything
docker compose up -d
```

The app will be available at `http://localhost:8082` (or whatever `LISTENER_PORT` you set in `.env`).
Mongo Express (DB admin UI) runs on port `8081` by default.

### Configuration

1. **`.env`** — Copy `example.env` to `.env` and fill in the values (Google Maps key, MongoDB credentials, JWT secret, etc.)
2. **Google Maps Key** — Set `GOOGLE_MAPS_KEY` in `.env`
3. **API URL** — Update `apiURL` in `app/views/js/API/common.js` if not using the default

#### Facebook Marketplace (optional)

Facebook credentials can be set per-user in the Profile settings. Alternatively:

- **`FB_COOKIES`** in `.env` — Provide Facebook session cookies to skip login entirely. Log into Facebook in a regular browser, export cookies (e.g. with EditThisCookie extension), and paste the cookie string.

After a successful login (including CAPTCHA/2FA), cookies are saved automatically and reused for subsequent scraping sessions (valid for ~30 days).

## Technology Stack
- Node.js with Express backend
- Puppeteer with stealth plugins for scraping
- MongoDB for data persistence
- Docker Compose for easy deployment
- Yarn package manager
- Real-time communication via WebSocket

## Quick Start
1. Sign up and create a new search
2. Copy-paste the first page's link of your search from Kijiji, Airbnb, or Facebook Marketplace
3. Wait for all pages to be fetched (results reload with each page, but refresh at the end to ensure all are loaded)
4. Once fetching is complete, all results are cached locally in MongoDB for instant filtering

---

**Note**: This is meant for simple use and fun only; it does not necessarily reflect my coding style nor best practices.
