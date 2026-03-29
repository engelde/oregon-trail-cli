'use strict';

const blessed = require('blessed');
const { colors, tag, bold } = require('./Theme');

class MenuWidget {
  /**
   * @param {blessed.screen} screen
   * @param {Object}   opts
   * @param {string[]} opts.items      — display labels for each item
   * @param {Object}   [opts.position] — blessed position props (top, left, width, height)
   * @param {Object}   [opts.style]    — override default style
   * @param {string}   [opts.label]    — optional box label / title
   * @param {Function} opts.onSelect   — callback(index, itemText)
   */
  constructor(screen, opts) {
    this.screen = screen;
    this.items = opts.items || [];
    this.onSelect = opts.onSelect || (() => {});
    this.selectedIndex = 0;

    const position = opts.position || {};

    this.box = blessed.box({
      parent: screen,
      top: position.top != null ? position.top : 'center',
      left: position.left != null ? position.left : 'center',
      width: position.width || 40,
      height: position.height || this.items.length + 4,
      label: opts.label ? ` ${opts.label} ` : undefined,
      border: { type: 'line' },
      tags: true,
      padding: { left: 1, right: 1, top: 1, bottom: 0 },
      style: Object.assign(
        {
          border: { fg: colors.primary },
          fg: colors.text,
          bg: colors.bg,
        },
        opts.style || {},
      ),
    });

    this._render();

    // Bind keyboard
    this._onKeypress = this._handleKey.bind(this);
    screen.on('keypress', this._onKeypress);
  }

  // ── Rendering ───────────────────────────────────────────────

  _render() {
    const lines = this.items.map((item, i) => {
      const num = tag(colors.muted, `${i + 1}. `);
      if (i === this.selectedIndex) {
        return `${num}${bold(tag(colors.highlight, `▸ ${item}`))}`;
      }
      return `${num}  ${item}`;
    });
    this.box.setContent(lines.join('\n'));
    this.screen.render();
  }

  // ── Keyboard ────────────────────────────────────────────────

  _handleKey(ch, key) {
    if (!key) return;

    if (key.name === 'up' || key.name === 'k') {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
      this._render();
      return;
    }

    if (key.name === 'down' || key.name === 'j') {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      this._render();
      return;
    }

    if (key.name === 'return' || key.name === 'enter') {
      this._select();
      return;
    }

    // Number shortcuts 1-9
    const num = parseInt(ch, 10);
    if (num >= 1 && num <= this.items.length && num <= 9) {
      this.selectedIndex = num - 1;
      this._render();
      this._select();
    }
  }

  _select() {
    const idx = this.selectedIndex;
    this.onSelect(idx, this.items[idx]);
  }

  // ── Public API ──────────────────────────────────────────────

  /** Update the items list and re-render */
  setItems(items) {
    this.items = items;
    this.selectedIndex = 0;
    this._render();
  }

  /** Focus a specific index */
  focus(index) {
    if (index >= 0 && index < this.items.length) {
      this.selectedIndex = index;
      this._render();
    }
  }

  /** Remove widget and unbind keys */
  destroy() {
    if (this._onKeypress) {
      this.screen.removeListener('keypress', this._onKeypress);
      this._onKeypress = null;
    }
    if (this.box) {
      this.box.destroy();
      this.box = null;
    }
  }
}

module.exports = MenuWidget;
