// Powerup Configuration
export const POWERUP_CONFIG = {
  bigger_paddle: {
    emoji: "⬆️",
    label: "Big Paddle",
    effect: { paddleHeight: 1.5, duration: 8000 },
  },
  smaller_paddle: {
    emoji: "⬇️",
    label: "Small Paddle",
    effect: { paddleHeight: 0.7, duration: 8000 },
  },
  bigger_ball: {
    emoji: "🔵",
    label: "Big Ball",
    effect: { ballSize: 1.5, duration: 8000 },
  },
  smaller_ball: {
    emoji: "🔹",
    label: "Small Ball",
    effect: { ballSize: 0.7, duration: 8000 },
  },
  speed_up: {
    emoji: "⚡",
    label: "Speed Up",
    effect: { ballSpeed: 1.3, duration: 6000 },
  },
  speed_down: {
    emoji: "🐢",
    label: "Slow Down",
    effect: { ballSpeed: 0.7, duration: 6000 },
  },
  random_direction: {
    emoji: "🎲",
    label: "Random Dir",
    effect: { randomDirection: true, duration: 0 },
  },
  clone_ball: {
    emoji: "🟢🟢",
    label: "Clone Ball",
    effect: { cloneBall: true, duration: 0 },
  },
  score_bonus: {
    emoji: "➕",
    label: "+Score",
    effect: { scoreBonus: 5, duration: 0 },
  },
  score_penalty: {
    emoji: "➖",
    label: "-Score",
    effect: { scorePenalty: -3, duration: 0 },
  },
  portal: {
    emoji: "🌀",
    label: "Portal",
    effect: { portal: true, duration: 0 },
  },
  random_wall: {
    emoji: "🧱",
    label: "Wall",
    effect: { randomWall: true, duration: 0 },
  },
  shield: {
    emoji: "🛡️",
    label: "Shield",
    effect: { shield: true, duration: 0 },
  },
};
