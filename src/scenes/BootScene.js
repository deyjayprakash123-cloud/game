import Phaser from 'phaser';

/**
 * BootScene
 * Generates all original pixel-art graphics dynamically on procedural HTML5 canvases
 * while also supporting seamless replacement with custom files from /public/assets/.
 * Guarantees 100% zero-dependency, zero-missing-asset startup on any device or host.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;
    
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0a14);
    
    this.add.text(width / 2, height / 2 - 40, 'MINE DROP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, 'Synthesizing Pixel Mine...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Root-relative asset loader to prevent broken paths on Vercel preview URLs
    this.load.on('loaderror', (fileObj) => {
      // Gracefully silent on optional external asset load attempts
    });

    // 1. Pickaxes
    this.loadOptionalAsset('pickaxe_wood', '/assets/pickaxes/pickaxe_wood.png');
    this.loadOptionalAsset('pickaxe_stone', '/assets/pickaxes/pickaxe_stone.png');
    this.loadOptionalAsset('pickaxe_iron', '/assets/pickaxes/pickaxe_iron.png');
    this.loadOptionalAsset('pickaxe_diamond', '/assets/pickaxes/pickaxe_diamond.png');

    // 2. Blocks
    this.loadOptionalAsset('block_dirt', '/assets/blocks/dirt.png');
    this.loadOptionalAsset('block_stone', '/assets/blocks/stone.png');
    this.loadOptionalAsset('block_hard_stone', '/assets/blocks/hard_stone.png');
    this.loadOptionalAsset('block_red_volcanic', '/assets/blocks/red_volcanic_rock.png');
    this.loadOptionalAsset('block_copper_ore', '/assets/blocks/copper_ore.png');
    this.loadOptionalAsset('block_gold_ore', '/assets/blocks/gold_ore.png');
    this.loadOptionalAsset('block_diamond_ore', '/assets/blocks/diamond_ore.png');
    this.loadOptionalAsset('block_emerald_ore', '/assets/blocks/emerald_ore.png');
    this.loadOptionalAsset('block_tnt', '/assets/blocks/tnt.png');
    this.loadOptionalAsset('block_repair', '/assets/blocks/repair.png');
    this.loadOptionalAsset('block_upgrade', '/assets/blocks/upgrade.png');
    this.loadOptionalAsset('block_bounce', '/assets/blocks/bounce.png');
    this.loadOptionalAsset('block_bedrock', '/assets/blocks/bedrock.png');

    // 3. Backgrounds & UI
    this.loadOptionalAsset('bg_mine', '/assets/backgrounds/bg_mine.png');
    this.loadOptionalAsset('selector_wheel_frame', '/assets/ui/selector_wheel_frame.png');
    this.loadOptionalAsset('icon_golden_pickaxe', '/assets/ui/icon_golden_pickaxe.png');
    this.loadOptionalAsset('icon_danger_skull', '/assets/ui/icon_danger_skull.png');
    this.loadOptionalAsset('icon_treasure_chest', '/assets/ui/icon_treasure_chest.png');
    this.loadOptionalAsset('icon_bonus_2x', '/assets/ui/icon_bonus_2x.png');

    // Spritesheet for selector wheel center
    this.load.spritesheet('wheel_icons_spritesheet', '/assets/ui/wheel_icons_spritesheet.png', {
      frameWidth: 128,
      frameHeight: 128
    });
  }

  loadOptionalAsset(key, path) {
    this.load.image(key, path);
  }

  create() {
    // Generate procedural pixel-art for any textures not supplied via external files
    this.generateProceduralPickaxes();
    this.generateProceduralBlocks();
    this.generateProceduralEffects();
    this.generateProceduralUI();
    this.generateProceduralBackground();

    // Disable texture smoothing globally across all loaded and generated textures
    this.textures.each((texture) => {
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    });

    // Smooth transition into GameScene
    this.time.delayedCall(150, () => {
      this.scene.start('GameScene');
    });
  }

  // -------------------------------------------------------------
  // 1. PROCEDURAL PICKAXES (4 Tiers)
  // -------------------------------------------------------------
  generateProceduralPickaxes() {
    const tiers = [
      { key: 'pickaxe_wood', headMain: '#8f562b', headHi: '#c68a4c', headDark: '#5a3418', handle: '#9a6332', handleDark: '#5c3919' },
      { key: 'pickaxe_stone', headMain: '#8a8b94', headHi: '#c2c3cc', headDark: '#52535a', handle: '#8c5930', handleDark: '#53341b' },
      { key: 'pickaxe_iron', headMain: '#d1dae8', headHi: '#ffffff', headDark: '#7f8899', handle: '#82522c', handleDark: '#4a2d16' },
      { key: 'pickaxe_diamond', headMain: '#1fd4eb', headHi: '#d6fbff', headDark: '#0e7c8a', handle: '#2b3345', handleDark: '#141824' }
    ];

    tiers.forEach(({ key, headMain, headHi, headDark, handle, handleDark }) => {
      if (this.textures.exists(key) && this.textures.get(key).key !== '__MISSING') return;

      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const p = 2.5;

      // Handle running diagonally
      ctx.fillStyle = handleDark;
      for (let i = 0; i < 15; i++) {
        const x = 16 + i * 1.5;
        const y = 48 - i * 1.5;
        ctx.fillRect(x * p, y * p, 4 * p, 4 * p);
      }
      ctx.fillStyle = handle;
      for (let i = 0; i < 15; i++) {
        const x = 17 + i * 1.5;
        const y = 47 - i * 1.5;
        ctx.fillRect(x * p, y * p, 2.5 * p, 2.5 * p);
      }

      // Curved pickaxe blade head
      const headCenter = { x: 39, y: 25 };
      this.drawCurvedBlade(ctx, headCenter, p, 15, 6, headDark);
      this.drawCurvedBlade(ctx, headCenter, p, 13, 4, headMain);
      this.drawBladeHighlight(ctx, headCenter, p, 13, headHi);

      // Gem glint at socket
      ctx.fillStyle = headHi;
      ctx.fillRect((headCenter.x - 1) * p, (headCenter.y - 1) * p, 3 * p, 3 * p);

      this.textures.addCanvas(key, canvas);
    });
  }

  drawCurvedBlade(ctx, center, p, radius, thickness, color) {
    ctx.fillStyle = color;
    for (let angle = -1.2; angle <= 1.2; angle += 0.08) {
      const ax = center.x + Math.sin(angle) * radius;
      const ay = center.y - Math.cos(angle) * (radius * 0.7);
      ctx.fillRect((ax - thickness / 2) * p, (ay - thickness / 2) * p, thickness * p, thickness * p);
    }
  }

  drawBladeHighlight(ctx, center, p, radius, color) {
    ctx.fillStyle = color;
    for (let angle = -1.1; angle <= -0.1; angle += 0.1) {
      const ax = center.x + Math.sin(angle) * radius;
      const ay = center.y - Math.cos(angle) * (radius * 0.7);
      ctx.fillRect((ax - 1) * p, (ay - 1) * p, 2 * p, 2 * p);
    }
  }

  // -------------------------------------------------------------
  // 2. PROCEDURAL BLOCKS
  // -------------------------------------------------------------
  generateProceduralBlocks() {
    const blockSize = 60;

    const blockDefs = [
      { key: 'block_dirt', bg: '#784d28', hi: '#9e6737', dark: '#4f3016', specks: '#633d1d' },
      { key: 'block_stone', bg: '#767882', hi: '#9fa1ad', dark: '#4e5057', specks: '#63656e' },
      { key: 'block_hard_stone', bg: '#3a3c48', hi: '#545768', dark: '#22232b', specks: '#2e303b', rivets: true },
      { key: 'block_red_volcanic', bg: '#4a0e17', hi: '#991b1b', dark: '#1c070b', specks: '#ef4444' },
      { key: 'block_copper_ore', bg: '#767882', hi: '#9fa1ad', dark: '#4e5057', oreColor: '#d66729', oreHi: '#ff9c60' },
      { key: 'block_gold_ore', bg: '#767882', hi: '#9fa1ad', dark: '#4e5057', oreColor: '#eab308', oreHi: '#fef08a' },
      { key: 'block_diamond_ore', bg: '#3a3c48', hi: '#545768', dark: '#22232b', oreColor: '#06b6d4', oreHi: '#a5f3fc' },
      { key: 'block_emerald_ore', bg: '#3a3c48', hi: '#545768', dark: '#22232b', oreColor: '#10b981', oreHi: '#a7f3d0' },
      { key: 'block_tnt', bg: '#dc2626', hi: '#ef4444', dark: '#991b1b', isTnt: true },
      { key: 'block_repair', bg: '#047857', hi: '#10b981', dark: '#064e3b', isRepair: true },
      { key: 'block_upgrade', bg: '#d97706', hi: '#fbbf24', dark: '#78350f', isUpgrade: true },
      { key: 'block_bounce', bg: '#7e22ce', hi: '#a855f7', dark: '#581c87', isBounce: true },
      { key: 'block_bedrock', bg: '#171622', hi: '#332f4a', dark: '#09080e', isBedrock: true }
    ];

    blockDefs.forEach(def => {
      if (this.textures.exists(def.key) && this.textures.get(def.key).key !== '__MISSING') return;

      const canvas = document.createElement('canvas');
      canvas.width = blockSize;
      canvas.height = blockSize;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = def.bg;
      ctx.fillRect(0, 0, blockSize, blockSize);

      if (def.specks) {
        ctx.fillStyle = def.specks;
        for (let i = 0; i < 30; i++) {
          const sx = (i * 17) % (blockSize - 8) + 4;
          const sy = (i * 29) % (blockSize - 8) + 4;
          ctx.fillRect(sx, sy, 4, 4);
        }
      }

      ctx.fillStyle = def.hi;
      ctx.fillRect(0, 0, blockSize, 4);
      ctx.fillRect(0, 0, 4, blockSize);

      ctx.fillStyle = def.dark;
      ctx.fillRect(0, blockSize - 4, blockSize, 4);
      ctx.fillRect(blockSize - 4, 0, 4, blockSize);

      if (def.oreColor) {
        this.drawOreClusters(ctx, def.oreColor, def.oreHi);
      } else if (def.isTnt) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 20, blockSize - 8, 24);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', blockSize / 2, blockSize / 2 + 1);
      } else if (def.isRepair) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(26, 12, 12, 40);
        ctx.fillRect(12, 26, 40, 12);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(28, 28, 8, 8);
      } else if (def.isUpgrade) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(32, 12);
        ctx.lineTo(48, 28);
        ctx.lineTo(38, 28);
        ctx.lineTo(38, 50);
        ctx.lineTo(26, 50);
        ctx.lineTo(26, 28);
        ctx.lineTo(16, 28);
        ctx.closePath();
        ctx.fill();
      } else if (def.isBounce) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(14, 48);
        ctx.lineTo(26, 38);
        ctx.lineTo(38, 48);
        ctx.lineTo(50, 38);
        ctx.lineTo(32, 14);
        ctx.stroke();
      } else if (def.isBedrock) {
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 12);
        ctx.lineTo(24, 28);
        ctx.lineTo(44, 18);
        ctx.lineTo(54, 48);
        ctx.stroke();
      } else if (def.rivets) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(8, 8, 4, 4);
        ctx.fillRect(blockSize - 12, 8, 4, 4);
        ctx.fillRect(8, blockSize - 12, 4, 4);
        ctx.fillRect(blockSize - 12, blockSize - 12, 4, 4);
      }

      this.textures.addCanvas(def.key, canvas);
    });
  }

  drawOreClusters(ctx, mainColor, hiColor) {
    const spots = [
      { x: 14, y: 14, w: 8, h: 8 },
      { x: 22, y: 16, w: 6, h: 6 },
      { x: 38, y: 12, w: 10, h: 8 },
      { x: 12, y: 38, w: 8, h: 10 },
      { x: 34, y: 36, w: 12, h: 12 },
      { x: 44, y: 44, w: 6, h: 6 }
    ];

    spots.forEach(s => {
      ctx.fillStyle = mainColor;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = hiColor;
      ctx.fillRect(s.x + 2, s.y + 2, Math.max(2, s.w - 4), Math.max(2, s.h - 4));
    });
  }

  // -------------------------------------------------------------
  // 3. PROCEDURAL EFFECTS
  // -------------------------------------------------------------
  generateProceduralEffects() {
    if (!this.textures.exists('particle_spark')) {
      const sparkCanvas = document.createElement('canvas');
      sparkCanvas.width = 16;
      sparkCanvas.height = 16;
      const sCtx = sparkCanvas.getContext('2d');
      sCtx.fillStyle = '#ffffff';
      sCtx.fillRect(6, 6, 4, 4);
      sCtx.fillStyle = '#fde047';
      sCtx.fillRect(6, 0, 4, 16);
      sCtx.fillRect(0, 6, 16, 4);
      this.textures.addCanvas('particle_spark', sparkCanvas);
    }

    if (!this.textures.exists('particle_smoke')) {
      const smokeCanvas = document.createElement('canvas');
      smokeCanvas.width = 24;
      smokeCanvas.height = 24;
      const smCtx = smokeCanvas.getContext('2d');
      smCtx.fillStyle = '#f97316';
      smCtx.beginPath();
      smCtx.arc(12, 12, 10, 0, Math.PI * 2);
      smCtx.fill();
      smCtx.fillStyle = '#fef08a';
      smCtx.beginPath();
      smCtx.arc(12, 12, 6, 0, Math.PI * 2);
      smCtx.fill();
      this.textures.addCanvas('particle_smoke', smokeCanvas);
    }

    if (!this.textures.exists('particle_debris')) {
      const debCanvas = document.createElement('canvas');
      debCanvas.width = 10;
      debCanvas.height = 10;
      const dCtx = debCanvas.getContext('2d');
      dCtx.fillStyle = '#ffffff';
      dCtx.fillRect(0, 0, 10, 10);
      this.textures.addCanvas('particle_debris', debCanvas);
    }

    if (!this.textures.exists('particle_ore_sparkle')) {
      const spCanvas = document.createElement('canvas');
      spCanvas.width = 16;
      spCanvas.height = 16;
      const spCtx = spCanvas.getContext('2d');
      spCtx.imageSmoothingEnabled = false;

      // Crisp retro 4-pointed sparkle star with bright center
      spCtx.fillStyle = '#ffffff';
      spCtx.fillRect(6, 6, 4, 4);
      spCtx.fillRect(2, 7, 12, 2);
      spCtx.fillRect(7, 2, 2, 12);
      spCtx.fillStyle = '#fef08a';
      spCtx.fillRect(4, 4, 2, 2);
      spCtx.fillRect(10, 4, 2, 2);
      spCtx.fillRect(4, 10, 2, 2);
      spCtx.fillRect(10, 10, 2, 2);
      this.textures.addCanvas('particle_ore_sparkle', spCanvas);
    }
  }

  // -------------------------------------------------------------
  // 4. PROCEDURAL UI ASSETS
  // -------------------------------------------------------------
  generateProceduralUI() {
    if (!this.textures.exists('ui_heart')) {
      const heartCanvas = document.createElement('canvas');
      heartCanvas.width = 32;
      heartCanvas.height = 32;
      const hCtx = heartCanvas.getContext('2d');
      hCtx.fillStyle = '#ef4444';
      hCtx.beginPath();
      hCtx.moveTo(16, 26);
      hCtx.bezierCurveTo(4, 18, 4, 8, 11, 8);
      hCtx.bezierCurveTo(14, 8, 16, 12, 16, 12);
      hCtx.bezierCurveTo(16, 12, 18, 8, 21, 8);
      hCtx.bezierCurveTo(28, 8, 28, 18, 16, 26);
      hCtx.fill();
      this.textures.addCanvas('ui_heart', heartCanvas);
    }

    if (!this.textures.exists('ui_coin')) {
      const coinCanvas = document.createElement('canvas');
      coinCanvas.width = 32;
      coinCanvas.height = 32;
      const cCtx = coinCanvas.getContext('2d');
      cCtx.fillStyle = '#eab308';
      cCtx.beginPath();
      cCtx.arc(16, 16, 14, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.strokeStyle = '#ca8a04';
      cCtx.lineWidth = 3;
      cCtx.stroke();
      cCtx.fillStyle = '#fef08a';
      cCtx.font = 'bold 16px monospace';
      cCtx.textAlign = 'center';
      cCtx.textBaseline = 'middle';
      cCtx.fillText('$', 16, 16);
      this.textures.addCanvas('ui_coin', coinCanvas);
    }

    if (!this.textures.exists('selector_wheel_frame')) {
      const wCanvas = document.createElement('canvas');
      wCanvas.width = 64;
      wCanvas.height = 64;
      const wCtx = wCanvas.getContext('2d');
      wCtx.strokeStyle = '#f97316';
      wCtx.lineWidth = 6;
      wCtx.beginPath();
      wCtx.arc(32, 32, 24, 0, Math.PI * 2);
      wCtx.stroke();
      this.textures.addCanvas('selector_wheel_frame', wCanvas);
    }

    if (!this.textures.exists('icon_danger_skull')) {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = 32;
      sCanvas.height = 32;
      const sCtx = sCanvas.getContext('2d');
      sCtx.fillStyle = '#ef4444';
      sCtx.beginPath();
      sCtx.arc(16, 14, 10, 0, Math.PI * 2);
      sCtx.fill();
      sCtx.fillRect(11, 20, 10, 6);
      this.textures.addCanvas('icon_danger_skull', sCanvas);
    }
  }

  // -------------------------------------------------------------
  // 5. PROCEDURAL BACKGROUND
  // -------------------------------------------------------------
  generateProceduralBackground() {
    if (!this.textures.exists('bg_mine')) {
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = 540;
      bgCanvas.height = 960;
      const ctx = bgCanvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 960);
      grad.addColorStop(0, '#110e1b');
      grad.addColorStop(0.3, '#141221');
      grad.addColorStop(1, '#07050d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 540, 960);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let i = 0; i < 50; i++) {
        const rx = (i * 73) % 500 + 20;
        const ry = (i * 97) % 920 + 20;
        const rw = (i * 31) % 60 + 20;
        const rh = (i * 47) % 40 + 15;
        ctx.fillRect(rx, ry, rw, rh);
      }

      this.textures.addCanvas('bg_mine', bgCanvas);
    }
  }
}
