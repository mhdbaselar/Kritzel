(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
        for (let i = 0; i < el.length; i++) {
            // dynamically create element by its classType attribute
            let element = eval('new ' + el[i].classType + '()')
            Object.assign(element, el[i])
            this.elementList.add(element)
        }

        let mycanvas = window.document.getElementById("mycanvas")
        let ctx = mycanvas.getContext('2d')
        //--- clear screen
        ctx.fillStyle = 'rgba(235, 250, 255, 0.05)'        // alpha < 1 löscht den Bildschrim nur teilweise -> bewegte Gegenstände erzeugen Spuren
        ctx.fillRect(0, 0, mycanvas.clientWidth, mycanvas.clientHeight)
        //--- draw elements
        this.elementList.draw(ctx)
    }

    //----------------------

    send(message) {
        if (this.socket)    this.socket.send(message)
    }

}

},{"../game/elementlist":4,"../game/randomwalkcircleelement":5}],2:[function(require,module,exports){
"use strict"

const ClientGame = require("./clientgame")
let clientGame = new ClientGame()
clientGame.openWebSocket()
setTimeout(() => clientGame.send("hi there"), 1000)


},{"./clientgame":1}],3:[function(require,module,exports){
"use strict"

module.exports = class Element {

    constructor() {
        this.classType = this.constructor.name      // retain classType for marshalling
    }

    action() { }

    draw(ctx) { }

    checkCollision(element) { }
}
},{}],4:[function(require,module,exports){
"use strict"

module.exports = class ElementList extends Array {

    constructor() {
        super()
    }

    add(element) {
        this.push(element)
    }

    get(i) {
        return this[i]
    }

    delete(i) {
        this.splice(i, 1)
    }

    draw(ctx) {
        for (let i = 0; i < this.length; i++) {
            this[i].draw(ctx)
        }
    }

    action() {
        for (let i = 0; i < this.length; i++) {
            this[i].action()
        }
    }

    checkCollision(element) { }
}
},{}],5:[function(require,module,exports){
"use strict"

const Element = require('./element')

module.exports = class RandomWalkCircleElement extends Element {

    constructor(x, y) {
        super()
        this.x = x
        this.y = y
    }

    draw(ctx) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.fillStyle = "red"
        ctx.fill()
    }

    action() {
        this.x += Math.random() * 2 - 1
        this.y += Math.random() * 2 - 1
    }
}
},{"./element":3}]},{},[2]);
