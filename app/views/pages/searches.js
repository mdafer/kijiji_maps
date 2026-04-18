var searchespage= `<!-- Content Header (Page header) -->
    
    <section class="content-header">
      <button class="btn btn-light" type="button" onclick="loadpage('main', true);">
        <span class="fa fa-chevron-left" aria-hidden="true"></span>
      </button><h1 style="display: inline;vertical-align:  middle;">
        My Searches
        <small></small>
      </h1>
      <button id="viewSelectedBtn" type="button" class="btn btn-info" onclick="viewSelectedSearches()" disabled><i class="fa fa-eye"></i> View Selected</button>
      <button id="refreshSelectedBtn" type="button" class="btn btn-warning" onclick="refreshSelectedSearches()" disabled><i class="fa fa-refresh"></i> Refresh Selected</button>
      <div class="btn-group">
        <button id="moveToGroupBtn" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" disabled><i class="fa fa-folder"></i> Move to Group <span class="caret"></span></button>
        <ul id="moveToGroupMenu" class="dropdown-menu"></ul>
      </div>
      <button type="button" class="btn btn-default" onclick="createNewSearchGroup()"><i class="fa fa-folder-open"></i> New Group</button>
      <button id="exportSearchesBtn" type="button" class="btn btn-default" onclick="exportSelectedSearches()" disabled><i class="fa fa-download"></i> Export</button>
      <button type="button" class="btn btn-default" onclick="document.getElementById('importSearchesFile').click()"><i class="fa fa-upload"></i> Import</button>
      <input type="file" id="importSearchesFile" accept="application/json,.json" style="display:none">
      <button type="button" class="btn btn-success" data-toggle="modal" data-target="#newSearchModal">New Search</button>
    </section>

    <!-- Main content -->
    <section class="content">
    
      <!-- Info boxes -->
      <div class="row">

        <!-- fix for small devices only -->
        <div class="clearfix visible-sm-block"></div>

        <div class="box box-info" data-ol-has-click-handler="">
            <div class="box-header with-border">
              <h3 class="box-title" style="display:inline-block;margin-right:12px">Search Jobs</h3>
              <div class="pull-right" style="max-width:260px">
                <input type="text" id="searchesFilterInput" class="form-control input-sm" placeholder="Filter by name...">
              </div>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
              <div class="table-responsive">
                <table id="searchesTable" class="table no-margin">
                  <thead>
                  <tr>
                    <th><input type="checkbox" id="selectAllSearches" title="Select all"></th>
                    <th>Actions</th>
                    <th class="sortable" data-sort="platform" style="cursor:pointer;user-select:none">Platform</th>
                    <th class="sortable" data-sort="status" style="cursor:pointer;user-select:none">Status</th>
                    <th class="sortable" data-sort="name" style="cursor:pointer;user-select:none">Name</th>
                    <th>Description</th>
                    <th class="sortable" data-sort="lastUpdated" style="cursor:pointer;user-select:none">Last Updated</th>
                    <th>Link</th>
                  </tr>
                  </thead>
                  <tbody id="searchesTBody">
                  </tbody>
                </table>
              </div>
              <!-- /.table-responsive -->
            </div>
            <!-- /.box-body -->
            <div class="box-footer clearfix">
              <a class="btn btn-sm btn-info btn-flat pull-left" data-toggle="modal" data-target="#newSearchModal">New Search</a>
            </div>
            <!-- /.box-footer -->
          </div>

        
      </div>
    </section>
    <!-- /.content -->

    <!-- New Search Modal -->
<div id="newSearchModal" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">×</button>
        <h4 class="modal-title">New Search</h4>
      </div>
      <div class="modal-body">
        <div class="box-body">
          <form role="form" id="newSearchForm" data-toggle="validator">
            <div class="form-group">
              <label>Platform</label>
              <select id="newSearchPlatform" name="platform" class="form-control" required>
                <option value="kijiji">Kijiji</option>
                <option value="airbnb">Airbnb</option>
                <option value="facebook">Facebook Marketplace</option>
              </select>
            </div>
            <div class="form-group">
              <label>Name</label>
              <input name="name" type="text" class="form-control" placeholder="Search Name" required>
            </div><!-- text input -->
            <div class="form-group">
              <label id="newSearchUrlLabel">First Page Link (after you click search)</label>
              <input name="url" type="text" class="form-control" id="newSearchUrlInput" placeholder="https://www.kijiji.ca/..." required>
            </div>
            

            <div id="newSearchAirbnbExtras" style="display:none">
              <div class="form-group">
                <label>Grid Splits <i class="fa fa-question-circle BStooltip" style="cursor:help" data-placement="top" title="Splits the map area into smaller cells to find more listings. Depth 1 = 4 cells, 2 = 16 cells, 3 = 64 cells, 4 = 256 cells. Dense areas auto-split further if results are capped."></i></label>
                <input name="gridDepth" type="number" class="form-control" min="1" max="4" placeholder="1 (default)" value="1">
              </div>
              <div class="checkbox"><label><input type="checkbox" name="fetchDetails" value="1" checked> Fetch full photos &amp; amenities <small class="text-muted">(slower — visits each listing page)</small></label></div>
              <div class="checkbox"><label><input type="checkbox" name="fetchAvailability" value="1" checked> Fetch availability calendar</label></div>
            </div>

            <!-- textarea -->
            <div class="form-group">
              <label>Search Description</label>
              <textarea name="description" class="form-control" rows="3" placeholder="Room for rent in Toronto Price between 500 and 900"></textarea>
            </div>
            <input type="submit" value="Submit" style="display:none;">
          </form>
        </div>
      </div>
      <div class="modal-footer">
        <div class="pull-left">
          <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
        </div>
        <div class="pull-right">
          <button type="button" class="btn btn-primary" onclick="$('#newSearchForm').submit();">Save</button>
        </div>
      </div>
    </div>

  </div>
</div>
<!-- New Search Modal END-->

<!-- Edit Job Modal -->
<div id="editSearchModal" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">×</button>
        <h4 class="modal-title">Edit Job</h4>
      </div>
      <div class="modal-body">
        <div class="box-body">
          <form role="form" id="editSearchForm" data-toggle="validator">
            <div class="form-group">
              <label>Search Name</label>
              <input id="searchId" name="id" hidden>
              <input id="searchNameBox" name="name" type="text" class="form-control" placeholder="Name" required>
            </div>

            <div class="form-group">
              <label>Search URL</label>
              <input id="searchUrlBox" name="url" type="url" class="form-control" placeholder="https://" required>
            </div>

            <!-- textarea -->
            <div class="form-group">
              <label>Search Description</label>
              <textarea id ="searchDescriptionBox" name="description" class="form-control" rows="3" placeholder="Description"></textarea>
            </div>
            <div class="form-group">
              <label>Group</label>
              <select id="searchGroupBox" name="groupId" class="form-control"></select>
            </div>
            <div id="editSearchAirbnbExtras" style="display:none">
              <div class="form-group">
                <label>URL Parameters</label>
                <div id="editSearchUrlParams" class="row"></div>
              </div>
              <div class="form-group">
                <label>Grid Splits <i class="fa fa-question-circle BStooltip" style="cursor:help" data-placement="top" title="Splits the map area into smaller cells to find more listings. Depth 1 = 4 cells, 2 = 16 cells, 3 = 64 cells, 4 = 256 cells. Dense areas auto-split further if results are capped."></i></label>
                <input id="searchGridDepthBox" name="gridDepth" type="number" class="form-control" min="1" max="4" placeholder="1 (default)">
              </div>
            </div>
            <input type="submit" value="Submit" style="display:none;">
          </form>
        </div>
      </div>
      <div class="modal-footer">
        <div class="pull-left">
          <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
        </div>
        <div class="pull-right">
          <button type="button" class="btn btn-primary" onclick="$('#editSearchForm').data('runNow', false).submit();">Save</button>
          <button type="button" class="btn btn-success" onclick="$('#editSearchForm').data('runNow', true).submit();">Run Now</button>
        </div>
      </div>
    </div>

  </div>
</div>
<!-- Edit Job Modal END-->
`;

function searchesfunc()
{
  $('#searchesTBody').html('')
  $(document).off('click.searchesActions')
  _searchesNameFilter = ''
  _searchesSort = null
  _searchesSelectedIds = {}
  $('#importSearchesFile').off('change.searchesImport').on('change.searchesImport', function(e) {
    var file = e.target.files && e.target.files[0]
    if(file) importSearchesFromFile(file)
    this.value = ''
  })
  if(_searchesFilterTimer) { clearTimeout(_searchesFilterTimer); _searchesFilterTimer = null }
  $('#searchesFilterInput').val('').off('input.searchesFilter').on('input.searchesFilter', function() {
    var val = $(this).val()
    if(_searchesFilterTimer) clearTimeout(_searchesFilterTimer)
    _searchesFilterTimer = setTimeout(function() {
      _searchesFilterTimer = null
      _searchesNameFilter = val
      renderSearchesTable()
    }, 200)
  })
  $('#searchesTable').off('click.searchesSort').on('click.searchesSort', 'th.sortable', function() {
    var field = $(this).data('sort')
    if(_searchesSort && _searchesSort.field === field)
      _searchesSort.dir = _searchesSort.dir === 'asc' ? 'desc' : 'asc'
    else
      _searchesSort = { field: field, dir: field === 'lastUpdated' ? 'desc' : 'asc' }
    renderSearchesTable()
  })

  // Set platform filter from URL params
  var searchPlatformFilter = urlParams.platform || null
  if(searchPlatformFilter) {
    $('#newSearchPlatform').val(searchPlatformFilter)
  }

  // Update URL placeholder when platform changes
  $('#newSearchPlatform').on('change', function() {
    var plat = $(this).val()
    if(plat === 'airbnb') {
      $('#newSearchUrlInput').attr('placeholder', 'https://www.airbnb.ca/s/Toronto/...')
      $('#newSearchUrlLabel').text('Airbnb Search Link')
      $('#newSearchAirbnbExtras').show()
    } else if(plat === 'facebook') {
      $('#newSearchUrlInput').attr('placeholder', 'https://www.facebook.com/marketplace/toronto/propertyrentals?...')
      $('#newSearchUrlLabel').text('Facebook Marketplace Search Link')
      $('#newSearchAirbnbExtras').hide()
    } else {
      $('#newSearchUrlInput').attr('placeholder', 'https://www.kijiji.ca/...')
      $('#newSearchUrlLabel').text('Kijiji First Page Link (after you click search)')
      $('#newSearchAirbnbExtras').hide()
    }
  }).trigger('change')
  $('#newSearchAirbnbExtras .BStooltip').tooltip({ trigger: 'hover', container: 'body' })

  _loadCollapsedSearchGroups()
  APIgetProfile(null, function(user){
    _searchGroups = (user && Array.isArray(user.searchGroups)) ? user.searchGroups : []
    if(!user.jobs || !user.jobs.length)
    {
      $('#searchesTBody').append(`
        <tr>
        <td>
        You don't have any jobs yet!
        </td>
        </tr>
      `)
      updateMoveToGroupBtn()
      updateExportSelectedBtn()
      return
    }
    jobs = user.jobs
    // Filter by platform if specified
    _searchesJobs = searchPlatformFilter ? user.jobs.filter(j => (j.platform || 'kijiji') === searchPlatformFilter) : user.jobs
    renderSearchesTable()

    $(document).on('click.searchesActions', '#searchesTBody .stopSearchBtn', function(event){
      event.preventDefault();
      var stopId = $(this).data('id')
      var stopName = $(this).data('name') || 'this search'
      var mode = $(this).attr('data-mode') || 'stop'
      var title = mode === 'dequeue' ? 'Remove from Queue' : 'Stop Search'
      var message = mode === 'dequeue'
        ? 'Remove "' + stopName + '" from the refresh queue?'
        : 'Stop running search "' + stopName + '"? You can re-run it later with Run Now.'
      var confirmLabel = mode === 'dequeue' ? 'Remove' : 'Stop'
      showConfirmModal(
        title,
        message,
        function() {
          APIstopJob(JSON.stringify({jobId: stopId}), ()=>{
            setTimeout(()=>{renderpage('searches')},300)
          })
        },
        { confirmLabel: confirmLabel, confirmClass: 'btn-warning' }
      )
    })

    $(document).on('click.searchesActions', '#searchesTBody .delSearchBtn', function(event){
      event.preventDefault();
      var delId = $(this).data('id')
      showConfirmModal(
        'Delete Search',
        'Are you sure you want to delete this search? This cannot be undone.',
        function() {
          APIdeleteJob(JSON.stringify({id: delId}), ()=>{
            localStorage.removeItem('visitedUrls'+jobId)
            setTimeout(()=>{renderpage('searches')},300)
          })
        },
        { confirmLabel: 'Delete', confirmClass: 'btn-danger' }
      )
    })

    $(document).on('click.searchesActions', '#searchesTBody .editSearchBtn', function(event){
      event.preventDefault();
      var jobIdForEdit = $(this).data('id')
      var jobPlatform = $(this).data('platform')
      var currentGroupId = $(this).data('groupId') || ''
      $('#editSearchForm').data('jobId', jobIdForEdit).data('platform', jobPlatform)
      $('#searchId').val(jobIdForEdit)
      $('#searchNameBox').val($(this).data('name'))
      $('#searchUrlBox').val($(this).data('url'))
      $('#searchDescriptionBox').val($(this).data('description'))
      var groupOptions = '<option value="">Ungrouped</option>' + _searchGroups.map(function(g){
        return '<option value="' + _escapeHtml(g.id) + '"' + (String(g.id) === String(currentGroupId) ? ' selected' : '') + '>' + _escapeHtml(g.name) + '</option>'
      }).join('')
      $('#searchGroupBox').html(groupOptions)
      if(jobPlatform === 'airbnb') {
        $('#searchGridDepthBox').val($(this).data('gridDepth'))
        renderAirbnbUrlParamFields($(this).data('url'))
        $('#editSearchAirbnbExtras').show()
      } else {
        $('#editSearchAirbnbExtras').hide()
        $('#editSearchUrlParams').empty()
      }
    })

    // Select-all checkbox
    $('#selectAllSearches').on('change', function(){
      var checked = this.checked
      $('.searchSelectCb').prop('checked', checked).each(function(){
        var id = $(this).data('jobid')
        if(checked) _searchesSelectedIds[id] = true
        else delete _searchesSelectedIds[id]
      })
      _syncGroupHeaderCheckboxes()
      updateViewSelectedBtn()
      updateRefreshSelectedBtn()
      updateMoveToGroupBtn()
      updateExportSelectedBtn()
    })
    // Individual checkbox updates button state
    $(document).on('change', '.searchSelectCb', function(){
      var id = $(this).data('jobid')
      if(this.checked) _searchesSelectedIds[id] = true
      else delete _searchesSelectedIds[id]
      _syncGroupHeaderCheckboxes()
      _syncSelectAllCheckbox()
      updateViewSelectedBtn()
      updateRefreshSelectedBtn()
      updateMoveToGroupBtn()
      updateExportSelectedBtn()
    })
    $(document).on('change', '.searchGroupHeaderCb', function(){
      toggleSearchGroupSelect($(this).data('groupid'), this.checked)
    })
    $(document).on('click.searchesActions', '.searchGroupTitle', function(e){
      var gid = $(this).data('groupid')
      if(!gid || gid === UNGROUPED_ID) return
      e.preventDefault()
      renameSearchGroup(gid)
    })
    $(document).on('keydown.searchesActions', '.searchGroupTitleInput', function(e){
      if(e.key === 'Enter') {
        e.preventDefault()
        $(this).data('committed', true)
        _commitRenameSearchGroup($(this).data('groupid'), this.value)
      } else if(e.key === 'Escape') {
        e.preventDefault()
        $(this).data('committed', true)
        _cancelRenameSearchGroup()
      }
    })
    $(document).on('blur.searchesActions', '.searchGroupTitleInput', function(){
      if($(this).data('committed')) return
      $(this).data('committed', true)
      _commitRenameSearchGroup($(this).data('groupid'), this.value)
    })
  })

  if(userId) {
    window._searchesSocketHandler = function(obj){
      if(obj && obj.channel === userId+'command' && obj.command === 'doneProcAndValid')
        renderpage('searches')
    }
    socket.on('all', window._searchesSocketHandler)
  }

  // Auto-fill description from Airbnb URL
  $('#newSearchUrlInput').on('input', function() {
    if($('#newSearchPlatform').val() !== 'airbnb') return
    var info = parseAirbnbUrl($(this).val())
    if(!info) return
    var descParts = []
    if(info.location) descParts.push(info.location)
    if(info.checkin && info.checkout) descParts.push(info.checkin + ' to ' + info.checkout)
    else if(info.monthlyStart) descParts.push(info.monthlyStart + ' (' + (info.monthlyLength || '') + ')')
    if(info.guests) descParts.push(info.guests)
    if(info.price) descParts.push(info.price)
    if(info.roomTypes) descParts.push(info.roomTypes)
    if(info.minBedrooms) descParts.push(info.minBedrooms)
    if(info.amenities) descParts.push(info.amenities)
    var descField = $('#newSearchForm textarea[name="description"]')
    // Only auto-fill if user hasn't manually typed a description
    if(!descField.data('manual')) descField.val(descParts.join(' | '))
  })
  $('#newSearchForm textarea[name="description"]').on('keydown', function() { $(this).data('manual', true) })

  $('#newSearchForm').on('submit', function(event) {
    event.preventDefault();
    var formData = $('#newSearchForm').serializeObject()
    if(formData.platform === 'airbnb') {
      formData.fetchDetails = formData.fetchDetails ? true : false
      formData.fetchAvailability = formData.fetchAvailability ? true : false
      formData.gridDepth = Number(formData.gridDepth) || 1
    } else {
      delete formData.gridDepth
    }
    APIaddNewSearch(formData, ()=>{$('#newSearchModal').modal('hide');setTimeout(()=>{renderpage('searches')},300)})
  })
  $('#editSearchUrlParams').off('input.airbnbParams change.airbnbParams')
    .on('input.airbnbParams change.airbnbParams', '.airbnb-param-input', syncAirbnbUrlFromFields)
  $('#searchUrlBox').off('input.airbnbParams change.airbnbParams')
    .on('input.airbnbParams change.airbnbParams', function() {
      if($('#editSearchForm').data('platform') === 'airbnb')
        renderAirbnbUrlParamFields($(this).val())
    })

  $('#editSearchForm').on('submit', function(event) {
    event.preventDefault();
    const formData = $(this).serializeObject()
    const runNow = $(this).data('runNow')
    const jobId = $(this).data('jobId')
    const platform = $(this).data('platform')
    if(platform === 'airbnb') formData.gridDepth = Number(formData.gridDepth) || 1
    else delete formData.gridDepth
    if(!('groupId' in formData)) formData.groupId = ''
    APIupdateJob(formData, ()=>{
      $('#editSearchModal').modal('hide')
      if(runNow) {
        const resetParams = { jobId: jobId }
        if(platform === 'airbnb') resetParams.gridDepth = formData.gridDepth
        APIresetJob(JSON.stringify(resetParams), ()=>{
          setTimeout(()=>{renderpage('searches')},300)
        })
      } else {
        setTimeout(()=>{renderpage('searches')},300)
      }
    })
  })

  
}

function updateViewSelectedBtn() {
  var count = $('.searchSelectCb:checked').length
  $('#viewSelectedBtn').prop('disabled', count === 0)
  if(count > 0)
    $('#viewSelectedBtn').html('<i class="fa fa-eye"></i> View Selected (' + count + ')')
  else
    $('#viewSelectedBtn').html('<i class="fa fa-eye"></i> View Selected')
}

function viewSelectedSearches() {
  var selected = []
  var names = []
  $('.searchSelectCb:checked').each(function(){
    selected.push($(this).data('jobid'))
    names.push($(this).data('jobname'))
  })
  if(!selected.length) return
  // Single search: navigate directly to it
  if(selected.length === 1) {
    window.location.hash = 'grid?jobId=' + selected[0] + '&jobName=' + encodeURIComponent(names[0])
    renderpage()
    return
  }
  // Multiple: encode IDs in URL so the link is sharable
  localStorage.setItem('multiJobIds', JSON.stringify(selected))
  var label = selected.length + ' Searches'
  window.location.hash = 'grid?jobId=multi&jobIds=' + encodeURIComponent(selected.join(',')) + '&jobName=' + encodeURIComponent(label)
  renderpage()
}

function refreshSelectedSearches() {
  var selected = []
  var skipped = 0
  $('.searchSelectCb:checked').each(function(){
    var id = $(this).data('jobid')
    var job = _searchesJobs.find(function(j){ return String(j.id) === String(id) })
    if(job && (job.statusCode === 2 || job.queuedAt)) { skipped++; return }
    selected.push(id)
  })
  if(!selected.length) {
    if(skipped) showAlertModal('Nothing to queue', 'All selected searches are already running or queued.')
    return
  }
  var msg = 'Queue ' + selected.length + ' search' + (selected.length > 1 ? 'es' : '') + ' for refresh? They will run one after the other on the server — even if you close your browser.'
  if(skipped) msg += '<br><small class="text-muted">(' + skipped + ' already running/queued will be skipped.)</small>'
  showConfirmModal(
    'Refresh Selected',
    msg,
    function() {
      APIqueueJobs(JSON.stringify({ jobIds: selected }), function(){
        setTimeout(function(){ renderpage('searches') }, 300)
      })
    },
    { confirmLabel: 'Queue', confirmClass: 'btn-success' }
  )
}

function updateRefreshSelectedBtn() {
  var $btn = $('#refreshSelectedBtn')
  if(!$btn.length) return
  var count = $('.searchSelectCb:checked').length
  $btn.prop('disabled', count === 0)
  $btn.html('<i class="fa fa-refresh"></i> Refresh Selected' + (count > 0 ? ' (' + count + ')' : ''))
}

function parseAirbnbUrl(url) {
  try {
    var u = new URL(url)
    var p = u.searchParams
    var info = {}

    // Location from path: /s/Curitiba--PR/homes -> Curitiba, PR
    var pathMatch = u.pathname.match(/\/s\/([^/]+)/)
    if(pathMatch) info.location = decodeURIComponent(pathMatch[1]).replace(/--/g, ', ')
    // Override with query param if available
    if(p.get('query')) info.location = p.get('query')

    // Dates
    if(p.get('checkin')) info.checkin = p.get('checkin')
    if(p.get('checkout')) info.checkout = p.get('checkout')
    if(p.get('monthly_start_date')) info.monthlyStart = p.get('monthly_start_date')
    if(p.get('monthly_length')) info.monthlyLength = p.get('monthly_length') + ' months'

    // Guests
    var guests = []
    if(p.get('adults')) guests.push(p.get('adults') + ' adults')
    if(p.get('children')) guests.push(p.get('children') + ' children')
    if(p.get('infants')) guests.push(p.get('infants') + ' infants')
    if(p.get('pets')) guests.push(p.get('pets') + ' pets')
    if(guests.length) info.guests = guests.join(', ')

    // Price
    if(p.get('price_min') || p.get('price_max')) {
      var priceMin = p.get('price_min')
      var priceMax = p.get('price_max')
      info.price = priceMin && priceMax ? '$' + priceMin + ' - $' + priceMax
        : priceMax ? 'Up to $' + priceMax
        : '$' + priceMin + '+'
      if(p.get('price_filter_num_nights')) info.price += ' / ' + p.get('price_filter_num_nights') + ' nights'
    }

    // Rooms
    if(p.get('min_bedrooms')) info.minBedrooms = p.get('min_bedrooms') + ' bedrooms'
    if(p.get('min_bathrooms')) info.minBathrooms = p.get('min_bathrooms') + ' bathrooms'
    if(p.get('min_beds')) info.minBeds = p.get('min_beds') + ' beds'

    // Room type
    var roomTypes = p.getAll('room_types[]')
    if(roomTypes.length) info.roomTypes = roomTypes.join(', ')

    // Amenities
    var amenityMap = {
      '1': 'Pool', '2': 'Hot tub', '4': 'Wifi', '5': 'A/C', '7': 'Washer',
      '8': 'Kitchen', '9': 'Free parking', '11': 'Dryer', '12': 'Hangers',
      '15': 'Heating', '25': 'TV', '27': 'Fireplace', '30': 'Dishwasher',
      '33': 'Washer', '34': 'Dryer', '35': 'Smoke alarm', '36': 'Carbon monoxide alarm',
      '40': 'Gym', '41': 'Breakfast', '44': 'Indoor fireplace', '45': 'Iron',
      '46': 'Hair dryer', '47': 'Laptop-friendly workspace', '51': 'Self check-in',
      '57': 'Hot water', '58': 'Bed linens', '64': 'High chair', '78': 'EV charger',
      '100': 'BBQ grill', '137': 'Long-term stays'
    }
    var amenities = p.getAll('amenities[]')
    if(amenities.length) {
      info.amenities = amenities.map(function(id) { return amenityMap[id] || 'Amenity #' + id }).join(', ')
    }

    return info
  } catch(e) { return null }
}

function formatAirbnbDetails(url) {
  var info = parseAirbnbUrl(url)
  if(!info) return ''
  var parts = []
  if(info.location) parts.push('<b>' + info.location + '</b>')
  if(info.checkin && info.checkout) parts.push('<i class="fa fa-calendar"></i> ' + info.checkin + ' &rarr; ' + info.checkout)
  else if(info.monthlyStart) parts.push('<i class="fa fa-calendar"></i> ' + info.monthlyStart + ' (' + (info.monthlyLength || '') + ')')
  if(info.guests) parts.push('<i class="fa fa-users"></i> ' + info.guests)
  if(info.price) parts.push('<i class="fa fa-dollar"></i> ' + info.price)
  if(info.roomTypes) parts.push('<i class="fa fa-home"></i> ' + info.roomTypes)
  if(info.minBedrooms) parts.push('<i class="fa fa-bed"></i> ' + info.minBedrooms)
  if(info.minBathrooms) parts.push(info.minBathrooms)
  if(info.minBeds) parts.push(info.minBeds)
  if(info.amenities) parts.push('<i class="fa fa-check-circle"></i> ' + info.amenities)
  return parts.join(' &middot; ')
}

var _searchesJobs = []
var _searchGroups = []
var _collapsedSearchGroups = {}
var _searchesNameFilter = ''
var _searchesSort = null
var _searchesFilterTimer = null
var _searchesSelectedIds = {}
var UNGROUPED_ID = '__ungrouped__'

function _loadCollapsedSearchGroups() {
  try { _collapsedSearchGroups = JSON.parse(localStorage.getItem('collapsedSearchGroups') || '{}') || {} }
  catch(e) { _collapsedSearchGroups = {} }
}
function _saveCollapsedSearchGroups() {
  localStorage.setItem('collapsedSearchGroups', JSON.stringify(_collapsedSearchGroups))
}

function _genGroupId() {
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID()
  return 'g-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

function _groupById(id) {
  return _searchGroups.find(function(g){ return String(g.id) === String(id) })
}

function _jobGroupId(job) {
  return (job && job.groupId && _groupById(job.groupId)) ? String(job.groupId) : UNGROUPED_ID
}

function _escapeHtml(s) {
  return (s == null ? '' : String(s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function _persistSearchGroups(onDone) {
  APIupdateSearchGroups({groups: JSON.stringify(_searchGroups)}, function(meta){
    if(meta && Array.isArray(meta.searchGroups)) _searchGroups = meta.searchGroups
    if(onDone) onDone()
    renderSearchesTable()
  })
}

function createNewSearchGroup() {
  var newId = _genGroupId()
  _searchGroups.push({id: newId, name: 'New Group'})
  _persistSearchGroups(function(){
    // Open inline rename on the newly added group once the table re-renders
    _pendingRenameGroupId = newId
  })
}

var _pendingRenameGroupId = null

function renameSearchGroup(groupId) {
  var g = _groupById(groupId)
  if(!g) return
  var $title = $('.searchGroupTitle[data-groupid="' + groupId + '"]')
  if(!$title.length || $title.hasClass('editing')) return
  var currentName = g.name
  $title.addClass('editing').data('origname', currentName)
  $title.html('<input type="text" class="searchGroupTitleInput form-control input-sm" data-groupid="' + groupId + '" value="' + _escapeHtml(currentName) + '" maxlength="80" style="display:inline-block;width:auto;min-width:160px;height:26px;padding:2px 6px;font-size:14px;font-weight:600">')
  var $input = $title.find('input')
  $input.trigger('focus').get(0).select()
}

function _commitRenameSearchGroup(groupId, rawName) {
  var g = _groupById(groupId)
  if(!g) return
  var name = (rawName || '').trim().slice(0, 80)
  if(!name || name === g.name) { renderSearchesTable(); return }
  g.name = name
  _persistSearchGroups()
}

function _cancelRenameSearchGroup() {
  renderSearchesTable()
}

function deleteSearchGroup(groupId) {
  var g = _groupById(groupId)
  if(!g) return
  showConfirmModal(
    'Delete Group',
    'Delete group "' + _escapeHtml(g.name) + '"? Searches inside will move to Ungrouped.',
    function() {
      _searchGroups = _searchGroups.filter(function(x){ return String(x.id) !== String(groupId) })
      _persistSearchGroups(function(){
        // Backend clears orphaned groupId on jobs, but refresh local copy
        _searchesJobs.forEach(function(j){ if(String(j.groupId) === String(groupId)) delete j.groupId })
      })
    },
    { confirmLabel: 'Delete', confirmClass: 'btn-danger' }
  )
}

function toggleSearchGroupCollapse(groupId) {
  _collapsedSearchGroups[groupId] = !_collapsedSearchGroups[groupId]
  _saveCollapsedSearchGroups()
  renderSearchesTable()
}

function toggleSearchGroupSelect(groupId, checked) {
  $('.searchSelectCb[data-groupid="' + groupId + '"]').each(function(){
    var id = $(this).data('jobid')
    this.checked = checked
    if(checked) _searchesSelectedIds[id] = true
    else delete _searchesSelectedIds[id]
  })
  _syncGroupHeaderCheckboxes()
  _syncSelectAllCheckbox()
  updateViewSelectedBtn()
  updateRefreshSelectedBtn()
  updateMoveToGroupBtn()
  updateExportSelectedBtn()
}

function moveSelectedToGroup(groupId) {
  var selected = Object.keys(_searchesSelectedIds)
  if(!selected.length) return
  var targetId = (groupId === UNGROUPED_ID || !groupId) ? '' : String(groupId)
  var remaining = selected.length
  selected.forEach(function(jobId){
    var payload = {id: jobId, groupId: targetId}
    var existing = _searchesJobs.find(function(j){ return String(j.id) === String(jobId) })
    if(existing) payload.name = existing.name
    APIupdateJob(payload, function(){
      if(existing) {
        if(targetId) existing.groupId = targetId
        else delete existing.groupId
      }
      if(--remaining === 0) renderSearchesTable()
    })
  })
}

function updateExportSelectedBtn() {
  var count = Object.keys(_searchesSelectedIds).length
  $('#exportSearchesBtn').prop('disabled', count === 0)
  $('#exportSearchesBtn').html('<i class="fa fa-download"></i> Export' + (count > 0 ? ' (' + count + ')' : ''))
}

function exportSelectedSearches() {
  var selected = Object.keys(_searchesSelectedIds)
  if(!selected.length) return
  var modalBody =
    '<p>Export ' + selected.length + ' search' + (selected.length > 1 ? 'es' : '') + ' and their groups to a JSON file.</p>' +
    '<p style="margin-top:8px;margin-bottom:4px"><b>Include:</b></p>' +
    '<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="exportIncludeAdsCb" style="margin-right:6px">Scraped listings</label>' +
    '<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="exportIncludeFavoritesCb" style="margin-right:6px">Favorites</label>' +
    '<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="exportIncludeDislikesCb" style="margin-right:6px">Dislikes</label>' +
    '<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="exportIncludeHideAmenitiesCb" style="margin-right:6px">Hidden amenities (profile setting)</label>' +
    '<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="exportIncludeSeenCb" style="margin-right:6px">Seen listings (for selected searches)</label>' +
    '<p class="text-muted" style="margin-top:6px;font-size:12px">Listings can be large. Images load from external URLs so they stay working on import.</p>'
  showConfirmModal(
    'Export Searches',
    modalBody,
    function() {
      var includeAds = $('#exportIncludeAdsCb').is(':checked')
      var includeFavorites = $('#exportIncludeFavoritesCb').is(':checked')
      var includeDislikes = $('#exportIncludeDislikesCb').is(':checked')
      var includeHideAmenities = $('#exportIncludeHideAmenitiesCb').is(':checked')
      var includeSeen = $('#exportIncludeSeenCb').is(':checked')
      APIexportSearches({
        jobIds: selected,
        includeAds: includeAds,
        includeFavorites: includeFavorites,
        includeDislikes: includeDislikes,
        includeHideAmenities: includeHideAmenities
      }, function(payload) {
        if(!payload) return
        if(includeSeen) {
          var seenItems = {}
          selected.forEach(function(id) {
            try {
              var raw = localStorage.getItem('visitedUrls' + id)
              if(!raw) return
              var arr = JSON.parse(raw)
              if(Array.isArray(arr) && arr.length) seenItems[id] = arr
            } catch(e) {}
          })
          if(Object.keys(seenItems).length) payload.seenItems = seenItems
        }
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        var url = URL.createObjectURL(blob)
        var stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        var a = document.createElement('a')
        a.href = url
        a.download = 'searches-export-' + stamp + '.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(function(){ URL.revokeObjectURL(url) }, 1000)
      })
    },
    { confirmLabel: 'Export', confirmClass: 'btn-primary' }
  )
}

function importSearchesFromFile(file) {
  if(!file) return
  var reader = new FileReader()
  reader.onload = function(e) {
    var payload
    try { payload = JSON.parse(e.target.result) }
    catch(err) { showAlertModal('Invalid File', 'This is not a valid JSON export file.'); return }
    var jobCount = Array.isArray(payload.jobs) ? payload.jobs.length : 0
    var groupCount = Array.isArray(payload.searchGroups) ? payload.searchGroups.length : 0
    var adCount = Array.isArray(payload.ads) ? payload.ads.length : 0
    var favoriteCount = Array.isArray(payload.favorites) ? payload.favorites.length : 0
    var dislikeCount = Array.isArray(payload.dislikes) ? payload.dislikes.length : 0
    var hasHideAmenities = typeof payload.hideAmenities === 'string'
    var hideAmenitiesList = hasHideAmenities ? payload.hideAmenities.split(',').map(function(s){return s.trim()}).filter(Boolean) : []
    var seenItems = (payload.seenItems && typeof payload.seenItems === 'object') ? payload.seenItems : null
    var seenJobCount = seenItems ? Object.keys(seenItems).length : 0
    var seenTotal = 0
    if(seenItems) Object.keys(seenItems).forEach(function(k){ if(Array.isArray(seenItems[k])) seenTotal += seenItems[k].length })

    if(!jobCount && !groupCount && !adCount && !favoriteCount && !dislikeCount && !hideAmenitiesList.length && !seenJobCount) {
      showAlertModal('Nothing to Import', 'This file contains no importable data.')
      return
    }

    var rows = []
    if(jobCount || groupCount) {
      var parts = []
      if(jobCount) parts.push(jobCount + ' search' + (jobCount === 1 ? '' : 'es'))
      if(groupCount) parts.push(groupCount + ' group' + (groupCount === 1 ? '' : 's'))
      rows.push('<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="importIncludeSearchesCb" checked style="margin-right:6px">Searches & groups (' + parts.join(', ') + ')</label>')
    }
    if(adCount)
      rows.push('<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="importIncludeAdsCb" checked style="margin-right:6px">Scraped listings (' + adCount + ')</label>')
    if(favoriteCount)
      rows.push('<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="importIncludeFavoritesCb" checked style="margin-right:6px">Favorites (' + favoriteCount + ')</label>')
    if(dislikeCount)
      rows.push('<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="importIncludeDislikesCb" checked style="margin-right:6px">Dislikes (' + dislikeCount + ')</label>')
    if(hideAmenitiesList.length)
      rows.push('<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="importIncludeHideAmenitiesCb" checked style="margin-right:6px">Hidden amenities (' + hideAmenitiesList.length + ')</label>')
    if(seenJobCount)
      rows.push('<label style="display:block;font-weight:normal;cursor:pointer;margin:4px 0"><input type="checkbox" id="importIncludeSeenCb" checked style="margin-right:6px">Seen listings (' + seenTotal + ' across ' + seenJobCount + ' search' + (seenJobCount === 1 ? '' : 'es') + ')</label>')

    var modalBody =
      '<p><b>Select what to import:</b></p>' + rows.join('') +
      '<hr style="margin:10px 0">' +
      '<label style="font-weight:normal;cursor:pointer"><input type="checkbox" id="importOverrideCb" style="margin-right:5px"> Override existing entries</label>' +
      '<p class="text-muted" style="margin-top:6px;font-size:12px">Unchecked: new items are added, duplicates are skipped. Favorites/dislikes/seen items are merged with yours.</p>'

    showConfirmModal(
      'Import Searches',
      modalBody,
      function() {
        var override = $('#importOverrideCb').is(':checked')
        var doSearches = (jobCount || groupCount) && $('#importIncludeSearchesCb').is(':checked')
        var doAds = adCount && $('#importIncludeAdsCb').is(':checked')
        var doFavorites = favoriteCount && $('#importIncludeFavoritesCb').is(':checked')
        var doDislikes = dislikeCount && $('#importIncludeDislikesCb').is(':checked')
        var doHideAmenities = hideAmenitiesList.length && $('#importIncludeHideAmenitiesCb').is(':checked')
        var doSeen = seenJobCount && $('#importIncludeSeenCb').is(':checked')

        var filteredPayload = {
          jobs: doSearches ? payload.jobs : [],
          searchGroups: doSearches ? payload.searchGroups : [],
          ads: doAds ? payload.ads : []
        }
        if(doFavorites) filteredPayload.favorites = payload.favorites
        if(doDislikes) filteredPayload.dislikes = payload.dislikes
        if(doHideAmenities) filteredPayload.hideAmenities = payload.hideAmenities

        APIimportSearches({ payload: filteredPayload, override: override }, function(stats) {
          if(!stats) return

          var seenApplied = 0
          if(doSeen) {
            Object.keys(seenItems).forEach(function(id) {
              var arr = seenItems[id]
              if(!Array.isArray(arr) || !arr.length) return
              try {
                var existing = []
                if(!override) {
                  var raw = localStorage.getItem('visitedUrls' + id)
                  if(raw) { try { existing = JSON.parse(raw) || [] } catch(e) {} }
                }
                var merged = existing.concat(arr)
                var unique = merged.filter(function(v, i){ return merged.indexOf(v) === i })
                localStorage.setItem('visitedUrls' + id, JSON.stringify(unique))
                seenApplied += arr.length
              } catch(e) {}
            })
          }

          var msg = ''
          if(doSearches)
            msg += '<p><b>Groups:</b> ' + stats.groups.added + ' added, ' + stats.groups.updated + ' updated, ' + stats.groups.skipped + ' skipped</p>' +
                   '<p><b>Searches:</b> ' + stats.jobs.added + ' added, ' + stats.jobs.updated + ' updated, ' + stats.jobs.skipped + ' skipped</p>'
          if(doAds)
            msg += '<p><b>Listings:</b> ' + stats.ads.added + ' added, ' + stats.ads.updated + ' updated, ' + stats.ads.skipped + ' skipped</p>'
          if(doFavorites && stats.favorites)
            msg += '<p><b>Favorites:</b> ' + stats.favorites.added + ' added, ' + stats.favorites.skipped + ' skipped</p>'
          if(doDislikes && stats.dislikes)
            msg += '<p><b>Dislikes:</b> ' + stats.dislikes.added + ' added, ' + stats.dislikes.skipped + ' skipped</p>'
          if(doHideAmenities && stats.hideAmenities)
            msg += '<p><b>Hidden amenities:</b> ' + stats.hideAmenities.added + ' added, ' + stats.hideAmenities.skipped + ' skipped</p>'
          if(doSeen)
            msg += '<p><b>Seen listings:</b> ' + seenApplied + ' merged into local history</p>'
          if(!msg) msg = '<p>Nothing was imported.</p>'

          renderpage('searches')
          setTimeout(function(){ showAlertModal('Import Complete', msg) }, 400)
        })
      },
      { confirmLabel: 'Import', confirmClass: 'btn-success' }
    )
  }
  reader.readAsText(file)
}

function _syncGroupHeaderCheckboxes() {
  $('.searchGroupHeaderCb').each(function(){
    var gid = $(this).data('groupid')
    var cbs = $('.searchSelectCb[data-groupid="' + gid + '"]')
    if(!cbs.length) { this.checked = false; this.indeterminate = false; return }
    var checked = cbs.filter(':checked').length
    this.checked = checked === cbs.length
    this.indeterminate = checked > 0 && checked < cbs.length
  })
}

function _syncSelectAllCheckbox() {
  var cbs = $('.searchSelectCb')
  var el = document.getElementById('selectAllSearches')
  if(!el) return
  if(!cbs.length) { el.checked = false; el.indeterminate = false; return }
  var checked = cbs.filter(':checked').length
  el.checked = checked === cbs.length
  el.indeterminate = checked > 0 && checked < cbs.length
}

function updateMoveToGroupBtn() {
  var count = Object.keys(_searchesSelectedIds).length
  $('#moveToGroupBtn').prop('disabled', count === 0)
  var menu = _searchGroups.map(function(g){
    return '<li><a href="#" onclick="moveSelectedToGroup(\'' + g.id + '\');return false">' + _escapeHtml(g.name) + '</a></li>'
  }).join('')
  menu += (menu ? '<li class="divider"></li>' : '') + '<li><a href="#" onclick="moveSelectedToGroup(\'\');return false"><i class="fa fa-ban"></i> Ungrouped</a></li>'
  $('#moveToGroupMenu').html(menu)
}

function renderSearchesTable() {
  var jobs = _searchesJobs.slice()
  var q = _searchesNameFilter.trim().toLowerCase()
  if(q) jobs = jobs.filter(function(j){ return (j.name || '').toLowerCase().indexOf(q) !== -1 })
  if(_searchesSort) {
    var f = _searchesSort.field, d = _searchesSort.dir
    jobs.sort(function(a, b) {
      var va, vb
      if(f === 'lastUpdated') {
        va = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0
        vb = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0
        return d === 'asc' ? va - vb : vb - va
      }
      if(f === 'status') {
        va = a.statusCode == null ? -1 : a.statusCode
        vb = b.statusCode == null ? -1 : b.statusCode
        return d === 'asc' ? va - vb : vb - va
      }
      if(f === 'platform') {
        va = (a.platform || (a.url && a.url.includes('airbnb') ? 'airbnb' : a.url && a.url.includes('facebook.com') ? 'facebook' : 'kijiji'))
        vb = (b.platform || (b.url && b.url.includes('airbnb') ? 'airbnb' : b.url && b.url.includes('facebook.com') ? 'facebook' : 'kijiji'))
      } else {
        va = (a[f] || '').toString().toLowerCase()
        vb = (b[f] || '').toString().toLowerCase()
      }
      return d === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }
  _renderSearchesRows(jobs)
  _updateSearchesSortIndicators()
  _syncGroupHeaderCheckboxes()
  _syncSelectAllCheckbox()
  updateViewSelectedBtn()
  updateRefreshSelectedBtn()
  updateMoveToGroupBtn()
  updateExportSelectedBtn()
  if(_pendingRenameGroupId) {
    var pending = _pendingRenameGroupId
    _pendingRenameGroupId = null
    renameSearchGroup(pending)
  }
}

function _renderSearchesRows(jobs) {
  var $tbody = $('#searchesTBody')
  $tbody.html('')
  if(!jobs.length) {
    $tbody.append('<tr><td colspan="8" class="text-muted" style="text-align:center;padding:16px">No searches match.</td></tr>')
    return
  }

  // Partition jobs by group, preserving _searchGroups order then Ungrouped last.
  var jobsByGroup = {}
  jobs.forEach(function(j){
    var gid = _jobGroupId(j)
    ;(jobsByGroup[gid] = jobsByGroup[gid] || []).push(j)
  })
  var orderedGroups = _searchGroups.map(function(g){ return {id: String(g.id), name: g.name, removable: true} })
  if(jobsByGroup[UNGROUPED_ID] && jobsByGroup[UNGROUPED_ID].length)
    orderedGroups.push({id: UNGROUPED_ID, name: 'Ungrouped', removable: false})
  var onlyUngrouped = _searchGroups.length === 0
  var renderGroupHeaders = !onlyUngrouped

  for(var gi = 0; gi < orderedGroups.length; gi++) {
    var grp = orderedGroups[gi]
    var groupJobs = jobsByGroup[grp.id] || []
    if(renderGroupHeaders) {
      var collapsed = !!_collapsedSearchGroups[grp.id]
      var chevron = collapsed ? 'fa-chevron-right' : 'fa-chevron-down'
      var removeBtn = grp.removable
        ? '<button type="button" class="btn btn-xs btn-link text-danger" style="margin-left:8px" onclick="deleteSearchGroup(\'' + grp.id + '\')" title="Delete group"><i class="fa fa-trash"></i></button>'
        : ''
      var renameBtn = grp.removable
        ? '<button type="button" class="btn btn-xs btn-link" onclick="renameSearchGroup(\'' + grp.id + '\')" title="Rename group"><i class="fa fa-pencil"></i></button>'
        : ''
      var titleMarkup = grp.removable
        ? '<span class="searchGroupTitle" data-groupid="' + grp.id + '" style="cursor:text" title="Click to rename">' + _escapeHtml(grp.name) + '</span>'
        : '<span class="searchGroupTitle" data-groupid="' + grp.id + '">' + _escapeHtml(grp.name) + '</span>'
      $tbody.append(
        '<tr class="searchGroupHeader" data-groupid="' + grp.id + '" style="background:#f5f5f5">' +
          '<td><input type="checkbox" class="searchGroupHeaderCb" data-groupid="' + grp.id + '"' + (groupJobs.length ? '' : ' disabled') + '></td>' +
          '<td colspan="7" style="font-weight:600">' +
            '<a href="#" onclick="toggleSearchGroupCollapse(\'' + grp.id + '\');return false" style="color:inherit;text-decoration:none;margin-right:6px"><i class="fa ' + chevron + '"></i></a>' +
            titleMarkup +
            ' <span class="text-muted" style="font-weight:normal">(' + groupJobs.length + ')</span>' +
            renameBtn + removeBtn +
          '</td>' +
        '</tr>'
      )
      if(collapsed) continue
    }
    _appendJobRows($tbody, groupJobs, grp.id)
  }
  $('.BStooltip').tooltip({ trigger: 'hover', container: 'body' })
}

function _appendJobRows($tbody, jobs, groupId) {
  for(let i = 0; i < jobs.length; i++) {
    let job = jobs[i]
    let statusDom
    if(job.queuedAt && job.statusCode !== 2) {
      statusDom = '<td><span class="label label-primary">Queued</span></td>'
    } else {
      switch(job.statusCode) {
        case 0: statusDom = '<td><span class="label label-danger">Failed</span></td>'; break
        case 1: statusDom = '<td><span class="label label-success">Completed</span></td>'; break
        case 2: statusDom = '<td><span class="label label-warning">Pending</span></td>'; break
        default: statusDom = '<td></td>'
      }
    }
    let platform = job.platform || (job.url && job.url.includes('airbnb') ? 'airbnb' : job.url && job.url.includes('facebook.com') ? 'facebook' : 'kijiji')
    let platformLabel = platform === 'airbnb'
      ? '<td><span class="label label-danger">Airbnb</span></td>'
      : platform === 'facebook'
      ? '<td><span class="label label-primary">Facebook</span></td>'
      : '<td><span class="label label-info">Kijiji</span></td>'
    let linkLabel = platform === 'airbnb' ? 'Airbnb Link' : platform === 'facebook' ? 'FB Marketplace Link' : 'Kijiji Link'
    let descriptionHtml = job.description
    if(platform === 'airbnb') {
      let airbnbDetails = formatAirbnbDetails(job.url)
      if(airbnbDetails) descriptionHtml = airbnbDetails + (job.description ? '<br><small class="text-muted">' + job.description + '</small>' : '')
    }
    let isQueued = !!(job.queuedAt && job.statusCode !== 2)
    let stopBtnHtml = ''
    if(job.statusCode === 2)
      stopBtnHtml = `<button type="button" class="btn btn-warning stopSearchBtn BStooltip" rel="tooltip" data-placement="top" data-mode="stop" title="stop"><i class="fa fa-stop"></i></button>`
    else if(isQueued)
      stopBtnHtml = `<button type="button" class="btn btn-default stopSearchBtn BStooltip" rel="tooltip" data-placement="top" data-mode="dequeue" title="remove from queue"><i class="fa fa-times"></i></button>`
    let checkedAttr = _searchesSelectedIds[job.id] ? ' checked' : ''
    $tbody.append(`
      <tr>
        <td><input type="checkbox" class="searchSelectCb" data-jobid="${job.id}" data-jobname="${job.name}" data-groupid="${groupId}"${checkedAttr}></td>
        <td><button type="button" class="btn btn-primary editSearchBtn BStooltip" rel="tooltip" data-placement="top" title="edit" data-toggle="modal" data-target="#editSearchModal"><i class="fa fa-edit"></i></button>
        ${stopBtnHtml}
        <button type="button" class="btn btn-danger delSearchBtn BStooltip" rel="tooltip" data-placement="top" title="delete"><i class="fa fa-trash"></i></button>
        </td>
        ${platformLabel}
        ${statusDom}
        <td><a href="/index.html#map?jobId=${job.id}&jobName=${job.name}&platform=${platform}">${job.name}</a></td>
        <td>${descriptionHtml}</td>
        <td>${job.lastUpdated ? new Date(job.lastUpdated).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '-'}</td>
        <td><a target="_blank" href="${job.url}">${linkLabel}</a></td>
      </tr>
    `)
    $('#searchesTBody .editSearchBtn').last().data('id', job.id).data('name', $.parseHTML(job.name || ' ')[0].data).data('url', job.url).data('description', $.parseHTML(job.description || ' ')[0].data).data('platform', platform).data('gridDepth', job.gridDepth || 1).data('groupId', job.groupId || '')
    $('#searchesTBody .delSearchBtn').last().data('id', job.id)
    if(stopBtnHtml)
      $('#searchesTBody .stopSearchBtn').last().data('id', job.id).data('name', job.name)
  }
}

function _updateSearchesSortIndicators() {
  $('#searchesTable th.sortable .sort-caret').remove()
  if(!_searchesSort) return
  var icon = _searchesSort.dir === 'asc' ? 'fa-caret-up' : 'fa-caret-down'
  $('#searchesTable th.sortable[data-sort="' + _searchesSort.field + '"]').append(' <i class="fa ' + icon + ' sort-caret"></i>')
}

var AIRBNB_PARAM_FIELDS = [
  { key: 'checkin',                 label: 'Check-in',            type: 'date'   },
  { key: 'checkout',                label: 'Check-out',           type: 'date'   },
  { key: 'monthly_start_date',      label: 'Monthly Start',       type: 'date'   },
  { key: 'monthly_length',          label: 'Monthly Length',      type: 'number', min: 1 },
  { key: 'adults',                  label: 'Adults',              type: 'number', min: 0 },
  { key: 'children',                label: 'Children',            type: 'number', min: 0 },
  { key: 'infants',                 label: 'Infants',             type: 'number', min: 0 },
  { key: 'pets',                    label: 'Pets',                type: 'number', min: 0 },
  { key: 'price_min',               label: 'Min Price',           type: 'number', min: 0 },
  { key: 'price_max',               label: 'Max Price',           type: 'number', min: 0 },
  { key: 'price_filter_num_nights', label: 'Price Filter Nights', type: 'number', min: 1 },
  { key: 'min_bedrooms',            label: 'Min Bedrooms',        type: 'number', min: 0 },
  { key: 'min_bathrooms',           label: 'Min Bathrooms',       type: 'number', min: 0 },
  { key: 'min_beds',                label: 'Min Beds',            type: 'number', min: 0 }
]

function renderAirbnbUrlParamFields(url) {
  var $box = $('#editSearchUrlParams')
  var u
  try { u = new URL(url) } catch(e) { $box.empty(); return }
  var p = u.searchParams
  var html = ''
  AIRBNB_PARAM_FIELDS.forEach(function(f) {
    var val = p.get(f.key) || ''
    var attrs = 'type="' + f.type + '" data-param="' + f.key + '" class="form-control airbnb-param-input" value="' + val + '"'
    if(f.min !== undefined) attrs += ' min="' + f.min + '"'
    html += '<div class="col-xs-6 col-sm-4" style="margin-bottom:8px">'
    html += '<label style="font-weight:normal;font-size:12px;margin-bottom:2px">' + f.label + '</label>'
    html += '<input ' + attrs + '>'
    html += '</div>'
  })
  $box.html(html)
}

function syncAirbnbUrlFromFields() {
  var url = $('#searchUrlBox').val()
  var u
  try { u = new URL(url) } catch(e) { return }
  $('#editSearchUrlParams .airbnb-param-input').each(function() {
    var key = $(this).data('param')
    var val = $(this).val()
    if(val === '' || val == null) u.searchParams.delete(key)
    else u.searchParams.set(key, val)
  })
  $('#searchUrlBox').val(u.toString())
}

function searchesUnload()
{
  $('#newSearchForm').off('submit')
  $('#editSearchForm').off('submit')
  $('#editSearchUrlParams').off('input.airbnbParams change.airbnbParams')
  $('#searchUrlBox').off('input.airbnbParams change.airbnbParams')
  $(document).off('click.searchesActions')
  $(document).off('keydown.searchesActions blur.searchesActions')
  $('#searchesFilterInput').off('input.searchesFilter')
  $('#searchesTable').off('click.searchesSort')
  if(_searchesFilterTimer) { clearTimeout(_searchesFilterTimer); _searchesFilterTimer = null }
  $('#newSearchPlatform').off('change')
  $('#newSearchUrlInput').off('input')
  $('#newSearchForm textarea[name="description"]').off('keydown').removeData('manual')
  $(document).off('change', '.searchSelectCb')
  $(document).off('change', '.searchGroupHeaderCb')
  $('#selectAllSearches').off('change')
  if(window._searchesSocketHandler) {
    socket.off('all', window._searchesSocketHandler)
    window._searchesSocketHandler = null
  }
}