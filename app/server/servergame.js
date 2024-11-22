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
   * Creates a lobby, sets and starts the interval for the send function
   */
  start() {
    let lobby = new Lobby();
    this.#lobbies.push(lobby);

    /*let lobby2 = new Lobby();       // Test for two lobbies
    this.#lobbies.push(lobby2);*/

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
   * Get the lobbies
   * @returns {Lobby[]} list of lobbies
   */
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

    // add Player Object to lobby
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
      this.#processChatAction(_request.messageBody.message, cid, _request.messageBody.timestamp, lobbyID);

    } else if (_request.messageType == "getChatAction") {
      this.#processGetChatAction(cid, lobbyID);

    } else if (_request.messageType == "getUserListAction") {
      this.#processGetUserListAction(cid, lobbyID);
    } else if (_request.messageType == "setWord"){
      this.#processSetWordAction(cid, _request.messageBody, lobbyID);
    }

  }

  //-------------------------------------
  //------------HELP FUNCTIONS-----------
  //-------------------------------------

  /**
   * Processes the draw action
   * @param {Object} action draw action
   * @param {string} cid user unique ID
   * @param {int} lobbyID index of the lobby
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
      let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
      let jsonMessage = JSON.stringify({ type: "initWhiteCanvas", data: [0] });
      this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", playerInLobby);
    }

    if (action.tool == "fill") {
      let hasChanged = this.#lobbies[lobbyID].fill(action.x, action.y, action.color, cid);
      if (hasChanged) {
        let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
        let jsonMessage = JSON.stringify({ type: "2d", data: this.#lobbies[lobbyID].getBoardCanvas() });
        this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", playerInLobby);
      }
    }

    /*if (action.tool == "fillBackground") {
      this.#board.fillBackground(action.color);
      this.#isSendPointList = false;
    }*/
  }

  /**
   * Sends the current canvas to all clients in the lobby
   * @param {string} cid user unique ID
   * @param {int} lobbyID index of the lobby
  */
  #processGetCanvasAction(cid, lobbyID) {
    let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
    let jsonMessage = JSON.stringify({ type: "2d", data: this.#lobbies[lobbyID].getBoardCanvas() });
    this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", playerInLobby);
  }

  /**
   * Processes the chat action (send a message to all clients in the lobby)
   * @param {string} chatMsg chat message
   * @param {string} cid user unique ID
   * @param {int} lobbyID index of the lobby
   */
  #processChatAction(chatMsg, cid, timestamp, lobbyID) {
    this.#lobbies[lobbyID].addMessage(chatMsg, cid, timestamp);

    let name = this.#server.getClients().getNameByCid(cid);

    let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
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
      playerInLobby
    );
  }

  /**
   * Sends all chat messages to the request client
   * @param {string} cid user unique ID
   * @param {int} lobbyID index of the lobby
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

  /**
   * Sends a playerList of the lobby to all clients in the lobby
   * @param {string} cid client unique ID
   * @param {int} lobbyID index of the lobby
   */
  #processGetUserListAction(cid, lobbyID) {
    let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
    let sendPlayerList = [];

    playerInLobby.forEach(player => {
      sendPlayerList.push({ name: player.getName(), points: player.getPoints() });
    });


    let jsonMessage = JSON.stringify({ type: "userList", data: sendPlayerList });

    this.#server.broadcastWsMessage(cid, jsonMessage, false, "allInLobby", playerInLobby);
  }

  #processSetWordAction(cid, word, lobbyID){
    this.#lobbies[lobbyID].setWord(word, cid);
  }
};


