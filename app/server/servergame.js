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
    let lobby = new Lobby(this.#server, false, "1234", "Test-Lobby", 1, 60, 20);
    this.#lobbies.push(lobby);

    this.intervalReference = setInterval(this.tick.bind(this), 100);
    this.keepConnectionInterval = setInterval(() => {
      let jsonMessage = JSON.stringify({
        type: responseTypes.ping,
        data: null
      });

      this.#server.broadcastWsMessage(
        null,
        jsonMessage,
        false,
        broadcastTypes.all
      );
    }, 5000);
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
  getLobbies() {
    return this.#lobbies;
  }

  /**
   * Get and process a client message
   * @param {string} cid user unique ID
   * @param {Message} request client request
   */
  processInput(cid, request) {
    let lobbyID = null;
    let client = null;

    // set Lobby of request sender
    this.#server
      .getClients()
      .getClientList()
      .forEach((clientObject) => {
        if (clientObject.getCid() == cid) {
          lobbyID = clientObject.getLobbyID();
          client = clientObject;
        }
      });

    let _request = JSON.parse(request);

    if (lobbyID !== null && client !== null) {
      if (_request.messageType == requestTypes.draw) {
        this.#processDrawAction(_request.messageBody, cid, lobbyID);
      } else if (_request.messageType == requestTypes.getCanvas) {
        this.#processGetCanvasAction(cid, lobbyID);
      } else if (_request.messageType == requestTypes.addChatMsg) {
        this.#processChatAction(
          _request.messageBody.message,
          cid,
          _request.messageBody.timestamp,
          lobbyID
        );
      } else if (_request.messageType == requestTypes.getAllChatMsg) {
        this.#processGetChatAction(cid, lobbyID);
      } else if (_request.messageType == requestTypes.getUserList) {
        this.#processGetUserListAction(cid, lobbyID);
      } else if (_request.messageType == requestTypes.setWord) {
        this.#processSetWordAction(cid, _request.messageBody, lobbyID);
      } else if (_request.messageType == requestTypes.startGame) {
        this.#lobbies[lobbyID].startGame();
      } else if (_request.messageType == requestTypes.getReconnectData) {
        this.#processGetReconnectData(cid, lobbyID);
      }
    }

    if (client !== null) {
      if (_request.messageType == requestTypes.joinLobby) {
        this.#processJoinLobbyAction(
          client,
          _request.messageBody.lobbyID,
          _request.messageBody.code
        );
      } else if (_request.messageType == requestTypes.createLobby) {
        this.#processCreateLobbyAction(
          client,
          _request.messageBody.isPublic,
          _request.messageBody.code,
          _request.messageBody.lobbyName,
          _request.messageBody.roundCount,
          _request.messageBody.roundTimer,
          _request.messageBody.playerCount
        );
      } else if (_request.messageType == requestTypes.leaveLobby) {
        this.#processLeaveLobbyAction(client);
      } else if (_request.messageType == requestTypes.getLobbyList) {
        this.#processGetLobbyListAction(cid);
      } else if (_request.messageType == requestTypes.joinRandomLobby){
        this.#processJoinRandomLobbyAction(client);
      } else if (_request.messageType == requestTypes.setName){
        this.#processSetUserName(client, _request.messageBody.name);
      }
    }
  }

  /**
   * Process a server request
   * @param {Message} request server request
   */
  processServerRequest(request) {
    if (request.messageType === "deletePlayerInLobby") {
      let lobbyID = request.messageBody.client.getLobbyID();

      if (lobbyID !== null) {
        this.#lobbies[lobbyID].deletePlayer(
          request.messageBody.client.getCid()
        );
        this.#processGetUserListAction(
          request.messageBody.client.getCid(),
          lobbyID
        );

        // if lobby is empty, start delete lobby timer
        if(this.#lobbies[lobbyID].getCurrentPlayerCount() === 0){
          this.#lobbies[lobbyID].setDeleteLobbyFunction(() => {
            this.#processDeleteLobbyAction(lobbyID);
          });
          this.#lobbies[lobbyID].startDeleteLobbyTimer();
        }
      }
    } else if (
      request.messageType === "addPlayerInLobby" &&
      request.messageBody.client instanceof Client
    ) {
      let lobbyID = request.messageBody.client.getLobbyID();

      if (lobbyID !== null) {
        this.#lobbies[lobbyID].stopDeleteLobbyTimer();      // stop delete lobby timer after lobby is not empty
        this.#lobbies[lobbyID].addPlayer(request.messageBody.client);
        this.#processSendJoinLobbyData(
          request.messageBody.client.getCid(),
          lobbyID
        );
      }
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
      this.#lobbies[lobbyID].draw(
        action.x,
        action.y,
        action.color,
        action.thickness,
        cid
      );
    }

    if (action.tool == "eraser") {
      this.#lobbies[lobbyID].erase(action.x, action.y, action.thickness, cid);
    }

    if (action.tool == "clear") {
      let hasChanged = this.#lobbies[lobbyID].clear(cid);
      if (hasChanged) {
        let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
        let jsonMessage = JSON.stringify({
          type: responseTypes.initWhiteCanvas,
          data: [0],
        });
        this.#server.broadcastWsMessage(
          cid,
          jsonMessage,
          false,
          broadcastTypes.allInLobby,
          playerInLobby
        );
      }
    }

    if (action.tool == "fill") {
      let hasChanged = this.#lobbies[lobbyID].fill(
        action.x,
        action.y,
        action.color,
        cid
      );
      if (hasChanged) {
        let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
        let jsonMessage = JSON.stringify({
          type: responseTypes.canvas2D,
          data: this.#lobbies[lobbyID].getBoardCanvas(),
        });
        this.#server.broadcastWsMessage(
          cid,
          jsonMessage,
          false,
          broadcastTypes.allInLobby,
          playerInLobby
        );
      }
    }

    /*if (action.tool == "fillBackground") {
      this.#board.fillBackground(action.color);
      this.#isSendPointList = false;
    }*/
  }

  /**
   * Sends the current lobby canvas to the client
   * @param {string} cid user unique ID
   * @param {int} lobbyID index of the lobby
   */
  #processGetCanvasAction(cid, lobbyID) {
    let jsonMessage = JSON.stringify({
      type: responseTypes.canvas2D,
      data: this.#lobbies[lobbyID].getBoardCanvas(),
    });
    this.#server.broadcastWsMessage(
      cid,
      jsonMessage,
      false,
      broadcastTypes.onlyOneClient
    );
  }

  /**
   * Processes the chat action (send a message to all clients in the lobby)
   * @param {string} chatMsg chat message
   * @param {string} cid user unique ID
   * @param {Date} timestamp timestamp
   * @param {int} lobbyID index of the lobby
   */
  #processChatAction(chatMsg, cid, timestamp, lobbyID) {
    timestamp = new Date(); // override with server timestamp
    let hasMessageAdded = this.#lobbies[lobbyID].addMessage(
      chatMsg,
      cid,
      timestamp
    );

    if (hasMessageAdded) {
      let name = this.#server.getClients().getNameByCid(cid);

      let playerInLobby = this.#lobbies[lobbyID].getPlayerList();
      let jsonMessage = JSON.stringify({
        type: responseTypes.chatMsg,
        data: chatMsg,
        name: name,
      });
      this.#server.broadcastWsMessage(
        cid,
        jsonMessage,
        false,
        broadcastTypes.allInLobbyWithoutOneClient,
        playerInLobby
      );
    }
  }

  /**
   * Sends all chat messages to the request client
   * @param {string} cid user unique ID
   * @param {int} lobbyID index of the lobby
   */
  #processGetChatAction(cid, lobbyID) {
    let messages = this.#lobbies[lobbyID].getMessages(cid);
    let data = [];
    messages.forEach((message) => {
      let name = "";
      if (message.cid === cid) {
        name = "You";
      } else if (message.cid === null) {
        name = "Server";
      } else {
        name = this.#server.getClients().getNameByCid(message.cid);
      }
      data.push({ msg: message.msg, name: name });
    });

    let jsonMessage = JSON.stringify({
      type: responseTypes.chatMsgList,
      data: data,
    });
    this.#server.broadcastWsMessage(
      cid,
      jsonMessage,
      false,
      broadcastTypes.onlyOneClient
    );
  }

  /**
   * Sends a playerList of the lobby to all clients in the lobby
   * @param {string} cid client unique ID
   * @param {int} lobbyID index of the lobby
   */
  #processGetUserListAction(cid, lobbyID) {
    this.#lobbies[lobbyID].sendUserList();
  }

  /**
   * Set the word form the drawer
   * @param {string} cid client unique ID
   * @param {string} word choosen word
   * @param {int} lobbyID index of the lobby
   */
  #processSetWordAction(cid, word, lobbyID) {
    this.#lobbies[lobbyID].setWord(word, cid);
  }

  /**
   * Sends the reconnect data (game) to the client
   * @param {string} cid client unique ID
   * @param {int} lobbyID id of the lobby
   */
  #processGetReconnectData(cid, lobbyID) {
    this.#lobbies[lobbyID].sendReconnectData(cid);
  }

  /**
   * Create a lobby and join the client to the lobby
   * @param {Client} client client object
   * @param {boolean} isPublic true if lobby is public else false private
   * @param {string?} code lobby code
   */
  #processCreateLobbyAction(client, isPublic, code, lobbyName, roundCount, roundTimer, playerCount) {
    if((isPublic === false && code === "") || lobbyName === ""){
      let jsonMessage = JSON.stringify({
        type: responseTypes.lobbyCreateMenu,
        data: null,
      });
      this.#server.broadcastWsMessage(
        client.getCid(),
        jsonMessage,
        false,
        broadcastTypes.onlyOneClient
      );
      return;
    }

    playerCount = Math.ceil(playerCount);
    if(playerCount < 2){
      let jsonMessage = JSON.stringify({
        type: responseTypes.lobbyCreateMenu,
        data: null,
      });
      this.#server.broadcastWsMessage(
        client.getCid(),
        jsonMessage,
        false,
        broadcastTypes.onlyOneClient
      );
    } else {
      let isNullFound = false;
      let lobbyID = null;
      for (let i = 0; i < this.#lobbies.length; i++) {
        if (this.#lobbies[i] === null) {
          this.#lobbies[i] = new Lobby(this.#server, isPublic, code, lobbyName, roundCount, roundTimer, playerCount);
          isNullFound = true;
          lobbyID = i;
          break;
        }
      }
      if (!isNullFound) {
        this.#lobbies.push(new Lobby(this.#server, isPublic, code, lobbyName, roundCount, roundTimer, playerCount));
        lobbyID = this.#lobbies.length - 1;
      }

      this.#processJoinLobbyAction(client, lobbyID, code);
    }
  }

  /**
   * Join the client to the lobby
   * @param {Client} client client object
   * @param {int} lobbyID id of the lobby
   * @param {string?} code lobby code
   */
  #processJoinLobbyAction(client, lobbyID, code) {
    if (this.#lobbies[lobbyID] !== null 
      && this.#lobbies[lobbyID].getCurrentPlayerCount() < this.#lobbies[lobbyID].getMaxPlayers()
      && (this.#lobbies[lobbyID].getIsPublic() ||
      code == this.#lobbies[lobbyID].getCode())
    ) {
      if (client.getLobbyID() !== lobbyID) {
        this.processServerRequest({
          messageType: "deletePlayerInLobby",
          messageBody: { client: client },
        });
        client.setLobbyID(lobbyID);
      }
      this.processServerRequest({
        messageType: "addPlayerInLobby",
        messageBody: { client: client },
      });
      let cid = client.getCid();
      this.#processSendJoinLobbyData(cid, lobbyID);
    }
    else {      // Code incorrect send Client
      let jsonMessage = JSON.stringify({
        type: responseTypes.lobbyJoinMenu,
        data: null,
      });
      this.#server.broadcastWsMessage(
        client.getCid(),
        jsonMessage,
        false,
        broadcastTypes.onlyOneClient
      );
    }
  }

  #processJoinRandomLobbyAction(client){
    let publicLobbies = [];
    for(let i = 0; i < this.#lobbies.length; i++){
      if(this.#lobbies[i] !== null && this.#lobbies[i].getIsPublic() && this.#lobbies[i].getCurrentPlayerCount() < this.#lobbies[i].getMaxPlayers()){
        publicLobbies.push(i);
      }
    }

    if(publicLobbies.length > 0){
      let randomLobbyID = publicLobbies[Math.floor(Math.random() * publicLobbies.length)];
      if(this.#lobbies[randomLobbyID] !== null && this.#lobbies[randomLobbyID].getCurrentPlayerCount() < this.#lobbies[randomLobbyID].getMaxPlayers()){
        this.#processJoinLobbyAction(client, randomLobbyID, null);
      } else {  // Error handling: lobby meanwhile full
        this.#processCreateLobbyAction(client, true, null, this.#getUniqueLobbyName(), 1, 60, 10);
      }
    } else {
      this.#processCreateLobbyAction(client, true, null, this.#getUniqueLobbyName(), 1, 60, 10);  // create default Lobby
    }
  }

  #getUniqueLobbyName() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4();
  }

  /**
   * Leave the lobby (client) and show the menu
   * @param {Client} client client object
   */
  #processLeaveLobbyAction(client) {
    this.processServerRequest({
      messageType: "deletePlayerInLobby",
      messageBody: { client: client },
    });
    client.setLobbyID(null);
    this.#processGetMenuAction(client.getCid(), broadcastTypes.onlyOneClient);
  }

  /**
   * Send the lobby list to the client
   * @param {string} cid client unique ID
   */
  #processGetLobbyListAction(cid) {
    let lobbyList = [];

    for (let i = 0; i < this.#lobbies.length; i++) {
      if(this.#lobbies[i] !== null){
        lobbyList.push({ lobbyID: i, isPublic: this.#lobbies[i].getIsPublic(), lobbyName: this.#lobbies[i].getLobbyName(),
          currentPlayers: this.#lobbies[i].getCurrentPlayerCount(), maxPlayers: this.#lobbies[i].getMaxPlayers()
        });
      }
    }

    let jsonMessage = JSON.stringify({
      type: responseTypes.lobbyList,
      data: lobbyList,
    });
    this.#server.broadcastWsMessage(
      cid,
      jsonMessage,
      false,
      broadcastTypes.onlyOneClient
    );
  }

  /**
   * Delete the lobby and send the menu to all clients in the lobby
   * @param {string} cid client unique ID
   * @param {int} lobbyID id of the lobby
   */
  #processDeleteLobbyAction(lobbyID) {
    //if (this.#lobbies[lobbyID].checkGameEnd()) {
      let playerList = this.#lobbies[lobbyID].getPlayerList();

      playerList.forEach((player) => {
        player.setLobbyID(null);
      });

      //this.#processGetMenuAction(null, broadcastTypes.allInLobby);

      this.#lobbies[lobbyID] = null;
    //}
  }

  /**
   * Sends the menu notification to the client
   * @param {string} cid client unique ID
   * @param {string} broadcastType broadcast type
   */
  #processGetMenuAction(cid, broadcastType) {
    let jsonMessage = JSON.stringify({ type: responseTypes.menu, data: null });
    this.#server.broadcastWsMessage(cid, jsonMessage, false, broadcastType);
  }

  /**
   * Sends the chat, canvas, userlist and reconnect data to the join client
   * @param {string} cid client unique ID
   * @param {int} lobbyID  id of the lobby
   */
  #processSendJoinLobbyData(cid, lobbyID) {
    this.#processGetChatAction(cid, lobbyID);
    this.#processGetCanvasAction(cid, lobbyID);
    this.#processGetUserListAction(cid, lobbyID);
    this.#processGetReconnectData(cid, lobbyID);
  }

  #processSetUserName(client, name){
    if(name && name.length <= 20){
      client.setName(name);
    } else {
      let jsonMessage = JSON.stringify({
              type: responseTypes.nameCheck,
              data: false
            });
            this.#server.broadcastWsMessage(
              client.getCid(),
              jsonMessage,
              false,
              broadcastTypes.onlyOneClient,
              null
            );
    }
  }
};
