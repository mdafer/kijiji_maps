var mappage= `<!-- Content Header (Page header) -->
    
    <section class="content-header">
      <button class="btn btn-light" type="button" onclick="loadpage('main', true);">
        <span class="fa fa-chevron-left" aria-hidden="true"></span>
      </button><h1 id="mapTitle" style="display: inline;vertical-align:  middle;">
        Steve's Kijiji Maps
        <small></small>
      </h1>
      
      <input type="file" style="display:none" id="importViewedbtn">
      <div class="btn-group">
        <button id="hideViewedbtn" type="button" class="btn btn-default BStooltip" rel="tooltip" data-placement="top" title="Click to hide viewed ads" onclick="hideViewedMarkers()"><i id="hideViewedicon" class="fa fa-eye"></i></button>
        <div class="btn-group">
          <button type="button" style="height:28px" class="btn btn-default dropdown-toggle BStooltip" data-placement="top" title="Viewed ads settings" data-toggle="dropdown" aria-expanded="true">
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
      <button type="button" class="btn btn-primary BStooltip" rel="tooltip" data-placement="top" title="Filters & Settings" data-toggle="modal" data-target="#mapFiltersModal"><i class="fa fa-sliders"></i></button>
      <button type="button" class="btn btn-success BStooltip" rel="tooltip" data-placement="top" title="Reset all ads from Kijiji" onclick="resetJob()"><i class="fa fa-refresh"></i></button>
      <button type="button" class="btn btn-default BStooltip" rel="tooltip" data-placement="top" title="Information" data-toggle="modal" data-target="#informationModal"><i class="glyphicon glyphicon-info-sign"></i></button>
    </section>

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
    <!-- !!Main Content-->
    <!-- Modal -->
<div id="mapFiltersModal" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">×</button>
        <h4 class="modal-title">Filters & Settings</h4>
      </div>
      <div class="modal-body">
        <div class="box-body">
          <h4 style="margin-top:-15px;margin-bottom:20px">Map Filters</h4>
          <form role="form" id="mapFiltersForm" data-toggle="validator">
            <div class="form-group">
              <input id="jobId" name="jobId" type="text" hidden style="display:none"></input>
              <label>Price</label>
              <input id="fromPrice" name="fromPrice" type="text" placeholder="Min"></input>
              <input id="toPrice" name="toPrice" type="text" placeholder="Max"></input>
            </div><!-- text input -->
            <div class="form-group">
              <label>Oldest Date</label>
              <input id="fromDate" name="fromDate" type="date">
            </div>
            
            <div class="form-group">
              <label>Search text</label>
              <input id="searchText" name="searchText" type="text" placeholder="" value="">
              <input type="checkbox" id= "searchTitleOnly" name="searchTitleOnly" value="true">
              <label for="searchTitleOnly">Search Title Only</label>
            </div>
            <input type="submit" value="Submit" style="display:none;">
          </form>
        </div>
      </div>
      <div class="modal-footer">
        <div class="pull-left">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
        <div class="pull-right">
          <button type="button" class="btn btn-primary" onclick="$('#mapFiltersForm').submit();">Save</button>
        </div>
      </div>
    </div>

  </div>
</div>
<!-- Modal END-->

<!-- Modal -->
<div id="informationModal" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog modal-lg">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header" style="padding-bottom:5px">
        <button type="button" class="close" data-dismiss="modal">×</button>
        <h4 class="modal-title" style="padding-bottom:10px">Information</h4>
        <p id="informationStatus" style="margin:0"></p>
        <p class='resultscount pull-right' style="margin:0px">Number of results: 0</p> 
        <p id="informationStatus2" style="margin:0"></p>
      </div>
      <div class="modal-body">
        <div id="messages" class="box-body">
        </div>
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
<!-- Modal END-->
`;
function addInfoRow(row)
{
  $('#messages').append(`<div class="row">
    <div class="col-xs-3 text-center wrap" style="padding:0">
      ${row.date}
    </div>
    <div class="col-xs-9 wrap">
      ${row.print}
    </div>
  </div>`);
  if($('#autoScroll').is(':checked') && $('#informationModal').hasClass('in'))
      $("#messages").scrollTop($("#messages")[0].scrollHeight);
}
function mapfunc()
{
  visitedUrls = JSON.parse(localStorage.getItem('visitedUrls'+jobId)) || []
  mapClearInformationWindow()
  
  $(".BStooltip").tooltip({ trigger: 'hover' })
  var reader = new FileReader()
  document.getElementById('importViewedbtn').addEventListener('change', (event) => {
    const myfile = event.target.files[0]
    reader.onload = updateViewedList
    reader.readAsText(myfile)
  })

  $('#searchTitleOnly').prop('checked', false);

  $('#mapTitle').text(jobName)
  
  $('#jobId').val(jobId)
  if(urlParams.fromPrice)
    $("#fromPrice").val(urlParams.fromPrice)
  if(urlParams.toPrice)
    $("#toPrice").val(urlParams.toPrice) 
  if(urlParams.fromDate)
    $("#fromDate").val(urlParams.fromDate)
  if(urlParams.searchText)
    $("#searchText").val(urlParams.searchText)
  initMap({...urlParams, jobId:jobId})

  $('#mapFiltersForm').on('submit', function(event) {
    event.preventDefault();
    $('#mapFiltersModal').modal('hide');
    getAdsAsync($('#mapFiltersForm').serialize())
  });


  socket.on(jobId+'jobUpdate', function(obj){
    addInfoRow(obj)
    if($('#autoScroll').is(':checked') && $('#informationModal').hasClass('in'))
      $("#messages").scrollTop($("#messages")[0].scrollHeight);
  });

  socket.on(jobId+'jobWarning', function(obj){
    addInfoRow(obj)
    if($('#autoScroll').is(':checked') && $('#informationModal').hasClass('in'))
      $("#messages").scrollTop($("#messages")[0].scrollHeight);
  });

  socket.on(jobId+'command', function(obj){
    switch(obj.command)
    {
      case 'procPageNumber':
        addInfoRow({date:obj.date, print:'Processing page: '+obj.print})
        $('#informationStatus').text("Processing Page: "+obj.print)
      break;
      case 'donePageNumber':
        addInfoRow({date:obj.date, print:'Done processing page: '+obj.print})
        if(obj.params.refresh)
          getAdsAsync($('#mapFiltersForm').serialize())
      break;
      case 'doneProc':
        getAdsAsync($('#mapFiltersForm').serialize())
        addInfoRow({date:obj.date, print:'All ads have been refreshed and expired ads removed! Pages processed: '+obj.print})
        $('#informationStatus').text("Ads refreshed! Total pages processed: "+obj.print)
        $('#informationStatus2').text("All expired ads have been removed!")
      break;
      
      case 'removeUrlMarker':
        addInfoRow({date:obj.date, print:'Removing expired ad!'})
        clearMapMarkers(getMarkersFromAds(obj.print))
      break
    }
  });
}

function mapUnload()
{
  $('#mapFiltersForm').off('submit')
  socket.removeAllListeners()
}