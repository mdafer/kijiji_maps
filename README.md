# Place kijiji classifieds on a map and do advanced search
Fun with node and express.
The Kijiji site (used to) not show ads on a map. When looking for an apartment, it is not very convenient.
Just do a search on the site then copy paste the url.
The ads are scaped and cached in a mongodb database.

Docker Compose provided, so you just need to:

1- setup the .env file in the top directory (base.env is provided, rename it to .env and modify it)
2- setup the .env file in app/config (base.env is provided, rename it to dev.env and modify it)
3- change the Google Map Key in app/views/index.html
4- change the apiURL in views/js/API/common.js 
5- you also need to provide a Facebook App Id if you want to use Facebook Login

I know that the previous 5 steps can be combined in 1 env file, but I'm sorry I'm a bit too lazy when it comes to projects that I'm just toying with :P

Socket works automatically since frontend is hosted on the same instance as backend

Sign up-> Create a new search -> Copy paste the first page's link of your search from Kijiji

Wait for all pages to be fetched (results are reloaded with every page fetched, but wouldn't hurt to refresh the page at the end just to make sure)
Once all results are fetched, results are filtered in MongoDB, so everything is cached and local.

![alt text](https://github.com/mdafer/kijiji_maps/blob/master/kijiji_maps1.png "Kijiji maps 1")
![alt text](https://github.com/mdafer/kijiji_maps/blob/master/kijiji_maps2.png "Kijiji maps 2")
![alt text](https://github.com/mdafer/kijiji_maps/blob/master/kijiji_maps3.png "Kijiji maps 3")

Search (in title only, or including description) where keyword: apartment exist but basement and room don't exist
![alt text](https://github.com/mdafer/kijiji_maps/blob/master/kijiji_maps4.png "Kijiji maps advanced search")

this is meant for simple use and fun only; it does not necessarily reflect my coding style nor best practices.
