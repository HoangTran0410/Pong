import { PARTICLE_CONFIG } from "../config/particles.js";
import GameObject from "./GameObject.js";

// Particle Entity - Individual particle for visual effects
class Particle extends GameObject {
  constructor(x, y, type = "sparkle") {
    super(x, y, "particle");

    this.particleType = type; // Renamed to avoid conflict with GameObject.type
    const config = PARTICLE_CONFIG[type] || PARTICLE_CONFIG.sparkle;

    // Set properties from config
    this.vx = (Math.random() - 0.5) * config.velocity.x;
    this.vy = (Math.random() - 0.5) * config.velocity.y;
    this.life = config.life.min + Math.random() * config.life.max;
    this.maxLife = this.life;
    this.size = config.size.min + Math.random() * config.size.max;
    this.color = config.color;
    this.shadowBlur = config.shadowBlur;
    this.shape = config.shape;
    this.effects = config.effects || [];

    // Physics properties
    this.gravity = 0.2;
    this.friction = 0.98;
  }

  update(deltaTime = 16, gameState = null) {
    super.update(deltaTime, gameState);

    // Apply gravity
    this.vy += this.gravity;

    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Decrease life
    this.life--;

    // Mark for removal when dead
    if (this.isDead()) {
      this.markForRemoval();
    }

    return null;
  }

  render(ctx) {
    if (this.life <= 0 || this.toRemove) return;

    const alpha = this.life / this.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.shadowBlur;

    // Draw base shape
    this.drawShape(ctx, this.shape, this.x, this.y, this.size);

    // Apply additional effects
    if (this.effects.includes("cross_lines")) {
      this.drawCrossLines(ctx, this.x, this.y, this.size);
    }

    ctx.restore();
  }

  drawShape(ctx, shape, x, y, size) {
    switch (shape) {
      case "circle":
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "diamond":
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        break;

      case "square":
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        break;

      case "star":
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const starX = x + Math.cos(angle) * size;
          const starY = y + Math.sin(angle) * size;
          if (i === 0) ctx.moveTo(starX, starY);
          else ctx.lineTo(starX, starY);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case "plus":
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        break;

      default:
        // Fallback to circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
  }

  drawCrossLines(ctx, x, y, size) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - size * 2, y);
    ctx.lineTo(x + size * 2, y);
    ctx.moveTo(x, y - size * 2);
    ctx.lineTo(x, y + size * 2);
    ctx.stroke();
  }

  isDead() {
    return this.life <= 0;
  }

  // Override shouldRemove to include particle-specific conditions
  shouldRemove() {
    return super.shouldRemove() || this.isDead();
  }
}

export default Particle;
