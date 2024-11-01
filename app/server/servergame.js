"use strict"

const Board = require('./game/board');

module.exports = class ServerGame {
    #board;
    #isSendPointList;

    constructor(tickCallback) {
        this.tickCallback = tickCallback;
        this.intervalReference = null;
        this.#board = null;
        this.#isSendPointList = null;
    }

    start() {
        this.#board = new Board(600, 400, '#FFFFFF'); 

        this.intervalReference = setInterval(this.tick.bind(this), 100);
    }

    stop() {
        if (this.intervalReference) clearInterval(this.intervalReference);
        this.intervalReference = null;
    }

    tick() {
        this.tickCallback();
    }

    getBoard(){
        return this.#board;
    }

    getisSendPointList(){
        return this.#isSendPointList;
    }

    getIsSendPointList(){
        return this.#isSendPointList;
    }

    setIsSendPointList(bool){
        this.#isSendPointList = bool;
    }

    processInput(message){
        let _message = JSON.parse(message);

        if(_message.messageType == 'action'){
            let action = _message.messageBody;

            if(action.tool == 'pen') {
                this.#board.draw(action.x, action.y, action.color, action.thickness);
                this.#isSendPointList = true;
            }
                
            if(action.tool == 'eraser'){
                this.#board.erase(action.x, action.y, action.thickness);
                this.#isSendPointList = true;
            }
                
            if(action.tool == 'clear'){
                this.#board.clear();
                this.#isSendPointList = false;
            }
                
            if(action.tool == 'fill'){
                this.#board.fill(action.color);
                this.#isSendPointList = false;
            }
                
        } else if (_message.messageType = 'getCanvasAction'){
            this.#isSendPointList = false;
        }
    }
}
