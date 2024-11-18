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
        this.#board.fill(x, y, color);
    }

    clear(cid) {
        //TODO: CHECK PERMISSION OF CID
        this.#board.clear();
    }

    getBoard() {
        return this.#board.getBoard();
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