jobId = localStorage.getItem("jobId")
jobName = localStorage.getItem("jobName")

refreshUrlParams()
function refreshUrlParams()
{
	urlParams = window.location.hash.split('?')
	
	if(urlParams[1])
	{
		urlParams = urlParams[1].split('$')[0]
		urlParams = parseQueryParams(urlParams)
		jobId = urlParams.jobId
		jobName = urlParams.jobName
		localStorage.setItem('jobId', jobId)
		localStorage.setItem('jobName', jobName)
	}
	else
		urlParams = {}
}
function renderpage(params={})
{
	refreshUrlParams()
	
	if(window['currentState'] && window[window['currentState']+'Unload'])
		window[window['currentState']+'Unload']()
	$('.modal').removeClass('fade')
	$('.modal').modal('hide')
	$('.modal').addClass('fade')
	//$("body").addClass('sidebar-collapse').trigger('collapsed.pushMenu')
	if(localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).email == "Test@test.com")
		localStorage.removeItem('user')
	if(!localStorage || !localStorage.user)
	{
		$('#loginModal').modal('show')
		//make modal persistent
		$("#loginModal").on('hide.bs.modal', function () {  
			return false
		})
		return false
	}
	else
	{
		let myUser = $.parseJSON(localStorage.user)
		userId=myUser._id
		myUser.fullName = myUser.firstName+' '+myUser.lastName
		if(myUser.profile)
		{
			myUser.image = JSON.parse(myUser.profile).avatar
			$('.img-circle').attr('src', myUser.image)
			$('.user-image').attr('src', myUser.image)
		}
		$('#TopRightName').text(myUser.fullName)
		$('#hiddenName').text(myUser.fullName)
		$('#sidebarName').text(myUser.fullName)
		$('#profileForm [name="firstName"]').val(myUser.firstName)
		$('#profileForm [name="lastName"]').val(myUser.lastName)
		$('#profileForm [name="email"]').val(myUser.email)
	}

	let splitter = location.href.lastIndexOf('#')
	let modalSplitter = location.href.lastIndexOf('$')
	
	let mystate = 'main'
	if(splitter>-1)//if page specified
			mystate = modalSplitter>-1?location.href.substring(splitter+1, modalSplitter):location.href.substring(splitter+1)//if modal specified
	mystate = mystate.split('?')[0]
	mystate = mystate.toLowerCase() || 'main'
	window['currentState'] = mystate

	if(!(jobId && jobName) && mystate=='map' )
	{
		alert('Please select a search ID first')
		loadpage('searches', true)
		return
	}

	let mypage = window[mystate+'page']
	$('#maincontent').html(mypage)

	if(window[mystate+'func'])
		window[mystate+'func'](params.funcParams)

	if(modalSplitter >-1 && !params.noModals)//modal triggered
		$('#'+location.href.substring(modalSplitter+1)).modal('toggle')

	$('form[data-toggle=validator]').validator('destroy')
	$('form[data-toggle=validator]').validator()

	$('form').on('submit', function() {
		return false
	})
}


function loadpage(mypage, mypush=false)
{
	let splitter = location.href.lastIndexOf('#')
	if(mypush)
		history.pushState(null, null, location.href.substring(0, splitter)+'#'+mypage)//renders the page too
	else
		history.replaceState(null, null, location.href.substring(0, splitter)+'#'+mypage)
	if(mypush)
		renderpage()
	return false
}

function toggleModal(mymodal, close=false)
{
	return
	let splitter = location.href.lastIndexOf('$')
	let newURL = ''
	if(close)
	{
		if(splitter>-1)
			newURL = location.href.substring(0, splitter)
	}
	else
	{
		if(splitter>-1)
			newURL = location.href.substring(0, splitter+1)+mymodal
		else
			newURL = location.href+'$'+mymodal
	}
	history.pushState(null, null, newURL)
	return false
}

$(window).on("popstate", function(e) {
	renderpage()
})