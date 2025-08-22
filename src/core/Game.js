import { CONFIG } from "../config/game.js";
import CollisionSystem from "../systems/CollisionSystem.js";
import PowerupSystem from "../systems/PowerupSystem.js";
import FlashTextOverlay from "../ui/FlashTextOverlay.js";
import soundSystem from "../systems/SoundSystem.js";
import Paddle from "../entities/Paddle.js";
import Ball from "../entities/Ball.js";
import eventBus from "./EventBus.js";

// Main Game Class - Orchestrates all systems and manages game state
class Game {
  constructor(canvas, orientation = "horizontal") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.isRunning = false;
    this.isPaused = false;

    // Set game orientation
    CONFIG.setOrientation(orientation);

    // Game state
    this.leftScore = 0;
    this.rightScore = 0;
    this.startTime = null;
    this.elapsedTime = 0;
    this.lastDisplayedTime = -1;

    // Cached DOM elements
    this.timerElement = null;

    // Input handling
    this.keys = {};
    this.pointerYLeft = null;
    this.pointerYRight = null;
    this.pointerXLeft = null;
    this.pointerXRight = null;

    // Centralized game objects management
    this.gameObjects = []; // All game objects in one array
    this.leftPaddle = null;
    this.rightPaddle = null;

    // Systems
    this.collisionSystem = new CollisionSystem();
    this.powerupSystem = new PowerupSystem();
    this.flashTextOverlay = new FlashTextOverlay();
    this.soundSystem = soundSystem;

    // Add flash text overlay to game objects for centralized management
    this.addGameObject(this.flashTextOverlay);

    // Resize handling
    this.resizeTimeout = null;

    // Initialize game
    this.init();
  }

  // Initialize game
  init() {
    // Set initial canvas size
    CONFIG.updateCanvasSize(this.canvas);

    // Create paddles with orientation-aware positioning
    const leftPos = CONFIG.getLeftPaddlePosition();
    const rightPos = CONFIG.getRightPaddlePosition();

    this.leftPaddle = new Paddle(leftPos.x, leftPos.y, "left", "ai");
    this.rightPaddle = new Paddle(rightPos.x, rightPos.y, "right", "ai");

    // Create initial ball
    const initialBall = new Ball(
      CONFIG.CANVAS_WIDTH / 2,
      CONFIG.CANVAS_HEIGHT / 2
    );

    // Add all game objects to centralized array
    this.gameObjects = [this.leftPaddle, this.rightPaddle, initialBall];

    // Setup event listeners
    this.setupEventListeners();
    this.setupInputHandlers();
    this.setupResizeHandler();
  }

  // Setup game event listeners
  setupEventListeners() {
    // Ball scoring
    eventBus.subscribe("ball:score", (data) => {
      this.addScore(data.scorer, data.points);
      this.handleGoalNotification(data.scorer, data.points);
    });

    // Ball spawning (from clone powerup)
    eventBus.subscribe("game:ballSpawned", (data) => {
      this.addGameObject(data.ball);
    });

    // Generic object spawning (for powerup-created objects)
    eventBus.subscribe("game:objectSpawned", (data) => {
      this.addGameObject(data.object);
    });

    // Score changes from powerups
    eventBus.subscribe("game:scoreChange", (data) => {
      this.addScore(data.side, data.points);
    });

    // Score swap from powerups
    eventBus.subscribe("game:swapScores", () => {
      this.swapScores();
    });

    // Paddle effects
    eventBus.subscribe("paddle:effectApplied", (data) => {
      const paddle = data.side === "left" ? this.leftPaddle : this.rightPaddle;
      if (paddle) {
        paddle.addEffect(data.type, data.effect);
      }
    });

    eventBus.subscribe("paddle:effectRemoved", (data) => {
      const paddle = data.side === "left" ? this.leftPaddle : this.rightPaddle;
      if (paddle) {
        paddle.removeEffect(data.type);
      }
    });

    eventBus.subscribe("paddle:shieldActivated", (data) => {
      const paddle = data.side === "left" ? this.leftPaddle : this.rightPaddle;
      if (paddle) {
        paddle.addShield();
      }
    });

    // Ball effects
    eventBus.subscribe("ball:effectRemoved", (data) => {
      const ball = this.getBalls().find((b) => b.id === data.ballId);
      if (ball) {
        ball.removeEffect(data.type);
      }
    });

    // Orientation changes
    eventBus.subscribe("game:orientationChanged", (data) => {
      this.handleOrientationChange(
        data.newOrientation,
        data.originalOrientation
      );
    });
  }

  // Setup input handlers
  setupInputHandlers() {
    // Keyboard events
    document.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });

    // Mouse events with proper coordinate scaling
    this.canvas.addEventListener("mousemove", (e) => {
      try {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        this.pointerYLeft = canvasY;
        this.pointerYRight = canvasY;
        this.pointerXLeft = canvasX;
        this.pointerXRight = canvasX;
      } catch (error) {
        console.error("Error in mouse coordinate calculation:", error);
        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (e.clientX - rect.left < this.canvas.width / 2) {
          this.pointerYLeft = y;
        } else {
          this.pointerYRight = y;
        }
      }
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.pointerYLeft = null;
      this.pointerYRight = null;
      this.pointerXLeft = null;
      this.pointerXRight = null;
    });
  }

  // Setup resize handler
  setupResizeHandler() {
    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.resizeCanvas();
      }, 100);
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.resizeCanvas();
      }, 100);
    });
  }

  // Resize canvas and reposition game elements
  resizeCanvas() {
    try {
      CONFIG.updateCanvasSize(this.canvas);

      if (this.isGameInitialized()) {
        // Reposition paddles with orientation-aware positioning
        const leftPos = CONFIG.getLeftPaddlePosition();
        const rightPos = CONFIG.getRightPaddlePosition();

        this.leftPaddle.x = leftPos.x;
        this.leftPaddle.y = leftPos.y;
        this.rightPaddle.x = rightPos.x;
        this.rightPaddle.y = rightPos.y;

        // Reposition balls to center
        this.getBalls().forEach((ball) => {
          ball.x = CONFIG.CANVAS_WIDTH / 2;
          ball.y = CONFIG.CANVAS_HEIGHT / 2;
        });

        // Clear powerup system for new dimensions
        this.powerupSystem.clear();
      }
    } catch (error) {
      console.error("Error during canvas resize:", error);
      CONFIG.updateCanvasSize(this.canvas);
    }
  }

  // Check if game is fully initialized
  isGameInitialized() {
    return (
      this.leftPaddle && this.rightPaddle && this.balls && this.powerupSystem
    );
  }

  // Start game
  start() {
    this.isRunning = true;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.lastDisplayedTime = -1;

    // Cache timer element
    this.timerElement = document.querySelector(".timer");

    // Start background music
    this.soundSystem.startBackgroundMusic();

    // Show game start notification
    this.flashTextOverlay.addFlashText("GAME START!", {
      color: "#00ff00",
      glowColor: "#88ff88",
      shadowColor: "#004400",
      duration: 2000,
      fontSize: 36,
    });

    this.gameLoop();
  }

  // Pause/Resume game
  togglePause() {
    if (this.isPaused) {
      // Resuming: adjust start time to account for paused duration
      const pausedDuration = Date.now() - this.pauseStartTime;
      this.startTime += pausedDuration;
    } else {
      // Pausing: record when pause started
      this.pauseStartTime = Date.now();
    }

    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.gameLoop();
    }
  }

  // Stop game
  stop() {
    this.isRunning = false;
    // Stop background music when game stops
    this.soundSystem.stopBackgroundMusic();
  }

  // Main game loop
  gameLoop() {
    if (!this.isRunning || this.isPaused) return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  // Update game state - Centralized GameObject approach
  update() {
    const deltaTime = 16; // Assume 60fps for now

    // Prepare input state
    const inputState = {
      keys: this.keys,
      mouseY:
        this.leftPaddle.mode === "mouse"
          ? this.pointerYLeft
          : this.rightPaddle.mode === "mouse"
          ? this.pointerYRight
          : null,
      mouseX:
        this.leftPaddle.mode === "mouse"
          ? this.pointerXLeft
          : this.rightPaddle.mode === "mouse"
          ? this.pointerXRight
          : null,
    };

    // Prepare game state for objects that need it
    const gameState = {
      balls: this.getBalls(),
      leftPaddle: this.leftPaddle,
      rightPaddle: this.rightPaddle,
      powerups: this.powerupSystem.getPowerups(),
      randomWalls: this.powerupSystem.getRandomWalls(),
      portals: this.powerupSystem.getPortals(),
      blackholes: this.powerupSystem.getBlackholes(),
      inputState: inputState,
      gameObjects: this.gameObjects,
    };

    // 1. Update all game objects
    this.gameObjects.forEach((obj) => {
      if (obj && obj.update) {
        obj.update(deltaTime, gameState);
      }
    });

    // 2. Update powerup system (manages powerup spawning and effects)
    this.powerupSystem.update(this.getBalls());

    // 3. Add powerup-created objects to game objects
    this.syncPowerupObjects();

    // 4. Detect and resolve all collisions
    const collisionResults = this.collisionSystem.update(this.gameObjects);

    // 5. Remove objects marked for removal
    this.removeMarkedObjects();

    // 6. Update timer
    this.updateTimer();

    // 7. Spawn new ball if no balls exist
    if (this.getBalls().length === 0) {
      this.spawnNewBall();
    }
  }

  // Render game - Centralized approach
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Render all game objects
    this.gameObjects.forEach((obj) => {
      if (obj && obj.render && obj.active && !obj.toRemove) {
        obj.render(this.ctx);
      }
    });

    // Render powerup system objects (powerups, walls, portals, blackholes)
    this.powerupSystem.getPowerups().forEach((powerup) => {
      if (powerup && powerup.render && !powerup.collected && !powerup.expired) {
        powerup.render(this.ctx);
      }
    });

    this.powerupSystem.getRandomWalls().forEach((wall) => {
      if (wall && wall.render && wall.active) {
        wall.render(this.ctx);
      }
    });

    this.powerupSystem.getPortals().forEach((portal) => {
      if (portal && portal.render && portal.active) {
        portal.render(this.ctx);
      }
    });

    this.powerupSystem.getBlackholes().forEach((blackhole) => {
      if (blackhole && blackhole.render && blackhole.active) {
        blackhole.render(this.ctx);
      }
    });

    // Flash texts are now rendered via HTML/CSS overlay
    // Particles are now handled as game objects
  }

  // Update timer display (only when seconds change)
  updateTimer() {
    if (this.startTime && this.isRunning && !this.isPaused) {
      this.elapsedTime = Date.now() - this.startTime;
    }

    const totalSeconds = Math.floor(this.elapsedTime / 1000);

    // Only update display if the second has changed
    if (totalSeconds !== this.lastDisplayedTime) {
      this.lastDisplayedTime = totalSeconds;

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;

      // Cache timer element on first use
      if (!this.timerElement) {
        this.timerElement = document.querySelector(".timer");
      }

      if (this.timerElement) {
        this.timerElement.textContent = timeString;
      }
    }
  }

  // Set paddle modes
  setPaddleModes(leftMode, rightMode) {
    this.leftPaddle.mode = leftMode;
    this.rightPaddle.mode = rightMode;
  }

  // Add score
  addScore(side, score) {
    if (side === "left") this.leftScore += score;
    else if (side === "right") this.rightScore += score;

    this.leftScore = Math.max(0, this.leftScore);
    this.rightScore = Math.max(0, this.rightScore);

    this.updateScoreDisplay();
  }

  // Swap scores between left and right players
  swapScores() {
    const temp = this.leftScore;
    this.leftScore = this.rightScore;
    this.rightScore = temp;

    this.updateScoreDisplay();
  }

  // Update score display
  updateScoreDisplay() {
    const leftScoreElement = document.querySelector(".left-score");
    const rightScoreElement = document.querySelector(".right-score");

    if (leftScoreElement) leftScoreElement.textContent = this.leftScore;
    if (rightScoreElement) rightScoreElement.textContent = this.rightScore;
  }

  // Handle goal notifications
  handleGoalNotification(scorer, points) {
    let message = "";
    let options = {
      duration: 2500,
      fontSize: 36,
    };

    // Regular goal notification
    if (scorer === "left") {
      message = "LEFT SCORES!";
      options.color = "#00ff00";
      options.glowColor = "#88ff88";
      options.shadowColor = "#004400";
    } else {
      message = "RIGHT SCORES!";
      options.color = "#00ccff";
      options.glowColor = "#88ddff";
      options.shadowColor = "#004488";
    }

    // Show the main goal notification
    this.flashTextOverlay.addFlashText(message, options);
  }

  // Reset game
  reset() {
    this.leftScore = 0;
    this.rightScore = 0;
    this.startTime = null;
    this.elapsedTime = 0;
    this.lastDisplayedTime = -1;

    // Reset paddles
    this.leftPaddle.reset();
    this.rightPaddle.reset();

    // Create new ball with correct velocity for orientation
    const newBall = new Ball(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    newBall.resetVelocity();

    // Reset game objects to initial state
    this.gameObjects = [
      this.leftPaddle,
      this.rightPaddle,
      newBall,
      this.flashTextOverlay,
    ];

    // Clear systems
    this.powerupSystem.clear();
    this.flashTextOverlay.clear();

    // Update UI
    this.updateScoreDisplay();
    this.updateTimer();
  }

  // Set paddle modes
  setPaddleModes(leftMode, rightMode) {
    if (this.leftPaddle) {
      this.leftPaddle.mode = leftMode;
    }
    if (this.rightPaddle) {
      this.rightPaddle.mode = rightMode;
    }
  }

  // Handle orientation change from powerup
  handleOrientationChange() {
    // Update paddle dimensions and positions
    this.leftPaddle.width = CONFIG.getPaddleWidth();
    this.leftPaddle.height = CONFIG.getPaddleHeight();
    this.rightPaddle.width = CONFIG.getPaddleWidth();
    this.rightPaddle.height = CONFIG.getPaddleHeight();

    // Update base dimensions for powerup effects
    this.leftPaddle.baseWidth = CONFIG.getPaddleWidth();
    this.leftPaddle.baseHeight = CONFIG.getPaddleHeight();
    this.leftPaddle.currentWidth = this.leftPaddle.baseWidth;
    this.leftPaddle.currentHeight = this.leftPaddle.baseHeight;

    this.rightPaddle.baseWidth = CONFIG.getPaddleWidth();
    this.rightPaddle.baseHeight = CONFIG.getPaddleHeight();
    this.rightPaddle.currentWidth = this.rightPaddle.baseWidth;
    this.rightPaddle.currentHeight = this.rightPaddle.baseHeight;

    // Reposition paddles
    const leftPos = CONFIG.getLeftPaddlePosition();
    const rightPos = CONFIG.getRightPaddlePosition();

    this.leftPaddle.x = leftPos.x;
    this.leftPaddle.y = leftPos.y;
    this.rightPaddle.x = rightPos.x;
    this.rightPaddle.y = rightPos.y;

    // Re-apply any active effects
    this.leftPaddle.applyEffects();
    this.rightPaddle.applyEffects();

    // Reset ball velocities for new orientation
    this.getBalls().forEach((ball) => {
      if (!ball.disabled) {
        ball.resetVelocity();
      }
    });
  }

  // Helper method to get all balls from game objects
  getBalls() {
    return this.gameObjects.filter((obj) => obj.type === "ball");
  }

  // Helper method to add a game object
  addGameObject(obj) {
    if (obj && !this.gameObjects.includes(obj)) {
      this.gameObjects.push(obj);
    }
  }

  // Helper method to remove objects marked for removal
  removeMarkedObjects() {
    this.gameObjects = this.gameObjects.filter((obj) => !obj.shouldRemove());
  }

  // Helper method to spawn a new ball
  spawnNewBall() {
    const newBall = new Ball(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    newBall.resetVelocity(); // Ensure proper velocity for current orientation
    this.addGameObject(newBall);
  }

  // Helper method to sync powerup-created objects with main game objects
  syncPowerupObjects() {
    // Add powerups to game objects if not already there
    this.powerupSystem.getPowerups().forEach((powerup) => {
      if (!this.gameObjects.includes(powerup)) {
        this.addGameObject(powerup);
      }
    });

    // Add walls to game objects if not already there
    this.powerupSystem.getRandomWalls().forEach((wall) => {
      if (!this.gameObjects.includes(wall)) {
        this.addGameObject(wall);
      }
    });

    // Add portals to game objects if not already there
    this.powerupSystem.getPortals().forEach((portal) => {
      if (!this.gameObjects.includes(portal)) {
        this.addGameObject(portal);
      }
    });

    // Add blackholes to game objects if not already there
    this.powerupSystem.getBlackholes().forEach((blackhole) => {
      if (!this.gameObjects.includes(blackhole)) {
        this.addGameObject(blackhole);
      }
    });
  }

  // Set powerup settings
  setPowerupSettings(settings) {
    if (this.powerupSystem) {
      this.powerupSystem.setPowerupSettings(settings);
    }
  }
}

export default Game;
