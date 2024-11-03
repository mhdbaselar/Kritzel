module.exports = class User {

    /**@type {string} */
    #uid;
    /**@type {string} */
    #name;
    /**@type {int} */
    #points;

    /**
     * Constructor to instanciate the userList
     * @param {*} uid user unique ID (for cookie)
     * @param {*} name user name
     */
    constructor(uid, name) {
        this.#uid = uid;
        this.#name = name;
        this.#points = 0;
    }
}