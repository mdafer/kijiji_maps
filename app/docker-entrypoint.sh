#!/bin/sh

sed -i "s/Google-Maps-API-Key-Here/${GOOGLE_MAPS_KEY}/" views/index.html

exec "$@"
