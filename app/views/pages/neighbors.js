var neighborspage= `<!-- Content Header (Page header) -->
    
    <section class="content-header">
      <button class="btn btn-light" type="button" onclick="loadpage('main', true);">
        <span class="fa fa-chevron-left" aria-hidden="true"></span>
      </button><h1 style="display: inline;vertical-align:  middle;">
        Friends
        <small></small>
      </h1>
      <button type="button" class="btn btn-success" data-toggle="modal" data-target="#newNeighbor">Add Friend</button>
    </section>

    <!-- Main content -->
    <section class="content">
    
      <!-- Info boxes -->
      <div id="neighborsRow" class="row">

        <!-- fix for small devices only -->
        <div class="clearfix visible-sm-block"></div>
<div class="col-md-3">

          <!-- Profile Image -->
          <div class="box box-primary">
            <div class="box-body box-profile">
              <img class="profile-user-img img-responsive img-circle" src="images/user2-160x160.jpg" alt="User profile picture">
              <h3 class="profile-username text-center">Denise Marie</h3>
              <p class="text-muted text-center">Software Engineer</p>
              <a href="#" class="btn btn-primary btn-block"><b>Follow</b></a>
            </div>
            <!-- /.box-body -->
          </div>
          <!-- /.box -->
        </div>
        
      </div>
    </section>
    <!-- /.content -->
    <!-- Modal -->
<div id="newNeighbor" class="modal fade" role="dialog" style="display: none;">
  <div class="modal-dialog">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">×</button>
        <h4 class="modal-title">New Neighbor</h4>
      </div>
      <div class="modal-body">
        <div class="box-body">
          <form role="form" id="newNeighborForm" data-toggle="validator">
            <div class="form-group">
              <label>Name</label>
              <input name="name" type="text" class="form-control" placeholder="Neighbor Name" required>
            </div><!-- text input -->
            <div class="form-group">
              <label>Location</label>
              <input name="location" type="text" class="form-control" placeholder="Kijimkujik" required>
            </div>
            

            <!-- textarea -->
            <div class="form-group">
              <label>Note</label>
              <textarea name="note" class="form-control" rows="3" placeholder="This is my note here"></textarea>
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
          <button type="button" class="btn btn-primary" onclick="$('#newNeighborForm').submit();">Save</button>
        </div>
      </div>
    </div>

  </div>
</div>
<!-- Modal END-->
`;

function testneighborsfunc()
{

  getNeighbors(null, function(myNeighbors){
    for(let i=0;i< myNeighbors.length;i++)
    {
      $('#neighborsRow').append(`
        <div class="col-md-3">
          <!-- Profile Image -->
          <div class="box box-primary">
            <div class="box-body box-profile">
              <img class="profile-user-img img-responsive img-circle" src="images/user2-160x160.jpg" alt="User profile picture">
              <h3 class="profile-username text-center">Nina Mcintire</h3>
              <p class="text-muted text-center">Software Engineer</p>
              <a href="#" class="btn btn-primary btn-block"><b>Follow</b></a>
            </div>
            <!-- /.box-body -->
          </div>
          <!-- /.box -->
        </div>
      `);
    }
  });

  $('#newNeighborForm').on('submit', function(event) {
    event.preventDefault();
    newNeighbor($("#newNeighborForm").serializeObject());
  });
}