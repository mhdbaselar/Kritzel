/**
 * Serverseite Verwaltung der Leinwand
 */
"use strict"

module.exports = class Board {
    #canvas;
    #rows;
    #columns;
    #initialColor;
    #backgroundColor;

    constructor(rows, columns, initialColor) {
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

    //Hilfsmethoden


    #drawIn(x, y, color, thickness){
        for (let i = 0; i < thickness; i++) {
            //i entspricht y
            for (let j = 0; j < thickness; j++) {
                //j entspricht x

                //Wenn x-j >= 0 und x+j < rows
                if(x-j >= 0){
                    //Wenn y-i >= 0 --> Zeichne Farbe
                    if(y-i >= 0) this.#canvas[y-i][x-j] = color;
                    //Wenn y+i < rows --> Zeichne Farbe
                    if(y+i < this.#rows) this.#canvas[y+i][x-j] = color;
                }

                if(x+j < this.#columns){
                    //Wenn y-i >= 0 --> Zeichne Farbe
                    if(y-i >= 0) this.#canvas[y-i][x+j] = color;
                    //Wenn y+i < rows --> Zeichne Farbe
                    if(y+i < this.#rows) this.#canvas[y+i][x+j] = color;
                }
            }
        }
    }

    #setWholeBoard(color){
        this.#backgroundColor = color;
        for (let i = 0; i < this.#rows; i++) {
            this.#canvas[i] = [];
            for (let j = 0; j < this.#columns; j++) {
                this.#canvas[i][j] = color;
            }
        }
    }
}