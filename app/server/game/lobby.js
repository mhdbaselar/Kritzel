"use strict";

const Client = require('../users/client');
const Board = require('./board');
const Chat = require('./chat');

module.exports = class Lobby {
    /**@type {Client[]} */
    #playerList = null;
    /**@type {Board} */
    #board = null;
    /**@type {Chat} */
    #chat = null;

    /**
     * Constructor to instanciate the lobby
     */
    constructor(){
        this.#playerList = [];
        this.#board = new Board(600, 400, 0);
        this.#chat = new Chat();
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
        this.#board.draw(x,y,color,thickness);
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
        this.#board.erase(x, y, thickness);
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
        let hasChanged = this.#board.fill(x, y, color);
        return hasChanged;
    }

    /**
     * Process the clear action on the lobby board
     * @param {string} cid 
     */
    clear(cid) {
        //TODO: CHECK PERMISSION OF CID
        this.#board.clear();
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
     */
    addMessage(message, cid){
        //TODO: CHECK PERMISSION OF CID
        this.#chat.addMessage(cid, message);
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
}