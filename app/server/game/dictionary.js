"use strict";
const fs = require('fs');

module.exports = class Dictionary {
    #wordList = null;

    constructor(){
        const data = fs.readFileSync('./server/data/words_german.json');
        this.#wordList = JSON.parse(data);
        console.log(this.#wordList);
    }
    getRandomWord(){
        let random = Math.floor(Math.random() * wordList.length());
        return wordList[random];
    }

    getWords(qty){
        let _wordList = [];

        if(qty > 0){
            for(let i = 0; i < qty; i++){
                _wordList.push(this.#wordList[Math.floor(Math.random() * this.#wordList.length())]);
            }
        }

        return _wordList;
    }

    removeWord(word){
        for(let i = 0; i < this.#wordList.length(); i++){
            if(this.#wordList[i] == word){
                delete this.#wordList[i];
                break;
            }
        }
    }
}
