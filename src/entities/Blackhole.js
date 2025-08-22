import GameObject from "./GameObject.js";
import eventBus from "../core/EventBus.js";

// Blackhole Entity - Creates gravitational effects on balls
class Blackhole extends GameObject {
  constructor(x, y, config = {}) {
    super(x, y, "blackhole");

    // Blackhole properties
    this.radius = config.radius || 30;
    this.attractionRadius = config.attractionRadius || 150;
    this.attractionForce = config.attractionForce || 0.2;
    this.lifetime = config.lifetime || 15000; // 15 seconds
    this.maxLifetime = this.lifetime;

    // Visual properties
    this.rotationAngle = 0;
    this.pulseFactor = 1;

    // Lifetime management
    this.startTime = Date.now();
  }

  // Update blackhole state
  update(deltaTime = 16, gameState = null) {
    super.update(deltaTime, gameState);

    // Update visual effects
    this.rotationAngle += 0.05;
    this.pulseFactor = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;

    // Apply gravity to all balls if gameState is provided
    if (gameState && gameState.balls) {
      gameState.balls.forEach((ball) => {
        this.applyGravityToBall(ball);

        // Check if ball should be consumed
        if (this.checkBallConsumption(ball)) {
          ball.markForRemoval();
        }
      });
    }

    // Check if blackhole should expire
    const age = Date.now() - this.startTime;
    if (age >= this.lifetime) {
      this.destroy();
    }

    return null;
  }

  // Apply gravitational force to a ball
  applyGravityToBall(ball) {
    const distance = this.getDistanceTo(ball);

    // Only apply gravity if ball is within attraction radius
    if (distance > this.attractionRadius || distance < this.radius) {
      return;
    }

    // Calculate gravitational force (inverse square law, but clamped for gameplay)
    const forceMultiplier = Math.max(0.1, 1 - distance / this.attractionRadius);
    const force = this.attractionForce * forceMultiplier;

    // Calculate direction vector from ball to blackhole
    const dx = this.x - ball.x;
    const dy = this.y - ball.y;

    // Normalize direction
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude === 0) return;

    const normalizedDx = dx / magnitude;
    const normalizedDy = dy / magnitude;

    // Apply gravitational acceleration to ball velocity
    ball.dx += normalizedDx * force;
    ball.dy += normalizedDy * force;

    // Emit gravity effect event for visual feedback with increased frequency
    if (Math.random() < 0.8) {
      // 30% chance per frame for more visible effect
      eventBus.emit("blackhole:gravityApplied", {
        blackhole: this,
        ball,
        force: force,
        distance: distance,
      });
    }
  }

  // Check if ball is consumed by blackhole
  checkBallConsumption(ball) {
    const distance = this.getDistanceTo(ball);

    if (distance <= this.radius + ball.radius) {
      // Emit consumption event
      eventBus.emit("blackhole:ballConsumed", {
        blackhole: this,
        ball,
        x: this.x,
        y: this.y,
      });

      return true;
    }

    return false;
  }

  // Render blackhole with swirling visual effects
  render(ctx) {
    if (!this.active) return;

    const currentRadius = this.radius * this.pulseFactor;
    const attractionAlpha = Math.max(
      0.1,
      1 - (Date.now() - this.startTime) / this.lifetime
    );
    const time = Date.now() * 0.003;

    // Draw enhanced attraction field with multiple rings and pulsing effect
    ctx.save();

    // Draw outer attraction field with gradient
    const attractionGradient = ctx.createRadialGradient(
      this.x,
      this.y,
      currentRadius,
      this.x,
      this.y,
      this.attractionRadius
    );
    attractionGradient.addColorStop(0, "rgba(136, 68, 255, 0.4)");
    attractionGradient.addColorStop(0.5, "rgba(136, 68, 255, 0.2)");
    attractionGradient.addColorStop(1, "rgba(136, 68, 255, 0.05)");

    ctx.globalAlpha = attractionAlpha * 0.8;
    ctx.fillStyle = attractionGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.attractionRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw pulsing attraction ring
    const pulseIntensity = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.globalAlpha = 0.4 * attractionAlpha * pulseIntensity;
    ctx.strokeStyle = "#bb88ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.attractionRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw animated dashed rings showing gravitational waves
    for (let i = 0; i < 3; i++) {
      const ringRadius = this.attractionRadius * (0.4 + i * 0.3);
      const dashOffset = (time * 50 + i * 20) % 40;

      ctx.globalAlpha = (0.3 - i * 0.08) * attractionAlpha;
      ctx.strokeStyle = "#8844ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.lineDashOffset = -dashOffset;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw gravitational field lines
    ctx.globalAlpha = 0.2 * attractionAlpha;
    ctx.strokeStyle = "#aa66ff";
    ctx.lineWidth = 1;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const startRadius = currentRadius + 10;
      const endRadius = this.attractionRadius - 10;

      ctx.beginPath();
      ctx.moveTo(
        this.x + Math.cos(angle) * startRadius,
        this.y + Math.sin(angle) * startRadius
      );

      // Draw curved field line
      for (let j = 0; j <= 10; j++) {
        const t = j / 10;
        const radius = startRadius + (endRadius - startRadius) * t;
        const curveAngle = angle + Math.sin(t * Math.PI) * 0.3;
        const x = this.x + Math.cos(curveAngle) * radius;
        const y = this.y + Math.sin(curveAngle) * radius;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();

    // Draw main blackhole with enhanced glow
    ctx.save();
    ctx.globalAlpha = attractionAlpha;

    // Draw outer glow effect
    const glowGradient = ctx.createRadialGradient(
      this.x,
      this.y,
      currentRadius * 0.5,
      this.x,
      this.y,
      currentRadius * 2
    );
    glowGradient.addColorStop(0, "rgba(187, 136, 255, 0.6)");
    glowGradient.addColorStop(0.5, "rgba(136, 68, 255, 0.3)");
    glowGradient.addColorStop(1, "rgba(136, 68, 255, 0)");

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Create swirling gradient for main body
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      currentRadius
    );
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(0.3, "#440088");
    gradient.addColorStop(0.6, "#8844ff");
    gradient.addColorStop(1, "#bb88ff");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add pulsing outer ring
    ctx.strokeStyle = "#bb88ff";
    ctx.lineWidth = 3;
    ctx.globalAlpha = attractionAlpha * pulseIntensity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Draw swirling patterns
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3 * attractionAlpha;

    for (let i = 0; i < 4; i++) {
      const angle = this.rotationAngle + (i * Math.PI) / 2;
      const spiralRadius = currentRadius * 0.8;

      ctx.beginPath();
      for (let j = 0; j < 20; j++) {
        const spiralAngle = angle + j * 0.3;
        const radius = spiralRadius * (1 - j / 20);
        const x = this.x + Math.cos(spiralAngle) * radius;
        const y = this.y + Math.sin(spiralAngle) * radius;

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw central void
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw lifetime indicator
    const lifetimeRatio = 1 - (Date.now() - this.startTime) / this.maxLifetime;
    if (lifetimeRatio < 0.3) {
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5; // Pulsing warning
      ctx.beginPath();
      ctx.arc(
        this.x,
        this.y,
        currentRadius + 5,
        0,
        Math.PI * 2 * lifetimeRatio
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  // Get current attraction strength (for debugging)
  getAttractionStrength() {
    const age = Date.now() - this.startTime;
    return Math.max(0, 1 - age / this.lifetime);
  }
}

export default Blackhole;
