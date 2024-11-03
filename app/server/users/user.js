module.exports = class User {

    #uid;
    #name;
    #points;

    constructor(uid, name) {
        this.#uid = uid;
        this.#name = name;
        this.#points = 0;
    }
}