"use strict";

const TinyServer = require("./server/tinyserver");
const ServerGame = require("./server/servergame");

// Creates a Server (organizes WebSocketServer)
let server = new TinyServer(8123, (uid, data) => {
  receive(uid, data);
});

// Compares two arrays (Compare if two canvas are identical)
function arraysAreIdentical(arr1, arr2) {
  return (
    arr1.length === arr2.length &&
    arr1.every((el, i) =>
      Array.isArray(el) ? arraysAreIdentical(el, arr2[i]) : el === arr2[i]
    )
  );
}

// Creates a ServerGame (organizes game logic server-side)
let game = new ServerGame(server, () => {

  let lobbies = game.getLobbies();

  for(let i = 0; i < lobbies.length; i++){
    let data = lobbies[i].getBoard().getPoints();
    let type = "pl";

    let json = JSON.stringify({ type: type, data: data });
    lobbies[i].getBoard().setPointsEmpty();

    // Only send if there is data
    if (data.length === 0) return;

    server.broadcastWsMessage(null, json, false, "allInLobby");
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
