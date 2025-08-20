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
    const dx = ball.x - powerup.x;
    const dy = ball.y - powerup.y;
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
    ball.x = CONFIG.CANVAS_WIDTH - ball.x;
    ball.y = CONFIG.CANVAS_HEIGHT - ball.y;
  }

  // Apply random wall
  applyRandomWall() {
    const wall = {
      x: Math.random() * (CONFIG.CANVAS_WIDTH - 100),
      y: Math.random() * (CONFIG.CANVAS_HEIGHT - 100),
      width: 50 + Math.random() * 100,
      height: 20 + Math.random() * 40,
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

    // Render random walls
    ctx.fillStyle = CONFIG.COLORS.WALL;
    this.randomWalls.forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
  }

  // Check collision with random walls
  checkWallCollision(ball) {
    this.randomWalls.forEach((wall) => {
      if (
        ball.x + ball.radius > wall.x &&
        ball.x - ball.radius < wall.x + wall.width &&
        ball.y + ball.radius > wall.y &&
        ball.y - ball.radius < wall.y + wall.height
      ) {
        // Bounce off wall
        if (ball.x < wall.x || ball.x > wall.x + wall.width) {
          ball.dx = -ball.dx;
        } else {
          ball.dy = -ball.dy;
        }
      }
    });
  }
}

export default PowerupManager;
