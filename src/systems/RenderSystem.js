import { CONFIG } from "../config/game.js";
import Particle from "../entities/Particle.js";
import eventBus from "../core/EventBus.js";

// Render System - Handles all drawing and visual effects
class RenderSystem {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for events that should create particle effects
    eventBus.subscribe("ball:wallCollision", (data) => {
      this.createParticleEffect(data.x, data.y, data.type || "wall_hit");
    });

    eventBus.subscribe("ball:paddleCollision", (data) => {
      this.createParticleEffect(data.x, data.y, "paddle_hit");
    });

    eventBus.subscribe("ball:score", (data) => {
      this.createParticleEffect(data.ball.x, data.ball.y, "score");
    });

    eventBus.subscribe("paddle:shieldReflection", (data) => {
      this.createParticleEffect(data.x, data.y, "shield_reflection");
    });

    eventBus.subscribe("powerup:collected", (data) => {
      this.createPowerupEffect(data.x, data.y, data.powerupType);
    });

    eventBus.subscribe("ball:portalTeleport", (data) => {
      this.createParticleEffect(data.fromPortal.x, data.fromPortal.y, "magic");
      this.createParticleEffect(data.toPortal.x, data.toPortal.y, "magic");
    });
  }

  // Create particle effect at specific location
  createParticleEffect(x, y, type = "sparkle", count = null) {
    if (count === null) {
      count = this.getDefaultParticleCount(type);
    }

    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, type));
    }
  }

  // Create powerup collection effect with automatic type selection
  createPowerupEffect(x, y, powerupType) {
    const effectConfig = this.getPowerupEffectConfig(powerupType);
    this.createParticleEffect(x, y, effectConfig.type, effectConfig.count);
  }

  // Get default particle count based on type
  getDefaultParticleCount(type) {
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

  // Update particles
  updateParticles() {
    this.particles = this.particles.filter((particle) => {
      particle.update();
      return !particle.isDead();
    });
  }

  // Clear canvas and draw background
  clearCanvas() {
    this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw retro scanlines
  drawScanlines() {
    this.ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.height; i += 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
  }

  // Draw center line
  drawCenterLine() {
    this.ctx.strokeStyle = CONFIG.COLORS.CENTER_LINE;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  // Render paddles
  renderPaddles(paddles) {
    paddles.forEach((paddle) => {
      paddle.render(this.ctx);
    });
  }

  // Render balls
  renderBalls(balls) {
    balls.forEach((ball) => {
      ball.render(this.ctx);
    });
  }

  // Render powerups
  renderPowerups(powerups) {
    powerups.forEach((powerup) => {
      powerup.render(this.ctx);
    });
  }

  // Render random walls
  renderWalls(walls) {
    if (!walls || walls.length === 0) return;

    this.ctx.fillStyle = CONFIG.COLORS.WALL;
    walls.forEach((wall) => {
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
  }

  // Render portal pairs
  renderPortals(portals) {
    if (!portals || portals.length === 0) return;

    portals.forEach((pair) => {
      const { portal1, portal2 } = pair;

      // Draw connecting line between portals
      this.ctx.strokeStyle = "#00ffff";
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([10, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(portal1.x, portal1.y);
      this.ctx.lineTo(portal2.x, portal2.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw portal1 (blue) with spiral effect
      this.renderPortalWithSpiral(portal1, "#0066ff", "#00ccff");

      // Draw portal2 (purple) with spiral effect
      this.renderPortalWithSpiral(portal2, "#9900ff", "#cc66ff");
    });
  }

  // Render individual portal with spiral effect
  renderPortalWithSpiral(portal, primaryColor, secondaryColor) {
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time * 0.5) * 0.1 + 1;

    // Draw main portal circle with pulsing effect
    this.ctx.fillStyle = primaryColor;
    this.ctx.beginPath();
    this.ctx.arc(portal.x, portal.y, portal.radius * pulse, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw outer glow ring
    this.ctx.strokeStyle = secondaryColor;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(portal.x, portal.y, portal.radius - 2, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw inner ring
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(portal.x, portal.y, portal.radius - 8, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw spiral effect
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1.5;

    for (let arm = 0; arm < 3; arm++) {
      const armOffset = (arm * Math.PI * 2) / 3;

      this.ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const angle = time + armOffset + i * 0.3 + i * 0.1;
        const radius = (portal.radius - 15) * (1 - i / 20);

        if (radius > 0) {
          const x = portal.x + Math.cos(angle) * radius;
          const y = portal.y + Math.sin(angle) * radius;

          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
      }
      this.ctx.stroke();
    }

    // Draw center core
    this.ctx.fillStyle = "#ffffff";
    this.ctx.beginPath();
    this.ctx.arc(portal.x, portal.y, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw inner core glow
    this.ctx.fillStyle = secondaryColor;
    this.ctx.beginPath();
    this.ctx.arc(portal.x, portal.y, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // Render particles
  renderParticles() {
    this.particles.forEach((particle) => {
      particle.render(this.ctx);
    });
  }

  // Clear all particles
  clearParticles() {
    this.particles = [];
  }

  // Render flash texts
  renderFlashTexts(flashTexts) {
    flashTexts.forEach((flashText) => {
      flashText.render(this.ctx);
    });
  }

  // Main render method
  render(gameState) {
    // Update particles
    this.updateParticles();

    // Clear canvas and draw background
    this.clearCanvas();

    // Draw retro scanlines
    this.drawScanlines();

    // Draw center line
    this.drawCenterLine();

    // Render game objects in order (back to front)
    this.renderWalls(gameState.randomWalls);
    this.renderPortals(gameState.portals);
    this.renderPowerups(gameState.powerups || []);
    this.renderPaddles([gameState.leftPaddle, gameState.rightPaddle]);
    this.renderBalls(gameState.balls);

    // Render particles on top of everything
    this.renderParticles();

    // Render flash texts (on top of everything)
    this.renderFlashTexts(gameState.flashTexts || []);
  }
}

export default RenderSystem;
