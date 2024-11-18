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
     */
    addClient(cid, name, lobby){
        this.#clientList.push(new Client(cid, name, lobby));
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

    getLobbyIDByCid(cid){
        let lobbyID = 0;

        this.#clientList.forEach(client => {
            if(client.getCid() == cid){
                lobbyID = client.getLobbyID();
            }
        });

        return lobbyID;
    }

    getClientsByLobbyID(lobbyID){
        let clientsInLobby = this.#clientList.filter(client => client.getLobbyID() == lobbyID);
        return clientsInLobby;
    }
}