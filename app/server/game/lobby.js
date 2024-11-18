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
}