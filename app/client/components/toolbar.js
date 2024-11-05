/**
 * Initializes the toolbar by setting up event listeners for pen size, color, tools, and clear canvas.
 *
 * @file toolbar.js
 * @module toolbar
 *
 * @fileoverview This module initializes the toolbar by setting up event listeners for pen size, color, tools, and clear canvas.
 *
 * @exports initializeToolbar
 *
 */

"use strict";

/**
 * Initializes the toolbar by setting up event listeners for pen size, color, tools, and clear canvas.
 * @param {object} options - Configuration options with callback functions.
 * @param {function} options.onPenSizeChange - Callback when pen size changes.
 * @param {function} options.onPenColorChange - Callback when pen color changes.
 * @param {function} options.onToolChange - Callback when tool changes.
 * @param {function} options.onClearCanvas - Callback when clear canvas is triggered.
 */
function initializeToolbar({
  onPenSizeChange,
  onPenColorChange,
  onToolChange,
  onClearCanvas,
}) {
  // Initialize Pen Size Buttons
  const penSizeButtons = document.querySelectorAll(".pen-size-btn");
  penSizeButtons.forEach((button) => {
    const size = parseInt(button.dataset.size, 10);
    if (isNaN(size)) {
      console.error(`Invalid data-size attribute on pen size button:`, button);
      return;
    }
    button.addEventListener("click", () => {
      onPenSizeChange(size, button);
      setActiveButton(button, penSizeButtons, "selected");
    });
  });

  // Initialize Color Buttons
  const colorButtons = document.querySelectorAll(".color-button");
  colorButtons.forEach((button) => {
    const color = button.dataset.color;
    if (!color) {
      console.error(`Missing data-color attribute on color button:`, button);
      return;
    }
    button.addEventListener("click", () => {
      onPenColorChange(color, button);
      setActiveButton(button, colorButtons, "selected");
    });
  });

  // Initialize Tool Buttons
  const toolButtons = document.querySelectorAll(".tool-button");
  toolButtons.forEach((button) => {
    const tool = button.dataset.tool;
    if (!tool) {
      console.error(`Missing data-tool attribute on tool button:`, button);
      return;
    }
    button.addEventListener("click", () => {
      onToolChange(tool, button);
      setActiveButton(button, toolButtons, "selected-tool");
    });
  });

  // Initialize Clear Canvas Button
  const clearCanvasButton = document.querySelector(".clear-canvas-btn");
  if (clearCanvasButton) {
    clearCanvasButton.addEventListener("click", () => {
      onClearCanvas();
      // Optionally, provide visual feedback for clearing action
    });
  } else {
    console.error(
      'Clear Canvas button with class "clear-canvas-btn" not found.'
    );
  }
}

/**
 * Sets the active state for a group of buttons.
 * @param {HTMLElement} activeButton - The button to set as active.
 * @param {NodeListOf<Element>} buttonGroup - The group of buttons.
 * @param {string} activeClass - The class to add to the active button.
 */
function setActiveButton(activeButton, buttonGroup, activeClass) {
  buttonGroup.forEach((button) => {
    if (button === activeButton) {
      button.classList.add(activeClass);
    } else {
      button.classList.remove(activeClass);
    }
  });
}

// Export the functions
module.exports = {
  initializeToolbar,
};
