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
    this.statusContainer = this.scene.add.container(this.x, this.y - 45);

    // Mini background pill
    const pill = this.scene.add.graphics();
    pill.fillStyle(0x0f172a, 0.75);
    pill.fillRoundedRect(-38, -12, 76, 24, 6);
    pill.lineStyle(1.5, 0x334155, 1);
    pill.strokeRoundedRect(-38, -12, 76, 24, 6);

    // Heart icon
    const heart = this.scene.add.image(-24, 0, 'ui_heart').setDisplaySize(16, 16);

    // Durability text
    this.durabilityText = this.scene.add.text(4, 0, `${this.durability}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.statusContainer.add([pill, heart, this.durabilityText]);
  }

  update(time, delta) {
    if (this.isDead) return;

    // Keep floating durability tracker smoothly aligned above pickaxe
    if (this.statusContainer) {
      this.statusContainer.setPosition(this.x, this.y - 40);
    }

    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    const speed = Math.hypot(vx, vy);

    // -------------------------------------------------------------
    // 1. CONTINUOUS NATURAL ROTATION IN FREE-FALL
    // -------------------------------------------------------------
    // Aerodynamic tumbling: downward speed acts on asymmetric head to produce spin
    if (Math.abs(vy) > 1.5) {
      const currentSpin = this.body.angularVelocity;
      // If spinning slowly, apply natural aerodynamic rotational torque
      if (Math.abs(currentSpin) < 0.12) {
        const tumbleTorque = (Math.sign(currentSpin || 1)) * Math.min(0.006, Math.abs(vy) * 0.0005);
        this.setAngularVelocity(currentSpin + tumbleTorque);
      }
    }

    // Clamp maximum angular velocity to keep motion readable and visually satisfying
    const maxSpin = 0.32;
    if (Math.abs(this.body.angularVelocity) > maxSpin) {
      this.setAngularVelocity(Math.sign(this.body.angularVelocity) * maxSpin);
    }

    // Clamp maximum terminal velocity to prevent collision clipping
    const maxVy = 16.0;
    if (vy > maxVy) {
      this.setVelocityY(maxVy);
    }

    // -------------------------------------------------------------
    // 2. ANTI-STUCK MECHANIC
    // -------------------------------------------------------------
    // If linear velocity drops below threshold for > 1.5 seconds, kick free
    if (speed < GAME_CONFIG.RULES.STUCK_SPEED_THRESHOLD) {
      this.stuckTimer += delta;
      if (this.stuckTimer >= GAME_CONFIG.RULES.STUCK_TIMEOUT_MS) {
        this.executeAntiStuckKick();
      }
    } else {
      this.stuckTimer = 0;
      this.antiStuckAttempts = 0; // Reset consecutive stuck counter on healthy movement
    }
  }

  /**
   * Refined Collision Impact with Linear <-> Angular momentum transfer,
   * Glancing deflections, and randomized micro-impulses (±5-10%).
   */
  onHitBlock(block, impactSpeed, normal) {
    if (this.isDead || block.isDestroyed) return;

    // Reset stuck timer on solid impact
    this.stuckTimer = 0;

    // Calculate damage based on pickaxe tier and impact speed
    const baseDamage = this.tierData.collisionDamage;
    const speedMultiplier = Math.min(2.2, Math.max(0.85, impactSpeed / 4.8));
    const damageDealt = baseDamage * speedMultiplier;

    // Apply block damage
    const result = block.takeDamage(damageDealt);
    if (result.destroyed) {
      this.blocksMined++;
      this.totalScore += result.score;
    }

    // Deduct pickaxe durability
    const cost = block.blockType.durabilityCost ?? 1;
    this.reduceDurability(cost);

    // -------------------------------------------------------------
    // MOMENTUM TRANSFER & GLANCING DEFLECTION DYNAMICS
    // -------------------------------------------------------------
    const currentVx = this.body.velocity.x;
    const currentVy = this.body.velocity.y;
    const currentSpin = this.body.angularVelocity;

    // Determine impact vector (from block center to pickaxe center)
    const dx = this.x - block.x;
    const dy = this.y - block.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = normal ? normal.x : (dx / dist);
    const ny = normal ? normal.y : (dy / dist);

    // A. Transfer Linear Downward Velocity into Angular Spin
    // Collisions on the right side spin counter-clockwise, left side spin clockwise
    const spinDirection = nx >= 0 ? 1 : -1;
    const linearToSpinTransfer = spinDirection * (Math.abs(currentVy) * 0.016 + 0.04);

    // B. Transfer Existing Spin into Tangential Horizontal Kick (Grip & Launch)
    const spinToLinearKick = -currentSpin * 14.0;

    // C. Glancing Deflection (Kick sideways rather than killing momentum)
    let lateralDeflection = 0;
    if (Math.abs(currentVx) < 1.8) {
      const deflectDir = Math.abs(nx) > 0.15 ? Math.sign(nx) : (Math.random() > 0.5 ? 1 : -1);
      const deflectMag = Math.min(5.2, Math.max(2.4, Math.abs(currentVy) * 0.42));
      lateralDeflection = deflectDir * deflectMag;
    }

    // D. Randomized Micro-Impulses (±5-10% torque and horizontal force)
    const torqueJitter = (Math.random() - 0.5) * 0.09;
    const forceJitterX = (Math.random() - 0.5) * 1.3;

    // Apply synthesized post-collision velocities
    const newVx = currentVx * 0.65 + spinToLinearKick * 0.25 + lateralDeflection + forceJitterX;
    const newVy = Math.min(-1.8, currentVy * -0.32); // Controlled upward rebound
    const newSpin = currentSpin * 0.6 + linearToSpinTransfer + torqueJitter;

    this.setVelocity(newVx, newVy);
    this.setAngularVelocity(newSpin);

    // Special Bounce Block Super-Trampoline
    if (block.blockType.specialEffect === 'bounce') {
      const impulseY = -block.blockType.bounceImpulse;
      const impulseX = (Math.random() - 0.5) * 11;
      this.setVelocity(impulseX, impulseY);
      this.setAngularVelocity((Math.random() - 0.5) * 0.4);
      this.scene.particleManager.emitBounceSparkles(this.x, this.y);
    }
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
      const damage = this.tierData.collisionDamage * 1.6;
      const res = targetBlock.takeDamage(damage);
      if (res.destroyed) {
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

  upgradeTier() {
    const next = getNextTier(this.tierData.id);
    if (!next) return null;

    this.tierData = next;
    this.setTexture(next.texture);
    this.setDisplaySize(next.size, next.size);
    this.setOrigin(next.originX ?? 0.515, next.originY ?? 0.455);
    this.maxDurability = next.durability;
    this.durability = next.durability;

    // Rebuild compound body for new tier dimensions & densities
    this.buildCompoundBody(next);

    this.updateStatusText();
    this.scene.audioManager.playSound('upgrade_fanfare');
    return next;
  }

  updateStatusText() {
    if (this.durabilityText) {
      this.durabilityText.setText(`${this.durability}`);
      const ratio = this.durability / this.maxDurability;
      if (ratio > 0.5) {
        this.durabilityText.setColor('#ffffff');
      } else if (ratio > 0.2) {
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
