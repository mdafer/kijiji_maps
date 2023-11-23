const Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus,
parallel = require('async/parallel'),
pick = require('lodash.pick'),
uuid = require('uuid-random')

module.exports = {
	newJob: async function(params, authUser, callback){
		const job = {id:uuid(), statusCode:2, name:params.name, url: params.url, description: params.description}
		await params.db.get('users').update({"email":authUser.email},{"$push": {"jobs":job}})
			.catch((err) => {Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'});return callback({ status: Helpers.ApiStatus.DB_ERROR, meta: err})})//.then(() => db.close())
		params.jobUrl = job.url
		params.jobId = job.id
		params.pageUrl = job.url
		params.pageNumber = 0
		params.jobName = job.name
		callback({status:Helpers.ApiStatus.SUCCESS, meta:{status:'In Progress', jobUrl:job.url, jobId: job.id}})
		const pagesProcessed = await Helpers.scraper.processPage(params)
		Helpers.logger.log({ command:'doneProcAndValid', print: {jobId: job.id, pages:pagesProcessed}, channels:authUser._id+'command'})
		Helpers.logger.log({ command:'doneProcAndValid', print: pagesProcessed, channels:job.id+'command'})
		params.db.get('users').update({"jobs.id":job.id},{"$set": {"jobs.$.statusCode":1}})
			.catch((err) => {Helpers.logger.log({print:err, channels:job.id+'jobWarning'})})
	},
	updateJob: async function(params, authUser, callback){
		try{
			let user = await params.db.get('users').findOne({"jobs.id":params.id})
			if (!user)
				return callback({ status: ApiStatus.NOT_FOUND, meta: null })
			let job = user.jobs.find(job => { return job.id == params.id})
			Object.assign(job, pick(params, ['name', 'description']))
			job = await params.db.get('users').findOneAndUpdate({"jobs.id":params.id},{$set: {"jobs.$":job}})
			callback({status: ApiStatus.SUCCESS, meta: job})
		}
		catch(err) {
			Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})
		}//.then(() => db.close())
	},
	deleteJob: async function(params, authUser, callback){
		try{
			let result = await params.db.get('ads').update({["jobs."+params.id]:{ $exists: true}},{$unset: { ["jobs."+params.id]: ""}}, {multi:true})
			/*if(result.n <1)
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Ads for Job '"+params.id+"' not found"}})*/

			result = await params.db.get('users').update({"jobs.id":params.id},{$pull: {"jobs":{id:params.id}}})
			if(result.n <1)
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job '"+params.id+"' not found"}})
			params.db.get('ads').remove({jobs:{}},{multi:true})
			return callback({status:Helpers.ApiStatus.SUCCESS, meta:{status:'Deleted', jobId: params.id}})
		}
		catch(err) {
			Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})
		}//.then(() => db.close())
	},
	resetJob: async function(params, authUser, callback){
		params.db.get('users').findOneAndUpdate({"jobs.id":params.jobId},{"$set": {"jobs.$.statusCode":2}}, {returnOriginal:true}).then(async (user) => {
			if(!user)
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job '"+params.jobId+"'' not found"}})
			const job = user.jobs.find(job => { return job.id == params.jobId})
			if(!job || job =="")
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job not found"}})
			if(job.statusCode==2)
				return callback({ status: Helpers.ApiStatus.JOB_ALREADY_BEING_PROCESSED, meta: {message:"Job already being processed. Please try again once it's done."}})
			params.jobUrl = job.url
			params.jobId = job.id
			params.pageNumber = 0
			params.pageUrl = job.url
			params.jobName = job.name
			callback({status:Helpers.ApiStatus.SUCCESS, meta:{status:'In Progress', jobUrl:job.url, jobId: params.jobId}})
			await Helpers.scraper.processPage(params)
			Helpers.logger.log({ command:'doneProcAndValid', print: {jobId: params.jobId, pages:params.pageNumber}, channels:authUser._id+'command'})
				Helpers.logger.log({ command:'doneProcAndValid', print: params.pageNumber, channels:params.jobId+'command'})
		}).catch((err) => {Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'})})//.then(() => db.close())
	},
	processPendingJobs: function(params, authUser, callback){
		Helpers.logger.log("Checking for stale pending jobs...")
		params.db.get('users').aggregate([{$unwind : "$jobs"},{$match : {"jobs.statusCode":2}},{$project : {id : "$jobs.id", url:"$jobs.url", name:'$jobs.name'}}]).then((jobs) => {
			if(!jobs || jobs.length==0)
			{
				callback({ status: Helpers.ApiStatus.NO_PENDING_JOBS, meta:{status:'In Progress', jobs}})
				Helpers.logger.log("There are no pending jobs")
				return
			}
			Helpers.logger.log(jobs.length+" pending jobs started.")
			callback({ status: Helpers.ApiStatus.SUCCESS, meta:{status:'In Progress', jobs}})
			jobs.forEach(async job=>{
				let myparams = {}
				myparams.db = params.db
				myparams.jobId = job.id
				myparams.jobUrl = job.url
				myparams.jobName = job.name
				myparams.pageNumber = 0
				myparams.pageUrl = job.url
				const processedPages = await Helpers.scraper.processPage(myparams)
				Helpers.logger.log({ command:'doneProcAndValid', print: {jobId: job.id, pages:processedPages}, channels:authUser._id+'command'})
				Helpers.logger.log({ command:'doneProcAndValid', print: processedPages, channels:job.id+'command'})
			})
		}).catch((err) => {Helpers.logger.log(err)})
	},
	/*rebuildJob: function(params, authUser, callback){
		params.db.get('users').findOneAndUpdate({"jobs.id":params.jobId},{"$set": {"jobs.$.statusCode":2}}, {returnOriginal:true}).then((user) => {
			if(!user)
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job '"+params.jobId+"'' not found"}})
			const job = user.jobs.find(job => { return job.id == params.jobId})
			if(!job || job =="")
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job not found"}})
			if(job.statusCode==2)
				return callback({ status: Helpers.ApiStatus.JOB_ALREADY_BEING_PROCESSED, meta: {message:"Job already being processed. Please try again once it's done."}})
			params.db.get('ads').remove({jobId:params.jobId}, {multi:true}).then(async ()=>{
				params.jobUrl = job.url
				params.jobId = job.id
				params.pageUrl = job.url
				params.jobName = job.name
				params.pageNumber = 0
				callback({status:Helpers.ApiStatus.SUCCESS, meta:{status:'In Progress', jobUrl:job.url, jobId: params.jobId}})
				await Helpers.scraper.processPage(params)
				Helpers.logger.log({ command:'doneProcAndValid', print: {jobId: params.jobId, pages:params.pageNumber}, channels:authUser._id+'command'})
				Helpers.logger.log({ command:'doneProcAndValid', print: params.pageNumber, channels:params.jobId+'command'})
			})
		}).catch((err) => {Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'});return callback({ status: Helpers.ApiStatus.DB_ERROR, meta: err})})//.then(() => db.close())
	},
	checkLatestAds: function(params, authUser, callback){
		params.db.get('users').findOneAndUpdate({"jobs.id":params.jobId},{"$set": {"jobs.$.statusCode":2}}, {returnOriginal:true}).then((user) => {
			if(!user)
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job '"+params.jobId+"'' not found"}})
			const job = user.jobs.find(job => { return job.id == params.jobId})
			if(!job || job =="")
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job '"+params.jobId+"' not found or is complete"}})
			if(job.statusCode==2)
				return callback({ status: Helpers.ApiStatus.JOB_ALREADY_BEING_PROCESSED, meta: {message:"Job already being processed. Please try again once it's done."}})
			params.jobId = job.id
			params.jobUrl = job.url
			params.pageNumber = 0
			params.pageUrl = job.url
			params.jobName = job.name
			Helpers.scraper.processPage(params)
			return callback({status:Helpers.ApiStatus.SUCCESS, meta:{status:'In Progress', jobUrl:job.url, jobId: params.jobId}})
		}).catch((err) => {Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'});return callback({ status: Helpers.ApiStatus.DB_ERROR, meta: err})})//.then(() => db.close())
	},*/
	/*validateJobAds: function(params, authUser, callback){
		params.db.get('users').findOneAndUpdate({"jobs.id":params.jobId},{"$set": {"jobs.$.statusCode":2}}, {returnOriginal:true}).then((user) => {
			if(!user)
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job '"+params.jobId+"'' not found"}})
			const job = user.jobs.find(job => { return job.id == params.jobId})
			if(!job || job =="")
				return callback({ status: Helpers.ApiStatus.NOT_FOUND, meta: {message:"Job not found"}})
			if(job.statusCode==2)
				return callback({ status: Helpers.ApiStatus.JOB_ALREADY_BEING_PROCESSED, meta: {message:"Job already being processed. Please try again once it's done."}})
			params.jobId = job.id
			params.jobUrl = job.url
			params.jobName = job.name
			Helpers.scraper.validateJobAds({db, jobId:params.jobId})
			return callback({status:Helpers.ApiStatus.SUCCESS, meta:{status:'In Progress', jobUrl:job.url, jobId: params.jobId}})
		}).catch((err) => {Helpers.logger.log({print:err, channels:params.jobId+'jobWarning'});return callback({ status: Helpers.ApiStatus.DB_ERROR, meta: err})})//.then(() => db.close())
	},*/
}