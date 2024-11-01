"use strict";

/**
 * @typedef {Object} User
 * @property {string} name - The name of the user.
 * @property {number} points - The points scored by the user.
 */

// Import the ClientGame module
const ClientGame = require("./clientgame");

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
  window.addEventListener("resize", resizeCanvas);

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

  /**
   * Syncs chat height to canvas height.
   */
  function syncChatHeight() {
    const chatMessages = document.querySelector(".chat-messages");
    const canvasHeight = canvas.clientHeight;
    chatMessages.style.height = `${canvasHeight - 20}px`;
  }

  syncChatHeight();

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
  // Pen Size Buttons Setup
  // -------------------------------

  const penSizes = [
    { size: 2, element: document.getElementById("penSize2") },
    { size: 3, element: document.getElementById("penSize3") },
    { size: 6, element: document.getElementById("penSize6") },
  ];

  const validPenSizes = penSizes.filter(ps => ps.element);

  if (validPenSizes.length !== penSizes.length) {
    console.error("One or more pen size buttons not found.");
  }

  validPenSizes.forEach(ps => {
    ps.element.addEventListener("click", () => {
      penSize = ps.size;
      updatePenSettings();
      updateSelectedPenSizeButton(ps.element);
    });
  });

  const penSizeButtons = validPenSizes.map(ps => ps.element);

  /**
   * Updates the pen settings (size and color).
   */
  function updatePenSettings() {
    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    console.log(`Pen settings updated: Size=${penSize}, Color=${penColor}`);
  }

  /**
   * Updates the selected pen size button.
   * @param {HTMLElement} selectedButton - The button element to select.
   */
  function updateSelectedPenSizeButton(selectedButton) {
    penSizeButtons.forEach(button => button.classList.remove("selected"));
    selectedButton.classList.add("selected");
    updateSelectedPenButtonColor(penColor);
  }

  /**
   * Updates the color of the selected pen size button.
   * @param {string} selectedColor - The color to apply to the selected button.
   */
  function updateSelectedPenButtonColor(selectedColor) {
    const selectedButton = document.querySelector(".pen-size-btn.selected");
    penSizeButtons.forEach(button => button.style.backgroundColor = "#ffffff");
    if (selectedButton) {
      selectedButton.style.backgroundColor = selectedColor;
    }
  }

  const defaultPenSizeButton = penSizes.find(ps => ps.size === penSize).element;
  updateSelectedPenSizeButton(defaultPenSizeButton);
  updateSelectedPenButtonColor(penColor);

  // -------------------------------
  // Color Buttons Setup
  // -------------------------------

  const colorButtons = document.querySelectorAll('.color-button');

  colorButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      penColor = e.target.getAttribute('data-color');
      updatePenSettings();
      updateSelectedPenButtonColor(penColor);
    });
  });

  // -------------------------------
  // Tool Selection Setup
  // -------------------------------

  const tools = {
    pen: document.getElementById("penTool"),
    eraser: document.getElementById("eraserTool"),
    fill: document.getElementById("fillTool"),
  };

  tools.pen.classList.add("selected-tool");

  Object.keys(tools).forEach((toolName) => {
    tools[toolName].addEventListener("click", () => selectTool(toolName));
  });

  /**
   * Selects a drawing tool.
   * @param {string} selectedTool - The tool to select ('pen', 'eraser', 'fill').
   */
  function selectTool(selectedTool) {
    Object.values(tools).forEach((icon) => icon.classList.remove("selected-tool"));
    tools[selectedTool].classList.add("selected-tool");
    tool = selectedTool;
  }

  // -------------------------------
  // Clear Canvas Button Setup
  // -------------------------------

  const clearCanvasButton = document.getElementById("clearCanvas");

  clearCanvasButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clientGame.sendClearAction();
  });

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

  /** @type {User[]} */
  const users = [
    { name: "Player1", points: 0 },
    { name: "Player2", points: 20 },
    { name: "Player3", points: 15 },
  ];

  /**
   * Renders the list of users on the screen.
   */
  function renderUsers() {
    const usersContainer = document.querySelector(".users-container");
    usersContainer.innerHTML = "";

    users.forEach((user) => {
      const userDiv = document.createElement("div");
      userDiv.classList.add("user");

      const nameDiv = document.createElement("div");
      nameDiv.classList.add("user-name");
      nameDiv.textContent = user.name;

      const pointsDiv = document.createElement("div");
      pointsDiv.classList.add("user-points");
      pointsDiv.textContent = `${user.points} Punkte`;

      userDiv.appendChild(nameDiv);
      userDiv.appendChild(pointsDiv);
      usersContainer.appendChild(userDiv);
    });
  }

  renderUsers();

  // -------------------------------
  // Chat Functionality
  // -------------------------------

  const sendButton = document.getElementById("sendButton");
  const chatInput = document.getElementById("chatMessage");
  const chatMessages = document.querySelector(".chat-messages");

  sendButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message !== "") {
      const messageDiv = document.createElement("div");
      messageDiv.textContent = `Player1: ${message}`;
      chatMessages.appendChild(messageDiv);
      chatInput.value = "";
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendButton.click();
    }
  });
});