module.exports = class Dictionary {
    static wordList = [
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

    static getRandomWord(){
        random = Math.floor(Math.random() * wordList.length());
        return wordList[random];
    }
}