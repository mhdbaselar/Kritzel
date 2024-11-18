module.exports = class Client {

    /**@type {string} */
    #cid;
    /**@type {string} */
    #name;
    /**@type {int} */
    #score;
    /**@type {boolean} */
    #isActivePlayer;


    /**
     * Constructor to instanciate the client
     * @param {*} cid client unique ID (for cookie)
     * @param {*} name client name
     */
    constructor(cid, name, score) {
        this.#cid = cid;
        if (name) {
            this.#name = name;
        } else {
            this.#name = "";
        }
        this.#score = 0;
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

    getPoints() {
        return this.#score;
    }

    setPoints(points) {
        this.#score = points;
    }
}