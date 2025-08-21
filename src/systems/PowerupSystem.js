import { CONFIG } from "../config/game.js";
import { POWERUP_CONFIG } from "../config/powerups.js";
import Powerup from "../entities/Powerup.js";
import Blackhole from "../entities/Blackhole.js";
import Wall from "../entities/Wall.js";
import { PortalPair } from "../entities/Portal.js";
import eventBus from "../core/EventBus.js";
import {
  lightenColor,
  darkenColor,
  distance,
  randomChoice,
  generateId,
} from "../utils/index.js";

// Powerup System - Handles powerup spawning, effects, and cleanup
class PowerupSystem {
  constructor() {
    this.powerups = [];
    this.activeEffects = new Map();
    this.randomWalls = [];
    this.portals = [];
    this.blackholes = [];

    // Orientation flip state
    this.orientationFlipActive = false;
    this.orientationFlipTimer = null;
    this.originalOrientation = null;

    // Powerup settings
    this.powerupSettings = {
      powerupsEnabled: true,
      enabledPowerups: Object.keys(POWERUP_CONFIG),
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for powerup collection events
    eventBus.subscribe("powerup:collected", (data) => {
      this.applyPowerupEffect(data.powerup, data.ball);
    });
  }

  // Check if a position overlaps with existing powerups
  isPositionOverlapping(x, y, minDistance = CONFIG.POWERUP_SIZE * 1.2) {
    for (const powerup of this.powerups) {
      if (powerup.collected) continue;

      const centerX = x + CONFIG.POWERUP_SIZE / 2;
      const centerY = y + CONFIG.POWERUP_SIZE / 2;
      const powerupCenterX = powerup.x + CONFIG.POWERUP_SIZE / 2;
      const powerupCenterY = powerup.y + CONFIG.POWERUP_SIZE / 2;

      const dist = distance(centerX, centerY, powerupCenterX, powerupCenterY);
      if (dist < minDistance) {
        return true;
      }
    }
    return false;
  }

  // Spawn a new powerup
  spawnPowerup() {
    // Don't spawn if powerups are disabled or no powerups are enabled
    if (
      !this.powerupSettings.powerupsEnabled ||
      this.powerupSettings.enabledPowerups.length === 0
    ) {
      return;
    }

    if (this.powerups.length >= CONFIG.MAX_POWERUPS_ON_SCREEN) return;

    if (Math.random() < CONFIG.POWERUP_SPAWN_RATE) {
      const type = this.getRandomPowerupType();

      // Don't spawn if no powerup type is available
      if (!type) return;

      // Spawn powerups closer to the center
      const centerX = CONFIG.CANVAS_WIDTH / 2;
      const centerY = CONFIG.CANVAS_HEIGHT / 2;

      const spawnAreaWidth = CONFIG.CANVAS_WIDTH / 1.5;
      const spawnAreaHeight = CONFIG.CANVAS_HEIGHT / 1.5;

      let x, y;
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loops

      // Try to find a non-overlapping position
      do {
        x = centerX - spawnAreaWidth / 2 + Math.random() * spawnAreaWidth;
        y = centerY - spawnAreaHeight / 2 + Math.random() * spawnAreaHeight;

        // Ensure powerup stays within canvas bounds
        x = Math.max(
          CONFIG.POWERUP_SIZE / 2,
          Math.min(x, CONFIG.CANVAS_WIDTH - CONFIG.POWERUP_SIZE / 2)
        );
        y = Math.max(
          CONFIG.POWERUP_SIZE / 2,
          Math.min(y, CONFIG.CANVAS_HEIGHT - CONFIG.POWERUP_SIZE / 2)
        );

        attempts++;
      } while (this.isPositionOverlapping(x, y) && attempts < maxAttempts);

      // Only spawn if we found a non-overlapping position or hit max attempts
      // (still spawn at max attempts to avoid permanently blocking spawns)
      const powerup = new Powerup(x, y, type);
      this.powerups.push(powerup);
    }
  }

  // Get random powerup type from enabled powerups
  getRandomPowerupType() {
    const enabledTypes = this.powerupSettings.enabledPowerups.filter(
      (type) => POWERUP_CONFIG[type] // Ensure the powerup type still exists in config
    );

    if (enabledTypes.length === 0) {
      return null;
    }

    return randomChoice(enabledTypes);
  }

  // Check powerup collisions with balls
  checkCollisions(balls) {
    const collisions = [];

    this.powerups.forEach((powerup, index) => {
      if (!powerup.collected && !powerup.expired) {
        for (const ball of balls) {
          if (powerup.checkCollision(ball)) {
            // Only proceed if collection is successful (not already collected)
            if (powerup.collect()) {
              const centerPos = powerup.getCenterPosition();

              // Emit powerup collected event
              eventBus.emit("powerup:collected", {
                powerup,
                ball,
                x: centerPos.x,
                y: centerPos.y,
                powerupType: powerup.type,
              });

              // Show flash text for special powerups
              this.showPowerupFlashText(powerup.type);

              collisions.push({ powerup, ball, index });
              // Break out of balls loop since powerup is now collected
              break;
            }
          }
        }
      }
    });

    // Remove collected powerups (sort indices in descending order to avoid array shifting issues)
    const sortedIndices = collisions
      .map(({ index }) => index)
      .sort((a, b) => b - a);
    sortedIndices.forEach((index) => {
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
    if (effect.swapScore) {
      this.applySwapScore();
    }
    if (effect.blackhole) {
      this.applyBlackhole();
    }
    if (effect.cage) {
      this.applyCage(ball);
    }
    if (effect.orientationFlip) {
      this.applyOrientationFlip();
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
    const portal1Config = {
      x: 50 + Math.random() * (CONFIG.CANVAS_WIDTH - 200),
      y: 50 + Math.random() * (CONFIG.CANVAS_HEIGHT - 200),
      radius: 25,
    };

    const portal2Config = {
      x: 50 + Math.random() * (CONFIG.CANVAS_WIDTH - 200),
      y: 50 + Math.random() * (CONFIG.CANVAS_HEIGHT - 200),
      radius: 25,
    };

    // Ensure portals are not too close to each other
    const minDistance = 150;
    const dist = distance(
      portal1Config.x,
      portal1Config.y,
      portal2Config.x,
      portal2Config.y
    );

    if (dist < minDistance) {
      const angle = Math.atan2(
        portal2Config.y - portal1Config.y,
        portal2Config.x - portal1Config.x
      );
      portal2Config.x = portal1Config.x + Math.cos(angle) * minDistance;
      portal2Config.y = portal1Config.y + Math.sin(angle) * minDistance;

      // Keep within canvas bounds
      portal2Config.x = Math.max(
        50,
        Math.min(CONFIG.CANVAS_WIDTH - 50, portal2Config.x)
      );
      portal2Config.y = Math.max(
        50,
        Math.min(CONFIG.CANVAS_HEIGHT - 50, portal2Config.y)
      );
    }

    const portalPair = new PortalPair(portal1Config, portal2Config, 10000);
    this.portals.push(portalPair);

    // Portal will be automatically cleaned up by updatePortals() when shouldDestroy() returns true
  }

  // Apply random wall
  applyRandomWall() {
    const x = Math.random() * (CONFIG.CANVAS_WIDTH - 100);
    const y = Math.random() * (CONFIG.CANVAS_HEIGHT - 100);
    const width = 10 + Math.random() * 30;
    const height = 50 + Math.random() * 100;

    // Random chance for wall to be moving (60% chance)
    const isMoving = Math.random() < 0.6;

    let wallConfig = { lifetime: 10000 };

    if (isMoving) {
      // Choose random movement pattern
      const patterns = [
        "linear",
        "oscillating",
        "circular",
        "figure8",
        "zigzag",
      ];
      const movementPattern = randomChoice(patterns);

      // Configure movement parameters based on pattern
      wallConfig = {
        ...wallConfig,
        isMoving: true,
        movementPattern: movementPattern,
        movementSpeed: 1 + Math.random() * 2, // Speed between 1-3
      };

      // Pattern-specific configurations
      switch (movementPattern) {
        case "linear":
          // Random direction for linear movement
          const angle = Math.random() * Math.PI * 2;
          wallConfig.movementDirection = {
            x: Math.cos(angle),
            y: Math.sin(angle),
          };
          break;

        case "oscillating":
          // Random axis for oscillation
          wallConfig.movementDirection =
            Math.random() < 0.5 ? { x: 1, y: 0 } : { x: 0, y: 1 };
          wallConfig.oscillationRange = 50 + Math.random() * 100; // 50-150 pixel range
          break;

        case "circular":
        case "figure8":
          wallConfig.rotationRadius = 30 + Math.random() * 50; // 30-80 pixel radius
          break;

        case "zigzag":
          // Random primary direction for zigzag
          wallConfig.movementDirection =
            Math.random() < 0.5 ? { x: 1, y: 0 } : { x: 0, y: 1 };
          break;
      }
    }

    const wall = new Wall(x, y, width, height, wallConfig);
    this.randomWalls.push(wall);

    // Wall will be automatically cleaned up by updateWalls() when shouldDestroy() returns true
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

  // Apply swap score powerup
  applySwapScore() {
    eventBus.emit("game:swapScores", {});
  }

  // Apply blackhole powerup
  applyBlackhole() {
    this.createBlackhole();
  }

  // Apply cage powerup - creates 4 walls around ball position in rectangle shape
  applyCage(ball) {
    this.createCage(ball.x, ball.y, ball);
  }

  // Apply orientation flip effect
  applyOrientationFlip() {
    // If flip is already active, cancel the existing timer
    if (this.orientationFlipActive && this.orientationFlipTimer) {
      clearTimeout(this.orientationFlipTimer);
      this.orientationFlipTimer = null;
    }

    // If no flip is active, store the original orientation and flip
    if (!this.orientationFlipActive) {
      this.originalOrientation = CONFIG.ORIENTATION;
      this.orientationFlipActive = true;

      // Flip orientation
      const newOrientation = CONFIG.isHorizontal() ? "vertical" : "horizontal";
      CONFIG.setOrientation(newOrientation);

      // Emit orientation change event for game to handle repositioning
      eventBus.emit("game:orientationChanged", {
        newOrientation,
        originalOrientation: this.originalOrientation,
      });
    } else {
      // If flip is already active, immediately flip again (toggle back and forth)
      const currentOrientation = CONFIG.ORIENTATION;
      const newOrientation = CONFIG.isHorizontal() ? "vertical" : "horizontal";
      CONFIG.setOrientation(newOrientation);

      // Emit orientation change event
      eventBus.emit("game:orientationChanged", {
        newOrientation,
        originalOrientation: currentOrientation,
      });
    }

    // Set a new timer to revert back to original orientation after duration
    this.orientationFlipTimer = setTimeout(() => {
      CONFIG.setOrientation(this.originalOrientation);
      eventBus.emit("game:orientationChanged", {
        newOrientation: this.originalOrientation,
        originalOrientation: CONFIG.ORIENTATION,
      });

      // Reset flip state
      this.orientationFlipActive = false;
      this.orientationFlipTimer = null;
      this.originalOrientation = null;
    }, POWERUP_CONFIG.orientation_flip.effect.duration);
  }

  // Create a blackhole at random position
  createBlackhole() {
    // Find a good position away from paddles and center
    const padding = CONFIG.BLACKHOLE.RADIUS + 50;
    const x = padding + Math.random() * (CONFIG.CANVAS_WIDTH - 2 * padding);
    const y = padding + Math.random() * (CONFIG.CANVAS_HEIGHT - 2 * padding);

    const blackhole = new Blackhole(x, y, {
      radius: CONFIG.BLACKHOLE.RADIUS,
      attractionRadius: CONFIG.BLACKHOLE.ATTRACTION_RADIUS,
      attractionForce: CONFIG.BLACKHOLE.ATTRACTION_FORCE,
      lifetime: CONFIG.BLACKHOLE.LIFETIME,
    });

    this.blackholes.push(blackhole);

    // Blackhole will be automatically cleaned up by updateBlackholes() when shouldDestroy() returns true
  }

  // Create cage walls around a specific position in rectangle formation
  createCage(centerX, centerY, ball) {
    const cageSize = 100; // Size of the cage rectangle
    const wallThickness = 10;
    const wallLifetime = 2000;

    // Define the 4 walls forming a rectangle around the ball
    const walls = [
      // Top wall
      {
        x: centerX - cageSize / 2,
        y: centerY - cageSize / 2,
        width: cageSize,
        height: wallThickness,
      },
      // Bottom wall
      {
        x: centerX - cageSize / 2,
        y: centerY + cageSize / 2 - wallThickness,
        width: cageSize,
        height: wallThickness,
      },
      // Left wall
      {
        x: centerX - cageSize / 2,
        y: centerY - cageSize / 2,
        width: wallThickness,
        height: cageSize,
      },
      // Right wall
      {
        x: centerX + cageSize / 2 - wallThickness,
        y: centerY - cageSize / 2,
        width: wallThickness,
        height: cageSize,
      },
    ];

    // Create cage walls and add to randomWalls array
    walls.forEach((wallConfig) => {
      const wall = new Wall(
        wallConfig.x,
        wallConfig.y,
        wallConfig.width,
        wallConfig.height,
        {
          lifetime: wallLifetime,
          color: "#ff6600", // Orange color for cage walls
          isCageWall: true, // Mark as cage wall for special handling
          cagedBall: ball, // Reference to the ball that was caged
        }
      );
      this.randomWalls.push(wall);
    });
  }

  // Generate flash text colors from powerup configuration
  generateFlashTextColors(powerupConfig) {
    const baseColor = powerupConfig.color || "#ffff00";

    // Create glow and shadow colors based on the powerup category
    let glowColor, shadowColor;

    if (powerupConfig.category === "beneficial") {
      // Beneficial powerups: bright glow, darker shadow
      glowColor = lightenColor(baseColor, 0.4);
      shadowColor = darkenColor(baseColor, 0.7);
    } else if (powerupConfig.category === "detrimental") {
      // Detrimental powerups: warning glow, dark shadow
      glowColor = lightenColor(baseColor, 0.3);
      shadowColor = darkenColor(baseColor, 0.8);
    } else {
      // Chaotic powerups: moderate glow
      glowColor = lightenColor(baseColor, 0.3);
      shadowColor = darkenColor(baseColor, 0.6);
    }

    return {
      color: baseColor,
      glowColor,
      shadowColor,
    };
  }

  // Show flash text for special powerups
  showPowerupFlashText(powerupType) {
    const config = POWERUP_CONFIG[powerupType];
    if (!config?.label) return;

    let message = config.label.toUpperCase() + "!";

    // Generate colors from powerup config
    const colors = this.generateFlashTextColors(config);

    if (message) {
      eventBus.emit("game:showFlashText", {
        text: message,
        options: {
          duration: 1500,
          color: colors.color,
          glowColor: colors.glowColor,
          shadowColor: colors.shadowColor,
        },
      });
    }
  }

  // Apply timed effect
  applyTimedEffect(type, effect, ball) {
    const effectId = generateId(type);

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

    // Effect will be automatically removed by cleanupExpiredEffects() when duration expires
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

  // Update blackholes
  updateBlackholes(balls) {
    // Update each blackhole
    this.blackholes.forEach((blackhole, index) => {
      blackhole.update();

      // Apply gravity to all balls
      balls.forEach((ball) => {
        blackhole.applyGravityToBall(ball);

        // Check if ball is consumed
        if (blackhole.checkBallConsumption(ball)) {
          ball.disabled = true;
        }
      });

      // Remove expired blackholes
      if (blackhole.shouldDestroy()) {
        this.blackholes.splice(index, 1);
      }
    });
  }

  // Update walls
  updateWalls() {
    this.randomWalls.forEach((wall, index) => {
      wall.update();
      if (wall.shouldDestroy()) {
        this.randomWalls.splice(index, 1);
      }
    });
  }

  // Update portals
  updatePortals() {
    this.portals.forEach((portalPair, index) => {
      portalPair.update();
      if (portalPair.shouldDestroy()) {
        this.portals.splice(index, 1);
      }
    });
  }

  // Update powerups
  updatePowerups() {
    // Update each powerup and remove expired ones
    this.powerups.forEach((powerup, index) => {
      powerup.update();
      if (powerup.shouldDestroy()) {
        this.powerups.splice(index, 1);
      }
    });
  }

  // Update system
  update(balls = []) {
    this.spawnPowerup();
    this.updatePowerups();
    this.cleanupExpiredEffects();
    this.updateBlackholes(balls);
    this.updateWalls();
    this.updatePortals();
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

  // Get blackholes
  getBlackholes() {
    return this.blackholes;
  }

  // Set powerup settings
  setPowerupSettings(settings) {
    this.powerupSettings = {
      powerupsEnabled: settings.powerupsEnabled !== false,
      enabledPowerups: settings.enabledPowerups || Object.keys(POWERUP_CONFIG),
    };
  }

  // Clear all powerups and effects
  clear() {
    this.powerups = [];
    this.activeEffects.clear();
    this.randomWalls = [];
    this.portals = [];
    this.blackholes = [];

    // Clear orientation flip state
    if (this.orientationFlipTimer) {
      clearTimeout(this.orientationFlipTimer);
      this.orientationFlipTimer = null;
    }
    this.orientationFlipActive = false;
    this.originalOrientation = null;
  }
}

export default PowerupSystem;
