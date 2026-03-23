var searchespage= `<!-- Content Header (Page header) -->
    
    <section class="content-header">
      <button class="btn btn-light" type="button" onclick="loadpage('main', true);">
        <span class="fa fa-chevron-left" aria-hidden="true"></span>
      </button><h1 style="display: inline;vertical-align:  middle;">
        My Searches
        <small></small>
      </h1>
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
                    <th>Actions</th>
                    <th>Platform</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Description</th>
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
    } else {
      $('#newSearchUrlInput').attr('placeholder', 'https://www.kijiji.ca/...')
      $('#newSearchUrlLabel').text('Kijiji First Page Link (after you click search)')
    }
  }).trigger('change')

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
      let platform = filteredJobs[i].platform || 'kijiji'
      let platformLabel = platform === 'airbnb'
        ? '<td><span class="label label-danger">Airbnb</span></td>'
        : '<td><span class="label label-info">Kijiji</span></td>'
      let linkLabel = platform === 'airbnb' ? 'Airbnb Link' : 'Kijiji Link'
      $('#searchesTBody').append(`
        <tr>
          <td><button type="button" class="btn btn-primary editSearchBtn BStooltip" rel="tooltip" data-placement="top" title="edit" data-toggle="modal" data-target="#editSearchModal"><i class="fa fa-edit"></i></button>
          <button type="button" class="btn btn-danger delSearchBtn BStooltip" rel="tooltip" data-placement="top" title="delete"><i class="fa fa-trash"></i></button>
          </td>
          ${platformLabel}
          ${statusDom}
          <td><a href="/index.html#map?jobId=${filteredJobs[i].id}&jobName=${filteredJobs[i].name}&platform=${platform}">${filteredJobs[i].name}</a></td>
          <td>${filteredJobs[i].description}</td>
          <td><a target="_blank" href="${filteredJobs[i].url}">${linkLabel}</a></td>
        </tr>
      `)
      $( "#searchesTBody .editSearchBtn" ).last().data('id', filteredJobs[i].id).data('name',$.parseHTML(filteredJobs[i].name || ' ')[0].data).data('description',$.parseHTML(filteredJobs[i].description||' ')[0].data)
      $( "#searchesTBody .delSearchBtn" ).last().data('id', filteredJobs[i].id)
      $(".BStooltip").tooltip({ trigger: 'hover', container: 'body' })
    }

    $('.delSearchBtn').on('click', function(event){
      event.preventDefault();
      let retVal = confirm("Are you sure you want to delete this job?")
      if(!retVal)
        return false
      APIdeleteJob(JSON.stringify({id:$(this).data('id')}), ()=>{
        localStorage.removeItem('visitedUrls'+jobId)
        setTimeout(()=>{renderpage('searches')},300)
      })
      //return true
    })

    $('.editSearchBtn').on('click', function(event){
      event.preventDefault();
      var jobIdForEdit = $(this).data('id')
      $('#searchId').val(jobIdForEdit)
      $('#searchNameBox').val($(this).data('name'))
      $('#searchDescriptionBox').val($(this).data('description'))
    })
  })

  if(userId) {
    window._searchesSocketHandler = function(obj){
      if(obj && obj.channel === userId+'command' && obj.command === 'doneProcAndValid')
        renderpage('searches')
    }
    socket.on('all', window._searchesSocketHandler)
  }

  $('#newSearchForm').on('submit', function(event) {
    event.preventDefault();
    APIaddNewSearch($('#newSearchForm').serializeObject(), ()=>{$('#newSearchModal').modal('hide');setTimeout(()=>{renderpage('searches')},300)})
  })
  $('#editSearchForm').on('submit', function(event) {
    event.preventDefault();
    APIupdateJob($('#editSearchForm').serializeObject(), ()=>{$('#editSearchModal').modal('hide');setTimeout(()=>{renderpage('searches')},300)})
  })

  
}

function searchesUnload()
{
  $('#newSearchForm').off('submit')
  $('#editSearchForm').off('submit')
  $('#newSearchPlatform').off('change')
  if(window._searchesSocketHandler) {
    socket.off('all', window._searchesSocketHandler)
    window._searchesSocketHandler = null
  }
}