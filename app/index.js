require('dotenv').config()//to load environment variables
require('./config/config.js')
const express = require('express'),
	app     = express(),
	http = require('http').Server(app),//for socketio
	io = require('socket.io')(http),
	Helpers = require('./helpers/includes.js').initialize(io),
	validator = require('validator'),
	{ check, validationResult } = require('express-validator'),
	//Models = require('./models/includes'),
	Controllers = require('./controllers/includes'),
	//MogoDB
	monk = require('monk'),
	MongoClient = require('mongodb').MongoClient,
	MongoObjectId = require('mongodb').ObjectID,
	format = require('util').format,
	bodyParser = require('body-parser'),
	db = monk('mongo:27017/kijiji_maps',{
		username : process.env.MONGODB_USERNAME,
		password : process.env.MONGODB_PASSWORD
	})

db.then(() => {
	Helpers.logger.log('Connected to database')
})

app.use(express.static('views'));
// support parsing of application/json type post data
app.use(bodyParser.json())
//app.use(bodyParser.text())
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.get('*', (req, res, next) => {
	if(req.query)
		req.body = Object.assign(req.body, req.query);
	next();
});

app.all('*', (req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		logger.log('OPTIONS SUCCESS');
		return res.end();
	}
	console.log(req.body)
	req.body.db = db;
	Helpers.router.authorize(req, res, next);//next is called inside
});


app.use(express.static(__dirname + 'views/dashboard'))


// //////router CODE Start/////////////
app.get('/markers', function(req, res, next){
	check('jobId').trim().escape().isLength({ min: 2 })
	Helpers.router.finish(req, res, Controllers.map.getMarkers);
});

app.post('/user', [
  		check('firstName').trim().escape().isLength({ min: 2 }),
  		check('lastName').trim().escape().isLength({ min: 2 }),
  		check('email').isEmail().normalizeEmail(),
  		check('password').exists().isLength({ min: 8 })
	], function(req, res, next) {
	Helpers.router.finish(req, res, Controllers.users.newUser);
})

app.patch('/user', [
		check('firstName').optional().trim().escape(),
		check('lastName').optional().trim().escape(),
  		check('email').optional().isEmail().normalizeEmail(),
  		check('password').optional().isLength({ min: 8 })
	],function(req, res, next){
	Helpers.router.finish(req, res, Controllers.users.updateUser);
});

app.get('/user', function(req, res, next){
	Helpers.router.finish(req, res, Controllers.users.getUser);
});

app.post('/login',[
  		check('email').isEmail().normalizeEmail(),
  		check('password').exists().isLength({ min: 8 })
	], function(req, res, next){
	Helpers.router.finish(req, res, Controllers.users.login);
});

app.get('/emitTest', function(req, res, next){
	Helpers.router.finish(req, res, Controllers.socket.emitTest);
});

app.put('/job', [
  		check('name').trim().escape().isLength({ min: 1 }),
  		check('url').exists().isLength({ min: 20 }).custom(v => validator.isURL(v, {protocols: ['https'],require_protocol:true, host_whitelist:['www.kijiji.ca','kijiji.ca']})),
  		check('description').trim().escape()
	], function(req, res, next) {
	Helpers.router.finish(req, res, Controllers.jobs.newJob);
})

app.patch('/job', [
		check('id').exists(),
		check('name').optional().trim().escape(),
  		check('description').optional().trim().escape()
	],function(req, res, next){
	Helpers.router.finish(req, res, Controllers.jobs.updateJob);
});

app.post('/resetJob', [
  		check('jobId').exists(),
	], function(req, res, next) {
	Helpers.router.finish(req, res, Controllers.jobs.resetJob);
});

app.post('/deleteJob', [
  		check('id').exists(),
	], function(req, res, next) {
	Helpers.router.finish(req, res, Controllers.jobs.deleteJob);
});

/*app.post('/rebuildJob', [
  		check('jobId').exists(),
	], function(req, res, next) {
	Helpers.router.finish(req, res, Controllers.jobs.rebuildJob);
});*/

app.post('/checkLatestAds', [
  		check('jobId').exists(),
	], function(req, res, next) {
	Helpers.router.finish(req, res, Controllers.jobs.checkLatestAds);
});

app.post('/validateJobAds', [
  		check('jobId').exists(),
	], function(req, res, next) {
	Helpers.router.finish(req, res, Controllers.jobs.validateJobAds);
});


Helpers.logger.log('Magic happens on port '+process.env.LISTENER_PORT);
http.listen(process.env.LISTENER_PORT);

Controllers.jobs.processPendingJobs({db},{},()=>{})