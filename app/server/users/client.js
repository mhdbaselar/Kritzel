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
        this.#name = name;
    }

    getCid(){
        this.#cid;
    }

    setCid(cid){
        this.#cid = cid;
    }
}