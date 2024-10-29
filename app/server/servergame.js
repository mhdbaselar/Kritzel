"use strict"

const RandomWalkCircleElement = require('../game/randomwalkcircleelement')
const ElementList = require('../game/elementlist')

const Board = require('../game/board');

//----------------------

module.exports = class ServerGame {
    constructor(tickCallback) {
        this.tickCallback = tickCallback
        this.intervalReference = null
        this.elementList = null
    }

    //----------------------

    start() {
        this.elementList = new ElementList()
        for (let i = 0; i < 60; i++) {
            this.elementList.add(new RandomWalkCircleElement(i * 10, 150))
        }

        //let board = new Board(4, 6, 'F');

        //board.draw(5,3,'B',3);

        //board.colorWholeBoard('#000000');

        //board.clearWholeBoard();

        this.intervalReference = setInterval(this.tick.bind(this), 100)
    }

    //----------------------

    stop() {
        if (this.intervalReference) clearInterval(this.intervalReference)
        this.intervalReference = null
    }

    //----------------------

    tick() {
        this.elementList.action()
        this.tickCallback()
    }

}
