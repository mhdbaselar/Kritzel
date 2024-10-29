"use strict"

const ClientGame = require("./clientgame")
let clientGame = new ClientGame()
clientGame.openWebSocket()

//Beispiel: Zeichnen auf Board
const Message = require('../client/class/message');
const Action = require('../client/class/action');

let action = new Action('pen', 3 , 4, '#000000', 1);
let message = new Message('action', action);

//setTimeout(() => clientGame.send(JSON.stringify(message)), 1000);

setTimeout(() => clientGame.sendDrawAction('pen', 1, 2, '#000000', 2), 1000);

//setTimeout(() => clientGame.send(JSON.stringify(message)), 1000);

//setTimeout(() => clientGame.send(JSON.stringify(message)), 2000);

//setTimeout(() => clientGame.sendDrawAction('pen', 3, 4, '#000000', 2), 1000);

/*

"use strict"

const ClientGame = require("./clientgame")

let clientGame = new ClientGame();
clientGame.openWebSocket();

//Beispiel: Zeichnen auf Board --> clientGame.sendDrawAction() mit Tool pen
setTimeout(() => clientGame.sendDrawAction('pen', 3, 4, '#000000', 3), 1000);

//Beispiel: Radieren auf Board --> clientGame.sendDrawAction() mit Tool eraser
//setTimeout(() => clientGame.sendDrawAction('eraser', 3, 4, '', 3), 2000);

//Beispiel: Füllen des Boards mit Farbe --> clientGame.sendFillAction()
//setTimeout(() => clientGame.sendFillAction('#888888'), 3000);

//Beispiel: Kompletter Clear auf Board --> clientGame.sendClearAction()
//setTimeout(() => clientGame.sendClearAction(), 4000);

*/