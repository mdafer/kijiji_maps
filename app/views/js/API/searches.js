function APIaddNewSearch(params, callback=null)
{
	$.ajax({
        type: "PUT",
        dataType: "json",
        contentType: "application/json",
        /*processData: false,
        contentType: false,*/
        url: apiURL+'job',
        data: typeof params === 'string' ? params : JSON.stringify(params),
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

function APIqueueJobs(params, callback=null)
{
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'queueJobs',
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

function APIstopJob(params, callback=null)
{
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'stopJob',
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

function APIupdateJob(params, callback=null)
{
    $.ajax({
        type: "PATCH",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'job',
        data: typeof params === 'string' ? params : JSON.stringify(params),
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

function APIclearJobListings(params, callback=null)
{
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'clearJobListings',
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

function APIgetJobAmenities(jobId, callback=null)
{
    $.ajax({
        type: "GET",
        dataType: "json",
        url: apiURL+'jobAmenities',
        data: {jobId: jobId},
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){
            if(callback) callback(data.meta)
        },
        error: function(err){
            console.log(err.responseJSON)
        }
    })
}

function APIupdateSearchGroups(params, callback=null)
{
    $.ajax({
        type: "PATCH",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'searchGroups',
        data: JSON.stringify(params),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){
            if(callback) callback(data.meta)
        },
        error: function(err){
            alert(err.responseJSON && err.responseJSON.msg || 'Failed to save groups')
            if(err.responseJSON && clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                clearLocalStorage()
                renderpage()
            }
            console.log(err.responseJSON)
        }
    })
}

function APIexportSearches(params, callback=null)
{
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'exportSearches',
        data: typeof params === 'string' ? params : JSON.stringify(params),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function (err) {
            alert(err.responseJSON && err.responseJSON.msg || 'Export failed')
            if(err.responseJSON && clearStorageErrorCodes.includes(err.responseJSON.status))
            {
                clearLocalStorage()
                renderpage()
            }
            console.log(err.responseJSON)
        }
    })
}

function APIimportSearches(params, callback=null)
{
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'importSearches',
        data: typeof params === 'string' ? params : JSON.stringify(params),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function (err) {
            alert(err.responseJSON && err.responseJSON.msg || 'Import failed')
            if(err.responseJSON && clearStorageErrorCodes.includes(err.responseJSON.status))
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