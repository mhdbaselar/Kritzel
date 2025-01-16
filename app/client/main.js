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
const {
  renderUsers,
  renderWordChoice,
  _submitUsername,
} = require("./components/userInterface");
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
clientGame.openWebSocket();

/**
 * Instance of the HexColorConverter class.
 * @type {HexColorConverter}
 */
const converter = new HexColorConverter();

let canDraw = false;

window.addEventListener("load", () => {
  
  // Übersetze UI beim Start
  clientGame.translateUI();

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
    if (clientGame.socket && clientGame.socket.readyState === WebSocket.OPEN) {
      clientGame.sendGetCanvasAction();
    }
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
    if (!clientGame.getCanDraw()) return;
    drawing = true;
    draw(event);
  }

  /**
   * Stops drawing on the canvas.
   */
  function stopDrawing() {
    if (!clientGame.getCanDraw()) return;
    drawing = false;
    ctx.beginPath();
    clientGame.sendDrawAction("pen", null, null, penColor, 0);
  }

  /**
   * Draws on the canvas based on the pointer position.
   * @param {Event} event - The event object for mouse or touch events.
   */

  function draw(event) {
    if (!clientGame.getCanDraw() || !drawing) return;

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
  // Word Choice List Rendering (Dummy Data)
  // -------------------------------

  // TODO mit Backend verknuepfen
  // Dummy Data in Form von wordChoiceList
  const wordChoiceList = ["Apfel", "Banane", "Kiwi"];
  renderWordChoice(wordChoiceList);

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

  // Language selector event listener
  document
    .getElementById("languageSelect")
    .addEventListener("change", (event) => {
      clientGame.setLanguage(event.target.value);
    });

  document
    .getElementById("languageSelect")
    .addEventListener("change", (event) => {
      clientGame.setLanguage(event.target.value);
    });

  const languageSelect = document.getElementById("languageSelect");
  languageSelect.addEventListener("change", function (event) {
    clientGame.setLanguage(event.target.value);
  });
  // Dynamic switch settings
  const switchInput = document.querySelector(
    ".lobby-create-content .switch input"
  );
  const codeInputField = document.getElementById("codeInput");
  const labelText = document.querySelector(".lobby-create-content .label-text");

  function toggleCodeInputVisibility() {
    if (switchInput.checked) {
      codeInputField.style.display = "none";
      labelText.textContent = "Öffentliche Lobby";
    } else {
      codeInputField.style.display = "block";
      labelText.textContent = "Private Lobby";
    }
  }
  toggleCodeInputVisibility();
  switchInput.addEventListener("change", toggleCodeInputVisibility);

  document.querySelector(".row").classList.add("hidden-background");
});

window.submitUsername = function () {
  //console.log("submitUsername aufgerufen");
  return _submitUsername(clientGame);
};

window.submitUsernameAndShowLobbyMenu = function () {
  // Username validieren und senden
  let isNameSet = submitUsername();

  if (isNameSet) {
    // Danach Modal schließen und Lobby-Liste anzeigen
    document.getElementById("usernameModal").style.display = "none";
    showLobbyMenu();
  }
};

window.submitUsernameAndShowCreateLobby = function () {
  // Username validieren und senden
  let isNameSet = submitUsername();

  if (isNameSet) {
    // Danach Modal schließen und Lobby-Einstellungen anzeigen
    document.getElementById("usernameModal").style.display = "none";
    showCreateLobby();
  }
};

function showLobbyMenu() {
  clientGame.sendGetLobbyListAction();
  // Zeigt nur das Lobby-Overlay an
  document.getElementById("lobbyJoin").style.display = "flex";
}

function hideLobbyMenu() {
  // Versteckt das Lobby-Overlay
  document.getElementById("lobbyJoin").style.display = "none";
}

function showCreateLobby() {
  // Zeigt nur das Lobby-Einstellungs-Overlay an
  document.getElementById("lobbyCreate").style.display = "flex";
}

function hideCreateLobby() {
  // Versteckt das Lobby-Einstellungs-Overlay
  document.getElementById("lobbyCreate").style.display = "none";
}
//Leave Lobby Button
window.leaveLobbyAndShowMenu = function () {
  clientGame.sendLeaveLobbyAction();
  //console.log("Leave Lobby Action gesendet");

  // Überprüfung, ob der Benutzername bereits gesetzt ist
  const usernameInput = document.getElementById("usernameInput");
  const username = usernameInput ? usernameInput.value.trim() : null;

  if (username && username.length >= 1) {
    //console.log("Benutzername ist gesetzt:", username);
    showLobbyMenu();
  } else {
    //console.log("Benutzername nicht gesetzt. Zeige Username-Modal an.");
    document.getElementById("usernameModal").style.display = "flex";
  }
  document.querySelector(".row").classList.add("hidden-background");
};
window.changeLanguage = function (language) {
  clientGame.setLanguage(language);
};
window.submitUsername = submitUsername;
window.renderUsers = renderUsers;
window.showLobbyMenu = showLobbyMenu;
window.hideLobbyMenu = hideLobbyMenu;
window.showCreateLobby = showCreateLobby;
window.hideCreateLobby = hideCreateLobby;

// Lobby erstellen Funktion
window.createLobby = function () {
  const lobbyName = document.getElementById("lobbyName").value;
  const roundCount = document.getElementById("roundCount").value;
  const roundTimer = document.getElementById("roundTimer").value;
  const playerCount = document.getElementById("playerCount").value;
  const codeInput = document.getElementById("codeInput").value;
  const isPublic = document.querySelector(
    ".lobby-create-content .switch input"
  ).checked;

  /** console.log(
    isPublic,
    codeInput,
    lobbyName,
    roundCount,
    roundTimer,
    playerCount
  ); */
  clientGame.sendCreateLobbyAction(
    isPublic,
    codeInput,
    lobbyName,
    roundCount,
    roundTimer,
    playerCount
  );
  hideCreateLobby();
};
//Funktioniert nicht, da wir keine Lobbies haben. Dummy Lobbies sind ein anderes Array
window.onRandomLobby = function () {
  clientGame.sendJoinRandomLobbyAction();
  hideLobbyMenu();
};

window.joinThisLobby = function (lobbyID, isPublic) {
  if (isPublic) {
    clientGame.sendJoinLobbyAction(lobbyID, null);
  } else {
    //console.log(document.getElementById(`codeInputField${lobbyID}`).value);
    clientGame.sendJoinLobbyAction(
      lobbyID,
      document.getElementById(`codeInputField${lobbyID}`).value
    );
  }
  hideLobbyMenu();
};

window.displayLobbyList = function (lobbyArray) {
  const lobbyListContainer = document.getElementById("lobbyListContainer");
  const randomLobbyButton = document.querySelector(".random-lobby-button");
  const createLobbyButton = document.querySelector(
    ".lobby-join-content button[onclick*='showCreateLobby']"
  );

  if (!lobbyListContainer) {
    console.error("lobbyListContainer not found");
    return;
  }

  // Wenn keine Lobbys vorhanden sind:
  if (!lobbyArray || lobbyArray.length === 0) {
    lobbyListContainer.innerHTML = `
      <p>Keine Lobbys vorhanden. Erstelle eine neue Lobby.</p>
      <button onclick="hideLobbyMenu(); showCreateLobby();">Lobby erstellen</button>
    `;

    // Die Buttons für "Zufällige Lobby beitreten" und "Lobby erstellen" ausblenden
    if (randomLobbyButton) {
      randomLobbyButton.style.display = "none";
    }
    if (createLobbyButton) {
      createLobbyButton.style.display = "none";
    }
    return;
  }

  // Die Buttons wieder einblenden, falls sie zuvor ausgeblendet waren
  if (randomLobbyButton) {
    randomLobbyButton.style.display = "inline-block";
  }
  if (createLobbyButton) {
    createLobbyButton.style.display = "inline-block";
  }
  let html = "";
  lobbyArray.forEach((lobby) => {
    html += `
      <div class="lobby-item">
        <h3>Lobby: ${lobby.lobbyName} ${lobby.isPublic ? "🌐" : "🔒"}</h3>
        <p>Spieler: ${lobby.currentPlayers}/${lobby.maxPlayers}</p>
        ${
          lobby.isPublic
            ? ""
            : `<input id="codeInputField${lobby.lobbyID}" type="text" placeholder="Lobby-Code">`
        }
        <button onclick="joinThisLobby(${lobby.lobbyID}, ${
      lobby.isPublic
    })">Beitreten</button>
      </div>
    `;
  });
  document.getElementById("lobbyListContainer").innerHTML = html;
};
window.reloadLobbyList = function () {
  console.log("Lobbyliste wird aktualisiert");
  clientGame.sendGetLobbyListAction();
};
// Result-Overlay
window.showResultOverlay = function (resultList) {
  console.log("Ergebnisliste wird angezeigt:", resultList);

  const overlay = document.getElementById("resultOverlay");
  const container = document.getElementById("resultListContainer");

  // Resultlist
  container.innerHTML = "";
  container.style.textAlign = "center";
  // Set heading for this round
  const heading = document.createElement("h2");
  heading.textContent = "Punkte für diese Runde";
  heading.style.textAlign = "left";
  container.appendChild(heading);

  resultList.forEach((result, index) => {
    const entry = document.createElement("div");
    entry.textContent = `${index + 1}. ${result.name} (+${
      result.pointsAdded
    } Punkte)`;
    entry.style.textAlign = "left";
    container.appendChild(entry);
  });

  // Overlay
  overlay.style.display = "block";
};

window.showEndGameResultOverlay = function (resultList) {
  console.log("Ergebnisliste wird angezeigt:", resultList);

  const overlay = document.getElementById("resultOverlay");
  const container = document.getElementById("resultListContainer");

  // Resultlist
  container.innerHTML = "";
  container.style.textAlign = "center";
  // Set heading for end game
  const heading = document.createElement("h2");
  heading.textContent = "Endstand";
  heading.style.textAlign = "left";
  container.appendChild(heading);

  resultList.forEach((result, index) => {
    const entry = document.createElement("div");
    entry.textContent = `${index + 1}. ${result.name} (${
      result.points
    } Punkte)`;
    entry.style.textAlign = "left";
    container.appendChild(entry);
  });

  // Overlay
  overlay.style.display = "block";
};

window.hideResultOverlay = function () {
  console.log("Ergebnisliste wird ausgeblendet");
  const overlay = document.getElementById("resultOverlay");
  overlay.style.display = "none";
};
// Update Rounds
window.updateRoundDisplay = function (current, total) {
  const roundsDisplay = document.getElementById("roundsDisplay");
  if (roundsDisplay) {
    roundsDisplay.textContent = `${current} von ${total}`;
    roundsDisplay.style.visibility = "visible";
  } else {
    console.error("Element für die Rundenanzeige nicht gefunden.");
  }
};
