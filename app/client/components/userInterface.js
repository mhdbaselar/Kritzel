// components/userInterface.js

"use strict";
// -------------------------------
// user sidebar rendering
// -------------------------------

/**
 * Represents a user.
 * @typedef {Object} User
 * @property {string} name - The name of the user.
 * @property {number} points - The points of the user.
 */

/**
 * Renders the list of users on the screen.
 * @param {User[]} users
 */
function renderUsers(users) {
  const usersContainer = document.querySelector(".users-container");
  usersContainer.innerHTML = "";

  users.forEach((user) => {
    const userDiv = document.createElement("div");
    userDiv.classList.add("user");

    const nameDiv = document.createElement("div");
    nameDiv.classList.add("user-name");
    let icon = user.isDrawer ? " 🖌️" : "";
    nameDiv.textContent = user.name + icon;

    const pointsDiv = document.createElement("div");
    pointsDiv.classList.add("user-points");
    pointsDiv.textContent = `${user.points} Punkte`;

    userDiv.appendChild(nameDiv);
    userDiv.appendChild(pointsDiv);
    usersContainer.appendChild(userDiv);
  });
}

// Renders the list of the words to choose from on the screen
function renderWordChoice(words, clientGame) {
  const wordContainer = document.querySelector(".word-selection-popup");
  wordContainer.innerHTML = "";

  words.forEach((word) => {
    const wordDiv = document.createElement("div");
    wordDiv.classList.add("word-option");
    wordDiv.textContent = word;

    wordDiv.addEventListener("click", () => {
      clientGame.sendWordAction(word);
      console.log("Word selected: " + word);
      wordContainer.style.display = "none";
      // Allow drawing and show toolbar
      clientGame.setDrawingState(true);
    });

    wordContainer.appendChild(wordDiv);
  });
}
function renderTimer(timerData) {
  document.getElementById("timer").innerHTML =
    timerData.timetype + timerData.time;
}

// keywords: TESTING DELETE GAMESEQUENCE
function createStartGameButton(clientGame) {
  const startButtonContainer = document.querySelector(".start-game-button-div");
  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  startButton.addEventListener("click", () => {
    clientGame.sendGameStartAction();
  });
  startButtonContainer.appendChild(startButton);
  startButtonContainer.style.display = "none";
}

function displayStartGameButton(){
  const startButtonContainer = document.querySelector(".start-game-button-div");
  startButtonContainer.style.display = "flex";
}

// -------------------------------
// Chat functionality
// -------------------------------
/**
 * Displays a chat message in the chat container.
 * @param {HTMLElement} chatMessages - The container for chat messages.
 * @param {string} message - The message to display.
 * @param {string} senderCid - The sender of the message.
 */
function displayChatMessage(chatMessages, message, senderName = "") {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = `${senderName}: ${message}`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Displays a list of chat messages in the chat container.
 * @param {string} cid client unique id
 * @param {HTMLElement} chatMessages - The container element where chat messages will be displayed.
 * @param {Array} messageList - An array of message objects to be displayed. Each object should have `cid` and `message` properties.
 */
function displayChatMessageList(chatMessages, messageList) {
  messageList.forEach((message) => {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = `${message.name}: ${message.msg}`;
    chatMessages.appendChild(messageDiv);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Initializes the chat functionality by setting up event listeners
 * for sending messages via the send button and the Enter key from the virtual keyboard.
 *
 * for sending messages via the send button and the Enter key.
 * @param {ClientGame} clientGame clientGame interface
 * @param {HTMLElement} sendButton - The send button element.
 * @param {HTMLElement} chatInputDiv - The chat input <div>.
 * @param {HTMLElement} chatMessages - The container for chat messages.
 * @returns {Function} sendMessage - The function to send messages.
 */
function initializeChat(clientGame, sendButton, chatInputDiv, chatMessages) {
  /**
   * Sends a chat message if the input is not empty.
   */
  function sendMessage() {
    const message = chatInputDiv.textContent.trim();
    if (message !== "" && chatMessages) {
      displayChatMessage(chatMessages, message, "You");

      chatInputDiv.textContent = "";

      // Optionally, send the message to the server or WebSocket
      try {
        clientGame.sendChatAction(message);
      } catch (error) {}
    }
  }

  // Event listener for the send button click
  sendButton.addEventListener("click", sendMessage);

  // If chatInputDiv is contenteditable, add keydown listener for Enter key
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior (e.g., adding newline)
      sendMessage();
    }
  }

  // Function to add keydown listener
  function addKeydownListener() {
    chatInputDiv.addEventListener("keydown", handleKeyDown);
  }

  // Function to remove keydown listener
  function removeKeydownListener() {
    chatInputDiv.removeEventListener("keydown", handleKeyDown);
  }

  // Initialize based on current contenteditable state
  if (chatInputDiv.isContentEditable) {
    addKeydownListener();
  }

  // Return functions to manage listeners
  return { sendMessage, addKeydownListener, removeKeydownListener };
}

/**
 * Submits the username entered by the user and after that connect the client to the server.
 * @param {ClientGame} clientGame clientGame interface
 */
function _submitUsername(clientGame) {
  console.log("submitUsername function triggered"); // Test-Ausgabe
  const usernameInput = document.getElementById("usernameInput");
  const username = usernameInput.value.trim();
  if (username.length >= 1) {
    document.getElementById("usernameModal").style.display = "none";
    clientGame.sendNameAction(username);
    return true;
  } else {
    alert("Der Benutzername muss mindestens 1 Zeichen lang sein.");
    usernameInput.focus();
    return false;
  }
}
/** 
 * Würde doppelte startGameButton verhindern!

function createStartGameButton(clientGame) {
  console.log("createStartGameButton aufgerufen");
  const existingButton = document.querySelector(".start-game-button");
  if (existingButton) return;

  const startButtonContainer = document.querySelector(".users-column");
  if (!startButtonContainer) {
    console.error("startButtonContainer not found");
    return;
  }

  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  startButton.classList.add("start-game-button");

  startButton.addEventListener("click", () => {
    console.log("Start Game Button geklickt");
    clientGame.sendGameStartAction();
  });

  startButtonContainer.appendChild(startButton);
  console.log("Start Game Button wurde hinzugefügt");
}
  */

module.exports = {
  renderUsers,
  renderWordChoice,
  initializeChat,
  displayChatMessage,
  displayChatMessageList,
  _submitUsername,
  renderTimer,
  createStartGameButton,
  displayStartGameButton
};
