module.exports = {
	/**
	 * sets timeout (sleep if awaited)
	 * @param {string} ms - sleep duration (in ms)
	 * @returns {null}
	 */
	sleep: function (params) { //should always be called with await
		if(Number.isInteger(params))
			params={ms:params}
		return new Promise(resolve => setTimeout(resolve, params.ms));
	},
	getFavoritedAdIds: async function(db) {
		const users = await db.get('users').find({favorites: {$exists: true, $ne: []}}, {fields: {favorites: 1}})
		const ids = new Set()
		users.forEach(u => (u.favorites || []).forEach(id => ids.add(String(id))))
		return Array.from(ids).map(id => db.id(id))
	}
}