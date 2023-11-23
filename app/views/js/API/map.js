async function APIgetAds(params, callback=null)
{
	$.ajax({ 
	    type: "GET",
	    dataType: "json",
        //contentType: "application/json",
	    url: apiURL+'markers',
	    data: params,
	    beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token);},
	    success: function(data){        
			//sessionStorage.plants=JSON.stringify(data.meta);
            if(callback)
			    callback(data.meta);
	    },
	    error: function (err) {
	    	alert(err.responseJSON.msg);
            if(clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                    clearLocalStorage()
                    renderpage()
            }
	    	console.log(err.responseJSON);
	    }
	});
}

function APIcheckLatestAds(params, callback=null)
{
	$.ajax({ 
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        /*processData: false,
        contentType: false,*/
        url: apiURL+'checkLatestAds',
        data: params,
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token);},
        success: function(data){
    		if(callback)
                callback(data.meta);
        },
        error: function (err) {
        	alert(err.responseJSON.msg);
            if(clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                    clearLocalStorage()
                    renderpage()
            }
        	console.log(err.responseJSON);
        }
	});
}