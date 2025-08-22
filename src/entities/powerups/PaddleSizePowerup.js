import BasePowerup from "./BasePowerup.js";
import eventBus from "../../core/EventBus.js";

// Paddle size powerups (bigger/smaller)
export class BiggerPaddlePowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "bigger_paddle",
      emoji: "⬆️",
      label: "Big Paddle",
      color: "#00ff00",
      category: "beneficial",
      lifetime: 12000,
    });
  }

  applyEffect(ball) {
    const paddleSide =
      ball.lastHitBy || (Math.random() < 0.5 ? "left" : "right");

    eventBus.emit("paddle:effectApplied", {
      side: paddleSide,
      type: "bigger_paddle",
      effect: { paddleHeight: 1.5, duration: 8000 },
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

export class SmallerPaddlePowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "smaller_paddle",
      emoji: "⬇️",
      label: "Small Paddle",
      color: "#ff4444",
      category: "detrimental",
      lifetime: 8000,
    });
  }

  applyEffect(ball) {
    const paddleSide =
      ball.lastHitBy || (Math.random() < 0.5 ? "left" : "right");

    eventBus.emit("paddle:effectApplied", {
      side: paddleSide,
      type: "smaller_paddle",
      effect: { paddleHeight: 0.7, duration: 8000 },
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
