#!/usr/bin/env bash

cd app

npm install
npm install browserify
browserify ./client/main.js -o ./public/bundle.js
node ./server/gameserver.js

exec "$@"