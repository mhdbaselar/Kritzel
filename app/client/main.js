// main.js
"use strict";

const ClientGame = require("./clientgame");

let clientGame = new ClientGame();
clientGame.openWebSocket();

window.addEventListener("load", () => {
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");

  const ASPECT_RATIO = 3 / 2; // width : height = 3:2

  resizeCanvas();

  let drawing = false;
  let tool = 'pen'
  let penColor = document.getElementById("colorPicker").value;
  let penSize = document.getElementById("penSize").value;

  // Toolbar elements
  const colorPicker = document.getElementById("colorPicker");
  const penSizeInput = document.getElementById("penSize");

  colorPicker.addEventListener("input", (e) => {
    penColor = e.target.value;
  });

  penSizeInput.addEventListener("input", (e) => {
    penSize = e.target.value;
  });

  // Define available tools and add event listeners to each
  const tools = {
    pen: document.getElementById("penTool"),
    eraser: document.getElementById("eraserTool"),
    fill: document.getElementById("fillTool"),
  };

  // Add the .selected-tool class to the default tool (pen) on load
  tools.pen.classList.add("selected-tool");

  Object.keys(tools).forEach((toolName) => {
    tools[toolName].addEventListener("click", () => selectTool(toolName));
  });

  function selectTool(selectedTool) {
    // Remove .selected-tool class from previously selected tool
    Object.values(tools).forEach((icon) => {
      icon.classList.remove("selected-tool");
    });

    // Add .selected-tool class to the new selected tool
    tools[selectedTool].classList.add("selected-tool");

    // Update the global `tool` variable
    tool = selectedTool;
    console.log("Selected tool:", tool);
  }


  // "Clear Canvas" button
  const clearCanvasButton = document.getElementById("clearCanvas");
  clearCanvasButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clientGame.sendClearAction(); // Send clear action to server
  });

  // Mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseout", stopDrawing);

  // Touch events
  canvas.addEventListener("touchstart", startDrawing);
  canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("touchmove", draw);

  window.addEventListener("resize", resizeCanvas);

  function resizeCanvas() {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    // Preserve the current drawing
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    // Get column width to resize canvas
    const columnWidth = canvas.parentElement.clientWidth;
    const newWidth = columnWidth;
    const newHeight = newWidth / ASPECT_RATIO;

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Draw preserved image onto resized canvas
    ctx.drawImage(
      tempCanvas,
      0, 0, tempCanvas.width, tempCanvas.height,
      0, 0, canvas.width, canvas.height
    );

    syncChatHeight();
  }

  // Sync Chat height to canvas height
  function syncChatHeight() {
    const chatMessages = document.querySelector(".chat-messages");
    const canvasHeight = canvas.clientHeight; // Get the canvas height in pixels

    // Set the height of chat-messages to match canvas height
    chatMessages.style.height = canvasHeight - 20 + "px";
  }

  // Initial Sync of Chat height
  syncChatHeight();


  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    return { x, y };
  }

  function startDrawing(e) {
    drawing = true;
    draw(e); // Draw point
  }

  function stopDrawing() {
    drawing = false;
    ctx.beginPath();
  }

  function draw(e) {
    if (!drawing) return;
    console.log("Current tool:", tool);

    e.preventDefault(); // Prevent scrolling on touch devices

    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = penColor;

    const pos = getMousePos(e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    // Send draw action to server with scaled coordinates
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

  // Mouse position for debugging
  const mousePositionDiv = document.getElementById("mousePosition");

  // Update mouse position on mouse move
  canvas.addEventListener("mousemove", updateMousePosition);
  canvas.addEventListener("mouseenter", updateMousePosition);
  canvas.addEventListener("mouseleave", clearMousePosition);

  canvas.addEventListener("mousedown", () => {
    mousePositionDiv.style.background = "#1af601";
  });

  canvas.addEventListener("mouseup", () => {
    mousePositionDiv.style.background = "#fff";
  });

  canvas.addEventListener("mouseleave", () => {
    mousePositionDiv.style.background = "#fff";
  });

  // Update mouse position on touch move
  canvas.addEventListener("touchmove", updateMousePosition);
  canvas.addEventListener("touchstart", updateMousePosition);
  canvas.addEventListener("touchend", clearMousePosition);

  function updateMousePosition(e) {
    const pos = getMousePos(e);

    // Calculate scaled positions based on 600x400 grid
    const scaledX = (pos.x / canvas.width) * 600;
    const scaledY = (pos.y / canvas.height) * 400;

    // Round to two decimal places
    const roundedX = Math.round(scaledX * 100) / 100;
    const roundedY = Math.round(scaledY * 100) / 100;

    // Update the text content with formatted string
    mousePositionDiv.textContent = `Color: ${penColor}, PenSize: ${penSize},  X: ${roundedX}, Y: ${roundedY}`;
  }

  function clearMousePosition() {
    mousePositionDiv.textContent = "";
  }

  // Dummy data für users
  const users = [
    { name: "Player1", points: 0 },
    { name: "Player2", points: 20 },
    { name: "Player3", points: 15 },
  ];

  // Render User
  function renderUsers() {
    const usersContainer = document.querySelector(".users-container");
    usersContainer.innerHTML = ""; // Clear existing content

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

  // Init Users
  renderUsers();

  // chat
  const sendButton = document.getElementById("sendButton");
  const chatInput = document.getElementById("chatMessage");
  const chatMessages = document.querySelector(".chat-messages");

  sendButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message !== "") {
      const messageDiv = document.createElement("div");
      messageDiv.textContent = 'Player1: ' + message; // Username ist hier hardcoded erstmal
      chatMessages.appendChild(messageDiv);
      chatInput.value = "";
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });

  // Send message on Enter key press
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendButton.click();
    }
  });
});

