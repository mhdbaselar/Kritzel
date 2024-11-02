"use strict"

module.exports = class Board {
    #canvas;           // 2D with hexadecimal colors codes
    #rows;
    #columns;
    #initialColor;      // hexadecimal color at start
    #backgroundColor;
    #previousPoint;     // previous point for line generation
    #points;            // transfer points list

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

        this.#points = [];
        
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

    /**
     * Erase an hexadecimal color code to given coordinate with given thickness in each direction to background color
     * @param {int} x coordinate
     * @param {int} y coordinate
     * @param {string} color hexadecimal color code
     * @param {int} thickness thickness
     */
    erase(x, y, thickness){
        if(x != null || y != null) {
            let x0 = this.#previousPoint.x0;
            let y0 = this.#previousPoint.y0;
            this.#points = this.#points.concat(this.#drawLine(x0, y0, x, y, this.#backgroundColor, thickness));
        }
        this.#previousPoint = { x0 : x, y0 : y};
    }

    /**
     * Clear the whole Canvas | Sets the initial color to all positions in the 2D array
     */
    clear(){
        this.#setWholeBoard(this.#initialColor);
    }

    /**
     * Fills the whole Canvas with one color | Sets a color to all positions in the 2D array
     * @param {string} color 
     */
    fillBackground(color){
        this.#setWholeBoard(color);
    }

    /**
     * Fills the area where the point (x,y) is located with one color
     * @param {int} x coordinate
     * @param {int} y coordinate
     * @param {string} color hexadecimal color code
     */
    fill(x, y, color){
        let previousColor = this.#canvas[y][x];
        if(color != previousColor){
            let pointList = this.iterativefill(x, y, color, previousColor);
            console.log(pointList);
            this.#points = this.#points.concat(pointList);
        }   
    }

    /**
     * Fills the area where the point (x,y) is located with one color (iterative)
     * @param {int} x coordinate
     * @param {int} y coordinate
     * @param {string} color hexadecimal color code 
     * @param {string} previousColor previous color from fill mouse click 
     * @returns list of points
     */
    iterativefill(x, y, color, previousColor){
        let points = [];
        let pointStack = [{x: x, y: y}];
        
        while(pointStack.length > 0){
            let point = pointStack.pop(); 

            if (point.y >= 0 && point.y < this.#rows) {
                if (point.x >= 0 && point.x < this.#columns) {
                    if(previousColor == this.#canvas[point.y][point.x]) {
                        
                        this.#canvas[point.y][point.x] = color;
                        points.push({x: point.x, y: point.y, color: color});

                        pointStack.push({x: point.x+1, y: point.y});    // check right
                        pointStack.push({x: point.x-1, y: point.y});    // check left
                        pointStack.push({x: point.x, y: point.y+1});    // check down
                        pointStack.push({x: point.x, y: point.y-1});    // check up
                    }
                }
            }
        }  
        return points;
    }

    /**
     * Returns the current canvas (2D-array)
     * @returns this.#canvas - 2D-array
     */
    getBoard(){
        return this.#canvas;
    }

    /**
     * Returns the current transfer points list
     * @returns this.#points - list of all points to be transmitted to the clients
     */
    getPoints(){
        return this.#points;
    }

    /**
     * Clear the transfer points list (this.#points)
     */
    setPointsEmpty() {
        this.#points = [];
    }

    //------------------------------------- 
    //------------HELP FUNCTIONS-----------
    //-------------------------------------

    /**
     * Creates a line from a start point to an end point
     * @param {int} x0 previous x coordinate
     * @param {int} y0 previous y coordinate
     * @param {int} x1 current x coordinate
     * @param {int} y1 current y coordinate
     * @param {string} color hexadecimal color code
     * @param {int} thickness thickness of the line
     * @returns list of line points
     */
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

    /**
     * Creates a point
     * @param {int} x x
     * @param {int} y 
     * @param {string} color hexadecimal color code
     * @param {int} thickness thickness of the point
     * @returns list of pixels from the point
     */
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

    /**
     * Sets a hexadecimal color code to all positions in the 2D array (this.#canvas)
     * @param {string} color hexadecimal color code
     */
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