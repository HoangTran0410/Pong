import { CONFIG } from "../config/game.js";
import { POWERUP_CONFIG } from "../config/powerups.js";
import Powerup from "../entities/Powerup.js";
import Ball from "../entities/Ball.js";
import eventBus from "../core/EventBus.js";

// Powerup System - Handles powerup spawning, effects, and cleanup
class PowerupSystem {
  constructor() {
    this.powerups = [];
    this.activeEffects = new Map();
    this.randomWalls = [];
    this.portals = [];

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for powerup collection events
    eventBus.subscribe("powerup:collected", (data) => {
      this.applyPowerupEffect(data.powerup, data.ball);
    });
  }

  // Spawn a new powerup
  spawnPowerup() {
    if (this.powerups.length >= CONFIG.MAX_POWERUPS_ON_SCREEN) return;

    if (Math.random() < CONFIG.POWERUP_SPAWN_RATE) {
      const type = this.getRandomPowerupType();

      // Spawn powerups closer to the center
      const centerX = CONFIG.CANVAS_WIDTH / 2;
      const centerY = CONFIG.CANVAS_HEIGHT / 2;

      const spawnAreaWidth = CONFIG.CANVAS_WIDTH / 1.5;
      const spawnAreaHeight = CONFIG.CANVAS_HEIGHT / 1.5;

      let x = centerX - spawnAreaWidth / 2 + Math.random() * spawnAreaWidth;
      let y = centerY - spawnAreaHeight / 2 + Math.random() * spawnAreaHeight;

      // Ensure powerup stays within canvas bounds
      x = Math.max(
        CONFIG.POWERUP_SIZE / 2,
        Math.min(x, CONFIG.CANVAS_WIDTH - CONFIG.POWERUP_SIZE / 2)
      );
      y = Math.max(
        CONFIG.POWERUP_SIZE / 2,
        Math.min(y, CONFIG.CANVAS_HEIGHT - CONFIG.POWERUP_SIZE / 2)
      );

      const powerup = new Powerup(x, y, type);
      this.powerups.push(powerup);
    }
  }

  // Get random powerup type
  getRandomPowerupType() {
    const types = Object.keys(POWERUP_CONFIG);
    return types[Math.floor(Math.random() * types.length)];
  }

  // Check powerup collisions with balls
  checkCollisions(balls) {
    const collisions = [];

    this.powerups.forEach((powerup, index) => {
      if (!powerup.collected) {
        balls.forEach((ball) => {
          if (powerup.checkCollision(ball)) {
            powerup.collect();
            const centerPos = powerup.getCenterPosition();

            // Emit powerup collected event
            eventBus.emit("powerup:collected", {
              powerup,
              ball,
              x: centerPos.x,
              y: centerPos.y,
              powerupType: powerup.type,
            });

            collisions.push({ powerup, ball, index });
          }
        });
      }
    });

    // Remove collected powerups
    collisions.forEach(({ index }) => {
      this.powerups.splice(index, 1);
    });

    return collisions;
  }

  // Apply powerup effect
  applyPowerupEffect(powerup, ball) {
    const effect = powerup.config.effect;

    // Apply immediate effects
    if (effect.scoreBonus) {
      this.applyScoreBonus(ball, effect.scoreBonus);
    }
    if (effect.scorePenalty) {
      this.applyScorePenalty(ball, effect.scorePenalty);
    }
    if (effect.randomDirection) {
      this.applyRandomDirection(ball);
    }
    if (effect.cloneBall) {
      this.applyCloneBall(ball);
    }
    if (effect.portal) {
      this.applyPortal();
    }
    if (effect.randomWall) {
      this.applyRandomWall();
    }
    if (effect.shield) {
      this.applyShield(ball);
    }

    // Apply timed effects
    if (effect.duration > 0) {
      this.applyTimedEffect(powerup.type, effect, ball);
    }
  }

  // Apply score bonus
  applyScoreBonus(ball, bonus) {
    eventBus.emit("game:scoreChange", {
      side: ball.lastHitBy,
      points: bonus,
    });
  }

  // Apply score penalty
  applyScorePenalty(ball, penalty) {
    eventBus.emit("game:scoreChange", {
      side: ball.lastHitBy,
      points: penalty,
    });
  }

  // Apply random direction
  applyRandomDirection(ball) {
    const angle = Math.random() * Math.PI * 2;
    const speed = ball.getSpeed();
    ball.dx = Math.cos(angle) * speed;
    ball.dy = Math.sin(angle) * speed;
  }

  // Apply clone ball
  applyCloneBall(ball) {
    const clone = ball.clone();
    eventBus.emit("game:ballSpawned", { ball: clone });
  }

  // Apply portal
  applyPortal() {
    this.createPortalPair();
  }

  // Create a portal pair
  createPortalPair() {
    const portal1 = {
      x: 50 + Math.random() * (CONFIG.CANVAS_WIDTH - 200),
      y: 50 + Math.random() * (CONFIG.CANVAS_HEIGHT - 200),
      radius: 25,
      id: Date.now() + Math.random(),
    };

    const portal2 = {
      x: 50 + Math.random() * (CONFIG.CANVAS_WIDTH - 200),
      y: 50 + Math.random() * (CONFIG.CANVAS_HEIGHT - 200),
      radius: 25,
      id: Date.now() + Math.random() + 1,
    };

    // Ensure portals are not too close to each other
    const minDistance = 150;
    const distance = Math.sqrt(
      Math.pow(portal2.x - portal1.x, 2) + Math.pow(portal2.y - portal1.y, 2)
    );

    if (distance < minDistance) {
      const angle = Math.atan2(portal2.y - portal1.y, portal2.x - portal1.x);
      portal2.x = portal1.x + Math.cos(angle) * minDistance;
      portal2.y = portal1.y + Math.sin(angle) * minDistance;

      // Keep within canvas bounds
      portal2.x = Math.max(50, Math.min(CONFIG.CANVAS_WIDTH - 50, portal2.x));
      portal2.y = Math.max(50, Math.min(CONFIG.CANVAS_HEIGHT - 50, portal2.y));
    }

    const portalPair = {
      portal1,
      portal2,
      created: Date.now(),
    };

    this.portals.push(portalPair);

    // Remove portal pair after 10 seconds
    setTimeout(() => {
      const index = this.portals.findIndex(
        (pair) => pair.created === portalPair.created
      );
      if (index > -1) this.portals.splice(index, 1);
    }, 10000);
  }

  // Apply random wall
  applyRandomWall() {
    const wall = {
      x: Math.random() * (CONFIG.CANVAS_WIDTH - 100),
      y: Math.random() * (CONFIG.CANVAS_HEIGHT - 100),
      width: 10 + Math.random() * 30,
      height: 50 + Math.random() * 100,
      created: Date.now(),
    };

    this.randomWalls.push(wall);

    // Remove wall after 5 seconds
    setTimeout(() => {
      const index = this.randomWalls.findIndex(
        (w) => w.created === wall.created
      );
      if (index > -1) this.randomWalls.splice(index, 1);
    }, 5000);
  }

  // Apply shield powerup
  applyShield(ball) {
    let paddleSide = ball.lastHitBy;

    // If ball hasn't hit a paddle yet, randomly assign to a paddle
    if (!paddleSide) {
      paddleSide = Math.random() > 0.5 ? "left" : "right";
    }

    eventBus.emit("paddle:shieldActivated", {
      side: paddleSide,
      ball,
    });
  }

  // Apply timed effect
  applyTimedEffect(type, effect, ball) {
    const effectId = `${type}_${Date.now()}`;

    // Determine which object gets the effect
    if (effect.ballSize || effect.ballSpeed) {
      // Ball effect
      ball.addEffect(type, effect);

      // Store for cleanup
      this.activeEffects.set(effectId, {
        type,
        effect,
        target: "ball",
        ballId: ball.id,
        startTime: Date.now(),
        duration: effect.duration,
      });
    } else if (effect.paddleHeight) {
      // Paddle effect
      let paddleSide = ball.lastHitBy;

      // If ball hasn't hit a paddle yet, randomly assign to a paddle
      if (!paddleSide) {
        paddleSide = Math.random() > 0.5 ? "left" : "right";
      }

      eventBus.emit("paddle:effectApplied", {
        side: paddleSide,
        type,
        effect,
      });

      // Store for cleanup
      this.activeEffects.set(effectId, {
        type,
        effect,
        target: "paddle",
        paddleSide,
        startTime: Date.now(),
        duration: effect.duration,
      });
    }

    // Remove effect after duration
    setTimeout(() => {
      this.removeEffect(effectId);
    }, effect.duration);
  }

  // Remove effect
  removeEffect(effectId) {
    const effectData = this.activeEffects.get(effectId);
    if (!effectData) return;

    if (effectData.target === "ball") {
      eventBus.emit("ball:effectRemoved", {
        ballId: effectData.ballId,
        type: effectData.type,
      });
    } else if (effectData.target === "paddle") {
      eventBus.emit("paddle:effectRemoved", {
        side: effectData.paddleSide,
        type: effectData.type,
      });
    }

    this.activeEffects.delete(effectId);
  }

  // Cleanup expired effects
  cleanupExpiredEffects() {
    const now = Date.now();
    this.activeEffects.forEach((effect, id) => {
      if (now - effect.startTime > effect.duration) {
        this.removeEffect(id);
      }
    });
  }

  // Update system
  update() {
    this.spawnPowerup();
    this.cleanupExpiredEffects();
  }

  // Get all powerups
  getPowerups() {
    return this.powerups;
  }

  // Get random walls
  getRandomWalls() {
    return this.randomWalls;
  }

  // Get portals
  getPortals() {
    return this.portals;
  }

  // Clear all powerups and effects
  clear() {
    this.powerups = [];
    this.activeEffects.clear();
    this.randomWalls = [];
    this.portals = [];
  }
}

export default PowerupSystem;
