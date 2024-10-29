"use strict"

const RandomWalkCircleElement = require('../game/randomwalkcircleelement')
const ElementList = require('../game/elementlist')

const Board = require('../game/board');

module.exports = class ServerGame {
    #board;

    constructor(tickCallback) {
        this.tickCallback = tickCallback;
        this.intervalReference = null;
        this.elementList = null;
        this.#board = new Board(4, 6, '#FFFFFF');
    }

    start() {
        this.elementList = new ElementList()
        for (let i = 0; i < 60; i++) {
            this.elementList.add(new RandomWalkCircleElement(i * 10, 150))
        }

        this.#board = new Board(4, 6, '#FFFFFF');

        this.intervalReference = setInterval(this.tick.bind(this), 100)
    }

    stop() {
        if (this.intervalReference) clearInterval(this.intervalReference)
        this.intervalReference = null
    }

    tick() {
        this.elementList.action()
        this.tickCallback()
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
