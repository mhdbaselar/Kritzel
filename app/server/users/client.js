module.exports = class Client {

    /**@type {string} */
    #cid;
    /**@type {string} */
    #name;
    /**@type {int} */
    #score;
    /**@type {int} */
    #lobbyID;
    /**@type {boolean} */
    #isConnected;


    /**
     * Constructor to instanciate the client
     * @param {string} cid client unique ID (for cookie)
     * @param {string} name client name
     * @param {int} lobbyID Lobby Index
     */
    constructor(cid, name, lobbyID) {
        this.#cid = cid;
        if (name) {
            this.#name = name;
        } else {
            this.#name = "";
        }
        this.#score = 0;
        this.#lobbyID = lobbyID;
        this.#isConnected = true;
    }

    /**
     * Returns the client unique ID
     * @returns {string} client unique ID
     */
    getCid() {
        return this.#cid;
    }

    /**
     * Sets the client unique ID
     * @param {string} cid client unique ID
     */
    setCid(cid) {
        this.#cid = cid;
    }

    /**
     * Returns the client name
     * @returns {string} client name
     */
    getName() {
        return this.#name;
    }

    /**
     * Sets the client name
     * @param {string} name client name
     */
    setName(name) {
        this.#name = name;
    }

    /**
     * Returns the client score
     * @returns {int} client score
     */
    getPoints() {
        return this.#score;
    }

    /**
     * Sets the client score
     * @param {int} points client score
     */
    setPoints(points) {
        this.#score = points;
    }

    /**
     * Returns the client lobby index
     * @returns {int} index of the lobby
     */
    getLobbyID(){
        return this.#lobbyID;
    }

    getIsConnected(){
        return this.#isConnected;
    }

    setIsConnected(isConnected){
        this.#isConnected = isConnected;
    }
}