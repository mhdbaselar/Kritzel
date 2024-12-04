"use strict";
const fs = require('fs');

module.exports = class Dictionary {
    /**@type {string[]} */
    #wordList = null;

    /**
     * Constructor to instanciate the dictionary
     */
    constructor(){
        const data = fs.readFileSync('./server/data/words_german.json');
        this.#wordList = JSON.parse(data);
    }

    /**
     * Get a list of random words
     * @param {*} qty quantity of words to return
     * @returns {string[]} list of words
     */
    getWords(qty){
        let _wordList = [];

        if(qty > 0){
            for(let i = 0; i < qty; i++){
                _wordList.push(this.#wordList[Math.floor(Math.random() * this.#wordList.length)]);
            }
        }

        return _wordList;
    }

    /**
     * Remove a word from the dictionary
     * @param {string} word word to remove
     */
    removeWord(word){
        for(let i = 0; i < this.#wordList.length; i++){
            if(this.#wordList[i] == word){
                this.#wordList.splice(i, 1);
                break;
            }
        }
    }
}
