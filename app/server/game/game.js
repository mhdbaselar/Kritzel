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
    #wordTimeout = 20000; // 10s
    /** @type {int} */
    #roundTimeout = 60000; // 30s
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
    /** @type {float} */
    #wordCheckAccuracyRate = 0.8;  // accept 80% accuracy of word
    /** @type {int} */
    #maxPointsGuesser = 100;
    /** @type {int} */
    #maxPointsDrawer = 150;
    /**@type {float} */
    #revealeLetterRate = 0.5; // reveal 50% of the word
    /**@type {{pos : int, random : float}[]}  */
    #revealeWordOrder;
    /**@type {string} */
    #hangManWord;
    /**@type {{player : Client, points : int}[]} */
    #pointList;
    #roundResultList;

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
    startGame(playerList, totalCycle, roundTimeout){
        console.log("Start Game");
        this.#playerList = playerList;
        this.#totalCycle = totalCycle;
        this.#roundTimeout = roundTimeout;
        this.#currentCycle = 1;
        this.#currentRound = 0;
        this.#playerQueue = [...this.#playerList];      // copy current playerList to queue
        this.#pointList = this.#playerList.map((player) => {return {player : player, points : 0}} );
        this.#roundResultList = [];
        this.sendUserList(playerList);
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
        this.#revealeWordOrder = [];

        // Show last round results
        if(this.#roundResultList.length > 0){
            let jsonMessage = JSON.stringify({ type: responseTypes.roundResultList, data: this.#roundResultList });
            this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
        }

        // wait before next round start
        this.#timeleft = this.#nextRoundTimeout / 1000;

        let nextRoundTimer = setInterval(() => {
            this.#sendTimer("Nächste Runde in ", this.#timeleft);
            if(this.#timeleft <= 0){
                clearInterval(nextRoundTimer);
                this.#state = stateTypes.roundStarted;
                // Send remove ResultList
                let jsonMessage = JSON.stringify({type: responseTypes.endRoundResultList, data: null});
                this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
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
                this.#sendRemoveWordChoicesList();
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
        this.#sendWord(this.#hangManWord, broadcastTypes.allInLobbyWithoutOneClient, this.#drawer.getCid());

        this.#timeleft = this.#roundTimeout / 1000;
        let revealLetterCount = Math.floor(this.#word.length * this.#revealeLetterRate);
        let revealLetterIntervalTime = Math.ceil(this.#timeleft / (revealLetterCount + 1));
        // Set a timer for the drawer phase
        const drawTimer = setInterval(() => {
            this.#sendTimer("Zeichnen verbleibend: ", this.#timeleft);

            let allAnswered = this.#playerList.every((player) => player === this.#drawer ||
                                                    this.#answerTimeList.some((answer) => answer.cid === player.getCid()));

            // Reveal new letter in hangManWord
            if(this.#timeleft !== (this.#roundTimeout / 1000) && this.#timeleft > 0 && this.#timeleft % revealLetterIntervalTime === 0){
                //console.log(this.#timeleft);
                this.#revealNewLetterInHangManWord();
                this.#sendWord(this.#hangManWord, broadcastTypes.allInLobbyWithoutOneClient, this.#drawer.getCid());
            }

            if(this.#timeleft <= 0 || allAnswered){
                clearInterval(drawTimer);
                this.#state = stateTypes.drawAndGuessEnded;
                this.#nextState();
            }
            this.#timeleft -= 1;
        }, 1000);
    }

    /**
     * End the round, calculate the points, disable overlays and show the word
     */
    #endRound(){
        console.log("End Round");

        this.#answerTimeList.sort(function(answer1, answer2){
            return answer1.timestamp - answer2.timestamp;
        });

        let maxLength = Math.max(this.#answerTimeList.length, this.#playerList.length - 1);
        if(maxLength !== 0){
            this.#roundResultList = [];
            let maxPointsGuesser = this.#maxPointsGuesser;
            let pointGradiation = maxPointsGuesser / maxLength;

            // Set Points for answers
            this.#answerTimeList.forEach((answer) => {
                let playerPoint = this.#pointList.find((playerPoint) => playerPoint.player.getCid() === answer.cid);

                if(playerPoint){
                    playerPoint.points += Math.ceil(maxPointsGuesser);
                    this.#roundResultList.push({name: playerPoint.player.getName(), pointsAdded : maxPointsGuesser});
                    maxPointsGuesser -= pointGradiation;
                }
            });

            // Add no answer Players in resultList with +0 Points
            this.#playerList.forEach((player) => {
                let hasAnswered = this.#answerTimeList.some(answer => answer.cid === player.getCid());
                if(!hasAnswered && player !== this.#drawer){
                    this.#roundResultList.push({name: player.getName(), pointsAdded : 0});
                }   
            });

            // Set Points for Drawer 
            let playerPointDrawer = this.#pointList.find((playerPoint) => playerPoint.player.getCid() === this.#drawer.getCid());
            playerPointDrawer.points += Math.ceil(this.#maxPointsDrawer / maxLength * this.#answerTimeList.length);
            this.#roundResultList.push({name: this.#drawer.getName(), pointsAdded : Math.ceil(this.#maxPointsDrawer / maxLength * this.#answerTimeList.length)});

            // Sort decendent results
            this.#roundResultList.sort(function(result1, result2){
                return result2.pointsAdded - result1.pointsAdded;
            });  
        }

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
     * End the game, reset the game and TODO: show the final points
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

        // Send Game EndResult List
        this.#sendEndGameResultList();
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

            clearInterval(this.#wordSelectionTimer);
            this.#word = word;

            // get RevealOrder of HangManWord Letter and initilize hangManWord
            this.#revealeWordOrder = [];
            this.#hangManWord = "";
            for(let i = 0; i < this.#word.length; i++){
                this.#revealeWordOrder.push({pos: i, random: Math.random()});
                this.#hangManWord += "_";
            }
            this.#revealeWordOrder.sort(function(letter1, letter2) {
                return letter1.random - letter2.random;
            });

            // Remove Word from Dict
            this.#dictionary.removeWord(this.#word);

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

    /**
     *  Check if the game is not started
     * @returns {boolean} true if the game is not started
     */
    checkGameNotStarted(){
        if(this.#state === null || this.#state == stateTypes.gameEnded){
            return true;
        }
        return false;
    }

    /**
     * Checks if the provided answer matches the word with a certain accuracy rate.
     *
     * @param {string} answer - The answer to be checked against the word.
     * @returns {boolean} - Returns true if the accuracy of the answer is greater than or equal to the required accuracy rate, otherwise false.
     */
    checkAnswer(answer){
        if(this.#state === stateTypes.wordSelected){
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
        }

        return false;
    }

    /**
     * Check if the game is ended
     * @returns {boolean} true if the game is ended
     */
    checkGameEnd(){
        return this.#state === stateTypes.gameEnded;
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

    addPlayerInPointList(player){
        if(this.#state !== null){
            let isFound = this.#pointList.some(playerPointObj => playerPointObj.player === player);
            if(!isFound){
                this.#pointList.push({player : player, points : 0});
            }
        }
    }

    #sendEndGameResultList(){
        let sendPlayerList = this.#createUserResultList(this.#playerList);

        let jsonMessage = JSON.stringify({ type: responseTypes.gameResultList, data: sendPlayerList });
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, this.#playerList);
    }

    /**
     * Send the UserList to the clients
     * @param {Client[]} playerList list of players
     */
    sendUserList(playerList) {
        let sendPlayerList = this.#createUserResultList(playerList);

        let jsonMessage = JSON.stringify({ type: responseTypes.userList, data: sendPlayerList });
        this.#server.broadcastWsMessage(null, jsonMessage, false, broadcastTypes.allInLobby, playerList);
        
    }

    #createUserResultList(playerList){
        let sendPlayerList = [];
        playerList.forEach((player) => {
            if(this.#state !== null){
                let playerPoint = this.#pointList.find((playerPoint) => playerPoint.player === player);
                if(playerPoint){
                    sendPlayerList.push({ name: player.getName(), points: playerPoint.points, isDrawer: player === this.#drawer });
                }
            } else {
                sendPlayerList.push({ name: player.getName(), points: 0, isDrawer: player === this.#drawer });
            }
        });

        sendPlayerList.sort(function(result1, result2){
            return result2.points - result1.points;
        });

        return sendPlayerList;
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
                this.#sendWord(this.#hangManWord, broadcastTypes.allInLobbyWithoutOneClient, this.#drawer.getCid());
            }
        } else if (this.#state == stateTypes.gameEnded){
            this.#sendTimer("beendet","");
        }
    }

    //-------------------------------------
    //------------HELP FUNCTIONS-----------
    //-------------------------------------

    /**
     * Reveal a new letter in the hangManWord
     */
    #revealNewLetterInHangManWord(){
        if(this.#revealeWordOrder[0] !== null){
            let index = parseInt(this.#revealeWordOrder[0].pos);
            // Replace Letter
            this.#hangManWord = this.#hangManWord.substring(0, index) + this.#word[index] + this.#hangManWord.substring(index + 1);
            this.#revealeWordOrder.shift();
        }
    }

    /**
     * Send the word choices list to the drawer
     */
    #sendWordChoicesList(){
        let jsonMessageDrawer = JSON.stringify({type: responseTypes.wordChoiceList ,data: this.#wordChoicesList});
        this.#server.broadcastWsMessage(this.#drawer.getCid(), jsonMessageDrawer, false, broadcastTypes.onlyOneClient);
    }

    /**
     * Send remove word choices list to the drawer
     */
    #sendRemoveWordChoicesList(){
        let jsonMessageDrawer = JSON.stringify({type: responseTypes.removeWordChoiceList ,data: null});
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
