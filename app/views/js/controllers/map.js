function initMap(params) {
  if(!map || !mapJobId || mapJobId != params.jobId)
  {

    mapJobId = params.jobId
    map = new google.maps.Map(document.getElementById('map'), {
      center: new google.maps.LatLng(43.5890, -79.6441),
      zoom: 8,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    })
    infowindow =  new google.maps.InfoWindow({
      disableAutoPan: true,
      content: ''
    })
    /*Search box*/
    var input = document.getElementById("pac-input")
    var searchBox = new google.maps.places.SearchBox(input)
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input)

    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", function() {
      searchBox.setBounds(map.getBounds())
    });
    searchBox.addListener("places_changed", function() {
    var places = searchBox.getPlaces()

    if (places.length == 0) {
      return;
    }

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds()
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry")
        return;
      }

      if (place.geometry.viewport)
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport)
      else
          bounds.extend(place.geometry.location)
      });
      map.fitBounds(bounds)
    });

    $('#map').height(function(index, height) {
      return window.innerHeight - $(this).offset().top - $('.main-footer').outerHeight()
    })
  }
  else
  {
    $('#pac-input').remove()
    $('#map').replaceWith(map.getDiv())
    $('#map').height(function(index, height) {
    return window.innerHeight - $(this).offset().top - $('.main-footer').outerHeight()-40
  })
  }
  //params.forceAllMarkers = true
  getAdsAsync(params, true)

  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length)
  
  localStorage.setItem('hideMarkers', false)
}

function getAdsAsync(params, centerMapLocation=false)
{
  //async
  APIgetAds(params, function(adsResult){
    if(adsResult.length)
      lastUpdated = moment(MongoDateFromId(adsResult[adsResult.length-1]._id)).tz("America/Toronto").format("YYYY-MM-DD hh:mm a z")
    else
      lastUpdated = "Unknown"
    const expiredAds = _markers.filter( (el)=>{return !adsResult.find(resAd=>{return resAd.url == el.url})})//expired ads
    const expiredMarkers = getMarkersFromAds(expiredAds)
    if(expiredMarkers && expiredMarkers.length)
      clearMapMarkers(expiredMarkers)//remove expired from map and from _markers
    const newAds = adsResult.filter( (el)=>{return !_markers.find(marker=>{return marker.url == el.url})})//new ads
    /*if(params.forceAllMarkers)
      setMarkersByAds(map, adsResult, centerMapLocation)
    else*/ if(newAds)
      setMarkersByAds(map, newAds, centerMapLocation)//add new ads to map and to _markers
    $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length || 0)
  });
}

function hideViewedMarkers()
{
  //event.preventDefault()
  localStorage.setItem('hideMarkers', true)
  $("#hideViewedbtn").attr("onclick","showViewedMarkers()")
  $("#hideViewedbtn").attr('data-original-title', "Click to show viewed ads").tooltip('show')
  $("#hideViewedicon").removeClass('fa-eye')
  $("#hideViewedicon").addClass('fa-eye-slash')
  if(!visitedUrls || !visitedUrls.length)
    return
  const viewedMarkers = getViewedMarkers()
  clearMapMarkers(getViewedMarkers(), false)
  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ (_markers.length - viewedMarkers.length))
}

function showViewedMarkers()
{
  //event.preventDefault()
  localStorage.setItem('hideMarkers', false)
  getViewedMarkers().forEach(marker => marker.setMap(map));
  $("#hideViewedbtn").attr("onclick","hideViewedMarkers()")
  $("#hideViewedbtn").attr('data-original-title', "Click to hide viewed ads").tooltip('show')
  $("#hideViewedicon").removeClass('fa-eye-slash')
  $("#hideViewedicon").addClass('fa-eye')
  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length || 0)
}

function clearMapMarkers(markers='all', removeFromGlobalMarkers=true)
{
  if(!markers)
    return
  if(markers == 'all')
    markers = _markers
  for(let i=0;i<markers.length;i++)
    markers[i].setMap(null)
  if(removeFromGlobalMarkers)
    _markers = _markers.filter( (el)=> {return !markers.find(marker=>marker.url ==el.url)} );
  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length)
}

function download(content, fileName, contentType) {
    var a = document.createElement("a")
    var file = new Blob([content], {type: contentType})
    a.href = URL.createObjectURL(file)
    a.download = fileName
    a.click()
}
function saveViewed()
{
  download(localStorage.getItem('visitedUrls'+jobId), 'Viewed Ads List for '+jobName+'.txt', 'text/plain')
}

function updateViewedList(e) {
  let loadedList = JSON.parse(e.target.result);
  if(!loadedList || !loadedList.length)
    return

  if(!visitedUrls || !visitedUrls.length)
  {
    localStorage.setItem('visitedUrls'+jobId, JSON.stringify(loadedList))
    visitedUrls = loadedList
  }
  else
  {
    let concatinated = loadedList.concat(visitedUrls)
    let uniqueList = concatinated.filter((item, pos) => {return concatinated.indexOf(item) === pos})
    localStorage.setItem('visitedUrls'+jobId, JSON.stringify(uniqueList))
    visitedUrls = uniqueList
  }
  _markers.forEach(marker=> {
    if(visitedUrls.includes(marker.url))
      marker.icon.url = "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png"
  })
  hideViewedMarkers()
  showViewedMarkers()
}

function rebuildViewedList()
{
  let retVal = confirm("Are you sure you want to re-index viewed ads list for this search?")
  if(!retVal)
    return false
  if(!visitedUrls || !visitedUrls.length)
    return
  let uniqueList = visitedUrls.filter(LocalUrl => {return _markers.some(marker => marker.url == LocalUrl)})
  localStorage.setItem('visitedUrls'+jobId, JSON.stringify(uniqueList))
  return true
}

function resetJob()
{
  let retVal = confirm("Are you sure you want to update ads of this search from Kijiji?")
  if(!retVal)
    return false
  $('#informationModal').modal('show')
  APIresetJob(JSON.stringify({jobId}))
  return true
}

function mapClearInformationWindow()
{
  $('#informationStatus').text('')
  $('#informationStatus2').text('')
  $("#messages").html(
    `<div class="row" style="max-width:100%">
      <div class="col-xs-3 text-center" style="padding:0">
        Time
      </div>
      <div class="col-xs-9 text-center">
        Message
      </div>
    </div>`
)}

/*function mapCheckNewAds()
{
  let retVal = confirm("This does not remove old ads, it just ads newest one. To reset all results, click the 'Reset All Ads From Kijiji' button.")
  if(!retVal)
    return false
  $('#informationModal').modal('show')
  APIcheckLatestAds('{"jobId":"Denise"}')
  return true
}*/

function mapResetViewed()
{
  let retVal = confirm("Are you sure you want to clear viewed ads history of this search?")
  if(!retVal)
    return false
  localStorage.removeItem('visitedUrls'+jobId)
  getViewedMarkers().forEach(marker => marker.setIcon("https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"));
  visitedUrls=[]
  return true
}