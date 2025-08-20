import { CONFIG } from "../config/game.js";
import GameObject from "./GameObject.js";

// Wall Entity - Represents temporary walls created by powerups
class Wall extends GameObject {
  constructor(x, y, width, height, config = {}) {
    super(x, y, "wall");

    this.width = width;
    this.height = height;
    this.lifetime = config.lifetime || 5000; // 5 seconds default
    this.maxLifetime = this.lifetime;

    // Visual properties
    this.color = config.color || CONFIG.COLORS.WALL;
    this.opacity = 1;

    // Lifetime management
    this.startTime = Date.now();
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
  }

  // Render wall
  render(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Add border for better visibility
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Add lifetime warning effect
    const age = Date.now() - this.startTime;
    const lifetimeRatio = 1 - age / this.maxLifetime;
    if (lifetimeRatio < 0.3) {
      ctx.globalAlpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
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
