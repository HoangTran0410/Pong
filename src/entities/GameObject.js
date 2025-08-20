import { generateId } from "../utils/index.js";

// Base GameObject class for all game entities
class GameObject {
  constructor(x, y, type = "gameobject") {
    this.id = generateId(type);
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.created = Date.now();
  }

  // Update method to be overridden by subclasses
  update(deltaTime) {
    // Base implementation does nothing
  }

  // Render method to be overridden by subclasses
  render(ctx) {
    // Base implementation does nothing
  }

  // Check if object should be destroyed
  shouldDestroy() {
    return !this.active;
  }

  // Destroy this object
  destroy() {
    this.active = false;
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
}

export default GameObject;
