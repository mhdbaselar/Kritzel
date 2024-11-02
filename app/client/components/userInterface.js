// components/userInterface.js

// -------------------------------
// user sidebar rendering
// -------------------------------

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
 * Initializes the chat functionality by setting up event listeners
 * for sending messages via the send button and the Enter key from the virtual keyboard.
 * 
 * @param {HTMLElement} sendButton - The send button element.
 * @param {HTMLElement} chatInputDiv - The chat input <div>.
 * @param {HTMLElement} chatMessages - The container for chat messages.
 * @returns {Function} sendMessage - The function to send messages.
 */
function initializeChat(sendButton, chatInputDiv, chatMessages) {
    /**
     * Sends a chat message if the input is not empty.
     */
    function sendMessage() {
        const message = chatInputDiv.textContent.trim();
        if (message !== "") {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");

            const senderSpan = document.createElement("span");
            senderSpan.classList.add("message-sender");
            senderSpan.textContent = "Player1: ";

            const textSpan = document.createElement("span");
            textSpan.classList.add("message-text");
            textSpan.textContent = message;

            messageDiv.appendChild(senderSpan);
            messageDiv.appendChild(textSpan);
            chatMessages.appendChild(messageDiv);
            chatInputDiv.textContent = "";
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Optionally, send the message to the server or WebSocket
            // clientGame.sendChatMessage(message);
        }
    }

    // Event listener for the send button click
    sendButton.addEventListener("click", sendMessage);

    // Since chatInputDiv is not contenteditable, we don't need to handle physical Enter key presses
    // All message sending is handled via the virtual keyboard's Enter key

    return sendMessage;
}


module.exports = { renderUsers, initializeChat };