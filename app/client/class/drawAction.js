/**
 * Class to represent a draw action
 * @class DrawAction
 * @classdesc Class to represent a draw action
 */

"use strict";

module.exports = class DrawAction {
  tool;
  x;
  y;
  color;
  thickness;

  /**
   * Constructor to instanciate a action for draw
   * @param {string} tool draw tool
   * @param {int} x coordinate
   * @param {int} y coordinate
   * @param {string} color hexadecimal color code
   * @param {*} thickness thicknes
   * @class DrawAction
   */
  constructor(tool, x, y, color, thickness) {
    this.tool = tool;
    this.x = x;
    this.y = y;
    this.color = color;
    this.thickness = thickness;
  }
};
