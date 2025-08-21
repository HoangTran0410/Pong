import { CONFIG } from "../config/game.js";
import GameObject from "./GameObject.js";

// Wall Entity - Represents temporary walls created by powerups
class Wall extends GameObject {
  constructor(x, y, width, height, config = {}) {
    super(x, y, "wall");

    this.width = width;
    this.height = height;
    this.lifetime = config.lifetime || 10000;
    this.maxLifetime = this.lifetime;

    // Visual properties
    this.color = config.color || CONFIG.COLORS.WALL;
    this.opacity = 1;

    // Lifetime management
    this.startTime = Date.now();

    // Movement properties
    this.isMoving = config.isMoving || false;
    this.movementPattern = config.movementPattern || "linear";
    this.movementSpeed = config.movementSpeed || 2;
    this.baseX = x;
    this.baseY = y;

    // Movement pattern specific properties
    this.movementDirection = config.movementDirection || { x: 1, y: 0 };
    this.oscillationRange = config.oscillationRange || 100;
    this.rotationRadius = config.rotationRadius || 50;
    this.movementPhase = Math.random() * Math.PI * 2; // Random starting phase

    // Movement bounds (to keep walls on screen)
    this.minX = this.width / 2;
    this.maxX = CONFIG.CANVAS_WIDTH - this.width / 2;
    this.minY = this.height / 2;
    this.maxY = CONFIG.CANVAS_HEIGHT - this.height / 2;
  }

  // Update wall state
  update(deltaTime) {
    super.update(deltaTime);

    // Check if wall should expire
    const age = Date.now() - this.startTime;
    if (age >= this.lifetime) {
      this.destroy();
    }

    // Calculate opacity based on lifetime for fade effect
    const lifetimeRatio = 1 - age / this.maxLifetime;
    this.opacity = Math.max(0.3, lifetimeRatio);

    // Update position if wall is moving
    if (this.isMoving) {
      this.updateMovement(deltaTime || 16); // Assume 16ms if deltaTime not provided
    }
  }

  // Update wall movement based on pattern
  updateMovement(deltaTime) {
    const time = Date.now() * 0.001; // Convert to seconds

    switch (this.movementPattern) {
      case "linear":
        this.updateLinearMovement(deltaTime);
        break;
      case "oscillating":
        this.updateOscillatingMovement(time);
        break;
      case "circular":
        this.updateCircularMovement(time);
        break;
      case "figure8":
        this.updateFigure8Movement(time);
        break;
      case "zigzag":
        this.updateZigzagMovement(time);
        break;
      default:
        this.updateLinearMovement(deltaTime);
    }

    // Keep wall within screen bounds
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
  }

  // Linear movement (straight line)
  updateLinearMovement(deltaTime) {
    this.x += this.movementDirection.x * this.movementSpeed * (deltaTime / 16);
    this.y += this.movementDirection.y * this.movementSpeed * (deltaTime / 16);

    // Bounce off walls
    if (this.x <= this.minX || this.x >= this.maxX) {
      this.movementDirection.x *= -1;
    }
    if (this.y <= this.minY || this.y >= this.maxY) {
      this.movementDirection.y *= -1;
    }
  }

  // Oscillating movement (back and forth)
  updateOscillatingMovement(time) {
    const offset =
      Math.sin(time * this.movementSpeed + this.movementPhase) *
      this.oscillationRange;

    // Oscillate in the direction with larger movement component
    if (
      Math.abs(this.movementDirection.x) > Math.abs(this.movementDirection.y)
    ) {
      this.x = this.baseX + offset * this.movementDirection.x;
      this.y = this.baseY;
    } else {
      this.x = this.baseX;
      this.y = this.baseY + offset * this.movementDirection.y;
    }
  }

  // Circular movement
  updateCircularMovement(time) {
    const angle = time * this.movementSpeed + this.movementPhase;
    this.x = this.baseX + Math.cos(angle) * this.rotationRadius;
    this.y = this.baseY + Math.sin(angle) * this.rotationRadius;
  }

  // Figure-8 movement
  updateFigure8Movement(time) {
    const t = time * this.movementSpeed + this.movementPhase;
    this.x = this.baseX + Math.sin(t) * this.rotationRadius;
    this.y = this.baseY + Math.sin(t * 2) * this.rotationRadius * 0.5;
  }

  // Zigzag movement
  updateZigzagMovement(time) {
    const t = time * this.movementSpeed + this.movementPhase;
    const zigzagOffset = Math.sin(t * 4) * 30; // Quick zigzag
    const forwardOffset =
      (t * 20) % (CONFIG.CANVAS_WIDTH + CONFIG.CANVAS_HEIGHT);

    if (
      Math.abs(this.movementDirection.x) > Math.abs(this.movementDirection.y)
    ) {
      // Moving horizontally with vertical zigzag
      this.x = this.baseX + forwardOffset * this.movementDirection.x;
      this.y = this.baseY + zigzagOffset;
    } else {
      // Moving vertically with horizontal zigzag
      this.x = this.baseX + zigzagOffset;
      this.y = this.baseY + forwardOffset * this.movementDirection.y;
    }
  }

  // Render wall with enhanced energy effects
  render(ctx) {
    if (!this.active) return;

    const age = Date.now() - this.startTime;
    const lifetimeRatio = 1 - age / this.maxLifetime;
    const time = Date.now() * 0.005;

    ctx.save();

    // Energy field around wall
    const glowGradient = ctx.createLinearGradient(
      this.x - 10,
      this.y,
      this.x + this.width + 10,
      this.y
    );
    glowGradient.addColorStop(0, "rgba(255, 107, 107, 0)");
    glowGradient.addColorStop(0.5, "rgba(255, 107, 107, 0.3)");
    glowGradient.addColorStop(1, "rgba(255, 107, 107, 0)");

    ctx.fillStyle = glowGradient;
    ctx.fillRect(this.x - 10, this.y - 5, this.width + 20, this.height + 10);

    // Main wall body with gradient
    const wallGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x + this.width,
      this.y
    );
    wallGradient.addColorStop(0, "#ff6b6b");
    wallGradient.addColorStop(0.5, "#ff4444");
    wallGradient.addColorStop(1, "#ff6b6b");

    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = wallGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Energy lines pattern
    ctx.strokeStyle = "#ffaaaa";
    ctx.lineWidth = 1;
    ctx.globalAlpha = this.opacity * 0.8;

    const lineSpacing = 8;
    for (let i = 0; i < this.height; i += lineSpacing) {
      const waveOffset = Math.sin(time + i * 0.1) * 3;
      ctx.beginPath();
      ctx.moveTo(this.x + waveOffset, this.y + i);
      ctx.lineTo(this.x + this.width + waveOffset, this.y + i);
      ctx.stroke();
    }

    // Vertical energy conduits
    for (let i = 0; i < this.width; i += 12) {
      const pulseHeight = Math.sin(time * 2 + i * 0.1) * 5 + 5;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.globalAlpha = this.opacity * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.x + i, this.y);
      ctx.lineTo(this.x + i, this.y + pulseHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.x + i, this.y + this.height);
      ctx.lineTo(this.x + i, this.y + this.height - pulseHeight);
      ctx.stroke();
    }

    // Enhanced border with energy effect
    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = this.isMoving ? "#00ffff" : "#ffffff"; // Cyan border for moving walls
    ctx.lineWidth = this.isMoving ? 3 : 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Pulsing outer border
    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
    ctx.globalAlpha = this.opacity * pulse * 0.8;
    ctx.strokeStyle = this.isMoving ? "#aaffff" : "#ffcccc";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

    // Moving wall indicator
    if (this.isMoving) {
      // Motion trails
      ctx.globalAlpha = this.opacity * 0.4;
      ctx.strokeStyle = "#00aaff";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Draw motion trails based on movement pattern
      for (let i = 1; i <= 3; i++) {
        ctx.strokeRect(
          this.x - i * 2,
          this.y - i * 2,
          this.width + i * 4,
          this.height + i * 4
        );
      }
      ctx.setLineDash([]);
    }

    // Lifetime warning effect (enhanced)
    if (lifetimeRatio < 0.3) {
      const warningPulse = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;

      // Warning glow
      ctx.globalAlpha = warningPulse * 0.6;
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 4;
      ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);

      // Danger sparks
      for (let i = 0; i < 4; i++) {
        const sparkX = this.x + Math.random() * this.width;
        const sparkY = this.y + Math.random() * this.height;
        const sparkSize = Math.random() * 3 + 1;

        ctx.fillStyle = "#ff4444";
        ctx.globalAlpha = warningPulse;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Get bounds for collision detection
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }
}

export default Wall;
