// clientgame.js
"use strict"

const Action = require('./class/action');
const Message = require('./class/message');

module.exports = class ClientGame {

    constructor() {}

    openWebSocket() {
        // build websocket-url from current location
        this.socket = new WebSocket("ws://" + location.host + location.pathname)
        this.socket.onopen = (event) => { console.log("socket opened") }
        this.socket.onclose = (event) => { console.log("socket closed") }
        this.socket.onerror = (event) => { console.log("socket error: " + JSON.stringify(event)) }
        this.socket.onmessage = (event) => { this.update(event.data) }
    }
    
    // This function is called when new content is received from the server
    update(json) {
        let canvasData = JSON.parse(json);

        // Update the canvas on the client side
        let canvas = document.getElementById('drawingCanvas');
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        let ctx = canvas.getContext('2d');

        // Create an ImageData object with dimensions 600x400
        let imageData = ctx.createImageData(600, 400); // Width 600, Height 400

        // Loop through canvasData and set the pixel data
        for (let y = 0; y < 400; y++) {
            for (let x = 0; x < 600; x++) {
                let hexColor = canvasData[y][x]; // Should be '#RRGGBB'

                let index = (y * 600 + x) * 4;

                let rgb = hexToRgb(hexColor);

                if (!rgb) {
                    // If invalid color, default to white
                    rgb = { r: 255, g: 255, b: 255 };
                }

                imageData.data[index] = rgb.r;
                imageData.data[index + 1] = rgb.g;
                imageData.data[index + 2] = rgb.b;
                imageData.data[index + 3] = 255; // Alpha channel
            }
        }

        // Create a temporary canvas to scale the imageData
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = 600;
        tempCanvas.height = 400;
        let tempCtx = tempCanvas.getContext('2d');

        // Put the imageData onto the temporary canvas
        tempCtx.putImageData(imageData, 0, 0);

        // Clear the main canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the temp canvas onto the main canvas, scaling it to fit
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

        function hexToRgb(hex) {
            // Remove '#' if present
            hex = hex.replace(/^#/, '');

            if (hex.length === 3) {
                // Expand shorthand form (#03F => #0033FF)
                hex = hex.split('').map(c => c + c).join('');
            }

            if (hex.length !== 6) {
                return null;
            }

            let num = parseInt(hex, 16);
            let r = (num >> 16) & 255;
            let g = (num >> 8) & 255;
            let b = num & 255;

            return { r: r, g: g, b: b };
        }
    }

    //------------------------------------- 
    //----------SENDING FUNCTIONS----------
    //-------------------------------------

    /**
     * Sends a draw action direct to the server
     * @param {string} tool pen | eraser: Tool that is used for draw action, pen by default
     * @param {int} x x-coordinate of pixel to draw on
     * @param {int} y y-coordinate of pixel to draw on
     * @param {string} color color code in hexadecimal notation
     * @param {int} thickness thickness of draw action
     */
    sendDrawAction(tool = 'pen', x = 0, y = 0, color = '#000000', thickness = 3){
        let _tool = 'pen';

        if(tool == 'pen') _tool = 'pen';
        if(tool == 'eraser') _tool = 'eraser';
        if(tool == 'fill') _tool = 'fill';
        
        let action = new Action(_tool, x , y, color, thickness);
        let message = new Message('action', action);

        let _message = JSON.stringify(message);

        console.log(_message);

        this.send(_message);
    }
    
    /**
     * Asks the server to clear the whole board
     */
    sendClearAction(){
        let action = new Action('clear', 0 , 0, '', 0);
        let message = new Message('action', action);

        this.send(JSON.stringify(message));
    }

    /**
     * Asks the server to fill the whole board into one color
     * @param {string} color color code in hexadecimal notation
     */
    sendFillAction(color = '#000000'){
        let action = new Action('fill', 0 , 0, color, 0);
        let message = new Message('action', action);

        this.send(JSON.stringify(message));
    }

    //------------------------------------- 
    //-----------HELP FUNCTIONS------------
    //-------------------------------------

    send(message) {
        if (this.socket)
            this.socket.send(message)
    }

}