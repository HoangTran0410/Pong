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
  update(deltaTime = 16, gameState = null) {
    super.update(deltaTime, gameState);

    // Check if portal should expire
    const age = Date.now() - this.startTime;
    if (age >= this.lifetime) {
      this.destroy();
    }

    return null;
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

  // Render portal with enhanced dimensional effects
  render(ctx) {
    if (!this.active) return;

    const time = Date.now() * this.rotationSpeed;
    const pulse = Math.sin(time * 0.5) * 0.15 + 1;
    const age = Date.now() - this.startTime;
    const lifetimeAlpha = Math.max(0.3, 1 - age / this.maxLifetime);

    ctx.save();

    // Enhanced outer energy field
    const outerGradient = ctx.createRadialGradient(
      this.x,
      this.y,
      this.radius * 0.5,
      this.x,
      this.y,
      this.radius * 3
    );
    outerGradient.addColorStop(0, this.primaryColor + "60");
    outerGradient.addColorStop(0.5, this.primaryColor + "20");
    outerGradient.addColorStop(1, this.primaryColor + "00");

    ctx.globalAlpha = lifetimeAlpha * 0.8;
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Dimensional distortion rings
    for (let i = 0; i < 4; i++) {
      const distortionRadius = this.radius + (15 + i * 8) * pulse;
      const distortionTime = time * (1 + i * 0.3);

      ctx.globalAlpha = (0.4 - i * 0.08) * lifetimeAlpha;
      ctx.strokeStyle = this.secondaryColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -distortionTime * 30;
      ctx.beginPath();
      ctx.arc(this.x, this.y, distortionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Main portal with dimensional gradient
    const portalGradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius * pulse
    );
    portalGradient.addColorStop(0, "#000000");
    portalGradient.addColorStop(0.3, this.primaryColor + "aa");
    portalGradient.addColorStop(0.7, this.primaryColor);
    portalGradient.addColorStop(1, this.secondaryColor);

    ctx.globalAlpha = lifetimeAlpha;
    ctx.fillStyle = portalGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Enhanced outer glow ring with energy effect
    const glowPulse = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 4;
    ctx.globalAlpha = lifetimeAlpha * glowPulse;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Multiple inner energy rings
    for (let i = 0; i < 3; i++) {
      const ringRadius = this.radius - 5 - i * 4;
      const ringPulse = Math.sin(time * (2 + i)) * 0.2 + 0.8;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 - i * 0.5;
      ctx.globalAlpha = lifetimeAlpha * ringPulse * (0.8 - i * 0.2);
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Enhanced spiral effect with multiple layers
    ctx.strokeStyle = "#ffffff";
    ctx.globalAlpha = 0.6 * lifetimeAlpha;

    for (let layer = 0; layer < 2; layer++) {
      ctx.lineWidth = 2 - layer * 0.5;

      for (let arm = 0; arm < 4; arm++) {
        const armOffset = (arm * Math.PI * 2) / 4 + (layer * Math.PI) / 4;

        ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
          const spiralTime = time * (1 + layer * 0.5);
          const angle = spiralTime + armOffset + i * 0.25;
          const radius = (this.radius - 8 - layer * 3) * (1 - i / 25);

          if (radius > 0) {
            // Add dimensional wave distortion
            const distortion = Math.sin(angle * 3 + spiralTime) * 2;
            const finalRadius = radius + distortion;
            const x = this.x + Math.cos(angle) * finalRadius;
            const y = this.y + Math.sin(angle) * finalRadius;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      }
    }

    // Enhanced center void with dimensional effects
    const voidGradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      8
    );
    voidGradient.addColorStop(0, "#000000");
    voidGradient.addColorStop(0.7, this.primaryColor + "80");
    voidGradient.addColorStop(1, "#ffffff");

    ctx.globalAlpha = lifetimeAlpha;
    ctx.fillStyle = voidGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Core energy point
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = lifetimeAlpha * glowPulse;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enhanced lifetime warning
    const lifetimeRatio = 1 - age / this.maxLifetime;
    // if (lifetimeRatio < 0.3) {
    //   const warningPulse = Math.sin(Date.now() * 0.015) * 0.5 + 0.5;

    //   // Unstable energy discharge
    //   for (let i = 0; i < 6; i++) {
    //     const dischargeAngle = (i / 6) * Math.PI * 2 + time;
    //     const dischargeLength = (15 + Math.random() * 10) * warningPulse;

    //     ctx.strokeStyle = "#ff4444";
    //     ctx.lineWidth = 3;
    //     ctx.globalAlpha = warningPulse * 0.8;
    //     ctx.beginPath();
    //     ctx.moveTo(
    //       this.x + Math.cos(dischargeAngle) * (this.radius + 5),
    //       this.y + Math.sin(dischargeAngle) * (this.radius + 5)
    //     );
    //     ctx.lineTo(
    //       this.x +
    //         Math.cos(dischargeAngle) * (this.radius + 5 + dischargeLength),
    //       this.y +
    //         Math.sin(dischargeAngle) * (this.radius + 5 + dischargeLength)
    //     );
    //     ctx.stroke();
    //   }
    // }

    // Lifetime indicator (similar to blackhole)
    if (lifetimeRatio < 0.5) {
      ctx.strokeStyle = lifetimeRatio < 0.2 ? "#ff4444" : "#ffaa44";
      ctx.lineWidth = 3;
      ctx.globalAlpha =
        lifetimeRatio < 0.2
          ? Math.sin(Date.now() * 0.01) * 0.5 + 0.5 // Pulsing warning for critical
          : 0.8; // Steady warning for low

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2 * lifetimeRatio);
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
  shouldRemove() {
    return this.portal1.shouldRemove() || this.portal2.shouldRemove();
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
    const lifetimeRatio = 1 - age / this.portal1.maxLifetime;

    // Change line color based on lifetime
    let lineColor = "#00ffff"; // Default cyan
    let lineAlpha = lifetimeAlpha * 0.5;

    if (lifetimeRatio < 0.2) {
      // Critical - pulsing red
      lineColor = "#ff4444";
      lineAlpha = lifetimeAlpha * (Math.sin(Date.now() * 0.01) * 0.3 + 0.7);
    } else if (lifetimeRatio < 0.5) {
      // Warning - orange/yellow
      lineColor = "#ffaa44";
      lineAlpha = lifetimeAlpha * 0.7;
    }

    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lifetimeRatio < 0.2 ? 4 : 3; // Thicker line when critical
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
