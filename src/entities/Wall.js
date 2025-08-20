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
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Pulsing outer border
    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
    ctx.globalAlpha = this.opacity * pulse * 0.8;
    ctx.strokeStyle = "#ffcccc";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

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
