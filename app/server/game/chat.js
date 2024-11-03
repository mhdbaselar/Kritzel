"use strict"

module.exports = class Chat{
    /**@type {{uid: string, msg: string}[]} */
    #messages;          // list of all client chat messages

    /**
     * Constructor to instanciate the chat
     */
    constructor(){
        this.#messages = [];
    }

    /**
     * Adds the user chat meesage to the messages List
     * @param {*} uid user unique ID
     * @param {*} message chat message
     */
    addMessage(uid, message){
        this.#messages.push({uid : uid, msg: message});
    }

    /**
     * Returns all messages
     * @returns list of messages - [{uid : uid, msg: message}]
     */
    getMessages(){
        return this.#messages;
    }

}
