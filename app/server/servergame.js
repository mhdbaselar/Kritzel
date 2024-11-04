"use strict"

const Board = require('./game/board');
const Chat = require('./game/chat');

module.exports = class ServerGame {
    /**@type {Board} */
    #board;
    /**@type {boolean} */
    #isSendPointList;
    /**@type {Chat} */
    #chat;
    /**@type {TinyServer} */
    #server;

    /**
     * Constructor to instanciate the server game logic
     * @param {TinyServer} server websocketserver
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
     * @param {string} uid user unique ID
     * @param {Message} request client request
     */
    processInput(uid, request){
        let _request = JSON.parse(request);

        if(_request.messageType == 'drawAction'){       // draw action
            let action = _request.messageBody;

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
                this.#isSendPointList = false;
            }

            if(action.tool == 'fillBackground'){
                this.#board.fillBackground(action.color);
                this.#isSendPointList = false;
            }

        } else if (_request.messageType == 'getCanvasAction'){      // set 2D-array send option to send whole canvas 
            this.#isSendPointList = false;
            
        } else if (_request.messageType == 'chatAction'){           // send chat message to clients
            let chatMsg = _request.messageBody.message;

            this.#chat.addMessage(uid, chatMsg);

            let jsonMessage = JSON.stringify({type : 'chatMsg', data : chatMsg, uid : uid});
            this.#server.broadcastWsMessage(uid, jsonMessage, false, 'allWithoutSender');

        } else if (_request.messageType == 'getChatAction'){                // get whole chat
            let jsonMessage = JSON.stringify({type : 'chatMsgList', data : this.#chat.getMessages(), uid : uid});
            this.#server.broadcastWsMessage(uid, jsonMessage, false, 'onlySender');
        }
    }
}
