// Powerup Configuration
export const POWERUP_CONFIG = {
  bigger_paddle: {
    emoji: "⬆️",
    label: "Big Paddle",
    effect: { paddleHeight: 1.5, duration: 8000 },
    color: "#00ff00", // Green - Good effect
    category: "beneficial",
    lifetime: 12000, // 12 seconds - longer for beneficial
  },
  smaller_paddle: {
    emoji: "⬇️",
    label: "Small Paddle",
    effect: { paddleHeight: 0.7, duration: 8000 },
    color: "#ff4444", // Red - Bad effect
    category: "detrimental",
    lifetime: 8000, // 8 seconds - shorter for detrimental
  },
  bigger_ball: {
    emoji: "🔵",
    label: "Big Ball",
    effect: { ballSize: 1.5, duration: 8000 },
    color: "#00ff00",
    category: "beneficial",
  },
  smaller_ball: {
    emoji: "🔹",
    label: "Small Ball",
    effect: { ballSize: 0.7, duration: 8000 },
    color: "#4488ff", // Blue - Good effect (easier to track)
    category: "beneficial",
  },
  speed_up: {
    emoji: "🚀",
    label: "Speed Up",
    effect: { ballSpeed: 1.3, duration: 6000 },
    color: "#ff2222", // Red - Bad effect (harder to react)
    category: "detrimental",
    lifetime: 8000, // 8 seconds
  },
  speed_down: {
    emoji: "🐢",
    label: "Slow Down",
    effect: { ballSpeed: 0.7, duration: 6000 },
    color: "#22ff22", // Green - Good effect (easier to hit)
    category: "beneficial",
    lifetime: 12000, // 12 seconds
  },
  random_direction: {
    emoji: "🎲",
    label: "Random Dir",
    effect: { randomDirection: true, duration: 0 },
    color: "#ffaa00", // Orange - Chaotic effect
    category: "chaotic",
  },
  clone_ball: {
    emoji: "🦠",
    label: "Clone Ball",
    effect: { cloneBall: true, duration: 0 },
    color: "#aa44ff", // Purple - Chaotic effect (could help or hurt)
    category: "chaotic",
  },
  score_bonus: {
    emoji: "➕",
    label: "+Score",
    effect: { scoreBonus: 5, duration: 0 },
    color: "#00ff44", // Bright green - Great effect
    category: "beneficial",
  },
  score_penalty: {
    emoji: "➖",
    label: "-Score",
    effect: { scorePenalty: -3, duration: 0 },
    color: "#ff0044", // Bright red - Bad effect
    category: "detrimental",
  },
  portal: {
    emoji: "🌀",
    label: "Portal",
    effect: { portal: true, duration: 0 },
    color: "#00aaff", // Cyan blue - Strategic advantage
    category: "chaotic",
    lifetime: 10000, // 10 seconds - medium for chaotic
  },
  random_wall: {
    emoji: "🧱",
    label: "Wall",
    effect: { randomWall: true, duration: 0 },
    color: "#ff8800", // Orange - Chaotic effect
    category: "chaotic",
  },
  shield: {
    emoji: "🛡️",
    label: "Shield",
    effect: { shield: true, duration: 0 },
    color: "#44ff88", // Green - Protective advantage
    category: "beneficial",
  },
  swap_score: {
    emoji: "🔄",
    label: "Swap Score",
    effect: { swapScore: true, duration: 0 },
    color: "#ff4488", // Pink-red - Potentially bad effect
    category: "detrimental",
  },
  blackhole: {
    emoji: "⚫",
    label: "Blackhole",
    effect: { blackhole: true, duration: 0 },
    color: "#8844ff", // Dark purple - Chaotic gravitational effect
    category: "chaotic",
    lifetime: 10000, // 10 seconds
  },
  // orientation_flip: {
  //   emoji: "☝️",
  //   label: "Orientation Flip",
  //   effect: { orientationFlip: true, duration: 10000 }, // 10 seconds
  //   color: "#ff9900", // Orange - Game-changing effect
  //   category: "chaotic",
  // },
};
