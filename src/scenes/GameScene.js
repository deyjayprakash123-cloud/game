import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { TIER_ORDER, getTierData } from '../config/pickaxeTiers.js';
import { Pickaxe } from '../entities/Pickaxe.js';
import { MineGenerator } from '../managers/MineGenerator.js';
import { ParticleManager } from '../managers/ParticleManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { FloatingTextPool } from '../managers/FloatingTextPool.js';

/**
 * GameScene
 * Main physics simulation orchestrator, collision pipeline, camera tracking, and HUD.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.gameState = 'READY'; // READY, DROPPING, GAME_OVER
    this.selectedTier = 'wood';
    this.depthMeters = 0;
    this.score = 0;
    this.blocksBroken = 0;

    // Ensure Phaser texture smoothing is disabled globally & round pixels enabled
    this.cameras.main.setRoundPixels(true);
    this.textures.each((texture) => {
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    });

    // Subsystems & Performance Pools
    this.audioManager = new AudioManager();
    this.particleManager = new ParticleManager(this);
    this.mineGenerator = new MineGenerator(this);
    this.floatingTextPool = new FloatingTextPool(this, 30);

    // Clean up pools on shutdown to prevent leaks
    this.events.once('shutdown', () => {
      if (this.floatingTextPool) this.floatingTextPool.destroy();
      if (this.particleManager) this.particleManager.destroy();
    });

    // Parallax background tile
    this.bg = this.add.tileSprite(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT,
      'bg_mine'
    ).setScrollFactor(0);

    // Initialize Mine Shaft Grid
    this.mineGenerator.initShaft();

    // Spawn Pickaxe
    this.spawnPickaxe(this.selectedTier);

    // Setup Physics Collisions
    this.setupCollisions();

    // Setup Screen Overlay HUD & Start Screen
    this.createHUD();
    this.createStartOverlay();

    // Universal Mobile Safari / Chrome Web Audio unlock on very first interaction
    this.input.once('pointerdown', () => {
      this.audioManager.unlockAudio();
    });

    // Touch / Pointer input for Tap-to-Nudge
    this.input.on('pointerdown', (pointer) => {
      if (this.gameState === 'DROPPING') {
        this.pickaxe.nudge();
      }
    });
  }

  spawnPickaxe(tierId) {
    if (this.pickaxe) {
      this.pickaxe.destroy();
    }
    this.pickaxe = new Pickaxe(
      this,
      GAME_CONFIG.PHYSICS.PICKAXE_SPAWN_X,
      GAME_CONFIG.PHYSICS.PICKAXE_SPAWN_Y,
      tierId
    );
  }

  setupCollisions() {
    this.matter.world.on('collisionstart', (event) => {
      if (this.gameState !== 'DROPPING') return;

      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const { bodyA, bodyB } = pair;

        const isPickaxeA = bodyA.label === 'pickaxe' || (bodyA.parent && bodyA.parent.label === 'pickaxe');
        const isPickaxeB = bodyB.label === 'pickaxe' || (bodyB.parent && bodyB.parent.label === 'pickaxe');

        const isBlockA = bodyA.label === 'block' || (bodyA.parent && bodyA.parent.label === 'block');
        const isBlockB = bodyB.label === 'block' || (bodyB.parent && bodyB.parent.label === 'block');

        if (isPickaxeA && isBlockB) {
          const pickaxe = bodyA.gameObject || (bodyA.parent && bodyA.parent.gameObject);
          const block = bodyB.gameObject || (bodyB.parent && bodyB.parent.gameObject);
          const normal = pair.collision ? pair.collision.normal : null;
          this.processPickaxeBlockCollision(pickaxe, block, bodyA.parent || bodyA, bodyB, normal);
        } else if (isPickaxeB && isBlockA) {
          const pickaxe = bodyB.gameObject || (bodyB.parent && bodyB.parent.gameObject);
          const block = bodyA.gameObject || (bodyA.parent && bodyA.parent.gameObject);
          const normal = pair.collision ? { x: -pair.collision.normal.x, y: -pair.collision.normal.y } : null;
          this.processPickaxeBlockCollision(pickaxe, block, bodyB.parent || bodyB, bodyA, normal);
        }
      }
    });
  }

  processPickaxeBlockCollision(pickaxe, block, bodyPickaxe, bodyBlock, normal) {
    if (!pickaxe || !block || pickaxe.isDead || block.isDestroyed) return;

    // Compute relative impact velocity
    const vx = bodyPickaxe.velocity.x;
    const vy = bodyPickaxe.velocity.y;
    const impactSpeed = Math.hypot(vx, vy);

    pickaxe.onHitBlock(block, impactSpeed, normal);
    this.updateHudStats();

    // Trigger micro-shake (intensity 0.004, 80ms) on heavy hits or ore contacts
    if (block.blockType.id.includes('ore') || block.blockType.id === 'hard_stone' || block.blockType.id === 'red_volcanic') {
      this.triggerMicroShake(80, 0.004);
    }
  }

  /**
   * Screen Shake: Trigger a micro-shake (intensity 0.004, 80ms) on heavy hits or TNT detonations
   */
  triggerMicroShake(duration = 80, intensity = 0.004) {
    this.cameras.main.shake(duration, intensity);
  }

  update(time, delta) {
    if (this.gameState === 'DROPPING' && this.pickaxe && !this.pickaxe.isDead) {
      this.pickaxe.update(time, delta);

      // Smooth vertical camera tracking
      const targetScrollY = Math.max(0, this.pickaxe.y - GAME_CONFIG.RULES.CAMERA_OFFSET_Y);
      this.cameras.main.scrollY = Phaser.Math.Linear(
        this.cameras.main.scrollY,
        targetScrollY,
        GAME_CONFIG.RULES.CAMERA_LERP_Y
      );

      // Parallax scroll background
      this.bg.tilePositionY = this.cameras.main.scrollY * 0.25;

      // Extend mine shaft procedurally ahead of camera
      this.mineGenerator.updateGeneration(this.cameras.main.scrollY);

      // Update Depth meter
      const curDepth = Math.max(0, Math.floor((this.pickaxe.y - GAME_CONFIG.GRID.BLOCK_SIZE * 5) / 45));
      if (curDepth > this.depthMeters) {
        this.depthMeters = curDepth;
      }
      this.updateHudStats();
    }
  }

  /**
   * TNT Explosions: Radial particle shockwave that destroys adjacent blocks in a 1.5-tile radius
   */
  triggerTntExplosion(worldX, worldY, radius = 95, damage = 180) {
    // 1. Radial particle shockwave & audio
    this.particleManager.emitTntBlast(worldX, worldY, radius);
    this.audioManager.playSound('explode');
    this.triggerMicroShake(80, 0.004);

    // 2. Destroy adjacent blocks in 1.5-tile radius (95px covers orthogonal & diagonal neighbors)
    const affected = this.mineGenerator.getBlocksInRadius(worldX, worldY, radius);
    affected.forEach(b => {
      const result = b.takeDamage(damage);
      if (result.destroyed && this.pickaxe) {
        this.pickaxe.blocksMined++;
        this.pickaxe.totalScore += result.score;
      }
    });

    // 3. Knockback impulse on pickaxe
    if (this.pickaxe && !this.pickaxe.isDead) {
      const dx = this.pickaxe.x - worldX;
      const dy = this.pickaxe.y - worldY;
      const dist = Math.hypot(dx, dy) || 1;
      const forceMag = Math.max(8, 20 - dist * 0.08);
      this.pickaxe.setVelocity(
        this.pickaxe.body.velocity.x + (dx / dist) * forceMag,
        Math.min(-6, this.pickaxe.body.velocity.y + (dy / dist) * forceMag)
      );
      this.pickaxe.setAngularVelocity((Math.random() - 0.5) * 0.6);
    }

    this.updateHudStats();
  }

  /**
   * Spawns crisp pixel-font score popups (+100, +500) that float upward and fade out over 600ms
   */
  showFloatingText(x, y, text, color = '#ffffff', fontSize = 14, duration = 600) {
    if (this.floatingTextPool) {
      this.floatingTextPool.spawn(x, y, text, color, fontSize, duration);
    }
  }

  // -------------------------------------------------------------
  // HUD & UI (TikTok / Shorts Safe Zone: Y: 140px to Y: 300px)
  // Keeps score, depth, and durability bar completely safe from TikTok top nav & right buttons
  // -------------------------------------------------------------
  createHUD() {
    this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

    // Dark sleek panel card situated strictly inside [155, 255] (Y: 140-300 safe zone)
    const panel = this.add.graphics();
    panel.fillStyle(0x090b14, 0.90);
    panel.fillRoundedRect(40, 155, 460, 100, 12);
    panel.lineStyle(2, 0x1e293b, 1);
    panel.strokeRoundedRect(40, 155, 460, 100, 12);

    // Subtle horizontal divider line inside HUD card
    panel.lineStyle(1, 0x1e293b, 0.8);
    panel.lineBetween(55, 214, 485, 214);

    // 1. Score Widget (Top Left)
    const coin = this.add.image(68, 185, 'ui_coin').setDisplaySize(24, 24);
    const scoreLabel = this.add.text(88, 175, 'SCORE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#94a3b8'
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(88, 195, '0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0, 0.5);

    // 2. Depth Widget (Top Center)
    const depthLabel = this.add.text(GAME_CONFIG.WIDTH / 2, 175, 'DEPTH', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.depthText = this.add.text(GAME_CONFIG.WIDTH / 2, 195, '0m', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    // 3. Pickaxe Tier Badge (Top Right, safe within X: 440)
    const tierLabel = this.add.text(435, 175, 'TIER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.tierBadge = this.add.text(435, 195, 'WOOD', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5);

    // 4. Durability Bar (Bottom Row: Y: 218 to Y: 250)
    const heart = this.add.image(68, 234, 'ui_heart').setDisplaySize(18, 18);

    // Bar Track
    const barTrack = this.add.graphics();
    barTrack.fillStyle(0x1e293b, 1);
    barTrack.fillRoundedRect(88, 227, 275, 14, 4);
    barTrack.lineStyle(1, 0x334155, 1);
    barTrack.strokeRoundedRect(88, 227, 275, 14, 4);

    // Dynamic Bar Fill
    this.durabilityBarFill = this.add.graphics();

    // Durability text
    this.durabilityValueText = this.add.text(435, 234, '50 HP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    this.hudContainer.add([
      panel,
      coin, scoreLabel, this.scoreText,
      depthLabel, this.depthText,
      tierLabel, this.tierBadge,
      heart, barTrack, this.durabilityBarFill, this.durabilityValueText
    ]);

    // Hidden during READY overlay; made visible on drop launch
    this.hudContainer.setVisible(false);
    this.updateHudStats();
  }

  updateHudStats() {
    if (!this.pickaxe) return;

    if (this.scoreText) {
      this.scoreText.setText(`${this.pickaxe.totalScore}`);
    }

    if (this.depthText) {
      this.depthText.setText(`${this.depthMeters}m`);
    }

    if (this.tierBadge) {
      this.tierBadge.setText(this.pickaxe.tierData.name.replace(' Pickaxe', '').toUpperCase());
      this.tierBadge.setColor(this.pickaxe.tierData.colorHex || '#f59e0b');
    }

    if (this.durabilityBarFill) {
      const curHp = Math.max(0, this.pickaxe.durability);
      const maxHp = this.pickaxe.maxDurability || 50;
      const pct = Math.min(1, Math.max(0, curHp / maxHp));

      this.durabilityBarFill.clear();
      let fillColor = 0x22c55e;
      if (pct < 0.25) {
        fillColor = 0xef4444;
      } else if (pct < 0.55) {
        fillColor = 0xf59e0b;
      }

      this.durabilityBarFill.fillStyle(fillColor, 1);
      const fillW = Math.round(275 * pct);
      if (fillW > 0) {
        this.durabilityBarFill.fillRoundedRect(88, 227, fillW, 14, 3);
      }
    }

    if (this.durabilityValueText) {
      this.durabilityValueText.setText(`${this.pickaxe.durability}/${this.pickaxe.maxDurability}`);
    }
  }

  // -------------------------------------------------------------
  // START OVERLAY ("Tap to Drop" - Mobile Safari Audio Unlock)
  // -------------------------------------------------------------
  createStartOverlay() {
    this.startOverlay = this.add.container(0, 0).setScrollFactor(0);

    // Dark tint backdrop
    const shade = this.add.rectangle(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT,
      0x05040a,
      0.7
    );
    this.startOverlay.add(shade);

    // Animated Dwarven Selector Wheel Frame & Pickaxe Preview
    const wheel = this.add.image(GAME_CONFIG.WIDTH / 2, 155, 'selector_wheel_frame')
      .setDisplaySize(170, 170)
      .setAlpha(0.95);
    
    const previewIcon = this.add.image(GAME_CONFIG.WIDTH / 2, 155, getTierData(this.selectedTier).texture)
      .setDisplaySize(78, 78);

    this.tweens.add({
      targets: wheel,
      angle: 360,
      duration: 18000,
      repeat: -1,
      ease: 'Linear'
    });

    this.tweens.add({
      targets: previewIcon,
      y: 150,
      yoyo: true,
      repeat: -1,
      duration: 1400,
      ease: 'Sine.easeInOut'
    });

    // Title Banner
    const title = this.add.text(GAME_CONFIG.WIDTH / 2, 280, 'MINE DROP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#f59e0b',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const sub = this.add.text(GAME_CONFIG.WIDTH / 2, 330, 'PHYSICS PICKAXE FALL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Tier Selector Label
    const selectLabel = this.add.text(GAME_CONFIG.WIDTH / 2, 450, 'SELECT PICKAXE:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Tier Selector Buttons
    const tierButtons = [];
    const buttonWidth = 110;
    const startX = (GAME_CONFIG.WIDTH - (4 * buttonWidth + 3 * 10)) / 2 + buttonWidth / 2;

    TIER_ORDER.forEach((tId, idx) => {
      const data = getTierData(tId);
      const bx = startX + idx * (buttonWidth + 10);
      const by = 510;

      const btnBg = this.add.rectangle(bx, by, buttonWidth, 60, idx === 0 ? 0x2563eb : 0x1e293b)
        .setInteractive({ useHandCursor: true });
      btnBg.setStrokeStyle(2, idx === 0 ? 0x60a5fa : 0x475569);

      const btnLabel = this.add.text(bx, by - 8, data.name.split(' ')[0].toUpperCase(), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      const hpLabel = this.add.text(bx, by + 12, `${data.durability} HP`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#94a3b8'
      }).setOrigin(0.5);

      btnBg.on('pointerdown', (pointer) => {
        pointer.event.stopPropagation();
        this.selectedTier = tId;
        this.spawnPickaxe(tId);
        this.updateHudStats();
        previewIcon.setTexture(data.texture);

        // Update button highlights
        tierButtons.forEach((b, i) => {
          const isSelected = i === idx;
          b.bg.setFillStyle(isSelected ? 0x2563eb : 0x1e293b);
          b.bg.setStrokeStyle(2, isSelected ? 0x60a5fa : 0x475569);
        });
      });

      tierButtons.push({ bg: btnBg, label: btnLabel, hp: hpLabel });
      this.startOverlay.add([btnBg, btnLabel, hpLabel]);
    });

    // Big Pulse "TAP TO DROP" Button
    const dropBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, 650, 260, 68, 0x16a34a)
      .setInteractive({ useHandCursor: true });
    dropBtn.setStrokeStyle(3, 0x4ade80);

    const dropText = this.add.text(GAME_CONFIG.WIDTH / 2, 650, 'TAP TO DROP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: [dropBtn, dropText],
      scale: 1.05,
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: 'Sine.easeInOut'
    });

    dropBtn.on('pointerdown', () => {
      this.startRun();
    });

    shade.setInteractive();
    shade.on('pointerdown', () => {
      this.startRun();
    });

    this.startOverlay.add([wheel, previewIcon, title, sub, selectLabel, dropBtn, dropText]);
  }

  startRun() {
    if (this.gameState !== 'READY') return;

    // Safely unlock Web Audio for mobile browsers
    this.audioManager.unlockAudio();
    this.audioManager.playSound('swing');

    this.gameState = 'DROPPING';
    if (this.hudContainer) {
      this.hudContainer.setVisible(true);
      this.updateHudStats();
    }

    // Fade out start overlay
    this.tweens.add({
      targets: this.startOverlay,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.startOverlay.destroy();
        this.pickaxe.launch();
      }
    });
  }

  // -------------------------------------------------------------
  // GAME OVER MODAL (Score Summary & Retry)
  // -------------------------------------------------------------
  onGameOver(reasonTitle, reasonDetail) {
    if (this.gameState === 'GAME_OVER') return;
    this.gameState = 'GAME_OVER';

    this.time.delayedCall(700, () => {
      this.showGameOverModal(reasonTitle, reasonDetail);
    });
  }

  showGameOverModal(reasonTitle, reasonDetail) {
    if (this.hudContainer) {
      this.hudContainer.setVisible(false);
    }
    const modal = this.add.container(0, 0).setScrollFactor(0);

    const dark = this.add.rectangle(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT,
      0x000000,
      0.82
    );

    const panel = this.add.graphics();
    panel.fillStyle(0x0f172a, 1);
    panel.fillRoundedRect(40, 240, GAME_CONFIG.WIDTH - 80, 480, 16);
    panel.lineStyle(3, 0x334155, 1);
    panel.strokeRoundedRect(40, 240, GAME_CONFIG.WIDTH - 80, 480, 16);

    const skull = this.add.image(GAME_CONFIG.WIDTH / 2, 230, 'icon_danger_skull')
      .setDisplaySize(56, 56);

    const title = this.add.text(GAME_CONFIG.WIDTH / 2, 295, reasonTitle, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ef4444'
    }).setOrigin(0.5);

    const sub = this.add.text(GAME_CONFIG.WIDTH / 2, 330, reasonDetail, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Stats Grid
    const scoreVal = this.pickaxe ? this.pickaxe.totalScore : 0;
    const blocksVal = this.pickaxe ? this.pickaxe.blocksMined : 0;

    const stats = [
      { label: 'DEPTH REACHED', val: `${this.depthMeters} m`, col: '#38bdf8' },
      { label: 'BLOCKS MINED', val: `${blocksVal}`, col: '#f59e0b' },
      { label: 'FINAL SCORE', val: `${scoreVal}`, col: '#fef08a' }
    ];

    stats.forEach((st, idx) => {
      const sy = 390 + idx * 65;
      const l = this.add.text(80, sy, st.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#64748b'
      });
      const v = this.add.text(GAME_CONFIG.WIDTH - 80, sy, st.val, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: st.col
      }).setOrigin(1, 0);
      modal.add([l, v]);
    });

    // Retry Button
    const retryBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, 650, 240, 60, 0x2563eb)
      .setInteractive({ useHandCursor: true });
    retryBtn.setStrokeStyle(3, 0x60a5fa);

    const retryText = this.add.text(GAME_CONFIG.WIDTH / 2, 650, 'DROP AGAIN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    retryBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.restart();
      });
    });

    modal.add([dark, panel, skull, title, sub, retryBtn, retryText]);
  }
}

