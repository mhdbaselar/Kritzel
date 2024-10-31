"use strict"

module.exports = class Board {
    #canvas;
    #rows;
    #columns;
    #initialColor;
    #backgroundColor;

    /**
     * Constructor to instanciate Board
     * @param {int} columns number of columns (x coordinates)
     * @param {int} rows number of rows (y coordinates)
     * @param {string} initialColor color code in hexadecimal notation
     */
    constructor(columns, rows, initialColor) {
        this.#canvas = new Array();

        this.#rows = rows;
        this.#columns = columns;

        this.#initialColor = initialColor;
        this.#backgroundColor = initialColor;
        
        this.clear();
    }

    /**
     * Draws an hexadecimal color code to given coordinate with given thickness in each direction
     * @param {int} x coordinate
     * @param {int} y coordinate
     * @param {string} color hexadecimal color code
     * @param {int} thickness thickness
     */
    draw(x, y, color, thickness){
        this.#drawIn(x, y, color, thickness);
    }

    erase(x, y, thickness){
        this.#drawIn(x, y, this.#backgroundColor, thickness);
    }

    clear(){
        this.#setWholeBoard(this.#initialColor);
    }

    fill(color){
        this.#setWholeBoard(color);
    }

    getBoard(){
        return this.#canvas;
    }

    //------------------------------------- 
    //------------HELP FUNCTIONS-----------
    //-------------------------------------

    #drawIn(x, y, color, thickness){
        for (let yt = -thickness + 1; yt < thickness; yt++) {
            for (let xt = -thickness + 1; xt < thickness; xt++) {
                if (Math.sqrt(xt * xt + yt * yt) < thickness) {
                    if (y + yt >= 0 && y + yt < this.#rows) {
                        if (x + xt >= 0 && x + xt < this.#columns) {
                            this.#canvas[y + yt][x + xt] = color;
                        }
                    }
                }
            }
        }
    }

    #setWholeBoard(color){
        this.#backgroundColor = color;
        for (let j = 0; j < this.#rows; j++) {
            this.#canvas[j] = [];
            for (let i = 0; i < this.#columns; i++) {
                this.#canvas[j][i] = color;
            }
        }
    }
}