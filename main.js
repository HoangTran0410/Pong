import Game from "./src/core/Game.js";
import PowerupUI from "./src/ui/PowerupUI.js";
import AudioUI from "./src/ui/AudioUI.js";
import eventBus from "./src/core/EventBus.js";
import soundSystem from "./src/systems/SoundSystem.js";
import { CONFIG } from "./src/config/game.js";

// Main Application Entry Point
class PongApp {
  constructor() {
    this.game = null;
    this.currentScreen = "menu";
    this.powerupUI = null;
    this.audioUI = null;

    this.init();
  }

  // Initialize application
  init() {
    // Initialize UI components
    this.powerupUI = new PowerupUI();
    this.audioUI = new AudioUI();

    // Initialize sound system with saved settings
    this.audioUI.initializeSoundSystem();

    this.setupEventListeners();
    this.setupOrientationHandler();
    this.showScreen("menu");
  }

  // Setup event listeners
  setupEventListeners() {
    // Start button
    const startButton = document.getElementById("startButton");
    if (startButton) {
      startButton.addEventListener("click", () => {
        // Initialize audio on first user interaction
        soundSystem.initializeAudio();
        eventBus.emit("menu:click");
        this.startGame();
      });
    }

    // Pause button
    const pauseButton = document.getElementById("pauseButton");
    if (pauseButton) {
      pauseButton.addEventListener("click", () => {
        soundSystem.initializeAudio();
        eventBus.emit("menu:click");
        this.togglePause();
      });
    }

    // Menu button
    const menuButton = document.getElementById("menuButton");
    if (menuButton) {
      menuButton.addEventListener("click", () => {
        soundSystem.initializeAudio();
        eventBus.emit("menu:click");
        this.showMenu();
      });
    }

    // Initialize audio on any user interaction
    document.addEventListener(
      "click",
      () => {
        soundSystem.initializeAudio();
      },
      { once: true }
    );

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.currentScreen === "game") {
          this.togglePause();
        }
      }
    });
  }

  // Start game
  startGame() {
    // Get selected paddle modes
    const leftMode = document.getElementById("leftPaddleMode").value;
    const rightMode = document.getElementById("rightPaddleMode").value;

    // Get selected orientation
    const orientation = document.getElementById("gameOrientation").value;

    // Get powerup settings
    const powerupSettings = this.powerupUI.getSettings();

    // Switch to game screen
    this.showScreen("game");

    const canvas = document.getElementById("gameCanvas");

    // If game already exists, reset it instead of creating new instance
    if (this.game) {
      CONFIG.setOrientation(orientation);

      this.game.stop();
      this.game.reset();
      this.game.handleOrientationChange();
      this.game.resizeCanvas();
    } else {
      // Create new game instance only if none exists
      this.game = new Game(canvas, orientation);
    }

    // Set paddle modes
    this.game.setPaddleModes(leftMode, rightMode);

    // Set powerup settings
    this.game.setPowerupSettings(powerupSettings);

    // Update score display to show initial scores (0-0)
    this.game.updateScoreDisplay();

    // Start game
    this.game.start();
  }

  // Show menu
  showMenu() {
    if (this.game) {
      this.game.stop();
      // Keep game instance for reuse instead of setting to null
    }
    this.showScreen("menu");
  }

  // Toggle pause
  togglePause() {
    if (this.game) {
      this.game.togglePause();

      const pauseButton = document.getElementById("pauseButton");
      if (pauseButton) {
        pauseButton.textContent = this.game.isPaused ? "RESUME" : "PAUSE";
      }
    }
  }

  // Show specific screen
  showScreen(screenName) {
    // Hide all screens
    const screens = document.querySelectorAll(".screen");
    screens.forEach((screen) => screen.classList.remove("active"));

    // Show target screen
    const targetScreen = document.getElementById(screenName + "Screen");
    if (targetScreen) {
      targetScreen.classList.add("active");
      this.currentScreen = screenName;

      // If showing game screen and game exists, ensure canvas is properly sized
      if (screenName === "game" && this.game) {
        setTimeout(() => {
          this.game.resizeCanvas();
        }, 50);
      }
    }
  }

  // Setup orientation selection handler
  setupOrientationHandler() {
    const orientationSelect = document.getElementById("gameOrientation");
    if (orientationSelect) {
      orientationSelect.addEventListener("change", () => {
        this.updatePaddleLabels(orientationSelect.value);
      });

      // Set initial labels
      this.updatePaddleLabels(orientationSelect.value);
    }
  }

  // Update paddle labels based on orientation
  updatePaddleLabels(orientation) {
    const leftLabel = document.getElementById("leftPaddleLabel");
    const rightLabel = document.getElementById("rightPaddleLabel");
    const leftKeyboardOption = document.getElementById("leftKeyboardOption");
    const rightKeyboardOption = document.getElementById("rightKeyboardOption");

    if (orientation === "vertical") {
      if (leftLabel) leftLabel.textContent = "Top Paddle:";
      if (rightLabel) rightLabel.textContent = "Bottom Paddle:";
      if (leftKeyboardOption) leftKeyboardOption.textContent = "Keyboard (A/D)";
      if (rightKeyboardOption)
        rightKeyboardOption.textContent = "Keyboard (Left/Right)";
    } else {
      if (leftLabel) leftLabel.textContent = "Left Paddle:";
      if (rightLabel) rightLabel.textContent = "Right Paddle:";
      if (leftKeyboardOption) leftKeyboardOption.textContent = "Keyboard (W/S)";
      if (rightKeyboardOption)
        rightKeyboardOption.textContent = "Keyboard (Up/Down)";
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PongApp();
});
