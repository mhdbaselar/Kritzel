// /components/toolbar.js
"use strict";

/**
 * Initializes pen size buttons by attaching event listeners and setting up initial states.
 * @param {number[]} sizes - An array of pen sizes to initialize.
 * @param {function} onPenSizeChange - Callback function to handle pen size changes.
 * @returns {HTMLElement[]} - Array of valid pen size button elements.
 */
function initializePenSizeButtons(sizes, onPenSizeChange) {
    const penSizeButtons = [];

    sizes.forEach(size => {
        const button = document.getElementById(`penSize${size}`);
        if (!button) {
            console.error(`Pen size button with ID "penSize${size}" not found.`);
            return;
        }

        button.addEventListener("click", () => {
            onPenSizeChange(size, button);
        });

        penSizeButtons.push(button);
    });

    if (penSizeButtons.length !== sizes.length) {
        console.error("One or more pen size buttons were not initialized.");
    }

    return penSizeButtons;
}

/**
 * Initializes color buttons by attaching event listeners.
 * @param {function} onPenColorChange - Callback function to handle pen color changes.
 * @returns {NodeListOf<Element>} - NodeList of color button elements.
 */
function initializeColorButtons(onPenColorChange) {
    const colorButtons = document.querySelectorAll('.color-button');

    colorButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const color = e.target.getAttribute('data-color');
            if (color) {
                onPenColorChange(color, button);
            } else {
                console.error("Color button missing 'data-color' attribute.");
            }
        });
    });

    return colorButtons;
}

/**
 * Initializes tool selection buttons by attaching event listeners.
 * @param {object} tools - An object mapping tool names to their button elements.
 * @param {function} onToolChange - Callback function to handle tool changes.
 */
function initializeToolSelection(tools, onToolChange) {
    // Initialize the default selected tool
    if (tools.pen) {
        tools.pen.classList.add("selected-tool");
    } else {
        console.error('Pen tool button with ID "penTool" not found.');
    }

    Object.keys(tools).forEach(toolName => {
        const toolButton = tools[toolName];
        if (toolButton) {
            toolButton.addEventListener("click", () => {
                onToolChange(toolName, toolButton);
            });
        } else {
            console.error(`Tool button for "${toolName}" not found.`);
        }
    });
}

/**
 * Initializes the clear canvas button by attaching an event listener.
 * @param {HTMLElement} clearButton - The clear canvas button element.
 * @param {function} onClearCanvas - Callback function to handle clear canvas action.
 */
function initializeClearCanvasButton(clearButton, onClearCanvas) {
    if (!clearButton) {
        console.error('Clear Canvas button with ID "clearCanvas" not found.');
        return;
    }

    clearButton.addEventListener("click", () => {
        onClearCanvas();
    });
}

module.exports = {
    initializePenSizeButtons,
    initializeColorButtons,
    initializeToolSelection,
    initializeClearCanvasButton,
};