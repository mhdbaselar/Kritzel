"use strict";
/**
 * Class to convert HEX colors to integers and back.
 * @class HexColorConverter
 * @classdesc Class to convert HEX colors to integers and back.
 */
module.exports = class HexColorConverter {
  constructor() {
    /**
     * Mapping of HEX colors to integers.
     * @type {Object.<string, number>}
     * @private
     */
    this.hexToIntMap = {
      "#FFFFFF": 0, // White
      "#000000": 1, // Black
      "#FF0000": 2, // Red
      "#00FF00": 3, // Green
      "#0000FF": 4, // Blue
      "#FFFF00": 5, // Yellow
      "#FF00FF": 6, // Magenta
      "#00FFFF": 7, // Cyan
    };

    /**
     * Mapping of integers (0 to 7) to HEX colors.
     * @type {Object.<string, number>}
     * @private
     */
    this.intToHexMap = Object.fromEntries(
      Object.entries(this.hexToIntMap).map(([key, value]) => [value, key])
    );
  }

  /**
   * Method to convert HEX color to integer
   * @param {string} hex
   * @returns {number}
   */
  hexToInt(hex) {
    hex = hex.toUpperCase(); // Ensure case-insensitivity
    if (this.hexToIntMap.hasOwnProperty(hex)) {
      return this.hexToIntMap[hex];
    } else {
      throw new Error(`Invalid HEX color: ${hex}`);
    }
  }

  /**
   * Method to convert integer to HEX color
   * @param {number} number
   * @returns {string}
   */
  intToHex(int) {
    if (this.intToHexMap.hasOwnProperty(int)) {
      return this.intToHexMap[int];
    } else {
      throw new Error(`Invalid integer: ${int}`);
    }
  }
};
