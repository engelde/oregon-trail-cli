const blessed = require('blessed');
const { colors, tag, bold } = require('./Theme');

class StatusBar {
  /**
   * @param {blessed.screen} screen
   */
  constructor(screen) {
    this.screen = screen;

    this.box = blessed.box({
      parent: screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      tags: true,
      border: { type: 'line' },
      style: {
        border: { fg: colors.muted },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
  }

  /**
   * Refresh the bar contents from the current game state.
   *
   * @param {import('../game/GameState')} gs
   * @param {{ nextLandmarkName?: string, nextLandmarkDist?: number }} [extra]
   */
  update(gs, extra = {}) {
    const date = bold(tag(colors.secondary, gs.getDateString()));
    const weather = tag(colors.highlight, gs.weather || 'clear');
    const health = this._healthColor(gs.getHealthStatus());
    const food = tag(colors.text, `${gs.supplies.food} lbs`);
    const miles = tag(colors.text, `${gs.milesTraveled} mi`);

    let landmark = '';
    if (extra.nextLandmarkName) {
      const dist = extra.nextLandmarkDist != null ? ` (${extra.nextLandmarkDist} mi)` : '';
      landmark = tag(colors.primary, `${extra.nextLandmarkName}${dist}`);
    }

    const sep = tag(colors.muted, ' | ');
    const parts = [`Date: ${date}`, `Weather: ${weather}`, `Health: ${health}`, `Food: ${food}`, `Miles: ${miles}`];
    if (landmark) parts.push(`Next: ${landmark}`);

    this.box.setContent(parts.join(sep));
    this.screen.render();
  }

  /** Map health string → colored tag */
  _healthColor(status) {
    switch (status) {
      case 'good':
        return tag('green', status);
      case 'fair':
        return tag('yellow', status);
      case 'poor':
        return tag('red', status);
      case 'very poor':
        return tag('red', bold(status));
      default:
        return tag('gray', status);
    }
  }

  destroy() {
    if (this.box) {
      this.box.destroy();
      this.box = null;
    }
  }
}

module.exports = StatusBar;
