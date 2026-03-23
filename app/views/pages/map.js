var mappage= toolbarHtml + `
    <!-- Main content -->
    <section class="content">
      <p class='resultscount'>Number of results: 0</p>
      <input
        id="pac-input"
        class="controls"
        type="text"
        placeholder="Focus map on location"
      />
      <div id="map"> </div>
    </section>
`;
function mapfunc()
{
  setViewMode('map')
  visitedUrls = JSON.parse(localStorage.getItem('visitedUrls'+jobId)) || []
  mapClearInformationWindow()

  $(".BStooltip").tooltip({ trigger: 'hover', container: 'body' })
  var reader = new FileReader()
  document.getElementById('importViewedbtn').addEventListener('change', (event) => {
    const myfile = event.target.files[0]
    reader.onload = updateViewedList
    reader.readAsText(myfile)
  })

  $('#searchTitleOnly').prop('checked', false);

  $('#pageTitle').text(jobName)

  $('#filterJobId').val(jobId)

  // Restore persisted filters first, then let URL params override
  restoreFilters()
  if(urlParams.fromPrice) $("#fromPrice").val(urlParams.fromPrice)
  if(urlParams.toPrice) $("#toPrice").val(urlParams.toPrice)
  if(urlParams.fromDate) $("#fromDate").val(urlParams.fromDate)
  if(urlParams.searchText) $("#searchText").val(urlParams.searchText)
  if(urlParams.minBedrooms) $("#minBedrooms").val(urlParams.minBedrooms)
  if(urlParams.minBathrooms) $("#minBathrooms").val(urlParams.minBathrooms)
  if(urlParams.minBeds) $("#minBeds").val(urlParams.minBeds)
  if(urlParams.minPhotos) {
    $("#minPhotos").val(urlParams.minPhotos)
    $("#minPhotosCheck").prop('checked', true)
  }
  if(urlParams.amenities) $("#amenities").val(urlParams.amenities)
  if(urlParams.orAmenities) $("#orAmenities").val(urlParams.orAmenities)

  // Restore persisted shape geometry
  restoreShapeGeo()
  restoreFavoritesOnly()

  // Load displayAmenities from user account settings
  APIgetProfile(null, function(user){
    if(user && user.displayAmenities) _savedDisplayAmenities = user.displayAmenities.split(',').map(function(s){return s.trim()}).filter(Boolean)
  })

  $('#filtersModal').on('show.bs.modal', function(){ updateAmenityBubbles() })

  googleMapsReady.then(function() { initMap($('#filtersForm').serialize()) })

  $('#filtersForm').on('submit', function(event) {
    event.preventDefault();
    $('#filtersModal').modal('hide');
    saveFilters()
    updateFilterIndicator()
    getAdsAsync($('#filtersForm').serialize())
  });

  setupSocketListeners()
}

function mapUnload()
{
  $('#filtersForm').off('submit')
  $('#filtersModal').off('show.bs.modal')
  teardownSocketListeners()
  // Detach drawing from map but preserve shape for other views
  if(_drawingManager) { _drawingManager.setMap(null) }
  if(_drawnShape) {
    // Save geometry before detaching
    _shapeFilterGeo = _extractShapeGeo(_drawnShape)
    _drawnShape.setMap(null)
  }
}
