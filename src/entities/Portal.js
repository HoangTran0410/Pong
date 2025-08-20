import GameObject from "./GameObject.js";
import eventBus from "../core/EventBus.js";

// Portal Entity - Represents teleportation portals
class Portal extends GameObject {
  constructor(x, y, config = {}) {
    super(x, y, "portal");

    this.radius = config.radius || 25;
    this.lifetime = config.lifetime || 10000; // 10 seconds default
    this.maxLifetime = this.lifetime;

    // Visual properties
    this.primaryColor = config.primaryColor || "#0066ff";
    this.secondaryColor = config.secondaryColor || "#00ccff";
    this.rotationSpeed = config.rotationSpeed || 0.005;

    // Portal pair reference
    this.pairedPortal = null;

    // Lifetime management
    this.startTime = Date.now();
  }

  // Set the paired portal for teleportation
  setPairedPortal(portal) {
    this.pairedPortal = portal;
  }

  // Update portal state
  update(deltaTime) {
    super.update(deltaTime);

    // Check if portal should expire
    const age = Date.now() - this.startTime;
    if (age >= this.lifetime) {
      this.destroy();
    }
  }

  // Check if ball collides with this portal
  checkBallCollision(ball) {
    if (!this.active || !this.pairedPortal || !this.pairedPortal.active) {
      return false;
    }

    const distance = this.getDistanceTo(ball);
    return distance < ball.radius + this.radius;
  }

  // Teleport ball to paired portal
  teleportBall(ball) {
    if (!this.pairedPortal || !this.pairedPortal.active) return false;

    // Move ball to paired portal position
    ball.x = this.pairedPortal.x;
    ball.y = this.pairedPortal.y;
    ball.portalCooldown = 500; // Prevent immediate re-teleportation

    // Emit teleportation event
    eventBus.emit("ball:portalTeleport", {
      ball,
      fromPortal: this,
      toPortal: this.pairedPortal,
    });

    return true;
  }

  // Render portal with spiral effect
  render(ctx) {
    if (!this.active) return;

    const time = Date.now() * this.rotationSpeed;
    const pulse = Math.sin(time * 0.5) * 0.1 + 1;
    const age = Date.now() - this.startTime;
    const lifetimeAlpha = Math.max(0.3, 1 - age / this.maxLifetime);

    ctx.save();
    ctx.globalAlpha = lifetimeAlpha;

    // Draw main portal circle with pulsing effect
    ctx.fillStyle = this.primaryColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer glow ring
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner ring
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 8, 0, Math.PI * 2);
    ctx.stroke();

    // Draw spiral effect
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3 * lifetimeAlpha;

    for (let arm = 0; arm < 3; arm++) {
      const armOffset = (arm * Math.PI * 2) / 3;

      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const angle = time + armOffset + i * 0.3 + i * 0.1;
        const radius = (this.radius - 15) * (1 - i / 20);

        if (radius > 0) {
          const x = this.x + Math.cos(angle) * radius;
          const y = this.y + Math.sin(angle) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Draw center core
    ctx.globalAlpha = lifetimeAlpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner core glow
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw lifetime warning
    const lifetimeRatio = 1 - age / this.maxLifetime;
    if (lifetimeRatio < 0.3) {
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2 * lifetimeRatio);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Portal Pair - Manages two connected portals
export class PortalPair {
  constructor(portal1Config, portal2Config, lifetime = 10000) {
    // Create two portals with different colors
    this.portal1 = new Portal(portal1Config.x, portal1Config.y, {
      ...portal1Config,
      primaryColor: "#0066ff",
      secondaryColor: "#00ccff",
      lifetime,
    });

    this.portal2 = new Portal(portal2Config.x, portal2Config.y, {
      ...portal2Config,
      primaryColor: "#9900ff",
      secondaryColor: "#cc66ff",
      lifetime,
    });

    // Connect the portals
    this.portal1.setPairedPortal(this.portal2);
    this.portal2.setPairedPortal(this.portal1);

    this.created = Date.now();
  }

  // Update both portals
  update(deltaTime) {
    this.portal1.update(deltaTime);
    this.portal2.update(deltaTime);
  }

  // Check if pair should be destroyed
  shouldDestroy() {
    return this.portal1.shouldDestroy() || this.portal2.shouldDestroy();
  }

  // Destroy both portals
  destroy() {
    this.portal1.destroy();
    this.portal2.destroy();
  }

  // Render both portals and connection line
  render(ctx) {
    if (!this.portal1.active || !this.portal2.active) return;

    // Draw connecting line between portals
    ctx.save();
    const age = Date.now() - this.created;
    const lifetimeAlpha = Math.max(0.3, 1 - age / this.portal1.maxLifetime);

    ctx.globalAlpha = lifetimeAlpha * 0.5;
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(this.portal1.x, this.portal1.y);
    ctx.lineTo(this.portal2.x, this.portal2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Render individual portals
    this.portal1.render(ctx);
    this.portal2.render(ctx);
  }

  // Check ball collision with either portal
  checkBallCollision(ball) {
    if (ball.portalCooldown > 0) return false;

    if (this.portal1.checkBallCollision(ball)) {
      return this.portal1.teleportBall(ball);
    } else if (this.portal2.checkBallCollision(ball)) {
      return this.portal2.teleportBall(ball);
    }

    return false;
  }
}

export default Portal;
