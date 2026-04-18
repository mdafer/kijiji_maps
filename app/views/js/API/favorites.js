function APIaddFavorite(listingId, callback) {
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'favorite',
        data: JSON.stringify({adId: listingId}),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}

function APIremoveFavorite(listingId, callback) {
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        url: apiURL+'unfavorite',
        data: JSON.stringify({adId: listingId}),
        beforeSend: function(xhr){xhr.setRequestHeader('Authorization', $.parseJSON(localStorage.user).token)},
        success: function(data){ if(callback) callback(data.meta) },
        error: function(err){ console.log(err.responseJSON) }
    })
}

function APIgetFavorites(params, callback) {
    if(typeof _hideDisliked !== 'undefined' && _hideDisliked) {
        params = Object.assign({}, params || {}, {hideDisliked: 'true'})
    }
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
