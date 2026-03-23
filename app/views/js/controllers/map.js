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
      var cw = $('.content-wrapper')
      return cw.innerHeight() - ($(this).offset().top - cw.offset().top + cw.scrollTop())
    })
  }
  else
  {
    $('#pac-input').remove()
    $('#map').replaceWith(map.getDiv())
    $('#map').height(function(index, height) {
      var cw = $('.content-wrapper')
      return cw.innerHeight() - ($(this).offset().top - cw.offset().top + cw.scrollTop())
    })
  }
  //params.forceAllMarkers = true
  getAdsAsync(params, true)

  $(".resultscount").html('Last Updated: '+lastUpdated+', Number of results: '+ _markers.length)

  localStorage.setItem('hideMarkers', false)

  // Restore shape filter if it was active before switching views
  if(hasActiveShapeFilter()) {
    restoreShapeOnMap()
  }
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
  if(removeFromGlobalMarkers) {
    _markers = _markers.filter( (el)=> {return !markers.find(marker=>marker.url ==el.url)} );
    if(!_markers.length) { _allAmenities = new Set(); _amenityIdMap = {} }
  }
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
  showConfirmModal(
    'Re-index Viewed Ads',
    'Are you sure you want to re-index the viewed ads list for this search?',
    function() {
      if(!visitedUrls || !visitedUrls.length) return
      let uniqueList = visitedUrls.filter(LocalUrl => {return _markers.some(marker => marker.url == LocalUrl)})
      localStorage.setItem('visitedUrls'+jobId, JSON.stringify(uniqueList))
    },
    { confirmLabel: 'Re-index', confirmClass: 'btn-warning' }
  )
}

function resetJob()
{
  var platformName = (urlParams.platform === 'airbnb') ? 'Airbnb' : (urlParams.platform === 'facebook') ? 'Facebook' : 'Kijiji'
  var showFolds = true
  $('#refreshListingsModal').remove()
  var foldsHtml = showFolds ? `
    <div class="form-group" style="margin-top:14px">
      <label style="font-weight:600">Price Folds <small class="text-muted">(split by price into N sub-ranges, 2–10, optional)</small></label>
      <input id="refreshFoldsInput" type="number" min="2" max="10" class="form-control" placeholder="Leave empty for no splitting">
    </div>` : ''
  var modalHtml = `
  <div id="refreshListingsModal" class="modal fade" role="dialog" style="display:none">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">&times;</button>
          <h4 class="modal-title"><i class="fa fa-refresh" style="color:#5cb85c;margin-right:7px"></i>Refresh Listings</h4>
        </div>
        <div class="modal-body">
          <p>Update listings for this search from <strong>${platformName}</strong>?</p>
          ${foldsHtml}
          <div id="refreshFoldsError" style="color:#a94442;margin-top:6px;display:none"></div>
        </div>
        <div class="modal-footer">
          <div class="pull-left"><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button></div>
          <div class="pull-right"><button type="button" id="refreshListingsConfirmBtn" class="btn btn-success"><i class="fa fa-refresh"></i> Refresh</button></div>
        </div>
      </div>
    </div>
  </div>`
  $('body').append(modalHtml)
  $('#refreshListingsConfirmBtn').on('click', function() {
    var priceFolds = null
    if(showFolds) {
      var val = $('#refreshFoldsInput').val().trim()
      if(val !== '') {
        priceFolds = Number(val)
        if(isNaN(priceFolds) || priceFolds < 2 || priceFolds > 10) {
          $('#refreshFoldsError').text('Price folds must be between 2 and 10').show()
          return
        }
      }
    }
    $('#refreshListingsModal').modal('hide')
    $('#informationModal').modal('show')
    var params = {jobId}
    if(priceFolds) params.priceFolds = priceFolds
    APIresetJob(JSON.stringify(params))
  })
  $('#refreshListingsModal').on('hidden.bs.modal', function(){ $(this).remove() })
  $('#refreshListingsModal').modal('show')
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

function openPhotoGallery(data)
{
  var html = ''
  // Support both flat array (legacy) and {urls, categories} object
  var urls, cats
  if(Array.isArray(data)) {
    urls = data; cats = null
  } else {
    urls = data.urls || []; cats = data.categories
  }

  if(cats && Object.keys(cats).length) {
    // Separate multi-pic categories from single-pic categories
    var multiCats = {}, singleCats = {}
    Object.keys(cats).forEach(function(cat) {
      if(cats[cat].length > 1) multiCats[cat] = cats[cat]
      else singleCats[cat] = cats[cat]
    })

    // Render multi-pic categories normally
    Object.keys(multiCats).forEach(function(cat) {
      html += '<div class="gallery-category">'
      html += '<h3 class="gallery-cat-title">'+cat+'</h3>'
      html += '<div class="gallery-cat-grid">'
      multiCats[cat].forEach(function(url) {
        html += '<img class="gallery-thumb" src="'+url+'" referrerpolicy="no-referrer" onclick="openPhotoZoom(this.src)">'
      })
      html += '</div></div>'
    })

    // Combine single-pic categories into one row with overlaid labels
    var singleKeys = Object.keys(singleCats)
    if(singleKeys.length) {
      html += '<div class="gallery-category">'
      html += '<h3 class="gallery-cat-title">Other Photos</h3>'
      html += '<div class="gallery-cat-grid">'
      singleKeys.forEach(function(cat) {
        var url = singleCats[cat][0]
        html += '<div class="gallery-thumb-labeled">'
        html += '<img class="gallery-thumb" src="'+url+'" referrerpolicy="no-referrer" onclick="openPhotoZoom(this.src)">'
        html += '<span class="gallery-thumb-label">'+cat+'</span>'
        html += '</div>'
      })
      html += '</div></div>'
    }
  } else {
    urls.forEach(function(url){
      html += '<img class="gallery-thumb" src="'+url+'" referrerpolicy="no-referrer" onclick="openPhotoZoom(this.src)">'
    })
  }
  $('#photoGalleryContent').html(html)
  $('#photoGalleryOverlay').fadeIn(200)
  $('body').css('overflow','hidden')
}

function closePhotoGallery()
{
  closePhotoZoom()
  $('#photoGalleryOverlay').fadeOut(200)
  $('body').css('overflow','')
}

function openPhotoZoom(src)
{
  $('#photoGalleryZoomImg').attr('src', src)
  $('#photoGalleryZoom').addClass('active')
}

function closePhotoZoom()
{
  $('#photoGalleryZoom').removeClass('active')
  $('#photoGalleryZoomImg').attr('src', '')
}

function openAvailabilityCalendar(adId) {
  var ad = typeof _gridAds !== 'undefined' ? _gridAds.find(function(a){ return a._id === adId }) : null
  if(!ad && typeof _markers !== 'undefined') {
    var m = _markers.find(function(mk){ return mk.adData && mk.adData._id === adId })
    if(m) ad = m.adData
  }
  if(!ad || !ad.availability) {
    showAlertModal('Availability Not Found', 'Availability data is not available for this listing. If it\'s an Airbnb listing, try refreshing it to fetch the 12-month calendar.')
    return
  }
  
  $('#availabilityTitle').text('12-Month Availability: ' + ad.title)
  var grid = $('#availabilityCalendarGrid')
  grid.empty()
  
  // Group by month
  var months = {}
  Object.keys(ad.availability).sort().forEach(function(date) {
    var monthKey = date.substring(0, 7) // YYYY-MM
    if(!months[monthKey]) months[monthKey] = []
    months[monthKey].push(Object.assign({date: date}, ad.availability[date]))
  })
  
  Object.keys(months).forEach(function(mKey) {
    var mName = moment(mKey + '-01').format('MMMM YYYY')
    var html = '<div class="calendar-month-box" style="border:1px solid #ddd;border-radius:6px;overflow:hidden;background:#f9f9f9">'
    html += '<div style="background:#f0f0f0;padding:6px 10px;font-weight:600;text-align:center;border-bottom:1px solid #ddd">'+mName+'</div>'
    html += '<div style="display:grid;grid-template-columns:repeat(7, 1fr);font-size:10px;text-align:center;background:#fff">'
    
    // Header days
    var shortDays = ['Su','Mo','Tu','We','Th','Fr','Sa']
    shortDays.forEach(function(d){ html += '<div style="padding:4px 0;background:#fafafa;font-weight:600;border-bottom:1px solid #eee;color:#777">'+d+'</div>' })
    
    // Fill empty days before 1st
    var firstDate = moment(mKey + '-01')
    for(var i=0; i<firstDate.day(); i++) { html += '<div style="padding:8px 0;border-bottom:1px solid #f9f9f9;border-right:1px solid #f9f9f9"></div>' }
    
    months[mKey].forEach(function(day) {
      var color = day.available ? '#e8f5e9' : '#ffebee'
      var textColor = day.available ? '#2e7d32' : '#c62828'
      var dateNum = day.date.substring(8)
      var priceHtml = day.price ? '<div style="font-size:8px;margin-top:2px;font-weight:400">'+day.price+'</div>' : ''
      html += '<div style="padding:6px 2px;background:'+color+';color:'+textColor+';border-bottom:1px solid #fff;border-right:1px solid #fff;display:flex;flex-direction:column;align-items:center;min-height:38px">'
      html += '<strong>'+parseInt(dateNum)+'</strong>'
      html += priceHtml
      html += '</div>'
    })
    
    html += '</div></div>'
    grid.append(html)
  })
  
  $('#availabilityOverlay').fadeIn(200)
  $('body').css('overflow','hidden')
}

function closeAvailabilityCalendar() {
  $('#availabilityOverlay').fadeOut(200)
  $('body').css('overflow','')
}

function clearJobCache()
{
  showConfirmModal(
    'Clear Cached Listings',
    'Are you sure you want to clear all cached listings for this search? This will remove them from the database.',
    function() {
      APIclearJobAds(JSON.stringify({jobId}), function(result){
        clearMapMarkers('all')
        _markers = []
        $(".resultscount").html('Last Updated: N/A, Number of results: 0')
        showAlertModal('Listings Cleared', 'Cleared <strong>' + (result.removed || 0) + '</strong> cached listings.')
      })
    },
    { confirmLabel: 'Clear Cache', confirmClass: 'btn-danger' }
  )
}

var _listingPopupMap = null
var _listingPopupMarker = null

function openListingMapPopup(lat, lon, title) {
  $('#listingMapModalTitle').text(title || 'Location')
  $('#listingMapModal').modal('show')
  $('#listingMapModal').one('shown.bs.modal', function() {
    var latLng = new google.maps.LatLng(lat, lon)
    if(!_listingPopupMap) {
      _listingPopupMap = new google.maps.Map(document.getElementById('listingMapDiv'), {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      })
      _listingPopupMarker = new google.maps.Marker({ position: latLng, map: _listingPopupMap, title: title || '' })
    } else {
      _listingPopupMap.setCenter(latLng)
      _listingPopupMap.setZoom(15)
      _listingPopupMarker.setPosition(latLng)
      _listingPopupMarker.setTitle(title || '')
      google.maps.event.trigger(_listingPopupMap, 'resize')
    }
  })
}

function mapResetViewed()
{
  showConfirmModal(
    'Clear Viewed History',
    'Are you sure you want to clear the viewed ads history of this search?',
    function() {
      localStorage.removeItem('visitedUrls'+jobId)
      getViewedMarkers().forEach(marker => marker.setIcon("https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"))
      visitedUrls=[]
    },
    { confirmLabel: 'Clear History', confirmClass: 'btn-danger' }
  )
}