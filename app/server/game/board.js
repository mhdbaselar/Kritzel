"use strict"

module.exports = class Board {
    #canvas;
    #rows;
    #columns;
    #initialColor;
    #backgroundColor;
    #previousPoint;
    #points;

    /**
     * Constructor to instanciate Board
     * @param {int} columns number of columns (x coordinates)
     * @param {int} rows number of rows (y coordinates)
     * @param {string} initialColor color code in hexadecimal notation
     */
    constructor(columns, rows, initialColor) {
        this.#canvas = new Array();
        this.#points = new Array();

        this.#rows = rows;
        this.#columns = columns;

        this.#initialColor = initialColor;
        this.#backgroundColor = initialColor;

        this.#previousPoint = {x0 : null, y0 : null};

        this.#points[0] = {x: 0, y: 0, color: '#FFFFFF'}
        
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
        if(x != null || y != null) {
            let x0 = this.#previousPoint.x0;
            let y0 = this.#previousPoint.y0;
            this.#points = this.#points.concat(this.#drawLine(x0, y0, x, y, color, thickness));
        }
        this.#previousPoint = { x0 : x, y0 : y};
    }

    erase(x, y, thickness){
        if(x != null || y != null) {
            let x0 = this.#previousPoint.x0;
            let y0 = this.#previousPoint.y0;
            this.#points = this.#points.concat(this.#drawLine(x0, y0, x, y, this.#backgroundColor, thickness));
        }
        this.#previousPoint = { x0 : x, y0 : y};
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

    getPoints(){
        return this.#points;
    }

    setPointsEmpty() {
        this.#points = [];
    }

    //------------------------------------- 
    //------------HELP FUNCTIONS-----------
    //-------------------------------------

    #drawLine(x0, y0, x1, y1, color, thickness) {
        let points = [];
        if(x0 == null || y0 == null){
            points = this.#drawPoint(x1, y1, color, thickness);
        } else {
            
            let dx = Math.abs(x1 - x0);
            let dy = Math.abs(y1 - y0);
            let sx = (x0 < x1) ? 1 : -1;
            let sy = (y0 < y1) ? 1 : -1;
            let err = dx - dy;

            while (true) {
                let pointList = this.#drawPoint(x0, y0, color, thickness);
                pointList.forEach(point => {
                    points.push(point);
                });

                if (x0 === x1 && y0 === y1) break;
                let e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x0 += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y0 += sy;
                }
            }
        }
        return points;
    }

    #drawPoint(x, y, color, thickness){
        let points = []
        for (let yt = -thickness + 1; yt < thickness; yt++) {
            for (let xt = -thickness + 1; xt < thickness; xt++) {
                if (Math.sqrt(xt * xt + yt * yt) < thickness) {
                    if (y + yt >= 0 && y + yt < this.#rows) {
                        if (x + xt >= 0 && x + xt < this.#columns) {
                            this.#canvas[y + yt][x + xt] = color;
                                points.push({x: x + xt, y: y + yt, color: color});
                        }
                    }
                }
            }
        }
        return points;
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