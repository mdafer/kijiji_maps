function centerMapLocation(lat, lng){
  const center = new google.maps.LatLng(lat, lng)
  // using global variable:
  map.panTo(center)
}

function MongoDateFromId(objectId) {
  return new Date(parseInt(objectId.substring(0, 8), 16) * 1000)
}

function setMarkersByAds(map, ads, centerLocation = false) {
  if(!ads || !ads.length)
    return
  if(centerLocation)
    centerMapLocation(ads[0].lat, ads[0].lon)
  ads.forEach(ad=> {
    let icon ={url:"https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"}
    if(visitedUrls.includes(ad.url))
      icon.url = "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png"
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(ad.lat, ad.lon),
      icon,
      map: map,
      title: ad.address,
      url: ad.url
    });

    _markers.push(marker)
    bindInfoWindow(marker, map, infowindow, '<h4 style="max-width:200px">'+ad.title+'</h4><h4>$'+ad.price+'</h4><h4><a onclick="markAsViewed(null, \''+ad.url+'\')" href="'+ad.url+'" target="_blank">Visit on Kijiji</a></h4>');
  })
}

var bindInfoWindow = function(marker, map, infowindow, html) {

  function markerClickFunc(){
    infowindow.setContent(html)
    infowindow.open(map, marker)
    markAsViewed(marker, marker.url)
    google.maps.event.clearListeners(marker, 'click')
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.close(map, marker)
      google.maps.event.clearListeners(marker, 'click')
      google.maps.event.addListener(marker, 'click', markerClickFunc)
    })
  }
  google.maps.event.addListener(marker, 'click', markerClickFunc)
  google.maps.event.addListener(marker, 'dblclick', function() {
      markAsViewed(marker,this.url)
      window.open(this.url, '_blank')
      infowindow.close(map, marker)
    })
}

function markAsViewed(marker, url)
{
  if(visitedUrls.includes(url))
    return
  visitedUrls.push(url)
  localStorage.setItem('visitedUrls'+jobId, JSON.stringify(visitedUrls))
  if(!marker)
    marker = _markers.find(marker => {return marker.url === url})
  if(localStorage.getItem('hideMarkers')=='true')
    marker.setMap(null);
  marker.setIcon("https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png")
  return true
}

function getViewedMarkers(markers=null)
{
  markers = markers || _markers
  return markers.filter(marker => {return visitedUrls.includes(marker.url)})
}

/*function mapCheckNewAds()
{
  let retVal = confirm("This does not remove old ads, it just ads newest one. To reset all results, click the 'Reset All Ads From Kijiji' button.")
  if(!retVal)
    return false
  $('#informationModal').modal('show')
  APIcheckLatestAds('{"jobId":"Denise"}')
  return true
}*/

function getMarkersFromAds(ads)
{
  if(!ads || (Array.isArray(ads) && ads.length==0))
    return
  if(!Array.isArray(ads))
    ads=[ads]
  if(typeof ads[0] === 'string' || ads[0] instanceof String)
    ads.forEach((ad,index)=>ads[index]={url:ad})
  return _markers.filter(marker=>{return ads.find(ad=>ad.url==marker.url)})
}

function isTouchScreen(){
  return 'ontouchstart' in window || navigator.maxTouchPoints || (window.DocumentTouch && document instanceof DocumentTouch)
}