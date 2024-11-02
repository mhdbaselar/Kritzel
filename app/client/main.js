// main.js
"use strict";

/**
 * @typedef {Object} User
 * @property {string} name - The name of the user.
 * @property {number} points - The points scored by the user.
 */

// Import the ClientGame module
const ClientGame = require("./clientgame");

// Import interface tools
const { renderUsers, initializeChat } = require('./components/userInterface');

// Import toolbar functionalities
const { initializeToolbar } = require('./components/toolbar');

/** 
 * @type {ClientGame} 
 */
const clientGame = new ClientGame();

clientGame.openWebSocket();

window.addEventListener("load", () => {
  // -------------------------------
  // Canvas Setup and Resizing
  // -------------------------------

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("drawingCanvas");
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext("2d");

  /** @constant {number} */
  const ASPECT_RATIO = 3 / 2; // Width : Height ratio = 3:2

  resizeCanvas();
  window.addEventListener("resize", resizeCanvasEvent);

  function resizeCanvasEvent() {
    resizeCanvas();
    clientGame.sendGetCanvasAction();
  }

  /**
   * Resizes the canvas based on the window size.
   */
  function resizeCanvas() {
    const parentWidth = canvas.parentElement.clientWidth;
    const newWidth = parentWidth;
    const newHeight = newWidth / ASPECT_RATIO;

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    // Redraw preserved image after resizing
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);

    syncChatHeight();
  }

  function syncChatHeight() {
    const chatMessages = document.querySelector(".chat-messages");
    const canvasHeight = canvas.clientHeight;

    // Check if the screen width is less than or equal to 850px (mobile)
    if (window.innerWidth <= 850) {
      // Set chat height to half of the current calculated height for mobile
      chatMessages.style.height = `${(canvasHeight - 20) / 2}px`;
    } else {
      // Set chat height to match canvas height for larger screens
      chatMessages.style.height = `${canvasHeight - 20}px`;
    }
  }

  // Call syncChatHeight initially and on window resize
  syncChatHeight();
  window.addEventListener("resize", syncChatHeight);

  // -------------------------------
  // Drawing State Variables
  // -------------------------------

  /** @type {boolean} */
  let drawing = false;
  /** @type {string} */
  let tool = 'pen';
  /** @type {string} */
  let penColor = '#000';
  /** @type {number} */
  let penSize = 3;

  // -------------------------------
  // Toolbar Initialization
  // -------------------------------

  /**
   * Callback when pen size changes.
   * @param {number} newSize - The new pen size.
   * @param {HTMLElement} button - The button element that was clicked.
   */
  function onPenSizeChange(newSize, button) {
    penSize = newSize;
    updatePenSettings();
    updateSelectedPenSizeButton(button);
  }

  /**
   * Callback when pen color changes.
   * @param {string} newColor - The new pen color.
   * @param {HTMLElement} button - The button element that was clicked.
   */
  function onPenColorChange(newColor, button) {
    penColor = newColor;
    updatePenSettings();
    updateSelectedColorButton(button);
  }

  /**
   * Callback when tool changes.
   * @param {string} selectedTool - The tool to select ('pen', 'eraser', 'fill').
   * @param {HTMLElement} button - The tool button element that was clicked.
   */
  function onToolChange(selectedTool, button) {
    selectTool(selectedTool);
  }

  /**
   * Callback when clear canvas is triggered.
   */
  function onClearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clientGame.sendClearAction();
  }

  /**
   * Updates the pen settings (size and color) on the canvas context.
   */
  function updatePenSettings() {
    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    console.log(`Pen settings updated: Size=${penSize}, Color=${penColor}`);
  }

  /**
   * Updates the selected pen size button UI.
   * @param {HTMLElement} selectedButton - The button element to mark as selected.
   */
  function updateSelectedPenSizeButton(selectedButton) {
    const penSizeButtons = document.querySelectorAll('.pen-size-btn');
    penSizeButtons.forEach(button => {
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
   * Updates the selected color button UI.
   * @param {HTMLElement} selectedButton - The color button element to mark as selected.
   */
  function updateSelectedColorButton(selectedButton) {
    const colorButtons = document.querySelectorAll('.color-button');
    colorButtons.forEach(button => {
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
   * Selects a drawing tool.
   * @param {string} selectedTool - The tool to select ('pen', 'eraser', 'fill').
   */
  function selectTool(selectedTool) {
    const toolButtons = document.querySelectorAll('.tool-button');
    toolButtons.forEach(button => {
      if (button.dataset.tool === selectedTool) {
        button.classList.add("selected-tool");
      } else {
        button.classList.remove("selected-tool");
      }
    });
    tool = selectedTool;
    console.log(`Tool selected: ${tool}`);
  }

  // Initialize toolbar with callbacks
  initializeToolbar({
    onPenSizeChange,
    onPenColorChange,
    onToolChange,
    onClearCanvas,
  });

  // -------------------------------
  // Initialize the default selected pen size button
  // -------------------------------
  const penSizeButtons = document.querySelectorAll('.pen-size-btn');
  const defaultPenSizeButton = Array.from(penSizeButtons).find(ps => parseInt(ps.dataset.size, 10) === penSize);
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
   * Gets the mouse or touch position relative to the canvas.
   * @param {MouseEvent | TouchEvent} e - The event to get the position from.
   * @returns {{x: number, y: number}} The x and y coordinates on the canvas.
   */
  function getPointerPosition(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    x *= canvas.width / rect.width;
    y *= canvas.height / rect.height;

    return { x, y };
  }

  /**
   * Starts drawing on the canvas.
   * @param {MouseEvent | TouchEvent} e - The event to start drawing from.
   */
  function startDrawing(e) {
    drawing = true;
    draw(e);
  }

  /**
   * Stops drawing on the canvas.
   */
  function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    clientGame.sendDrawAction('pen', null, null, penColor, 0);
  }

  /**
   * Draws on the canvas.
   * @param {MouseEvent | TouchEvent} e - The event to draw from.
   */
  function draw(e) {
    if (!drawing) return;

    e.preventDefault();

    ctx.lineWidth = penSize * 1.3;
    ctx.lineCap = "round";
    ctx.strokeStyle = penColor;

    const pos = getPointerPosition(e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    const scaledX = (pos.x / canvas.width) * 600;
    const scaledY = (pos.y / canvas.height) * 400;
    clientGame.sendDrawAction(tool, Math.round(scaledX), Math.round(scaledY), penColor, penSize);
  }

  // Mouse events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch events
  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchend', stopDrawing);
  canvas.addEventListener('touchmove', draw);

  // -------------------------------
  // User Rendering (Dummy Data)
  // -------------------------------

  /** @type {User[]} */
  const users = [
    { name: "Player1", points: 0 },
    { name: "Player2", points: 20 },
    { name: "Player3", points: 15 },
  ];

  renderUsers(users);

  // -------------------------------
  // Chat Functionality
  // -------------------------------

  const sendButton = document.getElementById("sendButton");
  const chatInput = document.getElementById("chatMessage");
  const chatMessages = document.querySelector(".chat-messages");

  initializeChat(sendButton, chatInput, chatMessages);
});