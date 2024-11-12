const Client = require('./client');

module.exports = class ClientList {
    
    /**@type {Client[]} */
    #clientList;

    /**
     * Constructor to instanciate the clientList
     * */
    constructor(){
        this.#clientList = [];
    }

    addClient(cid, name){
        this.#clientList.push(new Client(cid, name));
    }

    replaceCid(oldCid, newCid){
        this.#clientList.forEach(client => {
            if(client.getCid() == oldCid){
                client.setCid(newCid);
            }
        });
    }

    getClientList(){
        return this.#clientList;
    }

    registerName(cid, name){
        this.#clientList.forEach(client => {
            if(client.getCid() == cid){
                client.setName(name);
                console.log("Registered Name: " + client.getName() + " for Client: " + client.getCid());
                return;
            }
        });
    }
}