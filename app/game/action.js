"use strict"

module.exports = class Action {
    tool;
    x;
    y;
    color;
    thickness;

    constructor(tool, x, y, color, thickness){
        this.tool = tool;
        this.x = x;
        this.y = y;
        this.color = color;
        this.thickness = thickness;
    }
}