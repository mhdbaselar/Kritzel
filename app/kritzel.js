"use strict"

const TinyServer = require('./server/tinyserver');
const ServerGame = require('./server/servergame');

let server = new TinyServer(8123, (data) => {
    console.log('received: %s', data);
    receive(data);
});

let game = new ServerGame(() => {
    let json = JSON.stringify(game.getBoard().getBoard());
    server.broadcastWsMessage(json, false);
});

game.start();

function receive(message){
    game.processInput(message);
}

// catch all unhandled exceptions
process.on('uncaughtException', (err) => {
    console.log(err)
});