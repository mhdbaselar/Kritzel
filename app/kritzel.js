"use strict";

const TinyServer = require("./server/tinyserver");
const ServerGame = require("./server/servergame");

// Creates a Server (organizes WebSocketServer)
let server = new TinyServer(8123, (uid, data) => {
  receive(uid, data);
});

let refreshCounter = 0;

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
  let data;
  let type;

  if (game.getIsSendPointList()) {
    // removed && refreshCounter < 20
    // send point list
    data = game.getBoard().getPoints();
    type = "pl";
  } else {
    // send 2D-array (board)
    data = game.getBoard().getBoard();
    const initArray = Array.from({ length: 400 }, () => Array(600).fill(0));

    // Check if the canvas is empty (init State)
    if (arraysAreIdentical(data, initArray)) {
      // If Canvas is empty send initWhiteCanvas type (Makes Client Canvas white without sending data)
      type = "initWhiteCanvas";
      data = [0];
    } else {
      // If Canvas is not empty send 2D-array type
      type = "2d";
    }
  }

  refreshCounter++;

  let json = JSON.stringify({ type: type, data: data });
  game.getBoard().setPointsEmpty();
  game.setIsSendPointList(true);

  // Only send if there is data
  if (data.length === 0) return;
  server.broadcastWsMessage(null, json, false, "all");
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
