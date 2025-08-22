import BasePowerup from "./BasePowerup.js";
import eventBus from "../../core/EventBus.js";

// Ball size powerups (bigger/smaller)
export class BiggerBallPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "bigger_ball",
      emoji: "🔵",
      label: "Big Ball",
      color: "#00ff00",
      category: "beneficial",
      lifetime: 15000,
    });
  }

  applyEffect(ball) {
    ball.addEffect("bigger_ball", { ballSize: 1.5, duration: 8000 });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class SmallerBallPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "smaller_ball",
      emoji: "🔹",
      label: "Small Ball",
      color: "#4488ff",
      category: "beneficial",
      lifetime: 15000,
    });
  }

  applyEffect(ball) {
    ball.addEffect("smaller_ball", { ballSize: 0.7, duration: 8000 });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}
