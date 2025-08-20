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

    // Lifetime management
    this.lifetime = this.config.lifetime || 15000; // 15 seconds default
    this.maxLifetime = this.lifetime;
    this.startTime = Date.now();
    this.expired = false;
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

  // Update powerup state
  update(deltaTime) {
    // Check if powerup should expire
    const age = Date.now() - this.startTime;
    if (age >= this.lifetime) {
      this.expired = true;
    }
  }

  // Check if powerup should be destroyed
  shouldDestroy() {
    return this.collected || this.expired;
  }

  // Mark powerup as collected
  collect() {
    this.collected = true;
  }

  // Render powerup with enhanced visual effects
  render(ctx) {
    if (this.collected || this.expired) return;

    const centerX = this.x + CONFIG.POWERUP_SIZE / 2;
    const centerY = this.y + CONFIG.POWERUP_SIZE / 2;
    const radius = CONFIG.POWERUP_SIZE / 2;
    const time = Date.now() * 0.003;
    const powerupColor = this.config.color || CONFIG.COLORS.POWERUP;

    // Calculate lifetime alpha and ratio
    const age = Date.now() - this.startTime;
    const lifetimeAlpha = Math.max(0.5, 1 - age / this.maxLifetime);
    const lifetimeRatio = 1 - age / this.maxLifetime;

    ctx.save();

    // Enhanced category-based visual effects
    if (this.config.category === "beneficial") {
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
      glowGradient.addColorStop(0, powerupColor + "80");
      glowGradient.addColorStop(0.5, powerupColor + "40");
      glowGradient.addColorStop(1, powerupColor + "00");

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
        ctx.strokeStyle = powerupColor + "60";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = -rotation * 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    } else if (this.config.category === "detrimental") {
      // Detrimental powerups: warning effects with danger indicators
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
      ctx.globalAlpha = 1;
    } else if (this.config.category === "chaotic") {
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
      chaosGradient.addColorStop(0, powerupColor + "80");
      chaosGradient.addColorStop(0.6, powerupColor + "40");
      chaosGradient.addColorStop(1, powerupColor + "00");

      ctx.globalAlpha = lifetimeAlpha * 0.8;
      ctx.fillStyle = chaosGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Chaotic spiral
      ctx.strokeStyle = powerupColor;
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
      ctx.globalAlpha = 1;
    }

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
    bodyGradient.addColorStop(0.3, powerupColor);
    bodyGradient.addColorStop(1, powerupColor + "cc");

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
    ctx.globalAlpha = 1;

    // Lifetime indicator (similar to Portal.js)
    if (lifetimeRatio < 0.5) {
      ctx.strokeStyle = lifetimeRatio < 0.2 ? "#ff4444" : "#ffaa44";
      ctx.lineWidth = 3;
      ctx.globalAlpha =
        lifetimeRatio < 0.2
          ? Math.sin(Date.now() * 0.01) * 0.5 + 0.5 // Pulsing warning for critical
          : 0.8; // Steady warning for low

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2 * lifetimeRatio);
      ctx.stroke();
    }

    ctx.restore();

    // Emoji icon
    // ctx.globalAlpha = lifetimeAlpha;
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
    ctx.globalAlpha = lifetimeAlpha;
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
