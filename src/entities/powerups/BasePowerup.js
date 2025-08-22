import GameObject from "../GameObject.js";
import { CONFIG } from "../../config/game.js";
import { generateId } from "../../utils/index.js";

// Base class for all powerups
// Each specific powerup type should extend this class
export default class BasePowerup extends GameObject {
  constructor(x, y, config = {}) {
    super(x, y, "powerup");

    // Powerup configuration
    this.powerupType = config.type || "unknown";
    this.emoji = config.emoji || "⭐";
    this.label = config.label || "Powerup";
    this.color = config.color || "#ffffff";
    this.category = config.category || "beneficial";

    // State management
    this.collected = false;
    this.collectionCooldown = 0;

    // Set collision properties
    this.collidable = true;
    this.collisionRadius = CONFIG.POWERUP_SIZE / 2;

    // Lifetime management
    this.lifetime = config.lifetime || 15000; // 15 seconds default
    this.maxLifetime = this.lifetime;
    this.startTime = Date.now();
    this.expired = false;
  }

  // Update powerup state
  update(deltaTime = 16, gameState = null) {
    super.update(deltaTime, gameState);

    // Decrease collection cooldown
    if (this.collectionCooldown > 0) {
      this.collectionCooldown -= deltaTime;
    }

    // Check if powerup should expire
    const age = Date.now() - this.startTime;
    if (age >= this.lifetime) {
      this.expired = true;
      this.markForRemoval();
    }

    // Mark for removal if collected
    if (this.collected) {
      this.markForRemoval();
    }

    return null;
  }

  // Override shouldRemove to include powerup-specific conditions
  shouldRemove() {
    return super.shouldRemove() || this.collected || this.expired;
  }

  // Handle collision with another object
  onCollision(other, collisionType = "default") {
    switch (other.type) {
      case "ball":
        return this.handleBallCollision(other);
      default:
        return false;
    }
  }

  // Handle collision with ball
  handleBallCollision(ball) {
    if (this.collect()) {
      // Apply the powerup effect
      this.applyEffect(ball);
      return true;
    }
    return false;
  }

  // Mark powerup as collected
  collect() {
    if (this.collected || this.collectionCooldown > 0) return false;

    this.collected = true;
    this.collectionCooldown = 100; // 100ms cooldown
    return true;
  }

  // Apply powerup effect - to be overridden by subclasses
  applyEffect(ball) {
    console.warn(
      `Powerup ${this.powerupType} does not implement applyEffect method`
    );
  }

  // Get center position for effects
  getCenterPosition() {
    return {
      x: this.x + CONFIG.POWERUP_SIZE / 2,
      y: this.y + CONFIG.POWERUP_SIZE / 2,
    };
  }

  // Render powerup with enhanced visual effects
  render(ctx) {
    if (this.collected || this.expired) return;

    const centerX = this.x + CONFIG.POWERUP_SIZE / 2;
    const centerY = this.y + CONFIG.POWERUP_SIZE / 2;
    const radius = CONFIG.POWERUP_SIZE / 2;
    const time = Date.now() * 0.003;

    // Calculate lifetime alpha and ratio
    const age = Date.now() - this.startTime;
    const lifetimeAlpha = Math.max(0.5, 1 - age / this.maxLifetime);
    const lifetimeRatio = 1 - age / this.maxLifetime;

    ctx.save();

    // Enhanced category-based visual effects
    this.renderCategoryEffects(
      ctx,
      centerX,
      centerY,
      radius,
      time,
      lifetimeAlpha
    );

    // Main powerup body with gradient
    const bodyGradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    );
    bodyGradient.addColorStop(0, "#ffffff40");
    bodyGradient.addColorStop(0.3, this.color);
    bodyGradient.addColorStop(1, this.color + "cc");

    ctx.globalAlpha = lifetimeAlpha;
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border highlight
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.globalAlpha = lifetimeAlpha * 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Lifetime indicator
    if (lifetimeRatio < 0.5) {
      ctx.strokeStyle = lifetimeRatio < 0.2 ? "#ff4444" : "#ffaa44";
      ctx.lineWidth = 3;
      ctx.globalAlpha =
        lifetimeRatio < 0.2 ? Math.sin(Date.now() * 0.01) * 0.5 + 0.5 : 0.8;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2 * lifetimeRatio);
      ctx.stroke();
    }

    ctx.restore();

    // Emoji icon
    ctx.fillStyle = "#000";
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      this.emoji,
      this.x + CONFIG.POWERUP_SIZE / 2,
      this.y + CONFIG.POWERUP_SIZE / 2 + 5
    );

    // Label with better contrast
    const labelColor =
      this.category === "detrimental"
        ? "#ffaa00"
        : this.category === "beneficial"
        ? "#ffffff"
        : "#ffff00";
    ctx.globalAlpha = lifetimeAlpha;
    ctx.fillStyle = labelColor;
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      this.label,
      this.x + CONFIG.POWERUP_SIZE / 2,
      this.y + CONFIG.POWERUP_SIZE + 14
    );
  }

  // Render category-specific effects
  renderCategoryEffects(ctx, centerX, centerY, radius, time, lifetimeAlpha) {
    if (this.category === "beneficial") {
      // Beneficial powerups: bright glow with pulsing energy
      const pulse = Math.sin(time * 2) * 0.3 + 0.7;

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.5,
        centerX,
        centerY,
        radius * 2.5
      );
      glowGradient.addColorStop(0, this.color + "80");
      glowGradient.addColorStop(0.5, this.color + "40");
      glowGradient.addColorStop(1, this.color + "00");

      ctx.globalAlpha = lifetimeAlpha * 0.8;
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Rotating energy rings
      for (let i = 0; i < 2; i++) {
        const ringRadius = radius + 8 + i * 6;
        const rotation = time + i * Math.PI;

        ctx.globalAlpha = lifetimeAlpha * (0.6 - i * 0.1);
        ctx.strokeStyle = this.color + "60";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = -rotation * 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    } else if (this.category === "detrimental") {
      // Detrimental powerups: warning effects
      const pulse = Math.sin(time * 3) * 0.4 + 0.6;

      // Warning glow
      const warningGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.3,
        centerX,
        centerY,
        radius * 2
      );
      warningGradient.addColorStop(0, "#ff000080");
      warningGradient.addColorStop(0.5, "#ff000040");
      warningGradient.addColorStop(1, "#ff000000");

      ctx.globalAlpha = lifetimeAlpha * 0.8;
      ctx.fillStyle = warningGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Danger spikes
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 3;
      ctx.globalAlpha = lifetimeAlpha * pulse;

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + time;
        const innerRadius = radius + 5;
        const outerRadius = radius + 15 * pulse;

        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * innerRadius,
          centerY + Math.sin(angle) * innerRadius
        );
        ctx.lineTo(
          centerX + Math.cos(angle) * outerRadius,
          centerY + Math.sin(angle) * outerRadius
        );
        ctx.stroke();
      }
    } else if (this.category === "chaotic") {
      // Chaotic powerups: unpredictable swirling effects
      const chaos1 = Math.sin(time * 1.7) * 0.5 + 0.5;
      const chaos2 = Math.cos(time * 2.3) * 0.5 + 0.5;

      // Swirling energy field
      const chaosGradient = ctx.createRadialGradient(
        centerX + chaos1 * 5,
        centerY + chaos2 * 5,
        radius * 0.2,
        centerX,
        centerY,
        radius * 2
      );
      chaosGradient.addColorStop(0, this.color + "80");
      chaosGradient.addColorStop(0.6, this.color + "40");
      chaosGradient.addColorStop(1, this.color + "00");

      ctx.globalAlpha = lifetimeAlpha * 0.8;
      ctx.fillStyle = chaosGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Chaotic spiral
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = lifetimeAlpha * 0.6;

      ctx.beginPath();
      for (let i = 0; i < 30; i++) {
        const spiralAngle = (i / 30) * Math.PI * 4 + time * 2;
        const spiralRadius = (radius + 10) * (i / 30);
        const x = centerX + Math.cos(spiralAngle) * spiralRadius * chaos1;
        const y = centerY + Math.sin(spiralAngle) * spiralRadius * chaos2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
