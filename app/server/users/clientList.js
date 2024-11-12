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
                return;
            }
        });
    }

    getNameByCid(cid){
        let name = "";

        this.#clientList.forEach(client => {
            if(client.getCid() == cid){
                name = client.getName();
            }
        });

        return name;
    }
}