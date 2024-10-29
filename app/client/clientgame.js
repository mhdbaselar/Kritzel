"use strict"

const Action = require('./class/action');
const Message = require('./class/message');

module.exports = class ClientGame {

    constructor() {
        this.elementList = null
    }

    openWebSocket() {
        // build websocket-url from current location
        this.socket = new WebSocket("ws://" + location.host + location.pathname)
        this.socket.onopen = (event) => { console.log("socket opened") }
        this.socket.onclose = (event) => { console.log("socket closed") }
        this.socket.onerror = (event) => { console.log("socket error: " + JSON.stringify(event)) }
        this.socket.onmessage = (event) => { this.update(event.data) }
    }
    
    update(json) {
        let el = JSON.parse(json);

        //TODO: Update Canvas clientseitig
        //HIER WIRD DIE JSON MIT DEM INHALT DES BOARDS EMPFANGEN UND HIER KANN DANN DER INHALT DES CANVAS AKTUALISIERT WERDEN

        console.log(el);
    }

    //------------------------------------- 
    //----------SENDING FUNCTIONS----------
    //-------------------------------------

    /**
     * Sends a draw action direct to the server
     * @param {string} tool pen | eraser: Tool that is used for draw action, pen by default
     * @param {int} x x-coordinate of pixel to draw on
     * @param {int} y y-coordinate of pixel to draw on
     * @param {string} color color code in hexadecimal notation
     * @param {int} thickness thickness of draw action
     */
    sendDrawAction(tool = 'pen', x = 0, y = 0, color = '#000000', thickness = 3){
        let _tool = 'pen';

        if(tool == 'pen') _tool = 'pen';
        if(tool == 'eraser') _tool = 'eraser';
        
        let action = new Action(_tool, x , y, color, thickness);
        let message = new Message('action', action);

        //this.send(JSON.stringify(message));

        let _message = JSON.stringify(message);

        console.log('Test');

        this.send(_message);

        //if (this.socket)
            //this.socket.send(_message)
    }
    
    /**
     * Asks the server to clear the whole board
     */
    sendClearAction(){
        let action = new Action('clear', 0 , 0, '', 0);
        let message = new Message('action', action);

        this.send(JSON.stringify(message));
    }

    /**
     * Asks the server to fill the whole board into one color
     * @param {string} color color code in hexadecimal notation
     */
    sendFillAction(color = '#000000'){
        let action = new Action('fill', 0 , 0, color, 0);
        let message = new Message('action', action);

        this.send(JSON.stringify(message));
    }

    send(message) {
        if (this.socket)
            this.socket.send(message)
    }

}
