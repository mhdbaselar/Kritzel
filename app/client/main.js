// main.js
"use strict";

// Import necessary modules
const ClientGame = require("./clientgame");
const { renderUsers, initializeChat } = require("./components/userInterface");
const { initializeToolbar } = require("./components/toolbar");
const {
  keyboard,
  showKeyboard,
  hideKeyboard,
  setChatInputEditable,
} = require("./components/virtualKeyboard");

// Initialize simple-keyboard's CSS (if using a bundler that supports CSS imports)

/**
 * @type {ClientGame}
 */
const clientGame = new ClientGame();

// Open WebSocket connection
clientGame.openWebSocket();

window.addEventListener("load", () => {
  // -------------------------------
  // Canvas Setup and Resizing
  // -------------------------------
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");

  const ASPECT_RATIO = 3 / 2; // Width : Height ratio = 3:2

  resizeCanvas();
  window.addEventListener("resize", debounce(resizeCanvasEvent, 200));

  function resizeCanvasEvent() {
    resizeCanvas();
    clientGame.sendGetCanvasAction();
  }

  function resizeCanvas() {
    const parentWidth = canvas.parentElement.clientWidth;
    const newWidth = parentWidth;
    const newHeight = newWidth / ASPECT_RATIO;

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    // Redraw preserved image after resizing
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0);

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

    syncChatHeight();
  }

  // Debounce function to limit the rate at which a function can fire.
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function syncChatHeight() {
    const chatMessages = document.querySelector(".chat-messages");
    const canvasHeight = canvas.clientHeight;

    if (window.innerWidth <= 850) {
      chatMessages.style.height = `${(canvasHeight - 20) / 2}px`;
    } else {
      chatMessages.style.height = `${canvasHeight - 20}px`;
    }
  }

  syncChatHeight();
  window.addEventListener("resize", debounce(syncChatHeight, 200));

  // -------------------------------
  // Drawing State Variables
  // -------------------------------
  let drawing = false;
  let tool = "pen";
  let penColor = "#000";
  let penSize = 3;

  // -------------------------------
  // Toolbar Initialization
  // -------------------------------
  function onPenSizeChange(newSize, button) {
    penSize = newSize;
    updatePenSettings();
    updateSelectedPenSizeButton(button);
  }

  function onPenColorChange(newColor, button) {
    penColor = newColor;
    updatePenSettings();
    updateSelectedColorButton(button);
  }

  function onToolChange(selectedTool, button) {
    selectTool(selectedTool);
  }

  function onClearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clientGame.sendClearAction();
  }

  function updatePenSettings() {
    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    console.log(`Pen settings updated: Size=${penSize}, Color=${penColor}`);
  }

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

  initializeToolbar({
    onPenSizeChange,
    onPenColorChange,
    onToolChange,
    onClearCanvas,
  });

  // Initialize the default selected pen size button
  const penSizeButtons = document.querySelectorAll(".pen-size-btn");
  const defaultPenSizeButton = Array.from(penSizeButtons).find(
    (ps) => parseInt(ps.dataset.size, 10) === penSize
  );
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

  function startDrawing(e) {
    drawing = true;
    draw(e);
  }

  function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    clientGame.sendDrawAction("pen", null, null, penColor, 0);
  }

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

  renderUsers(users);

  // -------------------------------
  // Chat Functionality
  // -------------------------------
  const sendButton = document.getElementById("sendButton");
  const chatInputDiv = document.getElementById("chatMessage");
  const chatMessages = document.querySelector(".chat-messages");

  // Initialize chat and capture sendMessage function and listener handlers
  const chat = initializeChat(sendButton, chatInputDiv, chatMessages);

  // Handle window resize to toggle editable state and keyboard visibility
  window.addEventListener(
    "resize",
    debounce(() => {
      const wasMobile =
        chatInputDiv.getAttribute("contenteditable") === "false";
      setChatInputEditable();
      const isNowMobile = isMobile();

      if (wasMobile !== isNowMobile) {
        if (isNowMobile) {
          hideKeyboard();
        } else {
          hideKeyboard();
        }
      }
    }, 200)
  );
});
