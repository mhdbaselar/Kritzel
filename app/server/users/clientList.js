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

    /**
     * Adds a client to the list
     * @param {string} cid client unique ID
     * @param {string} name client name
     * @param {int} lobby index of the lobby
     * @returns {Client} new client object
     */
    addClient(cid, name, lobby){
        let client = new Client(cid, name, lobby);
        this.#clientList.push(client);
        return client;
    }

    /**
     * Replace the client unique ID from oldCid to newCid
     * @param {*} oldCid old client unique ID
     * @param {*} newCid new client unique ID
     */
    replaceCid(oldCid, newCid){
        this.#clientList.forEach(client => {
            if(client.getCid() == oldCid){
                client.setCid(newCid);
            }
        });
    }

    /**
     * Get the client list
     * @returns {Client[]} list of clients
     */
    getClientList(){
        return this.#clientList;
    }

    /**
     * Register a name to a client (to cid)
     * @param {string} cid client unique ID
     * @param {string} name client name
     */
    registerName(cid, name){
        this.#clientList.forEach(client => {
            if(client.getCid() == cid){
                client.setName(name);
                return;
            }
        });
    }

    /**
     * Get the name of a client by its unique ID
     * @param {string} cid client unique ID
     * @returns {string} client name
     */
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