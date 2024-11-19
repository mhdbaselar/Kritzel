"use strict";

const Client = require('../users/client');
const Board = require('./board');
const Chat = require('./chat');

module.exports = class Lobby {
    #playerList = null;
    #board = null;
    #chat = null;

    constructor(){
        this.#playerList = [];
        this.#board = new Board(600, 400, 0);
        this.#chat = new Chat();
    }

    addPlayer(player){
        if (player instanceof Client){
            this.#playerList.push(player);
        }
    }

    /**
     * Get Player List
     * @returns {Client[]}  list of players
     */
    getPlayerList(){
        return this.#playerList;
    }

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