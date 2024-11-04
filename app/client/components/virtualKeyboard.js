const Keyboard = require("simple-keyboard").default;

const { initializeChat } = require("./userInterface");

const sendButton = document.getElementById("sendButton");
const chatInputDiv = document.getElementById("chatMessage");
const chatMessages = document.querySelector(".chat-messages");

// Initialize chat and capture sendMessage function and listener handlers
const chat = initializeChat(sendButton, chatInputDiv, chatMessages);

let capsPressed = false;

const keyboardContainer = document.querySelector(".simple-keyboard");

// Initialize simple-keyboard with event handlers within the constructor
const keyboard = new Keyboard({
  onChange: (input) => onChange(input),
  onKeyPress: (button) => onKeyPress(button),
  theme: "hg-theme-default hg-layout-default",
  layout: {
    default: [
      "q w e r t z u i o p ü + {bksp}",
      "a s d f g h j k l ö ä #",
      "{capslock} y x c v b n m , . -",
      "{back} {space} {enter}",
    ],
    uppercase: [
      "Q W E R T Z U I O P Ü + {bksp}",
      "A S D F G H J K L Ö Ä #",
      "{capslock} Y X C V B N M , . -",
      "{back} {space} {enter}",
    ],
  },
  display: {
    "{bksp}": "⌫",
    "{enter}": "Enter",
    "{capslock}": "Caps",
    "{space}": "Space",
    "{back}": "←", // Back arrow symbol
  },
});

/**
 * Function to handle changes in the virtual keyboard input
 * @param {string} input - The current input from the keyboard
 */
function onChange(input) {
  console.log("Input changed:", input);
  chatInputDiv.textContent = input;
}

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
    chat.sendMessage();
    keyboard.clearInput();
    chatInputDiv.textContent = ""; // Clear the chat input
    hideKeyboard(); // Hide keyboard after sending
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

/**
 * Function to show the virtual keyboard
 */
function showKeyboard() {
  if (isMobile()) {
    // Mobile check
    keyboardContainer.style.display = "block";
    keyboard.setInput(chatInputDiv.textContent); // Initialize keyboard input with current chat input value
  }
}

/**
 * Function to hide the virtual keyboard
 */
function hideKeyboard() {
  keyboardContainer.style.display = "none";
}

// -------------------------------
// Device Detection and Chat Input Handling
// -------------------------------

/**
 * Function to detect if the device is mobile based on viewport width
 * @returns {boolean} - True if mobile, false otherwise
 */
function isMobile() {
  return window.innerWidth <= 850;
}

/**
 * Function to set the chat input's editable state based on device
 */
function setChatInputEditable() {
  if (isMobile()) {
    chatInputDiv.setAttribute("contenteditable", "false");
    chatInputDiv.classList.remove("editable");
    // Optionally, clear any physical input
    chatInputDiv.textContent = "";
    chat.removeKeydownListener();
  } else {
    chatInputDiv.setAttribute("contenteditable", "true");
    chatInputDiv.classList.add("editable");
    chat.addKeydownListener();
  }
}

/**
 * Function to handle chat input click/focus
 */
function handleChatInputClick(event) {
  if (isMobile()) {
    event.preventDefault(); // Prevent any default behavior
    showKeyboard();
  } else {
    // For desktop, focus the chat input div to allow typing
    chatInputDiv.focus();
  }
}

// Initial setup
setChatInputEditable();
if (isMobile()) {
  hideKeyboard(); // Ensure it's hidden initially on mobile
}

// Event listener for chat input click/focus
chatInputDiv.addEventListener("click", handleChatInputClick);
chatInputDiv.addEventListener("focus", handleChatInputClick);

// Hide the keyboard when tapping outside the keyboard or input
document.addEventListener("click", (event) => {
  if (
    !keyboardContainer.contains(event.target) &&
    event.target !== chatInputDiv
  ) {
    hideKeyboard();
  }
});

module.exports = { keyboard, showKeyboard, hideKeyboard, setChatInputEditable };
