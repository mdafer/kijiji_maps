var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });


var url        = "";
var sites      = [];
var address    = [];
var index_site = -1;
var counter = 0;

//MogoDB
var monk = require('monk');
var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;
var db = monk('localhost:27017/nodetest1');
db.then(() => {
  console.log('Connected to server')
})
var collection = db.get('usercollection');

//var beaches = [];

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});


var test_next = function(req, res, next){
	index_site = index_site + 1;
	if (undefined != sites[index_site]) {
		let url_page = 'https://www.kijiji.ca'+sites[index_site];

		var db = req.db;
	    collection.find({'url': url_page},{},function(e,docs){
	    	if (undefined != docs && Object.keys(docs).length == 0){
	    		const options = {
					url: url_page,
					headers: {
						'User-Agent': 'Chrome/38.0.2125.111'
					}
				};
				request(options, function(error, response, html1){
					console.log('searching page: '+counter);
					//console.log(url_page);
					if(!error){
						console.log('url_page =>', response.request.uri.href);
						var $ = cheerio.load(html1, {
							normalizeWhitespace: true,
						});
						var ad = $('h1').text();
						console.log('ad =>',ad);
						var url_page1 = response.request.uri.href;
						var price     = $('[class^="currentPrice"]').text();
						var datetime     = $('time').attr('datetime');
						var title_ad  = $('h1').text();
						var latitude  = $('meta[property="og:latitude"]').attr('content')*1;
						var longitude = $('meta[property="og:longitude"]').attr('content')*1;
						title_ad      = title_ad.replace(/\"/g,'');
						title_ad      = title_ad.replace(/\\/g,'');
						title_ad      = title_ad.replace(/é/g,'e');
						price = price.replace(/\"/g,'');
						price         = Number(price.replace(/[^0-9\.]+/g,""));
						ad            = ad.replace(/\"/g,'');
						ad            = ad.replace(/\\/g,'');
						// console.log('AD =>', ad);
						if (ad.length>5){
							ad = '{"datetime":"'+datetime+'","address":"'+ad.replace('Afficher la carte','')+'","price":'+price+',"url":"'+url_page1+'","title_ad":"'+title_ad+'","latitude":'+latitude+',"longitude":'+longitude+'}';
							ad = ad.replace(/(\r\n|\n|\r)/gm,"");
							ad = ad.replace(/    /g,'');
						} else {
							ad = "";
						}
						//console.log('json ===>',ad);
						if ("" !== ad){
							address[index_site] = ad;
							ad = JSON.parse(ad);

							//beaches.push([ad.address, ad.price, ad.latitude, ad.longitude, ad.url, ad.title_ad]);

							// Submit to the DB
							console.log('Inserting to DB...');
						    collection.insert({
								'datetime': new Date(datetime),
								'address': ad.address,
								'price': ad.price,
								'lat': ad.latitude,
								'lon': ad.longitude,
								'url':ad.url,
								'title_ad':ad.title_ad
						    }, function (err, doc) {
						        if (err) {
						            // If it failed, return error
						            console.log("There was a problem adding the information to the database.");
						        }
						    });
						}
					}
				});

	    	} else {
		    	console.log('Loading ad from cache');
		    	//beaches.push([docs[0].address, docs[0].price, docs[0].lat, docs[0].lon, docs[0].url, docs[0].title_ad]);
	    	}
	    }).then(function(){
				test_next(req, res, next);
			});
	} else {
		//var info = '{"info":['+address+']}';
		if(url != undefined)
		{
			console.log(url);
			req.body.url = url;
			first_page(req, res, next);
		}
		else
			console.log('end reached1');
	}
	next();
};

function formatQuery(vars={})
{
	vars.fromPrice = vars.fromPrice?Number(vars.fromPrice):undefined;
	vars.toPrice = vars.toPrice?Number(vars.toPrice):undefined;
	let myfilter = {};
	if(vars.fromDate)
		vars.fromDate = new Date(vars.fromDate);
	if(vars.fromPrice && vars.toPrice)
	{
		myfilter.$and= 
			    [
			    {price:{$gte:vars.fromPrice,$lte:vars.toPrice}}
			    ,
			    {$text: { $search: " room -female -females -girl -girls -lady -ladies" } }
			    ];
		if(vars.fromDate)
			myfilter.$and.push({datetime:{$gte:vars.fromDate}});
	}
	else if (vars.toPrice)
	{
		
		myfilter.$and =
			    [
			    {price:{$lte:vars.toPrice}}
			    ,
			    {$text: { $search: " room -female -females -girl -girls -lady -ladies" } }
			    ];
		if(vars.fromDate)
			myfilter.$and.push({datetime:{$gte:vars.fromDate}});
	}
	else
	{
		myfilter = {$text: { $search: " room -female -females -girl -girls -lady -ladies" }};
		if(vars.fromDate)
			myfilter= {$and:[
			    {datetime:{$gte:vars.fromDate}}
			    ,
			    {$text: { $search: " room -female -females -girl -girls -lady -ladies" } }
			    ]};
	}
	return myfilter;
}
app.get('/maps', function(req, res, next){
	collection.find(formatQuery(req.query)).then((docs) => {
		console.log(docs.length)
		res.render("index.ejs", {layout: false, lat:43.5890, lon:-79.6441, zoom:10, beaches:JSON.stringify(docs)});
		next();
	})
	
});

// app.use(test_next);
var docs =[]
app.post('/add', urlencodedParser, function(req, res, next) {
	counter = 0;
	first_page(req, res, next);
	collection.find(formatQuery(req.query)).then((docs) => {
		console.log(docs.length)
		res.render("index.ejs", {layout: false, lat:43.5890, lon:-79.6441, zoom:10, beaches:JSON.stringify(docs)});
		next();
	})

});

app.get('/refresh', function(req, res, next) {
	// first_page(req, res, next);
	console.log(JSON.stringify(formatQuery(req.query)));
	collection.find(formatQuery(req.query)).then((docs) => {
		console.log(docs.length);
		res.render("index.ejs", {layout: false, lat:43.5890, lon:-79.6441, zoom:10, beaches:JSON.stringify(docs)});
		next();
	})
});

var first_page = function(req, res, next){
	console.log('req.body.url ======>', req.body.url);
	if (req.body.url != '') {
		url = req.body.url;
		index_site = -1;
		//sites = [];
		++counter;
		console.log('counter =>', counter);
		// url = 'http://www.kijiji.ca/b-appartement-condo/ville-de-quebec/c37l1700124r2.0?ad=offering';
		if (url !== ""){
			request(url, function(error, response, html){
				if(!error){
					console.log('URL ===>', url);
					var $ = cheerio.load(html);
					let urls = [].map.call($('a.title'), function(link) {
						return link;
					});
					Object.keys(urls).forEach(function(trait) {
							sites.push(urls[trait].attribs.href);
						});
					req.sites = sites;
					let url_next = $(".pagination > a[title='Next']").attr('href');
					
					url = url_next? "https://www.kijiji.ca"+url_next : undefined;
					console.log('url_next ===>', url);
					//console.log(sites);
					test_next(req, res, next);
				}
			});
		}
		console.log('end of page reached');
	}
};

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;
