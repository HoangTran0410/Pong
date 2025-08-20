import { CONFIG } from "../config/game.js";
import eventBus from "../core/EventBus.js";

// Paddle Entity - Self-contained paddle object with AI, input handling, and rendering
class Paddle {
  constructor(x, y, side, mode = "ai") {
    this.x = x;
    this.y = y;
    this.side = side; // 'left' or 'right' (or 'top'/'bottom' in vertical mode)
    this.mode = mode; // 'keyboard', 'mouse', 'ai'
    this.width = CONFIG.getPaddleWidth();
    this.height = CONFIG.getPaddleHeight();
    this.speed = CONFIG.PADDLE_SPEED;
    this.targetY = y;
    this.targetX = x; // For vertical mode

    // Velocity tracking for momentum transfer (works for both orientations)
    this.previousY = y;
    this.previousX = x;
    this.velocity = 0;
    this.velocityX = 0;

    // AI-specific properties (works for both orientations)
    this.aiVelocity = 0;
    this.aiVelocityX = 0; // For vertical mode
    this.aiMaxSpeed = CONFIG.PADDLE_SPEED * CONFIG.AI_MAX_SPEED_MULTIPLIER;
    this.aiAcceleration = CONFIG.AI_ACCELERATION;
    this.aiDeceleration = CONFIG.AI_DECELERATION;
    this.aiReactionDelay = 0;
    this.aiPredictionError = CONFIG.AI_PREDICTION_ERROR;
    this.aiTargetOffset = 0;

    // Powerup effects
    this.effects = new Map();
    this.baseHeight = CONFIG.getPaddleHeight();
    this.baseWidth = CONFIG.getPaddleWidth();
    this.currentHeight = this.baseHeight;
    this.currentWidth = this.baseWidth;

    // Shield properties
    this.hasShield = false;
    this.shieldReflections = 0;
    this.maxShieldReflections = 1;
  }

  // Update paddle position based on mode
  update(inputState, gameState) {
    // Store previous position for velocity calculation
    this.previousY = this.y;
    this.previousX = this.x;

    switch (this.mode) {
      case "keyboard":
        this.updateKeyboard(inputState.keys);
        break;
      case "mouse":
        this.updatePointer(inputState.mouseY, inputState.mouseX);
        break;
      case "ai":
        this.updateAI(gameState);
        break;
    }

    // Apply powerup effects
    this.applyEffects();

    // Keep paddle within bounds based on orientation
    if (CONFIG.isVertical()) {
      // Vertical mode: paddle moves horizontally
      this.x = Math.max(
        0,
        Math.min(CONFIG.CANVAS_WIDTH - this.currentWidth, this.x)
      );
    } else {
      // Horizontal mode: paddle moves vertically
      this.y = Math.max(
        0,
        Math.min(CONFIG.CANVAS_HEIGHT - this.currentHeight, this.y)
      );
    }

    // Calculate velocity for momentum transfer
    this.velocity = this.y - this.previousY;
    this.velocityX = this.x - this.previousX;
  }

  // Keyboard controls
  updateKeyboard(keys) {
    if (CONFIG.isVertical()) {
      // Vertical mode: horizontal movement
      if (this.side === "left") {
        // Top paddle
        if (keys["a"] || keys["A"]) this.x -= this.speed;
        if (keys["d"] || keys["D"]) this.x += this.speed;
      } else {
        // Bottom paddle
        if (keys["ArrowLeft"]) this.x -= this.speed;
        if (keys["ArrowRight"]) this.x += this.speed;
      }
    } else {
      // Horizontal mode: vertical movement
      if (this.side === "left") {
        if (keys["w"] || keys["W"]) this.y -= this.speed;
        if (keys["s"] || keys["S"]) this.y += this.speed;
      } else {
        if (keys["ArrowUp"]) this.y -= this.speed;
        if (keys["ArrowDown"]) this.y += this.speed;
      }
    }
  }

  // Pointer (mouse) controls - immediate and precise
  updatePointer(inputY, inputX) {
    if (CONFIG.isVertical()) {
      // Vertical mode: follow mouse X position
      if (inputX !== null && inputX !== undefined) {
        this.targetX = inputX - this.currentWidth / 2;

        if (CONFIG.MOUSE_IMMEDIATE_MOVEMENT) {
          this.x = this.targetX;
        } else {
          const alpha = 0.25;
          this.x += (this.targetX - this.x) * alpha;
        }
      }
    } else {
      // Horizontal mode: follow mouse Y position
      if (inputY !== null && inputY !== undefined) {
        this.targetY = inputY - this.currentHeight / 2;

        if (CONFIG.MOUSE_IMMEDIATE_MOVEMENT) {
          this.y = this.targetY;
        } else {
          const alpha = 0.25;
          this.y += (this.targetY - this.y) * alpha;
        }
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

    // Get orientation-aware axis properties
    const isVertical = CONFIG.isVertical();
    const trackingAxis = isVertical ? "y" : "x";
    const movementAxis = isVertical ? "x" : "y";
    const ballVelocityAxis = isVertical ? "dy" : "dx";
    const paddlePosition = isVertical ? this.x : this.y;
    const paddleDimension = isVertical ? this.currentWidth : this.currentHeight;

    // Find the closest ball moving toward this paddle
    const closestBall = this.findClosestApproachingBall(
      gameState.balls,
      trackingAxis,
      ballVelocityAxis
    );

    if (closestBall) {
      this.trackBallAI(
        closestBall,
        trackingAxis,
        movementAxis,
        ballVelocityAxis,
        paddlePosition,
        paddleDimension,
        isVertical
      );

      // Occasionally add reaction delay to simulate human behavior
      if (Math.random() < CONFIG.AI_REACTION_DELAY_CHANCE) {
        this.aiReactionDelay = Math.floor(Math.random() * 3) + 1;
      }
    } else {
      this.returnToCenterAI(isVertical);
    }

    // Apply velocity damping to prevent jitter
    this.aiVelocity *= 0.95;
    this.aiVelocityX *= 0.95;
  }

  // Find closest ball moving toward this paddle
  findClosestApproachingBall(balls, trackingAxis, ballVelocityAxis) {
    let closestBall = null;
    let minDistance = Infinity;

    const isMovingTowardPaddle = (ball) => {
      if (this.side === "left") {
        return ballVelocityAxis === "dy" ? ball.dy < 0 : ball.dx < 0; // Top or Left paddle
      } else {
        return ballVelocityAxis === "dy" ? ball.dy > 0 : ball.dx > 0; // Bottom or Right paddle
      }
    };

    balls.forEach((ball) => {
      if (isMovingTowardPaddle(ball)) {
        const distance = Math.abs(ball[trackingAxis] - this[trackingAxis]);
        if (distance < minDistance) {
          minDistance = distance;
          closestBall = ball;
        }
      }
    });

    return closestBall;
  }

  // Track ball and move AI paddle accordingly
  trackBallAI(
    ball,
    trackingAxis,
    movementAxis,
    ballVelocityAxis,
    paddlePosition,
    paddleDimension,
    isVertical
  ) {
    // Calculate time to reach paddle
    const timeToReach =
      Math.abs(ball[trackingAxis] - this[trackingAxis]) /
      Math.max(1e-3, Math.abs(ball[ballVelocityAxis]));

    // Predict ball position with some error (simulates human prediction)
    const predictionError =
      (Math.random() - 0.5) * this.aiPredictionError * paddleDimension;
    const predictedPosition =
      ball[movementAxis] +
      ball[isVertical ? "dx" : "dy"] * timeToReach +
      predictionError;

    // Add random offset to target (makes AI less predictable)
    if (Math.random() < 0.1) {
      this.aiTargetOffset = (Math.random() - 0.5) * 40; // ±20 pixels
    }

    // Calculate target position with offset
    const targetPosition =
      predictedPosition + this.aiTargetOffset - paddleDimension / 2;

    // Add some randomness to make AI less perfect
    const randomWiggle = ((Math.random() - 0.5) * paddleDimension) / 2;
    const finalTarget = targetPosition + randomWiggle;

    // Update target based on movement axis
    if (isVertical) {
      this.targetX = finalTarget;
    } else {
      this.targetY = finalTarget;
    }

    // Move paddle using shared movement logic
    this.moveToTargetAI(isVertical);
  }

  // Move paddle toward target position
  moveToTargetAI(isVertical) {
    const currentPos = isVertical ? this.x : this.y;
    const targetPos = isVertical ? this.targetX : this.targetY;
    const distanceToTarget = targetPos - currentPos;
    const direction = Math.sign(distanceToTarget);

    const velocityKey = isVertical ? "aiVelocityX" : "aiVelocity";
    const positionKey = isVertical ? "x" : "y";

    if (Math.abs(distanceToTarget) > 5) {
      // Only move if significantly off target
      this[velocityKey] += direction * this.aiAcceleration;

      // Limit maximum speed
      this[velocityKey] = Math.max(
        -this.aiMaxSpeed,
        Math.min(this.aiMaxSpeed, this[velocityKey])
      );

      // Move paddle
      this[positionKey] += this[velocityKey];

      // Add some micro-adjustments for more human-like movement
      if (Math.random() < CONFIG.AI_MICRO_MOVEMENT_CHANCE) {
        this[positionKey] += (Math.random() - 0.5) * 2;
      }
    } else {
      // Decelerate when close to target
      this[velocityKey] *= this.aiDeceleration;

      // Add small random movement when "idle"
      if (Math.random() < CONFIG.AI_IDLE_MOVEMENT_CHANCE) {
        this[positionKey] += (Math.random() - 0.5) * 3;
      }
    }
  }

  // Return to center when no ball is approaching
  returnToCenterAI(isVertical) {
    if (isVertical) {
      const centerX = CONFIG.CANVAS_WIDTH / 2 - this.currentWidth / 2;
      const distanceToCenter = centerX - this.x;

      if (Math.abs(distanceToCenter) > 10) {
        this.aiVelocityX +=
          Math.sign(distanceToCenter) * this.aiAcceleration * 0.5;
        this.aiVelocityX = Math.max(
          -this.aiMaxSpeed * 0.5,
          Math.min(this.aiMaxSpeed * 0.5, this.aiVelocityX)
        );
        this.x += this.aiVelocityX;
      } else {
        this.aiVelocityX *= this.aiDeceleration;
      }
    } else {
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
    this.currentWidth = this.baseWidth * heightMultiplier; // Apply same scaling to width
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
    const paddleRight = this.x + this.currentWidth;
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
    ctx.fillRect(this.x, this.y, this.currentWidth, this.currentHeight);

    // Retro scanlines effect
    ctx.strokeStyle = "#00aa00";
    ctx.lineWidth = 1;

    if (CONFIG.isVertical()) {
      // Vertical scanlines for horizontal paddles
      for (let i = 0; i < this.currentWidth; i += 4) {
        ctx.beginPath();
        ctx.moveTo(this.x + i, this.y);
        ctx.lineTo(this.x + i, this.y + this.currentHeight);
        ctx.stroke();
      }
    } else {
      // Horizontal scanlines for vertical paddles
      for (let i = 0; i < this.currentHeight; i += 4) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + i);
        ctx.lineTo(this.x + this.currentWidth, this.y + i);
        ctx.stroke();
      }
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
        this.currentWidth + 4,
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
    // Reset dimensions and position based on orientation
    this.baseWidth = CONFIG.getPaddleWidth();
    this.baseHeight = CONFIG.getPaddleHeight();
    this.width = this.baseWidth;
    this.height = this.baseHeight;
    this.currentWidth = this.baseWidth;
    this.currentHeight = this.baseHeight;

    // Reset position using orientation-aware positioning
    const position =
      this.side === "left"
        ? CONFIG.getLeftPaddlePosition()
        : CONFIG.getRightPaddlePosition();
    this.x = position.x;
    this.y = position.y;

    this.effects.clear();

    // Reset velocity tracking
    this.previousY = this.y;
    this.previousX = this.x;
    this.velocity = 0;
    this.velocityX = 0;

    // Reset shield
    this.hasShield = false;
    this.shieldReflections = 0;

    // Reset AI properties
    this.aiVelocity = 0;
    this.aiVelocityX = 0;
    this.aiReactionDelay = 0;
    this.aiTargetOffset = 0;
  }
}

export default Paddle;
