"use strict"

const TinyServer = require('./server/tinyserver');
const ServerGame = require('./server/servergame');

let server = new TinyServer(8123, (data) => {
    //console.log('received: %s', data);
    receive(data);
});

let game = new ServerGame(() => {
    let data;
    let type;
    
    if(game.getIsSendPointList()){
        data = game.getBoard().getPoints();
        type = "pl";
    } else{
        data = game.getBoard().getBoard();
        type = "2d";
    }
    let json = JSON.stringify({type : type , data : data});
    game.getBoard().setPointsEmpty();
    game.setIsSendPointList(true);
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