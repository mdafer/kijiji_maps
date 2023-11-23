#!/usr/bin/env bash
echo "Loading .env..."
set -a
source <(cat ../.env | \
    sed -e '/^#/d;/^\s*$/d' -e "s/'/'\\\''/g" -e "s/=\(.*\)/='\1'/g")
set +a
echo "Creating mongo users..."
mongosh admin --host localhost -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --eval "db = db.getSiblingDB('kijiji_maps'); db.delete_me.insertOne( { x: 1 } );db.createUser({user: '$MONGODB_USERNAME', pwd: '$MONGODB_PASSWORD', roles: [{role: 'readWrite', db: 'kijiji_maps'}]});"
echo "Creating text search index..."
mongosh admin --host localhost -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --eval "db = db.getSiblingDB('kijiji_maps'); db.ads.createIndex({title: \"text\",description: \"text\"});"
echo "Exiting Mongo Init Script..."