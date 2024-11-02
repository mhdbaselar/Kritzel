"use strict"

const TinyServer = require('./server/tinyserver');
const ServerGame = require('./server/servergame');

// Creates a Server (organizes WebSocketServer)
let server = new TinyServer(8123, (data) => {
    receive(data);
});

// Creates a ServerGame (organizes game logic server-side)
let game = new ServerGame(() => {
    let data;
    let type;
    
    if(game.getIsSendPointList()){          // send point list
        data = game.getBoard().getPoints();
        type = "pl";
    } else{                                 // send 2D-array (board)
        data = game.getBoard().getBoard(); 
        type = "2d";
    }
    let json = JSON.stringify({type : type , data : data});
    game.getBoard().setPointsEmpty();
    game.setIsSendPointList(true);
    server.broadcastWsMessage(json, false);
});

game.start();

/**
 * Receives and processes a message from a client
 * @param {Message} message client request
 */
function receive(message){
    game.processInput(message);
}

// catch all unhandled exceptions
process.on('uncaughtException', (err) => {
    console.log(err);
});