import BasePowerup from "./BasePowerup.js";
import eventBus from "../../core/EventBus.js";

// Ball speed powerups (speed up/down)
export class SpeedUpPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "speed_up",
      emoji: "🚀",
      label: "Speed Up",
      color: "#ff2222",
      category: "detrimental",
      lifetime: 8000,
    });
  }

  applyEffect(ball) {
    ball.addEffect("speed_up", { ballSpeed: 1.3, duration: 6000 });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class SlowDownPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "speed_down",
      emoji: "🐢",
      label: "Slow Down",
      color: "#22ff22",
      category: "beneficial",
      lifetime: 12000,
    });
  }

  applyEffect(ball) {
    ball.addEffect("speed_down", { ballSpeed: 0.7, duration: 6000 });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}
