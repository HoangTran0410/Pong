import { CONFIG } from "../config/game.js";
import BallTrail from "./BallTrail.js";
import eventBus from "../core/EventBus.js";
import { generateId, clamp } from "../utils/index.js";

// Ball Entity - Self-contained ball object with physics and rendering
class Ball {
  constructor(x, y, id = null) {
    this.id = id || generateId("ball");
    this.x = x;
    this.y = y;
    this.radius = CONFIG.BALL_SIZE;
    this.baseRadius = CONFIG.BALL_SIZE;

    // Set initial velocity based on orientation
    if (CONFIG.isVertical()) {
      // Vertical mode: ball moves toward top or bottom paddle
      this.dx = 0;
      this.dy = Math.random() < 0.5 ? -CONFIG.BALL_SPEED : CONFIG.BALL_SPEED;
    } else {
      // Horizontal mode: ball moves toward left or right paddle
      this.dx = Math.random() < 0.5 ? -CONFIG.BALL_SPEED : CONFIG.BALL_SPEED;
      this.dy = 0;
    }

    this.lastHitBy = null;

    this.disabled = false;

    // Powerup effects
    this.effects = new Map();

    // Store base speed for effects
    this.baseSpeed = CONFIG.BALL_SPEED;
    this.currentSpeedMultiplier = 1;

    // Retro trail helper
    this.trail = new BallTrail();

    // Portal cooldown to prevent infinite loops
    this.portalCooldown = 0;
  }

  // Get current speed magnitude
  getSpeed() {
    return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
  }

  // Set speed while preserving direction
  setSpeed(speed) {
    const magnitude = this.getSpeed();
    if (magnitude > 0) {
      this.dx = (this.dx / magnitude) * speed;
      this.dy = (this.dy / magnitude) * speed;
    }
  }

  // Reset ball velocity based on current orientation
  resetVelocity() {
    if (CONFIG.isVertical()) {
      // Vertical mode: ball moves toward top or bottom paddle
      this.dx = 0;
      this.dy = Math.random() < 0.5 ? -CONFIG.BALL_SPEED : CONFIG.BALL_SPEED;
    } else {
      // Horizontal mode: ball moves toward left or right paddle
      this.dx = Math.random() < 0.5 ? -CONFIG.BALL_SPEED : CONFIG.BALL_SPEED;
      this.dy = 0;
    }
  }

  // Ensure minimum horizontal velocity to prevent vertical stalling
  ensureMinimumHorizontalVelocity(minHorizontalRatio = 0.3) {
    const currentSpeed = this.getSpeed();
    const horizontalSpeed = Math.abs(this.dx);
    const minHorizontalSpeed = currentSpeed * minHorizontalRatio;

    if (horizontalSpeed < minHorizontalSpeed) {
      const horizontalDeficit = minHorizontalSpeed - horizontalSpeed;

      if (this.dx >= 0) {
        this.dx += horizontalDeficit;
      } else {
        this.dx -= horizontalDeficit;
      }

      // Adjust vertical velocity to maintain total speed
      const newHorizontalSpeed = Math.abs(this.dx);
      const newVerticalSpeed = Math.sqrt(
        currentSpeed * currentSpeed - newHorizontalSpeed * newHorizontalSpeed
      );

      if (this.dy >= 0) {
        this.dy = newVerticalSpeed;
      } else {
        this.dy = -newVerticalSpeed;
      }
    }
  }

  // Ensure minimum vertical velocity to prevent horizontal stalling (for vertical mode)
  ensureMinimumVerticalVelocity(minVerticalRatio = 0.3) {
    const currentSpeed = this.getSpeed();
    const verticalSpeed = Math.abs(this.dy);
    const minVerticalSpeed = currentSpeed * minVerticalRatio;

    if (verticalSpeed < minVerticalSpeed) {
      const verticalDeficit = minVerticalSpeed - verticalSpeed;

      if (this.dy >= 0) {
        this.dy += verticalDeficit;
      } else {
        this.dy -= verticalDeficit;
      }

      // Adjust horizontal velocity to maintain total speed
      const newVerticalSpeed = Math.abs(this.dy);
      const newHorizontalSpeed = Math.sqrt(
        currentSpeed * currentSpeed - newVerticalSpeed * newVerticalSpeed
      );

      if (this.dx >= 0) {
        this.dx = newHorizontalSpeed;
      } else {
        this.dx = -newHorizontalSpeed;
      }
    }
  }

  // Increase speed by increment while preserving direction
  increaseSpeed(increment) {
    const currentSpeed = this.getSpeed();
    const newSpeed = Math.min(CONFIG.MAX_BALL_SPEED, currentSpeed + increment);

    // Update base speed and recalculate with current multiplier
    this.baseSpeed = newSpeed / this.currentSpeedMultiplier;

    // Apply the new speed
    this.setSpeed(newSpeed);
  }

  // Update ball position and physics
  update() {
    // Ensure minimum speed to prevent ball from getting stuck
    const currentSpeed = this.getSpeed();
    if (currentSpeed < CONFIG.BALL_SPEED * 0.5) {
      this.setSpeed(CONFIG.BALL_SPEED * 0.5);
    }

    this.x += this.dx;
    this.y += this.dy;

    // Check wall collisions
    this.checkWallCollision();

    // Record position for retro trail
    if (CONFIG.BALL_TRAIL && CONFIG.BALL_TRAIL.ENABLED) {
      this.trail.push(this.x, this.y, this.radius, CONFIG.BALL_TRAIL.LENGTH);
    }

    // Update portal cooldown
    if (this.portalCooldown > 0) {
      this.portalCooldown -= 16; // Assuming ~60fps (16ms per frame)
    }
  }

  // Check collision with walls
  checkWallCollision() {
    this.checkWallBounce();
    this.checkScoring();
  }

  // Handle wall bouncing (non-scoring walls)
  checkWallBounce() {
    const buffer = 2; // Small buffer to prevent edge cases

    if (CONFIG.isVertical()) {
      // Vertical mode: bounce off left/right walls
      if (this.x - this.radius <= buffer) {
        this.dx = Math.abs(this.dx); // Force rightward
        this.x = this.radius + buffer;
        this.emitWallCollision();
      } else if (this.x + this.radius >= CONFIG.CANVAS_WIDTH - buffer) {
        this.dx = -Math.abs(this.dx); // Force leftward
        this.x = CONFIG.CANVAS_WIDTH - this.radius - buffer;
        this.emitWallCollision();
      }
    } else {
      // Horizontal mode: bounce off top/bottom walls
      if (this.y - this.radius <= buffer) {
        this.dy = Math.abs(this.dy); // Force downward
        this.y = this.radius + buffer;
        this.emitWallCollision();
      } else if (this.y + this.radius >= CONFIG.CANVAS_HEIGHT - buffer) {
        this.dy = -Math.abs(this.dy); // Force upward
        this.y = CONFIG.CANVAS_HEIGHT - this.radius - buffer;
        this.emitWallCollision();
      }
    }
  }

  // Handle scoring (ball goes off screen)
  checkScoring() {
    if (this.disabled) return;

    const scoreBuffer = this.radius * 2 - 2; // Trigger scoring before ball is completely off screen

    if (CONFIG.isVertical()) {
      // Vertical mode: score on top/bottom
      if (this.y + scoreBuffer < 0) {
        this.triggerScore("right"); // Bottom paddle scores
      } else if (this.y - scoreBuffer > CONFIG.CANVAS_HEIGHT) {
        this.triggerScore("left"); // Top paddle scores
      }
    } else {
      console.log(this.x + scoreBuffer);
      // Horizontal mode: score on left/right
      if (this.x + scoreBuffer < 0) {
        this.triggerScore("right"); // Right paddle scores
      } else if (this.x - scoreBuffer > CONFIG.CANVAS_WIDTH) {
        this.triggerScore("left"); // Left paddle scores
      }
    }
  }

  // Emit wall collision event
  emitWallCollision() {
    eventBus.emit("ball:wallCollision", {
      ball: this,
      x: this.x,
      y: this.y,
      type: "wall_hit",
    });
  }

  // Trigger scoring event
  triggerScore(scorer) {
    eventBus.emit("ball:score", {
      ball: this,
      scorer: scorer,
      points: 1,
    });
    this.disabled = true;
  }

  // Apply powerup effects
  applyEffects() {
    let sizeMultiplier = 1;
    let speedMultiplier = 1;

    // Calculate multipliers from all active effects
    this.effects.forEach((effectData) => {
      if (effectData.effect.ballSize) {
        sizeMultiplier *= effectData.effect.ballSize;
      }
      if (effectData.effect.ballSpeed) {
        speedMultiplier *= effectData.effect.ballSpeed;
      }
    });

    // Apply size effect
    this.radius = this.baseRadius * sizeMultiplier;

    // Apply speed effect - only if multiplier changed
    if (speedMultiplier !== this.currentSpeedMultiplier) {
      this.currentSpeedMultiplier = speedMultiplier;

      // Calculate new speed based on base speed and current multiplier
      const newSpeed = this.baseSpeed * speedMultiplier;

      // Preserve current direction while setting new speed
      const currentSpeed = this.getSpeed();
      if (currentSpeed > 0) {
        this.dx = (this.dx / currentSpeed) * newSpeed;
        this.dy = (this.dy / currentSpeed) * newSpeed;
      }
    }
  }

  // Add powerup effect
  addEffect(type, effect) {
    this.effects.set(type, { type, effect });
    this.applyEffects();
  }

  // Remove powerup effect
  removeEffect(type) {
    this.effects.delete(type);
    this.applyEffects();
  }

  // Handle paddle collision
  handlePaddleCollision(paddle) {
    // Get current ball speed
    const currentSpeed = this.getSpeed();

    if (CONFIG.isVertical()) {
      // Vertical mode: paddles are horizontal (top/bottom)
      // Calculate hit point relative to paddle center along X axis
      const hitPoint = (this.x - paddle.x) / paddle.currentWidth;

      // Add randomness to hit angle (makes AI less predictable)
      const randomAngleOffset = (Math.random() - 0.5) * 0.3; // ±0.15 radians
      const baseAngle = ((hitPoint - 0.5) * Math.PI) / 3; // -30 to +30 degrees
      const finalAngle = baseAngle + randomAngleOffset;

      // Clamp angle to reasonable bounds and ensure variety
      let clampedAngle = clamp(finalAngle, -Math.PI / 3, Math.PI / 3);

      // Prevent the ball from getting stuck in horizontal patterns
      if (Math.abs(clampedAngle) > Math.PI / 4) {
        const verticalBias = (Math.random() - 0.5) * 0.4; // ±0.2 radians
        clampedAngle = clampedAngle * 0.7 + verticalBias * 0.3;
      }

      // Calculate new velocity components
      let newDx, newDy;

      if (paddle.side === "left") {
        // Top paddle
        const minVerticalSpeed = currentSpeed * 0.3;
        newDy = Math.max(
          minVerticalSpeed,
          Math.abs(Math.cos(clampedAngle) * currentSpeed)
        );
        newDx = Math.sin(clampedAngle) * currentSpeed;
      } else {
        // Bottom paddle
        const minVerticalSpeed = currentSpeed * 0.3;
        newDy = -Math.max(
          minVerticalSpeed,
          Math.abs(Math.cos(clampedAngle) * currentSpeed)
        );
        newDx = Math.sin(clampedAngle) * currentSpeed;
      }

      // Add paddle momentum transfer for more realistic physics
      const paddleVelocityX =
        paddle.velocityX * CONFIG.PADDLE_MOMENTUM_TRANSFER;

      // Apply paddle momentum to ball's horizontal velocity
      newDx += paddleVelocityX;

      // Apply new velocities
      this.dx = newDx;
      this.dy = newDy;

      // Ensure minimum vertical velocity to prevent horizontal stalling
      this.ensureMinimumVerticalVelocity(0.3);
    } else {
      // Horizontal mode: original logic
      // Calculate hit point relative to paddle center
      const hitPoint = (this.y - paddle.y) / paddle.currentHeight;

      // Add randomness to hit angle (makes AI less predictable)
      const randomAngleOffset = (Math.random() - 0.5) * 0.3; // ±0.15 radians
      const baseAngle = ((hitPoint - 0.5) * Math.PI) / 3; // -30 to +30 degrees
      const finalAngle = baseAngle + randomAngleOffset;

      // Clamp angle to reasonable bounds and ensure variety
      let clampedAngle = clamp(finalAngle, -Math.PI / 3, Math.PI / 3);

      // Prevent the ball from getting stuck in vertical patterns
      if (Math.abs(clampedAngle) > Math.PI / 4) {
        const horizontalBias = (Math.random() - 0.5) * 0.4; // ±0.2 radians
        clampedAngle = clampedAngle * 0.7 + horizontalBias * 0.3;
      }

      // Calculate new velocity components
      let newDx, newDy;

      if (paddle.side === "left") {
        const minHorizontalSpeed = currentSpeed * 0.3;
        newDx = Math.max(
          minHorizontalSpeed,
          Math.abs(Math.cos(clampedAngle) * currentSpeed)
        );
        newDy = Math.sin(clampedAngle) * currentSpeed;
      } else {
        const minHorizontalSpeed = currentSpeed * 0.3;
        newDx = -Math.max(
          minHorizontalSpeed,
          Math.abs(Math.cos(clampedAngle) * currentSpeed)
        );
        newDy = Math.sin(clampedAngle) * currentSpeed;
      }

      // Add paddle momentum transfer for more realistic physics
      const paddleVelocityY = paddle.velocity * CONFIG.PADDLE_MOMENTUM_TRANSFER;

      // Apply paddle momentum to ball's vertical velocity
      newDy += paddleVelocityY;

      // Apply new velocities
      this.dx = newDx;
      this.dy = newDy;

      // Ensure minimum horizontal velocity to prevent stalling
      this.ensureMinimumHorizontalVelocity(0.3);
    }

    this.lastHitBy = paddle.side;

    // Increase ball speed gradually
    this.increaseSpeed(CONFIG.SPEED_INCREMENT);

    // Emit paddle collision event
    eventBus.emit("ball:paddleCollision", {
      ball: this,
      paddle,
      x: this.x,
      y: this.y,
    });
  }

  // Reset ball to center
  reset() {
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = CONFIG.CANVAS_HEIGHT / 2;

    // Set initial velocity with random direction
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.dx = CONFIG.BALL_SPEED * direction;
    this.dy = (Math.random() - 0.5) * CONFIG.BALL_SPEED;

    this.lastHitBy = null;

    // Clear temporary effects and reset speed
    this.effects.clear();
    this.currentSpeedMultiplier = 1;
    this.baseSpeed = CONFIG.BALL_SPEED;
    this.portalCooldown = 0;

    // Clear trail
    this.trail.clear();
  }

  // Check if ball is off screen
  isOffScreen() {
    const buffer = this.radius * 2;
    return (
      this.x < -buffer ||
      this.x > CONFIG.CANVAS_WIDTH + buffer ||
      this.y < -buffer ||
      this.y > CONFIG.CANVAS_HEIGHT + buffer
    );
  }

  // Render ball with retro style
  render(ctx) {
    // Retro square trail behind the ball
    if (CONFIG.BALL_TRAIL && CONFIG.BALL_TRAIL.ENABLED) {
      this.trail.render(
        ctx,
        CONFIG.COLORS.BALL_TRAIL,
        CONFIG.BALL_TRAIL.OPACITY
      );
    }

    // Main ball
    ctx.fillStyle = CONFIG.COLORS.BALL;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Glowing border for powerup effects
    if (this.effects.size > 0) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // Get ball bounds for collision detection
  getBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius,
    };
  }

  // Clone ball (for powerup effect)
  clone() {
    const clone = new Ball(this.x, this.y);
    clone.dx = -this.dx;
    clone.dy = this.dy;
    clone.setSpeed(this.getSpeed());
    clone.radius = this.radius;
    clone.baseSpeed = this.baseSpeed;
    clone.currentSpeedMultiplier = this.currentSpeedMultiplier;

    // Copy active effects
    this.effects.forEach((effectData, type) => {
      clone.addEffect(type, effectData.effect);
    });

    return clone;
  }
}

export default Ball;
