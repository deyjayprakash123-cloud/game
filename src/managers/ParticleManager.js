import Phaser from 'phaser';

/**
 * ParticleManager
 * High-performance pooled particle system for impact juice, debris bursts,
 * ore glints, and radial TNT shockwaves. Eliminates runtime emitter allocations
 * and garbage collection pauses on mobile browsers.
 */
export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.initEmitters();
    this.initShockwavePool();
  }

  /**
   * Pre-allocates permanent reusable particle emitters
   */
  initEmitters() {
    // 1. Debris Emitter (for 4 tiny debris squares on block destruction)
    this.debrisEmitter = this.scene.add.particles(0, 0, 'particle_debris', {
      speed: { min: 45, max: 140 },
      angle: { min: 0, max: 360 },
      gravityY: 360,
      scale: { start: 0.5, end: 0.15 },
      lifespan: { min: 200, max: 350 },
      emitting: false
    }).setDepth(50);

    // 2. Ore Sparkle Emitter (glistening star glints for gold/diamond/emerald hits)
    this.oreSparkleEmitter = this.scene.add.particles(0, 0, 'particle_ore_sparkle', {
      speed: { min: 35, max: 120 },
      angle: { min: 0, max: 360 },
      rotate: { start: 0, end: 180 },
      scale: { start: 1.15, end: 0 },
      lifespan: { min: 350, max: 550 },
      emitting: false
    }).setDepth(55);

    // 3. Spark Emitter (for metal impacts, bedrock deflection, upgrade flares)
    this.sparkEmitter = this.scene.add.particles(0, 0, 'particle_spark', {
      speed: { min: 80, max: 240 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.0, end: 0 },
      lifespan: { min: 180, max: 300 },
      emitting: false
    }).setDepth(52);

    // 4. Smoke Emitter (for TNT blast cloud)
    this.smokeEmitter = this.scene.add.particles(0, 0, 'particle_smoke', {
      speed: { min: 90, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      lifespan: { min: 320, max: 480 },
      emitting: false
    }).setDepth(48);
  }

  /**
   * Pre-allocates reusable shockwave graphics rings
   */
  initShockwavePool() {
    this.shockwavePool = [];
    const poolSize = 8;
    for (let i = 0; i < poolSize; i++) {
      const ring = this.scene.add.circle(0, 0, 8)
        .setStrokeStyle(4, 0xfde047, 1)
        .setActive(false)
        .setVisible(false)
        .setDepth(60);
      this.shockwavePool.push({ ring, tween: null });
    }
  }

  /**
   * Block Hits: Emit 4–6 small debris pixel particles colored to match block type
   */
  emitBlockHit(x, y, color = 0x888890) {
    const count = Phaser.Math.Between(4, 6);
    this.debrisEmitter.setParticleTint(color);
    this.debrisEmitter.explode(count, x, y);
  }

  /**
   * Ore Hits: Emit small glistening gold/diamond sparkle particles
   */
  emitOreSparkles(x, y, color = 0xfde047, count = 8) {
    this.oreSparkleEmitter.setParticleTint(color);
    this.oreSparkleEmitter.explode(count, x, y);
  }

  /**
   * Block Break: Emit 4 tiny debris squares matching block color upon destruction
   */
  emitBlockBreak(x, y, color, isOre = false) {
    this.debrisEmitter.setParticleTint(color);
    this.debrisEmitter.explode(4, x, y);

    if (isOre) {
      this.emitOreSparkles(x, y, color, 6);
    }
  }

  /**
   * Sparks for bedrock deflection, metal clanks, or friction
   */
  emitSparks(x, y, color = 0xffffff, count = 8) {
    this.sparkEmitter.setParticleTint(color);
    this.sparkEmitter.explode(count, x, y);
  }

  /**
   * Legacy alias for hit sparks
   */
  emitHitSparks(x, y, color = 0xfde047) {
    this.emitBlockHit(x, y, color);
    this.sparkEmitter.setParticleTint(color);
    this.sparkEmitter.explode(3, x, y);
  }

  /**
   * TNT Explosions: Radial particle shockwave that destroys adjacent blocks in a 1.5-tile radius
   */
  emitTntBlast(x, y, radius = 95) {
    // 1. Radial Particle Cloud
    this.smokeEmitter.explode(18, x, y);
    this.sparkEmitter.setParticleTint(0xfde047);
    this.sparkEmitter.explode(22, x, y);
    this.debrisEmitter.setParticleTint(0xef4444);
    this.debrisEmitter.explode(14, x, y);

    // 2. Expanding radial shockwave ring from object pool
    let entry = this.shockwavePool.find(item => !item.ring.active);
    if (!entry) entry = this.shockwavePool[0];
    if (entry.tween) entry.tween.stop();

    const ring = entry.ring;
    ring.setPosition(x, y);
    ring.setRadius(10);
    ring.setStrokeStyle(4, 0xfde047, 1);
    ring.setAlpha(1);
    ring.setActive(true);
    ring.setVisible(true);

    entry.tween = this.scene.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ring.setActive(false);
        ring.setVisible(false);
        entry.tween = null;
      }
    });
  }

  /**
   * Shatter burst when pickaxe runs out of durability
   */
  emitPickaxeShatter(x, y, color) {
    this.debrisEmitter.setParticleTint(color);
    this.debrisEmitter.explode(24, x, y);
    this.sparkEmitter.setParticleTint(0xffffff);
    this.sparkEmitter.explode(16, x, y);
  }

  /**
   * Healing sparkles when Repair Anvil is broken
   */
  emitHealSparkles(x, y) {
    this.sparkEmitter.setParticleTint(0x10b981);
    this.sparkEmitter.explode(16, x, y);
    this.oreSparkleEmitter.setParticleTint(0x34d399);
    this.oreSparkleEmitter.explode(8, x, y);
  }

  /**
   * Upgrade blast when Forge Upgrade block is broken
   */
  emitUpgradeBlast(x, y) {
    this.sparkEmitter.setParticleTint(0xf59e0b);
    this.sparkEmitter.explode(25, x, y);
    this.oreSparkleEmitter.setParticleTint(0xfef08a);
    this.oreSparkleEmitter.explode(14, x, y);
  }

  /**
   * Bounce sparkles when hitting a bounce block
   */
  emitBounceSparkles(x, y) {
    this.sparkEmitter.setParticleTint(0xa855f7);
    this.sparkEmitter.explode(12, x, y);
    this.oreSparkleEmitter.setParticleTint(0xe879f9);
    this.oreSparkleEmitter.explode(6, x, y);
  }

  /**
   * Expanding pulse ring when user taps screen to nudge
   */
  emitNudgeRings(x, y) {
    let entry = this.shockwavePool.find(item => !item.ring.active);
    if (!entry) entry = this.shockwavePool[0];
    if (entry.tween) entry.tween.stop();

    const ring = entry.ring;
    ring.setPosition(x, y);
    ring.setRadius(8);
    ring.setStrokeStyle(3, 0x38bdf8, 1);
    ring.setAlpha(1);
    ring.setActive(true);
    ring.setVisible(true);

    entry.tween = this.scene.tweens.add({
      targets: ring,
      radius: 45,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ring.setActive(false);
        ring.setVisible(false);
        entry.tween = null;
      }
    });
  }

  destroy() {
    if (this.debrisEmitter) this.debrisEmitter.destroy();
    if (this.oreSparkleEmitter) this.oreSparkleEmitter.destroy();
    if (this.sparkEmitter) this.sparkEmitter.destroy();
    if (this.smokeEmitter) this.smokeEmitter.destroy();
    this.shockwavePool.forEach(item => {
      if (item.tween) item.tween.stop();
      item.ring.destroy();
    });
    this.shockwavePool = [];
  }
}
