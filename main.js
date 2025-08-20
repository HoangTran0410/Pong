import Game from "./src/core/Game.js";

// Main Application Entry Point
class PongApp {
  constructor() {
    this.game = null;
    this.currentScreen = "menu";

    this.init();
  }

  // Initialize application
  init() {
    this.setupEventListeners();
    this.showScreen("menu");
  }

  // Setup event listeners
  setupEventListeners() {
    // Start button
    const startButton = document.getElementById("startButton");
    if (startButton) {
      startButton.addEventListener("click", () => this.startGame());
    }

    // Pause button
    const pauseButton = document.getElementById("pauseButton");
    if (pauseButton) {
      pauseButton.addEventListener("click", () => this.togglePause());
    }

    // Menu button
    const menuButton = document.getElementById("menuButton");
    if (menuButton) {
      menuButton.addEventListener("click", () => this.showMenu());
    }

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

    // Switch to game screen
    this.showScreen("game");

    // Initialize game
    const canvas = document.getElementById("gameCanvas");
    this.game = new Game(canvas);

    // Set paddle modes
    this.game.setPaddleModes(leftMode, rightMode);

    // Start game
    this.game.start();
  }

  // Show menu
  showMenu() {
    if (this.game) {
      this.game.stop();
      this.game = null;
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
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PongApp();
});
