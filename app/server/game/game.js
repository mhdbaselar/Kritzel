"use strict";
//TODO: Spiel Zustandsverwaltung, Rechte, Rollen ...

const Client = require('../users/client');
const Dictionary = require('./dictionary');

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
    /** @type {Client[]} */
    #playerList = null;
    /** @type {int} */
    #state = null;
    /** @type {string} */
    #word = null;
    /** @type {int} */
    #totalCycle = null;
    /** @type {int} */
    #currentCycle = null;
    /** @type {int} */
    #currentRound = null;
    /** @type {Client} */
    #drawer = null;
    /** @type {int} */
    #wordTimeout = 10000; // 10s
    /** @type {int} */
    #wordChoicesCount = 3;
    /** @type {string[]} */
    #wordChoicesList;
    /**@type {TinyServer} */
    #server;
    #wordSelectionTimeout;

    constructor(server){
        this.#server = server;
    }

    /**
     * Starting the game with a commited set of players
     * @param {Client[]} playerList list of players to the game
     * @param {int} totalCycle Number of times a player takes a turn as a drawer (consists of round)
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
        this.#word = null;
        this.#wordChoicesList = null;

        this.#state = stateTypes.roundStarted;
        this.#nextState();
    }

    #selectDrawer(){
        this.#drawer = this.#playerList[this.#currentRound-1];

        this.#state = stateTypes.drawerSelected;
        this.#nextState();
    }

    //Sequence:
        // -> send word choices to player
        // -> client choose word
        // -> client send choosen word to server
        // -> server check word is set and clear Timeout?
        // -> server send to client (frontend) remove word choice display
    #selectWord(){
        for(let i = 0; i < wordCount; i++){
            this.#wordChoicesList.push(Dictionary.getRandomWord());
        }

        let jsonMessageDrawer = JSON.stringify({type: "wordChoicesList" ,data: this.#wordChoicesList});
        let jsonMessageGuesser = JSON.stringify({type: "choosingWordNotification", data: this.#drawer.getName()});

        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageDrawer, false, "onlySender");
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageGuesser, false, "allInLobbyWithoutSender");

        this.#wordSelectionTimeout = setTimeout(() => {      // 10s to select a word;
            this.#state = stateTypes.wordSelected;
            this.#nextState();
        }, this.#wordTimeout);
    }

    #startDrawAndGuess(){
        // TODO: set DrawTimer, and end DrawTimer
        // Sequence:
        // client send chat messages to sever
        // -> server: check chat Msg == answer and DrawTimer not expired and player != drawer
        // -> rigth answer save Time for player when the answer was send
        // -> send client "you have the right answer" -> other clients dont get the answer message in chat

        this.#state = stateTypes.drawAndGuessStarted;
        this.#nextState();
    }

    #endRound(){
        // TODO: calculate score with the saved Times for the player and for the drawer

        this.#state = stateTypes.roundEnded;
        this.#nextState();
    }

    #endGame(){
        // TODO: delete Game Object or maybe with a Button start a new Game

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

    getDrawer(){
        return this.#drawer;
    }

    hasPermissionToDraw(cid){
        return this.#drawer.getCid() === cid && this.#state === this.stateTypes.wordSelected;   // after wordSelected
    }

    setWord(word, cid){
        if (this.#state === this.stateTypes.drawerSelected && this.#drawer.getCid() === cid){  // after wordSelected and the drawer is the player
            this.#word = word;
            clearTimeout(this.#wordSelectionTimeout);
            let jsonMessageGuesser = JSON.stringify({type: "endChoosingWordNotification", data: this.#drawer.getName()});
            this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageGuesser, false, "allInLobbyWithoutSender");
        }
    }
}
