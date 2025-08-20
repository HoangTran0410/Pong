import { CONFIG } from "./config.js";
import Ball from "./ball.js";

const POWERUP_CONFIG = {
  bigger_paddle: {
    emoji: "⬆️",
    label: "Big Paddle",
    effect: { paddleHeight: 1.5, duration: 8000 },
  },
  smaller_paddle: {
    emoji: "⬇️",
    label: "Small Paddle",
    effect: { paddleHeight: 0.7, duration: 8000 },
  },
  bigger_ball: {
    emoji: "🔵",
    label: "Big Ball",
    effect: { ballSize: 1.5, duration: 8000 },
  },
  smaller_ball: {
    emoji: "🔹",
    label: "Small Ball",
    effect: { ballSize: 0.7, duration: 8000 },
  },
  speed_up: {
    emoji: "⚡",
    label: "Speed Up",
    effect: { ballSpeed: 1.3, duration: 6000 },
  },
  speed_down: {
    emoji: "🐢",
    label: "Slow Down",
    effect: { ballSpeed: 0.7, duration: 6000 },
  },
  random_direction: {
    emoji: "🎲",
    label: "Random Dir",
    effect: { randomDirection: true, duration: 0 },
  },
  clone_ball: {
    emoji: "🟢🟢",
    label: "Clone Ball",
    effect: { cloneBall: true, duration: 0 },
  },
  score_bonus: {
    emoji: "➕",
    label: "+Score",
    effect: { scoreBonus: 5, duration: 0 },
  },
  score_penalty: {
    emoji: "➖",
    label: "-Score",
    effect: { scorePenalty: -3, duration: 0 },
  },
  portal: {
    emoji: "🌀",
    label: "Portal",
    effect: { portal: true, duration: 0 },
  },
  random_wall: {
    emoji: "🧱",
    label: "Wall",
    effect: { randomWall: true, duration: 0 },
  },
  shield: {
    emoji: "🛡️",
    label: "Shield",
    effect: { shield: true, duration: 0 },
  },
};

// Powerup Management System
class PowerupManager {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.powerups = [];
    this.activeEffects = new Map();
    this.randomWalls = [];
    this.portals = [];
    this.portalPairs = []; // New: Store portal pairs
  }

  // Spawn a new powerup
  spawnPowerup() {
    if (this.powerups.length >= CONFIG.MAX_POWERUPS_ON_SCREEN) return;

    if (Math.random() < CONFIG.POWERUP_SPAWN_RATE) {
      const type = this.getRandomPowerupType();

      // Spawn powerups closer to the center (harder to collect)
      const centerX = CONFIG.CANVAS_WIDTH / 2;
      const centerY = CONFIG.CANVAS_HEIGHT / 2;

      // Spawn in a smaller area around center (about 1/3 of screen size)
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

      this.powerups.push({
        x,
        y,
        type,
        collected: false,
      });
    }
  }

  // Get random powerup type
  getRandomPowerupType() {
    const types = Object.keys(POWERUP_CONFIG);
    return types[Math.floor(Math.random() * types.length)];
  }

  // Check collision with ball
  checkCollision(ball) {
    this.powerups.forEach((powerup, index) => {
      if (!powerup.collected && this.isColliding(ball, powerup)) {
        this.collectPowerup(powerup, ball);
        this.powerups.splice(index, 1);
      }
    });
  }

  // Check if ball collides with powerup
  isColliding(ball, powerup) {
    const px = powerup.x + CONFIG.POWERUP_SIZE / 2;
    const py = powerup.y + CONFIG.POWERUP_SIZE / 2;
    const dx = ball.x - px;
    const dy = ball.y - py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball.radius + CONFIG.POWERUP_SIZE / 2;
  }

  // Collect powerup and apply effect
  collectPowerup(powerup, ball) {
    const powerupData = POWERUP_CONFIG[powerup.type];
    if (!powerupData) return;

    const effect = powerupData.effect;

    // Create particle effect at powerup location
    if (this.game && this.game.createParticleEffect) {
      this.game.createParticleEffect(
        powerup.x + CONFIG.POWERUP_SIZE / 2,
        powerup.y + CONFIG.POWERUP_SIZE / 2,
        powerup.type
      );
    }

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
      this.applyPortal(ball);
    }
    if (effect.randomWall) {
      this.applyRandomWall();
    }
    if (effect.shield) {
      this.applyShield(ball);
    }

    // Apply timed effects to ball or paddle
    if (effect.duration > 0) {
      this.applyTimedEffect(powerup.type, effect, ball);
    }
  }

  // Apply score bonus
  applyScoreBonus(ball, bonus) {
    this.game.addScore(ball.lastHitBy, bonus);
  }

  // Apply score penalty
  applyScorePenalty(ball, penalty) {
    this.game.addScore(ball.lastHitBy, penalty);
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
    const clone = new Ball(ball.x, ball.y, this.game);
    clone.dx = -ball.dx;
    clone.dy = ball.dy;

    // Copy the current speed and effects from the original ball
    const currentSpeed = ball.getSpeed();
    clone.baseSpeed = ball.baseSpeed;
    clone.currentSpeedMultiplier = ball.currentSpeedMultiplier;

    // Apply the same speed
    clone.setSpeed(currentSpeed);

    // Copy active effects
    ball.effects.forEach((effectData, type) => {
      clone.addEffect(type, effectData.effect);
    });

    this.game.balls.push(clone);
  }

  // Apply portal
  applyPortal(ball) {
    // Create a portal pair instead of single teleport
    this.createPortalPair();
  }

  // Create a portal pair
  createPortalPair() {
    // Remove old portal pairs if we have too many
    // if (this.portalPairs.length >= 2) {
    //   this.portalPairs.shift();
    // }

    // Create two portal positions
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
      // Adjust portal2 position to maintain minimum distance
      const angle = Math.atan2(portal2.y - portal1.y, portal2.x - portal1.x);
      portal2.x = portal1.x + Math.cos(angle) * minDistance;
      portal2.y = portal1.y + Math.sin(angle) * minDistance;

      // Keep within canvas bounds
      portal2.x = Math.max(50, Math.min(CONFIG.CANVAS_WIDTH - 50, portal2.x));
      portal2.y = Math.max(50, Math.min(CONFIG.CANVAS_HEIGHT - 50, portal2.y));
    }

    this.portalPairs.push({
      portal1,
      portal2,
      created: Date.now(),
    });

    // Remove portal pair after 10 seconds
    setTimeout(() => {
      const index = this.portalPairs.findIndex(
        (pair) => pair.created === this.portalPairs[0].created
      );
      if (index > -1) this.portalPairs.splice(index, 1);
    }, 10000);
  }

  // Check portal collision and teleport ball
  checkPortalCollision(ball) {
    // Add portal cooldown to prevent infinite loops
    if (ball.portalCooldown && Date.now() < ball.portalCooldown) {
      return;
    }

    this.portalPairs.forEach((pair) => {
      const { portal1, portal2 } = pair;

      // Check collision with portal1
      const dist1 = Math.sqrt(
        Math.pow(ball.x - portal1.x, 2) + Math.pow(ball.y - portal1.y, 2)
      );

      if (dist1 < ball.radius + portal1.radius) {
        // Teleport to portal2
        ball.x = portal2.x;
        ball.y = portal2.y;

        // Set cooldown to prevent immediate re-teleport
        ball.portalCooldown = Date.now() + 500; // 500ms cooldown

        // Create particle effect
        // if (this.game && this.game.createParticleEffect) {
        //   this.game.createParticleEffect(
        //     portal1.x,
        //     portal1.y,
        //     "portal_teleport"
        //   );
        //   this.game.createParticleEffect(
        //     portal2.x,
        //     portal2.y,
        //     "portal_teleport"
        //   );
        // }
        return;
      }

      // Check collision with portal2
      const dist2 = Math.sqrt(
        Math.pow(ball.x - portal2.x, 2) + Math.pow(ball.y - portal2.y, 2)
      );

      if (dist2 < ball.radius + portal2.radius) {
        // Teleport to portal1
        ball.x = portal1.x;
        ball.y = portal1.y;

        // Set cooldown to prevent immediate re-teleport
        ball.portalCooldown = Date.now() + 500; // 500ms cooldown

        // Create particle effect
        if (this.game && this.game.createParticleEffect) {
          this.game.createParticleEffect(
            portal2.x,
            portal2.y,
            "portal_teleport"
          );
          this.game.createParticleEffect(
            portal1.x,
            portal1.y,
            "portal_teleport"
          );
        }
        return;
      }
    });
  }

  // Apply random wall
  applyRandomWall() {
    const wall = {
      x: Math.random() * (CONFIG.CANVAS_WIDTH - 100),
      y: Math.random() * (CONFIG.CANVAS_HEIGHT - 100),
      width: 10 + Math.random() * 30,
      height: 50 + Math.random() * 100,
    };
    this.randomWalls.push(wall);

    // Remove wall after 5 seconds
    setTimeout(() => {
      const index = this.randomWalls.indexOf(wall);
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

    const paddle =
      paddleSide === "left" ? this.game.leftPaddle : this.game.rightPaddle;

    if (paddle) {
      paddle.addShield();
    }
  }

  // Apply timed effect - FIXED: Now properly applies effects to ball/paddle
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
        ballId: ball,
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

      const paddle =
        paddleSide === "left" ? this.game.leftPaddle : this.game.rightPaddle;

      if (paddle) {
        paddle.addEffect(type, effect);

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
    }

    // Remove effect after duration
    setTimeout(() => {
      this.removeEffect(effectId);
    }, effect.duration);
  }

  // Remove effect - FIXED: Now properly removes effects from ball/paddle
  removeEffect(effectId) {
    const effect = this.activeEffects.get(effectId);
    if (!effect) return;

    if (effect.target === "ball" && effect.ballId) {
      effect.ballId.removeEffect(effect.type);
    } else if (effect.target === "paddle") {
      const paddle =
        effect.paddleSide === "left"
          ? this.game.leftPaddle
          : this.game.rightPaddle;
      if (paddle) {
        paddle.removeEffect(effect.type);
      }
    }

    this.activeEffects.delete(effectId);
  }

  // Update powerups
  update() {
    this.spawnPowerup();
    this.cleanupExpiredEffects();
    // Check portal collision for all balls
    if (this.game.balls && this.game.balls.length > 0) {
      this.game.balls.forEach((ball) => {
        this.checkPortalCollision(ball);
      });
    }
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

  // Render powerups
  render(ctx) {
    // Render powerups
    this.powerups.forEach((powerup) => {
      const powerupData = POWERUP_CONFIG[powerup.type] || {
        emoji: "⭐",
        label: powerup.type,
      };

      // body
      ctx.fillStyle = CONFIG.COLORS.POWERUP;
      ctx.beginPath();
      ctx.arc(
        powerup.x + CONFIG.POWERUP_SIZE / 2,
        powerup.y + CONFIG.POWERUP_SIZE / 2,
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
        powerupData.emoji,
        powerup.x + CONFIG.POWERUP_SIZE / 2,
        powerup.y + CONFIG.POWERUP_SIZE / 2 + 5
      );

      // Label below
      ctx.fillStyle = "#ffff00";
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        powerupData.label,
        powerup.x + CONFIG.POWERUP_SIZE / 2,
        powerup.y + CONFIG.POWERUP_SIZE + 14
      );
    });

    // Render portal pairs
    this.renderPortals(ctx);

    // Render random walls
    ctx.fillStyle = CONFIG.COLORS.WALL;
    this.randomWalls.forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
  }

  // Render portal pairs
  renderPortals(ctx) {
    this.portalPairs.forEach((pair) => {
      const { portal1, portal2 } = pair;

      // Draw connecting line between portals
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(portal1.x, portal1.y);
      ctx.lineTo(portal2.x, portal2.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Draw portal1 (blue) with spiral effect
      this.renderPortalWithSpiral(ctx, portal1, "#0066ff", "#00ccff");

      // Draw portal2 (purple) with spiral effect
      this.renderPortalWithSpiral(ctx, portal2, "#9900ff", "#cc66ff");
    });
  }

  // Render individual portal with spiral effect
  renderPortalWithSpiral(ctx, portal, primaryColor, secondaryColor) {
    const time = Date.now() * 0.005; // Animation speed
    const pulse = Math.sin(time * 0.5) * 0.1 + 1; // Subtle pulsing effect

    // Draw main portal circle with pulsing effect
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer glow ring
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner ring
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.radius - 8, 0, Math.PI * 2);
    ctx.stroke();

    // Draw spiral effect (sucking animation)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    // Create multiple spiral arms
    for (let arm = 0; arm < 3; arm++) {
      const armOffset = (arm * Math.PI * 2) / 3;

      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const angle = time + armOffset + i * 0.3 + i * 0.1; // Add rotation based on radius
        const radius = (portal.radius - 15) * (1 - i / 20);

        if (radius > 0) {
          const x = portal.x + Math.cos(angle) * radius;
          const y = portal.y + Math.sin(angle) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Draw center core
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner core glow
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Check collision with random walls
  checkWallCollision(ball) {
    this.randomWalls.forEach((wall) => {
      // Broad-phase AABB check between circle (as AABB) and rect
      const overlaps =
        ball.x + ball.radius > wall.x &&
        ball.x - ball.radius < wall.x + wall.width &&
        ball.y + ball.radius > wall.y &&
        ball.y - ball.radius < wall.y + wall.height;

      if (!overlaps) return;

      // Compute penetration depth to each side
      const overlapLeft = ball.x + ball.radius - wall.x; // ball penetrating left side of wall
      const overlapRight = wall.x + wall.width - (ball.x - ball.radius); // penetrating right side
      const overlapTop = ball.y + ball.radius - wall.y; // top side
      const overlapBottom = wall.y + wall.height - (ball.y - ball.radius); // bottom side

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        // Resolve along X axis
        if (overlapLeft < overlapRight) {
          // Collided with wall's left face → push ball to the left
          ball.x = wall.x - ball.radius;
        } else {
          // Collided with wall's right face → push ball to the right
          ball.x = wall.x + wall.width + ball.radius;
        }
        ball.dx = -ball.dx;
      } else {
        // Resolve along Y axis
        if (overlapTop < overlapBottom) {
          // Collided with wall's top face → push ball upward
          ball.y = wall.y - ball.radius;
        } else {
          // Collided with wall's bottom face → push ball downward
          ball.y = wall.y + wall.height + ball.radius;
        }
        ball.dy = -ball.dy;
      }

      // Optional: feedback on impact
      if (ball.game && ball.game.createParticleEffect) {
        ball.game.createParticleEffect(ball.x, ball.y, "wall_hit");
      }
    });
  }
}

export default PowerupManager;
