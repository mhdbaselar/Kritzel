module.exports = class UserList {
    
    /**@type {User[]} */
    #userList;

    /**
     * Constructor to instanciate the userList
     * */
    constructor(){
        this.#userList = [];
    }

    addUser(user){
        this.#userList.push(user);
    }

    getUserList(){
        return this.#userList;
    }

    
}