const blessed = require('blessed');
const { colors, tag, boldColor } = require('../ui/Theme');
const showDialog = require('../ui/DialogBox');

// ── Title art with inline fallback ───────────────────────────────
let titleArt, titleWagon, subtitle;
try {
  const art = require('../art/title');
  titleArt = art.titleArt;
  titleWagon = art.titleWagon;
  subtitle = art.subtitle;
} catch (_) {
  titleArt =
    '{bold}{yellow-fg}' +
    [
      '  ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ ╔╗  ╔╗   ╔╦╗ ╔═══╗ ╔═══╗ ╦  ╦',
      '  ║   ║ ║   ║ ║     ║     ║   ║ ║╚╗ ║║    ║  ║   ║ ║   ║ ║  ║',
      '  ║   ║ ╠══╦╝ ╠═══  ║ ╔═╗ ║   ║ ║ ╚╗║║    ║  ╠══╦╝ ╠═══╣ ║  ║',
      '  ║   ║ ║  ╚╗ ║     ║ ╚═╝ ║   ║ ║  ╚╝║    ║  ║  ╚╗ ║   ║ ║  ║',
      '  ╚═══╝ ╩   ╩ ╚═══╝ ╚═══╝ ╚═══╝ ╩    ╩    ╩  ╩   ╩ ╩   ╩ ╩  ╚═══╝',
    ].join('\n') +
    '{/yellow-fg}{/bold}';
  titleWagon = '';
  subtitle = '{cyan-fg}A journey of 2,000 miles begins with a single step...{/cyan-fg}';
}

const MENU_ITEMS = ['Travel the trail', 'Learn about the trail', 'See the top 10 list', 'Exit'];

class TitleScreen {
  constructor(screen, props) {
    this.screen = screen;
    this.engine = props?.engine || null;
    this.gameState = props?.gameState || null;
    this.onComplete = props?.onComplete || null;
    this.widgets = [];
    this.keyHandlers = [];
    this._dialog = null;
    this._selectedIndex = 0;
  }

  addWidget(widget) {
    this.widgets.push(widget);
    this.screen.append(widget);
  }

  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }

  create() {
    const sh = this.screen.height;
    const showWagon = sh >= 38 && titleWagon;

    // ── ASCII Art Title (combined OREGON TRAIL) ─────────────────
    const artBox = blessed.box({
      top: 0,
      left: 'center',
      width: '90%',
      height: 7,
      content: titleArt,
      tags: true,
      style: { fg: colors.primary, bg: colors.bg },
    });
    this.addWidget(artBox);

    let nextRow = 7;

    // ── Wagon Art (only on tall terminals) ──────────────────────
    if (showWagon) {
      const wagonBox = blessed.box({
        top: nextRow,
        left: 'center',
        width: '90%',
        height: 17,
        content: titleWagon,
        tags: true,
        style: { fg: colors.text, bg: colors.bg },
      });
      this.addWidget(wagonBox);
      nextRow += 17;
    }

    // ── Subtitle ────────────────────────────────────────────────
    const subtitleBox = blessed.box({
      top: nextRow,
      left: 'center',
      width: '80%',
      height: 1,
      align: 'center',
      content: subtitle,
      tags: true,
      style: { fg: colors.highlight, bg: colors.bg },
    });
    this.addWidget(subtitleBox);
    nextRow += 2;

    // ── Menu ────────────────────────────────────────────────────
    this.menuBox = blessed.box({
      top: nextRow,
      left: 'center',
      width: 44,
      height: MENU_ITEMS.length + 4,
      border: { type: 'line' },
      label: ` ${boldColor(colors.primary, 'Oregon Trail')} `,
      tags: true,
      padding: { left: 2, right: 2, top: 1, bottom: 0 },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
    });
    this.addWidget(this.menuBox);
    this._renderMenu();

    // ── Keyboard ────────────────────────────────────────────────
    this.registerKey(['up', 'k'], () => {
      if (this._dialog) return;
      this._selectedIndex = (this._selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      this._renderMenu();
    });

    this.registerKey(['down', 'j'], () => {
      if (this._dialog) return;
      this._selectedIndex = (this._selectedIndex + 1) % MENU_ITEMS.length;
      this._renderMenu();
    });

    this.registerKey(['enter'], () => {
      if (this._dialog) return;
      this._handleSelect(this._selectedIndex);
    });

    for (let i = 1; i <= 4; i++) {
      this.registerKey([String(i)], () => {
        if (this._dialog) return;
        this._selectedIndex = i - 1;
        this._renderMenu();
        this._handleSelect(i - 1);
      });
    }

    this.screen.render();
  }

  _renderMenu() {
    const lines = MENU_ITEMS.map((item, i) => {
      const num = `${i + 1}`;
      if (i === this._selectedIndex) {
        return `{green-bg}{white-fg}{bold} ${num}. ${item.padEnd(28)}{/bold}{/white-fg}{/green-bg}`;
      }
      return `{green-fg} ${num}. ${item}{/green-fg}`;
    });
    this.menuBox.setContent(lines.join('\n'));
    this.screen.render();
  }

  _handleSelect(index) {
    switch (index) {
      case 0: // Travel the trail
        this._transition('travel');
        break;
      case 1: // Learn about the trail
        this._showLearnDialog();
        break;
      case 2: // See the top 10 list
        this._transition('highscores');
        break;
      case 3: // Exit
        process.exit(0);
        break;
    }
  }

  _transition(action) {
    if (this.onComplete) {
      this.onComplete(action);
      return;
    }
    if (!this.engine) return;

    switch (action) {
      case 'travel':
        this.engine.showSetup();
        break;
      case 'highscores':
        if (typeof this.engine.showHighScores === 'function') {
          this.engine.showHighScores();
        } else {
          this._showHighScoresPlaceholder();
        }
        break;
    }
  }

  _showLearnDialog() {
    if (this._dialog) return;

    const message =
      'The Oregon Trail was a roughly 2,000-mile route from\n' +
      'Independence, Missouri, to Oregon City, Oregon. It was\n' +
      'one of the main overland migration routes used during\n' +
      'the 1840s through the 1860s by hundreds of thousands of\n' +
      'American pioneers seeking fertile farmland in the West.\n\n' +
      'Travelers faced grueling conditions: river crossings,\n' +
      'disease, starvation, harsh weather, and treacherous\n' +
      'mountain passes. The journey typically took five to six\n' +
      'months by covered wagon.\n\n' +
      'Despite the hardships, the promise of free land and a\n' +
      'fresh start drew families westward in one of the largest\n' +
      'mass migrations in American history.';

    this._dialog = showDialog(this.screen, {
      title: 'The Oregon Trail',
      message,
      callback: () => {
        this._dialog = null;
        this.screen.render();
      },
    });
  }

  _showHighScoresPlaceholder() {
    if (this._dialog) return;
    this._dialog = showDialog(this.screen, {
      title: 'Top 10',
      message: tag(colors.muted, 'No high scores recorded yet.\n\nTravel the trail to earn your place!'),
      callback: () => {
        this._dialog = null;
        this.screen.render();
      },
    });
  }

  destroy() {
    if (this._dialog) {
      this._dialog.destroy();
      this._dialog = null;
    }
    this.keyHandlers.forEach(({ keys, handler }) => {
      this.screen.unkey(keys, handler);
    });
    this.keyHandlers = [];
    this.widgets.forEach((w) => {
      w.detach();
    });
    this.widgets = [];
    this.screen.render();
  }
}

module.exports = TitleScreen;
