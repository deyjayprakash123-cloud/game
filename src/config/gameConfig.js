/**
 * Core Game Configuration
 * Centralized settings for dimensions, physics, camera, procedural shaft, and gameplay rules.
 */
export const GAME_CONFIG = {
  // Screen & Viewport (9:16 target for TikTok/Shorts & mobile screens)
  WIDTH: 540,
  HEIGHT: 960,
  ASPECT_RATIO: 9 / 16,

  // Grid & Shaft Architecture
  // 9 columns total: Col 0 = Left Bedrock Wall, Cols 1..7 = Playable Area, Col 8 = Right Bedrock Wall
  // 9 columns * 60px = 540px width
  GRID: {
    BLOCK_SIZE: 60,
    TOTAL_COLUMNS: 9,
    PLAYABLE_COLS_START: 1,
    PLAYABLE_COLS_END: 7,
    TOP_PADDING_ROWS: 5,        // Empty spawn chamber above first block row
    PRELOAD_ROWS_AHEAD: 15,     // 10-15 rows ahead of camera viewport
    CULL_ROWS_ABOVE: 5          // Cull rows 5 blocks above viewport
  },

  // Physics World (Matter.js)
  PHYSICS: {
    GRAVITY_Y: 1.30,
    PICKAXE_SPAWN_X: 270,       // Center of 540px width
    PICKAXE_SPAWN_Y: 150,
    MIN_IMPACT_VELOCITY: 0.8,   // Velocity threshold to trigger block damage
    RANDOM_IMPULSE_X: 2.8,      // Initial lateral push range
    RANDOM_ANGULAR_VEL: 0.18,   // Initial spin rate range
    RANDOM_BOUNCE_NOISE: 0.15   // Micro-impulse deflection jitter on collision
  },

  // Run Rules & Anti-Stuck Behavior
  RULES: {
    STUCK_SPEED_THRESHOLD: 0.10, // Velocity below 0.1 considered stationary
    STUCK_TIMEOUT_MS: 1500,      // 1.5 seconds stationary triggers anti-stuck kick
    MAX_ANTI_STUCK_ATTEMPTS: 4,  // Max automatic kicks before declaring immobilized
    CAMERA_OFFSET_Y: 340,        // Keeps pickaxe in upper-middle of vertical viewport
    CAMERA_LERP_Y: 0.08,         // Smooth vertical follow
    TAP_NUDGE_IMPULSE_Y: -6.5,   // Kinetic kick when user taps during run
    TAP_NUDGE_IMPULSE_X: 4.5
  },

  // Audio & Haptics
  AUDIO: {
    MASTER_VOLUME: 0.45,
    SYNTH_ENABLED: true
  }
};
