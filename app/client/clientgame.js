// clientgame.js
"use strict";

const DrawAction = require("./class/drawAction");
const Message = require("./class/message");
const ChatAction = require("./class/chatAction");
const {
  displayChatMessage,
  displayChatMessageList,
} = require("./components/userInterface");
const HexColorConverter = require("./class/hexColorConverter");
const requestTypes = require("./class/requestTypes");
const responseTypes = require("./class/responseTypes");

/**
 * Instance of the HexColorConverter class.
 * @type {HexColorConverter}
 */
const converter = new HexColorConverter();

module.exports = class ClientGame {
  /**@type {string} */
  #name;  // user name

  /**
   * Constructor to instanciate the ClientGame
   */
  constructor() {
    this.#name = null;
  }

  /**
   * Sets the user name
   * @param {string} name user name
   */
  setUserNameByClientGame(name) {
    this.#name = name;
  }

  /**
   * Opens a WebSocket connection to the server.
   */
  openWebSocket() {
    // Determine WebSocket protocol based on current page protocol
    const protocol = location.protocol === "https:" ? "wss://" : "ws://";

    // Show loadingOverlay
    const loadingOverlay = document.getElementById("loadingOverlay");

    const cookie = document.cookie;

    // Build WebSocket URL with correct protocol
    this.socket = new WebSocket(protocol + location.host + location.pathname);

    // Event handler for when the connection is opened
    this.socket.onopen = (event) => {
      console.log("Socket opened");
      this.sendNameAction(this.#name);
      this.sendGetChatAction();
      this.sendGetCanvasAction();
      this.sendGetUserListAction();
      loadingOverlay.style.display = "none"; // Spinner verstecken
    };

    // Event handler for when the connection is closed
    this.socket.onclose = (event) => {
      console.log("Socket closed");
      loadingOverlay.style.display = "flex"; // Spinner zeigen
    };

    // Event handler for any errors with the connection
    this.socket.onerror = (event) => {
      console.log("Socket error: " + JSON.stringify(event));
      loadingOverlay.style.display = "flex"; // Spinner zeigen
    };

    // Event handler for receiving messages from the server
    this.socket.onmessage = (event) => {
      let data = JSON.parse(event.data);
      if (data.type == responseTypes.chatMsgList) {
        // Update the chat display
        const chatMessages = document.querySelector(".chat-messages");
        displayChatMessageList(chatMessages, data.data, data.cid);
      } else if (data.type == responseTypes.chatMsg) {
        // Update the chat display
        const chatMessages = document.querySelector(".chat-messages");
        displayChatMessage(chatMessages, data.data, data.cid, data.name);
      } else if (data.type === responseTypes.pointList) {
        // 'pl' = PointList
        this.updateWithPoints(data.data);
      } else if (data.type === responseTypes.canvas2D) {
        // '2d' = Canvas data
        this.update(data.data);
      } else if (data.type === responseTypes.initWhiteCanvas) {
        data.data = Array.from({ length: 400 }, () => Array(600).fill(0));
        this.update(data.data);
      } else if (data.type === responseTypes.cookie) {
        this.setSessionCookie(data.data);
      } else if (data.type === responseTypes.userList){
        this.setUserList(data.data);
      } else if (data.type === responseTypes.wordChoiceList){
        console.log(data.data);   // wordList
        // TODO: Frontend anzeigen der Worterauswahl
      } else if (data.type === responseTypes.choosingWordNotification){
        console.log(data.data);   // name from the drawer
        // TODO: Frontend anzeigen der Notification ("<Bob> is choosing a word")
      } else if (data.type === responseTypes.endChoosingWordNotification){
        console.log(data.data);   // name from the drawer
        // TODO: Frontend anzeigen der Notification ("<Bob> is choosing a word") ausblenden
      } else if (data.type === responseTypes.clock){
        console.log(data.data);   // time left
        // TODO: Frontend anzeigen der Uhrzeit
      }
    };
  }

  setUserList(data){
    this.userList = data;
    renderUsers(this.userList);
  }

  setSessionCookie(cid) {
    var expires = "";
    var date = new Date();
    date.setTime(date.getTime() + 2 * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
    document.cookie = "cid=" + (cid || "") + expires + "; path=/";
  }

  /**
   * Updates the canvas with a list of drawn points received from the server.
   * @param {Array<{x: number, y: number, color: string, thickness: number}>} data
   */
  updateWithPoints(data) {
    let canvasData = data;
    // Example: Point List
    //  [{x: 0, y: 0, color: 0},
    //  {x: 1, y: 1, color: 0}]

    // Access the canvas element
    let canvas = document.getElementById("drawingCanvas");
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }
    let ctx = canvas.getContext("2d");

    // Calculate scaling factors based on current canvas size
    let scaleX = canvas.width / 600;
    let scaleY = canvas.height / 400;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Iterate through each point and draw it
    for (let i = 0; i < canvasData.length; i++) {
      let point = canvasData[i];
      let hexColor = converter.intToHex(point.color);

      // Convert hex color to RGB string
      let rgb = hexToRgb(hexColor);
      if (!rgb) {
        // If invalid color, default to white
        rgb = { r: 255, g: 255, b: 255 };
      }
      let rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      // Set the fill style to the RGB string
      ctx.fillStyle = rgbString;

      // Scale the x and y coordinates
      let scaledX = point.x * scaleX;
      let scaledY = point.y * scaleY;

      // Draw a small rectangle (1x1 pixel) at the scaled position
      ctx.fillRect(scaledX, scaledY, 1, 1);
    }

    /**
     * Converts a hex color code to an RGB object.
     * @param {string} hex - The hex color code.
     * @returns {{r: number, g: number, b: number}} The RGB representation.
     */
    function hexToRgb(hex) {
      // Remove '#' if present
      hex = hex.replace(/^#/, "");

      if (hex.length === 3) {
        // Expand shorthand form (#03F => #0033FF)
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
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

  /**
   * Updates the entire canvas based on the full Canvas data received from the server.
   * @param {Array<Array<string>>} data
   */
  update(data) {
    let canvasData = data;

    //console.log("Update Canvas");

    // Access the canvas element
    let canvas = document.getElementById("drawingCanvas");
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }
    let ctx = canvas.getContext("2d");

    // Create an ImageData object with dimensions 600x400
    let imageData = ctx.createImageData(600, 400); // Width 600, Height 400

    // Loop through canvasData and set the pixel data
    for (let y = 0; y < 400; y++) {
      for (let x = 0; x < 600; x++) {
        let hexColor = canvasData[y][x]; // Should be '#RRGGBB'

        let index = (y * 600 + x) * 4;

        let rgb = hexToRgb(converter.intToHex(hexColor));

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
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = 600;
    tempCanvas.height = 400;
    let tempCtx = tempCanvas.getContext("2d");

    // Put the imageData onto the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);

    // Clear the main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the temp canvas onto the main canvas, scaling it to fit
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    /**
     * Converts a hex color code to an RGB object.
     * @param {string} hex - The hex color code.
     * @returns {{r: number, g: number, b: number}} The RGB representation.
     */
    function hexToRgb(hex) {
      // Remove '#' if present
      hex = hex.replace(/^#/, "");

      if (hex.length === 3) {
        // Expand shorthand form (#03F => #0033FF)
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
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
   * Sends a draw action directly to the server.
   * @param {string} tool - 'pen' | 'eraser' | 'fill': Tool used for the draw action.
   * @param {number} x - x-coordinate of the pixel to draw on.
   * @param {number} y - y-coordinate of the pixel to draw on.
   * @param {string} color - Color code in hexadecimal notation.
   * @param {number} thickness - Thickness of the draw action.
   */
  sendDrawAction(tool = "pen", x = 0, y = 0, color = "#000000", thickness = 3) {
    let _tool = "pen";

    if (tool === "pen") _tool = "pen";
    if (tool === "eraser") _tool = "eraser";
    if (tool === "fill") _tool = "fill";
    if (tool === "fill") _tool = "fill";

    let action = new DrawAction(
      _tool,
      x,
      y,
      converter.hexToInt(color),
      thickness
    );
    let message = new Message(requestTypes.draw, action);

    let _message = JSON.stringify(message);

    this.send(_message);
  }

  /**
   * Asks the server to clear the whole board.
   */
  sendClearAction() {
    let action = new DrawAction("clear", 0, 0, "", 0);
    let message = new Message(requestTypes.draw, action);

    this.send(JSON.stringify(message));
  }

  /**
   * Asks the server to fill the whole board into one color.
   * @param {string} color  color code in hexadecimal notation.
   */
  sendFillAction(x = 0, y = 0, color = "#000000") {
    let action = new DrawAction("fill", x, y, converter.hexToInt(color), 0);
    let message = new Message(requestTypes.draw, action);

    this.send(JSON.stringify(message));
  }

  /**
   * Requests the server to send the current Canvas data
   */
  sendGetCanvasAction() {
    let message = new Message(requestTypes.getCanvas, null);
    this.send(JSON.stringify(message));
  }

  /**
   * Sends the client chat message to the other clients
   * @param {*} chatMessage client chat message
   */
  sendChatAction(chatMessage) {
    let timestamp = new Date();
    let action = new ChatAction(chatMessage, timestamp);
    let message = new Message(requestTypes.addChatMsg, action);
    this.send(JSON.stringify(message));
  }

  /**
   * Requests the server to send the all chat messages
   */
  sendGetChatAction() {
    let message = new Message(requestTypes.getAllChatMsg, null);
    this.send(JSON.stringify(message));
  }

  /**
   * Sends the client name to the server
   * @param {string} name client name
   */
  sendNameAction(name) {
    let message = new Message(requestTypes.setName, { name: name });
    this.send(JSON.stringify(message));
  }

  /**
   * Requests the server to send the user list
   */
  sendGetUserListAction() {
    let message = new Message(requestTypes.getUserList, null);
    this.send(JSON.stringify(message));
  }

  sendWordAction(word){
    let message = new Message(requestTypes.setWord, word);
    this.send(JSON.stringify(message));
  }

  //-------------------------------------
  //-----------HELP FUNCTIONS------------
  //-------------------------------------

  /**
   * Sends a message over the WebSocket.
   * @param {string} message
   */
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error(
        "WebSocket is not open. Ready state:",
        this.socket.readyState
      );
    }
  }
};
