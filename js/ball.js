import { CONFIG } from "./config.js";
import BallTrail from "./ball-trail.js";

// Ball Class
class Ball {
  constructor(x, y, game = null) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.BALL_SIZE;
    this.baseRadius = CONFIG.BALL_SIZE;
    this.dx = CONFIG.BALL_SPEED;
    this.dy = 0;
    this.lastHitBy = null;
    this.game = game; // Store game reference

    // Powerup effects
    this.effects = new Map();

    // Store base speed for effects
    this.baseSpeed = CONFIG.BALL_SPEED;
    this.currentSpeedMultiplier = 1;

    // Retro trail helper
    this.trail = new BallTrail();
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

  // Ensure minimum horizontal velocity to prevent vertical stalling
  ensureMinimumHorizontalVelocity(minHorizontalRatio = 0.3) {
    const currentSpeed = this.getSpeed();
    const horizontalSpeed = Math.abs(this.dx);
    const minHorizontalSpeed = currentSpeed * minHorizontalRatio;

    if (horizontalSpeed < minHorizontalSpeed) {
      // Increase horizontal velocity while maintaining total speed
      const horizontalDeficit = minHorizontalSpeed - horizontalSpeed;
      const verticalSpeed = Math.abs(this.dy);

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

  // Increase speed by increment while preserving direction
  increaseSpeed(increment) {
    const currentSpeed = this.getSpeed();
    const newSpeed = Math.min(CONFIG.MAX_BALL_SPEED, currentSpeed + increment);

    // Update base speed and recalculate with current multiplier
    this.baseSpeed = newSpeed / this.currentSpeedMultiplier;

    // Apply the new speed
    this.setSpeed(newSpeed);
  }

  // Update ball position
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
  }

  // Check collision with walls
  checkWallCollision() {
    // Top and bottom walls
    if (
      this.y - this.radius <= 0 ||
      this.y + this.radius >= CONFIG.CANVAS_HEIGHT
    ) {
      this.dy = -this.dy;
      this.y = Math.max(
        this.radius,
        Math.min(CONFIG.CANVAS_HEIGHT - this.radius, this.y)
      );

      // Create wall collision particles
      if (this.game && this.game.createParticleEffect) {
        this.game.createParticleEffect(this.x, this.y, "wall_hit");
      }
    }

    // Left and right walls (ball goes off screen)
    if (this.x - this.radius <= 0) {
      this.game.addScore("right", 1);
      // Create scoring particles
      if (this.game && this.game.createParticleEffect) {
        this.game.createParticleEffect(this.x, this.y, "score");
      }
    } else if (this.x + this.radius >= CONFIG.CANVAS_WIDTH) {
      this.game.addScore("left", 1);
      // Create scoring particles
      if (this.game && this.game.createParticleEffect) {
        this.game.createParticleEffect(this.x, this.y, "score");
      }
    }
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

    // Apply effects immediately
    this.applyEffects();
  }

  // Remove powerup effect
  removeEffect(type) {
    this.effects.delete(type);

    // Reapply effects after removal
    this.applyEffects();
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

    // Clear trail
    this.trail.clear();
  }

  // Check if ball is off screen
  isOffScreen() {
    return (
      this.x < -this.radius ||
      this.x > CONFIG.CANVAS_WIDTH + this.radius ||
      this.y < -this.radius ||
      this.y > CONFIG.CANVAS_HEIGHT + this.radius
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

    // Retro scanlines effect
    // ctx.strokeStyle = "#aa0000";
    // ctx.lineWidth = 1;
    // for (let i = -this.radius; i < this.radius; i += 3) {
    //   ctx.beginPath();
    //   ctx.moveTo(this.x - this.radius, this.y + i);
    //   ctx.lineTo(this.x + this.radius, this.y + i);
    //   ctx.stroke();
    // }

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
    const clone = new Ball(this.x, this.y, this.game);
    clone.dx = -this.dx;
    clone.dy = this.dy;
    clone.setSpeed(this.getSpeed());
    clone.radius = this.radius;
    return clone;
  }
}

export default Ball;
