"use strict"

const Board = require('./game/board');

module.exports = class ServerGame {
    #board;

    constructor(tickCallback) {
        this.tickCallback = tickCallback;
        this.intervalReference = null;
        this.#board = null;
    }

    start() {
        this.#board = new Board(400, 300, '#FFFFFF');

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

    processInput(message){
        let _message = JSON.parse(message);

        if(_message.messageType == 'action'){
            let action = _message.messageBody;

            if(action.tool == 'pen') 
                this.#board.draw(action.x, action.y, action.color, action.thickness);

            if(action.tool == 'eraser')
                this.#board.erase(action.x, action.y, action.thickness);

            if(action.tool == 'clear')
                this.#board.clear();

            if(action.tool == 'fill')
                this.#board.fill(action.color);
        }
    }
}
