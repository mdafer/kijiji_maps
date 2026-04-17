const Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus

module.exports = {
	addFavorite: async function(params, authUser, callback) {
		try {
			await params.db.get('users').update({_id: authUser._id}, {$addToSet: {favorites: params.adId}})
			return callback({status: ApiStatus.SUCCESS, meta: {adId: params.adId, action: 'added'}})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
	},
	removeFavorite: async function(params, authUser, callback) {
		try {
			await params.db.get('users').update({_id: authUser._id}, {$pull: {favorites: params.adId}})
			return callback({status: ApiStatus.SUCCESS, meta: {adId: params.adId, action: 'removed'}})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
	},
	getFavorites: async function(params, authUser, callback) {
		try {
			const user = await params.db.get('users').findOne({_id: authUser._id})
			if(!user || !user.favorites || !user.favorites.length)
				return callback({status: ApiStatus.SUCCESS, meta: []})

			const query = Helpers.query.formatQuery(params, {skipJobFilter: true})
			if(!query.$and) query.$and = []
			query.$and.push({_id: {$in: user.favorites.map(id => params.db.id(id))}})
			if(params.jobIds) {
				var ids = Array.isArray(params.jobIds) ? params.jobIds : params.jobIds.split(',').map(s => s.trim()).filter(Boolean)
				if(ids.length) query.$and.push({$or: ids.map(id => ({['jobs.'+id]: {$exists: true}}))})
			}
			if(params.hideDisliked === 'true' && user.dislikes && user.dislikes.length) {
				query.$and.push({_id: {$nin: user.dislikes.map(id => params.db.id(id))}})
			}

			const docs = await params.db.get('ads').find(query)
			return callback({status: ApiStatus.SUCCESS, meta: docs})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
	}
}
