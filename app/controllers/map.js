const Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus

module.exports = {
	getMarkers: async function(params, authUser, callback) {
		try {
			var skipJob = params.favoritesOnly === 'true'
			const query = Helpers.query.formatQuery(params, {skipJobFilter: skipJob})
			if(skipJob) {
				const user = await params.db.get('users').findOne({_id: authUser._id})
				if(!user || !user.favorites || !user.favorites.length)
					return callback({status: ApiStatus.SUCCESS, meta: []})
				if(!query.$and) query.$and = []
				query.$and.push({_id: {$in: user.favorites.map(id => params.db.id(id))}})
				// Optional multi-search filter
				if(params.jobIds) {
					var ids = Array.isArray(params.jobIds) ? params.jobIds : params.jobIds.split(',').map(s => s.trim()).filter(Boolean)
					if(ids.length) query.$and.push({$or: ids.map(id => ({['jobs.'+id]: {$exists: true}}))})
				}
			}
			const docs = await params.db.get('ads').find(query)
			return callback({status: ApiStatus.SUCCESS, meta: docs})
		} catch(err) {
			Helpers.logger.log(err)
			return callback({status: ApiStatus.DB_ERROR, meta: err})
		}
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