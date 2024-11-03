module.exports = class UserList {
    
    #userList;

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