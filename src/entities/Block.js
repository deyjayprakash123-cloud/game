import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Block Entity
 * Static Matter.js body representing natural blocks, ores, bedrock, and special blocks.
 */
export class Block extends Phaser.Physics.Matter.Image {
  constructor(scene, x, y, blockType, gridX, gridY) {
    super(scene.matter.world, x, y, blockType.texture, null, {
      isStatic: true,
      label: 'block',
      friction: 0.3,
      restitution: blockType.specialEffect === 'bounce' ? 1.8 : 0.2
    });

    this.scene = scene;
    this.blockType = blockType;
    this.gridX = gridX;
    this.gridY = gridY;
    this.maxHp = blockType.maxHp;
    this.hp = blockType.maxHp;
    this.isDestroyed = false;

    // Attach reference on Matter body for collision callback lookups
    this.body.gameObject = this;

    // Visual crack overlay graphic (lazy added on damage)
    this.crackGraphic = null;

    // Render 64x64 block tiles scaled to fit 60px grid slots without distortion or physics overlap
    const targetSize = GAME_CONFIG.GRID.BLOCK_SIZE;
    this.setDisplaySize(targetSize, targetSize);
    if (this.width > 0 && this.height > 0 && (this.width !== targetSize || this.height !== targetSize)) {
      Phaser.Physics.Matter.Matter.Body.scale(this.body, targetSize / this.width, targetSize / this.height);
    }

    scene.add.existing(this);
  }

  /**
   * Inflict damage on this block from a pickaxe impact
   */
  takeDamage(damageAmount) {
    if (this.isDestroyed) return { destroyed: false, score: 0 };

    if (this.blockType.isIndestructible) {
      // Bedrock / Border deflection
      this.scene.particleManager.emitSparks(this.x, this.y, 0x6b21a8, 6);
      this.scene.audioManager.playSound('clank');
      this.scene.showFloatingText(this.x, this.y - 12, 'DEFLECT', '#c084fc', 11);
      this.scene.triggerMicroShake(80, 0.004);
      return { destroyed: false, score: 0 };
    }

    this.hp -= damageAmount;

    // Block Hits: Emit 4–6 small debris pixel particles colored to match the block type
    this.scene.particleManager.emitBlockHit(this.x, this.y, this.blockType.particleColor);

    // Ore Hits: Emit small glistening gold/diamond sparkle particles
    const isOre = this.blockType.id.includes('ore');
    if (isOre) {
      this.scene.particleManager.emitOreSparkles(this.x, this.y, this.blockType.particleColor, 6);
    }

    this.scene.audioManager.playSound(this.blockType.hitSound || 'hit_stone');

    // Visual crack progression
    this.updateDamageVisual();

    if (this.hp <= 0) {
      return this.breakBlock(true);
    } else {
      // Floating damage number
      this.scene.showFloatingText(this.x, this.y - 15, `-${Math.round(damageAmount)}`, '#fde047', 12);
      return { destroyed: false, score: 0 };
    }
  }

  /**
   * Destroys this block, triggers particles, audio, score, and special effects.
   */
  breakBlock(triggerSpecial = true) {
    if (this.isDestroyed) return { destroyed: false, score: 0 };
    this.isDestroyed = true;

    const score = this.blockType.scoreValue || 0;
    const isOre = this.blockType.id.includes('ore');

    // Visual Debris burst (and ore sparkles if ore)
    this.scene.particleManager.emitBlockBreak(this.x, this.y, this.blockType.particleColor, isOre);

    // Micro-shake on destruction or ore break
    if (isOre || this.blockType.maxHp >= 40) {
      this.scene.triggerMicroShake(80, 0.004);
    }

    // Audio
    if (this.blockType.breakSound) {
      this.scene.audioManager.playSound(this.blockType.breakSound);
    }

    // Floating Score text
    // Spawn crisp pixel-font score popups (+100, +500) that float upward and fade out over 600ms on ore destruction
    if (score > 0) {
      let textColor = '#ffffff';
      if (this.blockType.id === 'gold_ore') textColor = '#fde047';
      else if (this.blockType.id === 'diamond_ore') textColor = '#38bdf8';
      else if (this.blockType.id === 'emerald_ore') textColor = '#4ade80';
      else if (this.blockType.id === 'copper_ore') textColor = '#fb923c';
      else if (isOre) textColor = '#38bdf8';

      this.scene.showFloatingText(this.x, this.y - 6, `+${score}`, textColor, isOre ? 16 : 13, 600);
    }

    // Execute Special Block Behavior
    if (triggerSpecial && this.blockType.isSpecial) {
      this.triggerSpecialEffect();
    }

    // Clean up crack overlay
    if (this.crackGraphic) {
      this.crackGraphic.destroy();
    }

    // Inform generator to remove from spatial grid
    this.scene.mineGenerator.removeBlock(this.gridX, this.gridY);

    // Remove physics body and sprite
    if (this.body) {
      this.scene.matter.world.remove(this.body);
    }
    this.destroy();

    return { destroyed: true, score };
  }

  /**
   * Handle TNT, Repair, Upgrade, and Bounce logic
   */
  triggerSpecialEffect() {
    switch (this.blockType.specialEffect) {
      case 'explode':
        this.scene.triggerTntExplosion(this.x, this.y, this.blockType.explosionRadius, this.blockType.explosionDamage);
        break;
      case 'repair':
        this.scene.pickaxe.repair(this.blockType.repairAmount);
        this.scene.showFloatingText(this.x, this.y - 30, `+${this.blockType.repairAmount} DURABILITY!`, '#10b981', 20);
        this.scene.particleManager.emitHealSparkles(this.x, this.y);
        break;
      case 'upgrade':
        const nextTier = this.scene.pickaxe.upgradeTier();
        if (nextTier) {
          this.scene.showFloatingText(this.x, this.y - 35, `UPGRADE: ${nextTier.name.toUpperCase()}!`, '#f59e0b', 22);
          this.scene.particleManager.emitUpgradeBlast(this.x, this.y);
        } else {
          this.scene.pickaxe.repair(100);
          this.scene.showFloatingText(this.x, this.y - 30, `MAX TIER REPAIRED!`, '#f59e0b', 20);
        }
        break;
      case 'bounce':
        // Super kinetic launch handled on impact
        this.scene.showFloatingText(this.x, this.y - 20, 'BOING!!', '#d946ef', 18);
        break;
    }
  }

  updateDamageVisual() {
    const damagePercent = 1 - Math.max(0, this.hp) / this.maxHp;
    if (damagePercent <= 0.1) return;

    if (!this.crackGraphic) {
      this.crackGraphic = this.scene.add.graphics();
    }
    this.crackGraphic.clear();
    this.crackGraphic.lineStyle(2, 0x0f172a, 0.7);

    const half = 24;
    // Procedural crack lines
    this.crackGraphic.beginPath();
    this.crackGraphic.moveTo(this.x - half + 6, this.y - half + 6);
    this.crackGraphic.lineTo(this.x, this.y);
    if (damagePercent > 0.4) {
      this.crackGraphic.lineTo(this.x + half - 8, this.y + 4);
    }
    if (damagePercent > 0.7) {
      this.crackGraphic.moveTo(this.x, this.y);
      this.crackGraphic.lineTo(this.x - 4, this.y + half - 6);
    }
    this.crackGraphic.stroke();
  }

  destroy(fromScene) {
    if (this.crackGraphic) {
      this.crackGraphic.destroy();
    }
    super.destroy(fromScene);
  }
}

