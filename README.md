# Place kijiji classifieds on a map
Fun with node and express.
The Kijiji site does not allow ads to appear on a map. When looking for an apartment, it is not very convenient.
Just do a search on the site then copy paste the url.
The ads already scaped are put in a database mongodb not to make too much request on the server

Run mongodb

```
npm install
node server.js

localhost:8081/maps
```
Enter Customized Kijiji URL and click Send

Wait for all pages to be fetched (need to click reload once it's done)
Once all results are fetched, results are filtered in MongoDB, so everything is cached and local.

Click Reload to apply filters.

![alt text](https://github.com/mdafer/kijiji_maps/blob/master/kijiji_maps.png "Kijiji maps")

The code is based on the creator's it has some bugs and lots of bad practices, this is meant for simple use and fun only, it does not reflect my coding style nor good practices.
