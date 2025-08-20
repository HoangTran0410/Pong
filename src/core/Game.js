import { CONFIG } from "../config/game.js";
import PhysicsSystem from "../systems/PhysicsSystem.js";
import RenderSystem from "../systems/RenderSystem.js";
import PowerupSystem from "../systems/PowerupSystem.js";
import FlashTextSystem from "../systems/FlashTextSystem.js";
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

    // Game entities
    this.leftPaddle = null;
    this.rightPaddle = null;
    this.balls = [];

    // Systems
    this.physicsSystem = new PhysicsSystem();
    this.renderSystem = new RenderSystem(canvas, this.ctx);
    this.powerupSystem = new PowerupSystem();
    this.flashTextSystem = new FlashTextSystem();

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
    this.balls = [new Ball(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2)];

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
      this.balls.push(data.ball);
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
      const ball = this.balls.find((b) => b.id === data.ballId);
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
        this.balls.forEach((ball) => {
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

    // Show game start notification
    this.flashTextSystem.addFlashText("GAME START!", {
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
  }

  // Main game loop
  gameLoop() {
    if (!this.isRunning || this.isPaused) return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  // Update game state
  update() {
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

    // Prepare game state
    const gameState = {
      balls: this.balls,
      leftPaddle: this.leftPaddle,
      rightPaddle: this.rightPaddle,
      powerups: this.powerupSystem.getPowerups(),
      randomWalls: this.powerupSystem.getRandomWalls(),
      portals: this.powerupSystem.getPortals(),
    };

    // Update systems
    this.physicsSystem.update(gameState, inputState);
    this.powerupSystem.update(this.balls);

    // Check powerup collisions
    this.powerupSystem.checkCollisions(this.balls);

    // Update flash text system
    this.flashTextSystem.update();

    // Update timer
    this.updateTimer();

    // Spawn new ball if no balls exist
    if (this.balls.length === 0) {
      const newBall = new Ball(
        CONFIG.CANVAS_WIDTH / 2,
        CONFIG.CANVAS_HEIGHT / 2
      );
      newBall.resetVelocity(); // Ensure proper velocity for current orientation
      this.balls.push(newBall);
    }
  }

  // Render game
  render() {
    const gameState = {
      balls: this.balls,
      leftPaddle: this.leftPaddle,
      rightPaddle: this.rightPaddle,
      powerups: this.powerupSystem.getPowerups(),
      randomWalls: this.powerupSystem.getRandomWalls(),
      portals: this.powerupSystem.getPortals(),
      blackholes: this.powerupSystem.getBlackholes(),
      flashTexts: this.flashTextSystem.getFlashTexts(),
    };

    this.renderSystem.render(gameState);
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

    // Show flash text notification
    this.flashTextSystem.addFlashText("SCORES SWAPPED!", {
      color: "#ff6b6b",
      glowColor: "#ff9999",
      shadowColor: "#441111",
      duration: 2500,
    });
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
    console.log("handleGoalNotification", scorer, points);

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
    this.flashTextSystem.addFlashText(message, options);
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
    this.balls = [newBall];

    // Clear systems
    this.powerupSystem.clear();
    this.renderSystem.clearParticles();
    this.flashTextSystem.clear();

    // Update UI
    this.updateScoreDisplay();
    this.updateTimer();
  }

  // Get game state for AI
  getGameState() {
    return {
      balls: this.balls,
      leftPaddle: this.leftPaddle,
      rightPaddle: this.rightPaddle,
      leftScore: this.leftScore,
      rightScore: this.rightScore,
    };
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
  handleOrientationChange(newOrientation, originalOrientation) {
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
    this.balls.forEach((ball) => {
      if (!ball.disabled) {
        ball.resetVelocity();
      }
    });

    // Show orientation change notification
    // this.flashTextSystem.addFlashText(`${newOrientation.toUpperCase()} MODE!`, {
    //   color: "#ff9900",
    //   glowColor: "#ffbb44",
    //   shadowColor: "#664400",
    //   duration: 2000,
    //   fontSize: 28,
    // });
  }

  // Set powerup settings
  setPowerupSettings(settings) {
    if (this.powerupSystem) {
      this.powerupSystem.setPowerupSettings(settings);
    }
  }
}

export default Game;
