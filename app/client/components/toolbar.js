let penSize;
let penColor;
let ctx; // canvas context
let penSizeButtons = [];

/**
 * Initializes the pen size buttons and settings.
 * @param {object} config - Configuration object.
 * @param {number} config.initialPenSize - The default pen size.
 * @param {string} config.initialPenColor - The default pen color.
 * @param {CanvasRenderingContext2D} config.canvasContext - The canvas context.
 */
function initializePenModule({ initialPenSize, initialPenColor, canvasContext }) {
    penSize = initialPenSize;
    penColor = initialPenColor;
    ctx = canvasContext;

    const penSizes = [
        { size: 2, element: document.getElementById("penSize2") },
        { size: 3, element: document.getElementById("penSize3") },
        { size: 6, element: document.getElementById("penSize6") },
    ];

    const validPenSizes = penSizes.filter(ps => ps.element);

    if (validPenSizes.length !== penSizes.length) {
        console.error("One or more pen size buttons not found.");
    }

    penSizeButtons = validPenSizes.map(ps => ps.element);

    validPenSizes.forEach(ps => {
        ps.element.addEventListener("click", () => {
            updatePenSettings(ps.size);
            updateSelectedPenSizeButton(ps.element);
        });
    });

    const defaultPenSizeButton = penSizes.find(ps => ps.size === penSize).element;
    updateSelectedPenSizeButton(defaultPenSizeButton);
    updateSelectedPenButtonColor(penColor);
}

/**
 * Updates the pen settings (size and color).
 */
function updatePenSettings(penSize) {
    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    console.log(`Pen settings updated: Size=${penSize}, Color=${penColor}`);
}

/**
 * Updates the selected pen size button.
 * @param {HTMLElement} selectedButton - The button element to select.
 */
function updateSelectedPenSizeButton(selectedButton) {
    penSizeButtons.forEach(button => button.classList.remove("selected"));
    selectedButton.classList.add("selected");
    updateSelectedPenButtonColor(penColor);
    console.log(penColor)
}

/**
 * Updates the color of the selected pen size button.
 * @param {string} selectedColor - The color to apply to the selected button.
 */
function updateSelectedPenButtonColor(selectedColor) {
    const selectedButton = document.querySelector(".pen-size-btn.selected");
    penSizeButtons.forEach(button => (button.style.backgroundColor = "#ffffff"));
    if (selectedButton) {
        selectedButton.style.backgroundColor = selectedColor;
    }
    penColor = selectedColor;
}

// Expose the initialization and update functions
module.exports = {
    initializePenModule,
    updatePenSettings,
    updateSelectedPenButtonColor
};