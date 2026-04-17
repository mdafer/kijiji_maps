const Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus

module.exports = {
	addDislike: async function(params, authUser, callback) {
		try {
			await params.db.get('users').update({_id: authUser._id}, {$addToSet: {dislikes: params.adId}})
			return callback({status: ApiStatus.SUCCESS, meta: {adId: params.adId, action: 'added'}})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
	},
	removeDislike: async function(params, authUser, callback) {
		try {
			await params.db.get('users').update({_id: authUser._id}, {$pull: {dislikes: params.adId}})
			return callback({status: ApiStatus.SUCCESS, meta: {adId: params.adId, action: 'removed'}})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
	},
	getDislikes: async function(params, authUser, callback) {
		try {
			const user = await params.db.get('users').findOne({_id: authUser._id})
			return callback({status: ApiStatus.SUCCESS, meta: (user && user.dislikes) ? user.dislikes : []})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
	}
}
