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
 * for sending messages via the send button and the Enter key.
 * @param {ClientGame} clientGame clientGame interface
 * @param {HTMLElement} sendButton - The send button element.
 * @param {HTMLInputElement} chatInput - The chat input element.
 * @param {HTMLElement} chatMessages - The container for chat messages.
 * @returns {Function} sendMessage - The function to send messages.
 */
function initializeChat(clientGame, sendButton, chatInput, chatMessages) {
    /**
     * Sends a chat message if the input is not empty.
     */
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message !== "") {
            const messageDiv = document.createElement("div");
            messageDiv.textContent = `Player1: ${message}`;
            chatMessages.appendChild(messageDiv);
            chatInput.value = "";
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Optionally, send the message to the server or WebSocket
            clientGame.sendChatAction(message);
        }
    }

    // Event listener for the send button click
    sendButton.addEventListener("click", sendMessage);

    // Event listener for Enter key on the physical keyboard
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default behavior (e.g., form submission)
            sendMessage();
        }
    });

    return sendMessage;
}


module.exports = { renderUsers, initializeChat };