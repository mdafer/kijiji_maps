const Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus

module.exports = {
	getMarkers: async function(params, authUser, callback) {
		params.db.get('ads').find(Helpers.query.formatQuery(params)).then((docs) => {
			return callback({status:ApiStatus.SUCCESS, meta:docs})
		}).catch((err) => {Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})})//.then(() => db.close())
    },
	getJobAmenities: async function(params, authUser, callback) {
		try {
			const docs = await params.db.get('ads').find({['jobs.'+params.jobId]: {$exists: true}, amenities: {$exists: true, $ne: []}}, {fields: {amenities: 1, amenityIdMap: 1}})
			const amenitySet = new Set()
			const idMap = {}
			docs.forEach(doc => {
				if (doc.amenities) doc.amenities.forEach(a => amenitySet.add(a))
				if (doc.amenityIdMap) Object.assign(idMap, doc.amenityIdMap)
			})
			return callback({status: ApiStatus.SUCCESS, meta: {amenities: Array.from(amenitySet).sort(), amenityIdMap: idMap}})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
	}
}