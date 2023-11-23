module.exports = {
	initialize: function(io) {
		if(io)
		{
			this.io = io
			this.logger = require('../helpers/logger').initialize(this.io)
			this.query= require('../helpers/query'),
			this.router= require('../helpers/router'),
			this.ApiStatus= require('../helpers/api-status'),
			this.queue=require('../helpers/queue'),
			this.common=require('../helpers/common'),
			this.scraper= require('../helpers/scraper')
		}
		return this
	},
};