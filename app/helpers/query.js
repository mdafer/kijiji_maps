module.exports = {
	formatQuery: function (vars={})
	{
		vars.fromPrice = vars.fromPrice?Number(vars.fromPrice):undefined;
		vars.toPrice = vars.toPrice?Number(vars.toPrice):undefined;
		let myfilter = {$and:[]};
		if(vars.fromDate)
		{
			vars.fromDate = new Date(vars.fromDate);
			myfilter.$and.push({datetime:{$gte:vars.fromDate}});
		}

		if(vars.fromPrice)
			myfilter.$and.push({price:{$gte:vars.fromPrice}})

		if(vars.toPrice)
			myfilter.$and.push({price:{$lte:vars.toPrice}})

		//{$text: { $search: " house  -female -females -girl -girls -lady -ladies" } }
		if(vars.searchText)
		{
			let negative=[],
				exact = [],
				positive = []

			vars.searchText = vars.searchText+" "//to match last negative word
			//separate negative keywords
			vars.searchText = vars.searchText.replace(/-.+?\s/g, function(a, b){//.+? means find until first occurence
				negative.push(a.substr(1).slice(0, -1))
				return ''
			})

			if(vars.searchTitleOnly)
			{
				//separate exact keywords
				vars.searchText = vars.searchText.replace(/".+?"/g, function(a, b){//.+? means find until first occurence
					exact.push(a.substr(1).slice(0, -1))
					return ''
				})
				//prepare multiple positive keywords
				positive = vars.searchText.replace(/\s\s+/g, ' ').trim().split(" ")
				if(positive[0] =="")
					positive=[]
				//merge positive and exact
				vars.searchText = positive.concat(exact)

				vars.searchText = "(.*("+vars.searchText.join("|")+"))"
				if(vars.searchText.length)
					myfilter.$and.push({title: new RegExp(vars.searchText, "gi")})

				if(negative.length)
					myfilter.$and.push( {title:
						{
							"$not": new RegExp(negative.join("|"), "i")
						}
					})
			}
			else
			{
				if(vars.searchText.length)
					myfilter.$and.push({$text: { $search: vars.searchText } })
				
				if(negative.length)
					myfilter.$and.push( {"$nor": [
						{
							title: new RegExp(negative.join("|"), "i")
						},
						{
							description: new RegExp(negative.join("|"), "i")
						}
						]
					})
			}
		}
		console.log("myfilter4")
		const util = require('util');
		console.log(util.inspect(myfilter, { showHidden: false, depth: null, colors: true }))

		myfilter.$and.push({['jobs.'+vars.jobId]:{$exists:true}})
		console.log("myfilter5", myfilter)
		if(myfilter.$and.length==0)
			return {}
		else 
			return myfilter;
	}
}