/**
 * Initializes the main client-side application.
 * Sets up the canvas, toolbar, chat, and event listeners for user interactions.
 *
 * @file main.js
 * @module main
 *
 * @fileoverview Initializes the main client-side application.
 *
 * @requires ./clientgame
 * @requires ./components/userInterface
 * @requires ./components/toolbar
 * @requires ./components/chat
 * @requires ./components/virtualKeyboard
 */

"use strict";

// Import necessary modules
const ClientGame = require("./clientgame");
const { renderUsers, _submitUsername } = require("./components/userInterface");
const { initializeToolbar } = require("./components/toolbar");
const { initializeChat } = require("./components/chat");
const {
  initializeVirtualKeyboard,
  hideKeyboard,
  setChatInputEditable,
  isMobile,
} = require("./components/virtualKeyboard");
const HexColorConverter = require("./class/hexColorConverter");

/**
 * Instance of the ClientGame class.
 * @type {ClientGame}
 */
const clientGame = new ClientGame();

/**
 * Instance of the HexColorConverter class.
 * @type {HexColorConverter}
 */
const converter = new HexColorConverter();

// Open WebSocket connection
clientGame.openWebSocket();

window.addEventListener("load", () => {
  console.log(converter.hexToInt("#FFFFFF"));
  console.log(converter.intToHex(0));

  // -------------------------------
  // Canvas Setup and Resizing
  // -------------------------------

  /**
   * Retrieves the HTML canvas element with the ID "drawingCanvas".
   * @type {HTMLCanvasElement}
   */
  const canvas = document.getElementById("drawingCanvas");

  /**
   * The 2D rendering context for the drawing surface of the <canvas> element.
   * Provides methods and properties for drawing and manipulating graphics on the canvas.
   * @type {CanvasRenderingContext2D}
   */
  const ctx = canvas.getContext("2d");

  // Resize the canvas to fit the parent container
  resizeCanvas();

  // Add an event listener to resize the canvas when the window is resized
  window.addEventListener("resize", debounce(resizeCanvasEvent, 200));

  /**
   * Resizes the canvas and sends a request to update the canvas state.
   * @function resizeCanvasEvent
   */
  function resizeCanvasEvent() {
    resizeCanvas();
    clientGame.sendGetCanvasAction();
  }

  /**
   * Resizes the canvas to maintain responsive layout and preserves the drawn content.
   * The canvas width is set to match its parent element's width, and the height
   * is calculated proportionally with a 1.5 aspect ratio. The function uses a
   * temporary canvas to preserve and redraw the existing content during resizing.
   * After resizing, it synchronizes the chat height with the new canvas dimensions.
   *
   * @function resizeCanvas
   * @returns {void}
   */
  function resizeCanvas() {
    // Get the parent container's width and calculate the new dimensions
    const parentWidth = canvas.parentElement.clientWidth;

    // Set the new width and height for the canvas
    const newWidth = parentWidth;

    // Maintain a 2:3 aspect ratio for the canvas
    const newHeight = newWidth * (2 / 3);

    // Resize the canvas and update the style to fit the parent container
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    // Create a temporary canvas to store the existing content
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    // Draw the existing content on the temporary canvas
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0);

    // Redraw the content on the resized canvas
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Synchronize the chat height with the new canvas dimensions
    syncChatHeight();
  }

  /**
   * Debounces a function to limit the rate at which it can be called.
   * @param {function} func - The function to debounce.
   * @param {number} wait - The number of milliseconds to wait before calling the function.
   * @returns {function} A debounced version of the input function.
   */
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Synchronize the chat height with the canvas dimensions
  function syncChatHeight() {
    const chatMessages = document.querySelector(".chat-messages");
    const canvasHeight = canvas.clientHeight;

    // Set the chat height based on the device type (window width)
    if (window.innerWidth <= 850) {
      chatMessages.style.height = `${(canvasHeight - 20) / 2}px`;
    } else {
      chatMessages.style.height = `${canvasHeight - 20}px`;
    }
  }

  // Call the function to synchronize the chat height
  syncChatHeight();

  // Add an event listener to resize the chat height when the window is resized
  window.addEventListener("resize", debounce(syncChatHeight, 200));

  // -------------------------------
  // Drawing State Variables
  // -------------------------------

  // Initialize drawing state variables´
  let drawing = false;
  let tool = "pen";
  let penColor = "#000000";
  let penSize = 3;

  // -------------------------------
  // Toolbar Initialization
  // -------------------------------

  /**
   * Callback function for when the pen size changes.
   * @param {number} newSize
   * @param {HTMLButtonElement} button
   */
  function onPenSizeChange(newSize, button) {
    penSize = newSize;
    updatePenSettings();
    updateSelectedPenSizeButton(button);
  }

  /**
   * Callback function for when the pen color changes.
   * @param {string} newColor
   * @param {HTMLButtonElement} button
   */
  function onPenColorChange(newColor, button) {
    penColor = newColor;
    updatePenSettings();
    updateSelectedColorButton(button);
  }

  /**
   * Callback function for when the tool changes.
   * @param {string} selectedTool
   * @param {HTMLButtonElement} button
   */
  function onToolChange(selectedTool, button) {
    selectTool(selectedTool);
  }

  /**
   * Callback function for clearing the canvas
   */
  function onClearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clientGame.sendClearAction();
  }

  /**
   * Updates the pen settings based on the current pen size and color.
   */
  function updatePenSettings() {
    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    console.log(`Pen settings updated: Size=${penSize}, Color=${penColor}`);
  }

  /**
   * Updates the selected pen size button based on the user's selection.
   * @param {HTMLButtonElement} selectedButton
   */
  function updateSelectedPenSizeButton(selectedButton) {
    const penSizeButtons = document.querySelectorAll(".pen-size-btn");
    penSizeButtons.forEach((button) => {
      if (button === selectedButton) {
        button.classList.add("selected");
        button.style.backgroundColor = penColor;
      } else {
        button.classList.remove("selected");
        button.style.backgroundColor = "#ffffff";
      }
    });
  }

  /**
   * Updates the selected color button based on the user's selection.
   * @param {HTMLButtonElement} selectedButton
   */
  function updateSelectedColorButton(selectedButton) {
    const colorButtons = document.querySelectorAll(".color-button");
    colorButtons.forEach((button) => {
      if (button === selectedButton) {
        button.classList.add("selected");
        button.style.outline = "2px solid #fff";
      } else {
        button.classList.remove("selected");
        button.style.outline = "none";
      }
    });
  }

  /**
   * Selects a drawing tool based on the user's selection.
   * @param {string} selectedTool
   */
  function selectTool(selectedTool) {
    const toolButtons = document.querySelectorAll(".tool-button");
    toolButtons.forEach((button) => {
      if (button.dataset.tool === selectedTool) {
        button.classList.add("selected-tool");
      } else {
        button.classList.remove("selected-tool");
      }
    });
    tool = selectedTool;
    console.log(`Tool selected: ${tool}`);
  }

  // Initialize the toolbar with the callback functions
  initializeToolbar({
    onPenSizeChange,
    onPenColorChange,
    onToolChange,
    onClearCanvas,
  });

  // Initialize the default selected pen size button
  const penSizeButtons = document.querySelectorAll(".pen-size-btn");

  /**
   * The default pen size button based on the penSize variable.
   * @type {HTMLButtonElement}
   */
  const defaultPenSizeButton = Array.from(penSizeButtons).find(
    (ps) => parseInt(ps.dataset.size, 10) === penSize
  );

  // Initialize the default pen size button
  if (defaultPenSizeButton) {
    defaultPenSizeButton.classList.add("selected");
    defaultPenSizeButton.style.backgroundColor = penColor;
    updatePenSettings();
  } else {
    console.error("Default pen size button not found.");
  }

  // -------------------------------
  // Drawing Functions
  // -------------------------------

  /**
   * Gets the pointer position relative to the canvas.
   * @param {Event} event - The event object for mouse or touch events.
   * @returns {Object} The x and y coordinates of the pointer.
   */
  function getPointerPosition(event) {
    /**
     * The bounding rectangle of the canvas element.
     * @type {DOMRect}
     */
    const rect = canvas.getBoundingClientRect();
    let x, y;

    // Check if the event is a touch event or mouse event
    if (event.touches && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    // Scale x and y relative to canvas element size.
    x *= canvas.width / rect.width;
    y *= canvas.height / rect.height;

    return { x, y };
  }

  /**
   * Starts drawing on the canvas.
   * @param {Event} event - The event object for mouse or touch events.
   */
  function startDrawing(event) {
    drawing = true;
    draw(event);
  }

  /**
   * Stops drawing on the canvas.
   */
  function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    clientGame.sendDrawAction("pen", null, null, penColor, 0);
  }

  /**
   * Draws on the canvas based on the pointer position.
   * @param {Event} event - The event object for mouse or touch events.
   */

  function draw(event) {
    if (!drawing) return;

    // Prevent scrolling on touch devices
    event.preventDefault();

    // Set line properties
    ctx.lineWidth = penSize * 1.3; // Adjust line width to server's scale
    ctx.lineCap = "round";
    ctx.strokeStyle = penColor;

    /**
     * The x and y coordinates of the pointer position.
     * @type {Object}
     */
    const pos = getPointerPosition(event);

    // Draw line from the last position to the current position
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    /**
     * The scaled x-coordinate of the pointer position.
     * @type {number}
     */
    const scaledX = (pos.x / canvas.width) * 600;

    /**
     * The scaled y-coordinate of the pointer position.
     * @type {number}
     */
    const scaledY = (pos.y / canvas.height) * 400;

    // Send draw action to the server
    clientGame.sendDrawAction(
      tool,
      Math.round(scaledX),
      Math.round(scaledY),
      penColor,
      penSize
    );
  }

  // Mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseout", stopDrawing);

  // Touch events
  canvas.addEventListener("touchstart", startDrawing);
  canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("touchmove", draw);

  // -------------------------------
  // User Rendering (Dummy Data)
  // -------------------------------
  const users = [
    { name: "Player1", points: 0 },
    { name: "Player2", points: 20 },
    { name: "Player3", points: 15 },
  ];

  // Render the list of users
  renderUsers(users);

  // -------------------------------
  // Chat Functionality
  // -------------------------------

  /**
   * The send button element.
   * @type {HTMLButtonElement}
   */
  const sendButton = document.getElementById("sendButton");

  /**
   * The chat input <div>.
   * @type {HTMLElement}
   */
  const chatInputDiv = document.getElementById("chatMessage");

  /**
   * The container for chat messages.
   * @type {HTMLElement}
   */
  const chatMessages = document.querySelector(".chat-messages");

  /**
   * Initializes the chat with the necessary elements.
   * @type {Object}
   */
  const chat = initializeChat(
    clientGame,
    sendButton,
    chatInputDiv,
    chatMessages
  );

  // Initialize virtual keyboard with chat
  initializeVirtualKeyboard(chat);

  // Handle window resize to toggle editable state and keyboard visibility
  window.addEventListener(
    "resize",
    debounce(() => {
      const wasMobile =
        chatInputDiv.getAttribute("contenteditable") === "false";
      setChatInputEditable();

      const isNowMobile = isMobile();

      if (wasMobile !== isNowMobile) {
        hideKeyboard();
      }
    }, 200)
  );
});

function submitUsername(){
  _submitUsername(clientGame);
}

// Funktion für globale Erreichbarkeit im HTML
window.submitUsername = submitUsername;