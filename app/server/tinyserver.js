"use strict"

//-----------------------
// tinyserver.js - a tiny http-/ws-server
//
//-----------------------

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const ClientList = require('./users/clientList');

module.exports = class TinyServer {

    #clients;
    /**
     * Constructor to instanciate the WebsocketServer
     * @param {int} port port number
     * @param {function} wsCallback receive function
     */
    constructor(port, wsCallback) {
        this.#clients = new ClientList();
        this.wsCallback = wsCallback;
        this.server = http.createServer(this.processHttpRequest.bind(this));
        this.websocketServer = new ws.WebSocketServer({ server: this.server, clientTracking: true });
        this.websocketServer.on('connection',this.connectWs.bind(this));
        this.server.listen(port, () => {
            console.log(`tinyserver running at http://127.0.0.1:${port}/`);
        });
    }

    /**
     * Configures the connection to the connecting client
     * @param {WebSocket} websocket websocket - client
     */
    connectWs(websocket) {

        if(websocket.cid == null){
            websocket.cid = this.getUniqueID(); 
            websocket.send(JSON.stringify({type: 'init', data: websocket.cid}));
            this.#clients.addClient(websocket.cid, null);
        }
        
        websocket.on('error', console.error);
        websocket.on('message', (data) => { this.processWsRequest(websocket, data)});
        websocket.on('close', () => { console.log('close'); });
    }

    /**
     * Generates a unique client ID
     * @returns unique client ID
     */
    getUniqueID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4();
    }

    /**
     * Recieves and processes a message from the client
     * @param {string} data client request
     */
    processWsRequest(websocket, data) {
        try{
            let cookie = JSON.parse(data);
            if (cookie.type = 'checkCookie'){
                let cid = cookie.data.split('=')[1];
                if(cid != null){
                    this.#clients.replaceCid(websocket.cid, cid);
                    websocket.cid = cid;
                    websocket.send(JSON.stringify({type: 'init', data: websocket.cid}));
                }
            }
        }
        catch(error) {}

        if (this.wsCallback) this.wsCallback(websocket.cid, data);
    }

    /**
     * Sends a message to all clients
     * @param {string} cid user unique ID
     * @param {string} data server response
     * @param {boolean} isBinary is data binary
     * @param {string} broadcastType send - all | allWithoutSender | onlySender - client
     */
    broadcastWsMessage(cid, data, isBinary, broadcastType) {

        let broadcastFunction = function each (client) {};                  // empty function

        if(broadcastType == 'all'){                                         // send all clients
            broadcastFunction = function each(client) {
                if (client.readyState === ws.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            }
        } else if (broadcastType == 'allWithoutSender'){
            broadcastFunction = function each(client) {
                if (client.readyState === ws.OPEN && client.cid != cid) {   // send all clients without sender
                    client.send(data, { binary: isBinary });
                }
            }
        } else if (broadcastType == 'onlySender'){
            broadcastFunction = function each(client) {
                if (client.readyState === ws.OPEN && client.cid == cid) {   // send only sender client
                    client.send(data, { binary: isBinary });
                }
            }
        }

        this.websocketServer.clients.forEach(broadcastFunction);
    }

    /**
     * Handles HTTP requests (url-request) and generates a response (HTML)
     * @param {*} req request
     * @param {*} res response
     */
    processHttpRequest(req, res) {
        let parts = url.parse(req.url, true);

        let filePath = parts.pathname ? parts.pathname.substring(1) : "";
        if (filePath === null || filePath === '') filePath = 'index.html';

        let now = new Date;
        console.log(now.toLocaleString('de-DE') + ': request for ' + req.url);

        fs.readFile('./public/' + filePath, (err, data) => {
            res.statusCode = 200;
            switch (path.extname(filePath)) {
                case ".html":
                case ".htm": res.setHeader('Content-Type', 'text/html'); break
                case ".css": res.setHeader('Content-Type', 'text/css'); break
                case ".png": res.setHeader('Content-Type', 'image/png'); break
                case ".gif": res.setHeader('Content-Type', 'image/gif'); break
            }
            res.end(data);
        });
    }

}
