"use strict";

const TinyServer = require("./server/tinyserver");
const ServerGame = require("./server/servergame");
const responseTypes = require("./client/class/responseTypes");

// Creates a Server (organizes WebSocketServer)
let server = new TinyServer(8123, (uid, data) => {
  receive(uid, data);
});

// Creates a ServerGame (organizes game logic server-side)
let game = new ServerGame(server, () => {

  let lobbies = game.getLobbies();

  for(let lobbyID = 0; lobbyID < lobbies.length; lobbyID++){
    let data = lobbies[lobbyID].getBoard().getPoints();
    let type = responseTypes.pointList;

    let json = JSON.stringify({ type: type, data: data });
    lobbies[lobbyID].getBoard().setPointsEmpty();

    // Only send if there is data
    if (data.length === 0) {continue;}
    let playerInLobby = lobbies[lobbyID].getPlayerList();

    server.broadcastWsMessage(null, json, false, broadcastTypes.allInLobby, playerInLobby);
  } 
});

game.start();

/**
 * Receives and processes a message from a client
 * @param {string} uid user unique ID
 * @param {Message} message client request
 */
function receive(uid, message) {
  game.processInput(uid, message);
}

// catch all unhandled exceptions
process.on("uncaughtException", (err) => {
  console.log(err);
});
