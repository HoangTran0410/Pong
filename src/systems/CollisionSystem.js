import eventBus from "../core/EventBus.js";

// Centralized Collision Detection System
// Handles all collision detection and resolution between game objects
class CollisionSystem {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for collision-related events if needed
  }

  // Main collision detection method
  // Checks all possible collisions between different object types
  detectCollisions(gameObjects) {
    const collisions = [];

    // Separate objects by type for efficient collision checking
    const balls = gameObjects.filter(
      (obj) => obj.type === "ball" && obj.collidable
    );
    const paddles = gameObjects.filter(
      (obj) => obj.type === "paddle" && obj.collidable
    );
    const powerups = gameObjects.filter(
      (obj) => obj.type === "powerup" && obj.collidable
    );
    const walls = gameObjects.filter(
      (obj) => obj.type === "wall" && obj.collidable
    );
    const portals = gameObjects.filter(
      (obj) => obj.type === "portal" && obj.collidable
    );
    const blackholes = gameObjects.filter(
      (obj) => obj.type === "blackhole" && obj.collidable
    );

    // Ball-Paddle collisions
    balls.forEach((ball) => {
      paddles.forEach((paddle) => {
        if (this.checkCollision(ball, paddle)) {
          collisions.push({
            objA: ball,
            objB: paddle,
            type: "ball-paddle",
          });
        }
      });
    });

    // Ball-Powerup collisions
    balls.forEach((ball) => {
      powerups.forEach((powerup) => {
        if (
          !powerup.collected &&
          !powerup.expired &&
          this.checkCollision(ball, powerup)
        ) {
          collisions.push({
            objA: ball,
            objB: powerup,
            type: "ball-powerup",
          });
        }
      });
    });

    // Ball-Wall collisions
    balls.forEach((ball) => {
      walls.forEach((wall) => {
        if (wall.active && this.checkCollision(ball, wall)) {
          collisions.push({
            objA: ball,
            objB: wall,
            type: "ball-wall",
          });
        }
      });
    });

    // Ball-Portal collisions (special handling)
    balls.forEach((ball) => {
      portals.forEach((portal) => {
        if (
          portal.active &&
          portal.pairedPortal &&
          portal.pairedPortal.active
        ) {
          if (this.checkPortalCollision(ball, portal)) {
            collisions.push({
              objA: ball,
              objB: portal,
              type: "ball-portal",
            });
          }
        }
      });
    });

    return collisions;
  }

  // Generic collision detection between two objects
  checkCollision(objA, objB) {
    return objA.checkCollisionWith(objB);
  }

  // Special collision detection for portals (uses distance check)
  checkPortalCollision(ball, portal) {
    if (ball.portalCooldown > 0) return false; // Ball recently used portal

    const distance = ball.getDistanceTo(portal);
    return distance < ball.radius + portal.radius;
  }

  // Process and resolve all detected collisions
  resolveCollisions(collisions) {
    const handledCollisions = [];

    collisions.forEach((collision) => {
      const { objA, objB, type } = collision;
      let handled = false;

      switch (type) {
        case "ball-paddle":
          handled = this.resolveBallPaddleCollision(objA, objB);
          break;
        case "ball-powerup":
          handled = this.resolveBallPowerupCollision(objA, objB);
          break;
        case "ball-wall":
          handled = this.resolveBallWallCollision(objA, objB);
          break;
        case "ball-portal":
          handled = this.resolveBallPortalCollision(objA, objB);
          break;
        default:
          // Try generic collision handling
          handled =
            objA.onCollision(objB, type) || objB.onCollision(objA, type);
          break;
      }

      if (handled) {
        handledCollisions.push(collision);
      }
    });

    return handledCollisions;
  }

  // Resolve ball-paddle collision
  resolveBallPaddleCollision(ball, paddle) {
    // Check shield first, then normal collision
    if (
      paddle.hasShield &&
      paddle.shieldReflections < paddle.maxShieldReflections
    ) {
      // Shield collision logic is in paddle's handleBallCollision
      return paddle.handleBallCollision(ball);
    } else {
      // Normal paddle collision
      ball.handlePaddleCollision(paddle);

      // Emit particle effect
      eventBus.emit("ball:paddleCollision", {
        ball,
        paddle,
        x: ball.x,
        y: ball.y,
      });

      return true;
    }
  }

  // Resolve ball-powerup collision
  resolveBallPowerupCollision(ball, powerup) {
    if (powerup.collect()) {
      // Emit collection event for powerup system
      eventBus.emit("powerup:collected", {
        ball,
        powerup,
        powerupType: powerup.powerupType,
        x: powerup.x,
        y: powerup.y,
      });

      // Emit particle effect
      eventBus.emit("powerup:collectionEffect", {
        x: powerup.x + powerup.collisionRadius,
        y: powerup.y + powerup.collisionRadius,
        type: powerup.powerupType,
      });

      return true;
    }
    return false;
  }

  // Resolve ball-wall collision
  resolveBallWallCollision(ball, wall) {
    return ball.handleWallCollision(wall);
  }

  // Resolve ball-portal collision
  resolveBallPortalCollision(ball, portal) {
    if (!portal.pairedPortal || ball.portalCooldown > 0) {
      return false;
    }

    // Teleport ball to paired portal
    const pairedPortal = portal.pairedPortal;
    ball.x = pairedPortal.x;
    ball.y = pairedPortal.y;

    // Set cooldown to prevent infinite portal loops
    ball.portalCooldown = 500; // 500ms cooldown

    // Emit portal teleport event
    eventBus.emit("portal:ballTeleported", {
      ball,
      fromPortal: portal,
      toPortal: pairedPortal,
      x: ball.x,
      y: ball.y,
    });

    // Emit particle effects at both portals
    eventBus.emit("portal:teleportEffect", {
      x: portal.x,
      y: portal.y,
      type: "exit",
    });

    eventBus.emit("portal:teleportEffect", {
      x: pairedPortal.x,
      y: pairedPortal.y,
      type: "enter",
    });

    return true;
  }

  // Update collision system (called each frame)
  update(gameObjects) {
    // Detect all collisions
    const collisions = this.detectCollisions(gameObjects);

    // Resolve all collisions
    const handledCollisions = this.resolveCollisions(collisions);

    return {
      totalCollisions: collisions.length,
      handledCollisions: handledCollisions.length,
      collisions: handledCollisions,
    };
  }
}

export default CollisionSystem;
