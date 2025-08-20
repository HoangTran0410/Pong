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

    if (CONFIG.isVertical()) {
      // Horizontal center line for vertical mode
      this.ctx.moveTo(0, this.canvas.height / 2);
      this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    } else {
      // Vertical center line for horizontal mode
      this.ctx.moveTo(this.canvas.width / 2, 0);
      this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    }

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

  // Render blackholes
  renderBlackholes(blackholes) {
    blackholes.forEach((blackhole) => {
      blackhole.render(this.ctx);
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

    walls.forEach((wall) => {
      wall.render(this.ctx);
    });
  }

  // Render portal pairs
  renderPortals(portals) {
    if (!portals || portals.length === 0) return;

    portals.forEach((portalPair) => {
      portalPair.render(this.ctx);
    });
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
    this.renderBlackholes(gameState.blackholes || []);
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
