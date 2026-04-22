"use strict";

const TinyServer = require("./server/tinyserver");
const ServerGame = require("./server/servergame");
const responseTypes = require("./client/class/responseTypes");
const port = Number(process.env.PORT || 8123);

// Creates a Server (organizes WebSocketServer)
let server = new TinyServer(port,
  (cid, request) => {
    receive(cid, request);
  },
  (request) => {
    receiveServerRequest(request);
  });

// Creates a ServerGame (organizes game logic server-side)
let game = new ServerGame(server, () => {

  let lobbies = game.getLobbies();

  for(let lobbyID = 0; lobbyID < lobbies.length; lobbyID++){
    if(lobbies[lobbyID] !== null){
      let data = lobbies[lobbyID].getBoard().getPoints();
      let type = responseTypes.pointList;

      let json = JSON.stringify({ type: type, data: data });
      lobbies[lobbyID].getBoard().setPointsEmpty();

      // Only send if there is data
      if (data.length === 0) {continue;}
      let playerInLobby = lobbies[lobbyID].getPlayerList();

      server.broadcastWsMessage(null, json, false, broadcastTypes.allInLobby, playerInLobby);
    }

  }
});

game.start();

/**
 * Receives and processes a message from a client
 * @param {string} cid user unique ID
 * @param {Message} request client request
 */
function receive(cid, request) {
  game.processInput(cid, request);
}

/**
 * Receives and processes a request from the server
 * @param {Message} request server request
 */
function receiveServerRequest(request){
  game.processServerRequest(request);
}

// catch all unhandled exceptions
process.on("uncaughtException", (err) => {
  console.log(err);
});
