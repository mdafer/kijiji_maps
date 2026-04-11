var searchespage= `<!-- Content Header (Page header) -->
    
    <section class="content-header">
      <button class="btn btn-light" type="button" onclick="loadpage('main', true);">
        <span class="fa fa-chevron-left" aria-hidden="true"></span>
      </button><h1 style="display: inline;vertical-align:  middle;">
        My Searches
        <small></small>
      </h1>
      <button id="viewSelectedBtn" type="button" class="btn btn-info" onclick="viewSelectedSearches()" disabled><i class="fa fa-eye"></i> View Selected</button>
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
              <h3 class="box-title">Search Jobs</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
              <div class="table-responsive">
                <table class="table no-margin">
                  <thead>
                  <tr>
                    <th><input type="checkbox" id="selectAllSearches" title="Select all"></th>
                    <th>Actions</th>
                    <th>Platform</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Last Updated</th>
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

            <!-- textarea -->
            <div class="form-group">
              <label>Search Description</label>
              <textarea id ="searchDescriptionBox" name="description" class="form-control" rows="3" placeholder="Description"></textarea>
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
          <button type="button" class="btn btn-primary" onclick="$('#editSearchForm').submit();">Save</button>
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
    var filteredJobs = searchPlatformFilter ? user.jobs.filter(j => (j.platform || 'kijiji') === searchPlatformFilter) : user.jobs
    for(let i=0;i< filteredJobs.length;i++)
    {
      let statusDom;
      switch(filteredJobs[i].statusCode)
      {
        case 0:
          statusDom = '<td><span class="label label-danger">Failed</span></td>'
        break
        case 1:
          statusDom = '<td><span class="label label-success">Completed</span></td>'
        break
        case 2:
          statusDom = '<td><span class="label label-warning">Pending</span></td>'
        break
      }
      let platform = filteredJobs[i].platform || (filteredJobs[i].url && filteredJobs[i].url.includes('airbnb') ? 'airbnb' : filteredJobs[i].url && filteredJobs[i].url.includes('facebook.com') ? 'facebook' : 'kijiji')
      let platformLabel = platform === 'airbnb'
        ? '<td><span class="label label-danger">Airbnb</span></td>'
        : platform === 'facebook'
        ? '<td><span class="label label-primary">Facebook</span></td>'
        : '<td><span class="label label-info">Kijiji</span></td>'
      let linkLabel = platform === 'airbnb' ? 'Airbnb Link' : platform === 'facebook' ? 'FB Marketplace Link' : 'Kijiji Link'
      let descriptionHtml = filteredJobs[i].description
      if(platform === 'airbnb') {
        let airbnbDetails = formatAirbnbDetails(filteredJobs[i].url)
        if(airbnbDetails) descriptionHtml = airbnbDetails + (filteredJobs[i].description ? '<br><small class="text-muted">' + filteredJobs[i].description + '</small>' : '')
      }
      $('#searchesTBody').append(`
        <tr>
          <td><input type="checkbox" class="searchSelectCb" data-jobid="${filteredJobs[i].id}" data-jobname="${filteredJobs[i].name}"></td>
          <td><button type="button" class="btn btn-primary editSearchBtn BStooltip" rel="tooltip" data-placement="top" title="edit" data-toggle="modal" data-target="#editSearchModal"><i class="fa fa-edit"></i></button>
          <button type="button" class="btn btn-danger delSearchBtn BStooltip" rel="tooltip" data-placement="top" title="delete"><i class="fa fa-trash"></i></button>
          </td>
          ${platformLabel}
          ${statusDom}
          <td><a href="/index.html#map?jobId=${filteredJobs[i].id}&jobName=${filteredJobs[i].name}&platform=${platform}">${filteredJobs[i].name}</a></td>
          <td>${descriptionHtml}</td>
          <td>${filteredJobs[i].lastUpdated ? new Date(filteredJobs[i].lastUpdated).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '-'}</td>
          <td><a target="_blank" href="${filteredJobs[i].url}">${linkLabel}</a></td>
        </tr>
      `)
      $( "#searchesTBody .editSearchBtn" ).last().data('id', filteredJobs[i].id).data('name',$.parseHTML(filteredJobs[i].name || ' ')[0].data).data('description',$.parseHTML(filteredJobs[i].description||' ')[0].data)
      $( "#searchesTBody .delSearchBtn" ).last().data('id', filteredJobs[i].id)
      $(".BStooltip").tooltip({ trigger: 'hover', container: 'body' })
    }

    $('.delSearchBtn').on('click', function(event){
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

    $('.editSearchBtn').on('click', function(event){
      event.preventDefault();
      var jobIdForEdit = $(this).data('id')
      $('#searchId').val(jobIdForEdit)
      $('#searchNameBox').val($(this).data('name'))
      $('#searchDescriptionBox').val($(this).data('description'))
    })

    // Select-all checkbox
    $('#selectAllSearches').on('change', function(){
      $('.searchSelectCb').prop('checked', this.checked)
      updateViewSelectedBtn()
    })
    // Individual checkbox updates button state
    $(document).on('change', '.searchSelectCb', function(){
      var allChecked = $('.searchSelectCb').length === $('.searchSelectCb:checked').length
      $('#selectAllSearches').prop('checked', allChecked)
      updateViewSelectedBtn()
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
  $('#editSearchForm').on('submit', function(event) {
    event.preventDefault();
    APIupdateJob($('#editSearchForm').serializeObject(), ()=>{$('#editSearchModal').modal('hide');setTimeout(()=>{renderpage('searches')},300)})
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

function searchesUnload()
{
  $('#newSearchForm').off('submit')
  $('#editSearchForm').off('submit')
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