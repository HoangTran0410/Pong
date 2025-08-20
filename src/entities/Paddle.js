import { CONFIG } from "../config/game.js";
import eventBus from "../core/EventBus.js";

// Paddle Entity - Self-contained paddle object with AI, input handling, and rendering
class Paddle {
  constructor(x, y, side, mode = "ai") {
    this.x = x;
    this.y = y;
    this.side = side; // 'left' or 'right'
    this.mode = mode; // 'keyboard', 'mouse', 'ai'
    this.width = CONFIG.PADDLE_WIDTH;
    this.height = CONFIG.PADDLE_HEIGHT;
    this.speed = CONFIG.PADDLE_SPEED;
    this.targetY = y;

    // Velocity tracking for momentum transfer
    this.previousY = y;
    this.velocity = 0;

    // AI-specific properties
    this.aiVelocity = 0;
    this.aiMaxSpeed = CONFIG.PADDLE_SPEED * CONFIG.AI_MAX_SPEED_MULTIPLIER;
    this.aiAcceleration = CONFIG.AI_ACCELERATION;
    this.aiDeceleration = CONFIG.AI_DECELERATION;
    this.aiReactionDelay = 0;
    this.aiPredictionError = CONFIG.AI_PREDICTION_ERROR;
    this.aiTargetOffset = 0;

    // Powerup effects
    this.effects = new Map();
    this.baseHeight = CONFIG.PADDLE_HEIGHT;
    this.currentHeight = this.baseHeight;

    // Shield properties
    this.hasShield = false;
    this.shieldReflections = 0;
    this.maxShieldReflections = 1;
  }

  // Update paddle position based on mode
  update(inputState, gameState) {
    // Store previous position for velocity calculation
    this.previousY = this.y;

    switch (this.mode) {
      case "keyboard":
        this.updateKeyboard(inputState.keys);
        break;
      case "mouse":
        this.updatePointer(inputState.mouseY);
        break;
      case "ai":
        this.updateAI(gameState);
        break;
    }

    // Apply powerup effects
    this.applyEffects();

    // Keep paddle within bounds
    this.y = Math.max(
      0,
      Math.min(CONFIG.CANVAS_HEIGHT - this.currentHeight, this.y)
    );

    // Calculate velocity for momentum transfer
    this.velocity = this.y - this.previousY;
  }

  // Keyboard controls
  updateKeyboard(keys) {
    if (this.side === "left") {
      if (keys["w"] || keys["W"]) this.y -= this.speed;
      if (keys["s"] || keys["S"]) this.y += this.speed;
    } else {
      if (keys["ArrowUp"]) this.y -= this.speed;
      if (keys["ArrowDown"]) this.y += this.speed;
    }
  }

  // Pointer (mouse) controls - immediate and precise
  updatePointer(inputY) {
    if (inputY !== null && inputY !== undefined) {
      // Calculate target position (center paddle on mouse)
      this.targetY = inputY - this.currentHeight / 2;

      if (CONFIG.MOUSE_IMMEDIATE_MOVEMENT) {
        // Immediate movement - no speed limits or smoothing for mouse control
        this.y = this.targetY;
      } else {
        // Smooth movement with configurable smoothing (for future use)
        const alpha = 0.25; // smoothing factor
        this.y += (this.targetY - this.y) * alpha;
      }
    }
  }

  // AI controls with improved smoothing and randomness
  updateAI(gameState) {
    if (!gameState.balls || gameState.balls.length === 0) return;

    // Simulate reaction delay
    if (this.aiReactionDelay > 0) {
      this.aiReactionDelay--;
      return;
    }

    // Find the closest ball to this paddle moving toward it
    let closestBall = null;
    let minDistance = Infinity;

    gameState.balls.forEach((ball) => {
      if (this.side === "left" && ball.dx < 0) {
        const distance = Math.abs(ball.x - this.x);
        if (distance < minDistance) {
          minDistance = distance;
          closestBall = ball;
        }
      } else if (this.side === "right" && ball.dx > 0) {
        const distance = Math.abs(ball.x - this.x);
        if (distance < minDistance) {
          minDistance = distance;
          closestBall = ball;
        }
      }
    });

    if (closestBall) {
      // Calculate time to reach paddle
      const timeToReach =
        Math.abs(closestBall.x - this.x) /
        Math.max(1e-3, Math.abs(closestBall.dx));

      // Predict ball position with some error (simulates human prediction)
      const predictionError =
        (Math.random() - 0.5) * this.aiPredictionError * this.currentHeight;
      const predictedY =
        closestBall.y + closestBall.dy * timeToReach + predictionError;

      // Add random offset to target (makes AI less predictable)
      if (Math.random() < 0.1) {
        this.aiTargetOffset = (Math.random() - 0.5) * 40; // ±20 pixels
      }

      // Calculate target position with offset
      this.targetY = predictedY + this.aiTargetOffset - this.currentHeight / 2;

      // Add some randomness to make AI less perfect
      const randomWiggle = ((Math.random() - 0.5) * this.currentHeight) / 2;
      this.targetY += randomWiggle;

      // Smooth movement with acceleration/deceleration
      const distanceToTarget = this.targetY - this.y;
      const direction = Math.sign(distanceToTarget);

      if (Math.abs(distanceToTarget) > 5) {
        // Only move if significantly off target
        this.aiVelocity += direction * this.aiAcceleration;

        // Limit maximum speed
        this.aiVelocity = Math.max(
          -this.aiMaxSpeed,
          Math.min(this.aiMaxSpeed, this.aiVelocity)
        );

        // Move paddle
        this.y += this.aiVelocity;

        // Add some micro-adjustments for more human-like movement
        if (Math.random() < CONFIG.AI_MICRO_MOVEMENT_CHANCE) {
          this.y += (Math.random() - 0.5) * 2;
        }
      } else {
        // Decelerate when close to target
        this.aiVelocity *= this.aiDeceleration;

        // Add small random movement when "idle"
        if (Math.random() < CONFIG.AI_IDLE_MOVEMENT_CHANCE) {
          this.y += (Math.random() - 0.5) * 3;
        }
      }

      // Occasionally add reaction delay to simulate human behavior
      if (Math.random() < CONFIG.AI_REACTION_DELAY_CHANCE) {
        this.aiReactionDelay = Math.floor(Math.random() * 3) + 1;
      }
    } else {
      // No ball coming, slowly return to center with some randomness
      const centerY = CONFIG.CANVAS_HEIGHT / 2 - this.currentHeight / 2;
      const distanceToCenter = centerY - this.y;

      if (Math.abs(distanceToCenter) > 10) {
        this.aiVelocity +=
          Math.sign(distanceToCenter) * this.aiAcceleration * 0.5;
        this.aiVelocity = Math.max(
          -this.aiMaxSpeed * 0.5,
          Math.min(this.aiMaxSpeed * 0.5, this.aiVelocity)
        );
        this.y += this.aiVelocity;
      } else {
        this.aiVelocity *= this.aiDeceleration;
      }
    }

    // Apply velocity damping to prevent jitter
    this.aiVelocity *= 0.95;
  }

  // Apply powerup effects
  applyEffects() {
    let heightMultiplier = 1;

    this.effects.forEach((effect) => {
      if (effect.effect.paddleHeight) {
        heightMultiplier *= effect.effect.paddleHeight;
      }
    });

    this.currentHeight = this.baseHeight * heightMultiplier;
  }

  // Add powerup effect
  addEffect(type, effect) {
    this.effects.set(type, { type, effect });
  }

  // Remove powerup effect
  removeEffect(type) {
    this.effects.delete(type);
  }

  // Add shield powerup
  addShield() {
    this.hasShield = true;
    this.shieldReflections = 0;
  }

  // Remove shield
  removeShield() {
    this.hasShield = false;
    this.shieldReflections = 0;
  }

  // Reflect ball with shield
  reflectBallWithShield(ball) {
    this.shieldReflections++;

    // Reflect the ball back in the opposite direction
    if (this.side === "left") {
      ball.dx = Math.abs(ball.dx);
    } else {
      ball.dx = -Math.abs(ball.dx);
    }

    // Add some randomness to the reflection
    const randomAngle = (Math.random() - 0.5) * 0.4; // ±0.2 radians
    ball.dy = Math.sin(randomAngle) * ball.getSpeed();

    // Remove shield if max reflections reached
    if (this.shieldReflections >= this.maxShieldReflections) {
      this.removeShield();
    }

    // Emit shield reflection event
    eventBus.emit("paddle:shieldReflection", {
      paddle: this,
      ball,
      x: ball.x,
      y: ball.y,
    });
  }

  // Check collision with ball
  checkCollision(ball) {
    const paddleLeft = this.x;
    const paddleRight = this.x + this.width;
    const paddleTop = this.y;
    const paddleBottom = this.y + this.currentHeight;

    // Check if ball is behind the paddle (shield reflection)
    if (this.hasShield && this.shieldReflections < this.maxShieldReflections) {
      if (this.side === "left" && ball.x < paddleLeft) {
        // Ball is behind left paddle - shield covers full table height
        if (
          ball.y + ball.radius > 0 &&
          ball.y - ball.radius < CONFIG.CANVAS_HEIGHT
        ) {
          this.reflectBallWithShield(ball);
          return true;
        }
      } else if (this.side === "right" && ball.x > paddleRight) {
        // Ball is behind right paddle - shield covers full table height
        if (
          ball.y + ball.radius > 0 &&
          ball.y - ball.radius < CONFIG.CANVAS_HEIGHT
        ) {
          this.reflectBallWithShield(ball);
          return true;
        }
      }
    }

    // Normal paddle collision
    if (
      ball.x + ball.radius > paddleLeft &&
      ball.x - ball.radius < paddleRight &&
      ball.y + ball.radius > paddleTop &&
      ball.y - ball.radius < paddleBottom
    ) {
      ball.handlePaddleCollision(this);
      return true;
    }

    return false;
  }

  // Render shield
  renderShield(ctx) {
    const shieldOffset = this.side === "left" ? -15 : 15;
    const shieldX = this.x + shieldOffset;

    // Shield background (semi-transparent) - covers full table height
    ctx.fillStyle = "rgba(0, 150, 255, 0.3)";
    ctx.fillRect(shieldX, 0, 10, CONFIG.CANVAS_HEIGHT);

    // Shield border - covers full table height
    ctx.strokeStyle = "#0096ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(shieldX, 0, 10, CONFIG.CANVAS_HEIGHT);

    // Shield energy effect - covers full table height
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(shieldX - 1, -1, 12, CONFIG.CANVAS_HEIGHT + 2);
    ctx.setLineDash([]);
  }

  // Render paddle with retro style
  render(ctx) {
    // Main paddle body
    ctx.fillStyle = CONFIG.COLORS.PADDLE;
    ctx.fillRect(this.x, this.y, this.width, this.currentHeight);

    // Retro scanlines effect
    ctx.strokeStyle = "#00aa00";
    ctx.lineWidth = 1;
    for (let i = 0; i < this.currentHeight; i += 4) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + i);
      ctx.lineTo(this.x + this.width, this.y + i);
      ctx.stroke();
    }

    // Glowing border for powerup effects
    if (this.effects.size > 0) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 10;
      ctx.strokeRect(
        this.x - 2,
        this.y - 2,
        this.width + 4,
        this.currentHeight + 4
      );
      ctx.shadowBlur = 0;
    }

    // Render shield if active
    if (this.hasShield) {
      this.renderShield(ctx);
    }
  }

  // Reset paddle to default state
  reset() {
    // Reset position based on side
    if (this.side === "left") {
      this.x = CONFIG.PADDLE_MARGIN;
    } else {
      this.x = CONFIG.CANVAS_WIDTH - CONFIG.PADDLE_MARGIN - CONFIG.PADDLE_WIDTH;
    }
    this.y = CONFIG.CANVAS_HEIGHT / 2 - this.baseHeight / 2;
    this.currentHeight = this.baseHeight;
    this.effects.clear();

    // Reset velocity tracking
    this.previousY = this.y;
    this.velocity = 0;

    // Reset shield
    this.hasShield = false;
    this.shieldReflections = 0;

    // Reset AI properties
    this.aiVelocity = 0;
    this.aiReactionDelay = 0;
    this.aiTargetOffset = 0;
  }
}

export default Paddle;
