function centerMapLocation(lat, lng){
  const center = new google.maps.LatLng(lat, lng)
  // using global variable:
  map.panTo(center)
}

function MongoDateFromId(objectId) {
  return new Date(parseInt(objectId.substring(0, 8), 16) * 1000)
}

var _allAmenities = new Set()
var _amenityIdMap = {}
var _savedHideAmenities = []

function buildPopupHtml(listing) {
  var isAirbnb = listing.platform === 'airbnb'
  var isFacebook = listing.platform === 'facebook'
  var visitLabel = isAirbnb ? 'Visit on Airbnb' : isFacebook ? 'Visit on Facebook' : 'Visit on Kijiji'
  var visitUrl = isFacebook ? 'https://www.facebook.com/marketplace/item/' + listing.facebookId + '/' : listing.url
  var html = '<div style="max-width:220px">'

  if(listing.picture_url)
    html += '<img src="'+listing.picture_url+'" style="max-width:200px;max-height:150px;border-radius:4px;margin-bottom:5px" referrerpolicy="no-referrer">'

  html += '<h4>'+listing.title+'</h4><h4>$'+listing.price+'</h4>'

  if(isAirbnb || isFacebook) {
    var parts = []
    if(listing.bedrooms) parts.push(listing.bedrooms + ' bd')
    if(listing.beds) parts.push(listing.beds + ' beds')
    if(listing.bathrooms) parts.push(listing.bathrooms + ' ba')
    if(parts.length) html += '<p style="margin:2px 0;font-size:12px">'+parts.join(' &middot; ')+'</p>'

    if(listing.categories && listing.categories.length)
      html += '<p style="margin:2px 0;font-size:11px;color:#666">'+listing.categories.join(', ')+'</p>'

    if(listing.amenities && listing.amenities.length) {
      var hideList = getHideAmenities()
      var amenitiesForPopup = hideList.length ? listing.amenities.filter(function(a){ return hideList.indexOf(a) === -1 }) : listing.amenities
      if(amenitiesForPopup.length) {
        html += '<div style="margin:4px 0;display:flex;flex-wrap:wrap;gap:3px">'
        amenitiesForPopup.forEach(function(a){ html += '<span class="amenity-bubble">'+a+'</span>' })
        html += '</div>'
      }
      listing.amenities.forEach(function(a){ _allAmenities.add(a) })
      if(listing.amenityIdMap) Object.assign(_amenityIdMap, listing.amenityIdMap)
    }

    // Photo gallery — use facebookId or airbnbId as lookup key
    var listingLookupId = listing.airbnbId || listing.facebookId
    var pics = listing.picture_urls || []
    if(pics.length > 1 && listingLookupId)
      html += '<button class="btn btn-xs btn-info" style="margin:4px 0;width:100%" onclick="openPhotoGallery(getListingPhotosData(\''+listingLookupId+'\'))">Photos ('+pics.length+')</button>'

    if(isAirbnb) {
      if(listing.availability)
        html += '<button class="btn btn-xs btn-warning" style="margin:4px 0;width:100%" onclick="openAvailabilityCalendar(\''+listing._id+'\')"><i class="fa fa-calendar"></i> Availability (12m)</button>'
      else
        html += '<button class="btn btn-xs btn-default" style="margin:4px 0;width:100%;opacity:0.6" disabled title="Availability data not yet fetched. Refresh listing to update."><i class="fa fa-calendar-o"></i> Availability</button>'
    }

    if(listing.seller)
      html += '<p style="margin:2px 0;font-size:11px;color:#888">Seller: '+listing.seller+'</p>'
  }

  var favColor = isFavorite(listing._id) ? '#e74c3c' : '#ccc'
  var disColor = isDisliked(listing._id) ? '#34495e' : '#ccc'
  html += '<div style="margin:4px 0;display:flex;gap:6px;align-items:center">'
  html += '<button class="btn btn-xs" data-listingid="'+listing._id+'" onclick="toggleFavoriteBtn(this)" title="Toggle favorite"><i class="fa fa-heart" style="color:'+favColor+'"></i></button>'
  html += '<button class="btn btn-xs" data-listingid="'+listing._id+'" onclick="toggleDislikeBtn(this)" title="Toggle dislike"><i class="fa fa-thumbs-down" style="color:'+disColor+'"></i></button>'
  html += '<a onclick="markAsViewed(null, \''+listing.url+'\')" href="'+visitUrl+'" target="_blank">'+visitLabel+'</a>'
  html += '</div>'
  html += '<button class="btn btn-xs btn-default" style="margin:2px 0;width:100%" onclick="viewInList(\''+listing._id+'\')"><i class="fa fa-list"></i> View in list</button>'
  html += '</div>'
  return html
}

function viewInList(listingId) {
  _focusListingId = listingId
  if(typeof switchToGridMode === 'function') {
    switchToGridMode('rows')
  }
}

function scrollToFocusedListing() {
  if(!_focusListingId) return
  var listingId = _focusListingId
  _focusListingId = null
  // Ensure the listing's batch is rendered (it may be beyond the current batch)
  var idx = _gridListings.findIndex(function(a){ return a._id === listingId })
  if(idx === -1) return
  while(_gridRenderedCount <= idx) {
    renderGridBatch()
  }
  var $el = $('[data-listingid="'+listingId+'"]')
  if(!$el.length) return
  // Uncollapse if it's a row item that's collapsed
  if($el.hasClass('collapsed')) $el.removeClass('collapsed')
  var $cw = $('.content-wrapper')
  var targetScroll = $cw.scrollTop() + ($el.offset().top - $cw.offset().top) - 4
  $cw.animate({ scrollTop: targetScroll }, 300)
  // Brief highlight
  $el.css('outline', '2px solid #2196F3')
  setTimeout(function(){ $el.css('outline', '') }, 2000)
}

function getListingById(id) {
  var m = _markers.find(function(mk){ return mk.listingData && (mk.listingData.airbnbId === id || mk.listingData.facebookId === id) })
  return m ? m.listingData : null
}

function getListingPhotosData(id) {
  var listing = getListingById(id)
  if(!listing) return {urls: [], categories: null}
  var urls = (listing.picture_urls && listing.picture_urls.length) ? listing.picture_urls : (listing.picture_url ? [listing.picture_url] : [])
  return {urls: urls, categories: typeof groupPhotoCategories === 'function' ? groupPhotoCategories(listing.photo_categories) : listing.photo_categories}
}

function setMarkersByListings(map, listings, centerLocation = false) {
  if(!listings || !listings.length)
    return
  if(centerLocation)
    centerMapLocation(listings[0].lat, listings[0].lon)
  var visitedSet = new Set(visitedUrls)
  listings.forEach(listing=> {
    let icon ={url:"https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"}
    if(visitedSet.has(listing.url))
      icon.url = "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png"
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(listing.lat, listing.lon),
      icon, map: map, title: listing.address, url: listing.url
    });
    marker.listingData = listing
    _markers.push(marker)

    if(listing.amenities) listing.amenities.forEach(function(a){ _allAmenities.add(a) })
    if(listing.amenityIdMap) Object.assign(_amenityIdMap, listing.amenityIdMap)

    bindInfoWindow(marker, map, infowindow, listing)
  })
  updateAmenityBubbles()
}

var bindInfoWindow = function(marker, map, infowindow, listing) {
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(buildPopupHtml(listing))
    infowindow.open(map, marker)
    markAsViewed(marker, marker.url)
  })
  google.maps.event.addListener(marker, 'dblclick', function() {
    markAsViewed(marker, this.url)
    window.open(this.url, '_blank')
    infowindow.close()
  })
}

function markAsViewed(marker, url)
{
  if(visitedUrls.includes(url))
    return
  visitedUrls.push(url)
  localStorage.setItem('visitedUrls'+jobId, JSON.stringify(visitedUrls))
  if(!marker)
    marker = _markers.find(marker => {return marker.url === url})
  if(localStorage.getItem('hideMarkers')=='true')
    marker.setMap(null);
  marker.setIcon("https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png")
  return true
}

function getViewedMarkers(markers=null)
{
  markers = markers || _markers
  var visitedSet = new Set(visitedUrls)
  return markers.filter(function(marker){ return visitedSet.has(marker.url) })
}

/*function mapCheckNewListings()
{
  let retVal = confirm("This does not remove old listings, it just listings newest one. To reset all results, click the 'Reset All Listings From Kijiji' button.")
  if(!retVal)
    return false
  $('#informationModal').modal('show')
  APIcheckLatestListings('{"jobId":"Denise"}')
  return true
}*/

function getMarkersFromListings(listings)
{
  if(!listings || (Array.isArray(listings) && listings.length==0))
    return
  if(!Array.isArray(listings))
    listings=[listings]
  if(typeof listings[0] === 'string' || listings[0] instanceof String)
    listings.forEach((l,index)=>listings[index]={url:l})
  var listingUrls = new Set(listings.map(function(l){ return l.url }))
  return _markers.filter(function(marker){ return listingUrls.has(marker.url) })
}

function isTouchScreen(){
  return 'ontouchstart' in window || navigator.maxTouchPoints || (window.DocumentTouch && document instanceof DocumentTouch)
}

function updateAmenityBubbles(){
  var andContainer = $('#amenityBubblesAnd')
  var orContainer = $('#amenityBubblesOr')
  if(!andContainer.length && !orContainer.length) return
  var andSelected = parseAmenityList($('#amenities').val())
  var orSelected = parseAmenityList($('#orAmenities').val())
  var allSorted = Array.from(_allAmenities).sort()
  var hideList = getHideAmenities()
  var sorted = hideList.length ? allSorted.filter(function(a){ return hideList.indexOf(a) === -1 }) : allSorted
  var searchTerm = ($('#amenitySearch').val() || '').toLowerCase()
  if(searchTerm) sorted = sorted.filter(function(a){ return a.toLowerCase().indexOf(searchTerm) !== -1 })
  var andHtml = '', orHtml = ''
  sorted.forEach(function(a){
    var idTooltip = _amenityIdMap[a] ? ' title="Airbnb ID: '+_amenityIdMap[a]+'"' : ''
    var isAnd = andSelected.indexOf(a) !== -1
    var isOr = orSelected.indexOf(a) !== -1
    if(isAnd)
      andHtml += '<span class="amenity-filter-bubble active"'+idTooltip+' onclick="toggleAmenityFilter(this,\'and\')" oncontextmenu="moveAmenityFilter(event,this,\'and\')">'+a+'</span>'
    else if(isOr)
      orHtml += '<span class="amenity-filter-bubble active amenity-or"'+idTooltip+' onclick="toggleAmenityFilter(this,\'or\')" oncontextmenu="moveAmenityFilter(event,this,\'or\')">'+a+'</span>'
    else
      andHtml += '<span class="amenity-filter-bubble"'+idTooltip+' onclick="toggleAmenityFilter(this,\'and\')" oncontextmenu="moveAmenityFilter(event,this,\'and\')">'+a+'</span>'
  })
  andContainer.html(andHtml)
  orContainer.html(orHtml)
}

function toggleAmenityFilter(el, group){
  var $el = $(el)
  if($el.hasClass('active')){
    $el.removeClass('active')
    syncAmenityInputs()
    updateAmenityBubbles()
  } else {
    $el.addClass('active')
    syncAmenityInputs()
    updateAmenityBubbles()
  }
}

function moveAmenityFilter(event, el, fromGroup){
  event.preventDefault()
  var name = $(el).text()
  var toGroup = fromGroup === 'and' ? 'or' : 'and'
  var fromInput = toGroup === 'or' ? '#amenities' : '#orAmenities'
  var toInput = toGroup === 'or' ? '#orAmenities' : '#amenities'
  // Remove from current group
  var fromList = parseAmenityList($(fromInput).val()).filter(function(a){ return a !== name })
  $(fromInput).val(fromList.length ? JSON.stringify(fromList) : '')
  // Add to target group
  var toList = parseAmenityList($(toInput).val())
  if(toList.indexOf(name) === -1) toList.push(name)
  $(toInput).val(toList.length ? JSON.stringify(toList) : '')
  updateAmenityBubbles()
}

function syncAmenityInputs(){
  var andSelected = [], orSelected = []
  $('#amenityBubblesAnd .amenity-filter-bubble.active').each(function(){ andSelected.push($(this).text()) })
  $('#amenityBubblesOr .amenity-filter-bubble.active').each(function(){ orSelected.push($(this).text()) })
  $('#amenities').val(andSelected.length ? JSON.stringify(andSelected) : '')
  $('#orAmenities').val(orSelected.length ? JSON.stringify(orSelected) : '')
}

function getHideAmenities(){
  return _savedHideAmenities
}

// --- Drawing tools for geographic filtering ---
var _drawingManager = null
var _drawnShape = null
var _shapeFilterGeo = null
var _markersHiddenByShape = []

function _extractShapeGeo(shape) {
  if(!shape) return null
  if(shape.getBounds) {
    var c = shape.getCenter()
    return { type: 'circle', lat: c.lat(), lng: c.lng(), radius: shape.getRadius() }
  } else {
    var paths = []
    shape.getPath().forEach(function(p){ paths.push({ lat: p.lat(), lng: p.lng() }) })
    return { type: 'polygon', paths: paths }
  }
}

function hasActiveShapeFilter() {
  return !!(_drawnShape || _shapeFilterGeo)
}

function isInsideShapeFilter(lat, lon) {
  var geo = _shapeFilterGeo
  if(!geo && _drawnShape) geo = _extractShapeGeo(_drawnShape)
  if(!geo) return true
  if(geo.type === 'circle') {
    var center = new google.maps.LatLng(geo.lat, geo.lng)
    var pos = new google.maps.LatLng(lat, lon)
    return google.maps.geometry.spherical.computeDistanceBetween(pos, center) <= geo.radius
  } else {
    var poly = new google.maps.Polygon({ paths: geo.paths })
    var pos = new google.maps.LatLng(lat, lon)
    return google.maps.geometry.poly.containsLocation(pos, poly)
  }
}

var _shapeFilterDebounceTimer = null
function _debouncedApplyShapeFilter() {
  if(_shapeFilterDebounceTimer) clearTimeout(_shapeFilterDebounceTimer)
  _shapeFilterDebounceTimer = setTimeout(applyShapeFilter, 80)
}

function _bindShapeEditListeners(shape) {
  if(shape.getBounds) {
    google.maps.event.addListener(shape, 'radius_changed', _debouncedApplyShapeFilter)
    google.maps.event.addListener(shape, 'center_changed', _debouncedApplyShapeFilter)
  } else {
    google.maps.event.addListener(shape.getPath(), 'set_at', _debouncedApplyShapeFilter)
    google.maps.event.addListener(shape.getPath(), 'insert_at', _debouncedApplyShapeFilter)
  }
}

function startDrawing(){
  if(!map) { showAlertModal('Map Not Open', 'Open the map view first to draw an area.'); return }
  if(_drawnShape) clearDrawnShape()
  if(!_drawingManager) {
    _drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: false,
      circleOptions: { fillColor: '#2196F3', fillOpacity: 0.15, strokeColor: '#2196F3', strokeWeight: 2, editable: true },
      polygonOptions: { fillColor: '#2196F3', fillOpacity: 0.15, strokeColor: '#2196F3', strokeWeight: 2, editable: true }
    })
    google.maps.event.addListener(_drawingManager, 'overlaycomplete', function(e){
      _drawnShape = e.overlay
      _shapeFilterGeo = _extractShapeGeo(_drawnShape)
      _drawingManager.setDrawingMode(null)
      applyShapeFilter()
      _bindShapeEditListeners(_drawnShape)
      $('#drawAreaBtn').addClass('btn-primary').removeClass('btn-default')
      $('#clearShapeBtn').show()
    })
  }
  _drawingManager.setMap(map)
  showDrawShapeModal(function(mode) {
    _drawingManager.setDrawingMode(mode)
  })
}

function restoreShapeOnMap() {
  if(!_shapeFilterGeo || !map) return
  if(_drawnShape) {
    // Re-attach existing shape object
    _drawnShape.setMap(map)
    _bindShapeEditListeners(_drawnShape)
  } else {
    // Recreate from saved geometry
    var opts = { fillColor: '#2196F3', fillOpacity: 0.15, strokeColor: '#2196F3', strokeWeight: 2, editable: true, map: map }
    if(_shapeFilterGeo.type === 'circle') {
      _drawnShape = new google.maps.Circle(Object.assign(opts, { center: { lat: _shapeFilterGeo.lat, lng: _shapeFilterGeo.lng }, radius: _shapeFilterGeo.radius }))
    } else {
      _drawnShape = new google.maps.Polygon(Object.assign(opts, { paths: _shapeFilterGeo.paths }))
    }
    _bindShapeEditListeners(_drawnShape)
  }
  applyShapeFilter()
  $('#drawAreaBtn').addClass('btn-primary').removeClass('btn-default')
  $('#clearShapeBtn').show()
}

function applyShapeFilter(){
  _markersHiddenByShape.forEach(function(m){ m.setMap(map) })
  _markersHiddenByShape = []
  if(!_drawnShape) return
  _shapeFilterGeo = _extractShapeGeo(_drawnShape)
  saveShapeGeo()
  _markers.forEach(function(marker){
    var pos = marker.getPosition()
    var inside = false
    if(_drawnShape.getBounds) {
      var center = _drawnShape.getCenter()
      var radius = _drawnShape.getRadius()
      inside = google.maps.geometry.spherical.computeDistanceBetween(pos, center) <= radius
    } else {
      inside = google.maps.geometry.poly.containsLocation(pos, _drawnShape)
    }
    if(!inside && marker.getMap()) {
      marker.setMap(null)
      _markersHiddenByShape.push(marker)
    }
  })
  var visibleCount = _markers.length - _markersHiddenByShape.length
  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ visibleCount + ' (area filtered)')
}

function clearDrawnShape(silent){
  if(_drawnShape) {
    _drawnShape.setMap(null)
    _drawnShape = null
  }
  _shapeFilterGeo = null
  saveShapeGeo()
  if(_drawingManager) _drawingManager.setDrawingMode(null)
  _markersHiddenByShape.forEach(function(m){ if(map) m.setMap(map) })
  _markersHiddenByShape = []
  $('#drawAreaBtn').removeClass('btn-primary').addClass('btn-default')
  $('#clearShapeBtn').hide()
  if(silent) return
  // If on grid view, reload listings without shape filter
  if(window.currentState === 'grid' && typeof loadGridListings === 'function') {
    loadGridListings($('#filtersForm').serialize())
  } else {
    $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length)
  }
}