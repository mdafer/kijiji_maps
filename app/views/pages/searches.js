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

  APIgetProfile(null, function(user){
    if(!user.jobs || !user.jobs.length)
    {
      $('#searchesTBody').append(`
        <tr>
        <td>
        You don't have any jobs yet!
        </td>
        </tr>
      `)
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
      $('#editSearchForm').data('jobId', jobIdForEdit).data('platform', jobPlatform)
      $('#searchId').val(jobIdForEdit)
      $('#searchNameBox').val($(this).data('name'))
      $('#searchUrlBox').val($(this).data('url'))
      $('#searchDescriptionBox').val($(this).data('description'))
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
      $('.searchSelectCb').prop('checked', this.checked)
      updateViewSelectedBtn()
      updateRefreshSelectedBtn()
    })
    // Individual checkbox updates button state
    $(document).on('change', '.searchSelectCb', function(){
      var allChecked = $('.searchSelectCb').length === $('.searchSelectCb:checked').length
      $('#selectAllSearches').prop('checked', allChecked)
      updateViewSelectedBtn()
      updateRefreshSelectedBtn()
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
  // Multiple: use jobId=multi and pass IDs via localStorage
  localStorage.setItem('multiJobIds', JSON.stringify(selected))
  var label = selected.length + ' Searches'
  window.location.hash = 'grid?jobId=multi&jobName=' + encodeURIComponent(label)
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
var _searchesNameFilter = ''
var _searchesSort = null
var _searchesFilterTimer = null

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
  updateViewSelectedBtn()
  updateRefreshSelectedBtn()
}

function _renderSearchesRows(jobs) {
  var $tbody = $('#searchesTBody')
  $tbody.html('')
  if(!jobs.length) {
    $tbody.append('<tr><td colspan="8" class="text-muted" style="text-align:center;padding:16px">No searches match.</td></tr>')
    return
  }
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
    $tbody.append(`
      <tr>
        <td><input type="checkbox" class="searchSelectCb" data-jobid="${job.id}" data-jobname="${job.name}"></td>
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
    $('#searchesTBody .editSearchBtn').last().data('id', job.id).data('name', $.parseHTML(job.name || ' ')[0].data).data('url', job.url).data('description', $.parseHTML(job.description || ' ')[0].data).data('platform', platform).data('gridDepth', job.gridDepth || 1)
    $('#searchesTBody .delSearchBtn').last().data('id', job.id)
    if(stopBtnHtml)
      $('#searchesTBody .stopSearchBtn').last().data('id', job.id).data('name', job.name)
  }
  $('.BStooltip').tooltip({ trigger: 'hover', container: 'body' })
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
  $('#searchesFilterInput').off('input.searchesFilter')
  $('#searchesTable').off('click.searchesSort')
  if(_searchesFilterTimer) { clearTimeout(_searchesFilterTimer); _searchesFilterTimer = null }
  $('#newSearchPlatform').off('change')
  $('#newSearchUrlInput').off('input')
  $('#newSearchForm textarea[name="description"]').off('keydown').removeData('manual')
  $(document).off('change', '.searchSelectCb')
  $('#selectAllSearches').off('change')
  if(window._searchesSocketHandler) {
    socket.off('all', window._searchesSocketHandler)
    window._searchesSocketHandler = null
  }
}