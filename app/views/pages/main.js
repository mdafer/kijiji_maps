var mainpage=`<!-- Content Header (Page header) -->
    <section class="content-header">
      <h1>
        Dashboard
        <small></small>
      </h1>
      
    </section>

    <!-- Main content -->
    <section class="content">
      <div class="row">
      <!-- Info boxes -->
      <!-- /.col -->
        <a href="#map" onclick="loadpage('map');">
        <div class="col-md-4 col-sm-6 col-xs-12">
          <div class="info-box">
            <span class="info-box-icon bg-red"><i class="fa fa-map-marker" style="line-height: 90px;"></i></span>

            <div class="info-box-content" style="text-align: center;display: inline;">
              <span class="info-box-text">Map</span>
              <span id="searchesCount" class="info-box-number"></span>
            </div>
            <!-- /.info-box-content -->
          </div>
          <!-- /.info-box -->
        </div>
        </a>
      <!-- /.col -->
      
        <!-- /.col -->
        <a href="#searches" onclick="loadpage('searches');">
        <div class="col-md-4 col-sm-6 col-xs-12">
          <div class="info-box">
            <span class="info-box-icon bg-green"><i class="fa fa-leaf" style="line-height: 90px;"></i></span>

            <div class="info-box-content" style="text-align: center;display: inline;">
              <span class="info-box-text">Searches</span>
              <span id="searchesCount" class="info-box-number"></span>
            </div>
            <!-- /.info-box-content -->
          </div>
          <!-- /.info-box -->
        </div>
        </a>
        <!-- /.col -->

        <!-- .col -->
        <a href="#neighbors" onclick="loadpage('neighbors');">
        <div class="col-md-4 col-sm-6 col-xs-12">
          <div class="info-box">
            <span class="info-box-icon bg-aqua"><i class="glyphicon glyphicon-globe" style="line-height: 90px;"></i></span>

            <div class="info-box-content" style="text-align: center;display:inline;">
              <span class="info-box-text">Friends</span>
              <span id="neighborsCount" class="info-box-number"></span>
            </div>
            <!-- /.info-box-content -->
          </div>
          <!-- /.info-box -->
        </div>
        </a>
        <!-- /.col -->

        <!-- fix for small devices only -->
        <div class="clearfix visible-sm-block"></div>
      </div>

      
      

      
      <div class="control-group" style="margin-top: 1%;">
      
    <div class="row">
       
    <div class="col-md-6">
      <div class="box box-warning box-solid" style="border: 0;">
        <div class="box-header with-border">
          <h3 class="box-title">Make Friends</h3>
          <!-- /.box-tools -->
        </div>
        <!-- /.box-header -->
        <div class="box-body" style="">
          Get to know your neighbors and make friends!
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
    <div class="col-md-6">
      <div class="box box-warning box-solid" style="border: 0;">
        <div class="box-header with-border">
          <h3 class="box-title">Be Part of the Change</h3>
          <!-- /.box-tools -->
        </div>
        <!-- /.box-header -->
        <div class="box-body" style="">
          Something that can be improved? Share your thoughts!
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
  </div></div></section>
    <!-- /.content -->`;

function mainfunc()
{
 /* getDashboardInfo(null, function(dashboardInfo){
    $('#neighborsCount').html(dashboardInfo.neighbors);
    $('#searchesCount').html(dashboardInfo.causeers);
  });*/
}

function mainUnload(){}