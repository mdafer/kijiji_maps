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
  var visitLabel = isAirbnb ? 'Visit on Airbnb' : 'Visit on Kijiji'
  var html = '<div style="max-width:220px">'

  if(isAirbnb && ad.picture_url)
    html += '<img src="'+ad.picture_url+'" style="max-width:200px;max-height:150px;border-radius:4px;margin-bottom:5px" referrerpolicy="no-referrer">'

  html += '<h4>'+ad.title+'</h4><h4>$'+ad.price+'</h4>'

  if(isAirbnb) {
    var parts = []
    if(ad.bedrooms) parts.push(ad.bedrooms + ' bd')
    if(ad.beds) parts.push(ad.beds + ' beds')
    if(ad.bathrooms) parts.push(ad.bathrooms + ' ba')
    if(parts.length) html += '<p style="margin:2px 0;font-size:12px">'+parts.join(' &middot; ')+'</p>'

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

    var pics = ad.picture_urls || []
    if(pics.length > 1)
      html += '<button class="btn btn-xs btn-info" style="margin:4px 0;width:100%" onclick="openPhotoGallery(getAdById(\''+ad.airbnbId+'\').picture_urls)">Photos ('+pics.length+')</button>'
  }

  html += '<h4><a onclick="markAsViewed(null, \''+ad.url+'\')" href="'+ad.url+'" target="_blank">'+visitLabel+'</a></h4></div>'
  return html
}

function getAdById(airbnbId) {
  var m = _markers.find(function(mk){ return mk.adData && mk.adData.airbnbId === airbnbId })
  return m ? m.adData : null
}

function setMarkersByAds(map, ads, centerLocation = false) {
  if(!ads || !ads.length)
    return
  if(centerLocation)
    centerMapLocation(ads[0].lat, ads[0].lon)
  ads.forEach(ad=> {
    let icon ={url:"https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"}
    if(visitedUrls.includes(ad.url))
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
  function markerClickFunc(){
    infowindow.setContent(buildPopupHtml(ad))
    infowindow.open(map, marker)
    markAsViewed(marker, marker.url)
    google.maps.event.clearListeners(marker, 'click')
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.close(map, marker)
      google.maps.event.clearListeners(marker, 'click')
      google.maps.event.addListener(marker, 'click', markerClickFunc)
    })
  }
  google.maps.event.addListener(marker, 'click', markerClickFunc)
  google.maps.event.addListener(marker, 'dblclick', function() {
      markAsViewed(marker,this.url)
      window.open(this.url, '_blank')
      infowindow.close(map, marker)
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
  return markers.filter(marker => {return visitedUrls.includes(marker.url)})
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
  return _markers.filter(marker=>{return ads.find(ad=>ad.url==marker.url)})
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
var _markersHiddenByShape = []

function startDrawing(){
  if(_drawnShape) clearDrawnShape()
  if(!_drawingManager) {
    _drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: false,
      circleOptions: { fillColor: '#2196F3', fillOpacity: 0.15, strokeColor: '#2196F3', strokeWeight: 2, editable: true },
      polygonOptions: { fillColor: '#2196F3', fillOpacity: 0.15, strokeColor: '#2196F3', strokeWeight: 2, editable: true }
    })
    google.maps.event.addListener(_drawingManager, 'overlaycomplete', function(e){
      _drawnShape = e.overlay
      _drawingManager.setDrawingMode(null)
      applyShapeFilter()
      // Re-apply filter when shape is edited
      if(e.type === 'circle') {
        google.maps.event.addListener(_drawnShape, 'radius_changed', applyShapeFilter)
        google.maps.event.addListener(_drawnShape, 'center_changed', applyShapeFilter)
      } else {
        google.maps.event.addListener(_drawnShape.getPath(), 'set_at', applyShapeFilter)
        google.maps.event.addListener(_drawnShape.getPath(), 'insert_at', applyShapeFilter)
      }
      $('#drawAreaBtn').addClass('btn-primary').removeClass('btn-default')
      $('#clearShapeBtn').show()
    })
  }
  _drawingManager.setMap(map)
  // Show a simple choice: circle or polygon
  var mode = confirm('Click OK to draw a circle, or Cancel to draw a polygon.')
    ? google.maps.drawing.OverlayType.CIRCLE
    : google.maps.drawing.OverlayType.POLYGON
  _drawingManager.setDrawingMode(mode)
}

function applyShapeFilter(){
  // Show any previously hidden markers first
  _markersHiddenByShape.forEach(function(m){ m.setMap(map) })
  _markersHiddenByShape = []
  if(!_drawnShape) return
  _markers.forEach(function(marker){
    var pos = marker.getPosition()
    var inside = false
    if(_drawnShape.getBounds) {
      // Circle
      var center = _drawnShape.getCenter()
      var radius = _drawnShape.getRadius()
      inside = google.maps.geometry.spherical.computeDistanceBetween(pos, center) <= radius
    } else {
      // Polygon
      inside = google.maps.geometry.poly.containsLocation(pos, _drawnShape)
    }
    if(!inside && marker.getMap()) {
      marker.setMap(null)
      _markersHiddenByShape.push(marker)
    }
  })
  var visibleCount = _markers.length - _markersHiddenByShape.length
  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ visibleCount + ' (filtered by area)')
}

function clearDrawnShape(){
  if(_drawnShape) {
    _drawnShape.setMap(null)
    _drawnShape = null
  }
  if(_drawingManager) _drawingManager.setDrawingMode(null)
  // Restore hidden markers
  _markersHiddenByShape.forEach(function(m){ m.setMap(map) })
  _markersHiddenByShape = []
  $('#drawAreaBtn').removeClass('btn-primary').addClass('btn-default')
  $('#clearShapeBtn').hide()
  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length)
}