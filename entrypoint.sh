#!/usr/bin/env bash

# Navigate to the app directory
cd /app

# Install dependencies
npm install

# Start browserify in watch mode to re-bundle front-end files on change
browserify ./client/main.js -o ./public/bundle.js -w -v &

# Start nodemon to monitor back-end changes and restart the server as needed
nodemon --watch ./ --exec "node ./kritzel.js"

# Execute any additional command passed to the container
exec "$@"