//TODO: Spiel Zustandsverwaltung, Rechte, Rollen ...

module.exports = class Game {
    #playerList = null;

    constructor(){}

    start(playerList){
        this.#playerList = playerList;
    }

    getActivePlayer(){
        return null;
    }
}