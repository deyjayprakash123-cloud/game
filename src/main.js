import Phaser from 'phaser';
import { GAME_CONFIG } from './config/gameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

/**
 * Phaser 3 Application Configuration
 * Fitted for 9:16 mobile viewports, high-performance pixel-art rendering,
 * and integrated Matter.js rigid-body physics.
 */
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0c0a14',

  clearBeforeRender: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT
  },

  physics: {
    default: 'matter',
    matter: {
      gravity: {
        x: 0,
        y: 0.8
      },
      runner: {
        isFixed: true,
        fps: 60
      },
      positionIterations: 6,
      velocityIterations: 4,
      debug: false,
      enableSleeping: false
    }
  },

  scene: [BootScene, GameScene]
};

// Mount and start the game
const game = new Phaser.Game(config);

export default game;

