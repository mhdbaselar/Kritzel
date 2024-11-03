module.exports = class ChatAction {
    /**@type {string} */
    message;

    /**
     * Constructor to instanciate a action for the chat
     * @param {string} message client chat message
     */
    constructor(message){
        this.message = message;
    }

    
}