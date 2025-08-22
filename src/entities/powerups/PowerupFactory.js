// Powerup Factory - Creates specific powerup instances
import {
  BiggerPaddlePowerup,
  SmallerPaddlePowerup,
} from "./PaddleSizePowerup.js";
import { BiggerBallPowerup, SmallerBallPowerup } from "./BallSizePowerup.js";
import { SpeedUpPowerup, SlowDownPowerup } from "./SpeedPowerup.js";
import {
  CloneBallPowerup,
  RandomDirectionPowerup,
  ScoreBonusPowerup,
  ScorePenaltyPowerup,
  SwapScorePowerup,
  ShieldPowerup,
} from "./SpecialPowerup.js";
import {
  PortalPowerup,
  WallPowerup,
  BlackholePowerup,
  CagePowerup,
} from "./EnvironmentPowerup.js";

export default class PowerupFactory {
  // Map of powerup types to their classes
  static powerupClasses = {
    bigger_paddle: BiggerPaddlePowerup,
    smaller_paddle: SmallerPaddlePowerup,
    bigger_ball: BiggerBallPowerup,
    smaller_ball: SmallerBallPowerup,
    speed_up: SpeedUpPowerup,
    speed_down: SlowDownPowerup,
    clone_ball: CloneBallPowerup,
    random_direction: RandomDirectionPowerup,
    score_bonus: ScoreBonusPowerup,
    score_penalty: ScorePenaltyPowerup,
    swap_score: SwapScorePowerup,
    shield: ShieldPowerup,
    portal: PortalPowerup,
    random_wall: WallPowerup,
    blackhole: BlackholePowerup,
    cage: CagePowerup,
  };

  // Get all available powerup types
  static getAvailableTypes() {
    return Object.keys(this.powerupClasses);
  }

  // Create a powerup of the specified type
  static createPowerup(type, x, y) {
    const PowerupClass = this.powerupClasses[type];

    if (!PowerupClass) {
      console.warn(`Unknown powerup type: ${type}`);
      return null;
    }

    return new PowerupClass(x, y);
  }

  // Create a random powerup
  static createRandomPowerup(x, y, excludeTypes = []) {
    const availableTypes = this.getAvailableTypes().filter(
      (type) => !excludeTypes.includes(type)
    );

    if (availableTypes.length === 0) {
      console.warn("No available powerup types to create");
      return null;
    }

    const randomType =
      availableTypes[Math.floor(Math.random() * availableTypes.length)];
    return this.createPowerup(randomType, x, y);
  }

  // Create a powerup based on category
  static createPowerupByCategory(category, x, y) {
    const typesInCategory = this.getAvailableTypes().filter((type) => {
      const PowerupClass = this.powerupClasses[type];
      // Create a temporary instance to check category
      const temp = new PowerupClass(0, 0);
      const isMatch = temp.category === category;
      temp.destroy(); // Clean up
      return isMatch;
    });

    if (typesInCategory.length === 0) {
      console.warn(`No powerups found in category: ${category}`);
      return null;
    }

    const randomType =
      typesInCategory[Math.floor(Math.random() * typesInCategory.length)];
    return this.createPowerup(randomType, x, y);
  }

  // Create powerups with weighted probabilities
  static createWeightedRandomPowerup(x, y, weights = {}) {
    const availableTypes = this.getAvailableTypes();
    const weightedTypes = [];

    // Build weighted array
    availableTypes.forEach((type) => {
      const weight = weights[type] || 1; // Default weight of 1
      for (let i = 0; i < weight; i++) {
        weightedTypes.push(type);
      }
    });

    if (weightedTypes.length === 0) {
      return null;
    }

    const randomType =
      weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
    return this.createPowerup(randomType, x, y);
  }

  // Check if a powerup type exists
  static isValidType(type) {
    return type in this.powerupClasses;
  }

  // Get powerup info without creating instance
  static getPowerupInfo(type) {
    if (!this.isValidType(type)) {
      return null;
    }

    // Create temporary instance to get info
    const temp = new this.powerupClasses[type](0, 0);
    const info = {
      type: temp.powerupType,
      emoji: temp.emoji,
      label: temp.label,
      color: temp.color,
      category: temp.category,
      lifetime: temp.lifetime,
    };
    temp.destroy(); // Clean up
    return info;
  }
}
