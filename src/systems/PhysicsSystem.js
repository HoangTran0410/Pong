import eventBus from "../core/EventBus.js";

// Physics System - Handles movement and collision detection
class PhysicsSystem {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // No specific event listeners needed for basic physics
    // Could add physics-related events like gravity changes, etc.
  }

  // Update all balls physics
  updateBalls(balls) {
    balls.forEach((ball) => {
      ball.update();
    });
  }

  // Update all paddles
  updatePaddles(paddles, inputState, gameState) {
    paddles.forEach((paddle) => {
      paddle.update(inputState, gameState);
    });
  }

  // Check collisions between balls and paddles
  checkBallPaddleCollisions(balls, paddles) {
    const collisions = [];

    balls.forEach((ball) => {
      paddles.forEach((paddle) => {
        if (paddle.checkCollision(ball)) {
          collisions.push({ ball, paddle });
        }
      });
    });

    return collisions;
  }

  // Check collisions between balls and powerups
  checkBallPowerupCollisions(balls, powerups) {
    const collisions = [];

    balls.forEach((ball) => {
      powerups.forEach((powerup) => {
        if (powerup.checkCollision(ball)) {
          collisions.push({ ball, powerup });
        }
      });
    });

    return collisions;
  }

  // Check collisions between balls and walls (random walls from powerups)
  checkBallWallCollisions(balls, walls) {
    balls.forEach((ball) => {
      walls.forEach((wall) => {
        this.checkBallWallCollision(ball, wall);
      });
    });
  }

  // Individual ball-wall collision check
  checkBallWallCollision(ball, wall) {
    // Broad-phase AABB check between circle (as AABB) and rect
    const overlaps =
      ball.x + ball.radius > wall.x &&
      ball.x - ball.radius < wall.x + wall.width &&
      ball.y + ball.radius > wall.y &&
      ball.y - ball.radius < wall.y + wall.height;

    if (!overlaps) return;

    // Compute penetration depth to each side
    const overlapLeft = ball.x + ball.radius - wall.x;
    const overlapRight = wall.x + wall.width - (ball.x - ball.radius);
    const overlapTop = ball.y + ball.radius - wall.y;
    const overlapBottom = wall.y + wall.height - (ball.y - ball.radius);

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
      // Resolve along X axis
      if (overlapLeft < overlapRight) {
        ball.x = wall.x - ball.radius;
      } else {
        ball.x = wall.x + wall.width + ball.radius;
      }
      ball.dx = -ball.dx;
    } else {
      // Resolve along Y axis
      if (overlapTop < overlapBottom) {
        ball.y = wall.y - ball.radius;
      } else {
        ball.y = wall.y + wall.height + ball.radius;
      }
      ball.dy = -ball.dy;
    }

    // Emit wall hit event
    eventBus.emit("ball:wallCollision", {
      ball,
      x: ball.x,
      y: ball.y,
      type: "wall_hit",
    });
  }

  // Check portal collisions for all balls
  checkPortalCollisions(balls, portals) {
    balls.forEach((ball) => {
      portals.forEach((portalPair) => {
        this.checkBallPortalCollision(ball, portalPair);
      });
    });
  }

  // Individual ball-portal collision check
  checkBallPortalCollision(ball, portalPair) {
    // Skip if ball is in cooldown
    if (ball.portalCooldown > 0) return;

    const { portal1, portal2 } = portalPair;

    // Check collision with portal1
    const dist1 = Math.sqrt(
      Math.pow(ball.x - portal1.x, 2) + Math.pow(ball.y - portal1.y, 2)
    );

    if (dist1 < ball.radius + portal1.radius) {
      // Teleport to portal2
      ball.x = portal2.x;
      ball.y = portal2.y;
      ball.portalCooldown = 500; // 500ms cooldown

      eventBus.emit("ball:portalTeleport", {
        ball,
        fromPortal: portal1,
        toPortal: portal2,
      });
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
      ball.portalCooldown = 500; // 500ms cooldown

      eventBus.emit("ball:portalTeleport", {
        ball,
        fromPortal: portal2,
        toPortal: portal1,
      });
    }
  }

  // Filter out off-screen balls (modifies array in-place)
  filterOffScreenBalls(balls) {
    // Remove balls that are off-screen by modifying the array in-place
    for (let i = balls.length - 1; i >= 0; i--) {
      if (balls[i].isOffScreen()) {
        balls.splice(i, 1);
      }
    }
  }

  // Update system (called by main game loop)
  update(gameState, inputState) {
    // Update ball physics
    this.updateBalls(gameState.balls);

    // Update paddle physics
    this.updatePaddles(
      [gameState.leftPaddle, gameState.rightPaddle],
      inputState,
      gameState
    );

    // Check collisions
    const paddleCollisions = this.checkBallPaddleCollisions(gameState.balls, [
      gameState.leftPaddle,
      gameState.rightPaddle,
    ]);

    const powerupCollisions = this.checkBallPowerupCollisions(
      gameState.balls,
      gameState.powerups || []
    );

    // Check wall collisions if we have random walls
    if (gameState.randomWalls && gameState.randomWalls.length > 0) {
      this.checkBallWallCollisions(gameState.balls, gameState.randomWalls);
    }

    // Check portal collisions if we have portals
    if (gameState.portals && gameState.portals.length > 0) {
      this.checkPortalCollisions(gameState.balls, gameState.portals);
    }

    // Filter off-screen balls (modifies array in-place)
    this.filterOffScreenBalls(gameState.balls);

    return {
      paddleCollisions,
      powerupCollisions,
    };
  }
}

export default PhysicsSystem;
