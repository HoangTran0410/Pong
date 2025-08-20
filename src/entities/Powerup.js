import { CONFIG } from "../config/game.js";
import { POWERUP_CONFIG } from "../config/powerups.js";
import { generateId, distance } from "../utils/index.js";

// Powerup Entity - Self-contained powerup object
class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.collected = false;
    this.id = generateId("powerup");

    // Get powerup configuration
    this.config = POWERUP_CONFIG[type] || {
      emoji: "⭐",
      label: type,
      effect: {},
    };
  }

  // Check if this powerup collides with a ball
  checkCollision(ball) {
    if (this.collected) return false;

    const px = this.x + CONFIG.POWERUP_SIZE / 2;
    const py = this.y + CONFIG.POWERUP_SIZE / 2;
    const dx = ball.x - px;
    const dy = ball.y - py;
    const dist = distance(ball.x, ball.y, px, py);

    return dist < ball.radius + CONFIG.POWERUP_SIZE / 2;
  }

  // Mark powerup as collected
  collect() {
    this.collected = true;
  }

  // Render powerup
  render(ctx) {
    if (this.collected) return;

    // Use powerup-specific color or fallback to default
    const powerupColor = this.config.color || CONFIG.COLORS.POWERUP;

    // Body with category-based visual effects
    ctx.fillStyle = powerupColor;
    ctx.beginPath();
    ctx.arc(
      this.x + CONFIG.POWERUP_SIZE / 2,
      this.y + CONFIG.POWERUP_SIZE / 2,
      CONFIG.POWERUP_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Add glow effect for beneficial powerups
    if (this.config.category === "beneficial") {
      ctx.shadowColor = powerupColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        this.x + CONFIG.POWERUP_SIZE / 2,
        this.y + CONFIG.POWERUP_SIZE / 2,
        CONFIG.POWERUP_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Add warning pulse for detrimental powerups
    if (this.config.category === "detrimental") {
      const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + CONFIG.POWERUP_SIZE / 2,
        this.y + CONFIG.POWERUP_SIZE / 2,
        CONFIG.POWERUP_SIZE / 2 + 3,
        0,
        Math.PI * 2
      );
      ctx.globalAlpha = pulse;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Emoji icon
    ctx.fillStyle = "#000";
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      this.config.emoji,
      this.x + CONFIG.POWERUP_SIZE / 2,
      this.y + CONFIG.POWERUP_SIZE / 2 + 5
    );

    // Label below with better contrast
    const labelColor =
      this.config.category === "detrimental"
        ? "#ffaa00"
        : this.config.category === "beneficial"
        ? "#ffffff"
        : "#ffff00";
    ctx.fillStyle = labelColor;
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      this.config.label,
      this.x + CONFIG.POWERUP_SIZE / 2,
      this.y + CONFIG.POWERUP_SIZE + 14
    );
  }

  // Get the position for particle effects
  getCenterPosition() {
    return {
      x: this.x + CONFIG.POWERUP_SIZE / 2,
      y: this.y + CONFIG.POWERUP_SIZE / 2,
    };
  }
}

export default Powerup;
