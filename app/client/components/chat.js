// components/chat.js
"use strict";

let chatInstance = null;

/**
 * Initializes the chat instance.
 * @param {ClientGame} clientGame - The client game instance.
 * @param {HTMLElement} sendButton - The send button element.
 * @param {HTMLElement} chatInputDiv - The chat input <div>.
 * @param {HTMLElement} chatMessages - The container for chat messages.
 * @returns {Object} The chat object with sendMessage and other methods.
 */
function initializeChat(clientGame, sendButton, chatInputDiv, chatMessages) {
  if (chatInstance) {
    console.warn("Chat has already been initialized.");
    return chatInstance;
  }

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
      } catch (error) {
        console.error("Failed to send chat message:", error);
      }
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

  chatInstance = {
    sendMessage,
    addKeydownListener,
    removeKeydownListener,
    chatInputDiv, // Include chatInputDiv here
  };

  return chatInstance;
}

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

module.exports = { initializeChat, displayChatMessage };
