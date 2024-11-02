// main.js
"use strict";

// Import necessary modules
const ClientGame = require("./clientgame");
const { renderUsers, initializeChat } = require('./components/userInterface');
const { initializeToolbar } = require('./components/toolbar');
const Keyboard = require('simple-keyboard').default;

// Initialize simple-keyboard's CSS (if using a bundler that supports CSS imports)

/** 
 * @type {ClientGame} 
 */
const clientGame = new ClientGame();

clientGame.openWebSocket();

window.addEventListener("load", () => {
  // -------------------------------
  // Canvas Setup and Resizing
  // -------------------------------
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");

  const ASPECT_RATIO = 3 / 2; // Width : Height ratio = 3:2

  resizeCanvas();
  window.addEventListener("resize", resizeCanvasEvent);

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

    if (window.innerWidth <= 850) {
      chatMessages.style.height = `${(canvasHeight - 20) / 2}px`;
    } else {
      chatMessages.style.height = `${canvasHeight - 20}px`;
    }
  }

  syncChatHeight();
  window.addEventListener("resize", syncChatHeight);

  // -------------------------------
  // Drawing State Variables
  // -------------------------------
  let drawing = false;
  let tool = 'pen';
  let penColor = '#000';
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

  initializeToolbar({
    onPenSizeChange,
    onPenColorChange,
    onToolChange,
    onClearCanvas,
  });

  // Initialize the default selected pen size button
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
    clientGame.sendDrawAction('pen', null, null, penColor, 0);
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
  const chatInputDiv = document.getElementById("chatMessage"); // This is now a <div>
  const chatMessages = document.querySelector(".chat-messages");

  // Initialize chat and capture sendMessage function
  const sendMessage = initializeChat(sendButton, chatInputDiv, chatMessages);

  // -------------------------------
  // Initialize Virtual Keyboard
  // -------------------------------
  const keyboardContainer = document.querySelector(".simple-keyboard");

  // Hide keyboard initially
  keyboardContainer.style.display = "none";

  // Initialize simple-keyboard with event handlers within the constructor
  const keyboard = new Keyboard({
    onChange: input => onChange(input),
    onKeyPress: button => onKeyPress(button),
    theme: "hg-theme-default hg-layout-default",
    layout: {
      default: [
        "q w e r t z u i o p ü + {bksp}",
        "a s d f g h j k l ö ä #",
        "{capslock} y x c v b n m , . -",
        "{back} {space} {enter}"
      ],
      uppercase: [
        "Q W E R T Z U I O P Ü + {bksp}",
        "A S D F G H J K L Ö Ä #",
        "{capslock} Y X C V B N M , . -",
        "{back} {space} {enter}"
      ]
    },
    display: {
      "{bksp}": "⌫",
      "{enter}": "Enter",
      "{capslock}": "Caps",
      "{space}": "Space",
      "{back}": "←" // Back arrow symbol
    }
  });

  /**
   * Function to handle changes in the virtual keyboard input
   * @param {string} input - The current input from the keyboard
   */
  function onChange(input) {
    console.log("Input changed:", input);
    chatInputDiv.textContent = input;
  }

  let capsPressed = false;
  /**
   * Function to handle key presses on the virtual keyboard
   * @param {string} button - The button that was pressed
   */
  function onKeyPress(button) {
    console.log("Button pressed:", button);

    if (button === "{enter}") {
      console.log("Enter key pressed");
      const message = chatInputDiv.textContent.trim();
      if (message === "") {
        console.log("Cannot send empty message");
        return;
      }
      sendMessage();
      keyboard.clearInput();
      chatInputDiv.textContent = ""; // Clear the chat input
      keyboardContainer.style.display = "none"; // Hide keyboard after sending
      chatInputDiv.blur(); // Remove focus from input
      return;
    }

    if (button === "{bksp}") {
      console.log("Backspace key pressed");
      // No additional handling needed; onChange will update the input
      return;
    }

    if (button === "{back}") {
      console.log("Back button pressed");
      // Implement back navigation logic here
      // For example, navigate to a previous page or close the chat
      window.history.back(); // Example: Go back to the previous page
      return;
    }

    if (button === "{capslock}") {
      toggleCapsLock();
      return;
    }

    // If Caps Lock was pressed, toggle it off after the next key press
    if (capsPressed && button !== "{capslock}") {
      toggleCapsLock();
      const capsButton = keyboard.getButtonElement("{capslock}");
      if (capsButton) {
        capsButton.classList.remove("active-capslock");
      }
      capsPressed = false;
    }
  }

  /**
   * Toggles Caps Lock by switching between 'default' and 'uppercase' layouts
   */
  function toggleCapsLock() {
    const currentLayout = keyboard.options.layoutName;
    const newLayout = currentLayout === "default" ? "uppercase" : "default";
    keyboard.setOptions({ layoutName: newLayout });

    // Update the Caps Lock key's appearance
    const capsButton = keyboard.getButtonElement("{capslock}");
    if (capsButton) {
      capsPressed = true;
      capsButton.classList.toggle("active-capslock");
    }
  }

  // -------------------------------
  // Prevent the native keyboard from showing on mobile
  // -------------------------------

  /**
   * Function to detect if the device is mobile based on viewport width
   * @returns {boolean} - True if mobile, false otherwise
   */
  function isMobile() {
    return window.innerWidth <= 850;
  }

  // Handle touch/click events on the chat input div
  chatInputDiv.addEventListener("click", (event) => {
    if (isMobile()) {
      event.preventDefault(); // Prevent any default behavior
      showKeyboard();
    }
  });

  /**
   * Shows the virtual keyboard.
   */
  function showKeyboard() {
    if (isMobile()) { // Mobile check
      keyboardContainer.style.display = "block";
      keyboard.setInput(chatInputDiv.textContent); // Initialize keyboard input with current chat input value
    }
  }

  // Hide the keyboard when tapping outside the keyboard or input
  document.addEventListener("click", (event) => {
    if (!keyboardContainer.contains(event.target) && event.target !== chatInputDiv) {
      keyboardContainer.style.display = "none";
    }
  });

  // Update virtual keyboard's visibility on window resize
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      keyboardContainer.style.display = "none";
    }
  });
});