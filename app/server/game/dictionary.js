const fs = require('fs');

module.exports = class Dictionary {
    #wordList = null;

    constructor(){
        fs.readFile('../data/words_german.json', function(err, data) {
            if (err) throw err;

            this.#wordList = JSON.parse(data);
        });
    }

    getRandomWord(){
        random = Math.floor(Math.random() * wordList.length());
        return wordList[random];
    }

    getWords(qty){
        _wordList = []

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
