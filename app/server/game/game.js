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
    #playerQueue = null;
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
    #nextRoundTimeout = 5000; // 5s
    /** @type {int} */
    #timeleft;
    /** @type {int} */
    #wordChoicesCount = 3;
    /** @type {string[]} */
    #wordChoicesList;
    /**@type {TinyServer} */
    #server;
    /**@type {{cid: string, timestamp: Date}[]} */
    #answerTimeList;
    /** @type {Dictionary} */
    #dictionary;
    #wordSelectionTimer;
    /** @type {Board} */
    #board;

    /**
     * @param {TinyServer} server 
     * @param {Board} board
     */
    constructor(server, board){
        this.#server = server;
        this.#board = board;
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
        this.#playerQueue = [...this.#playerList];      // copy current playerList to queue

        this.#state = stateTypes.gameStarted;
        this.#nextState();
    }

    #startRound(){
        console.log("Start Round");
        if (this.#playerQueue.length === 0) {
            this.#playerQueue = [...this.#playerList];      // copy current playerList to queue
            this.#currentCycle++;
            this.#currentRound = 1;
        } else {this.#currentRound++;}
        this.#answerTimeList = [];
        this.#word = null;
        this.#wordChoicesList = null;

        // wait before next round start
        this.#timeleft = this.#nextRoundTimeout / 1000;

        let nextRoundTimer = setInterval(() => {
            let jsonMessage = JSON.stringify({type: responseTypes.clock, data: {time: this.#timeleft, timetype: "Nächste Runde in "}});
            this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
            if(this.#timeleft <= 0){
                clearInterval(nextRoundTimer);
                this.#state = stateTypes.roundStarted;
                this.#nextState();
            }
            this.#timeleft -= 1;
        }   
        , 1000); 
    }

    #selectDrawer(){
        console.log("Select Drawer");

        let isNextPlayerInLobby = this.#playerList.some((player) => player === this.#playerQueue[0]);
        if(!isNextPlayerInLobby){
            this.#playerQueue.shift();      // Next player
            this.#state = stateTypes.roundEnded;
            this.#nextState();
        }
        else {      // Select drawer
            this.#drawer = this.#playerQueue[0];
            this.#playerQueue.shift();              // remove first player in queue
            this.#state = stateTypes.drawerSelected;
            this.#nextState();
        }        
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

        this.#sendWordChoicesList();
        this.#sendWordChoicesNotification(broadcastTypes.allInLobbyWithoutOneClient);

        this.#timeleft = this.#wordTimeout / 1000;

        this.#wordSelectionTimer = setInterval(() => {      // 10s to select a word;
            let jsonMessage = JSON.stringify({type: responseTypes.clock, data: {time: this.#timeleft, timetype: "Wortauswahl verbleibend: "}});
            this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
            if(this.#timeleft <= 0){
                clearInterval(this.#wordSelectionTimer);
                this.#state = stateTypes.wordSelected;
                this.#nextState();
            }
            this.#timeleft -= 1;
        }, 1000);
    }

    // Sequence:
        // client send chat messages to sever
        // -> server: check chat Msg == answer and DrawTimer not expired and player != drawer
        // -> rigth answer save Time for player when the answer was send
        // -> send client "you have the right answer" -> other clients dont get the answer message in chat
    #startDrawAndGuess(){
        console.log("Start Draw and Guess");

        this.#sendWord();
        this.#sendHangManWord();

        this.#timeleft = this.#roundTimeout / 1000;
        // Set a timer for the drawer phase
        const drawTimer = setInterval(() => {
            let jsonMessage = JSON.stringify({type: responseTypes.clock, data: {time: this.#timeleft, timetype: "Zeichnen verbleibend: "}});
            this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);

            let allAnswered = this.#playerList.every((player) => player === this.#drawer || 
                                                    this.#answerTimeList.some((answer) => answer.cid === player.getCid()));
            if(this.#timeleft <= 0 || allAnswered){
                clearInterval(drawTimer);
                this.#state = stateTypes.drawAndGuessStarted;
                this.#nextState();
            }  
            this.#timeleft -= 1;
        }, 1000);
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

        let sendPlayerList = [];
        this.#playerList.forEach(player => {
            sendPlayerList.push({ name: player.getName(), points: player.getPoints() });
          });
        
        // update playerList
        let jsonMessage = JSON.stringify({ type: responseTypes.userList, data: sendPlayerList });
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
        
        // Reset Display Timer
        jsonMessage = JSON.stringify({type: responseTypes.clock, data: {time: "", timetype: ""}});
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);

        // Reset Display Word
        jsonMessage = JSON.stringify({type: responseTypes.word, data: ""});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);

        // show answer word all player
        jsonMessage = JSON.stringify({type: responseTypes.word, data: this.#word});
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);

        this.#state = stateTypes.roundEnded;
        this.#nextState();   
    }

    #endGame(){
        console.log("End Game");

        // Reset Display Word
        let jsonMessage = JSON.stringify({type: responseTypes.word, data: ""});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);

        // show by timer game end
        jsonMessage = JSON.stringify({type: responseTypes.clock, data: {time: "", timetype: "beendet"}});
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);

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
            if(this.#playerQueue.length === 0 && this.#totalCycle === this.#currentCycle){
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

    setWord(word, cid) {
        if (this.#state === stateTypes.drawerSelected && this.#drawer.getCid() === cid) {
            this.#word = word;
            this.#dictionary.removeWord(this.#word);
            clearInterval(this.#wordSelectionTimer);

            // Board leeren
            this.#board.clear();

            let jsonMessageClear = JSON.stringify({
                type: responseTypes.initWhiteCanvas, 
                data: [0]
            });

            // Clear Board Nachricht
            this.#server.broadcastWsMessage(
                null,
                jsonMessageClear, 
                false, 
                broadcastTypes.allInLobby,
                this.#playerList
            );

            let jsonMessageGuesser = JSON.stringify({
                type: responseTypes.endChoosingWordNotification, 
                data: this.#drawer.getName()
            });
            this.#server.broadcastWsMessage(
                this.#drawer.getCid(), 
                jsonMessageGuesser, 
                false, 
                broadcastTypes.allInLobbyWithoutOneClient, 
                this.#playerList
            );
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
            let answerMsg = `${player.getName()} hat das gesuchte Wort erraten.`
            this.#server.broadcastWsMessage(cid, JSON.stringify({
                type: responseTypes.chatMsg,
                data: answerMsg,
                cid: null,
                name: "Server"}), false, broadcastTypes.allInLobby, this.#playerList);
            chat.addMessage(null, answerMsg, timestamp);
        }
    }

    sendReconnectData(cid){
        if(this.#state == stateTypes.drawerSelected){
            if(this.#drawer && this.#drawer.getCid() === cid){
                this.#sendWordChoicesList();
            } else if(this.#drawer && this.#drawer.getCid() !== cid){
                this.#sendWordChoicesNotification(broadcastTypes.onlyOneClient);
            }
        } else if (this.#state == stateTypes.wordSelected){
            if(this.#drawer && this.#drawer.getCid() === cid){
                this.#sendWord();
            } else if (this.#drawer && this.#drawer.getCid() !== cid){
                this.#sendHangManWord();
            }
        }
    }

    //-------------------------------------
    //------------HELP FUNCTIONS-----------
    //-------------------------------------

    #sendWordChoicesList(){
        let jsonMessageDrawer = JSON.stringify({type: responseTypes.wordChoiceList ,data: this.#wordChoicesList});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageDrawer, false, broadcastTypes.onlyOneClient);
    }

    #sendWordChoicesNotification(broadcastType){
        let jsonMessageGuesser = JSON.stringify({type: responseTypes.choosingWordNotification, data: this.#drawer.getName()});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageGuesser, false, broadcastType, this.#playerList);
    }

    #sendWord(){
        // Set Hang Man Word Drawer
        let jsonMessage = JSON.stringify({type: responseTypes.word, data: this.#word});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessage, false, broadcastTypes.onlyOneClient, this.#playerList);
    }

    #sendHangManWord(){
        // Create Hang Man Word Guesser
        let hangManWord = "";
        for(let i = 0; i < this.#word.length; i++){
            hangManWord += "_";
        }

        // Set Hang Man Word Guesser
        let jsonMessage = JSON.stringify({type: responseTypes.word, data: hangManWord});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessage, false, broadcastTypes.allInLobbyWithoutOneClient, this.#playerList);
    }
}
