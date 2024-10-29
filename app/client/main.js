"use strict"

const ClientGame = require("./clientgame")
let clientGame = new ClientGame()
clientGame.openWebSocket()

//Beispiel: Zeichnen auf Board
const Message = require('../game/message');
const Action = require('../game/action');

let action = new Action('pen', 2 , 3, '#000000', 2);
let message = new Message('action', action);

setTimeout(() => clientGame.send(JSON.stringify(message)), 1000)

