"use strict"

const RandomWalkCircleElement = require('../game/randomwalkcircleelement')
const ElementList = require('../game/elementlist')

//----------------------

module.exports = class ClientGame {

    constructor() {
        this.elementList = null
    }

    openWebSocket() {
        // build websocket-url from current location
        this.socket = new WebSocket("ws://" + location.host + location.pathname)
        this.socket.onopen = (event) => { console.log("socket opened") }
        this.socket.onclose = (event) => { console.log("socket closed") }
        this.socket.onerror = (event) => { console.log("socket error: " + JSON.stringify(event)) }
        this.socket.onmessage = (event) => { this.update(event.data) }
    }

    //----------------------
    
    update(json) {
        this.elementList = new ElementList()
        let el = JSON.parse(json)
        
        console.log(el);
    }

    //----------------------

    send(message) {
        if (this.socket)    this.socket.send(message)
    }

}
