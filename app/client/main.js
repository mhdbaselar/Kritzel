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

  // "Clear Canvas" button
  const clearCanvasButton = document.getElementById("clearCanvas");
  clearCanvasButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clientGame.sendClearAction(); // Send clear action to server
  });

  // "Save Canvas" button (Optional)
  const saveCanvasButton = document.getElementById("saveCanvas");
  saveCanvasButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL();
    link.click();
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
    // Create a temporary canvas to store the current drawing
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    // Set the size of the temporary canvas to the current canvas size
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Draw the current canvas content onto the temporary canvas
    tempCtx.drawImage(canvas, 0, 0);

    // Calculate the new canvas size while maintaining aspect ratio
    const maxWidth = window.innerWidth * 0.5; // Max width is 50% of window width
    const maxHeight = window.innerHeight * 0.5; // Max height is 50% of window height

    let newWidth = maxWidth;
    let newHeight = newWidth / ASPECT_RATIO;

    // Adjust if height exceeds maxHeight
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * ASPECT_RATIO;
    }

    // Update the canvas size
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Scale the drawing to the new canvas size
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
  }

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
      "pen",
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
});
