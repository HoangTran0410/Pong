import { CONFIG } from "./config.js";
import PowerupManager from "./powerups.js";
import Paddle from "./paddle.js";
import Ball from "./ball.js";
import ParticleManager from "./particles.js";

// Main Game Class
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.isRunning = false;
    this.isPaused = false;

    // Game objects
    this.leftPaddle = null;
    this.rightPaddle = null;
    this.balls = [];
    this.powerupManager = null;
    this.particleManager = null;

    // Game state
    this.leftScore = 0;
    this.rightScore = 0;
    this.currentSpeed = 1;

    // Input handling
    this.keys = {};
    this.pointerYLeft = null; // mouse for left
    this.pointerYRight = null; // mouse for right

    // Resize handling
    this.resizeTimeout = null;

    // Initialize game
    this.init();
  }

  // Initialize game
  init() {
    // Set initial canvas size first
    CONFIG.updateCanvasSize(this.canvas);

    // Create paddles
    this.leftPaddle = new Paddle(
      CONFIG.PADDLE_MARGIN,
      CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2,
      "left",
      "keyboard",
      this
    );

    this.rightPaddle = new Paddle(
      CONFIG.CANVAS_WIDTH - CONFIG.PADDLE_MARGIN - CONFIG.PADDLE_WIDTH,
      CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2,
      "right",
      "keyboard",
      this
    );

    // Create initial ball with game reference
    this.balls = [
      new Ball(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, this),
    ];

    // Create powerup manager with game instance
    this.powerupManager = new PowerupManager(this.canvas, this);

    // Create particle manager
    this.particleManager = new ParticleManager();

    // Setup input handlers
    this.setupInputHandlers();

    // Setup resize handler
    this.setupResizeHandler();
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

        // Calculate the scale factors between CSS size and actual canvas size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Convert mouse coordinates to canvas coordinates with proper scaling
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        // Follow the last moved paddle (heuristic)
        this.pointerYLeft = canvasY;
        this.pointerYRight = canvasY;
      } catch (error) {
        console.error("Error in mouse coordinate calculation:", error);
        // Fallback to basic coordinate calculation
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
    });
  }

  // Setup resize handler
  setupResizeHandler() {
    window.addEventListener("resize", () => {
      // Debounce resize events to avoid excessive calls
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.resizeCanvas();
      }, 100);
    });

    // Handle window focus to ensure proper sizing
    window.addEventListener("focus", () => {
      this.resizeCanvas();
    });

    // Handle orientation change for mobile devices
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.resizeCanvas();
      }, 100);
    });
  }

  // Resize canvas and reposition game elements
  resizeCanvas() {
    try {
      const newDimensions = CONFIG.updateCanvasSize(this.canvas);

      // Only reposition game elements if they exist (game is initialized)
      if (this.isGameInitialized()) {
        // Reposition paddles
        this.leftPaddle.x = CONFIG.PADDLE_MARGIN;
        this.leftPaddle.y = CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2;

        this.rightPaddle.x =
          CONFIG.CANVAS_WIDTH - CONFIG.PADDLE_MARGIN - CONFIG.PADDLE_WIDTH;
        this.rightPaddle.y =
          CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2;

        // Reposition balls to center
        this.balls.forEach((ball) => {
          ball.x = CONFIG.CANVAS_WIDTH / 2;
          ball.y = CONFIG.CANVAS_HEIGHT / 2;
        });

        // Clear and recreate powerup manager for new dimensions
        this.powerupManager = new PowerupManager(this.canvas, this);
      }
    } catch (error) {
      console.error("Error during canvas resize:", error);
      // Fallback: just update canvas size without repositioning
      CONFIG.updateCanvasSize(this.canvas);
    }
  }

  // Check if game is fully initialized
  isGameInitialized() {
    return (
      this.leftPaddle && this.rightPaddle && this.balls && this.powerupManager
    );
  }

  // Start game
  start() {
    this.isRunning = true;
    this.gameLoop();
  }

  // Pause/Resume game
  togglePause() {
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
    // Update paddles
    const gameState = {
      balls: this.balls,
      leftPaddle: this.leftPaddle,
      rightPaddle: this.rightPaddle,
    };

    const inputYLeft =
      this.leftPaddle.mode === "mouse" ? this.pointerYLeft : null;
    const inputYRight =
      this.rightPaddle.mode === "mouse" ? this.pointerYRight : null;

    this.leftPaddle.update(this.keys, inputYLeft, gameState);
    this.rightPaddle.update(this.keys, inputYRight, gameState);

    // Update balls
    this.balls.forEach((ball) => {
      ball.update();

      // Check paddle collisions
      if (
        this.leftPaddle.checkCollision(ball) ||
        this.rightPaddle.checkCollision(ball)
      ) {
        // Ball hit paddle, update speed indicator
        this.updateSpeedIndicator();

        // Create paddle collision particles
        this.createParticleEffect(ball.x, ball.y, "paddle_hit");
      }

      // Check powerup collisions
      this.powerupManager.checkCollision(ball);

      // Check random wall collisions
      this.powerupManager.checkWallCollision(ball);
    });

    // Update powerups
    this.powerupManager.update();

    // Update particles
    this.particleManager.update();

    // Remove off-screen balls
    this.balls = this.balls.filter((ball) => !ball.isOffScreen());

    // Only spawn new ball if no balls exist (all balls went off-screen)
    if (this.balls.length === 0) {
      this.balls.push(
        new Ball(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, this)
      );
    }
  }

  // Update speed indicator
  updateSpeedIndicator() {
    const avgSpeed =
      this.balls.reduce((sum, ball) => sum + ball.getSpeed(), 0) /
      this.balls.length;
    this.currentSpeed = Math.min(CONFIG.MAX_BALL_SPEED, avgSpeed);

    const speedIndicator = document.querySelector(".speed-indicator");
    if (speedIndicator) {
      speedIndicator.textContent = `Speed: ${this.currentSpeed.toFixed(1)}`;
    }
  }

  // Render game with retro style
  render() {
    // Clear canvas
    this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw retro scanlines
    this.ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.height; i += 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }

    // Draw center line with retro style
    this.ctx.strokeStyle = CONFIG.COLORS.CENTER_LINE;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(
      this.canvas.height ? this.canvas.width / 2 : this.canvas.width / 2,
      this.canvas.height
    );
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Render game objects
    this.leftPaddle.render(this.ctx);
    this.rightPaddle.render(this.ctx);

    this.balls.forEach((ball) => ball.render(this.ctx));

    this.powerupManager.render(this.ctx);

    // Render particles (on top of everything)
    this.particleManager.render(this.ctx);
  }

  // Set paddle modes
  setPaddleModes(leftMode, rightMode) {
    this.leftPaddle.mode = leftMode;
    this.rightPaddle.mode = rightMode;
  }

  // Reset game
  reset() {
    this.leftScore = 0;
    this.rightScore = 0;
    this.currentSpeed = 1;

    // Reset paddles first
    this.leftPaddle.reset();
    this.rightPaddle.reset();

    // Create new balls
    this.balls = [
      new Ball(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, this),
    ];

    // Clear powerups
    this.powerupManager = new PowerupManager(this.canvas, this);

    // Clear particles
    this.particleManager.clear();

    // Update UI
    this.updateScoreDisplay();
    this.updateSpeedIndicator();
  }

  // Update score display
  updateScoreDisplay() {
    const leftScoreElement = document.querySelector(".left-score");
    const rightScoreElement = document.querySelector(".right-score");

    if (leftScoreElement) leftScoreElement.textContent = this.leftScore;
    if (rightScoreElement) rightScoreElement.textContent = this.rightScore;
  }

  addScore(side, score) {
    if (side === "left") this.leftScore += score;
    else if (side === "right") this.rightScore += score;

    this.leftScore = Math.max(0, this.leftScore);
    this.rightScore = Math.max(0, this.rightScore);

    this.updateScoreDisplay();
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

  // Create particle effect (called by powerup manager)
  createParticleEffect(x, y, powerupType) {
    if (this.particleManager) {
      this.particleManager.createPowerupEffect(x, y, powerupType);
    }
  }
}

export default Game;
