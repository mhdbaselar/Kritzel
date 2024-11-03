"use strict"

const Board = require('./game/board');
const Chat = require('./game/chat');

module.exports = class ServerGame {
    /**@type {Board} */
    #board;
    /**@type {boolean} */
    #isSendPointList;
    #chat;
    #server;

    /**
     * Constructor to instanciate the server game logic
     * @param {function} tickCallback send function
     */
    constructor(server, tickCallback) {
        this.#server = server;
        this.tickCallback = tickCallback;
        this.intervalReference = null;
        this.#board = null;
        this.#chat = null;
        this.#isSendPointList = null;
    }

    /**
     * Creates a board, sets and starts the interval for the send function
     */
    start() {
        this.#board = new Board(600, 400, '#FFFFFF');
        this.#chat = new Chat();

        this.intervalReference = setInterval(this.tick.bind(this), 100);
    }

    /**
     * Stops the interval for the send function
     */
    stop() {
        if (this.intervalReference) clearInterval(this.intervalReference);
        this.intervalReference = null;
    }

    /**
     * Executes the send function (this.tickCallback())
     */
    tick() {
        this.tickCallback();
    }

    /**
     * Returns the board object
     * @returns Board (Servergame.#board)
     */
    getBoard(){
        return this.#board;
    }

    /**
     * Returns whether a list of points or the entire canvas should be send
     * @returns boolean (Servergame.#isSendPointList)
     */
    getIsSendPointList(){
        return this.#isSendPointList;
    }

    /**
     * Sets whether a list of points or the entire canvas should be send
     * @param {boolean} bool true or false
     */
    setIsSendPointList(bool){
        this.#isSendPointList = bool;
    }

    /**
     * Get and process a client message
     * @param {Message} message client request
     */
    processInput(uid, message){
        let _message = JSON.parse(message);

        if(_message.messageType == 'action'){
            let action = _message.messageBody;

            if(action.tool == 'pen') {
                this.#board.draw(action.x, action.y, action.color, action.thickness);
                this.#isSendPointList = true;
            }

            if(action.tool == 'eraser'){
                this.#board.erase(action.x, action.y, action.thickness);
                this.#isSendPointList = true;
            }

            if(action.tool == 'clear'){
                this.#board.clear();
                this.#isSendPointList = false;
            }

            if(action.tool == 'fill'){
                this.#board.fill(action.x, action.y ,action.color);
                this.#isSendPointList = true;
            }

            if(action.tool == 'fillBackground'){
                this.#board.fillBackground(action.color);
                this.#isSendPointList = false;
            }

        } else if (_message.messageType == 'getCanvasAction'){
            this.#isSendPointList = false;
        } else if (_message.messageType == 'chatAction'){
            let chatAction = _message.messageBody;
            let chatMsg = chatAction.message;

            this.#chat.addMessage(uid, chatMsg);

            let jsonMessage = JSON.stringify({type : 'chatMsg', data : chatMsg, uid : uid});
            this.#server.broadcastWsMessage2(uid, jsonMessage, false);
        } else if (_message.messageType == 'getChatAction'){
            let jsonMessage = JSON.stringify({type : 'chatMsgList', data : this.#chat.getMessages(), uid : uid});
            this.#server.broadcastWsMessage3(uid, jsonMessage, false);
        }
    }
}
