const blessed = require('blessed');
const { colors, tag, bold, boldColor } = require('../ui/Theme');
const showDialog = require('../ui/DialogBox');

let wagonFrames;
try {
  ({ wagonFrames } = require('../art/wagon'));
} catch (_) {
  wagonFrames = ['[====WAGON====]'];
}

let landmarks;
try {
  landmarks = require('../data/landmarks');
} catch (_) {
  landmarks = [];
}

const TOTAL_MILES = 1907;

const WEATHER_ICONS = {
  clear: '\u2600', // ☀
  fair: '\u263c', // ☼
  cloudy: '\u2601', // ☁
  rain: '\u2602', // ☂
  'heavy rain': '\u2614', // ☔
  snow: '\u2744', // ❄
  fog: '\u2248', // ≈
  hail: '\u2022', // •
};

// ── Pseudo-random seeded by position for stable scrolling ───────

function _hash(x, y, seed) {
  let h = (seed * 2654435761) ^ (x * 2246822519) ^ (y * 3266489917);
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  return ((h >>> 16) ^ h) & 0x7fffffff;
}

// ── Terrain generation ──────────────────────────────────────────

function generateTerrain(miles, width, height) {
  const scroll = Math.floor(miles / 2);
  const lines = [];

  if (miles < 300) {
    // ── Plains: flat Kansas grassland ──
    for (let r = 0; r < height; r++) {
      let line = '';
      for (let c = 0; c < width; c++) {
        const wc = c + scroll;
        const h = _hash(wc, r, 1);
        const v = h % 100;
        if (r < 2) {
          // sky
          line += ' ';
        } else if (r === 2 && v < 3) {
          line += '~';
        } else if (r >= height - 2) {
          // ground detail
          if (v < 8) line += '"';
          else if (v < 14) line += ',';
          else if (v < 18) line += "'";
          else if (v < 22) line += '.';
          else if (v < 25) line += '`';
          else line += ' ';
        } else {
          if (v < 5) line += '.';
          else if (v < 8) line += ',';
          else if (v < 10) line += "'";
          else line += ' ';
        }
      }
      if (r < 2) {
        lines.push(line);
      } else {
        lines.push(`{green-fg}${line}{/green-fg}`);
      }
    }
    return lines.join('\n');
  } else if (miles < 640) {
    // ── Prairie / rolling hills (Nebraska) ──
    const horizon = Math.floor(height * 0.35);
    for (let r = 0; r < height; r++) {
      let line = '';
      for (let c = 0; c < width; c++) {
        const wc = c + scroll;
        const h = _hash(wc, r, 2);
        const v = h % 100;

        if (r < horizon - 2) {
          line += ' ';
        } else if (r < horizon) {
          // rolling hill silhouette
          const wave = Math.sin(wc * 0.08) * 2 + Math.sin(wc * 0.03) * 1.5;
          const hillRow = horizon - 1 - r;
          if (hillRow < wave) {
            if (v < 15) line += '.';
            else line += ' ';
          } else {
            line += ' ';
          }
        } else if (r === horizon) {
          // horizon line
          const wave = Math.sin(wc * 0.08) * 1;
          if (wave > 0.3) {
            line += '_';
          } else if (v < 20) {
            line += '-';
          } else {
            line += '~';
          }
        } else {
          // grass
          if (v < 6) line += '"';
          else if (v < 10) line += ',';
          else if (v < 13) line += '.';
          else if (v < 15) line += "'";
          else line += ' ';
        }
      }
      if (r < horizon) {
        lines.push(line);
      } else if (r === horizon) {
        lines.push(`{yellow-fg}${line}{/yellow-fg}`);
      } else {
        lines.push(`{green-fg}${line}{/green-fg}`);
      }
    }
    return lines.join('\n');
  } else if (miles < 1025) {
    // ── Rocky Mountains (Wyoming) ──
    const skyH = Math.floor(height * 0.15);
    const peakZone = Math.floor(height * 0.45);

    // Generate peak positions seeded by scroll
    const peaks = [];
    for (let i = 0; i < 5; i++) {
      const px = _hash(i, 0, scroll * 7 + 99) % width;
      const ph = 2 + (_hash(i, 1, scroll * 7 + 99) % (peakZone - 2));
      peaks.push({ x: px, h: ph });
    }

    for (let r = 0; r < height; r++) {
      const chars = [];
      for (let c = 0; c < width; c++) {
        const wc = c + scroll;
        const h = _hash(wc, r, 3);
        const v = h % 100;

        if (r < skyH) {
          chars.push({ ch: ' ', color: null });
        } else if (r < skyH + peakZone) {
          const mtnRow = r - skyH;
          let inMtn = false;
          let isEdge = false;
          let isSnow = false;

          for (const p of peaks) {
            const dist = Math.abs(c - p.x);
            const mtnHeight = p.h;
            const slope = mtnHeight - mtnRow;
            if (slope >= 0 && dist <= slope) {
              inMtn = true;
              if (dist === slope) isEdge = true;
              if (mtnRow < Math.floor(mtnHeight * 0.3)) isSnow = true;
            }
          }

          if (isEdge) {
            chars.push({
              ch: c < (peaks.find((p) => Math.abs(c - p.x) === p.h - mtnRow)?.x || c) ? '/' : '\\',
              color: isSnow ? 'white' : 'gray',
            });
          } else if (inMtn) {
            const mc = isSnow ? (v < 30 ? '^' : v < 50 ? '*' : ' ') : v < 10 ? '.' : v < 15 ? ':' : ' ';
            chars.push({ ch: mc, color: isSnow ? 'white' : 'gray' });
          } else {
            chars.push({ ch: ' ', color: null });
          }
        } else {
          // Foothills/scrub
          if (v < 4) chars.push({ ch: '.', color: 'green' });
          else if (v < 7) chars.push({ ch: ',', color: 'green' });
          else if (v < 9) chars.push({ ch: '~', color: 'yellow' });
          else chars.push({ ch: ' ', color: null });
        }
      }

      // Build colored line
      let line = '';
      let curColor = null;
      for (const { ch, color } of chars) {
        if (color !== curColor) {
          if (curColor) line += `{/${curColor}-fg}`;
          if (color) line += `{${color}-fg}`;
          curColor = color;
        }
        line += ch;
      }
      if (curColor) line += `{/${curColor}-fg}`;
      lines.push(line);
    }
    return lines.join('\n');
  } else if (miles < 1340) {
    // ── High desert / volcanic plateau (Idaho) ──
    const skyH = Math.floor(height * 0.25);
    for (let r = 0; r < height; r++) {
      let line = '';
      for (let c = 0; c < width; c++) {
        const wc = c + scroll;
        const h = _hash(wc, r, 4);
        const v = h % 100;

        if (r < skyH) {
          line += ' ';
        } else if (r === skyH) {
          // distant mesa silhouette
          const mesa = Math.sin(wc * 0.04) * 0.5 + Math.sin(wc * 0.09) * 0.3;
          line += mesa > 0.2 ? '_' : mesa > -0.1 ? '-' : ' ';
        } else {
          // desert floor
          if (v < 3) line += '.';
          else if (v < 5) line += ',';
          else if (v < 7)
            line += 'v'; // sagebrush
          else if (v < 8) line += '~';
          else if (v < 9) line += ':';
          else line += ' ';
        }
      }
      if (r <= skyH) {
        lines.push(`{yellow-fg}${line}{/yellow-fg}`);
      } else {
        lines.push(`{yellow-fg}${line}{/yellow-fg}`);
      }
    }
    return lines.join('\n');
  } else if (miles < 1630) {
    // ── Forest & mountains (Blue Mountains, Oregon) ──
    const skyH = Math.floor(height * 0.2);
    const treeZone = Math.floor(height * 0.4);

    for (let r = 0; r < height; r++) {
      let line = '';
      for (let c = 0; c < width; c++) {
        const wc = c + scroll;
        const h = _hash(wc, r, 5);
        const v = h % 100;

        if (r < skyH) {
          // distant peaks
          const pk = Math.sin(wc * 0.05) * 2 + Math.sin(wc * 0.12) * 1;
          if (skyH - r < pk) {
            line += v < 40 ? '^' : '/';
          } else {
            line += ' ';
          }
        } else if (r < skyH + treeZone) {
          // dense forest
          if (v < 12)
            line += '\u2191'; // ↑ trees
          else if (v < 20) line += '|';
          else if (v < 25) line += '/';
          else if (v < 28) line += '\\';
          else if (v < 32) line += '.';
          else line += ' ';
        } else {
          // forest floor
          if (v < 8) line += ',';
          else if (v < 14) line += '.';
          else if (v < 18) line += "'";
          else if (v < 20) line += '"';
          else line += ' ';
        }
      }
      if (r < skyH) {
        lines.push(`{white-fg}${line}{/white-fg}`);
      } else {
        lines.push(`{green-fg}${line}{/green-fg}`);
      }
    }
    return lines.join('\n');
  } else {
    // ── Lush Willamette Valley (Oregon) ──
    const skyH = Math.floor(height * 0.2);
    for (let r = 0; r < height; r++) {
      let line = '';
      for (let c = 0; c < width; c++) {
        const wc = c + scroll;
        const h = _hash(wc, r, 6);
        const v = h % 100;

        if (r < skyH) {
          // light clouds and birds
          if (v < 2) line += '~';
          else line += ' ';
        } else if (r === skyH) {
          // gentle tree line
          if (v < 15)
            line += '\u2191'; // ↑
          else if (v < 22) line += '|';
          else if (v < 28) line += '/';
          else if (v < 33) line += '\\';
          else line += ' ';
        } else {
          // lush meadow
          if (v < 10) line += '"';
          else if (v < 18) line += ',';
          else if (v < 24) line += '.';
          else if (v < 28) line += "'";
          else if (v < 31) line += '`';
          else line += ' ';
        }
      }
      if (r < skyH) {
        lines.push(`{blue-fg}${line}{/blue-fg}`);
      } else if (r === skyH) {
        lines.push(`{green-fg}${line}{/green-fg}`);
      } else {
        lines.push(`{bright-green-fg}${line}{/bright-green-fg}`);
      }
    }
    return lines.join('\n');
  }
}

// ── Progress bar ────────────────────────────────────────────────

function progressBar(current, total, width) {
  const pct = Math.min(1, Math.max(0, current / total));
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const bar = tag(colors.primary, '\u2588'.repeat(filled)) + tag(colors.muted, '\u2591'.repeat(empty));
  return `[${bar}]`;
}

// ── TravelScreen class ──────────────────────────────────────────

class TravelScreen {
  /**
   * @param {blessed.screen} screen
   * @param {Object} props — { engine, gameState } from ScreenManager,
   *                          OR pass gameState & callbacks directly
   * @param {Object} [callbacks] — optional { onTick, onHunt, onTrade, onRest, onContinue }
   */
  constructor(screen, propsOrGameState, callbacks) {
    this.screen = screen;
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.traveling = false;
    this.wagonFrame = 0;
    this.menuVisible = false;
    this._dialogHandle = null;

    // Support both ScreenManager pattern (screen, props) and direct (screen, gameState, callbacks)
    if (propsOrGameState?.engine) {
      this.engine = propsOrGameState.engine;
      this.gameState = propsOrGameState.gameState;
      this.callbacks = propsOrGameState.callbacks || null;
    } else if (callbacks) {
      this.engine = null;
      this.gameState = propsOrGameState;
      this.callbacks = callbacks;
    } else {
      this.engine = null;
      this.gameState = propsOrGameState;
      this.callbacks = null;
    }
  }

  addWidget(widget) {
    this.widgets.push(widget);
    this.screen.append(widget);
  }

  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }

  // ── Lifecycle ───────────────────────────────────────────────

  create() {
    // Layout for 80×24: terrain 0-12, status 13-18, controls 19-23
    const terrainHeight = 13;
    const statusHeight = 6;
    const bottomTop = terrainHeight + statusHeight;
    const sh = this.screen.height || 24;
    const bottomHeight = Math.max(5, sh - bottomTop);

    // ── Top: terrain + wagon (rows 0-12) ──
    this.terrainBox = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: terrainHeight,
      tags: true,
      style: { fg: 'white', bg: 'default' },
    });
    this.addWidget(this.terrainBox);

    // ── Middle: status info (rows 13-18) ──
    this.statusBox = blessed.box({
      top: terrainHeight,
      left: 0,
      width: '100%',
      height: statusHeight,
      label: ` ${tag(colors.primary, 'Trail Status')} `,
      border: { type: 'line' },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      tags: true,
      padding: { left: 1, right: 1 },
    });
    this.addWidget(this.statusBox);

    // ── Bottom: controls (rows 19-23) ──
    this.bottomBox = blessed.box({
      top: bottomTop,
      left: 0,
      width: '100%',
      height: bottomHeight,
      tags: true,
      border: { type: 'line' },
      style: {
        border: { fg: colors.muted },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(this.bottomBox);

    // SPACE toggles travel / menu
    this._spaceHandler = () => {
      if (this._dialogHandle) return; // dialog open, ignore
      if (this.traveling) {
        this.stopTravel();
      } else if (!this.menuVisible) {
        this.startTravel();
      }
    };
    this.registerKey(['space'], this._spaceHandler);

    // Listen for tick events from GameEngine (engine-driven mode)
    this._tickHandler = () => this.updateDisplay(this.gameState);
    this.screen.on('tick', this._tickHandler);

    // Initial render + start
    this.updateDisplay(this.gameState);
    this.startTravel();
  }

  destroy() {
    this.stopTravel();
    this.intervals.forEach((i) => clearInterval(i));
    if (this._tickHandler) {
      this.screen.removeListener('tick', this._tickHandler);
      this._tickHandler = null;
    }
    this._cleanupMenu();
    if (this._dialogHandle) {
      this._dialogHandle.destroy();
      this._dialogHandle = null;
    }
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.widgets.forEach((w) => w.detach());
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.screen.render();
  }

  // ── Travel control ──────────────────────────────────────────

  startTravel() {
    if (this.traveling) return;
    this.traveling = true;
    this.menuVisible = false;
    this._cleanupMenu();

    if (this.callbacks?.onTick) {
      // Self-managed travel loop via callbacks
      this._travelInterval = setInterval(() => {
        const result = this.callbacks.onTick();
        if (result) {
          // Something happened — pause and let caller handle
          this.stopTravel();
          return;
        }
        // Normal tick: advance wagon frame, update display
        this.wagonFrame = (this.wagonFrame + 1) % wagonFrames.length;
        this.updateDisplay(this.gameState);
      }, 800);
      this.intervals.push(this._travelInterval);
    } else if (this.engine) {
      // Engine-driven mode
      this.engine.resumeTravel();
    }

    // Wagon animation (runs independently at a faster rate for smooth movement)
    this._animInterval = setInterval(() => {
      if (this.traveling) {
        this.wagonFrame = (this.wagonFrame + 1) % wagonFrames.length;
        this.renderTerrain();
        this.screen.render();
      }
    }, 400);
    this.intervals.push(this._animInterval);

    this._showTravelPrompt();
    this.screen.render();
  }

  stopTravel() {
    if (!this.traveling) return;
    this.traveling = false;

    // Clear travel-specific intervals
    if (this._travelInterval) {
      clearInterval(this._travelInterval);
      this.intervals = this.intervals.filter((i) => i !== this._travelInterval);
      this._travelInterval = null;
    }
    if (this._animInterval) {
      clearInterval(this._animInterval);
      this.intervals = this.intervals.filter((i) => i !== this._animInterval);
      this._animInterval = null;
    }

    if (this.engine) {
      this.engine.pauseTravel();
    }

    this.showMenu();
    this.screen.render();
  }

  // ── Display ─────────────────────────────────────────────────

  updateDisplay(gameState) {
    if (gameState) this.gameState = gameState;
    this.renderTerrain();
    this.renderStatus();
    this.screen.render();
  }

  renderTerrain() {
    const w = this.terrainBox.width || 80;
    const h = this.terrainBox.height || 13;
    const miles = this.gameState.milesTraveled;

    // Terrain fills top portion; wagon goes in the bottom rows
    const wagonLines = (wagonFrames[this.wagonFrame] || wagonFrames[0] || '[WAGON]').split('\n');
    const wagonH = wagonLines.length;
    const terrainH = Math.max(1, h - wagonH);

    const terrain = generateTerrain(miles, w, terrainH);

    // Compose: terrain on top, wagon below
    const content = terrain + '\n' + (this.traveling ? wagonFrames[this.wagonFrame] || wagonFrames[0] : wagonFrames[0]);

    this.terrainBox.setContent(content);
  }

  renderStatus() {
    const gs = this.gameState;
    const healthStatus = gs.getHealthStatus();

    // Health with contextual color
    const healthColor =
      healthStatus === 'good' ? colors.primary : healthStatus === 'fair' ? colors.secondary : colors.danger;
    const healthText =
      healthStatus === 'very poor'
        ? boldColor(colors.danger, 'Very Poor')
        : tag(healthColor, healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1));

    // Weather with icon
    const weather = gs.weather || 'clear';
    const weatherCap = weather.charAt(0).toUpperCase() + weather.slice(1);
    const weatherIcon = WEATHER_ICONS[weather] || WEATHER_ICONS.clear;
    const weatherColor =
      weather === 'rain' || weather === 'heavy rain'
        ? colors.water
        : weather === 'snow'
          ? 'white'
          : weather === 'clear' || weather === 'fair'
            ? colors.secondary
            : colors.muted;

    // Next landmark
    let nextLandmarkText = tag(colors.muted, 'None');
    const nextLm = landmarks[gs.nextLandmarkIndex];
    if (nextLm) {
      const dist = Math.max(0, nextLm.mile - gs.milesTraveled);
      nextLandmarkText = `${tag(colors.highlight, nextLm.name)} ${tag(colors.muted, '(' + dist + ' miles)')}`;
    }

    const paceDisplay = gs.pace.charAt(0).toUpperCase() + gs.pace.slice(1);
    const rationsDisplay = gs.rations.charAt(0).toUpperCase() + gs.rations.slice(1);
    const foodColor =
      gs.supplies.food < 50 ? colors.danger : gs.supplies.food < 150 ? colors.secondary : colors.primary;

    const bar = progressBar(gs.milesTraveled, TOTAL_MILES, 30);

    const statusLines = [
      `${tag(colors.muted, 'Date:')} ${bold(gs.getDateString())}          ${tag(colors.muted, 'Weather:')} ${tag(weatherColor, weatherCap + ' ' + weatherIcon)}`,
      `${tag(colors.muted, 'Health:')} ${healthText}                   ${tag(colors.muted, 'Pace:')} ${tag(colors.text, paceDisplay)}`,
      `${tag(colors.muted, 'Food:')} ${tag(foodColor, gs.supplies.food + ' lbs')}                  ${tag(colors.muted, 'Rations:')} ${tag(colors.text, rationsDisplay)}`,
      `${tag(colors.muted, 'Next landmark:')} ${nextLandmarkText}`,
    ];

    // Only add progress bar if we have room
    const sw = (this.statusBox.width || 80) - 4;
    if (sw >= 50) {
      statusLines.push(
        `${tag(colors.muted, 'Miles traveled:')} ${boldColor(colors.secondary, String(gs.milesTraveled))} ${tag(colors.muted, '/ ' + TOTAL_MILES)}  ${bar}`,
      );
    } else {
      statusLines.push(
        `${tag(colors.muted, 'Miles:')} ${boldColor(colors.secondary, String(gs.milesTraveled))} ${tag(colors.muted, '/ ' + TOTAL_MILES)}`,
      );
    }

    this.statusBox.setContent(statusLines.join('\n'));
  }

  // ── Bottom area ─────────────────────────────────────────────

  _showTravelPrompt() {
    this.menuVisible = false;
    this._cleanupMenu();
    this.bottomBox.setContent(
      `\n  ${tag(colors.muted, 'Press')} ${boldColor(colors.highlight, 'SPACE')} ${tag(colors.muted, 'to stop and access trail menu')}`,
    );
  }

  showMenu() {
    this.menuVisible = true;

    const menuItems = [
      '1. Continue on trail',
      '2. Check supplies',
      '3. Look at map',
      '4. Change pace',
      '5. Change food rations',
      '6. Stop to rest',
      '7. Attempt to trade',
      '8. Hunt for food',
    ];

    this._menuIndex = 0;
    this._menuItems = menuItems;
    this._renderMenu();

    // Menu key handlers
    this._menuUpHandler = () => {
      if (!this.menuVisible) return;
      this._menuIndex = (this._menuIndex - 1 + menuItems.length) % menuItems.length;
      this._renderMenu();
      this.screen.render();
    };
    this._menuDownHandler = () => {
      if (!this.menuVisible) return;
      this._menuIndex = (this._menuIndex + 1) % menuItems.length;
      this._renderMenu();
      this.screen.render();
    };
    this._menuEnterHandler = () => {
      if (!this.menuVisible) return;
      this._handleMenuChoice(this._menuIndex);
    };
    this._menuNumberHandler = (ch) => {
      if (!this.menuVisible) return;
      const num = parseInt(ch, 10);
      if (num >= 1 && num <= menuItems.length) {
        this._menuIndex = num - 1;
        this._handleMenuChoice(this._menuIndex);
      }
    };

    this.registerKey(['up'], this._menuUpHandler);
    this.registerKey(['down'], this._menuDownHandler);
    this.registerKey(['enter', 'return'], this._menuEnterHandler);
    this.registerKey(['1', '2', '3', '4', '5', '6', '7', '8'], this._menuNumberHandler);
  }

  hideMenu() {
    this.menuVisible = false;
    this._cleanupMenu();
    this._showTravelPrompt();
    this.screen.render();
  }

  _renderMenu() {
    if (!this._menuItems) return;

    // Display in two columns to fit the bottom section
    const items = this._menuItems;
    const half = Math.ceil(items.length / 2);
    const lineRows = [];

    for (let i = 0; i < half; i++) {
      const leftIdx = i;
      const rightIdx = i + half;
      const left = leftIdx < items.length ? this._formatMenuItem(leftIdx, items[leftIdx]) : '';
      const right = rightIdx < items.length ? this._formatMenuItem(rightIdx, items[rightIdx]) : '';
      lineRows.push(` ${left.padEnd(34)}${right}`);
    }

    this.bottomBox.setContent(lineRows.join('\n'));
  }

  _formatMenuItem(index, label) {
    if (index === this._menuIndex) {
      return bold(tag(colors.highlight, '\u25b8 ' + label));
    }
    return `  ${label}`;
  }

  _cleanupMenu() {
    const handlers = [
      { ref: '_menuUpHandler', keys: ['up'] },
      { ref: '_menuDownHandler', keys: ['down'] },
      { ref: '_menuEnterHandler', keys: ['enter', 'return'] },
      { ref: '_menuNumberHandler', keys: ['1', '2', '3', '4', '5', '6', '7', '8'] },
    ];
    for (const { ref, keys } of handlers) {
      if (this[ref]) {
        this.screen.unkey(keys, this[ref]);
        this.keyHandlers = this.keyHandlers.filter((k) => k.handler !== this[ref]);
        this[ref] = null;
      }
    }
    this._menuItems = null;
  }

  // ── Menu actions ────────────────────────────────────────────

  _handleMenuChoice(index) {
    this._cleanupMenu();

    switch (index) {
      case 0:
        return this._doContinue();
      case 1:
        return this._showSupplies();
      case 2:
        return this._showMap();
      case 3:
        return this._changePace();
      case 4:
        return this._changeRations();
      case 5:
        return this._stopToRest();
      case 6:
        return this._attemptTrade();
      case 7:
        return this._huntForFood();
      default:
        return this._doContinue();
    }
  }

  _doContinue() {
    if (this.callbacks?.onContinue) {
      this.callbacks.onContinue();
    }
    this.startTravel();
  }

  _showSupplies() {
    const s = this.gameState.supplies;
    const pad = 15;
    const message = [
      `${tag(colors.highlight, 'Oxen:'.padEnd(pad))}  ${bold(String(s.oxen))}`,
      `${tag(colors.highlight, 'Food:'.padEnd(pad))}  ${bold(s.food + ' lbs')}`,
      `${tag(colors.highlight, 'Clothing:'.padEnd(pad))}  ${bold(s.clothing + ' sets')}`,
      `${tag(colors.highlight, 'Ammunition:'.padEnd(pad))}  ${bold(s.ammunition + ' boxes')}`,
      `${tag(colors.highlight, 'Spare wheels:'.padEnd(pad))}  ${bold(String(s.wheels))}`,
      `${tag(colors.highlight, 'Spare axles:'.padEnd(pad))}  ${bold(String(s.axles))}`,
      `${tag(colors.highlight, 'Spare tongues:'.padEnd(pad))} ${bold(String(s.tongues))}`,
      '',
      `${tag(colors.secondary, 'Money:')} ${boldColor(colors.secondary, '$' + this.gameState.money.toFixed(2))}`,
    ].join('\n');

    this._dialogHandle = showDialog(this.screen, {
      title: ' Supplies ',
      message,
      callback: () => {
        this._dialogHandle = null;
        this.showMenu();
      },
    });
  }

  _showMap() {
    const miles = this.gameState.milesTraveled;
    const nextIdx = this.gameState.nextLandmarkIndex;

    const mapLines = landmarks.map((lm, i) => {
      const passed = miles >= lm.mile;
      const isNext = i === nextIdx;
      const marker = passed
        ? tag(colors.primary, '\u2713') // ✓
        : isNext
          ? boldColor(colors.highlight, '\u25b6') // ▶
          : tag(colors.muted, '\u00b7'); // ·

      const nameColor = isNext ? colors.highlight : passed ? colors.primary : colors.muted;

      const pointer = isNext ? boldColor(colors.highlight, ' \u25c4 NEXT') : '';
      const mileStr = tag(colors.muted, 'mi ' + String(lm.mile).padStart(5));
      return ` ${marker} ${tag(nameColor, lm.name.padEnd(30))} ${mileStr}${pointer}`;
    });

    mapLines.push('');
    mapLines.push(`  ${tag(colors.secondary, '\u25c6 Your position: mile ' + miles + ' / ' + TOTAL_MILES)}`);

    this._dialogHandle = showDialog(this.screen, {
      title: ' Trail Map ',
      message: mapLines.join('\n'),
      callback: () => {
        this._dialogHandle = null;
        this.showMenu();
      },
    });
  }

  _changePace() {
    const descriptions = [
      `Steady ${tag(colors.muted, '(12-17 mi/day) — balanced, safest option')}`,
      `Strenuous ${tag(colors.muted, '(16-23 mi/day) — faster but tiring')}`,
      `Grueling ${tag(colors.muted, '(20-29 mi/day) — fastest, high health risk')}`,
    ];

    this._dialogHandle = showDialog(this.screen, {
      title: ' Change Pace ',
      message: `Current pace: ${boldColor(colors.highlight, this.gameState.pace)}`,
      choices: descriptions,
      callback: (index) => {
        this._dialogHandle = null;
        if (index !== null) {
          const paces = ['steady', 'strenuous', 'grueling'];
          this.gameState.pace = paces[index];
          this.updateDisplay(this.gameState);
        }
        this.showMenu();
      },
    });
  }

  _changeRations() {
    const descriptions = [
      `Filling ${tag(colors.muted, '(3 lbs/person/day) — keeps health up')}`,
      `Meager ${tag(colors.muted, '(2 lbs/person/day) — conserves food')}`,
      `Bare-bones ${tag(colors.muted, '(1 lb/person/day) — desperate times')}`,
    ];

    this._dialogHandle = showDialog(this.screen, {
      title: ' Change Rations ',
      message: `Current rations: ${boldColor(colors.highlight, this.gameState.rations)}`,
      choices: descriptions,
      callback: (index) => {
        this._dialogHandle = null;
        if (index !== null) {
          const rations = ['filling', 'meager', 'bare-bones'];
          this.gameState.rations = rations[index];
          this.updateDisplay(this.gameState);
        }
        this.showMenu();
      },
    });
  }

  _stopToRest() {
    const choices = [];
    for (let d = 1; d <= 9; d++) {
      choices.push(`${d} day${d > 1 ? 's' : ''}`);
    }
    choices.push('Cancel');

    this._dialogHandle = showDialog(this.screen, {
      title: ' Rest ',
      message: `How many days would you like to rest? ${tag(colors.muted, '(1-9)')}`,
      choices,
      callback: (index) => {
        this._dialogHandle = null;
        if (index !== null && index < 9) {
          const days = index + 1;

          if (this.callbacks?.onRest) {
            this.callbacks.onRest(days);
          } else {
            // Default behaviour: advance days and consume food
            this.gameState.addDays(days);
            for (let d = 0; d < days; d++) {
              this.gameState.consumeFood();
            }
          }

          this.updateDisplay(this.gameState);

          this._dialogHandle = showDialog(this.screen, {
            title: ' Rest Complete ',
            message: `You rested for ${bold(String(days))} day${days > 1 ? 's' : ''}.`,
            callback: () => {
              this._dialogHandle = null;
              this.showMenu();
            },
          });
          return;
        }
        this.showMenu();
      },
    });
  }

  _attemptTrade() {
    if (this.callbacks?.onTrade) {
      this.callbacks.onTrade();
      return;
    }

    // Built-in trade logic
    const tradeItems = ['food', 'clothing', 'ammunition'];
    const offerItem = tradeItems[Math.floor(Math.random() * tradeItems.length)];
    const wantItem = tradeItems[Math.floor(Math.random() * tradeItems.length)];

    if (offerItem === wantItem) {
      this._dialogHandle = showDialog(this.screen, {
        title: ' Trade ',
        message: tag(colors.muted, 'No one in the area wants to trade right now.'),
        callback: () => {
          this._dialogHandle = null;
          this.showMenu();
        },
      });
      return;
    }

    const offerAmount = 10 + Math.floor(Math.random() * 40);
    const wantAmount = 10 + Math.floor(Math.random() * 40);
    const unit = (item) => (item === 'food' ? ' lbs' : item === 'ammunition' ? ' boxes' : ' sets');

    this._dialogHandle = showDialog(this.screen, {
      title: ' Trade Offer ',
      message: [
        'A traveler wants to trade:',
        '',
        `  You give: ${boldColor(colors.danger, offerAmount + unit(offerItem) + ' of ' + offerItem)}`,
        `  You get:  ${boldColor(colors.primary, wantAmount + unit(wantItem) + ' of ' + wantItem)}`,
      ].join('\n'),
      choices: ['Accept trade', 'Decline'],
      callback: (index) => {
        this._dialogHandle = null;
        if (index === 0) {
          if (this.gameState.supplies[offerItem] >= offerAmount) {
            this.gameState.supplies[offerItem] -= offerAmount;
            this.gameState.supplies[wantItem] += wantAmount;
            this.updateDisplay(this.gameState);
            this._dialogHandle = showDialog(this.screen, {
              title: ' Trade Complete ',
              message: tag(
                colors.primary,
                `Traded ${offerAmount}${unit(offerItem)} of ${offerItem} for ${wantAmount}${unit(wantItem)} of ${wantItem}.`,
              ),
              callback: () => {
                this._dialogHandle = null;
                this.showMenu();
              },
            });
          } else {
            this._dialogHandle = showDialog(this.screen, {
              title: ' Trade Failed ',
              message: tag(colors.danger, `You don't have enough ${offerItem} for this trade.`),
              callback: () => {
                this._dialogHandle = null;
                this.showMenu();
              },
            });
          }
          return;
        }
        this.showMenu();
      },
    });
  }

  _huntForFood() {
    if (this.callbacks?.onHunt) {
      this.callbacks.onHunt();
      return;
    }

    if (this.gameState.supplies.ammunition <= 0) {
      this._dialogHandle = showDialog(this.screen, {
        title: ' Hunt ',
        message: tag(colors.danger, "You don't have any ammunition to hunt with."),
        callback: () => {
          this._dialogHandle = null;
          this.showMenu();
        },
      });
      return;
    }

    // Try launching the dedicated HuntingScreen
    try {
      const HuntingScreen = require('./HuntingScreen');
      this._cleanupMenu();
      /* eslint-disable-next-line no-new */
      new HuntingScreen(this.screen, this.gameState, (foodGathered) => {
        this.updateDisplay(this.gameState);
        this._dialogHandle = showDialog(this.screen, {
          title: ' Hunt Complete ',
          message: `You brought back ${boldColor(colors.primary, foodGathered + ' lbs')} of food.`,
          callback: () => {
            this._dialogHandle = null;
            this.showMenu();
          },
        });
      });
    } catch (_) {
      // Fallback — simple random hunt
      const food = 15 + Math.floor(Math.random() * 35);
      this._dialogHandle = showDialog(this.screen, {
        title: ' Hunt ',
        message: [
          'You head out to hunt...',
          '',
          'You bag some game.',
          '',
          boldColor(colors.primary, `+${food} lbs of food`),
        ].join('\n'),
        callback: () => {
          this._dialogHandle = null;
          this.gameState.supplies.food += food;
          this.gameState.supplies.ammunition = Math.max(0, this.gameState.supplies.ammunition - 1);
          this.updateDisplay(this.gameState);
          this.showMenu();
        },
      });
    }
  }
}

module.exports = TravelScreen;
