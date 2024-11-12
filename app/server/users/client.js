module.exports = class Client {

    /**@type {string} */
    #cid;
    /**@type {string} */
    #name;

    /**
     * Constructor to instanciate the client
     * @param {*} cid client unique ID (for cookie)
     * @param {*} name client name
     */
    constructor(cid, name) {
        this.#cid = cid;
        if(name){
            this.#name = name;
        } else {
            this.#name = "";
        }
    }

    /**
     * Returns the client unique ID
     * @returns {string} client unique ID
     */
    getCid(){
        return this.#cid;
    }

    /**
     * Sets the client unique ID
     * @param {string} cid client unique ID
     */
    setCid(cid){
        this.#cid = cid;
    }

    /**
     * Returns the client name
     * @returns {string} client name
     */
    getName(){
        return this.#name;
    }

    /**
     * Sets the client name
     * @param {string} name client name
     */
    setName(name){
        this.#name = name;
    }
}