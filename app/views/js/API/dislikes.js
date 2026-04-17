function APIaddDislike(adId, callback) {
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'dislike',
        data: JSON.stringify({adId: adId}),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}

function APIremoveDislike(adId, callback) {
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'undislike',
        data: JSON.stringify({adId: adId}),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}

function APIgetDislikes(callback) {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: apiURL+'dislikes',
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}

function APIgetDislikedAds(params, callback) {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: apiURL+'dislikedAds',
        data: params,
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}
