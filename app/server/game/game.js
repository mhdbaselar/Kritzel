"use strict";
//TODO: Spiel Zustandsverwaltung, Rechte, Rollen ...

const Client = require('../users/client');

const stateTypes = {
    gameStarted : 0,
    roundStarted : 1,
    drawerSelected : 2,
    wordSelected : 3,
    drawAndGuessStarted : 4,
    roundEnded : 5,
    gameEnded : 6
}

module.exports = class Game {
    #playerList = null;
    #state = null;
    #word = null;
    #totalCycle = null;
    #currentCycle = null;
    #currentRound = null;

    constructor(){}

    /**
     * Starting the game with a commited set of players
     * @param {Client[]} playerList
     */
    startGame(playerList, totalCycle){
        this.#playerList = playerList;
        this.#totalCycle = totalCycle;
        this.#currentCycle = 1;
        this.#currentRound = 0;
        this.#state = stateTypes.gameStarted;
        this.#nextState();
    }

    #startRound(){
        if (this.#currentRound === this.#playerList.length){
            this.#currentCycle++;
            this.#currentRound = 1;
        } else {this.#currentRound++;}

        this.#state = stateTypes.roundStarted;
        this.#nextState();
    }

    #selectDrawer(){
        this.#state = stateTypes.drawerSelected;
        this.#nextState();
    }

    #selectWord(){
        this.#state = stateTypes.wordSelected;
        this.#nextState();
    }

    #startDrawAndGuess(){
        this.#state = stateTypes.drawAndGuessStarted;
        this.#nextState();
    }

    #endRound(){
        this.#state = stateTypes.roundEnded;
        this.#nextState();
    }

    #endGame(){
        this.#state = stateTypes.gameEnded;
    }

    getState(){
        return this.#state;
    }

    #nextState(){
        if(stateTypes.gameStarted){
            this.#startRound();
        } else if (this.stateTypes.roundStarted){
            this.#selectDrawer();
        } else if (this.stateTypes.drawerSelected){
            this.#selectWord();
        } else if (this.stateTypes.wordSelected){
            if(this.#word){
                this.#startDrawAndGuess();
            } else {
                this.#endRound();
            }
        } else if (this.stateTypes.drawAndGuessStarted){
            this.#endRound();
        } else if (this.stateTypes.roundEnded){
            if(this.#currentRound === this.#playerList.length && this.#totalCycle === this.#currentCycle){
                this.#endGame();
            } else {
                this.#startRound();
            }
        }
    }

    getActivePlayer(){
        return null;
    }
}
