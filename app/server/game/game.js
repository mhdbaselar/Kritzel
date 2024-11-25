"use strict";
//TODO: Spiel Zustandsverwaltung, Rechte, Rollen ...

const Client = require('../users/client');
const Dictionary = require('./dictionary');
const responseTypes = require("./../../client/class/responseTypes");
const broadcastTypes = require('../broadcastTypes');

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
    #roundTimeout = 30000; // 30s
    /** @type {int} */
    #wordChoicesCount = 3;
    /** @type {string[]} */
    #wordChoicesList;
    /**@type {TinyServer} */
    #server;
    #wordSelectionTimeout;
    /**@type {{cid: string, timestamp: Date}[]} */
    #answerTimeList;
    #dictionary;
    #timeleft;

    constructor(server){
        this.#server = server;
        this.#dictionary = new Dictionary();
    }

    /**
     * Starting the game with a commited set of players
     * @param {Client[]} playerList list of players to the game
     * @param {int} totalCycle Number of times a player takes a turn as a drawer (consists of round)
     */
    startGame(playerList, totalCycle){
        console.log("Start Game");
        this.#playerList = playerList;
        this.#totalCycle = totalCycle;
        this.#currentCycle = 1;
        this.#currentRound = 0;

        this.#state = stateTypes.gameStarted;
        this.#nextState();
    }

    #startRound(){
        console.log("Start Round");
        if (this.#currentRound === this.#playerList.length){
            this.#currentCycle++;
            this.#currentRound = 1;
        } else {this.#currentRound++;}
        this.#answerTimeList = [];
        this.#word = null;
        this.#wordChoicesList = null;

        this.#state = stateTypes.roundStarted;
        this.#nextState();
    }

    #selectDrawer(){
        console.log("Select Drawer");
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
        console.log("Select Word");
        this.#wordChoicesList = this.#dictionary.getWords(this.#wordChoicesCount);

        let jsonMessageDrawer = JSON.stringify({type: responseTypes.wordChoiceList ,data: this.#wordChoicesList});
        let jsonMessageGuesser = JSON.stringify({type: responseTypes.choosingWordNotification, data: this.#drawer.getName()});

        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageDrawer, false, broadcastTypes.onlyOneClient);
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageGuesser, false, broadcastTypes.allInLobbyWithoutOneClient, this.#playerList);

        /*this.#word = this.#wordChoicesList[0]; // keywords: TESTING DELETE GAMESEQUENCE
        console.log(this.#word);*/

        this.#wordSelectionTimeout = setTimeout(() => {      // 10s to select a word;
            this.#state = stateTypes.wordSelected;
            this.#nextState();
        }, this.#wordTimeout);
    }

    // Sequence:
        // client send chat messages to sever
        // -> server: check chat Msg == answer and DrawTimer not expired and player != drawer
        // -> rigth answer save Time for player when the answer was send
        // -> send client "you have the right answer" -> other clients dont get the answer message in chat
    #startDrawAndGuess(){
        console.log("Start Draw and Guess");
        this.#timeleft = this.#roundTimeout / 1000;

        // Set a timer for the clock send every 1s the time left
        const clockInterval = setInterval(() => {
            let jsonMessage = JSON.stringify({type: responseTypes.clock, data: this.#timeleft});
            this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
            this.#timeleft -= 1;
        }, 1000);

        // Set a timer for the drawing phase
        const drawTimer = setTimeout(() => {
            clearInterval(clockInterval);
            this.#state = stateTypes.drawAndGuessStarted;
            this.#nextState();
        }, this.#roundTimeout);   
    }

    #endRound(){
        console.log("End Round");
        // TODO: calculate score with the saved Times for the player and for the drawer
        // simple current only +50 points for the right answer pls change
        this.#answerTimeList.forEach((answer) => {
            let player = this.#playerList.find((player) => player.getCid() === answer.cid);
            if(player){
                player.setPoints(player.getPoints() + 50);
                console.log(player.getName() + " has " + player.getPoints() + " points");
            }
        });

        this.#state = stateTypes.roundEnded;
        this.#nextState();
    }

    #endGame(){
        console.log("End Game");
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
        return this.#drawer && this.#drawer.getCid() === cid && this.#state === stateTypes.wordSelected;   // after wordSelected
    }

    setWord(word, cid){
        if (this.#state === this.stateTypes.drawerSelected && this.#drawer.getCid() === cid){  // after wordSelected and the drawer is the player
            this.#word = word;
            clearTimeout(this.#wordSelectionTimeout);
            let jsonMessageGuesser = JSON.stringify({type: responseTypes.endChoosingWordNotification, data: this.#drawer.getName()});
            this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageGuesser, false, broadcastTypes.allInLobbyWithoutOneClient, this.#playerList);
            this.#state = stateTypes.wordSelected;
            this.#nextState();
        }
    }

    checkAnswer(answer){
        if(this.#state === stateTypes.wordSelected &&
            answer.toLowerCase().trim() === this.#word.toLowerCase().trim()){
            return true;
        }
        return false;
    }

    addAnswer(cid, timestamp, chat){
        let isRightAnswerAdded = this.#answerTimeList.some(answer => answer.cid === cid);
        if(!isRightAnswerAdded){
            this.#answerTimeList.push({cid, timestamp});
            let player = this.#playerList.find((player) => player.getCid() === cid);
            this.#server.broadcastWsMessage(cid, JSON.stringify({
                type: responseTypes.chatMsg,
                data: `Good Job. ${player.getName()} get the right answer!`,
                cid: null,
                name: "Server"}), false, broadcastTypes.allInLobby, this.#playerList);
            chat.addMessage(null, `Good Job. ${player.getName()} get the right answer!`, timestamp);
        }
    }
}
