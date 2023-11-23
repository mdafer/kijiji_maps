Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus

module.exports = {
	emitTest: function(params, authUser, callback) {
		params.i = params.i || 1
		for(let i=0; i<params.i;i++)
			Helpers.io.emit('jobUpdate', 'testEmission')
		return callback({status:ApiStatus.SUCCESS, meta:{jobUpdate: 'testEmission', count:params.i}})
    }
}