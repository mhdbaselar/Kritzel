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
     * Process the draw action on the board
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

    erase(x, y, thickness, cid) {
        //TODO: CHECK PERMISSION OF CID
        this.#board.erase(x, y, thickness);
    }

    fill(x, y, color, cid){
        //TODO: CHECK PERMISSION OF CID
        let hasChanged = this.#board.fill(x, y, color);
        return hasChanged;
    }

    clear(cid) {
        //TODO: CHECK PERMISSION OF CID
        this.#board.clear();
    }

    getBoardCanvas() {
        return this.#board.getBoard();
    }

    /**
     * Get Board
     * @returns {Board}
     */
    getBoard() {
        return this.#board;
    }

    addMessage(message, cid){
        //TODO: CHECK PERMISSION OF CID
        this.#chat.addMessage(cid, message);
    }

    getMessages(cid){
        //TODO: CHECK PERMISSION OF CID
        return this.#chat.getMessages();
    }
}