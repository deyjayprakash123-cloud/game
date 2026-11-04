/**
 * Pickaxe Tiers Configuration
 * 4 Configurable Tiers with distinct physics, durability, damage, and appearance.
 * Physics tuning and scoring preserved; center-of-mass origins configured for 128x128 sprites.
 */
export const PICKAXE_TIERS = {
  WOOD: {
    id: 'wood',
    name: 'Wooden Pickaxe',
    durability: 80,
    collisionDamage: 15,
    size: 48,
    mass: 1.0,
    density: 0.002,
    restitution: 0.58,   // High springiness
    friction: 0.08,      // Low friction to avoid getting pinned
    frictionAir: 0.008,  // Clean free-fall tumbling
    texture: 'pickaxe_wood',
    color: 0xb07440,
    colorHex: '#b07440',
    particleColor: 0x9e602e,
    nextTier: 'stone',
    description: 'Light and springy. Lively deflections.',
    originX: 0.504,
    originY: 0.478
  },
  STONE: {
    id: 'stone',
    name: 'Stone Pickaxe',
    durability: 160,
    collisionDamage: 25,
    size: 52,
    mass: 1.35,
    density: 0.003,
    restitution: 0.52,
    friction: 0.09,
    frictionAir: 0.008,
    texture: 'pickaxe_stone',
    color: 0x9999a0,
    colorHex: '#9999a0',
    particleColor: 0x7a7a82,
    nextTier: 'iron',
    description: 'Chiseled slate. Solid rotational punch.',
    originX: 0.517,
    originY: 0.449
  },
  IRON: {
    id: 'iron',
    name: 'Iron Pickaxe',
    durability: 260,
    collisionDamage: 45,
    size: 56,
    mass: 1.8,
    density: 0.0042,
    restitution: 0.46,
    friction: 0.10,
    frictionAir: 0.007,
    texture: 'pickaxe_iron',
    color: 0xd9e3ed,
    colorHex: '#d9e3ed',
    particleColor: 0xb0c0d2,
    nextTier: 'diamond',
    description: 'Forged steel head. Destructive downward momentum.',
    originX: 0.517,
    originY: 0.449
  },
  DIAMOND: {
    id: 'diamond',
    name: 'Diamond Pickaxe',
    durability: 400,
    collisionDamage: 80,
    size: 60,
    mass: 2.3,
    density: 0.0055,
    restitution: 0.40,
    friction: 0.11,
    frictionAir: 0.007,
    texture: 'pickaxe_diamond',
    color: 0x22d3ee,
    colorHex: '#22d3ee',
    particleColor: 0x38bdf8,
    nextTier: null,
    description: 'Crystalline apex tool. Shivers through rock.',
    originX: 0.517,
    originY: 0.449
  }
};

export const TIER_ORDER = ['wood', 'stone', 'iron', 'diamond'];

export function getTierData(tierId) {
  const upper = (tierId || 'wood').toUpperCase();
  return PICKAXE_TIERS[upper] || PICKAXE_TIERS.WOOD;
}

export function getNextTier(tierId) {
  const current = getTierData(tierId);
  return current.nextTier ? PICKAXE_TIERS[current.nextTier.toUpperCase()] : null;
}
