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

    getCid(){
        return this.#cid;
    }

    setCid(cid){
        this.#cid = cid;
    }

    getName(){
        return this.#name;
    }

    setName(name){
        this.#name = name;
    }
}