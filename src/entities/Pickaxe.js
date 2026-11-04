import Phaser from 'phaser';
import { getTierData, getNextTier } from '../config/pickaxeTiers.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Pickaxe Entity
 * Refined Matter.js compound rigid body with realistic tomahawk rotation,
 * dynamic glancing deflections, momentum-to-spin transfer, and anti-stuck kick mechanics.
 */
export class Pickaxe extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y, tierId = 'wood') {
    const tierData = getTierData(tierId);

    // Initial placeholder sprite; body will be immediately replaced with compound body
    super(scene.matter.world, x, y, tierData.texture);

    this.scene = scene;
    this.tierData = tierData;
    this.maxDurability = tierData.durability;
    this.durability = tierData.durability;

    this.isDead = false;
    this.stuckTimer = 0;
    this.antiStuckAttempts = 0;
    this.blocksMined = 0;
    this.totalScore = 0;

    // Build realistic compound Matter.js body aligned with 128x128 sprite geometry
    this.buildCompoundBody(tierData);

    // Set sprite anchor / origin point to calculated center-of-mass
    this.setOrigin(tierData.originX ?? 0.515, tierData.originY ?? 0.455);

    // Visual scale
    this.setDisplaySize(tierData.size, tierData.size);

    // Floating durability health bar / number above pickaxe
    this.createFloatingStatus();

    scene.add.existing(this);
  }

  /**
   * Constructs a compound Matter body aligned with visible boundaries of the 128x128 pickaxe sprites.
   * Asymmetric mass centers torque naturally, creating satisfying pendulum/tomahawk tumbling.
   */
  buildCompoundBody(tierData) {
    const Bodies = Phaser.Physics.Matter.Matter.Bodies;
    const Body = Phaser.Physics.Matter.Matter.Body;
    const s = tierData.size;

    // Cache current transform and physics state if body already exists (e.g. during tier upgrade)
    const posX = this.body && this.body.position ? this.body.position.x : this.x;
    const posY = this.body && this.body.position ? this.body.position.y : this.y;
    const currentAngle = this.body && this.body.angle !== undefined ? this.body.angle : (this.angle ? Phaser.Math.DegToRad(this.angle) : 0);
    const currentVx = this.body && this.body.velocity ? this.body.velocity.x : 0;
    const currentVy = this.body && this.body.velocity ? this.body.velocity.y : 0;
    const currentSpin = this.body && this.body.angularVelocity ? this.body.angularVelocity : 0;

    // Center-of-mass offsets from 128x128 sprite coordinates
    const originX = (tierData.originX ?? 0.515) * 128;
    const originY = (tierData.originY ?? 0.455) * 128;
    const k = s / 128;

    // 1. Shaft Part: angled diagonal handle (wood density)
    // Shaft center in 128x128 sprite space is at (48, 76)
    const shaftX = (48 - originX) * k;
    const shaftY = (76 - originY) * k;
    const shaft = Bodies.rectangle(shaftX, shaftY, 11 * k, 68 * k, {
      angle: Math.PI / 4,
      chamfer: { radius: 3 },
      density: tierData.density * 0.5,
      friction: tierData.friction,
      restitution: tierData.restitution
    });

    // 2. Head Part: angled cross bar blade (heavy metal/stone density)
    // Head center in 128x128 sprite space is at (80, 44)
    const headX = (80 - originX) * k;
    const headY = (44 - originY) * k;
    const head = Bodies.rectangle(headX, headY, 74 * k, 16 * k, {
      angle: -Math.PI / 4,
      chamfer: { radius: 4 },
      density: tierData.density * 2.2, // Head is 4.4x denser than handle
      friction: tierData.friction,
      restitution: tierData.restitution
    });

    // 3. Blade tips (pointed contact nodes at visible tips of 128x128 sprite)
    // Upper-left tip in 128x128 sprite is at (44, 18)
    const tip1X = (44 - originX) * k;
    const tip1Y = (18 - originY) * k;
    const tip1 = Bodies.circle(tip1X, tip1Y, 4, {
      density: tierData.density * 1.5,
      restitution: tierData.restitution * 1.1
    });

    // Lower-right tip in 128x128 sprite is at (112, 74)
    const tip2X = (112 - originX) * k;
    const tip2Y = (74 - originY) * k;
    const tip2 = Bodies.circle(tip2X, tip2Y, 4, {
      density: tierData.density * 1.5,
      restitution: tierData.restitution * 1.1
    });

    // Combine into rigid compound body
    const compound = Body.create({
      parts: [shaft, head, tip1, tip2],
      label: 'pickaxe',
      restitution: tierData.restitution,
      friction: tierData.friction,
      frictionAir: tierData.frictionAir,
      frictionStatic: 0.04
    });

    this.setExistingBody(compound);
    this.body.gameObject = this;

    // Apply cached transform and velocities to newly attached compound body
    Body.setPosition(compound, { x: posX, y: posY });
    if (currentAngle !== 0) {
      Body.setAngle(compound, currentAngle);
    }
    if (currentVx !== 0 || currentVy !== 0) {
      Body.setVelocity(compound, { x: currentVx, y: currentVy });
    }
    if (currentSpin !== 0) {
      Body.setAngularVelocity(compound, currentSpin);
    }
  }

  /**
   * Initializes physics momentum with controlled randomness
   */
  launch() {
    const randVx = (Math.random() - 0.5) * 2 * GAME_CONFIG.PHYSICS.RANDOM_IMPULSE_X;
    // Guaranteed initial spin to eliminate rock-like straight downward fall
    const initialSpin = (Math.random() > 0.5 ? 1 : -1) * (0.10 + Math.random() * GAME_CONFIG.PHYSICS.RANDOM_ANGULAR_VEL);

    this.setVelocity(randVx, 2.8);
    this.setAngularVelocity(initialSpin);
  }

  createFloatingStatus() {
    this.statusContainer = this.scene.add.container(this.x, this.y - 44).setDepth(150);

    // Pill background
    this.statusPill = this.scene.add.graphics();
    this.statusPill.fillStyle(0x090b14, 0.88);
    this.statusPill.fillRoundedRect(-58, -13, 116, 26, 6);
    this.statusPill.lineStyle(1.5, 0x334155, 1);
    this.statusPill.strokeRoundedRect(-58, -13, 116, 26, 6);

    // Dynamic Floating Health Text: "❤️ [current]/[max]" (e.g., "❤️ 147/150")
    this.durabilityText = this.scene.add.text(0, 0, `❤️ ${this.durability}/${this.maxDurability}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.statusContainer.add([this.statusPill, this.durabilityText]);
  }

  update(time, delta) {
    if (this.isDead) return;

    // Smoothly track the pickaxe position every frame
    if (this.statusContainer) {
      this.statusContainer.setPosition(this.x, this.y - 44);
    }

    const body = this.body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = Math.hypot(vx, vy);

    // -------------------------------------------------------------
    // 1. CONTINUOUS NATURAL ROTATION IN FREE-FALL
    // -------------------------------------------------------------
    if (Math.abs(vy) > 1.5) {
      const currentSpin = body.angularVelocity;
      if (Math.abs(currentSpin) < 0.12) {
        const tumbleTorque = (Math.sign(currentSpin || 1)) * Math.min(0.006, Math.abs(vy) * 0.0005);
        this.setAngularVelocity(currentSpin + tumbleTorque);
      }
    }

    // Clamp maximum angular velocity
    const maxSpin = 0.32;
    if (Math.abs(body.angularVelocity) > maxSpin) {
      this.setAngularVelocity(Math.sign(body.angularVelocity) * maxSpin);
    }

    // Clamp maximum terminal velocity
    const maxVy = 18.0;
    if (vy > maxVy) {
      Phaser.Physics.Matter.Matter.Body.setVelocity(body, { x: vx, y: maxVy });
    }

    // -------------------------------------------------------------
    // 2. GRAVITY BOOST: If barely moving downward, give extra push
    // This prevents the pickaxe from floating / hovering between rows
    // -------------------------------------------------------------
    if (vy < 2.0 && vy >= 0) {
      Phaser.Physics.Matter.Matter.Body.applyForce(body, body.position, { x: 0, y: 0.025 });
    }

    // -------------------------------------------------------------
    // 3. ANTI-STUCK WATCHDOG
    // -------------------------------------------------------------
    if (speed < GAME_CONFIG.RULES.STUCK_SPEED_THRESHOLD) {
      this.stuckTimer += delta;
      if (this.stuckTimer >= GAME_CONFIG.RULES.STUCK_TIMEOUT_MS) {
        this.executeAntiStuckKick();
      }
    } else {
      this.stuckTimer = 0;
      this.antiStuckAttempts = 0;
    }
  }

  /**
   * Exact Hit & Penetration System
   *
   * Blocks are sensors — Matter does NOT resolve rigid contact, so the pickaxe
   * keeps moving through. We handle ALL velocity adjustment ourselves here.
   *
   * Key insight: we use Phaser.Physics.Matter.Matter.Body.setVelocity (the raw
   * Matter API) instead of this.setVelocity() so the override is applied to the
   * compound root body directly and is NOT overwritten by Matter's constraint
   * solver on this same step.
   */
  onHitBlock(block, impactSpeed, normal) {
    if (this.isDead || block.isDestroyed) return;

    this.stuckTimer = 0;
    const MatterBody = Phaser.Physics.Matter.Matter.Body;
    const body = this.body;

    // 1. Bedrock Deflection — these are SOLID (not sensors), so Matter already
    //    bounced us. Just ensure we have enough downward speed and add lateral kick.
    if (block.blockType.isIndestructible) {
      const dx = this.x - block.x;
      const sideSign = dx >= 0 ? 1 : -1;
      const curVy = body.velocity.y;
      MatterBody.setVelocity(body, {
        x: sideSign * 4.5,
        y: Math.max(curVy, 3.0)
      });
      this.scene.particleManager.emitSparks(this.x, this.y, 0x6b21a8, 6);
      this.scene.audioManager.playSound('clank');
      this.scene.showFloatingText(this.x, this.y - 12, 'DEFLECT', '#c084fc', 11);
      this.scene.triggerMicroShake(80, 0.004);
      return;
    }

    // 2. Special Bounce Block
    if (block.blockType.specialEffect === 'bounce') {
      const impulseY = block.blockType.bounceImpulse ? -block.blockType.bounceImpulse : -14.0;
      const impulseX = (Math.random() - 0.5) * 8;
      MatterBody.setVelocity(body, { x: impulseX, y: impulseY });
      this.setAngularVelocity((Math.random() - 0.5) * 0.4);
      this.scene.particleManager.emitBounceSparkles(block.x, block.y);
      this.scene.audioManager.playSound('boing');
      this.scene.showFloatingText(block.x, block.y - 20, 'BOING!!', '#d946ef', 16);
      block.breakBlock(false);
      this.blocksMined++;
      this.totalScore += block.blockType.scoreValue || 50;
      return;
    }

    // 3. Destroy block instantly on contact
    const res = block.breakBlock(true);
    if (!res.destroyed) return; // Already destroyed by another compound part this frame
    this.blocksMined++;
    this.totalScore += res.score;

    // 4. Durability decay
    const cost = block.blockType.durabilityCost ?? 1;
    this.reduceDurability(cost);

    // 5. Penetration velocity — apply AFTER block is gone so nothing solid remains
    //
    //    Strategy:
    //    - Keep ~90% of current downward speed (slight resistance per block)
    //    - Clamp to minimum plow speed so clusters never stall the pickaxe
    //    - Add slight horizontal deflection based on which side of block was hit
    //    - Preserve / add rotational spin

    const curVx = body.velocity.x;
    const curVy = body.velocity.y;

    // Resistance damping: 8-15% per block hit
    const damping = Phaser.Math.FloatBetween(0.86, 0.92);
    let newVy = Math.max(0, curVy) * damping;

    // Minimum plow speed — pickaxe never stalls through clusters
    const minDown = GAME_CONFIG.PHYSICS.MIN_PLOW_SPEED || 5.0;
    if (newVy < minDown) newVy = minDown;

    // Horizontal deflection based on contact side
    const dx = this.x - block.x;
    const sideSign = dx >= 0 ? 1 : -1;
    const kickX = sideSign * Phaser.Math.FloatBetween(0.4, 1.0) + Phaser.Math.FloatBetween(-0.5, 0.5);
    const newVx = curVx * 0.7 + Phaser.Math.Clamp(kickX, -1.5, 1.5);

    // Apply velocity directly on raw Matter body
    MatterBody.setVelocity(body, { x: newVx, y: newVy });

    // Spin from asymmetric impact
    const torqueKick = sideSign * Phaser.Math.FloatBetween(0.03, 0.07);
    this.setAngularVelocity(body.angularVelocity * 0.8 + torqueKick);

    // Signal the afterupdate hook to enforce plow speed if solver interferes
    this._needsPlowBoost = true;
  }

  /**
   * Anti-Stuck Mechanic
   * Triggered when velocity drops below 0.1 for > 1.5s.
   * Delivers an upward-angled kick and damages adjacent blocking tiles.
   */
  executeAntiStuckKick() {
    this.antiStuckAttempts++;

    // If immobilized for too many consecutive kick cycles without clearing, end the run
    if (this.antiStuckAttempts > GAME_CONFIG.RULES.MAX_ANTI_STUCK_ATTEMPTS) {
      this.onStuck();
      return;
    }

    // 1. Damage blocking tile(s) immediately below or around pickaxe
    const nearbyBlocks = this.scene.mineGenerator.getBlocksInRadius(this.x, this.y + 20, 52);
    if (nearbyBlocks.length > 0) {
      // Find lowest HP block to carve an escape route
      nearbyBlocks.sort((a, b) => a.hp - b.hp);
      const targetBlock = nearbyBlocks[0];
      const res = targetBlock.takeDamage(100);
      if (res && res.destroyed) {
        this.blocksMined++;
        this.totalScore += res.score;
      }
    }

    // 2. Upward-angled kick impulse with rotation
    const kickDirX = (Math.random() > 0.5 ? 1 : -1) * (3.0 + Math.random() * 2.5);
    const kickDirY = -5.5 - Math.random() * 2.0;

    this.setVelocity(kickDirX, kickDirY);
    this.setAngularVelocity((Math.random() - 0.5) * 0.38);

    // 3. Visual & Audio Feedback
    this.scene.particleManager.emitNudgeRings(this.x, this.y);
    this.scene.showFloatingText(this.x, this.y - 25, 'KICK!', '#38bdf8', 16);
    this.scene.audioManager.playSound('swing');

    this.stuckTimer = 0;
  }

  reduceDurability(amount) {
    if (this.isDead || amount <= 0) return;

    this.durability = Math.max(0, this.durability - amount);
    this.updateStatusText();

    // Pulse & Flash Red briefly whenever durability is deducted
    if (this.statusContainer && this.durabilityText) {
      this.durabilityText.setColor('#ef4444');

      if (this.statusPill) {
        this.statusPill.clear();
        this.statusPill.fillStyle(0x7f1d1d, 0.95); // Deep crimson flash
        this.statusPill.fillRoundedRect(-58, -13, 116, 26, 6);
        this.statusPill.lineStyle(1.5, 0xef4444, 1);
        this.statusPill.strokeRoundedRect(-58, -13, 116, 26, 6);
      }

      if (this.pulseTween) {
        this.pulseTween.stop();
      }
      this.statusContainer.setScale(1.0);
      this.pulseTween = this.scene.tweens.add({
        targets: this.statusContainer,
        scale: 1.25,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.pulseTween = null;
          if (this.statusPill && !this.isDead) {
            this.statusPill.clear();
            this.statusPill.fillStyle(0x090b14, 0.88);
            this.statusPill.fillRoundedRect(-58, -13, 116, 26, 6);
            this.statusPill.lineStyle(1.5, 0x334155, 1);
            this.statusPill.strokeRoundedRect(-58, -13, 116, 26, 6);
          }
          this.updateStatusText();
        }
      });
    }

    // Flash white on impact
    this.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!this.isDead) this.clearTint();
    });

    if (this.durability <= 0) {
      this.shatterAndDie();
    }
  }

  repair(amount) {
    this.durability = Math.min(this.maxDurability, this.durability + amount);
    this.updateStatusText();
    this.scene.audioManager.playSound('repair_chime');
  }

  /**
   * Upgrade Blocks:
   * Instantly increases max durability (e.g. 80 -> 160 -> 260 -> 400),
   * restores current durability to full, morphs pickaxe texture into next tier,
   * and triggers level-up particle flash.
   */
  upgradeTier() {
    const next = getNextTier(this.tierData.id);
    if (!next) {
      // Max Tier: full durability repair
      this.durability = this.maxDurability;
      this.updateStatusText();
      this.scene.particleManager.emitUpgradeBlast(this.x, this.y);
      this.scene.audioManager.playSound('upgrade_fanfare');
      return null;
    }

    this.tierData = next;
    this.setTexture(next.texture);
    this.setDisplaySize(next.size, next.size);
    this.setOrigin(next.originX ?? 0.515, next.originY ?? 0.455);

    // 1. Increase max durability & restore current durability to full
    this.maxDurability = next.durability;
    this.durability = next.durability;

    // 2. Rebuild compound body for new tier dimensions & densities while preserving position & momentum
    this.buildCompoundBody(next);

    // 3. Trigger level-up particle flash & fanfare
    this.scene.particleManager.emitUpgradeBlast(this.x, this.y);
    this.scene.audioManager.playSound('upgrade_fanfare');

    this.updateStatusText();
    return next;
  }

  updateStatusText() {
    if (this.durabilityText) {
      this.durabilityText.setText(`❤️ ${this.durability}/${this.maxDurability}`);
      const ratio = this.durability / this.maxDurability;
      if (ratio > 0.5) {
        this.durabilityText.setColor('#ffffff');
      } else if (ratio > 0.25) {
        this.durabilityText.setColor('#fbbf24');
      } else {
        this.durabilityText.setColor('#ef4444');
      }
    }

    if (this.scene && this.scene.updateHudStats) {
      this.scene.updateHudStats();
    }
  }

  /**
   * User manual screen tap to give an extra kinetic swing
   */
  nudge() {
    if (this.isDead) return;

    const impulseX = (Math.random() - 0.5) * GAME_CONFIG.RULES.TAP_NUDGE_IMPULSE_X;
    const impulseY = GAME_CONFIG.RULES.TAP_NUDGE_IMPULSE_Y;
    this.setVelocity(this.body.velocity.x * 0.5 + impulseX, impulseY);
    this.setAngularVelocity((Math.random() - 0.5) * 0.4);

    this.scene.particleManager.emitNudgeRings(this.x, this.y);
    this.scene.audioManager.playSound('swing');
    this.stuckTimer = 0;
  }

  shatterAndDie() {
    if (this.isDead) return;
    this.isDead = true;

    this.scene.particleManager.emitPickaxeShatter(this.x, this.y, this.tierData.particleColor);
    this.scene.audioManager.playSound('pickaxe_break');

    if (this.statusContainer) {
      this.statusContainer.destroy();
    }

    this.setVisible(false);
    this.scene.matter.world.remove(this.body);

    this.scene.onGameOver('PICKAXE BROKEN!', 'Durability depleted to 0.');
  }

  onStuck() {
    if (this.isDead) return;
    this.isDead = true;

    this.scene.audioManager.playSound('clank');
    if (this.statusContainer) {
      this.statusContainer.destroy();
    }

    this.scene.onGameOver('IMMOBILIZED!', 'Pickaxe became wedged in the mine shaft.');
  }

  destroy(fromScene) {
    if (this.statusContainer) {
      this.statusContainer.destroy();
    }
    super.destroy(fromScene);
  }
}
