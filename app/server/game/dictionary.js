module.exports = class Dictionary {
    #wordList = [
        "Apfel",
        "Baum",
        "Katze",
        "Sonne",
        "Mond",
        "Fisch",
        "Haus",
        "Auto",
        "Blume",
        "Ballon",
        "Vogel",
        "Stern",
        "Buch",
        "Herz",
        "Schmetterling",
        "Schneemann",
        "Elefant",
        "Regenbogen",
        "Hund",
        "Tasse",
        "Wolke",
        "Gitarre",
        "Bär",
        "Brille",
        "Berg",
        "Schiff",
        "Stuhl",
        "Lampe",
        "Schlüssel",
        "Eule"
      ];

    constructor(){}

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
