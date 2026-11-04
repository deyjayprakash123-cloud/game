/**
 * Block Types Configuration
 * Defines health, score values, durability impact, particle colors, and special effects.
 */
export const BLOCK_TYPES = {
  // Standard Natural Blocks
  DIRT: {
    id: 'dirt',
    name: 'Dirt',
    maxHp: 15,
    scoreValue: 10,
    durabilityCost: 1,
    texture: 'block_dirt',
    particleColor: 0x8a5a32,
    hitSound: 'hit_dirt',
    breakSound: 'break_dirt',
    isSpecial: false,
    isIndestructible: false
  },
  STONE: {
    id: 'stone',
    name: 'Stone',
    maxHp: 30,
    scoreValue: 25,
    durabilityCost: 1,
    texture: 'block_stone',
    particleColor: 0x888890,
    hitSound: 'hit_stone',
    breakSound: 'break_stone',
    isSpecial: false,
    isIndestructible: false
  },
  HARD_STONE: {
    id: 'hard_stone',
    name: 'Hard Stone',
    maxHp: 65,
    scoreValue: 60,
    durabilityCost: 2,
    texture: 'block_hard_stone',
    particleColor: 0x484a56,
    hitSound: 'hit_stone',
    breakSound: 'break_stone',
    isSpecial: false,
    isIndestructible: false
  },
  RED_VOLCANIC: {
    id: 'red_volcanic',
    name: 'Volcanic Rock',
    maxHp: 65,
    scoreValue: 60,
    durabilityCost: 2,
    texture: 'block_red_volcanic',
    particleColor: 0x991b1b,
    hitSound: 'hit_stone',
    breakSound: 'break_stone',
    isSpecial: false,
    isIndestructible: false
  },

  // Ores
  COPPER_ORE: {
    id: 'copper_ore',
    name: 'Copper Ore',
    maxHp: 45,
    scoreValue: 100,
    durabilityCost: 1,
    texture: 'block_copper_ore',
    particleColor: 0xdd7333,
    hitSound: 'hit_metal',
    breakSound: 'break_gem',
    isSpecial: false,
    isIndestructible: false
  },
  GOLD_ORE: {
    id: 'gold_ore',
    name: 'Gold Ore',
    maxHp: 60,
    scoreValue: 250,
    durabilityCost: 1,
    texture: 'block_gold_ore',
    particleColor: 0xf5cf23,
    hitSound: 'hit_metal',
    breakSound: 'break_gem',
    isSpecial: false,
    isIndestructible: false
  },
  DIAMOND_ORE: {
    id: 'diamond_ore',
    name: 'Diamond Ore',
    maxHp: 95,
    scoreValue: 600,
    durabilityCost: 2,
    texture: 'block_diamond_ore',
    particleColor: 0x22d3ee,
    hitSound: 'hit_metal',
    breakSound: 'break_gem',
    isSpecial: false,
    isIndestructible: false
  },
  EMERALD_ORE: {
    id: 'emerald_ore',
    name: 'Emerald Ore',
    maxHp: 130,
    scoreValue: 1200,
    durabilityCost: 2,
    texture: 'block_emerald_ore',
    particleColor: 0x22c55e,
    hitSound: 'hit_metal',
    breakSound: 'break_gem',
    isSpecial: false,
    isIndestructible: false
  },

  // Special Blocks
  TNT: {
    id: 'tnt',
    name: 'TNT',
    maxHp: 10,
    scoreValue: 150,
    durabilityCost: 0,
    texture: 'block_tnt',
    particleColor: 0xef4444,
    hitSound: 'hit_tnt',
    breakSound: 'explode',
    isSpecial: true,
    specialEffect: 'explode',
    explosionRadius: 95, // 1.5-tile radius (1.5 * 60px = 90px + diagonal margin)
    explosionDamage: 180,
    isIndestructible: false
  },
  REPAIR: {
    id: 'repair',
    name: 'Repair Anvil',
    maxHp: 15,
    scoreValue: 75,
    durabilityCost: 0,
    texture: 'block_repair',
    particleColor: 0x10b981,
    hitSound: 'hit_repair',
    breakSound: 'repair_chime',
    isSpecial: true,
    specialEffect: 'repair',
    repairAmount: 40,
    isIndestructible: false
  },
  UPGRADE: {
    id: 'upgrade',
    name: 'Forge Upgrade',
    maxHp: 20,
    scoreValue: 300,
    durabilityCost: 0,
    texture: 'block_upgrade',
    particleColor: 0xf59e0b,
    hitSound: 'hit_metal',
    breakSound: 'upgrade_fanfare',
    isSpecial: true,
    specialEffect: 'upgrade',
    isIndestructible: false
  },
  BOUNCE: {
    id: 'bounce',
    name: 'Bounce Cushion',
    maxHp: 20,
    scoreValue: 50,
    durabilityCost: 0,
    texture: 'block_bounce',
    particleColor: 0xa855f7,
    hitSound: 'hit_bounce',
    breakSound: 'boing',
    isSpecial: true,
    specialEffect: 'bounce',
    restitutionMultiplier: 2.2,
    bounceImpulse: 14,
    isIndestructible: false
  },
  BEDROCK: {
    id: 'bedrock',
    name: 'Bedrock',
    maxHp: Infinity,
    scoreValue: 0,
    durabilityCost: 1,
    texture: 'block_bedrock',
    particleColor: 0x581c87,
    hitSound: 'hit_metal',
    breakSound: null,
    isSpecial: false,
    isIndestructible: true
  }
};

