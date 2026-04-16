var gridpage = toolbarHtml + `
    <section class="content">
      <div id="gridContainer"></div>
    </section>
`;

var _gridMode = 'cards'
var _gridAds = []
var _gridRenderedCount = 0
var _gridBatchSize = 50
var _gridScrollTimer = null
var _currentSort = null

function gridfunc() {
  setViewMode('grid')
  $('#pageTitle').text(jobName + (_favoritesOnly ? ' - Favorites' : ''))
  $('#filterJobId').val(jobId)

  // Hide job-specific actions when viewing multiple searches
  if(jobId === 'all' || jobId === 'multi') {
    $('[onclick="resetJob()"], [onclick="clearJobCache()"]').hide()
  }

  // Restore persisted filters first, then let URL params override
  restoreFilters()
  if(urlParams.fromPrice) $('#fromPrice').val(urlParams.fromPrice)
  if(urlParams.toPrice) $('#toPrice').val(urlParams.toPrice)
  if(urlParams.searchText) $('#searchText').val(urlParams.searchText)
  if(urlParams.minBedrooms) $('#minBedrooms').val(urlParams.minBedrooms)
  if(urlParams.minBathrooms) $('#minBathrooms').val(urlParams.minBathrooms)
  if(urlParams.minBeds) $('#minBeds').val(urlParams.minBeds)
  if(urlParams.minPhotos) {
    $('#minPhotos').val(urlParams.minPhotos)
    $('#minPhotosCheck').prop('checked', true)
  }
  if(urlParams.amenities) $('#amenities').val(urlParams.amenities)
  if(urlParams.orAmenities) $('#orAmenities').val(urlParams.orAmenities)

  // Restore persisted state
  restoreShapeGeo()
  restoreFavoritesOnly()

  // Load displayAmenities from user account settings
  APIgetProfile(null, function(user){
    if(user && user.displayAmenities) _savedDisplayAmenities = user.displayAmenities.split(',').map(function(s){return s.trim()}).filter(Boolean)
  })

  $(".BStooltip").tooltip({ trigger: 'hover', container: 'body' })

  $('#filtersModal').on('show.bs.modal', function(){ updateAmenityBubbles() })

  $('#filtersForm').on('submit', function(event) {
    event.preventDefault()
    $('#filtersModal').modal('hide')
    saveFilters()
    updateFilterIndicator()
    loadGridAds($('#filtersForm').serialize())
  })

  restoreSort()
  restoreGridMode()
  updateSortLabel()
  setupSocketListeners()
  loadGridAds($('#filtersForm').serialize())
}

function gridUnload() {
  $('#filtersForm').off('submit')
  $('#filtersModal').off('show.bs.modal')
  teardownSocketListeners()
  $('.content-wrapper').off('scroll.gridInfinite')
  if(_gridScrollTimer) { clearTimeout(_gridScrollTimer); _gridScrollTimer = null }
}

function loadGridAds(params) {
  APIgetAds(params, function(ads) {
    // Apply shape filter if active
    if(hasActiveShapeFilter()) {
      ads = ads.filter(function(ad){ return isInsideShapeFilter(ad.lat, ad.lon) })
    }
    _gridAds = ads
    _allAmenities = new Set()
    _amenityIdMap = {}
    ads.forEach(function(ad) {
      if(ad.amenities && ad.amenities.length)
        ad.amenities.forEach(function(a){ _allAmenities.add(a) })
      if(ad.amenityIdMap) Object.assign(_amenityIdMap, ad.amenityIdMap)
    })
    if(_currentSort) _applySort()
    renderGrid()
    if(_focusAdId) scrollToFocusedAd()
  })
}

function _applySort() {
  if(!_currentSort) return
  var field = _currentSort.field, dir = _currentSort.dir
  _gridAds.sort(function(a, b) {
    var va, vb
    if(field === 'price') {
      va = parseFloat(a.price) || 0
      vb = parseFloat(b.price) || 0
    } else {
      va = a._id ? parseInt(a._id.substring(0, 8), 16) : 0
      vb = b._id ? parseInt(b._id.substring(0, 8), 16) : 0
    }
    return dir === 'asc' ? va - vb : vb - va
  })
}

function updateSortLabel() {
  if(!_currentSort) { $('#sortLabel').text('Sort'); return }
  var labels = {
    'price_asc':  'Price: Low→High',
    'price_desc': 'Price: High→Low',
    'date_desc':  'Date: Newest',
    'date_asc':   'Date: Oldest'
  }
  $('#sortLabel').text(labels[_currentSort.field + '_' + _currentSort.dir] || 'Sort')
}

function sortGrid(field, dir) {
  _currentSort = { field: field, dir: dir }
  saveSort()
  _applySort()
  updateSortLabel()
  renderGrid()
}

function setGridMode(mode) {
  _gridMode = mode
  $('#gridModeCards').toggleClass('btn-primary', mode === 'cards').toggleClass('btn-default', mode !== 'cards')
  $('#gridModeRows').toggleClass('btn-primary', mode === 'rows').toggleClass('btn-default', mode !== 'rows')
  renderGrid()
}

function renderGrid() {
  var container = $('#gridContainer')
  container.empty()
  _gridRenderedCount = 0
  var countText = 'Results: ' + _gridAds.length
  if(_favoritesOnly) countText += ' (favorites)'
  if(hasActiveShapeFilter()) countText += ' (area filtered)'
  $('.resultscount').text(countText)

  if(_gridMode === 'cards')
    container.html('<div class="grid-cards" id="gridInner"></div>')
  else
    container.html('<div class="grid-rows" id="gridInner"></div>')

  renderGridBatch()
  var $cw = $('.content-wrapper')
  $cw.off('scroll.gridInfinite').on('scroll.gridInfinite', onGridScroll)
}

function onGridScroll() {
  if(_gridRenderedCount >= _gridAds.length) return
  if(_gridScrollTimer) return
  _gridScrollTimer = setTimeout(function(){
    _gridScrollTimer = null
    var $cw = $('.content-wrapper')
    var scrollBottom = $cw.scrollTop() + $cw.innerHeight()
    var scrollHeight = $cw[0].scrollHeight
    if(scrollBottom >= scrollHeight - 600)
      renderGridBatch()
  }, 80)
}

function renderGridBatch() {
  var inner = document.getElementById('gridInner')
  if(!inner) return
  var end = Math.min(_gridRenderedCount + _gridBatchSize, _gridAds.length)
  var frag = document.createDocumentFragment()
  var tmp = document.createElement('div')
  var html = ''
  for(var i = _gridRenderedCount; i < end; i++) {
    html += _gridMode === 'cards' ? buildCardHtml(_gridAds[i]) : buildRowHtml(_gridAds[i])
  }
  tmp.innerHTML = html
  while(tmp.firstChild) frag.appendChild(tmp.firstChild)
  inner.appendChild(frag)
  observeLazyImages(inner)
  _gridRenderedCount = end
  var base = 'Results: ' + _gridAds.length
  if(_favoritesOnly) base += ' (favorites)'
  if(hasActiveShapeFilter()) base += ' (area filtered)'
  if(_gridRenderedCount < _gridAds.length)
    $('.resultscount').text(base + ' (showing ' + _gridRenderedCount + ')')
  else
    $('.resultscount').text(base)
}

function buildCardHtml(ad) {
  var img = ad.picture_url || ''
  var imgHtml = img ? '<img class="grid-card-img" data-src="'+img+'" referrerpolicy="no-referrer">' : '<div class="grid-card-img grid-card-noimg"><i class="fa fa-image"></i></div>'
  var pics = ad.picture_urls || []
  var photoBtnHtml = pics.length > 1
    ? '<button class="btn btn-xs btn-info" onclick="openPhotoGallery(gridAdPhotos(\''+ad._id+'\'))"><i class="fa fa-camera"></i> '+pics.length+'</button>'
    : ''
  var details = []
  if(ad.bedrooms) details.push(ad.bedrooms + ' bd')
  if(ad.bathrooms) details.push(ad.bathrooms + ' ba')
  if(ad.beds) details.push(ad.beds + ' beds')

  var amenityHtml = ''
  if(ad.amenities && ad.amenities.length) {
    var displayList = getDisplayAmenities()
    var shownAmenities = displayList.length ? ad.amenities.filter(function(a){ return displayList.indexOf(a) !== -1 }) : ad.amenities
    if(shownAmenities.length) {
      amenityHtml = '<div class="grid-card-amenities">'
      shownAmenities.forEach(function(a){ amenityHtml += '<span class="amenity-bubble">'+a+'</span>' })
      amenityHtml += '</div>'
    }
  }

  var html = '<div class="grid-card" data-adid="'+ad._id+'">'
  html += '  <div class="grid-card-img-wrap">'+imgHtml+'</div>'
  html += '  <div class="grid-card-body">'
  html += '    <div class="grid-card-title" title="'+ad.title+'">'+ad.title+'</div>'
  html += '    <div class="grid-card-price">$'+ad.price+'</div>'
  html += '    <div class="grid-card-details">'+details.join(' &middot; ')+'</div>'
  html += amenityHtml
  var favColor = isFavorite(ad._id) ? '#e74c3c' : '#ccc'
  html += '    <div class="grid-card-actions">'
  html += '      <button class="btn btn-xs" data-adid="'+ad._id+'" onclick="toggleFavoriteBtn(this)" title="Toggle favorite"><i class="fa fa-heart" style="color:'+favColor+'"></i></button>'
  html += '      '+photoBtnHtml
  if(ad.platform === 'airbnb') {
    if(ad.availability) html += '      <button class="btn btn-xs btn-warning" onclick="openAvailabilityCalendar(\''+ad._id+'\')" title="Show 12-month availability"><i class="fa fa-calendar"></i> Availability</button>'
    else html += '      <button class="btn btn-xs btn-default" style="opacity:0.6" disabled title="Availability data not yet fetched. Refresh listing to update."><i class="fa fa-calendar-o"></i> Availability</button>'
  }
  if(ad.lat && ad.lon) html += '      <button class="btn btn-xs btn-info" onclick="googleMapsReady.then(function(){openListingMapPopup('+ad.lat+','+ad.lon+',\''+ad.title.replace(/'/g,"\\'")+'\')})" title="Show on map"><i class="fa fa-map-marker"></i> Map</button>'
  html += '      <a class="btn btn-xs btn-success" href="'+ad.url+'" target="_blank"><i class="fa fa-external-link"></i> Airbnb</a>'
  html += '    </div>'
  html += '  </div>'
  html += '</div>'
  return html
}

function buildRowHtml(ad) {
  var details = []
  if(ad.bedrooms) details.push(ad.bedrooms + ' bd')
  if(ad.bathrooms) details.push(ad.bathrooms + ' ba')
  if(ad.beds) details.push(ad.beds + ' beds')

  var pics = ad.picture_urls || []
  if(!pics.length && ad.picture_url) pics = [ad.picture_url]
  var cats = groupPhotoCategories(ad.photo_categories)

  var imagesHtml = ''
  if(cats && Object.keys(cats).length) {
    // Separate multi-pic categories from single-pic categories
    var multiCats = {}, singleCats = {}
    Object.keys(cats).forEach(function(cat) {
      if(cats[cat].length > 1) multiCats[cat] = cats[cat]
      else singleCats[cat] = cats[cat]
    })

    imagesHtml = '<div class="grid-row-categories">'
    // Render multi-pic categories normally
    Object.keys(multiCats).forEach(function(cat) {
      imagesHtml += '<div class="grid-row-cat">'
      imagesHtml += '<div class="grid-row-cat-title">'+cat+'</div>'
      imagesHtml += '<div class="grid-row-images">'
      multiCats[cat].forEach(function(url) {
        imagesHtml += '<img class="grid-row-img" data-src="'+url+'" referrerpolicy="no-referrer" onclick="openPhotoZoom(this)">'
      })
      imagesHtml += '</div></div>'
    })
    // Combine single-pic categories into one row with overlaid labels
    var singleKeys = Object.keys(singleCats)
    if(singleKeys.length) {
      imagesHtml += '<div class="grid-row-cat">'
      imagesHtml += '<div class="grid-row-images">'
      singleKeys.forEach(function(cat) {
        var url = singleCats[cat][0]
        imagesHtml += '<div class="grid-row-img-labeled">'
        imagesHtml += '<img class="grid-row-img" data-src="'+url+'" referrerpolicy="no-referrer" onclick="openPhotoZoom(this)">'
        imagesHtml += '<span class="grid-row-img-label">'+cat+'</span>'
        imagesHtml += '</div>'
      })
      imagesHtml += '</div></div>'
    }
    imagesHtml += '</div>'
  } else {
    imagesHtml = '<div class="grid-row-images-wrap"><div class="grid-row-images">'
    pics.forEach(function(url) {
      imagesHtml += '<img class="grid-row-img" data-src="'+url+'" referrerpolicy="no-referrer" onclick="openPhotoZoom(this)">'
    })
    imagesHtml += '</div></div>'
  }

  var amenityHtml = ''
  if(ad.amenities && ad.amenities.length) {
    var displayList = getDisplayAmenities()
    var shownAmenities = displayList.length ? ad.amenities.filter(function(a){ return displayList.indexOf(a) !== -1 }) : ad.amenities
    if(shownAmenities.length) {
      amenityHtml = '<span class="grid-row-amenities">'
      shownAmenities.forEach(function(a){ amenityHtml += '<span class="amenity-bubble">'+a+'</span>' })
      amenityHtml += '</span>'
    }
  }

  var html = '<div class="grid-row-item" data-adid="'+ad._id+'">'
  html += '  <div class="grid-row-header">'
  html += '    <button class="grid-row-collapse-btn" onclick="toggleRowCollapse(this)" title="Collapse/expand"><i class="fa fa-chevron-up"></i></button>'
  html += '    <span class="grid-row-title" title="'+ad.title+'">'+ad.title+'</span>'
  html += '    <span class="grid-row-price">$'+ad.price+'</span>'
  html += '    <span class="grid-row-details">'+details.join(' &middot; ')+'</span>'
  var favColor = isFavorite(ad._id) ? '#e74c3c' : '#ccc'
  html += '    '+amenityHtml
  html += '    <button class="btn btn-xs" data-adid="'+ad._id+'" onclick="toggleFavoriteBtn(this)" title="Toggle favorite" style="margin-left:8px"><i class="fa fa-heart" style="color:'+favColor+'"></i></button>'
  var totalPics = (ad.picture_urls && ad.picture_urls.length) || (ad.picture_url ? 1 : 0)
  if(totalPics > 0) html += '    <button class="btn btn-xs btn-info" onclick="openPhotoGallery(gridAdPhotos(\''+ad._id+'\'))" title="Photo slideshow" style="margin-left:4px"><i class="fa fa-camera"></i> '+totalPics+'</button>'
  if(ad.platform === 'airbnb') {
    if(ad.availability) html += '    <button class="btn btn-xs btn-warning" onclick="openAvailabilityCalendar(\''+ad._id+'\')" title="Show 12-month availability" style="margin-left:4px"><i class="fa fa-calendar"></i> Availability</button>'
    else html += '    <button class="btn btn-xs btn-default" style="margin-left:4px;opacity:0.6" disabled title="Availability data not yet fetched. Refresh listing to update."><i class="fa fa-calendar-o"></i> Availability</button>'
  }
  if(ad.lat && ad.lon) html += '    <button class="btn btn-xs btn-info" onclick="googleMapsReady.then(function(){openListingMapPopup('+ad.lat+','+ad.lon+',\''+ad.title.replace(/'/g,"\\'")+'\')})" title="Show on map" style="margin-left:4px"><i class="fa fa-map-marker"></i> Map</button>'
  html += '    <a class="btn btn-xs btn-success" href="'+ad.url+'" target="_blank" style="margin-left:4px"><i class="fa fa-external-link"></i> Airbnb</a>'
  html += '  </div>'
  html += '  <div class="grid-row-body">'+imagesHtml+'</div>'
  html += '</div>'
  return html
}

function toggleRowCollapse(btn) {
  var $item = $(btn).closest('.grid-row-item')
  var isCollapsing = !$item.hasClass('collapsed')
  $item.toggleClass('collapsed')
  if(isCollapsing) {
    // Scroll so the listing header is at the top of the viewport
    var $cw = $('.content-wrapper')
    var itemTop = $item.offset().top
    var cwTop = $cw.offset().top
    var targetScroll = $cw.scrollTop() + (itemTop - cwTop) - 4
    $cw.animate({ scrollTop: targetScroll }, 250)
  }
}

function gridAdPhotos(adId) {
  var ad = _gridAds.find(function(a){ return a._id === adId })
  var urls = (ad && ad.picture_urls && ad.picture_urls.length) ? ad.picture_urls : (ad && ad.picture_url ? [ad.picture_url] : [])
  var cats = (ad && ad.photo_categories) ? groupPhotoCategories(ad.photo_categories) : null
  return {urls: urls, categories: cats}
}

function groupPhotoCategories(cats) {
  if(!cats) return null
  var grouped = {}
  Object.keys(cats).forEach(function(key) {
    var norm = key.replace(/\s*(image|photo|picture|img|pic)\s*\d+\s*$/i, '').replace(/^\s*(image|photo|picture|img|pic)\s*\d+\s*[-\u2013\u2014:.]?\s*(of\s+)?/i, '').trim()
    var gkey = norm || key
    if(!grouped[gkey]) grouped[gkey] = []
    grouped[gkey] = grouped[gkey].concat(cats[key])
  })
  return grouped
}
