var dislikespage = toolbarHtml + `
    <section class="content">
      <div id="disJobFilters" style="margin-bottom:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
        <label style="margin:0">Searches:</label>
      </div>
      <div id="gridContainer"></div>
      <input id="pac-input" class="controls" type="text" placeholder="Focus map on location" />
      <div id="map"></div>
    </section>
`;

var _disJobs = []
var _disViewMode = 'grid'
var _disAds = []

function dislikesfunc() {
  _favoritesOnly = false
  _disViewMode = 'grid'
  setViewMode('grid')
  $('#pageTitle').text('Disliked')
  $('#map').hide()
  $('#pac-input').hide()
  // These toolbar controls don't apply to the dislikes view.
  $('#favFilterBtn').hide()
  $('#dislikeFilterBtn').hide()
  $('#shareViewBtn').hide()

  $(".BStooltip").tooltip({ trigger: 'hover', container: 'body' })

  APIgetProfile(null, function(user){
    if(user && user.displayAmenities) _savedDisplayAmenities = user.displayAmenities.split(',').map(function(s){return s.trim()}).filter(Boolean)
    _disJobs = (user && user.jobs) ? user.jobs : []
    $('#disJobFilters').find('label').remove()
    _disJobs.forEach(function(j){
      var name = $('<span>').text(j.name).html()
      $('#disJobFilters').append(
        '<label style="margin:0;cursor:pointer;font-weight:normal">' +
        '<input type="checkbox" class="dis-job-check" value="'+j.id+'" data-name="'+name+'" checked onchange="loadDislikedAds()" style="margin-right:3px">' +
        name + '</label>'
      )
    })
    loadDislikedAds()
  })

  $('#filtersModal').on('show.bs.modal', function(){ updateAmenityBubbles() })

  $('#filtersForm').on('submit', function(event) {
    event.preventDefault()
    $('#filtersModal').modal('hide')
    saveFilters()
    updateFilterIndicator()
    loadDislikedAds()
  })
}

function getSelectedDisJobIds() {
  var ids = []
  $('.dis-job-check:checked').each(function(){ ids.push($(this).val()) })
  return ids
}

function loadDislikedAds() {
  var params = {}

  var selectedIds = getSelectedDisJobIds()
  if(selectedIds.length) params.jobIds = selectedIds.join(',')

  var fp = $('#fromPrice').val()
  var tp = $('#toPrice').val()
  if(fp) params.fromPrice = fp
  if(tp) params.toPrice = tp
  var mb = $('#minBedrooms').val()
  var mba = $('#minBathrooms').val()
  var mbe = $('#minBeds').val()
  if(mb) params.minBedrooms = mb
  if(mba) params.minBathrooms = mba
  if(mbe) params.minBeds = mbe
  var st = $('#searchText').val()
  if(st) params.searchText = st
  var mp = $('#minPhotos').val()
  if(mp) params.minPhotos = mp
  var am = $('#amenities').val()
  if(am) params.amenities = am
  var oam = $('#orAmenities').val()
  if(oam) params.orAmenities = oam

  APIgetDislikedAds(params, function(ads) {
    var seen = {}
    ads = ads.filter(function(ad){ if(seen[ad._id]) return false; seen[ad._id] = true; return true })
    _disAds = ads
    _allAmenities = new Set()
    _amenityIdMap = {}
    ads.forEach(function(ad) {
      if(ad.amenities && ad.amenities.length)
        ad.amenities.forEach(function(a){ _allAmenities.add(a) })
      if(ad.amenityIdMap) Object.assign(_amenityIdMap, ad.amenityIdMap)
    })
    showDislikedView()
  })
}

function showDislikedView() {
  var ads = _disAds
  if(hasActiveShapeFilter()) {
    ads = ads.filter(function(ad){ return isInsideShapeFilter(ad.lat, ad.lon) })
  }
  if(_disViewMode === 'map') {
    _gridAds = ads
    $('#gridContainer').hide()
    $('#pac-input').show()
    $('#map').show()
    showDislikedMap(ads)
  } else {
    $('#map').hide()
    $('#pac-input').hide()
    $('#gridContainer').show()
    _gridAds = ads
    renderGrid()
  }
}

function showDislikedMap(ads) {
  googleMapsReady.then(function() {
    var mapDiv = document.getElementById('map')
    if(!map) {
      map = new google.maps.Map(mapDiv, {
        center: new google.maps.LatLng(43.5890, -79.6441),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      })
      infowindow = new google.maps.InfoWindow({ disableAutoPan: true, content: '' })
      var input = document.getElementById('pac-input')
      var searchBox = new google.maps.places.SearchBox(input)
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(input)
      map.addListener('bounds_changed', function(){ searchBox.setBounds(map.getBounds()) })
      searchBox.addListener('places_changed', function(){
        var places = searchBox.getPlaces()
        if(!places.length) return
        var bounds = new google.maps.LatLngBounds()
        places.forEach(function(place){
          if(!place.geometry) return
          if(place.geometry.viewport) bounds.union(place.geometry.viewport)
          else bounds.extend(place.geometry.location)
        })
        map.fitBounds(bounds)
      })
    } else {
      $('#pac-input').remove()
      $(mapDiv).replaceWith(map.getDiv())
      $(map.getDiv()).attr('id', 'map')
    }
    $('#map').height(function() {
      var cw = $('.content-wrapper')
      return cw.innerHeight() - ($(this).offset().top - cw.offset().top + cw.scrollTop())
    })

    visitedUrls = visitedUrls || []
    clearMapMarkers('all')
    if(ads.length) {
      setMarkersByAds(map, ads, true)
    }
    var countText = 'Results: ' + ads.length + ' (disliked)'
    if(hasActiveShapeFilter()) countText += ' (area filtered)'
    $('.resultscount').text(countText)

    if(hasActiveShapeFilter()) restoreShapeOnMap()
  })
}

function switchDislikedView(mode) {
  _disViewMode = mode
  if(mode === 'map') {
    setViewMode('map')
  } else {
    setViewMode('grid')
  }
  showDislikedView()
}

function dislikesUnload() {
  $('#filtersForm').off('submit')
  $('#filtersModal').off('show.bs.modal')
  $('.content-wrapper').off('scroll.gridInfinite')
  if(_drawingManager) _drawingManager.setMap(null)
  if(_drawnShape) {
    _shapeFilterGeo = _extractShapeGeo(_drawnShape)
    _drawnShape.setMap(null)
  }
}
