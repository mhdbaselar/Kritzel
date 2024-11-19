"use strict";

const Lobby = require("./game/lobby");
const Client = require("./users/client");

module.exports = class ServerGame {
  /**@type {TinyServer} */
  #server;
  /**@type {Lobby[]} */
  #lobbies;

  /**
   * Constructor to instanciate the server game logic
   * @param {TinyServer} server websocketserver
   * @param {function} tickCallback send function
   */
  constructor(server, tickCallback) {
    this.#server = server;
    this.tickCallback = tickCallback;
    this.intervalReference = null;
    this.#lobbies = [];
  }

  /**
   * Creates a board, sets and starts the interval for the send function
   */
  start() {
    let lobby = new Lobby();
    this.#lobbies.push(lobby);

    /*let lobby2 = new Lobby();       // Test for two lobbies
    this.#lobbies.push(lobby);*/

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

  getLobbies(){
    return this.#lobbies;
  }

  /**
   * Get and process a client message
   * @param {string} cid user unique ID
   * @param {Message} request client request
   */
  processInput(cid, request) {
    let lobbyID = null;

    // set Lobby of request sender
    this.#server.getClients().getClientList().forEach(client => {
      if(client.getCid() == cid) {
        lobbyID = client.getLobbyID();
      }
    });

    // add Player Referenz/Object to lobby
    if(request instanceof Client){
      this.#lobbies[lobbyID].addPlayer(request);
      return;
    }

    let _request = JSON.parse(request);
    
    if (_request.messageType == "drawAction") {
      this.#processDrawAction(_request.messageBody, cid, lobbyID);

    } else if (_request.messageType == "getCanvasAction") {
      this.#processGetCanvasAction(cid, lobbyID);

    } else if (_request.messageType == "chatAction") {
      this.#processChatAction(_request.messageBody.message, cid, lobbyID);

    } else if (_request.messageType == "getChatAction") {
      this.#processGetChatAction(cid, lobbyID);

    } else if (_request.messageType == "getUserListAction") {
      this.#processGetUserListAction(cid, lobbyID);
    }

  }

  //-------------------------------------
  //------------HELP FUNCTIONS-----------
  //-------------------------------------

  /**
   * Processes the draw action
   * @param {Object} action draw action
   * @param {string} cid user unique ID
   * @param {int} lobbyID lobbyID
   */
  #processDrawAction(action, cid, lobbyID) {

    if (action.tool == "pen") {
      this.#lobbies[lobbyID].draw(action.x, action.y, action.color, action.thickness);
    }

    if (action.tool == "eraser") {
      this.#lobbies[lobbyID].erase(action.x, action.y, action.thickness, cid);
    }

    if (action.tool == "clear") {
      this.#lobbies[lobbyID].clear(cid);
      let jsonMessage = JSON.stringify({ type: "initWhiteCanvas", data: [0] });
      this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", lobbyID);
    }

    if (action.tool == "fill") {
      let hasChanged = this.#lobbies[lobbyID].fill(action.x, action.y, action.color, cid);
      if (hasChanged) {
        let jsonMessage = JSON.stringify({ type: "2d", data: this.#lobbies[lobbyID].getBoardCanvas() });
        this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", lobbyID);
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
   * @param {int} lobbyID lobbyID 
  */
  #processGetCanvasAction(cid, lobbyID) {
    let jsonMessage = JSON.stringify({ type: "2d", data: this.#lobbies[lobbyID].getBoardCanvas() });
    this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", lobbyID);
  }

  /**
   * Processes the chat action (send a message to all clients)
   * @param {string} chatMsg chat message
   * @param {string} cid user unique ID
   * @param {int} lobbyID lobbyID
   */
  #processChatAction(chatMsg, cid, lobbyID) {
    this.#lobbies[lobbyID].addMessage(chatMsg, cid);

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
      "allInLobbyWithoutSender",
      lobbyID
    );
  }

  /**
   * Sends all chat messages to the client
   * @param {string} cid user unique ID
   * @param {*} lobbyID lobbyID
   */
  #processGetChatAction(cid, lobbyID) {
    let messages = this.#lobbies[lobbyID].getMessages(cid);
    let data = [];
    messages.forEach(message => {
      let name = this.#server.getClients().getNameByCid(message.cid);
      data.push({ cid: message.cid, msg: message.msg, name: name });
    });

    let jsonMessage = JSON.stringify({
      type: "chatMsgList",
      data: data,
      cid: cid,
    });
    this.#server.broadcastWsMessage(cid, jsonMessage, false, "onlySender");
  }

  
  #processGetUserListAction(cid, lobbyID) {
    let userList = this.#server.getClients().getClientsByLobbyID(lobbyID);
    let sendUserList = [];

    userList.forEach(user => {
      sendUserList.push({ name: user.getName(), points: user.getPoints() });
    });

    let jsonMessage = JSON.stringify({ type: "userList", data: sendUserList });

    this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", lobbyID);
  }
};


