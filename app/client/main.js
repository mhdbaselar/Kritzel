"use strict"

const ClientGame = require("./clientgame");

let clientGame = new ClientGame();
clientGame.openWebSocket();

//Hier sind Beispiel-Actions, die der Client an den Server schickt --> so einfach über das Canvas auslösen

//Beispiel: Zeichnen auf Board --> clientGame.sendDrawAction() mit Tool pen
setTimeout(() => clientGame.sendDrawAction('pen', 3, 4, '#000000', 3), 1000);

//Beispiel: Radieren auf Board --> clientGame.sendDrawAction() mit Tool eraser
setTimeout(() => clientGame.sendDrawAction('eraser', 3, 4, '', 3), 2000);

//Beispiel: Füllen des Boards mit Farbe --> clientGame.sendFillAction()
setTimeout(() => clientGame.sendFillAction('#888888'), 3000);

//Beispiel: Kompletter Clear auf Board --> clientGame.sendClearAction()
setTimeout(() => clientGame.sendClearAction(), 4000);