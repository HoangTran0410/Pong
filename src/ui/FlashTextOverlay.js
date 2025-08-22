import GameObject from "../entities/GameObject.js";
import { generateId } from "../utils/index.js";

// HTML/CSS-based FlashText system for better performance and simpler implementation
class FlashTextOverlay extends GameObject {
  constructor() {
    super(0, 0, "flashtext_system");

    this.flashTexts = [];
    this.container = null;
    this.setupContainer();
  }

  setupContainer() {
    // Create or get existing overlay container
    this.container = document.getElementById("flash-text-overlay");

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "flash-text-overlay";
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        font-family: 'Press Start 2P', monospace;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      `;
      document.body.appendChild(this.container);
    }
  }

  // Add a new flash text
  addFlashText(text, options = {}) {
    const flashText = new HTMLFlashText(text, options);
    this.flashTexts.push(flashText);
    this.container.appendChild(flashText.element);

    // Start animations
    flashText.startAnimation();

    return flashText.id;
  }

  // Update all flash texts
  update(deltaTime = 16, gameState = null) {
    super.update(deltaTime, gameState);

    // Update and remove expired flash texts
    for (let i = this.flashTexts.length - 1; i >= 0; i--) {
      const flashText = this.flashTexts[i];
      flashText.update(deltaTime);

      if (flashText.shouldRemove()) {
        this.container.removeChild(flashText.element);
        this.flashTexts.splice(i, 1);
      }
    }

    return null;
  }

  // Render method (not needed for HTML/CSS but required by GameObject)
  render(ctx) {
    // HTML/CSS handles the rendering
  }

  // Get all active flash texts
  getFlashTexts() {
    return this.flashTexts;
  }

  // Clear all flash texts
  clear() {
    this.flashTexts.forEach((flashText) => {
      if (flashText.element.parentNode) {
        this.container.removeChild(flashText.element);
      }
    });
    this.flashTexts = [];
  }

  // Clean up when game is destroyed
  destroy() {
    super.destroy();
    this.clear();
    if (this.container && this.container.parentNode) {
      document.body.removeChild(this.container);
    }
  }
}

// Individual HTML flash text element
class HTMLFlashText {
  constructor(text, options = {}) {
    this.id = generateId("flashtext");
    this.text = text;
    this.startTime = Date.now();
    this.duration = options.duration || 2000;
    this.isActive = true;

    // Visual properties
    this.color = options.color || "#00ff00";
    this.fontSize = options.fontSize || 32;
    this.glowColor = options.glowColor || "#88ff88";
    this.shadowColor = options.shadowColor || "#004400";

    // Create DOM element
    this.createElement(options);
  }

  createElement(options) {
    this.element = document.createElement("div");
    this.element.textContent = this.text;
    this.element.style.cssText = `
      position: absolute;
      color: ${this.color};
      font-size: ${this.fontSize}px;
      font-weight: bold;
      text-align: center;
      text-shadow:
        0 0 10px ${this.glowColor},
        0 0 20px ${this.glowColor},
        2px 2px 0px ${this.shadowColor};
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
      white-space: nowrap;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      top: 50%;
      left: 50%;
      margin-top: ${this.getStackOffset() * 60}px;
      pointer-events: none;
      z-index: 1001;
    `;
  }

  getStackOffset() {
    // Simple stacking - could be improved with proper positioning
    return Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  }

  startAnimation() {
    // Use requestAnimationFrame for smoother animations
    requestAnimationFrame(() => {
      this.element.style.transform = "translate(-50%, -50%) scale(1)";
      this.element.style.opacity = "1";

      // Start fade out timer
      setTimeout(() => {
        this.startFadeOut();
      }, this.duration - 500); // Start fade out 500ms before end
    });
  }

  startFadeOut() {
    if (!this.isActive) return;

    this.element.style.transition = "all 0.5s ease-in";
    this.element.style.opacity = "0";
    this.element.style.transform = "translate(-50%, -50%) scale(0.8)";
  }

  update(deltaTime) {
    const elapsed = Date.now() - this.startTime;

    if (elapsed >= this.duration) {
      this.isActive = false;
    }
  }

  shouldRemove() {
    return !this.isActive;
  }
}

export default FlashTextOverlay;
