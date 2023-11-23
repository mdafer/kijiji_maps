var urlParams
var jobs
var jobId
var jobName
var userId
var map
var _markers =[]
var lastUpdated ="unknown"
var visitedUrls
var mapJobId

$(document).ready(function($) {
	$( "#loginButton" ).click(function() {
	switchRegister()
	});
	
	$(".clickable-row").click(function() {
		window.location = $(this).data("href")
	});
});

$('#loginForm').on('submit', function(event) {
	event.preventDefault();
	if($('#loginTitle').text() == 'Login')
		APIlogin($("#loginForm").serializeObject(), function(params){
			$("#loginModal").off("hide.bs.modal");
			//$('#loginModal').modal('hide')
			renderpage()
		})
	else if($('#loginTitle').text() == 'Register')
		APIregister($('#loginForm').serializeObject(), function(params){
			$("#loginModal").off("hide.bs.modal");
			//$('#loginModal').modal('hide')
			renderpage()
		})
	else//forgot password
		resetPassReq($("#loginForm").serializeObject())
});

$('#profileForm').on('submit', function(event) {
	event.preventDefault();
	APIupdateProfile($('#profileForm').serializeObject(), (data)=>{
		$('#profileModal').modal('hide');
		setTimeout(()=>{renderpage()},100)
	})
});

function logout()
{
	try{
	    var auth2 = gapi.auth2.getAuthInstance()
	    auth2.signOut().then(function () {
	      console.log('Google User signed out.')
	    });
	}
	catch{}
	clearLocalStorage()
	clearGlobalVars()
	renderpage()
}

function clearGlobalVars()
{
	_markers = []
	jobs= null
	jobId =null
	jobName = null
	userId = null
	map = null
	lastUpdated ="unknown"
	visitedUrls = null
	mapJobId = null
}
function clearLocalStorage()
{
	localStorage.removeItem('user')
	localStorage.removeItem('jobId')
	localStorage.removeItem('jobName')
}

//Fix bug with validator and submission in modals
$(document).on('show.bs.modal', '.modal', function (e) {
	let mymodal = e.currentTarget;
	$(mymodal).find('form[data-toggle=validator]').validator('destroy')
	$(mymodal).find('form[data-toggle=validator]').validator()
	$('form').on('submit', function() {
		return false
	})
	toggleModal(this.id)
})

$(document).on('hide.bs.modal', '.modal', function (e) {
	toggleModal(this.id, true)
	$('form').on('submit', function() {
	return false;
	})
})

$.fn.serializeObject = function()
{
	let viewArr = this.serializeArray()
	let view={}
	for (var i in viewArr) {
		if(viewArr[i].value)
			view[viewArr[i].name] = viewArr[i].value
	}
	return JSON.stringify(view);
}

function switchRegister()
{
	$('.registration-group').show()
	$('.login-group').hide()
	$('#loginTitle').text('Register')
	$('#loginButton').text('Login')
	$('#loginButton').off()
	$('.passwordBox').show()
	$( "#loginButton" ).click(function() {
	switchLogin()
	});
}

function switchLogin()
{
	$('.registration-group').hide()
	$('.login-group').show()
	$('#loginTitle').text('Login')
	$('#loginButton').text('Register')
	$('#loginButton').off()
	$('.passwordBox').show()
	$( "#loginButton" ).click(function() {
	switchRegister();
	});
}

function switchPassReset()
{
	$('.registration-group').hide()
	$('.login-group').hide()
	$('.passwordBox').hide()
	$('#loginTitle').text('Reset Password')
	$('#loginButton').text('Login')
	$('#loginButton').off()
	$( "#loginButton" ).click(function() {
		switchLogin()
	});
}

//Server Side Validation
/*for (var key in errors) {
	$('input[name="' + key + '"]').closest('.form-group')
	.addClass('has-error')
	.find('.help-block.with-errors')
		.text(errors[key])
}*/

//Facebook login start
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0]
	if (d.getElementById(id)) return
	js = d.createElement(s)
	js.id = id
	js.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.1&appId=Facebook-App-Id-Here&autoLogAppEvents=1'
	fjs.parentNode.insertBefore(js, fjs)
}(document, 'script', 'facebook-jssdk'))

function FBStatusChangeCallback(response) {
	// The response object is returned with a status field that lets the
	// app know the current login status of the person.
	// Full docs on the response object can be found in the documentation
	// for FB.getLoginStatus().
	if (response.status === 'connected') {
		// Logged into your app and Facebook.
		FBLogin(response.authResponse)
	} else {
		// The person is not logged into your app or we are unable to tell.
		alert('Sorry, we were unable to log you in.')
	}
}

function checkFBLoginState() {
	if(!window.isNative)
	{
	FB.getLoginStatus(function(response) {
		FBStatusChangeCallback(response)
	});
	}
}

window.addEventListener('message', message => {
	if(window.isNative && message.data.indexOf('login_button_dialog_open')!=-1)
	{
	window.postMessage(JSON.stringify({action:"facebookLoginClicked", meta:null}),'*')
	}
});

//Facebook Login end

//Google Login Start

function GoogleLoginClicked()
{
	if(window.isNative)
	{
	window.postMessage(JSON.stringify({action:"googleLoginClicked", meta:null}),'*')
	}
}


function checkGoogleLoginState(googleUser) {
	if(!window.isNative)
	{ 
	if(googleUser.Zi && googleUser.Zi.access_token)
		GoogleLogin({accessToken: googleUser.Zi.access_token})
	else
		alert('Sorry, we were unable to log you in.')
	}
}

function parseQueryParams(query) {
	var vars = query.split("&")
	var query_string = {}
	for (var i = 0; i < vars.length; i++) {
	var pair = vars[i].split("=")
	var key = decodeURIComponent(pair[0].replace(/\+/g, ' '))
	var value = decodeURIComponent(pair[1].replace(/\+/g, ' '))
	// If first entry with this name
	if (typeof query_string[key] === "undefined") {
		query_string[key] = decodeURIComponent(value.replace(/\+/g, ' '))
		// If second entry with this name
	} else if (typeof query_string[key] === "string") {
		var arr = [query_string[key], decodeURIComponent(value.replace(/\+/g, ' '))]
		query_string[key] = arr;
		// If third or later entry with this name
	} else
		query_string[key].push(decodeURIComponent(value.replace(/\+/g, ' ')))
	}
	return query_string
}