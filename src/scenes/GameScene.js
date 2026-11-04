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

    // Betting, Cash & Turbo Controls (Exact layout from reference video)
    this.cashAmount = 40000.00;
    this.winAmount = 0.00;
    this.betSteps = [100, 250, 500, 1000, 2500, 5000, 10000];
    this.betIndex = 5; // Default 5,000.00
    this.betAmount = this.betSteps[this.betIndex];
    this.isTurbo = false;

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

    // World entrance selector wheel decoration (seated at top of shaft entrance)
    this.createEntranceWheel();

    // Spawn Pickaxe inside the wheel ready for drop
    this.spawnPickaxe(this.selectedTier);

    // Setup Physics Collisions
    this.setupCollisions();

    // Setup Top Header & Bottom Control Deck (Reference UI Layout)
    this.createTopHeader();
    this.createBottomControlDeck();

    // Universal Mobile Safari / Chrome Web Audio unlock on very first interaction
    this.input.once('pointerdown', () => {
      this.audioManager.unlockAudio();
    });

    // Touch / Pointer input for Tap-to-Nudge
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y >= 830) return; // Do not nudge when interacting with bottom control deck
      if (this.gameState === 'READY') {
        this.startRun();
      } else if (this.gameState === 'DROPPING') {
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
      175,
      tierId
    );

    // Hold in place inside the wheel during READY state without setting static
    if (this.gameState === 'READY' && this.pickaxe.body) {
      this.pickaxe.setIgnoreGravity(true);
      this.pickaxe.setVelocity(0, 0);
      this.pickaxe.setAngularVelocity(0);
    }
  }

  setupCollisions() {
    // Track which blocks were hit THIS physics frame to avoid compound-body multi-fire
    // (compound body has 4 sub-parts; each can fire collisionstart separately)
    this._hitBlocksThisFrame = new Set();

    // After every Matter step, clear the per-frame dedup set AND enforce minimum
    // downward plow velocity AFTER the solver has run (so our setVelocity actually sticks)
    this.matter.world.on('afterupdate', () => {
      this._hitBlocksThisFrame.clear();

      if (this.gameState !== 'DROPPING' || !this.pickaxe || this.pickaxe.isDead) return;

      const body = this.pickaxe.body;
      if (!body) return;

      const vy = body.velocity.y;
      const minPlow = GAME_CONFIG.PHYSICS.MIN_PLOW_SPEED;

      // If the pickaxe is falling too slow and we recently hit a block, give it a push
      if (this.pickaxe._needsPlowBoost && vy < minPlow) {
        Phaser.Physics.Matter.Matter.Body.setVelocity(body, {
          x: body.velocity.x,
          y: minPlow
        });
      }

      // Strictly cap maximum downward velocity to 9.0 to eliminate tunneling
      const maxVy = GAME_CONFIG.PHYSICS.MAX_TERMINAL_VELOCITY || 9.0;
      if (body.velocity.y > maxVy) {
        Phaser.Physics.Matter.Matter.Body.setVelocity(body, {
          x: body.velocity.x,
          y: maxVy
        });
      }

      // Reset boost flag each frame; onHitBlock sets it again if needed
      this.pickaxe._needsPlowBoost = false;
    });

    this.matter.world.on('collisionstart', (event) => {
      if (this.gameState !== 'DROPPING') return;

      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const { bodyA, bodyB } = pair;

        // Resolve compound sub-parts → their parent compound body → gameObject
        const rootA = bodyA.parent || bodyA;
        const rootB = bodyB.parent || bodyB;

        const isPickaxeA = rootA.label === 'pickaxe' || bodyA.label === 'pickaxe';
        const isPickaxeB = rootB.label === 'pickaxe' || bodyB.label === 'pickaxe';
        const isBlockA   = rootA.label === 'block' || bodyA.label === 'block';
        const isBlockB   = rootB.label === 'block' || bodyB.label === 'block';

        if (isPickaxeA && isBlockB) {
          const pickaxe = this.pickaxe;
          const block   = rootB.gameObject || bodyB.gameObject;
          if (!block || this._hitBlocksThisFrame.has(block)) continue;
          this._hitBlocksThisFrame.add(block);
          const normal = pair.collision ? pair.collision.normal : null;
          this.processPickaxeBlockCollision(pickaxe, block, rootA, rootB, normal);
        } else if (isPickaxeB && isBlockA) {
          const pickaxe = this.pickaxe;
          const block   = rootA.gameObject || bodyA.gameObject;
          if (!block || this._hitBlocksThisFrame.has(block)) continue;
          this._hitBlocksThisFrame.add(block);
          const normal = pair.collision ? { x: -pair.collision.normal.x, y: -pair.collision.normal.y } : null;
          this.processPickaxeBlockCollision(pickaxe, block, rootB, rootA, normal);
        }
      }
    });
  }

  processPickaxeBlockCollision(pickaxe, block, bodyPickaxe, bodyBlock, normal) {
    if (!pickaxe || !block || pickaxe.isDead || block.isDestroyed) return;

    const body = pickaxe.body || bodyPickaxe;
    const vx = body.velocity ? body.velocity.x : 0;
    const vy = body.velocity ? body.velocity.y : 0;
    const impactSpeed = Math.hypot(vx, vy);

    pickaxe.onHitBlock(block, impactSpeed, normal);
    this.updateHudStats();

    if (block.blockType && (block.blockType.id.includes('ore') || block.blockType.id === 'hard_stone' || block.blockType.id === 'red_volcanic')) {
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
    if (this.gameState === 'READY' && this.pickaxe) {
      this.pickaxe.setPosition(GAME_CONFIG.PHYSICS.PICKAXE_SPAWN_X, 175);
      this.pickaxe.setVelocity(0, 0);
      this.pickaxe.setAngularVelocity(0);
      return;
    }

    if (this.gameState === 'DROPPING' && this.pickaxe && !this.pickaxe.isDead) {
      this.pickaxe.update(time, delta);

      // Smooth vertical camera tracking
      const targetScrollY = Math.max(0, this.pickaxe.y - GAME_CONFIG.RULES.CAMERA_OFFSET_Y);
      this.cameras.main.scrollY = Phaser.Math.Linear(
        this.cameras.main.scrollY,
        targetScrollY,
        GAME_CONFIG.RULES.CAMERA_LERP_Y
      );

      // Parallax scroll background (pixel rounded to prevent sub-pixel shimmer/ghosting)
      this.bg.tilePositionY = Math.round(this.cameras.main.scrollY * 0.25);

      // Extend mine shaft procedurally ahead of camera
      this.mineGenerator.updateGeneration(this.cameras.main.scrollY);

      // Update Depth meter
      const curDepth = Math.max(0, Math.floor((this.pickaxe.y - GAME_CONFIG.GRID.BLOCK_SIZE * 5) / 45));
      if (curDepth > this.depthMeters) {
        this.depthMeters = curDepth;
      }
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
  // 1. TOP HEADER (Game Logo + Target/Collection Badge)
  // -------------------------------------------------------------
  createTopHeader() {
    this.topHeader = this.add.container(0, 0).setScrollFactor(0).setDepth(260);

    // Top-Left: Game logo ("FALLING PICKAXE") with a small glowing pixel icon
    const logoIcon = this.add.image(32, 40, 'ui_logo_icon').setDisplaySize(34, 34);

    const logoText1 = this.add.text(54, 31, 'FALLING', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    const logoText2 = this.add.text(54, 46, 'PICKAXE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f59e0b',
      stroke: '#000000',
      strokeThickness: 3
    });

    // Glowing pixel spark
    const spark = this.add.circle(48, 22, 2.5, 0xfef08a);
    this.tweens.add({
      targets: spark,
      alpha: 0.2,
      scale: 1.6,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Top-Right: Current target/collection badge (e.g., stone pickaxe icon + pumpkin or milestone multiplier)
    const moonCrescent = this.add.graphics();
    moonCrescent.fillStyle(0xfef3c7, 0.16);
    moonCrescent.fillCircle(455, 46, 26);

    const badgeCard = this.add.graphics();
    badgeCard.fillStyle(0x090d16, 0.92);
    badgeCard.fillRoundedRect(375, 16, 142, 46, 8);
    badgeCard.lineStyle(1.5, 0x475569, 1);
    badgeCard.strokeRoundedRect(375, 16, 142, 46, 8);

    // Inner divider
    badgeCard.lineStyle(1, 0x334155, 0.8);
    badgeCard.lineBetween(445, 20, 445, 58);

    // Stone pickaxe icon
    const pickaxeBadge = this.add.image(410, 39, 'pickaxe_stone').setDisplaySize(28, 28);

    // Pumpkin badge
    const pumpkinBadge = this.add.image(480, 39, 'icon_pumpkin').setDisplaySize(28, 28);

    // Badge label
    const targetLabel = this.add.text(445, 12, 'TARGET x2.5', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      fontStyle: 'bold',
      color: '#fde047',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.topHeader.add([
      logoIcon, logoText1, logoText2, spark,
      moonCrescent, badgeCard, pickaxeBadge, pumpkinBadge, targetLabel
    ]);
  }

  // -------------------------------------------------------------
  // 2. WORLD ENTRANCE SELECTOR WHEEL
  // -------------------------------------------------------------
  createEntranceWheel() {
    this.entranceWheelContainer = this.add.container(GAME_CONFIG.WIDTH / 2, 175).setDepth(20);

    // Mechanical selector wheel frame
    this.entranceWheel = this.add.image(0, 0, 'selector_wheel_frame')
      .setDisplaySize(160, 160)
      .setAlpha(0.95);

    // Pumpkin perched on top of the wheel
    const wheelPumpkin = this.add.image(0, -78, 'icon_pumpkin')
      .setDisplaySize(28, 28);

    // Left and right pointers
    const leftPointer = this.add.triangle(-52, 0, 0, -10, 0, 10, 14, 0, 0xf59e0b);
    const rightPointer = this.add.triangle(52, 0, 0, -10, 0, 10, -14, 0, 0xf59e0b);

    this.entranceWheelContainer.add([this.entranceWheel, wheelPumpkin, leftPointer, rightPointer]);

    // Idle slow ambient rotation
    this.tweens.add({
      targets: this.entranceWheel,
      angle: 360,
      duration: 16000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  // -------------------------------------------------------------
  // 3. BOTTOM CONTROL DECK (Fixed overlay, does not scroll with camera)
  // -------------------------------------------------------------
  createBottomControlDeck() {
    this.bottomDeck = this.add.container(0, 0).setScrollFactor(0).setDepth(260);

    // Dark semi-transparent backing along bottom 130px
    const deckBg = this.add.graphics();
    deckBg.fillStyle(0x060810, 0.94);
    deckBg.fillRect(0, 830, GAME_CONFIG.WIDTH, 130);

    // Top border styling
    deckBg.lineStyle(2, 0x1e293b, 1);
    deckBg.lineBetween(0, 830, GAME_CONFIG.WIDTH, 830);
    deckBg.lineStyle(1, 0x38bdf8, 0.35);
    deckBg.lineBetween(30, 830, GAME_CONFIG.WIDTH - 30, 830);

    // Center: Large circular spin/drop button with a rotating circular arrow icon
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = 872;

    this.spinBtnBg = this.add.circle(centerX, centerY, 34, 0x0f172a);
    this.spinBtnBg.setStrokeStyle(3, 0x38bdf8);
    this.spinBtnBg.setInteractive({ useHandCursor: true });

    this.spinArrowIcon = this.add.image(centerX, centerY, 'icon_spin_arrow')
      .setDisplaySize(38, 38)
      .setInteractive({ useHandCursor: true });

    // Idle slow rotation
    this.spinIdleTween = this.tweens.add({
      targets: this.spinArrowIcon,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });

    const triggerSpin = () => {
      this.onSpinButtonClicked();
    };

    this.spinBtnBg.on('pointerdown', triggerSpin);
    this.spinArrowIcon.on('pointerdown', triggerSpin);

    // Flanking Bet Adjusters (- / +)
    const minusBtn = this.add.circle(centerX - 75, centerY, 17, 0x1e293b)
      .setStrokeStyle(1.5, 0x475569)
      .setInteractive({ useHandCursor: true });
    const minusText = this.add.text(centerX - 75, centerY, '-', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    minusBtn.on('pointerdown', () => {
      this.betIndex = Math.max(0, this.betIndex - 1);
      this.betAmount = this.betSteps[this.betIndex];
      this.audioManager.playSound('hit_stone');
      this.updateBottomBarStats();
      this.tweens.add({ targets: minusBtn, scale: 0.88, yoyo: true, duration: 60 });
    });

    const plusBtn = this.add.circle(centerX + 75, centerY, 17, 0x1e293b)
      .setStrokeStyle(1.5, 0x475569)
      .setInteractive({ useHandCursor: true });
    const plusText = this.add.text(centerX + 75, centerY, '+', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    plusBtn.on('pointerdown', () => {
      this.betIndex = Math.min(this.betSteps.length - 1, this.betIndex + 1);
      this.betAmount = this.betSteps[this.betIndex];
      this.audioManager.playSound('hit_stone');
      this.updateBottomBarStats();
      this.tweens.add({ targets: plusBtn, scale: 0.88, yoyo: true, duration: 60 });
    });

    // Left of Center: Turbo / fast-fall toggle button (double downward arrows >>)
    // When enabled, multiply game physics speed by 1.5x
    const turboX = 115;
    this.turboBtnBg = this.add.circle(turboX, centerY, 22, 0x0f172a)
      .setStrokeStyle(2, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.turboIcon = this.add.image(turboX, centerY, 'icon_turbo')
      .setDisplaySize(24, 24);
    this.turboLabel = this.add.text(turboX, centerY - 28, 'TURBO', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.turboBtnBg.on('pointerdown', () => {
      this.isTurbo = !this.isTurbo;
      // Multiply game physics speed by 1.5x when enabled
      this.matter.world.engine.timing.timeScale = this.isTurbo ? 1.5 : 1.0;
      this.audioManager.playSound('hit_stone');

      if (this.isTurbo) {
        this.turboBtnBg.setFillStyle(0xb45309, 1);
        this.turboBtnBg.setStrokeStyle(2, 0xf59e0b);
        this.turboLabel.setColor('#f59e0b');
        this.turboIcon.setTint(0xfef08a);
        this.showFloatingToast('TURBO 1.5x ON', '#f59e0b');
      } else {
        this.turboBtnBg.setFillStyle(0x0f172a, 1);
        this.turboBtnBg.setStrokeStyle(2, 0x334155);
        this.turboLabel.setColor('#94a3b8');
        this.turboIcon.clearTint();
        this.showFloatingToast('TURBO OFF', '#94a3b8');
      }
    });

    // Settings icon on far left
    const settingsIcon = this.add.image(48, centerY, 'icon_settings')
      .setDisplaySize(22, 22)
      .setInteractive({ useHandCursor: true });

    // Right of Center: Sound toggle (speaker icon)
    const soundX = 425;
    this.soundBtnBg = this.add.circle(soundX, centerY, 22, 0x0f172a)
      .setStrokeStyle(2, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.soundIcon = this.add.image(soundX, centerY, 'icon_speaker')
      .setDisplaySize(22, 22);

    this.soundBtnBg.on('pointerdown', () => {
      const isMuted = this.audioManager.toggleMute();
      this.soundIcon.setTexture(isMuted ? 'icon_speaker_mute' : 'icon_speaker');
      this.soundBtnBg.setStrokeStyle(2, isMuted ? 0xef4444 : 0x334155);
      this.tweens.add({ targets: this.soundBtnBg, scale: 0.88, yoyo: true, duration: 60 });
    });

    // Auto-spin circular button on far right
    const autoSpinBtn = this.add.circle(490, centerY, 18, 0x0f172a)
      .setStrokeStyle(1.5, 0x334155)
      .setInteractive({ useHandCursor: true });
    const autoPlayIcon = this.add.text(490, centerY, '▶', {
      fontSize: '11px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    autoSpinBtn.on('pointerdown', () => {
      this.showFloatingToast('AUTO-SPIN READY', '#38bdf8');
    });

    // Bonus Buy Badge (Floating above control deck on right)
    const bonusBg = this.add.rectangle(465, 742, 94, 40, 0x090b14)
      .setStrokeStyle(2.5, 0xeab308)
      .setInteractive({ useHandCursor: true });
    const bonusText1 = this.add.text(465, 733, 'BONUS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    const bonusText2 = this.add.text(465, 749, 'BUY', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5);

    bonusBg.on('pointerdown', () => {
      this.onBonusBuyClicked();
    });

    // Bottom text bar: Display "CASH: [value]" and "WIN: [value]" with arcade monospaced numbers
    const barStripe = this.add.graphics();
    barStripe.fillStyle(0x020408, 0.94);
    barStripe.fillRect(0, 922, GAME_CONFIG.WIDTH, 38);
    barStripe.lineStyle(1, 0x1e293b, 0.8);
    barStripe.lineBetween(0, 922, GAME_CONFIG.WIDTH, 922);

    // Left: CASH
    const cashLabel = this.add.text(18, 930, 'CASH (DMO)', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#94a3b8'
    });
    this.cashText = this.add.text(18, 944, '40,000.00', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    // Center: WIN
    const winLabel = this.add.text(centerX, 930, 'WIN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#94a3b8'
    }).setOrigin(0.5, 0);
    this.winText = this.add.text(centerX, 944, '0.00', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#4ade80'
    }).setOrigin(0.5, 0);

    // Right: BET
    const betLabel = this.add.text(GAME_CONFIG.WIDTH - 18, 930, 'BET', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#94a3b8'
    }).setOrigin(1, 0);
    this.betText = this.add.text(GAME_CONFIG.WIDTH - 18, 944, '5,000.00', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(1, 0);

    this.bottomDeck.add([
      deckBg,
      this.spinBtnBg, this.spinArrowIcon,
      minusBtn, minusText, plusBtn, plusText,
      this.turboBtnBg, this.turboIcon, this.turboLabel,
      settingsIcon,
      this.soundBtnBg, this.soundIcon,
      autoSpinBtn, autoPlayIcon,
      bonusBg, bonusText1, bonusText2,
      barStripe,
      cashLabel, this.cashText,
      winLabel, this.winText,
      betLabel, this.betText
    ]);

    this.updateBottomBarStats();
  }

  onSpinButtonClicked() {
    this.audioManager.unlockAudio();
    this.audioManager.playSound('swing');

    // Button squash animation
    this.tweens.add({
      targets: [this.spinBtnBg, this.spinArrowIcon],
      scale: 0.90,
      yoyo: true,
      duration: 80,
      ease: 'Quad.easeInOut'
    });

    this.spinArrowIcon.angle += 180;

    if (this.gameState === 'READY') {
      this.startRun();
    } else if (this.gameState === 'DROPPING') {
      if (this.pickaxe && !this.pickaxe.isDead) {
        this.pickaxe.nudge();
      }
    } else if (this.gameState === 'GAME_OVER') {
      this.restartGame();
    }
  }

  onBonusBuyClicked() {
    this.audioManager.playSound('upgrade_fanfare');
    this.particleManager.emitUpgradeBlast(GAME_CONFIG.WIDTH / 2, 742);
    if (this.pickaxe && !this.pickaxe.isDead) {
      this.pickaxe.upgradeTier();
      this.showFloatingToast('BONUS UPGRADE!', '#facc15');
    }
  }

  showFloatingToast(text, color = '#ffffff') {
    const toast = this.add.text(GAME_CONFIG.WIDTH / 2, 800, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(280);

    this.tweens.add({
      targets: toast,
      y: 765,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        toast.destroy();
      }
    });
  }

  addWin(amount) {
    this.winAmount += amount;
    this.cashAmount += amount;
    this.updateBottomBarStats(true);
  }

  updateBottomBarStats(pulseWin = false) {
    if (this.cashText) {
      const cashStr = this.cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (this.cashText.text !== cashStr) {
        this.cashText.setText(cashStr);
      }
    }
    if (this.winText) {
      const winStr = this.winAmount.toFixed(2);
      if (this.winText.text !== winStr) {
        this.winText.setText(winStr);
      }
      if (pulseWin) {
        this.winText.setScale(1.25);
        this.winText.setColor('#86efac');
        this.tweens.add({
          targets: this.winText,
          scale: 1.0,
          duration: 180,
          ease: 'Quad.easeOut',
          onComplete: () => {
            if (this.winText) this.winText.setColor('#4ade80');
          }
        });
      }
    }
    if (this.betText) {
      const betStr = this.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (this.betText.text !== betStr) {
        this.betText.setText(betStr);
      }
    }
  }

  updateHudStats() {
    this.updateBottomBarStats();
  }

  startRun() {
    if (this.gameState !== 'READY') return;

    this.audioManager.unlockAudio();
    this.audioManager.playSound('swing');

    this.gameState = 'DROPPING';

    // Reset round win amount
    this.winAmount = 0.00;
    this.cashAmount = Math.max(0, this.cashAmount - this.betAmount);
    this.updateBottomBarStats();

    // Release pickaxe gravity and launch downwards
    if (this.pickaxe && this.pickaxe.body) {
      this.pickaxe.setIgnoreGravity(false);
      this.pickaxe.launch();
    }

    // Spin entrance wheel vigorously
    if (this.entranceWheel) {
      this.tweens.add({
        targets: this.entranceWheel,
        angle: this.entranceWheel.angle + 720,
        duration: 450,
        ease: 'Cubic.easeOut'
      });
    }

    if (this.spinBtnBg) {
      this.spinBtnBg.setStrokeStyle(3, 0x22c55e);
    }
  }

  restartGame() {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart();
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
      { label: 'ROUND WIN', val: `$${this.winAmount.toFixed(2)}`, col: '#4ade80' }
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
      this.restartGame();
    });

    modal.add([dark, panel, skull, title, sub, retryBtn, retryText]);
  }
}

