var gridpage = `
    <section class="content-header">
      <button class="btn btn-light" type="button" onclick="loadpage('main', true);">
        <span class="fa fa-chevron-left" aria-hidden="true"></span>
      </button><h1 id="gridTitle" style="display: inline;vertical-align: middle;">
        Grid View
        <small></small>
      </h1>
      <div class="btn-group" style="margin-left:10px">
        <button id="gridModeCards" type="button" class="btn btn-primary btn-sm BStooltip" title="Card view" onclick="setGridMode('cards')"><i class="fa fa-th"></i></button>
        <button id="gridModeRows" type="button" class="btn btn-default btn-sm BStooltip" title="Row view with all photos" onclick="setGridMode('rows')"><i class="fa fa-bars"></i></button>
      </div>
      <a class="btn btn-default btn-sm BStooltip" title="Switch to Map view" href="#map" onclick="loadpage('map', true)"><i class="fa fa-map"></i></a>
      <button type="button" class="btn btn-primary btn-sm BStooltip" title="Filters & Settings" data-toggle="modal" data-target="#gridFiltersModal"><i class="fa fa-sliders"></i></button>
      <p class="grid-resultscount" style="display:inline;margin-left:10px;font-size:13px">Results: 0</p>
    </section>

    <section class="content">
      <div id="gridContainer"></div>
    </section>

<!-- Filters Modal -->
<div id="gridFiltersModal" class="modal fade" role="dialog" style="display:none">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title">Filters</h4>
      </div>
      <div class="modal-body">
        <div class="box-body">
          <form role="form" id="gridFiltersForm" data-toggle="validator">
            <input id="gridJobId" name="jobId" type="hidden">
            <div class="form-group">
              <label>Price</label>
              <input id="gridFromPrice" name="fromPrice" type="text" placeholder="Min">
              <input id="gridToPrice" name="toPrice" type="text" placeholder="Max">
            </div>
            <div class="form-group">
              <label>Min Bedrooms</label>
              <input id="gridMinBedrooms" name="minBedrooms" type="number" min="0" placeholder="Any" style="width:70px">
              <label style="margin-left:15px">Min Bathrooms</label>
              <input id="gridMinBathrooms" name="minBathrooms" type="number" min="0" placeholder="Any" style="width:70px">
            </div>
            <div class="form-group">
              <label>Min Beds</label>
              <input id="gridMinBeds" name="minBeds" type="number" min="0" placeholder="Any" style="width:70px">
            </div>
            <div class="form-group">
              <label>Search text</label>
              <input id="gridSearchText" name="searchText" type="text" placeholder="">
            </div>
            <div class="form-group">
              <input type="checkbox" id="gridMinPhotosCheck" value="2" onchange="$('#gridMinPhotos').val(this.checked?'2':'')">
              <label for="gridMinPhotosCheck">Hide listings with 1 or no photos</label>
              <input id="gridMinPhotos" name="minPhotos" type="hidden">
            </div>
            <div class="form-group">
              <label>AND Amenities <small style="color:#888">(all must match)</small></label>
              <input id="gridAmenities" name="amenities" type="hidden">
              <div id="gridAmenityBubblesAnd" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px"></div>
            </div>
            <div class="form-group">
              <label>OR Amenities <small style="color:#888">(at least one must match · right-click to move)</small></label>
              <input id="gridOrAmenities" name="orAmenities" type="hidden">
              <div id="gridAmenityBubblesOr" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px"></div>
            </div>
            <input type="submit" value="Submit" style="display:none;">
          </form>
        </div>
      </div>
      <div class="modal-footer">
        <div class="pull-left"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>
        <div class="pull-right"><button type="button" class="btn btn-primary" onclick="$('#gridFiltersForm').submit();">Filter</button></div>
      </div>
    </div>
  </div>
</div>
`;

var _gridMode = 'cards'
var _gridAds = []
var _gridRenderedCount = 0
var _gridBatchSize = 50
var _gridAllAmenities = new Set()
var _gridAmenityIdMap = {}
var _gridSavedDisplayAmenities = []
var _gridScrollTimer = null

function gridfunc() {
  $('#gridTitle').text(jobName + ' - Grid View')
  $('#gridJobId').val(jobId)

  if(urlParams.fromPrice) $('#gridFromPrice').val(urlParams.fromPrice)
  if(urlParams.toPrice) $('#gridToPrice').val(urlParams.toPrice)
  if(urlParams.minBedrooms) $('#gridMinBedrooms').val(urlParams.minBedrooms)
  if(urlParams.minBathrooms) $('#gridMinBathrooms').val(urlParams.minBathrooms)
  if(urlParams.minBeds) $('#gridMinBeds').val(urlParams.minBeds)
  if(urlParams.searchText) $('#gridSearchText').val(urlParams.searchText)
  if(urlParams.minPhotos) {
    $('#gridMinPhotos').val(urlParams.minPhotos)
    $('#gridMinPhotosCheck').prop('checked', true)
  }
  if(urlParams.amenities) $('#gridAmenities').val(urlParams.amenities)
  if(urlParams.orAmenities) $('#gridOrAmenities').val(urlParams.orAmenities)

  // Load displayAmenities from user account settings
  APIgetProfile(null, function(user){
    if(user && user.displayAmenities) _gridSavedDisplayAmenities = user.displayAmenities.split(',').map(function(s){return s.trim()}).filter(Boolean)
  })

  $(".BStooltip").tooltip({ trigger: 'hover' })

  $('#gridFiltersModal').on('show.bs.modal', function(){ updateGridAmenityBubbles() })

  $('#gridFiltersForm').on('submit', function(event) {
    event.preventDefault()
    $('#gridFiltersModal').modal('hide')
    loadGridAds($('#gridFiltersForm').serialize())
  })

  loadGridAds({...urlParams, jobId: jobId})
}

function gridUnload() {
  $('#gridFiltersForm').off('submit')
  $(window).off('scroll.gridInfinite')
  if(_gridScrollTimer) { clearTimeout(_gridScrollTimer); _gridScrollTimer = null }
}

function loadGridAds(params) {
  APIgetAds(params, function(ads) {
    _gridAds = ads
    _gridAllAmenities = new Set()
    _gridAmenityIdMap = {}
    ads.forEach(function(ad) {
      if(ad.amenities && ad.amenities.length)
        ad.amenities.forEach(function(a){ _gridAllAmenities.add(a) })
      if(ad.amenityIdMap) Object.assign(_gridAmenityIdMap, ad.amenityIdMap)
    })
    renderGrid()
  })
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
  $('.grid-resultscount').text('Results: ' + _gridAds.length)

  if(_gridMode === 'cards')
    container.html('<div class="grid-cards" id="gridInner"></div>')
  else
    container.html('<div class="grid-rows" id="gridInner"></div>')

  renderGridBatch()
  $(window).off('scroll.gridInfinite').on('scroll.gridInfinite', onGridScroll)
}

function onGridScroll() {
  if(_gridRenderedCount >= _gridAds.length) return
  if(_gridScrollTimer) return
  _gridScrollTimer = setTimeout(function(){
    _gridScrollTimer = null
    var scrollBottom = $(window).scrollTop() + $(window).height()
    var docHeight = $(document).height()
    if(scrollBottom >= docHeight - 600)
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
  _gridRenderedCount = end
  if(_gridRenderedCount < _gridAds.length)
    $('.grid-resultscount').text('Results: ' + _gridAds.length + ' (showing ' + _gridRenderedCount + ')')
  else
    $('.grid-resultscount').text('Results: ' + _gridAds.length)
}

function buildCardHtml(ad) {
  var img = ad.picture_url || ''
  var imgHtml = img ? '<img class="grid-card-img" src="'+img+'" referrerpolicy="no-referrer" loading="lazy">' : '<div class="grid-card-img grid-card-noimg"><i class="fa fa-image"></i></div>'
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
    var gridDisplayList = getGridDisplayAmenities()
    var shownAmenities = gridDisplayList.length ? ad.amenities.filter(function(a){ return gridDisplayList.indexOf(a) !== -1 }) : ad.amenities
    if(shownAmenities.length) {
      amenityHtml = '<div class="grid-card-amenities">'
      shownAmenities.forEach(function(a){ amenityHtml += '<span class="amenity-bubble">'+a+'</span>' })
      amenityHtml += '</div>'
    }
  }

  var html = '<div class="grid-card">'
  html += '  <div class="grid-card-img-wrap">'+imgHtml+'</div>'
  html += '  <div class="grid-card-body">'
  html += '    <div class="grid-card-title" title="'+ad.title+'">'+ad.title+'</div>'
  html += '    <div class="grid-card-price">$'+ad.price+'</div>'
  html += '    <div class="grid-card-details">'+details.join(' &middot; ')+'</div>'
  html += amenityHtml
  html += '    <div class="grid-card-actions">'
  html += '      '+photoBtnHtml
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

  var imagesHtml = '<div class="grid-row-images">'
  pics.forEach(function(url) {
    imagesHtml += '<img class="grid-row-img" src="'+url+'" referrerpolicy="no-referrer" loading="lazy" onclick="openPhotoGallery(gridAdPhotos(\''+ad._id+'\'))">'
  })
  imagesHtml += '</div>'

  var amenityHtml = ''
  if(ad.amenities && ad.amenities.length) {
    var gridDisplayList = getGridDisplayAmenities()
    var shownAmenities = gridDisplayList.length ? ad.amenities.filter(function(a){ return gridDisplayList.indexOf(a) !== -1 }) : ad.amenities
    if(shownAmenities.length) {
      amenityHtml = '<span class="grid-row-amenities">'
      shownAmenities.forEach(function(a){ amenityHtml += '<span class="amenity-bubble">'+a+'</span>' })
      amenityHtml += '</span>'
    }
  }

  var html = '<div class="grid-row-item">'
  html += '  <div class="grid-row-header">'
  html += '    <span class="grid-row-title" title="'+ad.title+'">'+ad.title+'</span>'
  html += '    <span class="grid-row-price">$'+ad.price+'</span>'
  html += '    <span class="grid-row-details">'+details.join(' &middot; ')+'</span>'
  html += '    '+amenityHtml
  html += '    <a class="btn btn-xs btn-success" href="'+ad.url+'" target="_blank" style="margin-left:8px"><i class="fa fa-external-link"></i> Airbnb</a>'
  html += '  </div>'
  html += imagesHtml
  html += '</div>'
  return html
}

function gridAdPhotos(adId) {
  var ad = _gridAds.find(function(a){ return a._id === adId })
  return (ad && ad.picture_urls && ad.picture_urls.length) ? ad.picture_urls : (ad && ad.picture_url ? [ad.picture_url] : [])
}

function updateGridAmenityBubbles() {
  var andContainer = $('#gridAmenityBubblesAnd')
  var orContainer = $('#gridAmenityBubblesOr')
  if(!andContainer.length && !orContainer.length) return
  var andSelected = ($('#gridAmenities').val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean)
  var orSelected = ($('#gridOrAmenities').val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean)
  var allSorted = Array.from(_gridAllAmenities).sort()
  var displayList = getGridDisplayAmenities()
  var sorted = displayList.length ? allSorted.filter(function(a){ return displayList.indexOf(a) !== -1 }) : allSorted
  var andHtml = '', orHtml = ''
  sorted.forEach(function(a) {
    var idTooltip = _gridAmenityIdMap[a] ? ' title="Airbnb ID: '+_gridAmenityIdMap[a]+'"' : ''
    var isAnd = andSelected.indexOf(a) !== -1
    var isOr = orSelected.indexOf(a) !== -1
    if(isAnd)
      andHtml += '<span class="amenity-filter-bubble active"'+idTooltip+' onclick="toggleGridAmenityFilter(this,\'and\')" oncontextmenu="moveGridAmenityFilter(event,this,\'and\')">'+a+'</span>'
    else if(isOr)
      orHtml += '<span class="amenity-filter-bubble active amenity-or"'+idTooltip+' onclick="toggleGridAmenityFilter(this,\'or\')" oncontextmenu="moveGridAmenityFilter(event,this,\'or\')">'+a+'</span>'
    else
      andHtml += '<span class="amenity-filter-bubble"'+idTooltip+' onclick="toggleGridAmenityFilter(this,\'and\')" oncontextmenu="moveGridAmenityFilter(event,this,\'and\')">'+a+'</span>'
  })
  andContainer.html(andHtml)
  orContainer.html(orHtml)
}

function toggleGridAmenityFilter(el, group) {
  $(el).toggleClass('active')
  syncGridAmenityInputs()
  updateGridAmenityBubbles()
}

function moveGridAmenityFilter(event, el, fromGroup) {
  event.preventDefault()
  var name = $(el).text()
  var toGroup = fromGroup === 'and' ? 'or' : 'and'
  var fromInput = toGroup === 'or' ? '#gridAmenities' : '#gridOrAmenities'
  var toInput = toGroup === 'or' ? '#gridOrAmenities' : '#gridAmenities'
  var fromList = ($(fromInput).val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean)
  fromList = fromList.filter(function(a){ return a !== name })
  $(fromInput).val(fromList.join(','))
  var toList = ($(toInput).val() || '').split(',').map(function(s){return s.trim()}).filter(Boolean)
  if(toList.indexOf(name) === -1) toList.push(name)
  $(toInput).val(toList.join(','))
  updateGridAmenityBubbles()
}

function syncGridAmenityInputs() {
  var andSelected = [], orSelected = []
  $('#gridAmenityBubblesAnd .amenity-filter-bubble.active').each(function(){ andSelected.push($(this).text()) })
  $('#gridAmenityBubblesOr .amenity-filter-bubble.active').each(function(){ orSelected.push($(this).text()) })
  $('#gridAmenities').val(andSelected.join(','))
  $('#gridOrAmenities').val(orSelected.join(','))
}

function getGridDisplayAmenities(){
  return _gridSavedDisplayAmenities
}
