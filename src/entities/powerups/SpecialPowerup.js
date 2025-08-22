import BasePowerup from "./BasePowerup.js";
import eventBus from "../../core/EventBus.js";
import Ball from "../Ball.js";
import { CONFIG } from "../../config/game.js";

// Special powerups with unique effects
export class CloneBallPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "clone_ball",
      emoji: "🦠",
      label: "Clone Ball",
      color: "#aa44ff",
      category: "chaotic",
      lifetime: 15000,
    });
  }

  applyEffect(ball) {
    // Clone the ball
    const clonedBall = ball.clone();
    eventBus.emit("game:ballSpawned", { ball: clonedBall });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class RandomDirectionPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "random_direction",
      emoji: "🎲",
      label: "Random Dir",
      color: "#ffaa00",
      category: "chaotic",
      lifetime: 15000,
    });
  }

  applyEffect(ball) {
    // Generate random direction while maintaining speed
    const currentSpeed = ball.getSpeed();
    const randomAngle = Math.random() * Math.PI * 2;

    ball.dx = Math.cos(randomAngle) * currentSpeed;
    ball.dy = Math.sin(randomAngle) * currentSpeed;

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class ScoreBonusPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "score_bonus",
      emoji: "➕",
      label: "+Score",
      color: "#00ff44",
      category: "beneficial",
      lifetime: 15000,
    });
  }

  applyEffect(ball) {
    const paddleSide =
      ball.lastHitBy || (Math.random() < 0.5 ? "left" : "right");

    eventBus.emit("game:scoreChange", {
      side: paddleSide,
      points: 5,
    });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class ScorePenaltyPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "score_penalty",
      emoji: "➖",
      label: "-Score",
      color: "#ff0044",
      category: "detrimental",
      lifetime: 8000,
    });
  }

  applyEffect(ball) {
    const paddleSide =
      ball.lastHitBy || (Math.random() < 0.5 ? "left" : "right");

    eventBus.emit("game:scoreChange", {
      side: paddleSide,
      points: -3,
    });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class SwapScorePowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "swap_score",
      emoji: "🔄",
      label: "Swap Score",
      color: "#ff4488",
      category: "detrimental",
      lifetime: 8000,
    });
  }

  applyEffect(ball) {
    eventBus.emit("game:swapScores");

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class ShieldPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "shield",
      emoji: "🛡️",
      label: "Shield",
      color: "#44ff88",
      category: "beneficial",
      lifetime: 15000,
    });
  }

  applyEffect(ball) {
    const paddleSide =
      ball.lastHitBy || (Math.random() < 0.5 ? "left" : "right");

    eventBus.emit("paddle:shieldActivated", {
      side: paddleSide,
    });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}
