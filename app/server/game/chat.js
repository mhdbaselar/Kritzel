"use strict"

module.exports = class Chat{
    /**@type {{cid: string, msg: string}[]} */
    #messages;          // list of all client chat messages

    /**
     * Constructor to instanciate the chat
     */
    constructor(){
        this.#messages = [];
    }

    /**
     * Adds the user chat meesage to the messages List
     * @param {*} cid user unique ID
     * @param {*} message chat message
     */
    addMessage(cid, message){
        this.#messages.push({cid : cid, msg: message});
    }

    /**
     * Returns all messages
     * @returns {{uid : uid, msg: string}[]} list of messages
     */
    getMessages(){
        return this.#messages;
    }

}
