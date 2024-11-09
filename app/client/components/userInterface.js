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
        nameDiv.textContent = user.name;

        const pointsDiv = document.createElement("div");
        pointsDiv.classList.add("user-points");
        pointsDiv.textContent = `${user.points} Punkte`;

        userDiv.appendChild(nameDiv);
        userDiv.appendChild(pointsDiv);
        usersContainer.appendChild(userDiv);
    });
}


// -------------------------------
// Chat functionality
// -------------------------------
/**
 * Displays a chat message in the chat container.
 * @param {HTMLElement} chatMessages - The container for chat messages.
 * @param {string} message - The message to display.
 * @param {string} sender - The sender of the message.
 */
function displayChatMessage(chatMessages, message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = `${sender}: ${message}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Displays a list of chat messages in the chat container.
 * @param {string} cid client unique id 
 * @param {HTMLElement} chatMessages - The container element where chat messages will be displayed.
 * @param {Array} messageList - An array of message objects to be displayed. Each object should have `cid` and `message` properties.
 */
function displayChatMessageList(chatMessages, messageList, cid){
    const parseCookie = str =>
        str
          .split(';')
          .map(v => v.split('='))
          .reduce((acc, v) => {
            acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
            return acc;
          }, {});

    let cookieCid = parseCookie(document.cookie)['cid'];
    
    messageList.forEach(message => {
        let name = message.cid;
        if(cid == cookieCid && cookieCid == name){
            name = 'You';
        }
        const messageDiv = document.createElement("div");
        messageDiv.textContent = `${name}: ${message.msg}`;
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
            try{
                clientGame.sendChatAction(message);
            } catch(error) {}
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


module.exports = { renderUsers, initializeChat, displayChatMessage, displayChatMessageList };