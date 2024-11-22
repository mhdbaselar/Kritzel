"use strict";
//TODO: Spiel Zustandsverwaltung, Rechte, Rollen ...

const Client = require('../users/client');

const stateTypes = {
    gameStarted : 1,
    roundStarted : 2,
    drawerSelected : 3,
    wordSelected : 4,
    drawAndGuessStarted : 5,
    roundEnded : 6,
    gameEnded : 7
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
        // TODO: set DrawTimer

        this.#nextState();
    }

    #endRound(){
        // TODO: end DrawTimer, Punktevergabe

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
        if(stateTypes.gameStarted === this.#state){
            this.#startRound();
        } else if (stateTypes.roundStarted === this.#state){
            this.#selectDrawer();
        } else if (stateTypes.drawerSelected === this.#state){
            this.#selectWord();
        } else if (stateTypes.wordSelected === this.#state){
            if(this.#word){
                this.#startDrawAndGuess();
            } else {
                this.#endRound();
            }
        } else if (stateTypes.drawAndGuessStarted === this.#state){
            this.#endRound();
        } else if (stateTypes.roundEnded === this.#state){
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
