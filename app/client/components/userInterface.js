
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
 * Initializes the chat functionality.
 * @param {HTMLElement} sendButton - The button element for sending messages.
 * @param {HTMLElement} chatInput - The input element for typing messages.
 * @param {HTMLElement} chatMessages - The container for displaying chat messages.
 */
function initializeChat(sendButton, chatInput, chatMessages) {
    sendButton.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (message !== "") {
            const messageDiv = document.createElement("div");
            messageDiv.textContent = `Player1: ${message}`;
            chatMessages.appendChild(messageDiv);
            chatInput.value = "";
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            sendButton.click();
        }
    });
}

module.exports = { renderUsers, initializeChat };