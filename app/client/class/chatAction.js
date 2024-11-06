"use strict";
/**
 * Class to represent a chat action
 * @class ChatAction
 * @classdesc Class to represent a chat action
 */
module.exports = class ChatAction {
  /**@type {string} */
  message;

  /**
   * Constructor to instanciate a action for the chat
   * @param {string} message client chat message
   * @class ChatAction
   */
  constructor(message) {
    this.message = message;
  }
};
