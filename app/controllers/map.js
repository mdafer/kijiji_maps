const Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus

module.exports = {
	getMarkers: async function(params, authUser, callback) {
		params.db.get('ads').find(Helpers.query.formatQuery(params)).then((docs) => {
			return callback({status:ApiStatus.SUCCESS, meta:docs})
		}).catch((err) => {Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})})//.then(() => db.close())
    }
}