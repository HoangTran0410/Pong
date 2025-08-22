import { generateId } from "../utils/index.js";

// Base GameObject class for all game entities
// This centralized approach makes it easy to manage all game objects uniformly
class GameObject {
  constructor(x, y, type = "gameobject") {
    this.id = generateId(type);
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.toRemove = false; // Flag for removal from game
    this.created = Date.now();

    // Collision properties - can be overridden by subclasses
    this.collidable = false;
    this.collisionRadius = 0;
    this.collisionWidth = 0;
    this.collisionHeight = 0;
  }

  // Update method to be overridden by subclasses
  // Should return collision results if any
  update(deltaTime, gameState) {
    // Base implementation does nothing
    return null;
  }

  // Render method to be overridden by subclasses
  render(ctx) {
    // Base implementation does nothing
  }

  // Check if object should be removed from game
  shouldRemove() {
    return this.toRemove || !this.active;
  }

  // Mark object for removal
  markForRemoval() {
    this.toRemove = true;
  }

  // Destroy this object (immediate removal)
  destroy() {
    this.active = false;
    this.toRemove = true;
  }

  // Get center position
  getCenterPosition() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  // Get distance to another object
  getDistanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Check if this object is within a radius of another
  isWithinRadius(other, radius) {
    return this.getDistanceTo(other) <= radius;
  }

  // Basic collision detection - can be overridden for specific shapes
  checkCollisionWith(other) {
    if (!this.collidable || !other.collidable) {
      return false;
    }

    // Circle-circle collision (default)
    if (this.collisionRadius > 0 && other.collisionRadius > 0) {
      const distance = this.getDistanceTo(other);
      return distance <= this.collisionRadius + other.collisionRadius;
    }

    // Rectangle-circle collision
    if (this.collisionWidth > 0 && other.collisionRadius > 0) {
      return this.checkRectCircleCollision(this, other);
    }

    // Circle-rectangle collision
    if (this.collisionRadius > 0 && other.collisionWidth > 0) {
      return this.checkRectCircleCollision(other, this);
    }

    // Rectangle-rectangle collision
    if (this.collisionWidth > 0 && other.collisionWidth > 0) {
      return this.checkRectRectCollision(this, other);
    }

    return false;
  }

  // Helper method for rectangle-circle collision
  checkRectCircleCollision(rect, circle) {
    const rectLeft = rect.x;
    const rectRight = rect.x + rect.collisionWidth;
    const rectTop = rect.y;
    const rectBottom = rect.y + rect.collisionHeight;

    return (
      circle.x + circle.collisionRadius > rectLeft &&
      circle.x - circle.collisionRadius < rectRight &&
      circle.y + circle.collisionRadius > rectTop &&
      circle.y - circle.collisionRadius < rectBottom
    );
  }

  // Helper method for rectangle-rectangle collision
  checkRectRectCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.collisionWidth &&
      rect1.x + rect1.collisionWidth > rect2.x &&
      rect1.y < rect2.y + rect2.collisionHeight &&
      rect1.y + rect1.collisionHeight > rect2.y
    );
  }

  // Handle collision with another object - to be overridden
  onCollision(other, collisionType = "default") {
    // Base implementation does nothing
    // Subclasses should override this to handle specific collision behavior
    return false; // Return true if collision was handled
  }

  // Get bounds for collision detection (can be overridden)
  getBounds() {
    if (this.collisionRadius > 0) {
      return {
        left: this.x - this.collisionRadius,
        right: this.x + this.collisionRadius,
        top: this.y - this.collisionRadius,
        bottom: this.y + this.collisionRadius,
      };
    } else if (this.collisionWidth > 0) {
      return {
        left: this.x,
        right: this.x + this.collisionWidth,
        top: this.y,
        bottom: this.y + this.collisionHeight,
      };
    }
    return null;
  }
}

export default GameObject;
