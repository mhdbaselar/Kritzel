"use strict"

module.exports = class Chat{
    #messages;

    constructor(){
        this.#messages = [];
    }

    addMessage(uid, message){
        this.#messages.push({uid : uid, msg: message});
    }

    getMessages(){
        return this.#messages;
    }

}
