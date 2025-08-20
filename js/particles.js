import { CONFIG } from "./config.js";
import { PARTICLE_CONFIG } from "./particle-config.js";

// Particle Class
class Particle {
  constructor(x, y, type = "sparkle") {
    this.x = x;
    this.y = y;
    this.type = type;

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

  update() {
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
  }

  render(ctx) {
    if (this.life <= 0) return;

    const alpha = this.life / this.maxLife;
    const config = PARTICLE_CONFIG[this.type] || PARTICLE_CONFIG.sparkle;

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
}

// Particle Manager Class
class ParticleManager {
  constructor() {
    this.particles = [];
  }

  // Create particle effect at specific location
  createEffect(x, y, type = "sparkle", count = null) {
    // Use default count from config if not specified
    if (count === null) {
      count = this.getDefaultCount(type);
    }

    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, type));
    }
  }

  // Create powerup collection effect with automatic type selection
  createPowerupEffect(x, y, powerupType) {
    const effectConfig = this.getPowerupEffectConfig(powerupType);
    this.createEffect(x, y, effectConfig.type, effectConfig.count);
  }

  // Get default particle count based on type
  getDefaultCount(type) {
    const config = PARTICLE_CONFIG[type];
    if (!config) return 5;

    // Return count based on particle type characteristics
    switch (type) {
      case "explosion":
        return 10;
      case "magic":
        return 15;
      case "score":
        return 18;
      default:
        return 5;
    }
  }

  // Get powerup effect configuration
  getPowerupEffectConfig(powerupType) {
    if (powerupType.includes("speed") || powerupType.includes("ball")) {
      return { type: "explosion", count: 10 };
    } else if (
      powerupType.includes("clone") ||
      powerupType.includes("portal")
    ) {
      return { type: "magic", count: 10 };
    } else if (
      powerupType.includes("score") ||
      powerupType.includes("points")
    ) {
      return { type: "score", count: 10 };
    } else {
      return { type: "sparkle", count: 5 };
    }
  }

  // Create multiple particle effects at once
  createMultiEffect(x, y, types = ["sparkle"], counts = null) {
    types.forEach((type, index) => {
      const count = counts
        ? counts[index] || this.getDefaultCount(type)
        : this.getDefaultCount(type);
      this.createEffect(x, y, type, count);
    });
  }

  // Create particle trail effect
  createTrail(x, y, type = "sparkle", length = 5) {
    for (let i = 0; i < length; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      this.particles.push(new Particle(x + offsetX, y + offsetY, type));
    }
  }

  // Update all particles
  update() {
    this.particles = this.particles.filter((particle) => {
      particle.update();
      return !particle.isDead();
    });
  }

  // Render all particles
  render(ctx) {
    this.particles.forEach((particle) => particle.render(ctx));
  }

  // Clear all particles
  clear() {
    this.particles = [];
  }

  // Get particle count
  getParticleCount() {
    return this.particles.length;
  }

  // Get particles by type
  getParticlesByType(type) {
    return this.particles.filter((particle) => particle.type === type);
  }
}

export default ParticleManager;
