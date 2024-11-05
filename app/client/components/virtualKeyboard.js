/**
 * Virtual Keyboard Module
 * This module provides a virtual keyboard for chat input on mobile devices.
 * It uses the simple-keyboard library for the virtual keyboard implementation.
 *
 * @file virtualKeyboard.js
 * @module virtualKeyboard
 *
 * @fileoverview This module provides a virtual keyboard for chat input on mobile devices.
 *
 * @requires simple-keyboard
 *
 * @exports initializeVirtualKeyboard
 * @exports keyboard
 * @exports showKeyboard
 * @exports hideKeyboard
 * @exports setChatInputEditable
 * @exports isMobile
 *
 */
"use strict";

/**
 * Simple Keyboard library for virtual keyboard implementation
 * @type {import("simple-keyboard").default}
 */
const Keyboard = require("simple-keyboard").default;

// Global variables
var chat = null;
var capsPressed = false;

/**
 * Virtual Keyboard instance
 * @type {Keyboard}
 */
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
  if (chat) {
    chat.chatInputDiv.textContent = input;
  }
}

/**
 * Function to handle key presses on the virtual keyboard
 * @param {string} button - The button that was pressed
 */
function onKeyPress(button) {
  console.log("Button pressed:", button);

  // Handle virtual Enter key press
  if (button === "{enter}") {
    console.log("Enter key pressed");
    if (chat) {
      const message = chat.chatInputDiv.textContent.trim();
      if (message === "") {
        console.log("Cannot send empty message");
        return;
      }
      chat.sendMessage(); // Send the message
      keyboard.clearInput(); // Clear the keyboard input
      chat.chatInputDiv.textContent = ""; // Clear the chat input
      hideKeyboard(); // Hide keyboard after sending
      chat.chatInputDiv.blur(); // Remove focus from input
    }
    return;
  }

  // Handle virtual Backspace key press
  if (button === "{bksp}") {
    console.log("Backspace key pressed");
    return;
  }

  // Handle virtual Space key press
  if (button === "{back}") {
    console.log("Back button pressed");
    // Implement back navigation logic here
    // For example, navigate to a previous page or close the chat
    window.history.back(); // Example: Go back to the previous page
    return;
  }

  // Handle virtual Caps Lock key press
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
 * This function is called when the chat input is clicked on mobile devices
 */
function showKeyboard() {
  if (isMobile()) {
    // Mobile check
    keyboardContainer.style.display = "block";
    if (chat) {
      keyboard.setInput(chat.chatInputDiv.textContent); // Initialize keyboard input with current chat input value
    }
  }
}

/**
 * Function to hide the virtual keyboard
 * This function is called when the user taps outside the keyboard or input
 */
function hideKeyboard() {
  keyboardContainer.style.display = "none";
}

/**
 * Simple Keyboard container element
 * @type {HTMLElement}
 */
const keyboardContainer = document.querySelector(".simple-keyboard");

// Hide keyboard initially
keyboardContainer.style.display = "none";

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
 * This function disables the chat input on mobile devices
 * to prevent the device's default keyboard from showing
 * and enables it on desktop devices.
 */
function setChatInputEditable() {
  if (isMobile()) {
    if (chat) {
      chat.chatInputDiv.setAttribute("contenteditable", "false");
      chat.chatInputDiv.classList.remove("editable");
      chat.chatInputDiv.textContent = "";
      chat.removeKeydownListener();
    }
  } else {
    if (chat) {
      chat.chatInputDiv.setAttribute("contenteditable", "true");
      chat.chatInputDiv.classList.add("editable");
      chat.addKeydownListener();
    }
  }
}

/**
 * Function to handle chat input click/focus events
 * This function is called when the chat input is clicked or focused
 * @param {Event} event - The click or focus event
 */
function handleChatInputClick(event) {
  if (isMobile()) {
    event.preventDefault(); // Prevent any default behavior
    showKeyboard();
  } else {
    // For desktop, focus the chat input div to allow typing
    chat.chatInputDiv.focus();
  }
}

/**
 * Initializes the virtual keyboard with the provided chat instance
 * @param {Chat} chatInstance - The chat instance
 */
function initializeVirtualKeyboard(chatInstance) {
  chat = chatInstance;

  // Initial setup for chat input
  setChatInputEditable();
  if (isMobile()) {
    hideKeyboard();
  }

  // Event listener for chat input click/focus
  chat.chatInputDiv.addEventListener("click", handleChatInputClick);
  chat.chatInputDiv.addEventListener("focus", handleChatInputClick);

  // Hide the keyboard when tapping outside the keyboard or input
  document.addEventListener("click", (event) => {
    if (
      !keyboardContainer.contains(event.target) &&
      event.target !== chat.chatInputDiv
    ) {
      hideKeyboard();
    }
  });
}

// Export the virtual keyboard module functions
module.exports = {
  initializeVirtualKeyboard,
  keyboard,
  showKeyboard,
  hideKeyboard,
  setChatInputEditable,
  isMobile,
};
