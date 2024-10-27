#!/usr/bin/env bash

cd app

npm install

node ./server/gameserver.js

exec "$@"