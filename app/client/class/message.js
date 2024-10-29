"use strict"

module.exports = class Message {
    messageType;
    messageBody;

    constructor(messageType, messageBody){
        this.messageBody = messageBody;
        this.messageType = messageType;
    }
}