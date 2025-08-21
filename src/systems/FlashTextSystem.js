import { CONFIG } from "../config/game.js";
import FlashText from "../entities/FlashText.js";
import eventBus from "../core/EventBus.js";

// FlashText System - Manages all flash text notifications with stacking and multipliers
class FlashTextSystem {
  constructor() {
    this.flashTexts = [];
    this.setupEventListeners();
  }

  // Setup event listeners
  setupEventListeners() {
    // Listen for flash text requests
    eventBus.subscribe("game:showFlashText", (data) => {
      this.addFlashText(data.text, data.options);
    });
  }

  // Add flash text with stacking support and duplicate detection
  addFlashText(text, options = {}) {
    // Check if there's an existing active FlashText with the same text
    const existingFlashText = this.flashTexts.find(
      (ft) => ft.isActive && ft.matchesText(text)
    );

    if (existingFlashText) {
      // Increment multiplier instead of creating new FlashText
      existingFlashText.incrementMultiplier();
      return; // Don't create a new FlashText
    }

    // No duplicate found, create new FlashText
    const stackedOptions = this.calculateStackedPosition(options);
    const flashText = new FlashText(text, stackedOptions);

    // Add a small delay to the new flashtext if there are existing ones
    // This allows the stack animation to complete first
    const existingActiveCount = this.flashTexts.filter(
      (ft) => ft.isActive
    ).length;
    if (existingActiveCount > 0) {
      // Delay the start time slightly so existing animations can complete
      flashText.startTime = Date.now() + 200; // 200ms delay
    }

    this.flashTexts.push(flashText);

    // Update positions of existing flash texts to make room
    this.updateFlashTextStack();
  }

  // Calculate position for new flash text in stack
  calculateStackedPosition(options) {
    const stackedOptions = { ...options };

    // Default spacing between stacked notifications
    const STACK_SPACING = 80;
    const CENTER_Y = CONFIG.CANVAS_HEIGHT / 2;

    // Count active flash texts
    const activeCount = this.flashTexts.filter((ft) => ft.isActive).length;

    // Calculate Y position for new flash text (stack upward from center)
    if (activeCount === 0) {
      // First notification at center
      stackedOptions.y = CENTER_Y;
    } else {
      // Stack new notifications above existing ones
      stackedOptions.y = CENTER_Y - activeCount * STACK_SPACING;
    }

    // Ensure we don't go off-screen at the top
    const MIN_Y = 60; // Minimum distance from top
    if (stackedOptions.y < MIN_Y) {
      // If we would go off-screen, start stacking downward instead
      stackedOptions.y = CENTER_Y + activeCount * STACK_SPACING;

      // If still off-screen at bottom, limit to screen bounds
      const MAX_Y = CONFIG.CANVAS_HEIGHT - 60;
      if (stackedOptions.y > MAX_Y) {
        stackedOptions.y = MAX_Y;
      }
    }

    return stackedOptions;
  }

  // Update positions of all flash texts in stack with smooth animations
  updateFlashTextStack() {
    const STACK_SPACING = 50;
    const CENTER_Y = CONFIG.CANVAS_HEIGHT / 2;

    // Filter active flash texts and sort by creation time (oldest first)
    const activeFlashTexts = this.flashTexts
      .filter((ft) => ft.isActive)
      .sort((a, b) => {
        // Extract timestamp from ID for sorting
        const aTime = parseFloat(a.id.split("_")[1]);
        const bTime = parseFloat(b.id.split("_")[1]);
        return aTime - bTime;
      });

    // Calculate new positions and animate to them
    activeFlashTexts.forEach((flashText, index) => {
      const totalTexts = activeFlashTexts.length;
      let newY;

      if (totalTexts === 1) {
        // Single text at center
        newY = CENTER_Y;
      } else {
        // Multiple texts - stack them centered around middle
        const startY = CENTER_Y - ((totalTexts - 1) * STACK_SPACING) / 2;
        newY = startY + index * STACK_SPACING;

        // Ensure within bounds
        const MIN_Y = 60;
        const MAX_Y = CONFIG.CANVAS_HEIGHT - 60;

        if (newY < MIN_Y) {
          newY = MIN_Y + index * STACK_SPACING;
        } else if (newY > MAX_Y) {
          newY = MAX_Y - (totalTexts - 1 - index) * STACK_SPACING;
        }
      }

      // Animate to new position instead of instant positioning
      flashText.animateToPosition(newY);
    });
  }

  // Update system
  update() {
    // Store count before update
    const beforeCount = this.flashTexts.filter((ft) => ft.isActive).length;

    // Update existing flash texts
    this.flashTexts.forEach((flashText) => {
      flashText.update();
    });

    // Remove finished flash texts
    this.flashTexts = this.flashTexts.filter(
      (flashText) => !flashText.isFinished()
    );

    // Store count after cleanup
    const afterCount = this.flashTexts.filter((ft) => ft.isActive).length;

    // If the count changed (some notifications finished), update the stack
    if (beforeCount !== afterCount && afterCount > 0) {
      this.updateFlashTextStack();
    }
  }

  // Get all flash texts for rendering
  getFlashTexts() {
    return this.flashTexts;
  }

  // Clear all flash texts
  clear() {
    this.flashTexts = [];
  }

  // Get count of active flash texts
  getActiveCount() {
    return this.flashTexts.filter((ft) => ft.isActive).length;
  }

  // Check if any flash texts are currently animating position
  hasAnimatingTexts() {
    return this.flashTexts.some((ft) => ft.isAnimatingPosition());
  }

  // Force finish all flash texts (for immediate cleanup)
  finishAll() {
    this.flashTexts.forEach((ft) => ft.finish());
  }

  // Get flash text by ID
  getFlashTextById(id) {
    return this.flashTexts.find((ft) => ft.id === id);
  }

  // Remove specific flash text by ID
  removeFlashTextById(id) {
    const index = this.flashTexts.findIndex((ft) => ft.id === id);
    if (index > -1) {
      this.flashTexts.splice(index, 1);
      this.updateFlashTextStack();
    }
  }
}

export default FlashTextSystem;
