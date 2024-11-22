"use strict";
/**
 * Class to represent a chat action
 * @class ChatAction
 * @classdesc Class to represent a chat action
 */
module.exports = class ChatAction {
  /**@type {string} */
  message;
  timestamp;

  /**
   * Constructor to instanciate a action for the chat
   * @param {string} message client chat message
   * @class ChatAction
   */
  constructor(message, timestamp) {
    this.message = message;
    this.timestamp = timestamp;
  }
};
