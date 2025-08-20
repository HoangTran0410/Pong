import { CONFIG } from "../config/game.js";
import { POWERUP_CONFIG } from "../config/powerups.js";

// Powerup Entity - Self-contained powerup object
class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.collected = false;
    this.id = `powerup_${Date.now()}_${Math.random()}`;

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
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < ball.radius + CONFIG.POWERUP_SIZE / 2;
  }

  // Mark powerup as collected
  collect() {
    this.collected = true;
  }

  // Render powerup
  render(ctx) {
    if (this.collected) return;

    // Body
    ctx.fillStyle = CONFIG.COLORS.POWERUP;
    ctx.beginPath();
    ctx.arc(
      this.x + CONFIG.POWERUP_SIZE / 2,
      this.y + CONFIG.POWERUP_SIZE / 2,
      CONFIG.POWERUP_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Emoji icon
    ctx.fillStyle = "#000";
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      this.config.emoji,
      this.x + CONFIG.POWERUP_SIZE / 2,
      this.y + CONFIG.POWERUP_SIZE / 2 + 5
    );

    // Label below
    ctx.fillStyle = "#ffff00";
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
