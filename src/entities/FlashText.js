import { CONFIG } from "../config/game.js";
import {
  easeOutQuart,
  easeInQuart,
  easeOutCubic,
  generateId,
} from "../utils/index.js";

// FlashText Entity - Displays big retro-style text notifications at screen center
class FlashText {
  constructor(text, options = {}) {
    this.text = text;
    this.originalText = text; // Store original text without multiplier
    this.id = generateId("flashtext");

    // Position (can be overridden by options)
    this.x = options.x !== undefined ? options.x : CONFIG.CANVAS_WIDTH / 2;
    this.y = options.y !== undefined ? options.y : CONFIG.CANVAS_HEIGHT / 2;
    this.baseY = this.y; // Store original Y position for stacking calculations

    // Multiplier system
    this.multiplier = 1;
    this.showMultiplier = false;

    // Animation properties
    this.duration = options.duration || 2000; // 2 seconds default
    this.fadeInDuration = options.fadeInDuration || 300; // 300ms fade in
    this.fadeOutDuration = options.fadeOutDuration || 500; // 500ms fade out
    this.startTime = Date.now();
    this.isActive = true;

    // Visual properties
    this.color = options.color || "#00ff00"; // Default retro green
    this.fontSize = options.fontSize || 32;
    this.shadowColor = options.shadowColor || "#004400";
    this.glowColor = options.glowColor || "#88ff88";

    // Animation state
    this.alpha = 0;
    this.scale = 0.5;
    this.offsetY = 0;

    // Position animation for stacking
    this.targetY = this.y;
    this.animatingPosition = false;
    this.positionAnimationStart = 0;
    this.positionAnimationDuration = 400; // 400ms for smooth transitions
    this.startY = this.y;

    // Note: Easing functions now imported from utils
  }

  // Update animation state
  update() {
    if (!this.isActive) return;

    const elapsed = Date.now() - this.startTime;
    const progress = elapsed / this.duration;

    if (progress >= 1) {
      this.isActive = false;
      return;
    }

    // Update position animation if active
    this.updatePositionAnimation();

    // Fade in phase
    if (elapsed < this.fadeInDuration) {
      const fadeProgress = elapsed / this.fadeInDuration;
      this.alpha = easeOutQuart(fadeProgress);
      this.scale = 0.5 + 0.5 * easeOutQuart(fadeProgress);
      this.offsetY = -20 * (1 - easeOutQuart(fadeProgress));
    }
    // Hold phase
    else if (elapsed < this.duration - this.fadeOutDuration) {
      this.alpha = 1;
      this.scale = 1;
      this.offsetY = 0;

      // Subtle pulsing effect
      const pulseProgress = (elapsed - this.fadeInDuration) / 1000;
      this.scale = 1 + Math.sin(pulseProgress * 4) * 0.05;
    }
    // Fade out phase
    else {
      const fadeOutElapsed = elapsed - (this.duration - this.fadeOutDuration);
      const fadeProgress = fadeOutElapsed / this.fadeOutDuration;
      this.alpha = 1 - easeInQuart(fadeProgress);
      this.scale = 1 - 0.2 * easeInQuart(fadeProgress);
      this.offsetY = -10 * easeInQuart(fadeProgress);
    }

    // Update position to stay centered (in case of window resize)
    this.x = CONFIG.CANVAS_WIDTH / 2;
    // Keep the baseY relative position but update for new canvas size
    const centerY = CONFIG.CANVAS_HEIGHT / 2;
    this.baseY = centerY;
    // Don't override Y if it was manually set for stacking
  }

  // Render the flash text
  render(ctx) {
    if (!this.isActive || this.alpha <= 0) return;

    ctx.save();

    // Apply transformations
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y + this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Prepare display text (with multiplier if applicable)
    const displayText =
      this.showMultiplier && this.multiplier > 1
        ? `${this.originalText} x${this.multiplier}`
        : this.text;

    // Set font properties
    ctx.font = `${this.fontSize}px 'Press Start 2P', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Create retro glow effect
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw glow layers for retro effect
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = this.glowColor;
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.fillText(displayText, 0, 0);
    }

    // Reset shadow for main text
    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.alpha;

    // Draw shadow/outline effect
    ctx.fillStyle = this.shadowColor;
    ctx.fillText(displayText, 2, 2);

    // Draw main text
    ctx.fillStyle = this.color;
    ctx.fillText(displayText, 0, 0);

    // Add scanline effect overlay
    ctx.globalAlpha = this.alpha * 0.1;
    ctx.fillStyle = "#000000";
    const textMetrics = ctx.measureText(displayText);
    const textWidth = textMetrics.width;
    const textHeight = this.fontSize;

    // Draw horizontal scanlines over the text
    for (let y = -textHeight / 2; y < textHeight / 2; y += 2) {
      ctx.fillRect(-textWidth / 2, y, textWidth, 1);
    }

    ctx.restore();
  }

  // Check if flash text is still active
  isFinished() {
    return !this.isActive;
  }

  // Force finish the animation
  finish() {
    this.isActive = false;
  }

  // Get remaining time
  getRemainingTime() {
    if (!this.isActive) return 0;
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.duration - elapsed);
  }

  // Animate position to new target
  animateToPosition(newY) {
    if (Math.abs(this.y - newY) < 1) {
      // If the difference is tiny, just snap to position
      this.y = newY;
      this.baseY = newY;
      this.targetY = newY;
      this.animatingPosition = false;
      return;
    }

    this.startY = this.y;
    this.targetY = newY;
    this.animatingPosition = true;
    this.positionAnimationStart = Date.now();
  }

  // Update position animation
  updatePositionAnimation() {
    if (!this.animatingPosition) return;

    const elapsed = Date.now() - this.positionAnimationStart;
    const progress = Math.min(elapsed / this.positionAnimationDuration, 1);

    if (progress >= 1) {
      // Animation complete
      this.y = this.targetY;
      this.baseY = this.targetY;
      this.animatingPosition = false;
    } else {
      // Interpolate position with smooth easing
      const easedProgress = easeOutCubic(progress);
      this.y = this.startY + (this.targetY - this.startY) * easedProgress;
      this.baseY = this.y;
    }
  }

  // Check if position animation is running
  isAnimatingPosition() {
    return this.animatingPosition;
  }

  // Increment multiplier and extend duration
  incrementMultiplier() {
    this.multiplier++;
    this.showMultiplier = true;

    // Extend the duration to give more time to read
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    const remaining = this.duration - elapsed;

    // Add extra time if there's less than 1.5 seconds remaining
    if (remaining < 1500) {
      const extensionTime = 1500 - remaining;
      this.duration += extensionTime;
    }

    // Add a small visual pulse effect by briefly scaling up
    this.scale = Math.min(this.scale * 1.1, 1.2);
  }

  // Check if this FlashText matches given text
  matchesText(text) {
    return this.originalText === text;
  }

  // Get the multiplier count
  getMultiplier() {
    return this.multiplier;
  }
}

export default FlashText;
