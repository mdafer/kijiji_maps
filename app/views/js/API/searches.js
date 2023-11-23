function APIaddNewSearch(params, callback=null)
{
	$.ajax({ 
        type: "PUT",
        dataType: "json",
        contentType: "application/json",
        /*processData: false,
        contentType: false,*/
        url: apiURL+'job',
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

function APIresetJob(params, callback=null)
{
    $.ajax({ 
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        /*processData: false,
        contentType: false,*/
        url: apiURL+'resetJob',
        data: params ,
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token);},
        success: function(data){
            //renderpage();
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

function APIupdateJob(params, callback=null)
{
    $.ajax({ 
        type: "PATCH",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'job',
        data: params,
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){
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

function APIdeleteJob(params, callback=null)
{
    $.ajax({ 
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'deleteJob',
        data: params,
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){
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