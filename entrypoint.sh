#!/usr/bin/env bash

# Navigate to the app directory
cd /app

# Install dependencies
npm install

# Start watchify to continuously re-bundle main.js
watchify ./client/main.js -o ./public/bundle.js -v &

# Start nodemon to monitor back-end changes and restart the server as needed
nodemon --watch ./ --exec "node ./kritzel.js"

# Execute any additional command passed to the container
exec "$@"