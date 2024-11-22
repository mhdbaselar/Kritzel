"use strict";

const Lobby = require("./game/lobby");
const Client = require("./users/client");
const requestTypes = require("./../client/class/requestTypes");
const responseTypes = require("./../client/class/responseTypes");
const broadcastTypes = require("./broadcastTypes");

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
    let lobby = new Lobby(this.#server);
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

    if (_request.messageType == requestTypes.draw) {
      this.#processDrawAction(_request.messageBody, cid, lobbyID);

    } else if (_request.messageType == requestTypes.getCanvas) {
      this.#processGetCanvasAction(cid, lobbyID);

    } else if (_request.messageType == requestTypes.addChatMsg) {
      this.#processChatAction(_request.messageBody.message, cid, _request.messageBody.timestamp, lobbyID);

    } else if (_request.messageType == requestTypes.getAllChatMsg) {
      this.#processGetChatAction(cid, lobbyID);

    } else if (_request.messageType == requestTypes.getUserList) {
      this.#processGetUserListAction(cid, lobbyID);

    } else if (_request.messageType == requestTypes.setWord){
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
      let jsonMessage = JSON.stringify({ type: responseTypes.initWhiteCanvas, data: [0] });
      this.#server.broadcastWsMessage(cid, jsonMessage, false, broadcastTypes.allInLobby, playerInLobby);
    }

    if (action.tool == "fill") {
      let hasChanged = this.#lobbies[lobbyID].fill(action.x, action.y, action.color, cid);
      if (hasChanged) {
        let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
        let jsonMessage = JSON.stringify({ type: responseTypes.canvas2D, data: this.#lobbies[lobbyID].getBoardCanvas() });
        this.#server.broadcastWsMessage(cid, jsonMessage, false, broadcastTypes.allInLobby, playerInLobby);
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
    let jsonMessage = JSON.stringify({ type: responseTypes.canvas2D, data: this.#lobbies[lobbyID].getBoardCanvas() });
    this.#server.broadcastWsMessage(cid, jsonMessage, false, broadcastTypes.allInLobby, playerInLobby);
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
      type: responseTypes.chatMsg,
      data: chatMsg,
      cid: cid,
      name: name
    });
    this.#server.broadcastWsMessage(
      cid,
      jsonMessage,
      false,
      broadcastTypes.allInLobbyWithoutOneClient,
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
      type: responseTypes.chatMsgList,
      data: data,
      cid: cid,
    });
    this.#server.broadcastWsMessage(cid, jsonMessage, false, broadcastTypes.onlyOneClient);
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


    let jsonMessage = JSON.stringify({ type: responseTypes.userList, data: sendPlayerList });

    this.#server.broadcastWsMessage(cid, jsonMessage, false, broadcastTypes.allInLobby, playerInLobby);
  }

  /**
   * Set the word form the drawer
   * @param {string} cid client unique ID
   * @param {string} word choosen word
   * @param {int} lobbyID index of the lobby
   */
  #processSetWordAction(cid, word, lobbyID){
    this.#lobbies[lobbyID].setWord(word, cid);
  }
};


