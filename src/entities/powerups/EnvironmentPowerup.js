import BasePowerup from "./BasePowerup.js";
import eventBus from "../../core/EventBus.js";
import Portal from "../Portal.js";
import Wall from "../Wall.js";
import Blackhole from "../Blackhole.js";
import { CONFIG } from "../../config/game.js";

// Powerups that create environmental objects
export class PortalPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "portal",
      emoji: "🌀",
      label: "Portal",
      color: "#00aaff",
      category: "chaotic",
      lifetime: 10000,
    });
  }

  applyEffect(ball) {
    // Create two portals at opposite ends
    const margin = 50;
    let portal1Config, portal2Config;

    if (CONFIG.isVertical()) {
      // Vertical mode: create portals on left and right sides
      portal1Config = {
        x: margin,
        y: Math.random() * (CONFIG.CANVAS_HEIGHT - 100) + 50,
        primaryColor: "#0066ff",
        secondaryColor: "#00ccff",
      };
      portal2Config = {
        x: CONFIG.CANVAS_WIDTH - margin,
        y: Math.random() * (CONFIG.CANVAS_HEIGHT - 100) + 50,
        primaryColor: "#ff6600",
        secondaryColor: "#ffcc00",
      };
    } else {
      // Horizontal mode: create portals on top and bottom
      portal1Config = {
        x: Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50,
        y: margin,
        primaryColor: "#0066ff",
        secondaryColor: "#00ccff",
      };
      portal2Config = {
        x: Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50,
        y: CONFIG.CANVAS_HEIGHT - margin,
        primaryColor: "#ff6600",
        secondaryColor: "#ffcc00",
      };
    }

    // Create portal pair and emit event to add to game
    const portal1 = new Portal(portal1Config.x, portal1Config.y, {
      radius: 25,
      lifetime: 10000,
      primaryColor: portal1Config.primaryColor,
      secondaryColor: portal1Config.secondaryColor,
    });

    const portal2 = new Portal(portal2Config.x, portal2Config.y, {
      radius: 25,
      lifetime: 10000,
      primaryColor: portal2Config.primaryColor,
      secondaryColor: portal2Config.secondaryColor,
    });

    // Link the portals
    portal1.setPairedPortal(portal2);
    portal2.setPairedPortal(portal1);

    // Add to game objects
    eventBus.emit("game:objectSpawned", { object: portal1 });
    eventBus.emit("game:objectSpawned", { object: portal2 });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class WallPowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "random_wall",
      emoji: "🧱",
      label: "Wall",
      color: "#ff8800",
      category: "chaotic",
      lifetime: 15000,
    });
  }

  applyEffect(ball) {
    // Create a random wall
    const x = Math.random() * (CONFIG.CANVAS_WIDTH - 100);
    const y = Math.random() * (CONFIG.CANVAS_HEIGHT - 100);
    const width = 20 + Math.random() * 60; // 20-80 pixels wide
    const height = 20 + Math.random() * 60; // 20-80 pixels tall

    const wall = new Wall(x, y, width, height, {
      lifetime: 10000,
      color: CONFIG.COLORS.WALL || "#888888",
      isMoving: Math.random() < 0.3, // 30% chance of moving wall
      movementSpeed: 1 + Math.random() * 2,
    });

    // Add to game objects
    eventBus.emit("game:objectSpawned", { object: wall });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class BlackholePowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "blackhole",
      emoji: "⚫",
      label: "Blackhole",
      color: "#8844ff",
      category: "chaotic",
      lifetime: 10000,
    });
  }

  applyEffect(ball) {
    // Create a blackhole at random position
    const margin = 80;
    const blackholeX =
      margin + Math.random() * (CONFIG.CANVAS_WIDTH - 2 * margin);
    const blackholeY =
      margin + Math.random() * (CONFIG.CANVAS_HEIGHT - 2 * margin);

    const blackhole = new Blackhole(blackholeX, blackholeY, {
      radius: 30,
      attractionRadius: 150,
      attractionForce: 0.2,
      lifetime: 15000,
    });

    // Add to game objects
    eventBus.emit("game:objectSpawned", { object: blackhole });

    // Emit particle effect
    eventBus.emit("powerup:collectionEffect", {
      x: this.getCenterPosition().x,
      y: this.getCenterPosition().y,
      type: this.powerupType,
      color: this.color,
    });
  }
}

export class CagePowerup extends BasePowerup {
  constructor(x, y) {
    super(x, y, {
      type: "cage",
      emoji: "🔒",
      label: "Cage",
      color: "#ff6600",
      category: "chaotic",
      lifetime: 10000,
    });
  }

  applyEffect(ball) {
    // Create cage walls around the ball's current position
    const centerX = ball.x;
    const centerY = ball.y;
    const cageSize = 100;
    const wallThickness = 15;

    // Create four walls forming a rectangle around the ball
    const walls = [
      // Top wall
      new Wall(
        centerX - cageSize / 2,
        centerY - cageSize / 2,
        cageSize,
        wallThickness,
        {
          lifetime: 10000,
          color: "#ff6600",
        }
      ),
      // Bottom wall
      new Wall(
        centerX - cageSize / 2,
        centerY + cageSize / 2 - wallThickness,
        cageSize,
        wallThickness,
        {
          lifetime: 10000,
          color: "#ff6600",
        }
      ),
      // Left wall
      new Wall(
        centerX - cageSize / 2,
        centerY - cageSize / 2,
        wallThickness,
        cageSize,
        {
          lifetime: 10000,
          color: "#ff6600",
        }
      ),
      // Right wall
      new Wall(
        centerX + cageSize / 2 - wallThickness,
        centerY - cageSize / 2,
        wallThickness,
        cageSize,
        {
          lifetime: 10000,
          color: "#ff6600",
        }
      ),
    ];

    // Add all walls to game
    walls.forEach((wall) => {
      eventBus.emit("game:objectSpawned", { object: wall });
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
