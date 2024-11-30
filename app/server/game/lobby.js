"use strict";

const Client = require('../users/client');
const Board = require('./board');
const Chat = require('./chat');
const Game = require('./game');

module.exports = class Lobby {
    /**@type {Client[]} */
    #playerList = null;
    /**@type {Board} */
    #board = null;
    /**@type {Chat} */
    #chat = null;
    /**@type {Game} */
    #game = null;
    /**@type {TinyServer} */
    #server;

    /**
     * Constructor to instanciate the lobby
     * @param {TinyServer} server websocketserver
     */
    constructor(server){
        this.#server = server;
        this.#playerList = [];
        this.#board = new Board(600, 400, 0);
        this.#chat = new Chat();
        this.#game = new Game(this.#server, this.#board);
    }

    /**
     * Start the game in the lobby (async operation)
     */
    startGame(){
        setTimeout(() => {this.#game.startGame(this.#playerList, 1)}, 0);  // async operation (not wait) execute a lobby game parallel
    }

    /**
     * Add player to playerList (lobby)
     * @param {Client} player player to add (client object)
     */
    addPlayer(player){
        if (player instanceof Client){
            this.#playerList.push(player);
        }
    }

    /**
     * Delete player from playerList (lobby)
     * @param {*} cid client unique ID
     */
    deletePlayer(cid){
        for(let i = 0; i < this.#playerList.length; i++){
            if(this.#playerList[i].getCid() === cid){
                this.#playerList.splice(i, 1);
                return;
            }
        } 
    }

    /**
     * Get playerList to lobby
     * @returns {Client[]} list of players
     */
    getPlayerList(){
        return this.#playerList;
    }

    /**
     * Process the draw action on the lobby board
     * @param {int} x coordinate
     * @param {int} y coordinate
     * @param {int} color int color code
     * @param {int} thickness thickness
     * @param {string} cid clinet unique ID
     */
    draw(x, y, color, thickness, cid) {
        //TODO: CHECK PERMISSION OF CID
        if(this.#game.hasPermissionToDraw(cid)){
            this.#board.draw(x,y,color,thickness);
        }
    }

    /**
     * Process the erase action on the lobby board
     * @param {int} x coordinate
     * @param {int} y coordinate
     * @param {int} thickness thickness
     * @param {string} cid clinet unique ID
     */
    erase(x, y, thickness, cid) {
        //TODO: CHECK PERMISSION OF CID
        if(this.#game.hasPermissionToDraw(cid)){
            this.#board.erase(x, y, thickness);
        }
    }

    /**
     * Process the fill action on the lobby board
     * @param {int} x coordinate
     * @param {int} y coordinate
     * @param {int} color int color code
     * @param {string} cid clinet unique ID
     */
    fill(x, y, color, cid){
        //TODO: CHECK PERMISSION OF CID
        if(this.#game.hasPermissionToDraw(cid)){
            let hasChanged = this.#board.fill(x, y, color);
            return hasChanged;
        }
        return false;
    }

    /**
     * Process the clear action on the lobby board
     * @param {string} cid
     */
    clear(cid) {
        //TODO: CHECK PERMISSION OF CID
        if(this.#game.hasPermissionToDraw(cid)){
            this.#board.clear();
            return true;
        }
        return false;
    }

    /**
     * Get from the lobby board the canvas (2D-Array)
     * @returns {int[][]} board canvas (2D-Array)
     */
    getBoardCanvas() {
        return this.#board.getBoard();
    }

    /**
     * Get lobby Board
     * @returns {Board} Board object
     */
    getBoard() {
        return this.#board;
    }

    /**
     * Add message to lobby chat
     * @param {string} message message to add
     * @param {string} cid client unique ID
     * @param {Date} timestamp timestamp of message
     */
    addMessage(message, cid, timestamp){
        //TODO: CHECK PERMISSION OF CID
        if(this.#game.checkAnswer(message)){
            if(this.#game.getDrawer().getCid() !== cid){
                this.#game.addAnswer(cid, timestamp, this.#chat);
            }
        } else {
            this.#chat.addMessage(cid, message, timestamp);
            return true;
        }
        return false;
    }

    /**
     * Get messages from lobby chat
     * @param {string} cid client unique ID
     * @returns {{uid: uid, msg: string}[]} list of messages
     */
    getMessages(cid){
        //TODO: CHECK PERMISSION OF CID
        return this.#chat.getMessages();
    }

    sendUserList(){
        this.#game.sendUserList(this.#playerList);
    }

    /**
     * Set the word for the game
     * @param {string} word word to set
     * @param {string} cid client unique ID
     */
    setWord(word, cid){
        this.#game.setWord(word, cid);
    }

    /**
     * Send all necessary data by reconnect the client
     * @param {string} cid client unique ID
     */
    sendReconnectData(cid){
        this.#game.sendReconnectData(cid);
    }
}
