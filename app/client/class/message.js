"use strict"

module.exports = class Message {
    /**@type {string} */
    messageType;
    /**@type {DrawAction | ChatAction} */
    messageBody;

    /**
     * Constructor to instanciate a Message (Request)
     * @param {string} messageType request type
     * @param {DrawAction | ChatAction} messageBody request body
     */
    constructor(messageType, messageBody){
        this.messageBody = messageBody;
        this.messageType = messageType;
    }
}