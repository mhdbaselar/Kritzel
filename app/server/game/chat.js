"use strict"

module.exports = class Chat{
    /**@type {{cid: string, msg: string, timestamp: Date}[]} */
    #messages;          // list of all client chat messages

    /**
     * Constructor to instanciate the chat
     */
    constructor(){
        this.#messages = [];
    }

    /**
     * Adds the user chat meesage to the messages List
     * @param {string} cid user unique ID
     * @param {string} message chat message
     * @param {Date} timestamp timestamp of message 
     */
    addMessage(cid, message, timestamp){
        this.#messages.push({cid : cid, msg : message, timestamp : timestamp });
    }

    /**
     * Returns all messages
     * @returns {{uid : uid, msg: string}[]} list of messages
     */
    getMessages(){
        return this.#messages;
    }

}
