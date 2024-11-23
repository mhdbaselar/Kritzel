"use strict";
/**
 * Class to represent a chat action
 * @class ChatAction
 * @classdesc Class to represent a chat action
 */
module.exports = class ChatAction {
  /**@type {string} */
  message;
  /**@type {Date} */
  timestamp;

  /**
   * Constructor to instanciate a action for the chat
   * @param {string} message client chat message
   * @param {Date} timestamp timestamp of the message
   * @class ChatAction
   */
  constructor(message, timestamp) {
    this.message = message;
    this.timestamp = timestamp;
  }
};
