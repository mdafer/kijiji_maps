const util = require('util'),
moment = require('moment-timezone')

module.exports = {
	io:null,
	initialize:function (io){
		this.io=io
		return this
	},
	log: function(params){
		if(typeof params !== 'object' || (typeof params === 'object' && !params.print && !params.command))
			params = {print:params}
		params.date = params.date || moment(Date.now()).tz("America/Toronto").format("YYYY-MM-DD hh:mm:ss a")//z for zone
		params.level = params.level || "info"
		params.channels = params.channels || []
		if(typeof params !== 'array')
			params.channels = [params.channels]
		params.channels.push('all')
		params.channels.push(params.level)

		//console.log(util.inspect(params, {showHidden: false, depth: null, colors:true}))
		const channels = params.channels
		delete params.channels
		for (let i =0; i <channels.length; i++) {
			this.io.emit(channels[i], params);
		}
		if(params.command)
			console.log(params.command+" "+params.print)
		else
			console.log(params.print)
		if(params.debug)
			console.log(params.debug)
	}
}