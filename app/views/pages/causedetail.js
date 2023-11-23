var networkdetailpage = `
<!-- Content Header (Page header) -->
	
	<section class="content-header">
	  <button class="btn btn-light" type="button" onclick="loadpage('networks', true);">
		<span class="fa fa-chevron-left" aria-hidden="true"></span>
	  </button>
	  <h1 id='networkMainTitle' style="display: inline;vertical-align:  middle;margin-left:5px;">
		<small></small>
	  </h1>
	  <a class="btn" onclick='$("#editBox").slideToggle();'>
		<i class="fa fa-edit"></i> Edit
	  </a>
	</section>

	<!-- Main content -->
	<section class="content">
	<div class="row">
		<div id="editBox" class="col-md-4" style="display:none;">
		  <!-- /.box -->
		  <!-- general form elements disabled -->
		  <div class="box box-warning">
			<div class="box-header with-border">
			  <h3 id="networkTitle" class="box-title"></h3>
			</div>
			<!-- /.box-header -->
			<div class="box-body">
			  <form role="form" data-toggle="validator" id="editNetworkForm">
				<!-- text input -->
				<div class="form-group">
				  <label>Location</label>
				  <input id="networkLocation" name="location" data-error="Please enter name field." type="text" class="form-control" placeholder="Kijimkujik" required>
				</div>
				

				<!-- textarea -->
				<div class="form-group">
				  <label>Note</label>
				  <textarea id="networkNote" name="note" class="form-control" rows="3" placeholder="This is my note here"></textarea>
				</div>

			  </form>
			</div>
			<!-- /.box-body -->
		  <div class="box-footer clearfix">
			<div class="pull-left">
			  <button type="button" class="btn btn-danger" data-toggle="modal" data-target="#deleteNetwork">Delete Network</button>
			</div>
			<div class="pull-right">
			  <button type="button" class="btn btn-primary" onclick="$('#editNetworkForm').submit();">Save</button>
			</div>
		  </div>
		  </div>
		  <!-- /.box -->
		</div><div class="col-md-6">
		  <div class="box">
			<div class="box-header">
			  <h3 class="box-title">Planters</h3>

			  
			</div>
			<!-- /.box-header -->
			<div class="box-body table-responsive">
			  <table class="table table-hover">
				<tbody id="plantersTable">
				  <tr>
					<th style="text-align: center;">Serial</th>
					
					<th style="text-align: center;">Updated</th>
					<th style="text-align: center;">Status</th>
					<th style="text-align: center;">Actions</th>
				  </tr>
				</tbody></table>
			</div>
<div class="box-footer clearfix"><div class="pull-left"><button type="button" class="btn btn-success" data-toggle="modal" data-target="#newGoldoon">New Planter</button></div></div>
			<!-- /.box-body -->
		  </div>
		  <!-- /.box -->
		</div>
	
	  </div>

	  
	  

	  
	  </section>
	<!-- /.content -->
	<!-- New Goldoon Modal -->
<div id="newGoldoon" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">

	<!-- Modal content-->
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal">×</button>
		<h4 class="modal-title">New Planter</h4>
	  </div>
	  <div class="modal-body">
		<div class="box-body">
		  <form role="form" id="newGoldoonForm" data-toggle="validator">
			<div class="form-group">
				<label>Do you have a smart self watering planter to setup?</label>
				<div class="radio">
					<label>
					<input type="radio" name="havePlanter" id="havePlanter1" value="1" checked="">
					Yes
					</label>
				</div>
				<div class="radio">
					<label>
					<input type="radio" name="havePlanter" id="havePlanter2" value="0">
					No
					</label>
				</div>
			</div>
			<div id="SN" class="form-group">
			  <label>Serial Number</label>
			  <input type="number" class="form-control input-lg" placeholder="SN" name="SN">
			</div><!-- text input -->
			<div class="form-group">
			  <label>Assign to plant</label>
			  <select name="planterID" class="form-control">
				
			  </select>
			  </div>


			  <!-- textarea -->
			  <div class="form-group">
				<label>Measurement Unit</label><div class="radio">
				  <label>
					<input type="radio" name="measurementUnit" value="0" checked="">
					8 cm | 23° C | 8 lit | 4 kg
				  </label>
				</div>
				<div class="radio">
				  <label>
					<input type="radio" name="measurementUnit" value="1">
					8 in | 74° F | 45 oz | 8 lb
				  </label>
				</div>

			  </div>

			  <div class="form-group">
				<label>Location</label>
				<input name="location" type="text" class="form-control" placeholder="e.g. Kitchen" required>
			  </div>

			  <div id="lastWateredDate" class="form-group" hidden>
				<label>When did you water your plant?</label>

				<div class="input-group date">
				  <div class="input-group-addon">
					<i class="fa fa-calendar"></i>
				  </div>
				  <input type="text" class="form-control pull-right" id="datepicker">
				</div>
				<!-- /.input group -->
			  </div>

			  <div id="waterAddedQuantity" class="form-group" hidden>
				 <label>How much water added to your plant?</label>
				 <div class="input-group">
				   <input name="waterLevel" type="text" placeholder="e.g. 125" class="form-control">
				   <span class="input-group-addon">ml</span>
				 </div>
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
			  <button type="button" class="btn btn-primary" onclick="$('#newGoldoonForm').submit();">Save</button>
			</div>
		  </div>
		</div>

	  </div>
	</div>
<!-- Modal END-->

<!-- editGoldoon Modal -->
<div id="editGoldoon" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">

	<!-- Modal content-->
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal">×</button>
		<h4 class="modal-title">Edit Planter</h4>
	  </div>
	  <div class="modal-body">
		<div class="box-body">
		  <form role="form" id="editGoldoonForm" data-toggle="validator">
			<div class="form-group">
			  <label>Assign to plant</label>
			  <select name="planterID" class="form-control">

			  </select>
			</div>


			  <!-- textarea -->
			  <div class="form-group">
				<label>Measurement Unit</label><div class="radio">
				  <label>
					<input type="radio" name="measurementUnit" value="0" checked="">
					8 cm | 23° C | 8 lit | 4 kg
				  </label>
				</div>
				<div class="radio">
				  <label>
					<input type="radio" name="measurementUnit" value="1">
					8 in | 74° F | 45 oz | 8 lb
				  </label>
				</div>

			  </div>

			  <div class="form-group">
				<label>Location</label>
				<input name="location" type="text" class="form-control" placeholder="e.g. Kitchen">
			  </div>
			  <input type="submit" value="Submit" style="display:none;"> 
			  </form>
			</div>
		  </div>
		  <div class="modal-footer">
			<div class="pull-left">
			  <button type="button" class="btn btn-danger" data-toggle="modal" data-target="#deleteDevice">Delete</button>
			</div>
			<div class="pull-right">
			  <button type="button" class="btn btn-primary" onclick="$('#editGoldoonForm').submit();">Save</button>
			</div>
		  </div>
		</div>

	  </div>
	</div>
<!-- Modal END-->

<!-- chart Modal -->
<div id="chartModal" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		  Charts
	  </div>
	  <div class="modal-body">
		  <canvas id="monthlyChart"></canvas>
		  <canvas id="weeklyChart"></canvas>
	  </div>
	  <div class="modal-footer">
		<button type="button" class="btn btn-default" data-dismiss="modal">OK</button>
		<!--<a id="deleteNetworkBtn" data-dismiss="modal" class="btn btn-default btn-ok">OK</a>-->
	  </div>
	</div>
  </div>
</div>
<!-- Modal END-->

<!-- deleteNetwork Modal -->
<div id="deleteNetwork" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		  Delete Network
	  </div>
	  <div class="modal-body">
		  Are you sure you want to delete this network?
	  </div>
	  <div class="modal-footer">
		<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
		<a id="deleteNetworkBtn" class="btn btn-danger btn-ok">Delete</a>
	  </div>
	</div>
  </div>
</div>
<!-- Modal END-->

<!-- deleteDevice Modal -->
<div id="deleteDevice" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		  Delete Device
	  </div>
	  <div class="modal-body">
		  Are you sure you want to delete this device?
	  </div>
	  <div class="modal-footer">
		<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
		<a id="deleteDeviceBtn" class="btn btn-danger btn-ok">Delete</a>
	  </div>
	</div>
  </div>
</div>
<!-- Modal END-->

<!-- DeviceRecords Modal -->
<div id="DeviceRecords" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">
	<!-- Modal content-->
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal">×</button>
		<h4 class="modal-title">Device Records</h4>
	  </div>
	  <div class="modal-body">
		<div class="box-body">
			<table class="table table-hover">
				<tbody id="deviceRecordsTable">
				  <tr>
					<th style="text-align: center;">Water</th>
					
					<th style="text-align: center;">Temp</th>
					<th style="text-align: center;">Humidity</th>
					<th style="text-align: center;">Watered</th>
				  </tr>
				</tbody>
			</table>
			</div>
		  </div>
		  <div class="modal-footer">
			<div class="pull-left">
			  <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
			</div>
		  </div>
		</div>
	  </div>
	</div>
<!-- Modal END-->
`;

function fillEditGoldoonForm(myDevice)
{
	sessionStorage.deviceID = myDevice.ID;
	$("#editGoldoonForm select[name=planterID]").val(myDevice.planterID);
	$("#editGoldoonForm input[name=measurementUnit][value="+myDevice.measurementUnit+"]").prop("checked", true);
	$("#editGoldoonForm input[name=location]").val(myDevice.location);
}

var monthlyChart;
var weeklyChart;

function fillMonthlyChart(data)
{
	if(!data)
		return;
	let labels = [],
		values = [];
	_.each( data, function( val, key ) {
          values.push(val);
          labels.push(key);
        });
	values.reverse();
	labels.reverse();
	monthlyChart.data.datasets[0].data= values;
	monthlyChart.data.labels = labels;
    monthlyChart.update();
    $("#chartModal").modal("show");
}

function fillWeeklyChart(data)
{
	if(!data)
		return;
	let labels = [],
		values = [];
	_.each( data, function( val, key ) {
          values.push(val);
          labels.push(key);
        });
	labels.reverse();
	values.reverse();
	weeklyChart.data.datasets[0].data= values;
	weeklyChart.data.labels = labels;
    weeklyChart.update();
}

function fillDeviceRecords(myRecords)
{
	if(!myRecords)
		return;
	$('#DeviceRecords').modal('show');
	for(let i=0; i<myRecords.length;i++)
	{
		$('#deviceRecordsTable').append(`
			<tr>
				<td style="vertical-align: middle;text-align: center;">${myRecords[i].water}</td>
				<td style="vertical-align: middle;text-align: center;">${myRecords[i].temp}</td>
				<td style="vertical-align: middle;text-align: center;">${myRecords[i].humidity}</td>
				<td style="vertical-align: middle;text-align: center;">${new Date(myRecords[i].watered).toDateString()}</td>
			</tr>
		`);
	}
}

function networkdetailfunc()
{
	monthlyChart = new Chart($("#monthlyChart"), {
	type: 'line',
	data: {
	    labels: ["Week 1", "Week2", "Week3", "Week4"],
	    datasets: [{
	        label: 'Monthly',
	        data: [12, 19, 3, 5],
	        //backgroundColor: 'rgb(255, 99, 132)',
	        borderColor: '#42bff4',
	        fill:false
	    }]
	},
	options: {
	  scales: {
	    xAxes: [{
	      ticks: {
	          beginAtZero: true,
	          reverse: true,
	        },
	        display: true,
	    }]
	  }
	}
	});
	weeklyChart= new Chart($("#weeklyChart"), {
	type: 'line',
	data: {
	    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
	    datasets: [{
	        label: 'Weekly',
	        data: [12, 19, 3, 5,20, 2,30],
	        //backgroundColor: 'rgb(255, 99, 132)',
	        borderColor: '#42bff4',
	        fill:false
	    }]
	}
  });
  if(!sessionStorage.networkID)
  {
	loadpage("networks", true);
	return;
  }
  getNetwork({id: sessionStorage.networkID}, function(myNetwork){
	$('#networkMainTitle').text(myNetwork.name);
	$('#networkTitle').text(myNetwork.name);
	$('#networkLocation').val(myNetwork.location);
	$('#networkNote').val(myNetwork.note);
  });

  getNetworkDevices({id: sessionStorage.networkID}, function(myDevices){
	for(let i=0;i< myDevices.length;i++)
	{
	  $('#plantersTable').append(`
		<tr>
		  <td style="vertical-align: middle;">${myDevices[i].SN}</td>
		  <td style="vertical-align: middle;">${new Date(myDevices[i].modified).toDateString()}</td>
		  <td style="vertical-align: middle;"><span ${myDevices[i].waterLevel<100?'class="label label-danger">Refill ASAP':'class="label label-success">Excellent'}</span></td>
		  <td style="vertical-align: middle;">
				<a class="btn" data-toggle="modal" data-target="#editGoldoon" onclick="getDevice({id:${myDevices[i].ID}}, fillEditGoldoonForm);">
					<i class="fa fa-edit"></i> Edit
				</a>
				<a class="btn" onclick="getCharts({id:${myDevices[i].ID}}, fillMonthlyChart, fillWeeklyChart);">
					<i class="fa fa-area-chart"></i> Chart
				</a>
				<a class="btn" onclick="getDeviceRecords({id:${myDevices[i].ID}}, fillDeviceRecords);">
					<i class="fa fa-table"></i> Table
				</a>
				<a class="btn" onclick="testDevice({id:${myDevices[i].ID}});">
					<i class="fa fa-eye"></i> Test
				</a>
		  </td>
		</tr>
	  `);
	}
  });

  getPlanters(null, function(myPlants){
	for(let i=0;i< myPlants.length;i++)
	{
	  $('select[name=planterID]').append('<option value="'+myPlants[i].ID+'">'+myPlants[i].plantName+': '+myPlants[i].waterAmount+'ml every '+myPlants[i].waterFrequency+' days</option>');
	}
  });

  $('#newPlantForm').on('submit', function(event) {
	event.preventDefault();
	newPlanter($("#newPlantForm").serializeObject());
  });

  $('#deleteNetworkBtn').click(function(e) {
	deleteNetwork({id:sessionStorage.networkID});
  });

  $('#deleteDeviceBtn').click(function(e) {
	deleteDevice({id:sessionStorage.deviceID});
  });

  $('#editNetworkForm').on('submit', function(event) {
	event.preventDefault();
	let myparams = $("#editNetworkForm").serializeObject();
	myparams.id=sessionStorage.networkID;
	editNetwork(myparams);
  });

   $('#editGoldoonForm').on('submit', function(event) {
	event.preventDefault();
	let myparams = $("#editGoldoonForm").serializeObject();
	myparams.id=sessionStorage.deviceID;
	editDevice(myparams);
  });

   $('#newGoldoonForm').on('submit', function(event) {
	event.preventDefault();
	let myparams=$("#newGoldoonForm").serializeObject();
	myparams.networkID = sessionStorage.networkID;
	newDevice(myparams);
  });

  $('input[type=radio][name=havePlanter]').change(function() {
	if (this.value == '0') {
	  $('#lastWateredDate').show();
	  $('#waterAddedQuantity').show();
	  $('#SN').hide();
	}
	else if (this.value == '1') {
	  $('#lastWateredDate').hide();
	  $('#waterAddedQuantity').hide();
	  $('#SN').show();
	}
	});

	//Date picker
  $('#datepicker').datepicker({
	autoclose: true
  })
}