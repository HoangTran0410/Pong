// Game Configuration
export const CONFIG = {
  // Canvas - Will be set dynamically
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // Paddle
  PADDLE_WIDTH: 15,
  PADDLE_HEIGHT: 100,
  PADDLE_SPEED: 8,
  PADDLE_MARGIN: 20,
  PADDLE_MOMENTUM_TRANSFER: 0.3, // How much paddle velocity transfers to ball (0.0 to 1.0)

  // AI Paddle Settings
  AI_MAX_SPEED_MULTIPLIER: 0.6, // AI moves at 60% of player speed
  AI_ACCELERATION: 0.8, // How quickly AI accelerates
  AI_DECELERATION: 0.9, // How quickly AI decelerates
  AI_PREDICTION_ERROR: 0.15, // How much error in ball prediction (0-1)
  AI_REACTION_DELAY_CHANCE: 0.02, // 2% chance per frame to add reaction delay
  AI_MICRO_MOVEMENT_CHANCE: 0.3, // 30% chance for micro-adjustments
  AI_IDLE_MOVEMENT_CHANCE: 0.05, // 5% chance for idle movement

  // Mouse Control Settings
  MOUSE_IMMEDIATE_MOVEMENT: true, // Mouse control is immediate (false for smooth movement)
  MOUSE_DEBUG: false, // Enable debug logging for mouse coordinates

  // Ball
  BALL_SIZE: 10,
  BALL_SPEED: 5,
  MAX_BALL_SPEED: 10,
  SPEED_INCREMENT: 0.1,

  // Ball Trail (retro-style)
  BALL_TRAIL: {
    ENABLED: true,
    LENGTH: 12,
    OPACITY: 0.6,
  },

  // Powerups
  POWERUP_SIZE: 30,
  POWERUP_SPAWN_RATE: 0.02, // 2% chance per frame
  POWERUP_DURATION: 10000, // 10 seconds
  MAX_POWERUPS_ON_SCREEN: 3,

  // Blackhole Physics
  BLACKHOLE: {
    RADIUS: 30,
    ATTRACTION_RADIUS: 150,
    ATTRACTION_FORCE: 0.2,
    LIFETIME: 15000, // 15 seconds
  },

  // Colors
  COLORS: {
    PADDLE: "#00ff00",
    BALL: "#ff0000",
    BALL_TRAIL: "#aa1111",
    POWERUP: "#ffff00",
    BACKGROUND: "#000000",
    WALL: "#ff6b6b",
    SCORE: "#00ffff",
    CENTER_LINE: "#00ff00",
  },

  // Dynamic canvas sizing
  updateCanvasSize(canvas) {
    const container = canvas.parentElement;
    const headerHeight =
      container.querySelector(".game-header")?.offsetHeight || 0;
    const controlsHeight =
      container.querySelector(".game-controls")?.offsetHeight || 0;
    const padding = 2; // Account for borders and margins

    const availableHeight =
      window.innerHeight - headerHeight - controlsHeight - padding;
    const availableWidth = window.innerWidth - padding;

    // Set canvas dimensions
    canvas.width = availableWidth;
    canvas.height = availableHeight;

    // Update config dimensions
    CONFIG.CANVAS_WIDTH = availableWidth;
    CONFIG.CANVAS_HEIGHT = availableHeight;

    return { width: availableWidth, height: availableHeight };
  },
};
