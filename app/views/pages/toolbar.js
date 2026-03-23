var toolbarHtml = `
    <section class="content-header">
      <button class="btn btn-light" type="button" onclick="loadpage('main', true);">
        <span class="fa fa-chevron-left" aria-hidden="true"></span>
      </button><h1 id="pageTitle" style="display: inline;vertical-align: middle;">
        <small></small>
      </h1>

      <input type="file" style="display:none" id="importViewedbtn">
      <div class="btn-group">
        <button id="hideViewedbtn" type="button" class="btn btn-default btn-sm BStooltip" rel="tooltip" data-placement="top" title="Click to hide viewed ads" onclick="hideViewedMarkers()"><i id="hideViewedicon" class="fa fa-eye"></i></button>
        <div class="btn-group">
          <button type="button" style="height:30px" class="btn btn-default btn-sm dropdown-toggle BStooltip" data-placement="top" title="Viewed ads settings" data-toggle="dropdown" aria-expanded="true">
            <span class="caret"></span>
            <span class="sr-only">Toggle Dropdown</span>
          </button>
          <ul class="dropdown-menu" style="margin-left: -62px; width: 180px;" role="menu">
            <div class="col-xs-12 text-center" style="padding:0">
              <button type="button" class="btn btn-warning BStooltip" rel="tooltip" data-placement="top" title="Save viewed ads to file" onclick="saveViewed()"><i class="glyphicon glyphicon-save"></i></button>
              <button type="button" class="btn btn-info BStooltip" rel="tooltip" data-placement="top" title="Load viewed ads from file" onclick="document.getElementById('importViewedbtn').click();"><i class="glyphicon glyphicon-import"></i></button>
              <button type="button" class="btn btn-danger BStooltip" rel="tooltip" data-placement="top" title="Rebuild viewed ads indexes" onclick="rebuildViewedList()"><i class="glyphicon glyphicon-flash"></i></button>
              <button type="button" class="btn btn-danger BStooltip" rel="tooltip" data-placement="top" title="Clear viewed ads history" onclick="mapResetViewed()"><i class="fa fa-trash-o"></i></button>
            </div>
          </ul>
        </div>
      </div>

      <div class="btn-group" style="margin-left:6px">
        <button id="gridModeCards" type="button" class="btn btn-default btn-sm BStooltip" title="Card view" onclick="switchToGridMode('cards')"><i class="fa fa-th"></i></button>
        <button id="gridModeRows" type="button" class="btn btn-default btn-sm BStooltip" title="Row view" onclick="switchToGridMode('rows')"><i class="fa fa-bars"></i></button>
        <a id="viewMapBtn" class="btn btn-default btn-sm BStooltip" title="Map view" href="#map" onclick="switchToMapView(); return false"><i class="fa fa-map"></i></a>
      </div>

      <button id="favFilterBtn" type="button" class="btn btn-default btn-sm BStooltip" title="Show favorites only" onclick="toggleFavoritesFilter()"><i class="fa fa-heart"></i></button>

      <button id="filtersBtn" type="button" class="btn btn-primary btn-sm BStooltip" title="Filters & Settings" data-toggle="modal" data-target="#filtersModal"><i class="fa fa-sliders"></i></button>
      <button id="clearFiltersBtn" type="button" class="btn btn-warning btn-sm BStooltip" title="Clear all filters" onclick="clearAllFilters()" style="display:none"><i class="fa fa-times"></i> Clear Filters</button>

      <button type="button" class="btn btn-success btn-sm BStooltip" rel="tooltip" data-placement="top" title="Reset all ads" onclick="resetJob()"><i class="fa fa-refresh"></i></button>
      <button type="button" class="btn btn-danger btn-sm BStooltip" rel="tooltip" data-placement="top" title="Clear cached listings" onclick="clearJobCache()"><i class="fa fa-trash"></i></button>

      <div class="btn-group" style="margin-left:2px">
        <button id="drawAreaBtn" type="button" class="btn btn-default btn-sm BStooltip" rel="tooltip" data-placement="top" title="Draw area to filter listings" onclick="startDrawing()"><i class="fa fa-pencil"></i></button>
        <button id="clearShapeBtn" type="button" class="btn btn-danger btn-sm BStooltip" rel="tooltip" data-placement="top" title="Clear drawn shape" onclick="clearDrawnShape()" style="display:none"><i class="fa fa-times"></i></button>
      </div>

      <div class="btn-group" style="margin-left:2px">
        <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown"><i class="fa fa-sort"></i> <span id="sortLabel">Sort</span> <span class="caret"></span></button>
        <ul class="dropdown-menu">
          <li><a href="#" onclick="sortGrid('price','asc');return false"><i class="fa fa-sort-amount-asc"></i> Price: Low to High</a></li>
          <li><a href="#" onclick="sortGrid('price','desc');return false"><i class="fa fa-sort-amount-desc"></i> Price: High to Low</a></li>
          <li class="divider"></li>
          <li><a href="#" onclick="sortGrid('date','desc');return false"><i class="fa fa-sort-amount-desc"></i> Date: Newest First</a></li>
          <li><a href="#" onclick="sortGrid('date','asc');return false"><i class="fa fa-sort-amount-asc"></i> Date: Oldest First</a></li>
        </ul>
      </div>

      <button type="button" class="btn btn-default btn-sm BStooltip" rel="tooltip" data-placement="top" title="Information" data-toggle="modal" data-target="#informationModal"><i class="glyphicon glyphicon-info-sign"></i></button>

      <p class="resultscount" style="display:inline;margin-left:10px;font-size:13px">Results: 0</p>
    </section>

<!-- Unified Filters Modal -->
<div id="filtersModal" class="modal fade" role="dialog" style="display:none">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title">Filters & Settings</h4>
      </div>
      <div class="modal-body">
        <div class="box-body">
          <form role="form" id="filtersForm" data-toggle="validator">
            <input id="filterJobId" name="jobId" type="hidden">
            <div class="form-group">
              <label>Price</label>
              <input id="fromPrice" name="fromPrice" type="text" placeholder="Min">
              <input id="toPrice" name="toPrice" type="text" placeholder="Max">
            </div>
            <div class="form-group">
              <label>Oldest Date</label>
              <input id="fromDate" name="fromDate" type="date">
            </div>
            <div class="form-group">
              <label>Search text</label>
              <input id="searchText" name="searchText" type="text" placeholder="" value="">
              <input type="checkbox" id="searchTitleOnly" name="searchTitleOnly" value="true">
              <label for="searchTitleOnly">Search Title Only</label>
            </div>
            <div class="form-group">
              <label>Min Bedrooms</label>
              <input id="minBedrooms" name="minBedrooms" type="number" min="0" placeholder="Any" style="width:70px">
              <label style="margin-left:15px">Min Bathrooms</label>
              <input id="minBathrooms" name="minBathrooms" type="number" min="0" placeholder="Any" style="width:70px">
            </div>
            <div class="form-group">
              <label>Min Beds</label>
              <input id="minBeds" name="minBeds" type="number" min="0" placeholder="Any" style="width:70px">
            </div>
            <div class="form-group">
              <input type="checkbox" id="minPhotosCheck" value="2" onchange="$('#minPhotos').val(this.checked?'2':'')">
              <label for="minPhotosCheck">Hide listings with 1 or no photos</label>
              <input id="minPhotos" name="minPhotos" type="hidden">
            </div>
            <div class="form-group">
              <input id="amenitySearch" type="text" class="form-control input-sm" placeholder="Search amenities..." oninput="updateAmenityBubbles()" style="margin-bottom:8px">
            </div>
            <div class="form-group">
              <label>AND Amenities <small style="color:#888">(all must match)</small></label>
              <input id="amenities" name="amenities" type="hidden">
              <div id="amenityBubblesAnd" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px"></div>
            </div>
            <div class="form-group">
              <label>OR Amenities <small style="color:#888">(at least one must match · right-click to move)</small></label>
              <input id="orAmenities" name="orAmenities" type="hidden">
              <div id="amenityBubblesOr" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px"></div>
            </div>
            <input type="submit" value="Submit" style="display:none;">
          </form>
        </div>
      </div>
      <div class="modal-footer">
        <div class="pull-left"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>
        <div class="pull-right"><button type="button" class="btn btn-primary" onclick="$('#filtersForm').submit();">Filter</button></div>
      </div>
    </div>
  </div>
</div>

<!-- Information Modal -->
<div id="informationModal" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header" style="padding-bottom:5px">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title" style="padding-bottom:10px">Information</h4>
        <p id="informationStatus" style="margin:0"></p>
        <p class='resultscount pull-right' style="margin:0px">Number of results: 0</p>
        <p id="informationStatus2" style="margin:0"></p>
      </div>
      <div class="modal-body">
        <div id="messages" class="box-body"></div>
      </div>
      <div class="modal-footer">
        <div class="pull-left">
          <button type="button" class="btn btn-danger BStooltip" rel="tooltip" data-placement="top" title="Clear Information" onclick="mapClearInformationWindow()"><i class="fa fa-trash-o"></i></button>
          <input type="checkbox" id="autoScroll" checked>
          <label for="autoScroll">Auto Scroll</label>
        </div>
        <div class="pull-right">
          <button type="button" class="btn btn-primary" data-dismiss="modal">Ok</button>
        </div>
      </div>
    </div>
  </div>
</div>
`;

function addInfoRow(row)
{
  console.log('[socket] addInfoRow', row.print, 'messagesEl=', $('#messages').length)
  $('#messages').append('<div class="row">' +
    '<div class="col-xs-3 text-center wrap" style="padding:0">' + row.date + '</div>' +
    '<div class="col-xs-9 wrap">' + row.print + '</div>' +
  '</div>');
  if($('#autoScroll').is(':checked') && $('#informationModal').hasClass('in'))
      $("#messages").scrollTop($("#messages")[0].scrollHeight);
}

var _socketJobId = null

function _handleSocketMessage(obj) {
  console.log('[socket] _handleSocketMessage', {_socketJobId, channel: obj&&obj.channel, obj})
  if(!_socketJobId || !obj || !obj.channel) return
  var ch = obj.channel
  if(ch === _socketJobId+'jobUpdate' || ch === _socketJobId+'jobWarning') {
    addInfoRow(obj)
  } else if(ch === _socketJobId+'command') {
    switch(obj.command) {
      case 'procPageNumber':
        addInfoRow({date:obj.date, print:'Processing page: '+obj.print})
        $('#informationStatus').text("Processing Page: "+obj.print)
      break;
      case 'donePageNumber':
        addInfoRow({date:obj.date, print:'Done processing page: '+obj.print})
        if(obj.params && obj.params.refresh && typeof getAdsAsync === 'function')
          getAdsAsync($('#filtersForm').serialize())
      break;
      case 'doneProc':
        if(typeof getAdsAsync === 'function') getAdsAsync($('#filtersForm').serialize())
        if(typeof loadGridAds === 'function' && window.currentState === 'grid') loadGridAds($('#filtersForm').serialize())
        addInfoRow({date:obj.date, print:'All ads have been refreshed and expired ads removed! Pages processed: '+obj.print})
        $('#informationStatus').text("Ads refreshed! Total pages processed: "+obj.print)
        $('#informationStatus2').text("All expired ads have been removed!")
      break;
      case 'removeUrlMarker':
        addInfoRow({date:obj.date, print:'Removing expired ad!'})
        if(typeof clearMapMarkers === 'function') clearMapMarkers(getMarkersFromAds(obj.print))
      break;
    }
  }
}

function setupSocketListeners() {
  teardownSocketListeners()
  console.log('[socket] setupSocketListeners jobId=', jobId, 'messagesEl=', $('#messages').length)
  if(!jobId) return
  _socketJobId = jobId
  socket.on('all', _handleSocketMessage)
}

function teardownSocketListeners() {
  socket.off('all', _handleSocketMessage)
  _socketJobId = null
}

function switchToGridMode(mode) {
  _gridMode = mode
  saveGridMode()
  $('#gridModeCards').toggleClass('btn-primary', mode === 'cards').toggleClass('btn-default', mode !== 'cards')
  $('#gridModeRows').toggleClass('btn-primary', mode === 'rows').toggleClass('btn-default', mode !== 'rows')
  var state = window.currentState
  if(state === 'favorites') {
    switchFavView('grid')
  } else if(state === 'grid') {
    renderGrid()
  } else {
    if(jobId && jobName) {
      loadpage('grid', true)
    }
  }
}

function switchToMapView() {
  if(window.currentState === 'favorites') {
    switchFavView('map')
  } else if(jobId && jobName) {
    loadpage('map', true)
  }
}

var _favoritesOnly = false
var _favJobIds = [] // selected job IDs when in favorites mode

function toggleFavoritesFilter() {
  _favoritesOnly = !_favoritesOnly
  if(!_favoritesOnly) _favJobIds = []
  saveFavoritesOnly()
  $('#favFilterBtn').toggleClass('btn-primary', _favoritesOnly).toggleClass('btn-default', !_favoritesOnly)
  updateFilterIndicator()
  // Reload current view with the filter applied
  var state = window.currentState
  if(state === 'map' && typeof getAdsAsync === 'function')
    getAdsAsync($('#filtersForm').serialize(), true)
  else if(state === 'grid' && typeof loadGridAds === 'function')
    loadGridAds($('#filtersForm').serialize())
}

function setViewMode(mode) {
  // Highlight active view button
  $('#gridModeCards, #gridModeRows, #viewMapBtn').removeClass('btn-primary').addClass('btn-default')
  if(mode === 'map') $('#viewMapBtn').removeClass('btn-default').addClass('btn-primary')
  else if(mode === 'cards') $('#gridModeCards').removeClass('btn-default').addClass('btn-primary')
  else if(mode === 'rows') $('#gridModeRows').removeClass('btn-default').addClass('btn-primary')
  else if(mode === 'grid') {
    // For 'grid' mode, check the actual _gridMode to determine which button to highlight
    if(_gridMode === 'rows') $('#gridModeRows').removeClass('btn-default').addClass('btn-primary')
    else $('#gridModeCards').removeClass('btn-default').addClass('btn-primary')
  }

  if(hasActiveShapeFilter()) {
    $('#drawAreaBtn').addClass('btn-primary').removeClass('btn-default')
    $('#clearShapeBtn').show()
  }

  // Sync favorites filter button state
  $('#favFilterBtn').toggleClass('btn-primary', _favoritesOnly).toggleClass('btn-default', !_favoritesOnly)

  updateFilterIndicator()
}
