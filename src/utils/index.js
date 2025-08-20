// Utility Functions - Centralized helper functions for the Pong game

// ==========================================
// COLOR UTILITIES
// ==========================================

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string (with or without #)
 * @returns {Object} RGB object with r, g, b properties
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 0 }; // fallback to yellow
}

/**
 * Convert RGB values to hex color string
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Lighten a hex color by a given amount
 * @param {string} color - Hex color string
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {string} Lightened hex color
 */
export function lightenColor(color, amount) {
  const rgb = hexToRgb(color);
  return rgbToHex(
    Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount)),
    Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount)),
    Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount))
  );
}

/**
 * Darken a hex color by a given amount
 * @param {string} color - Hex color string
 * @param {number} amount - Amount to darken (0-1)
 * @returns {string} Darkened hex color
 */
export function darkenColor(color, amount) {
  const rgb = hexToRgb(color);
  return rgbToHex(
    Math.round(rgb.r * (1 - amount)),
    Math.round(rgb.g * (1 - amount)),
    Math.round(rgb.b * (1 - amount))
  );
}

// ==========================================
// EASING FUNCTIONS
// ==========================================

/**
 * Ease out quart - Smooth deceleration
 * @param {number} t - Time progress (0-1)
 * @returns {number} Eased value
 */
export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Ease in quart - Smooth acceleration
 * @param {number} t - Time progress (0-1)
 * @returns {number} Eased value
 */
export function easeInQuart(t) {
  return t * t * t * t;
}

/**
 * Ease out cubic - Smooth deceleration
 * @param {number} t - Time progress (0-1)
 * @returns {number} Eased value
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in cubic - Smooth acceleration
 * @param {number} t - Time progress (0-1)
 * @returns {number} Eased value
 */
export function easeInCubic(t) {
  return t * t * t;
}

/**
 * Ease in-out cubic - Smooth acceleration and deceleration
 * @param {number} t - Time progress (0-1)
 * @returns {number} Eased value
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ==========================================
// MATH UTILITIES
// ==========================================

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point x coordinate
 * @param {number} y1 - First point y coordinate
 * @param {number} x2 - Second point x coordinate
 * @param {number} y2 - Second point y coordinate
 * @returns {number} Distance between points
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Normalize a value from one range to another
 * @param {number} value - Value to normalize
 * @param {number} fromMin - Source range minimum
 * @param {number} fromMax - Source range maximum
 * @param {number} toMin - Target range minimum
 * @param {number} toMax - Target range maximum
 * @returns {number} Normalized value
 */
export function normalize(value, fromMin, fromMax, toMin, toMax) {
  const normalizedInput = (value - fromMin) / (fromMax - fromMin);
  return toMin + normalizedInput * (toMax - toMin);
}

/**
 * Get random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
export function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Get random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ==========================================
// ANGLE AND DIRECTION UTILITIES
// ==========================================

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Calculate angle between two points
 * @param {number} x1 - First point x coordinate
 * @param {number} y1 - First point y coordinate
 * @param {number} x2 - Second point x coordinate
 * @param {number} y2 - Second point y coordinate
 * @returns {number} Angle in radians
 */
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize angle to be between 0 and 2π
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

// ==========================================
// COLLISION UTILITIES
// ==========================================

/**
 * Check if two circles collide
 * @param {number} x1 - First circle x
 * @param {number} y1 - First circle y
 * @param {number} r1 - First circle radius
 * @param {number} x2 - Second circle x
 * @param {number} y2 - Second circle y
 * @param {number} r2 - Second circle radius
 * @returns {boolean} True if circles collide
 */
export function circleCollision(x1, y1, r1, x2, y2, r2) {
  const dist = distance(x1, y1, x2, y2);
  return dist < r1 + r2;
}

/**
 * Check if a point is inside a rectangle
 * @param {number} pointX - Point x coordinate
 * @param {number} pointY - Point y coordinate
 * @param {number} rectX - Rectangle x coordinate
 * @param {number} rectY - Rectangle y coordinate
 * @param {number} rectWidth - Rectangle width
 * @param {number} rectHeight - Rectangle height
 * @returns {boolean} True if point is inside rectangle
 */
export function pointInRect(
  pointX,
  pointY,
  rectX,
  rectY,
  rectWidth,
  rectHeight
) {
  return (
    pointX >= rectX &&
    pointX <= rectX + rectWidth &&
    pointY >= rectY &&
    pointY <= rectY + rectHeight
  );
}

// ==========================================
// ID GENERATION
// ==========================================

/**
 * Generate a unique ID using timestamp and random number
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random()}`;
}

// ==========================================
// TIMING UTILITIES
// ==========================================

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Smooth step function for animations
 * @param {number} edge0 - Lower edge
 * @param {number} edge1 - Upper edge
 * @param {number} x - Input value
 * @returns {number} Smooth step value
 */
export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
