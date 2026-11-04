import Phaser from 'phaser';

/**
 * FloatingTextPool
 * High-performance object pool for floating score popups and combat damage numbers.
 * Eliminates text object creation/destruction overhead and canvas allocations,
 * guaranteeing consistent 60 FPS on mobile Safari and Chromium.
 */
export class FloatingTextPool {
  constructor(scene, poolSize = 30) {
    this.scene = scene;
    this.pool = [];
    this.poolSize = poolSize;

    for (let i = 0; i < poolSize; i++) {
      const text = scene.add.text(0, 0, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false)
      .setDepth(150);

      this.pool.push({
        text,
        tween: null
      });
    }
  }

  /**
   * Spawns a crisp pixel-font floating text popup from the pre-allocated pool
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {string} content - Text string to display (e.g., "+100")
   * @param {string} color - Hex color string
   * @param {number} fontSize - Font size in pixels
   * @param {number} duration - Fade/float duration in ms (default 400ms)
   * @param {number} floatDistance - Pixels to float upward (default 38px)
   */
  spawn(x, y, content, color = '#ffffff', fontSize = 14, duration = 400, floatDistance = 38) {
    // Retrieve an inactive text instance, or reuse the oldest active one
    let entry = this.pool.find(item => !item.text.active);
    if (!entry) {
      entry = this.pool[0];
      if (entry.tween) {
        entry.tween.stop();
      }
    }

    const txt = entry.text;
    txt.setPosition(x, y);
    txt.setText(content);
    txt.setColor(color);
    txt.setFontSize(`${fontSize}px`);
    txt.setAlpha(1);
    txt.setScale(1.15);
    txt.setActive(true);
    txt.setVisible(true);

    // Float upward and fade out smoothly over exact duration
    entry.tween = this.scene.tweens.add({
      targets: txt,
      y: y - floatDistance,
      scale: 1.0,
      alpha: 0,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        txt.setActive(false);
        txt.setVisible(false);
        entry.tween = null;
      }
    });

    return txt;
  }

  destroy() {
    this.pool.forEach(entry => {
      if (entry.tween) entry.tween.stop();
      entry.text.destroy();
    });
    this.pool = [];
  }
}

