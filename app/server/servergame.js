"use strict";

const Board = require("./game/board");
const Chat = require("./game/chat");
const ClientList = require("./users/clientList");

module.exports = class ServerGame {
  /**@type {Board} */
  #board;
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
  }

  /**
   * Creates a board, sets and starts the interval for the send function
   */
  start() {
    this.#board = new Board(600, 400, 0);
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
  getBoard() {
    return this.#board;
  }

  /**
   * Get and process a client message
   * @param {string} cid user unique ID
   * @param {Message} request client request
   */
  processInput(cid, request) {
    let _request = JSON.parse(request);

    if (_request.messageType == "drawAction") {
      this.#processDrawAction(_request.messageBody, cid);
      
    } else if (_request.messageType == "getCanvasAction") {
      this.#processGetCanvasAction(cid);

    } else if (_request.messageType == "chatAction") {
      this.#processChatAction(_request.messageBody.message, cid);

    } else if (_request.messageType == "getChatAction") {
      this.#processGetChatAction(cid);
    }
  }

  //-------------------------------------
  //------------HELP FUNCTIONS-----------
  //-------------------------------------

  /**
   * Processes the draw action
   * @param {Object} action draw action
   * @param {string} cid user unique ID
   */
  #processDrawAction(action, cid){

    if (action.tool == "pen") {
      this.#board.draw(action.x, action.y, action.color, action.thickness);
    }

    if (action.tool == "eraser") {
      this.#board.erase(action.x, action.y, action.thickness);
    }

    if (action.tool == "clear") {
      this.#board.clear();
      let jsonMessage = JSON.stringify({type: "initWhiteCanvas", data: [0]});
      this.#server.broadcastWsMessage(cid, jsonMessage, false, "all");
    }

    if (action.tool == "fill") {
      let hasChanged = this.#board.fill(action.x, action.y, action.color);
      if(hasChanged){
        let jsonMessage = JSON.stringify({type: "2d", data: this.#board.getBoard()});
        this.#server.broadcastWsMessage(cid, jsonMessage, false, "all");
      }
    }

    /*if (action.tool == "fillBackground") {
      this.#board.fillBackground(action.color);
      this.#isSendPointList = false;
    }*/
  }

  /**
   * Sends the current canvas to all clients
   * @param {string} cid user unique ID
  */
  #processGetCanvasAction(cid){
    let jsonMessage = JSON.stringify({type: "2d", data: this.#board.getBoard()});
    this.#server.broadcastWsMessage(cid, jsonMessage, false, "all");
  }

  /**
   * Processes the chat action (send a message to all clients)
   * @param {string} chatMsg chat message
   * @param {string} cid user unique ID
   */
  #processChatAction(chatMsg, cid){

    this.#chat.addMessage(cid, chatMsg);
    
    let name = this.#server.getClients().getNameByCid(cid);

    let jsonMessage = JSON.stringify({
      type: "chatMsg",
      data: chatMsg,
      cid: cid,
      name: name
    });
    this.#server.broadcastWsMessage(
      cid,
      jsonMessage,
      false,
      "allWithoutSender"
    );

  }

  /**
   * Sends all chat messages to the client
   * @param {string} cid user unique ID
   */
  #processGetChatAction(cid){
    let messages = this.#chat.getMessages();
    let data = [];
    messages.forEach(message => {
      let name = this.#server.getClients().getNameByCid(message.cid);
      data.push({cid: message.cid, msg: message.msg, name: name});
    });

    let jsonMessage = JSON.stringify({
      type: "chatMsgList",
      data: data,
      cid: cid,
    });
    this.#server.broadcastWsMessage(cid, jsonMessage, false, "onlySender");
  }
};
