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
var _savedDisplayAmenities = []

function buildPopupHtml(ad) {
  var isAirbnb = ad.platform === 'airbnb'
  var isFacebook = ad.platform === 'facebook'
  var visitLabel = isAirbnb ? 'Visit on Airbnb' : isFacebook ? 'Visit on Facebook' : 'Visit on Kijiji'
  var visitUrl = isFacebook ? 'https://www.facebook.com/marketplace/item/' + ad.facebookId + '/' : ad.url
  var html = '<div style="max-width:220px">'

  if(ad.picture_url)
    html += '<img src="'+ad.picture_url+'" style="max-width:200px;max-height:150px;border-radius:4px;margin-bottom:5px" referrerpolicy="no-referrer">'

  html += '<h4>'+ad.title+'</h4><h4>$'+ad.price+'</h4>'

  if(isAirbnb || isFacebook) {
    var parts = []
    if(ad.bedrooms) parts.push(ad.bedrooms + ' bd')
    if(ad.beds) parts.push(ad.beds + ' beds')
    if(ad.bathrooms) parts.push(ad.bathrooms + ' ba')
    if(parts.length) html += '<p style="margin:2px 0;font-size:12px">'+parts.join(' &middot; ')+'</p>'

    if(ad.categories && ad.categories.length)
      html += '<p style="margin:2px 0;font-size:11px;color:#666">'+ad.categories.join(', ')+'</p>'

    if(ad.amenities && ad.amenities.length) {
      var displayList = getDisplayAmenities()
      var amenitiesForPopup = displayList.length ? ad.amenities.filter(function(a){ return displayList.indexOf(a) !== -1 }) : ad.amenities
      if(amenitiesForPopup.length) {
        html += '<div style="margin:4px 0;display:flex;flex-wrap:wrap;gap:3px">'
        amenitiesForPopup.forEach(function(a){ html += '<span class="amenity-bubble">'+a+'</span>' })
        html += '</div>'
      }
      ad.amenities.forEach(function(a){ _allAmenities.add(a) })
      if(ad.amenityIdMap) Object.assign(_amenityIdMap, ad.amenityIdMap)
    }

    // Photo gallery — use facebookId or airbnbId as lookup key
    var adLookupId = ad.airbnbId || ad.facebookId
    var pics = ad.picture_urls || []
    if(pics.length > 1 && adLookupId)
      html += '<button class="btn btn-xs btn-info" style="margin:4px 0;width:100%" onclick="openPhotoGallery(getAdPhotosData(\''+adLookupId+'\'))">Photos ('+pics.length+')</button>'

    if(isAirbnb) {
      if(ad.availability)
        html += '<button class="btn btn-xs btn-warning" style="margin:4px 0;width:100%" onclick="openAvailabilityCalendar(\''+ad._id+'\')"><i class="fa fa-calendar"></i> Availability (12m)</button>'
      else
        html += '<button class="btn btn-xs btn-default" style="margin:4px 0;width:100%;opacity:0.6" disabled title="Availability data not yet fetched. Refresh listing to update."><i class="fa fa-calendar-o"></i> Availability</button>'
    }

    if(ad.seller)
      html += '<p style="margin:2px 0;font-size:11px;color:#888">Seller: '+ad.seller+'</p>'
  }

  var favColor = isFavorite(ad._id) ? '#e74c3c' : '#ccc'
  html += '<div style="margin:4px 0;display:flex;gap:6px;align-items:center">'
  html += '<button class="btn btn-xs" data-adid="'+ad._id+'" onclick="toggleFavoriteBtn(this)" title="Toggle favorite"><i class="fa fa-heart" style="color:'+favColor+'"></i></button>'
  html += '<a onclick="markAsViewed(null, \''+ad.url+'\')" href="'+visitUrl+'" target="_blank">'+visitLabel+'</a>'
  html += '</div>'
  html += '<button class="btn btn-xs btn-default" style="margin:2px 0;width:100%" onclick="viewInList(\''+ad._id+'\')"><i class="fa fa-list"></i> View in list</button>'
  html += '</div>'
  return html
}

function viewInList(adId) {
  _focusAdId = adId
  if(typeof switchToGridMode === 'function') {
    switchToGridMode('rows')
  }
}

function scrollToFocusedAd() {
  if(!_focusAdId) return
  var adId = _focusAdId
  _focusAdId = null
  // Ensure the ad's batch is rendered (it may be beyond the current batch)
  var idx = _gridAds.findIndex(function(a){ return a._id === adId })
  if(idx === -1) return
  while(_gridRenderedCount <= idx) {
    renderGridBatch()
  }
  var $el = $('[data-adid="'+adId+'"]')
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

function getAdById(id) {
  var m = _markers.find(function(mk){ return mk.adData && (mk.adData.airbnbId === id || mk.adData.facebookId === id) })
  return m ? m.adData : null
}

function getAdPhotosData(id) {
  var ad = getAdById(id)
  if(!ad) return {urls: [], categories: null}
  var urls = (ad.picture_urls && ad.picture_urls.length) ? ad.picture_urls : (ad.picture_url ? [ad.picture_url] : [])
  return {urls: urls, categories: typeof groupPhotoCategories === 'function' ? groupPhotoCategories(ad.photo_categories) : ad.photo_categories}
}

function setMarkersByAds(map, ads, centerLocation = false) {
  if(!ads || !ads.length)
    return
  if(centerLocation)
    centerMapLocation(ads[0].lat, ads[0].lon)
  var visitedSet = new Set(visitedUrls)
  ads.forEach(ad=> {
    let icon ={url:"https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"}
    if(visitedSet.has(ad.url))
      icon.url = "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png"
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(ad.lat, ad.lon),
      icon, map: map, title: ad.address, url: ad.url
    });
    marker.adData = ad
    _markers.push(marker)

    if(ad.amenities) ad.amenities.forEach(function(a){ _allAmenities.add(a) })
    if(ad.amenityIdMap) Object.assign(_amenityIdMap, ad.amenityIdMap)

    bindInfoWindow(marker, map, infowindow, ad)
  })
  updateAmenityBubbles()
}

var bindInfoWindow = function(marker, map, infowindow, ad) {
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(buildPopupHtml(ad))
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

/*function mapCheckNewAds()
{
  let retVal = confirm("This does not remove old ads, it just ads newest one. To reset all results, click the 'Reset All Ads From Kijiji' button.")
  if(!retVal)
    return false
  $('#informationModal').modal('show')
  APIcheckLatestAds('{"jobId":"Denise"}')
  return true
}*/

function getMarkersFromAds(ads)
{
  if(!ads || (Array.isArray(ads) && ads.length==0))
    return
  if(!Array.isArray(ads))
    ads=[ads]
  if(typeof ads[0] === 'string' || ads[0] instanceof String)
    ads.forEach((ad,index)=>ads[index]={url:ad})
  var adUrls = new Set(ads.map(function(ad){ return ad.url }))
  return _markers.filter(function(marker){ return adUrls.has(marker.url) })
}

function isTouchScreen(){
  return 'ontouchstart' in window || navigator.maxTouchPoints || (window.DocumentTouch && document instanceof DocumentTouch)
}

function updateAmenityBubbles(){
  var andContainer = $('#amenityBubblesAnd')
  var orContainer = $('#amenityBubblesOr')
  if(!andContainer.length && !orContainer.length) return
  var andSelected = (($('#amenities').val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean))
  var orSelected = (($('#orAmenities').val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean))
  var allSorted = Array.from(_allAmenities).sort()
  var displayList = getDisplayAmenities()
  var sorted = displayList.length ? allSorted.filter(function(a){ return displayList.indexOf(a) !== -1 }) : allSorted
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
  var fromList = ($(fromInput).val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean)
  fromList = fromList.filter(function(a){ return a !== name })
  $(fromInput).val(fromList.join(','))
  // Add to target group
  var toList = ($(toInput).val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean)
  if(toList.indexOf(name) === -1) toList.push(name)
  $(toInput).val(toList.join(','))
  updateAmenityBubbles()
}

function syncAmenityInputs(){
  var andSelected = [], orSelected = []
  $('#amenityBubblesAnd .amenity-filter-bubble.active').each(function(){ andSelected.push($(this).text()) })
  $('#amenityBubblesOr .amenity-filter-bubble.active').each(function(){ orSelected.push($(this).text()) })
  $('#amenities').val(andSelected.join(','))
  $('#orAmenities').val(orSelected.join(','))
}

function getDisplayAmenities(){
  return _savedDisplayAmenities
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
  // If on grid view, reload ads without shape filter
  if(window.currentState === 'grid' && typeof loadGridAds === 'function') {
    loadGridAds($('#filtersForm').serialize())
  } else {
    $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length)
  }
}