/**
 * Message class to handle requests
 * @class Message
 * @classdesc Class to handle requests
 */

"use strict";

module.exports = class Message {
  /**@type {string} */
  messageType;
  /**@type {DrawAction | ChatAction} */
  messageBody;

  /**
   * Constructor to instanciate a Message (Request)
   * @param {string} messageType request type
   * @param {DrawAction | ChatAction} messageBody request body
   *
   * @class Message
   */
  constructor(messageType, messageBody) {
    this.messageBody = messageBody;
    this.messageType = messageType;
  }
};
