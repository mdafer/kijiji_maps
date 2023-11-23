async function APIgetProfile(params, callback=null)
{
	$.ajax({ 
	    type: "GET",
	    dataType: "json",
        //contentType: "application/json",
	    url: apiURL+'user',
	    data: null,
	    beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
	    success: function(data){        
			//sessionStorage.plants=JSON.stringify(data.meta)
            if(callback)
			    callback(data.meta)
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg)
	    	if(clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                clearLocalStorage()
                renderpage()
            }
	    	console.log(err.responseJSON)
	    }
	})
}

function APIlogin(params, callback=null)
{
	logout()//a fix to prevent Google login from overriding credential login when logged in to Google account
	$.ajax({ 
	    type: "POST",
	    dataType: "json",
	    contentType: "application/json",
	    url: apiURL+'login',
	    data: params,
	    success: function(data){
	    	window.postMessage(JSON.stringify({action:"loggedin", meta:data.meta}), "*")
			localStorage.user=JSON.stringify(data.meta)
	    	if(callback)
	    		callback(data.meta)
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg)
	    	if(clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                clearLocalStorage()
                renderpage()
            }
	    	console.log(err.responseJSON)
	    }
	})
}

function FBLogin(params)
{
	logout()//a fix to prevent Google login from overriding credential login when logged in to Google account
	$.ajax({ 
	    type: "POST",
	    dataType: "json",
	    url: apiURL+'FBLogin',
	    data: { accessToken: params.accessToken} ,
	    success: function(data){
	    	window.postMessage(JSON.stringify({action:"loggedin", meta:data.meta}), "*")
			localStorage.user=JSON.stringify(data.meta)
			//$("#loginModal").off("hide.bs.modal")
			$('#loginModal').modal('hide')
			renderpage()
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg)
	    	console.log(err.responseJSON)
	    }
	})
}

function GoogleLogin(params)
{
	$.ajax({ 
	    type: "POST",
	    dataType: "json",
	    url: apiURL+'GoogleLogin',
	    data: { accessToken: params.accessToken} ,
	    success: function(data){
	    	window.postMessage(JSON.stringify({action:"loggedin", meta:data.meta}), "*")
			localStorage.user=JSON.stringify(data.meta)
			//$("#loginModal").off("hide.bs.modal")
			$('#loginModal').modal('hide')
			renderpage()
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg)
	    	console.log(err.responseJSON)
	    }
	})
}

function APIresetPassReq(params)
{
	$.ajax({ 
	    type: "PUT",
	    dataType: "json",
	    url: apiURL+'resetPassReq',
	    data: { email: params.email} ,
	    success: function(data){
			alert('Email sent!')
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg)
	    	if(clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                clearLocalStorage()
                renderpage()
            }
	    	console.log(err.responseJSON)
	    }
	})
}

function APIregister(params, callback=null)
{
	$.ajax({ 
	    type: "POST",
	    dataType: "json",
	    contentType: "application/json",
	    url: apiURL+'user',
	    data: params,
	    success: function(data){
	    	window.postMessage(JSON.stringify({action:"loggedin", meta:data.meta}), "*")
			localStorage.user=JSON.stringify(data.meta)
	    	if(callback)
	    		callback(data.meta)
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg)
	    	if(clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                clearLocalStorage()
                renderpage()
            }
	    	console.log(err.responseJSON)
	    }
	})
}

function APIupdateProfile(params, callback=null)
{
	$.ajax({ 
	    type: "PATCH",
	    dataType: "json",
	    contentType: "application/json",
	    url: apiURL+'user',
	    data: params,
	    beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
	    success: function(data){      
			localStorage.user=JSON.stringify(data.meta)
			//$("#loginModal").off("hide.bs.modal")
			if(callback)
	    		callback(data.meta)
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg)
	    	if(clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                clearLocalStorage()
                renderpage()
            }
	    	console.log(err.responseJSON)
	    }
	})
}
