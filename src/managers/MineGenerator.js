import { GAME_CONFIG } from '../config/gameConfig.js';
import { BLOCK_TYPES } from '../config/blockTypes.js';
import { Block } from '../entities/Block.js';

/**
 * MineGenerator
 * High-action procedural vertical mine generator optimized for 9:16 mobile viewports.
 * Features exact per-row distribution ratios, 10-15 row lookahead chunk generation,
 * strict 5-row viewport culling, and 4 hand-crafted tactical structural formations.
 */
export class MineGenerator {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = GAME_CONFIG.GRID.BLOCK_SIZE;       // 60px
    this.totalCols = GAME_CONFIG.GRID.TOTAL_COLUMNS;     // 9 columns (540px)
    this.playColsStart = GAME_CONFIG.GRID.PLAYABLE_COLS_START; // Col 1
    this.playColsEnd = GAME_CONFIG.GRID.PLAYABLE_COLS_END;     // Col 7

    // Spatial lookup: "col,row" -> Block
    this.blocks = new Map();
    this.highestRowGenerated = 0;
    this.lowestRowCulled = 0;

    // Structural formation scheduler: triggers every 6 to 10 rows
    this.nextFormationRow = 8;
  }

  /**
   * Initializes the shaft entrance and initial block rows
   */
  initShaft() {
    // Clean up any remaining block sprites and physics bodies
    for (const block of this.blocks.values()) {
      if (block.body) {
        this.scene.matter.world.remove(block.body);
      }
      block.destroy();
    }
    this.blocks.clear();
    this.highestRowGenerated = 0;
    this.lowestRowCulled = 0;
    this.nextFormationRow = 8;

    // Preload top chamber + 15 rows ahead
    const initialRows = GAME_CONFIG.GRID.TOP_PADDING_ROWS + GAME_CONFIG.GRID.PRELOAD_ROWS_AHEAD;
    this.generateRows(0, initialRows);
  }

  /**
   * Generates a range of rows [fromRow, toRow]
   */
  generateRows(fromRow, toRow) {
    let r = fromRow;
    while (r <= toRow) {
      // 1. Check if within empty spawn chamber
      if (r < GAME_CONFIG.GRID.TOP_PADDING_ROWS) {
        this.generateBorderRow(r);
        r++;
        continue;
      }

      // 2. Check if a high-action structural formation should trigger (every 6-10 rows)
      if (r >= this.nextFormationRow) {
        const formationLength = this.spawnRandomFormation(r);
        r += formationLength;
        // Schedule next formation 6 to 10 rows after current formation completes
        this.nextFormationRow = r + Phaser.Math.Between(6, 10);
      } else {
        // 3. Generate standard row following the 100% distribution specification
        this.generateStandardRow(r);
        r++;
      }
    }

    this.highestRowGenerated = Math.max(this.highestRowGenerated, toRow);
  }

  /**
   * Spawns indestructible bedrock walls on Col 0 and Col 8
   */
  generateBorderRow(row) {
    this.spawnBlock(0, row, BLOCK_TYPES.BEDROCK);
    this.spawnBlock(this.totalCols - 1, row, BLOCK_TYPES.BEDROCK);
  }

  /**
   * Standard Row Generation following exact distribution:
   * - 45% standard stone / dirt
   * - 20% empty space (navigable chutes)
   * - 15% valuable ores (copper, gold, diamond, emerald)
   * - 8% reinforced / hard stone
   * - 5% bounce blocks
   * - 3% upgrade blocks
   * - 2% TNT explosive crates
   * - 2% repair blocks
   * - Left & Right borders: indestructible bedrock
   */
  generateStandardRow(row) {
    this.generateBorderRow(row);

    const depthMeters = Math.floor((row - GAME_CONFIG.GRID.TOP_PADDING_ROWS) * 1.2);

    for (let col = this.playColsStart; col <= this.playColsEnd; col++) {
      const blockType = this.sampleDistributionBlock(depthMeters);
      if (blockType) {
        this.spawnBlock(col, row, blockType);
      }
    }
  }

  /**
   * Selects block type using exact percentage distribution
   */
  sampleDistributionBlock(depth) {
    const roll = Math.random() * 100;

    // 1. 20% Empty Space (0 to 20)
    if (roll < 20) {
      return null;
    }

    // 2. 45% Standard Stone / Dirt (20 to 65)
    if (roll < 65) {
      // Transition from mostly dirt near surface to mostly stone deeper down
      const stoneRatio = Math.min(0.85, 0.35 + depth * 0.005);
      return Math.random() < stoneRatio ? BLOCK_TYPES.STONE : BLOCK_TYPES.DIRT;
    }

    // 3. 15% Valuable Ores (65 to 80)
    if (roll < 80) {
      return this.sampleValuableOre(depth);
    }

    // 4. 8% Reinforced / Hard Stone (80 to 88)
    if (roll < 88) {
      return depth > 40 && Math.random() < 0.5 ? BLOCK_TYPES.RED_VOLCANIC : BLOCK_TYPES.HARD_STONE;
    }

    // 5. 5% Bounce Blocks (88 to 93)
    if (roll < 93) {
      return BLOCK_TYPES.BOUNCE;
    }

    // 6. 3% Upgrade Blocks (93 to 96)
    if (roll < 96) {
      return BLOCK_TYPES.UPGRADE;
    }

    // 7. 2% TNT Explosive Crates (96 to 98)
    if (roll < 98) {
      return BLOCK_TYPES.TNT;
    }

    // 8. 2% Repair Blocks (98 to 100)
    return BLOCK_TYPES.REPAIR;
  }

  /**
   * Samples valuable ores weighted progressively by depth
   */
  sampleValuableOre(depth) {
    const oreRoll = Math.random() * 100;

    if (depth < 30) {
      if (oreRoll < 65) return BLOCK_TYPES.COPPER_ORE;
      if (oreRoll < 92) return BLOCK_TYPES.GOLD_ORE;
      return BLOCK_TYPES.DIAMOND_ORE;
    } else if (depth < 80) {
      if (oreRoll < 30) return BLOCK_TYPES.COPPER_ORE;
      if (oreRoll < 75) return BLOCK_TYPES.GOLD_ORE;
      if (oreRoll < 95) return BLOCK_TYPES.DIAMOND_ORE;
      return BLOCK_TYPES.EMERALD_ORE;
    } else {
      // Deep abyss
      if (oreRoll < 15) return BLOCK_TYPES.COPPER_ORE;
      if (oreRoll < 45) return BLOCK_TYPES.GOLD_ORE;
      if (oreRoll < 80) return BLOCK_TYPES.DIAMOND_ORE;
      return BLOCK_TYPES.EMERALD_ORE;
    }
  }

  // -------------------------------------------------------------
  // STRUCTURAL FORMATIONS (Spawn randomly every 6–10 rows)
  // -------------------------------------------------------------
  spawnRandomFormation(startRow) {
    const formationIndex = Phaser.Math.Between(0, 3);

    switch (formationIndex) {
      case 0:
        return this.buildDiagonalChuteFormation(startRow);
      case 1:
        return this.buildOreVaultFormation(startRow);
      case 2:
        return this.buildTntChainFormation(startRow);
      case 3:
      default:
        return this.buildBounceSpeedShaftFormation(startRow);
    }
  }

  /**
   * Formation 1: Narrow Diagonal Chute
   * Spans 5 rows. Forces a zig-zag ricochet trajectory flanked by bounce corners.
   */
  buildDiagonalChuteFormation(startRow) {
    const goLeftToRight = Math.random() > 0.5;

    // Pattern layout over 5 rows (cols 1 to 7)
    // 0 = empty chute, 1 = stone, 2 = hard stone, 3 = bounce, 4 = ore
    const pattern = goLeftToRight ? [
      [0, 0, 1, 2, 2, 1, 1], // Row 0: Chute on left
      [3, 0, 0, 1, 2, 4, 1], // Row 1: Bounce block on far-left corner kicks to center
      [1, 2, 0, 0, 1, 2, 1], // Row 2: Slanted center pass
      [1, 4, 2, 0, 0, 3, 1], // Row 3: Bounce block kicks off right
      [1, 1, 2, 4, 0, 0, 1]  // Row 4: Exit with diamond ore reward
    ] : [
      [1, 1, 2, 2, 1, 0, 0], // Inverted
      [1, 4, 2, 1, 0, 0, 3],
      [1, 2, 1, 0, 0, 2, 1],
      [1, 3, 0, 0, 2, 4, 1],
      [1, 0, 0, 4, 2, 1, 1]
    ];

    this.applyFormationPattern(startRow, pattern);
    return pattern.length;
  }

  /**
   * Formation 2: Dense Ore Vault behind Reinforced Blocks
   * Spans 4 rows. A reinforced hard-stone barricade guarding concentrated gold, diamond, and emerald ores.
   */
  buildOreVaultFormation(startRow) {
    const pattern = [
      // Row 0: Reinforced Gate (hard stone barrier with a single stone weak point)
      [2, 2, 1, 2, 2, 1, 2],
      // Row 1: Upper Vault (dense gems)
      [2, 4, 4, 4, 4, 4, 2],
      // Row 2: Deep Vault (high tier ores + upgrade center)
      [1, 4, 4, 5, 4, 4, 1], // 5 = Upgrade
      // Row 3: Vault Floor with escape exits
      [2, 0, 1, 2, 1, 0, 2]  // Chutes open at cols 2 and 6
    ];

    this.applyFormationPattern(startRow, pattern);
    return pattern.length;
  }

  /**
   * Formation 3: TNT Cache with Chain-Reaction Clears
   * Spans 3 rows. Strategic multi-TNT placements that cascade on first impact.
   */
  buildTntChainFormation(startRow) {
    const pattern = [
      // Row 0: Hard obstacles funneling pickaxe into central TNT
      [2, 1, 2, 6, 2, 1, 2], // 6 = TNT
      // Row 1: Adjacent TNT crates to trigger cascade shockwaves
      [1, 2, 6, 4, 6, 2, 1],
      // Row 2: Reinforced floor with third TNT and ores
      [2, 4, 2, 6, 2, 4, 2]
    ];

    this.applyFormationPattern(startRow, pattern);
    return pattern.length;
  }

  /**
   * Formation 4: High-Speed Vertical Shaft Lined with Bounce Blocks
   * Spans 4 rows. Wide-open central chute lined with facing bounce blocks for extreme pinball acceleration.
   */
  buildBounceSpeedShaftFormation(startRow) {
    const pattern = [
      // Columns 3 and 5 are bounce pads facing into empty chute (Col 4)
      [1, 2, 3, 0, 0, 3, 1],
      [1, 4, 3, 0, 0, 3, 2],
      [2, 1, 3, 0, 0, 3, 4],
      [1, 2, 2, 0, 0, 2, 1]
    ];

    this.applyFormationPattern(startRow, pattern);
    return pattern.length;
  }

  applyFormationPattern(startRow, pattern) {
    for (let rIdx = 0; rIdx < pattern.length; rIdx++) {
      const curRow = startRow + rIdx;
      this.generateBorderRow(curRow);

      const rowCols = pattern[rIdx];
      for (let cIdx = 0; cIdx < rowCols.length; cIdx++) {
        const col = this.playColsStart + cIdx;
        const code = rowCols[cIdx];

        let blockType = null;
        switch (code) {
          case 0: blockType = null; break; // Air chute
          case 1: blockType = BLOCK_TYPES.STONE; break;
          case 2: blockType = BLOCK_TYPES.HARD_STONE; break;
          case 3: blockType = BLOCK_TYPES.BOUNCE; break;
          case 4: blockType = this.sampleValuableOre(Math.floor(curRow * 1.2)); break;
          case 5: blockType = BLOCK_TYPES.UPGRADE; break;
          case 6: blockType = BLOCK_TYPES.TNT; break;
          case 7: blockType = BLOCK_TYPES.REPAIR; break;
        }

        if (blockType) {
          this.spawnBlock(col, curRow, blockType);
        }
      }
    }
  }

  spawnBlock(col, row, blockType) {
    const key = `${col},${row}`;
    if (this.blocks.has(key)) return;

    const x = col * this.blockSize + this.blockSize / 2;
    const y = row * this.blockSize + this.blockSize / 2;

    const block = new Block(this.scene, x, y, blockType, col, row);
    this.blocks.set(key, block);
  }

  removeBlock(col, row) {
    this.blocks.delete(`${col},${row}`);
  }

  /**
   * Called on every scene update:
   * - Keeps mine chunks generated 10-15 rows ahead of viewport bottom.
   * - Culls rows 5 blocks above viewport top to preserve high FPS & minimal memory.
   */
  updateGeneration(cameraScrollY) {
    const topViewportRow = Math.floor(cameraScrollY / this.blockSize);
    const bottomViewportRow = Math.floor((cameraScrollY + GAME_CONFIG.HEIGHT) / this.blockSize);

    // 1. Generate 10-15 rows ahead of bottom viewport
    const targetRow = bottomViewportRow + GAME_CONFIG.GRID.PRELOAD_ROWS_AHEAD;
    if (targetRow > this.highestRowGenerated) {
      this.generateRows(this.highestRowGenerated + 1, targetRow);
    }

    // 2. Cull rows 5 blocks above viewport top
    const cullMaxRow = topViewportRow - GAME_CONFIG.GRID.CULL_ROWS_ABOVE;
    if (cullMaxRow > this.lowestRowCulled) {
      this.cullRows(this.lowestRowCulled, cullMaxRow);
      this.lowestRowCulled = cullMaxRow;
    }
  }

  cullRows(fromRow, toRow) {
    for (let r = fromRow; r <= toRow; r++) {
      for (let c = 0; c < this.totalCols; c++) {
        const key = `${c},${r}`;
        const block = this.blocks.get(key);
        if (block) {
          this.blocks.delete(key);
          if (block.body) {
            this.scene.matter.world.remove(block.body);
          }
          block.destroy();
        }
      }
    }
  }

  /**
   * Returns all active blocks within a radial distance (used for TNT explosions & anti-stuck checks)
   */
  getBlocksInRadius(worldX, worldY, radius) {
    const targets = [];
    const radiusSq = radius * radius;

    for (const block of this.blocks.values()) {
      if (block.isDestroyed || block.blockType.isIndestructible) continue;
      const dx = block.x - worldX;
      const dy = block.y - worldY;
      if (dx * dx + dy * dy <= radiusSq) {
        targets.push(block);
      }
    }

    return targets;
  }
}
