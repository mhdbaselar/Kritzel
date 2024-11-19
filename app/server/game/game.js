//TODO: Spiel Zustandsverwaltung, Rechte, Rollen ...

const Client = require('../users/client');

module.exports = class Game {
    #playerList = null;
    #state = null;

    constructor(){}

    /**
     * Starting the game with a commited set of players
     * @param {Client[]} playerList 
     */
    start(playerList){
        this.#playerList = playerList;
        this.#state = "just_started";
    }

    getState(){
        return this.#state;
    }

    #nextState(){
        //TODO: Change State
    }

    getActivePlayer(){
        return null;
    }
}