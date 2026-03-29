const blessed = require('blessed');

let colors, tag, bold, boldColor;
try {
  ({ colors, tag, bold, boldColor } = require('../ui/Theme'));
} catch (_) {
  colors = {
    primary: 'green',
    secondary: 'yellow',
    danger: 'red',
    water: 'blue',
    text: 'white',
    bg: 'default',
    muted: 'gray',
    highlight: 'cyan',
  };
  tag = (c, t) => `{${c}-fg}${t}{/${c}-fg}`;
  bold = (t) => `{bold}${t}{/bold}`;
  boldColor = (c, t) => bold(tag(c, t));
}

let showDialog;
try {
  showDialog = require('../ui/DialogBox');
} catch (_) {
  showDialog = null;
}

let riverArt;
try {
  riverArt = require('../art/river');
} catch (_) {
  riverArt = {};
}

let landmarkArt = {};
try {
  landmarkArt = require('../art/landmarks').landmarks;
} catch (_) {}

const FLOW_LABELS = {
  calm: 'calm and steady',
  moderate: 'swift with a moderate current',
  swift: 'fast and treacherous',
};

class RiverScreen {
  constructor(screen, gameState, onComplete, river) {
    this.screen = screen;
    this.gameState = gameState;
    this.onComplete = onComplete;
    this.river = river;
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.currentDialog = null;

    const rd = this.river.riverData || {};
    const depthRange = rd.depth || [2, 6];
    const widthRange = rd.width || [100, 200];
    this.depth = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0]);
    this.depth = Math.round(this.depth * 10) / 10;
    this.width = Math.floor(widthRange[0] + Math.random() * (widthRange[1] - widthRange[0]));
    this.flow = rd.flow || 'moderate';
  }

  addWidget(widget) {
    this.widgets.push(widget);
    this.screen.append(widget);
  }

  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }

  clearKeys() {
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.keyHandlers = [];
  }

  destroy() {
    if (this.currentDialog) {
      this.currentDialog.destroy();
      this.currentDialog = null;
    }
    this.intervals.forEach((i) => clearInterval(i));
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.widgets.forEach((w) => w.detach());
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.screen.render();
  }

  // ── UI Construction ─────────────────────────────────────────

  create() {
    this._buildArtBox();
    this._buildInfoBox();
    this._buildMenuArea();
    this.showCrossingMenu();
  }

  _buildArtBox() {
    const widthCategory = this.width < 150 ? 'narrow' : this.width < 250 ? 'medium' : 'wide';
    const depthCategory = this.depth < 4 ? 'shallow' : 'deep';

    const art =
      landmarkArt[this.river.name] ||
      (typeof riverArt.riverScene === 'function' ? riverArt.riverScene(widthCategory, depthCategory) : '');

    const artBox = blessed.box({
      top: 0,
      left: 'center',
      width: '100%',
      height: '40%',
      border: { type: 'line' },
      label: ` ${boldColor(colors.water, this.river.name)} `,
      tags: true,
      align: 'center',
      valign: 'middle',
      content: art,
      style: {
        border: { fg: colors.water },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(artBox);
  }

  _buildInfoBox() {
    const flowText = FLOW_LABELS[this.flow] || this.flow;
    const riverName = this.river.name.replace(/ Crossing$/i, '');
    const dateStr = typeof this.gameState.getDateString === 'function' ? this.gameState.getDateString() : '';
    const weatherStr = this.gameState.weather || '';

    const lines = [
      `The ${boldColor(colors.water, riverName)} is ` +
        `${boldColor(colors.highlight, String(this.depth))} feet deep and ` +
        `${boldColor(colors.highlight, String(this.width))} feet across.`,
      `The current is ${tag(colors.secondary, flowText)}.`,
    ];

    if (weatherStr || dateStr) {
      const parts = [];
      if (weatherStr) parts.push(`Weather: ${tag(colors.highlight, weatherStr)}`);
      if (dateStr) parts.push(`Date: ${tag(colors.highlight, dateStr)}`);
      lines.push(parts.join('  |  '));
    }

    const infoBox = blessed.box({
      top: '40%',
      left: 'center',
      width: '100%',
      height: '25%',
      border: { type: 'line' },
      label: ` ${bold('River Conditions')} `,
      tags: true,
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1 },
      content: lines.join('\n'),
    });
    this.addWidget(infoBox);
    this.infoBox = infoBox;
  }

  _buildMenuArea() {
    this.menuArea = blessed.box({
      top: '65%',
      left: 'center',
      width: '100%',
      height: '35%',
      tags: true,
      style: { fg: colors.text, bg: colors.bg },
    });
    this.addWidget(this.menuArea);
  }

  // ── Crossing Options Menu ───────────────────────────────────

  showCrossingMenu() {
    this.clearKeys();
    if (this.menuBox) {
      try {
        this.menuBox.detach();
      } catch (_) {}
    }

    const rd = this.river.riverData || {};
    const ferryCost = rd.ferryCost || 0;
    const guideCost = this._getGuideCost();

    this.selectedIndex = 0;
    const actions = [];

    actions.push({ label: 'Attempt to ford the river', action: 'ford' });
    actions.push({ label: 'Caulk the wagon and float across', action: 'caulk' });

    if (rd.ferryAvailable) {
      actions.push({ label: `Take the ferry ($${ferryCost})`, action: 'ferry' });
    }
    if (rd.guideAvailable) {
      actions.push({ label: `Hire a guide ($${guideCost})`, action: 'guide' });
    }
    actions.push({ label: 'Wait to see if conditions improve', action: 'wait' });

    this.menuActions = actions;
    const menuItems = actions.map((a, i) => `${i + 1}. ${a.label}`);

    this.menuBox = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 56,
      height: menuItems.length + 4,
      border: { type: 'line' },
      label: ` ${bold('How do you want to cross?')} `,
      tags: true,
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1 },
    });

    const renderMenu = () => {
      const lines = menuItems.map((item, i) => {
        if (i === this.selectedIndex) {
          return bold(tag(colors.highlight, `▸ ${item}`));
        }
        return `  ${item}`;
      });
      this.menuBox.setContent(lines.join('\n'));
      this.screen.render();
    };
    renderMenu();

    this.registerKey(['up', 'k'], () => {
      this.selectedIndex = (this.selectedIndex - 1 + menuItems.length) % menuItems.length;
      renderMenu();
    });
    this.registerKey(['down', 'j'], () => {
      this.selectedIndex = (this.selectedIndex + 1) % menuItems.length;
      renderMenu();
    });
    this.registerKey(['enter', 'return'], () => {
      this._executeAction(this.menuActions[this.selectedIndex].action);
    });

    for (let i = 1; i <= menuItems.length; i++) {
      this.registerKey([String(i)], () => {
        this.selectedIndex = i - 1;
        this._executeAction(this.menuActions[i - 1].action);
      });
    }
  }

  _getGuideCost() {
    const rd = this.river.riverData || {};
    const base = rd.ferryCost || 10;
    return Math.ceil(base * 1.5);
  }

  _executeAction(action) {
    switch (action) {
      case 'ford':
        this.attemptFord();
        break;
      case 'caulk':
        this.attemptCaulk();
        break;
      case 'ferry':
        this.attemptFerry();
        break;
      case 'guide':
        this.attemptGuide();
        break;
      case 'wait':
        this.waitForConditions();
        break;
    }
  }

  // ── Ford the River ──────────────────────────────────────────

  attemptFord() {
    this.gameState.addDays(1);
    this.gameState.consumeFood();

    const roll = Math.random();
    let outcome;

    if (this.depth <= 2.5) {
      // Shallow: 90% safe, 10% minor
      outcome = roll < 0.9 ? 'safe' : 'minor';
    } else if (this.depth <= 4) {
      // Medium: 60% safe, 30% supply loss, 10% major
      if (roll < 0.6) outcome = 'safe';
      else if (roll < 0.9) outcome = 'supply';
      else outcome = 'major';
    } else {
      // Deep: 20% safe, 40% supply, 20% major, 20% catastrophic
      if (roll < 0.2) outcome = 'safe';
      else if (roll < 0.6) outcome = 'supply';
      else if (roll < 0.8) outcome = 'major';
      else outcome = 'catastrophic';
    }

    this._resolveCrossingOutcome(outcome);
  }

  // ── Caulk and Float ─────────────────────────────────────────

  attemptCaulk() {
    this.gameState.addDays(1);
    this.gameState.consumeFood();

    const roll = Math.random();
    let outcome;

    if (roll < 0.65) {
      outcome = 'safe';
    } else if (roll < 0.9) {
      outcome = 'minor';
    } else {
      outcome = 'major';
    }

    this._resolveCrossingOutcome(outcome);
  }

  // ── Take the Ferry ──────────────────────────────────────────

  attemptFerry() {
    const rd = this.river.riverData || {};
    const cost = rd.ferryCost || 0;

    if (this.gameState.money < cost) {
      this._showTemporaryMessage(boldColor(colors.danger, `You can't afford the ferry ($${cost})`), () =>
        this.showCrossingMenu(),
      );
      return;
    }

    this.gameState.money -= cost;
    this.gameState.addDays(1);
    this.gameState.consumeFood();

    this._showCrossingResult(
      true,
      [
        tag(colors.primary, `You safely crossed the ${this.river.name}!`),
        tag(colors.muted, `You paid $${cost} for the ferry.`),
      ].join('\n'),
    );
  }

  // ── Hire a Guide ────────────────────────────────────────────

  attemptGuide() {
    const cost = this._getGuideCost();

    if (this.gameState.money < cost) {
      this._showTemporaryMessage(boldColor(colors.danger, `You can't afford the guide ($${cost})`), () =>
        this.showCrossingMenu(),
      );
      return;
    }

    this.gameState.money -= cost;
    this.gameState.addDays(1);
    this.gameState.consumeFood();

    const roll = Math.random();
    if (roll < 0.95) {
      this._showCrossingResult(
        true,
        [
          tag(colors.primary, `You safely crossed the ${this.river.name}!`),
          tag(colors.muted, `The guide charged you $${cost}.`),
        ].join('\n'),
      );
    } else {
      this._resolveCrossingOutcome('minor');
    }
  }

  // ── Wait for Conditions ─────────────────────────────────────

  waitForConditions() {
    const daysToWait = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < daysToWait; i++) {
      this.gameState.addDays(1);
      this.gameState.consumeFood();
    }

    // Re-roll river depth and width
    const rd = this.river.riverData || {};
    const depthRange = rd.depth || [2, 6];
    const widthRange = rd.width || [100, 200];
    this.depth = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0]);
    this.depth = Math.round(this.depth * 10) / 10;
    this.width = Math.floor(widthRange[0] + Math.random() * (widthRange[1] - widthRange[0]));

    const plural = daysToWait === 1 ? 'day' : 'days';
    this._showTemporaryMessage(
      [
        tag(colors.secondary, `You waited ${daysToWait} ${plural}.`),
        '',
        `The river is now ${boldColor(colors.highlight, String(this.depth))} feet deep ` +
          `and ${boldColor(colors.highlight, String(this.width))} feet across.`,
      ].join('\n'),
      () => {
        // Rebuild entire screen with new conditions
        this.destroy();
        this.widgets = [];
        this.keyHandlers = [];
        this.intervals = [];
        this.currentDialog = null;
        this.create();
      },
    );
  }

  // ── Crossing Outcome Resolution ─────────────────────────────

  _resolveCrossingOutcome(outcome) {
    switch (outcome) {
      case 'safe':
        this._showCrossingResult(true, tag(colors.primary, `You safely crossed the ${this.river.name}!`));
        break;
      case 'minor':
        this._applySupplyLoss(false);
        break;
      case 'supply':
        this._applySupplyLoss(false);
        break;
      case 'major':
        this._applyMajorLoss();
        break;
      case 'catastrophic':
        this._applyCatastrophicLoss();
        break;
    }
  }

  _applySupplyLoss(includeOx) {
    const losses = [];
    const supplies = this.gameState.supplies;

    // Food loss: 10-50 lbs
    const foodLost = 10 + Math.floor(Math.random() * 41);
    supplies.food = Math.max(0, (supplies.food || 0) - foodLost);
    losses.push(`${foodLost} lbs of food`);

    // Clothing loss: 1-2 sets (50% chance)
    if (Math.random() < 0.5) {
      const clothLost = 1 + Math.floor(Math.random() * 2);
      supplies.clothing = Math.max(0, (supplies.clothing || 0) - clothLost);
      losses.push(`${clothLost} set${clothLost > 1 ? 's' : ''} of clothing`);
    }

    // Ammunition loss: 1 box (30% chance)
    if (Math.random() < 0.3) {
      supplies.ammunition = Math.max(0, (supplies.ammunition || 0) - 1);
      losses.push('1 box of ammunition');
    }

    if (includeOx && (supplies.oxen || 0) > 0) {
      supplies.oxen -= 1;
      losses.push('1 ox');
    }

    this._showCrossingResult(
      false,
      [
        boldColor(colors.secondary, 'The river crossing was rough.'),
        tag(colors.text, `You lost: ${losses.join(', ')}.`),
      ].join('\n'),
    );
  }

  _applyMajorLoss() {
    const losses = [];
    const supplies = this.gameState.supplies;

    // Food loss: 10-50 lbs
    const foodLost = 10 + Math.floor(Math.random() * 41);
    supplies.food = Math.max(0, (supplies.food || 0) - foodLost);
    losses.push(`${foodLost} lbs of food`);

    // Clothing loss: 1-2 sets
    const clothLost = 1 + Math.floor(Math.random() * 2);
    supplies.clothing = Math.max(0, (supplies.clothing || 0) - clothLost);
    losses.push(`${clothLost} set${clothLost > 1 ? 's' : ''} of clothing`);

    // Ammunition loss: 1 box
    if ((supplies.ammunition || 0) > 0) {
      supplies.ammunition -= 1;
      losses.push('1 box of ammunition');
    }

    // Lose 1 ox
    if ((supplies.oxen || 0) > 0) {
      supplies.oxen -= 1;
      losses.push('1 ox');
    }

    this._showCrossingResult(
      false,
      [
        boldColor(colors.danger, 'Disaster at the river crossing!'),
        tag(colors.text, `You lost: ${losses.join(', ')}.`),
      ].join('\n'),
    );
  }

  _applyCatastrophicLoss() {
    const losses = [];
    const supplies = this.gameState.supplies;

    // Food loss: 10-50 lbs
    const foodLost = 10 + Math.floor(Math.random() * 41);
    supplies.food = Math.max(0, (supplies.food || 0) - foodLost);
    losses.push(`${foodLost} lbs of food`);

    // Clothing loss: 1-2 sets
    const clothLost = 1 + Math.floor(Math.random() * 2);
    supplies.clothing = Math.max(0, (supplies.clothing || 0) - clothLost);
    losses.push(`${clothLost} set${clothLost > 1 ? 's' : ''} of clothing`);

    // Ammunition loss: 1 box
    if ((supplies.ammunition || 0) > 0) {
      supplies.ammunition -= 1;
      losses.push('1 box of ammunition');
    }

    // Lose 1 ox
    if ((supplies.oxen || 0) > 0) {
      supplies.oxen -= 1;
      losses.push('1 ox');
    }

    // 5-10% chance a party member drowns
    let drownedName = null;
    if (Math.random() < 0.1) {
      drownedName = this._drownPartyMember();
    }

    const resultLines = [
      boldColor(colors.danger, 'Disaster at the river crossing!'),
      tag(colors.text, `You lost: ${losses.join(', ')}.`),
    ];

    if (drownedName) {
      resultLines.push('');
      resultLines.push(boldColor(colors.danger, `${drownedName} drowned while crossing the river.`));
    }

    this._showCrossingResult(false, resultLines.join('\n'));
  }

  _drownPartyMember() {
    const alive =
      typeof this.gameState.getAliveMembers === 'function'
        ? this.gameState.getAliveMembers()
        : (this.gameState.party || []).filter((m) => m.health !== 'dead');

    if (alive.length === 0) return null;

    // Prefer non-leader (index > 0) unless leader is the only one
    let victim;
    if (alive.length > 1) {
      const candidates = alive.slice(1);
      victim = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      victim = alive[0];
    }

    victim.health = 'dead';
    victim._hp = 0;
    victim.causeOfDeath = 'drowning';

    return victim.name;
  }

  // ── Result & Message Display ────────────────────────────────

  _showCrossingResult(success, message, resultType) {
    this.clearKeys();
    if (this.menuBox) {
      try {
        this.menuBox.detach();
      } catch (_) {}
    }

    const onDone = () => {
      if (this.onComplete) this.onComplete(resultType || 'done');
    };

    if (showDialog) {
      this.currentDialog = showDialog(this.screen, {
        title: success ? ` ${bold('Safe Crossing')} ` : ` ${bold('River Crossing')} `,
        message: message + '\n\n' + tag(colors.muted, 'Press ENTER to continue'),
        callback: () => {
          this.currentDialog = null;
          onDone();
        },
      });
    } else {
      this._showResultBox(success, message, onDone);
    }
  }

  _showResultBox(success, message, callback) {
    const _box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 60,
      height: 12,
      border: { type: 'line' },
      label: ` ${bold(success ? 'Safe Crossing' : 'River Crossing')} `,
      tags: true,
      shadow: true,
      style: {
        border: { fg: success ? colors.primary : colors.danger },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: message + '\n\n' + tag(colors.muted, 'Press ENTER to continue'),
    });
    this.screen.render();

    this.registerKey(['enter', 'return'], () => {
      if (callback) callback();
    });
  }

  _showTemporaryMessage(message, callback) {
    this.clearKeys();
    if (this.menuBox) {
      try {
        this.menuBox.detach();
      } catch (_) {}
    }

    const box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 56,
      height: 9,
      border: { type: 'line' },
      tags: true,
      shadow: true,
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: message + '\n\n' + tag(colors.muted, 'Press ENTER to continue'),
    });
    this.screen.render();

    this.registerKey(['enter', 'return'], () => {
      try {
        box.detach();
      } catch (_) {}
      if (callback) callback();
    });
  }
}

module.exports = RiverScreen;
