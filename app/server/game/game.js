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
    drawAndGuessEnded : 5,
    roundEnded : 6,
    gameEnded : 7
}

module.exports = class Game {
    /** @type {Client[]} */
    #playerList = null;
    /** @type {Client[]} */
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
    /**@type {Interval} */
    #wordSelectionTimer;
    /** @type {Board} */
    #board;
    #wordCheckAccuracyRate = 0.75;  // 75%

    /**  
     * Constructor to instanciate the game
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

    /**
     * Start a round and initialize the round
     */
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
            this.#sendTimer("Nächste Runde in ", this.#timeleft);
            if(this.#timeleft <= 0){
                clearInterval(nextRoundTimer);
                this.#state = stateTypes.roundStarted;
                this.#nextState();
            }
            this.#timeleft -= 1;
        }   
        , 1000); 
    }

    /**
     * Select the drawer for the round
     */
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
            this.sendUserList(this.#playerList);
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
    /**
     * Select a word for the drawer
     */
    #selectWord(){
        console.log("Select Word");
        this.#wordChoicesList = this.#dictionary.getWords(this.#wordChoicesCount);

        this.#sendWordChoicesList();
        this.#sendWordChoicesNotification(broadcastTypes.allInLobbyWithoutOneClient);

        this.#timeleft = this.#wordTimeout / 1000;

        this.#wordSelectionTimer = setInterval(() => {      // 10s to select a word;
            this.#sendTimer("Wortauswahl verbleibend: ", this.#timeleft);
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
    /**
     * Start the Draw and Guess phase
     */
    #startDrawAndGuess(){
        console.log("Start Draw and Guess");

        this.#sendWord(this.#word, broadcastTypes.onlyOneClient, this.#drawer.getCid());
        this.#sendHangManWord();

        this.#timeleft = this.#roundTimeout / 1000;
        // Set a timer for the drawer phase
        const drawTimer = setInterval(() => {
            this.#sendTimer("Zeichnen verbleibend: ", this.#timeleft);

            let allAnswered = this.#playerList.every((player) => player === this.#drawer || 
                                                    this.#answerTimeList.some((answer) => answer.cid === player.getCid()));
            if(this.#timeleft <= 0 || allAnswered){
                clearInterval(drawTimer);
                this.#state = stateTypes.drawAndGuessEnded;
                this.#nextState();
            }  
            this.#timeleft -= 1;
        }, 1000);
    }

    /**
     * End the round, calculate the score, disable overlays and show the word
     */
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
        
        // disable draw permission of current drawer
        this.#sendDrawPermission(false);

        // update playerList
        this.sendUserList(this.#playerList);
        
        // Reset Display Timer
        this.#sendTimer("","");

        // show answer word all player
        this.#sendWord(this.#word, broadcastTypes.allInLobby);

        this.#state = stateTypes.roundEnded;
        this.#nextState();   
    }

    /**
     * End the game, reset the game and TODO: show the final score
     */
    #endGame(){
        console.log("End Game");

        // Reset Display Word
        this.#sendWord("", broadcastTypes.allInLobby);

        // show game end in timer overlay
        this.#sendTimer("beendet","");

        // Reset Drawer Icon UserList
        this.#drawer = null;
        this.sendUserList(this.#playerList);

        this.#state = stateTypes.gameEnded;
    }

    /**
     * Get the current state of the game
     * @returns {int} current state of the game
     */
    getState(){
        return this.#state;
    }

    /**
     * Execute the next state of the game
     */
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
        } else if (stateTypes.drawAndGuessEnded === this.#state){
            this.#endRound();
        } else if (stateTypes.roundEnded === this.#state){
            if(this.#playerQueue.length === 0 && this.#totalCycle === this.#currentCycle){
                this.#endGame();
            } else {
                this.#startRound();
            }
        }
    }

    /**
     * Get the current drawer
     * @returns {Client} drawer
     */
    getDrawer(){
        return this.#drawer;
    }

    /**
     * Check if the client has the permission to draw
     * @param {string} cid client unique ID
     * @returns {boolean} true if the client has the permission to draw
     */
    hasPermissionToDraw(cid){
        return this.#drawer && this.#drawer.getCid() === cid && this.#state === stateTypes.wordSelected;   // after wordSelected
    }

    /**
     * Set the word for the drawer
     * @param {string} word choosen word
     * @param {string} cid client unique ID
     */
    setWord(word, cid) {
        if (this.#state === stateTypes.drawerSelected && this.#drawer.getCid() === cid) {
            this.#word = word;
            this.#dictionary.removeWord(this.#word);
            clearInterval(this.#wordSelectionTimer);

            // Board leeren
            this.#board.clear();

            // Clear Board Message
            let jsonMessageClear = JSON.stringify({
                type: responseTypes.initWhiteCanvas, 
                data: [0]
            });

            this.#server.broadcastWsMessage(
                null,
                jsonMessageClear, 
                false, 
                broadcastTypes.allInLobby,
                this.#playerList
            );

            // End Choosing Word Notification
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

    checkGameNotStarted(){
        if(this.#state === null || this.#state == stateTypes.gameEnded){
            return true;
        }
        return false;
    }

    /**
     * Check if the word answer is correct
     * @param {string} answer chat message | word
     * @returns {boolean} true if the answer is correct
     */
    checkAnswer(answer){
        let rightLetterCounter = 0;
        let word = this.#word.toLowerCase().trim();
        let answerWord = answer.toLowerCase().trim(); 

        if(answerWord.length >= 2 && word.length >= 2){
            for(let i = 0; (i < answerWord.length || i < word.length); i++){
                if(word[i] !== null && answerWord[i] !== null && word[i] === answerWord[i]){
                    rightLetterCounter += 1;
                }
            }
        }

        let accuracy = rightLetterCounter / this.#word.length;
        if(accuracy >= this.#wordCheckAccuracyRate){
            return true;
        }

        return false;
    }

    /**
     * Add the answer notifiaction to the chat and save the time of the answer
     * @param {string} cid client unique ID
     * @param {Date} timestamp timestamp of the answer
     * @param {Chat} chat chat object
     */
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

    /**
     * Send the UserList to the clients
     * @param {Client[]} playerList player list
     */
    sendUserList(playerList) {
        let sendPlayerList = [];
        playerList.forEach((player) => {
            sendPlayerList.push({ name: player.getName(), points: player.getPoints(), isDrawer: player === this.#drawer });
        });

        let jsonMessage = JSON.stringify({ type: responseTypes.userList, data: sendPlayerList });
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, playerList);
    }

    /**
     * Send all necessary data by reconnect the client
     * @param {string} cid client unique ID
     */
    sendReconnectData(cid){
        if(this.#state == stateTypes.drawerSelected){
            if(this.#drawer && this.#drawer.getCid() === cid){
                this.#sendWordChoicesList();
            } else if(this.#drawer && this.#drawer.getCid() !== cid){
                this.#sendWordChoicesNotification(broadcastTypes.onlyOneClient);
            }
        } else if (this.#state == stateTypes.wordSelected){
            if(this.#drawer && this.#drawer.getCid() === cid){
                this.#sendWord(this.#word, broadcastTypes.onlyOneClient, cid);
                this.#sendDrawPermission(true);
            } else if (this.#drawer && this.#drawer.getCid() !== cid){
                this.#sendHangManWord();
            }
        } else if (this.#state == stateTypes.gameEnded){
            this.#sendTimer("beendet","");
        }
    }

    //-------------------------------------
    //------------HELP FUNCTIONS-----------
    //-------------------------------------

    /**
     * Send the word choices list to the drawer
     */
    #sendWordChoicesList(){
        let jsonMessageDrawer = JSON.stringify({type: responseTypes.wordChoiceList ,data: this.#wordChoicesList});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageDrawer, false, broadcastTypes.onlyOneClient);
    }

    /**
     * Send the word choices notification to the guesser
     * @param {string} broadcastType broadcast type
     */
    #sendWordChoicesNotification(broadcastType){
        let jsonMessageGuesser = JSON.stringify({type: responseTypes.choosingWordNotification, data: this.#drawer.getName()});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageGuesser, false, broadcastType, this.#playerList);
    }

    /**
     * Send the whole word
     * @param {string} word word to send
     * @param {string} broadcastType broadcast type
     * @param {string?} cid client unique ID (optional)
     */
    #sendWord(word, broadcastType, cid){
        let jsonMessage = JSON.stringify({type: responseTypes.word, data: word});
        this.#server.broadcastWsMessage(cid, jsonMessage, false, broadcastType, this.#playerList);
    }

    /**
     * Send the hang man word to the guesser
     */
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

    /**
     * Send the timer to the clients
     * @param {string} timerType type of timer
     * @param {string} time time to send
     */
    #sendTimer(timerType, time){
        let jsonMessage = JSON.stringify({type: responseTypes.clock, data: {time: time, timetype: timerType}});
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
    }

    /**
     * Send the draw permission to the drawer (enabled or disabled)
     * @param {*} isEnabled true if the drawer has the permission to draw
     */
    #sendDrawPermission(isEnabled){
        let jsonMessage = JSON.stringify({type: responseTypes.drawPermission, data: isEnabled});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessage, false, broadcastTypes.onlyOneClient);
    }
}
