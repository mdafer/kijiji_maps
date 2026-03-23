function APIaddFavorite(adId, callback) {
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'favorite',
        data: JSON.stringify({adId: adId}),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}

function APIremoveFavorite(adId, callback) {
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'unfavorite',
        data: JSON.stringify({adId: adId}),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}

function APIgetFavorites(params, callback) {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: apiURL+'favorites',
        data: params,
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}
