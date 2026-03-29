const blessed = require('blessed');
const { colors, tag, bold, boldColor } = require('../ui/Theme');

let landmarkArt = {};
try {
  landmarkArt = require('../art/landmarks').landmarks;
} catch (_) {}

let conversations = {};
try {
  conversations = require('../data/conversations');
} catch (_) {}

const FORT_MULTIPLIERS = {
  'Fort Kearney': 1.5,
  'Fort Laramie': 1.75,
  'Fort Bridger': 2.0,
  'Fort Hall': 2.5,
  'Fort Boise': 3.0,
};

const STORE_ITEMS = [
  { key: 'food', name: 'Food', unit: 'lbs', basePrice: 0.2, increment: 50 },
  { key: 'clothing', name: 'Clothing', unit: 'sets', basePrice: 10, increment: 1 },
  { key: 'ammunition', name: 'Ammunition', unit: 'boxes', basePrice: 2, increment: 1 },
  { key: 'oxen', name: 'Oxen', unit: 'yoke', basePrice: 40, increment: 1 },
  { key: 'wheels', name: 'Wagon wheels', unit: 'each', basePrice: 10, increment: 1 },
  { key: 'axles', name: 'Wagon axles', unit: 'each', basePrice: 10, increment: 1 },
  { key: 'tongues', name: 'Wagon tongues', unit: 'each', basePrice: 10, increment: 1 },
];

class FortScreen {
  constructor(screen, gameState, onComplete, landmark) {
    this.screen = screen;
    this.gameState = gameState;
    this.onComplete = onComplete;
    this.landmark = landmark;
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.activeDialog = null;
    this.multiplier = FORT_MULTIPLIERS[landmark.name] || 2.0;

    this.init();
  }

  addWidget(w) {
    this.widgets.push(w);
    this.screen.append(w);
  }

  registerKey(keys, fn) {
    this.screen.key(keys, fn);
    this.keyHandlers.push({ keys, handler: fn });
  }

  destroy() {
    this.intervals.forEach((i) => clearInterval(i));
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.widgets.forEach((w) => w.detach());
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    if (this.activeDialog) {
      try {
        this.activeDialog.detach();
      } catch (_) {}
      this.activeDialog = null;
    }
    this.screen.render();
  }

  clearDialog() {
    if (this.activeDialog) {
      try {
        this.activeDialog.detach();
      } catch (_) {}
      this.activeDialog = null;
    }
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.keyHandlers = [];
  }

  init() {
    const art = landmarkArt[this.landmark.name] || null;

    this.artBox = blessed.box({
      top: 0,
      left: 'center',
      width: '100%',
      height: '45%',
      border: { type: 'line' },
      label: ` ${boldColor(colors.primary, this.landmark.name)} `,
      tags: true,
      align: 'center',
      valign: 'middle',
      content: art || tag(colors.muted, `Welcome to ${bold(this.landmark.name)}.`),
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(this.artBox);

    this.statusBox = blessed.box({
      top: '45%',
      left: 0,
      width: '100%',
      height: 3,
      border: { type: 'line' },
      tags: true,
      style: {
        border: { fg: colors.muted },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(this.statusBox);
    this.updateStatus();

    this.menuArea = blessed.box({
      top: '45%+3',
      left: 'center',
      width: '100%',
      height: '55%-3',
      tags: true,
      style: { fg: colors.text, bg: colors.bg },
    });
    this.addWidget(this.menuArea);

    this.showMainMenu();
  }

  updateStatus() {
    const gs = this.gameState;
    const sep = tag(colors.muted, ' │ ');
    const parts = [
      `${tag(colors.muted, 'Date:')} ${gs.getDateString()}`,
      `${tag(colors.muted, 'Cash:')} ${boldColor('green', '$' + gs.money.toFixed(2))}`,
      `${tag(colors.muted, 'Food:')} ${gs.supplies.food} lbs`,
      `${tag(colors.muted, 'Health:')} ${gs.getHealthStatus()}`,
    ];
    this.statusBox.setContent(parts.join(sep));
  }

  showMainMenu() {
    this.clearDialog();
    this.selectedIndex = 0;
    const items = [
      '1. Look around',
      '2. Buy supplies',
      '3. Rest at the fort',
      '4. Talk to people',
      '5. Trade',
      '6. Leave the fort',
    ];

    this.menuBox = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 44,
      height: items.length + 4,
      border: { type: 'line' },
      label: ` ${bold('What would you like to do?')} `,
      tags: true,
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1 },
    });
    this.activeDialog = this.menuBox;

    const renderMenu = () => {
      const lines = items.map((item, i) => {
        if (i === this.selectedIndex) {
          return bold(tag(colors.highlight, `▸ ${item}`));
        }
        return `  ${item}`;
      });
      this.menuBox.setContent(lines.join('\n'));
      this.screen.render();
    };

    renderMenu();

    this.registerKey(['up'], () => {
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      renderMenu();
    });
    this.registerKey(['down'], () => {
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      renderMenu();
    });
    this.registerKey(['enter', 'return'], () => {
      this.handleMenuChoice(this.selectedIndex);
    });

    for (let i = 1; i <= 6; i++) {
      this.registerKey([String(i)], () => {
        this.handleMenuChoice(i - 1);
      });
    }
  }

  handleMenuChoice(index) {
    switch (index) {
      case 0:
        this.showLookAround();
        break;
      case 1:
        this.showBuySupplies();
        break;
      case 2:
        this.showRest();
        break;
      case 3:
        this.showTalkToPeople();
        break;
      case 4:
        this.showTrade();
        break;
      case 5:
        this.destroy();
        if (this.onComplete) this.onComplete();
        break;
    }
  }

  // ── Look around ──────────────────────────────────────────────

  showLookAround() {
    this.clearDialog();
    const desc = this.landmark.description || `${this.landmark.name} is a frontier outpost.`;
    const box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 60,
      height: 10,
      border: { type: 'line' },
      label: ` ${bold(this.landmark.name)} `,
      tags: true,
      shadow: true,
      style: {
        border: { fg: colors.highlight },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: [
        tag(colors.text, desc),
        '',
        `${tag(colors.muted, 'Prices here are')} ${boldColor('yellow', (this.multiplier * 100).toFixed(0) + '% of Independence prices')}.`,
        '',
        tag(colors.muted, 'Press ENTER to go back'),
      ].join('\n'),
    });
    this.activeDialog = box;
    this.screen.render();

    this.registerKey(['enter', 'return', 'escape'], () => {
      this.showMainMenu();
    });
  }

  // ── Buy supplies ─────────────────────────────────────────────

  showBuySupplies() {
    this.clearDialog();
    this.storeIndex = 0;

    const box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 62,
      height: STORE_ITEMS.length + 8,
      border: { type: 'line' },
      label: ` ${bold('Buy Supplies')} `,
      tags: true,
      shadow: true,
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
    });
    this.activeDialog = box;

    const renderStore = () => {
      const gs = this.gameState;
      const lines = [
        `${tag(colors.muted, 'Cash:')} ${boldColor('green', '$' + gs.money.toFixed(2))}` +
          `   ${tag(colors.muted, 'Price multiplier:')} ${boldColor('yellow', this.multiplier.toFixed(1) + 'x')}`,
        '',
      ];

      STORE_ITEMS.forEach((item, i) => {
        const price = (item.basePrice * this.multiplier).toFixed(2);
        const owned = gs.supplies[item.key] || 0;
        const prefix = i === this.storeIndex ? bold(tag(colors.highlight, '▸ ')) : '  ';
        const label = i === this.storeIndex ? bold(tag(colors.highlight, item.name)) : item.name;
        lines.push(`${prefix}${label}  $${price}/${item.unit}  (have: ${owned})`);
      });

      lines.push('');
      lines.push(tag(colors.muted, 'ENTER to buy  │  ESC to go back'));
      box.setContent(lines.join('\n'));
      this.screen.render();
    };

    renderStore();

    this.registerKey(['up'], () => {
      this.storeIndex = (this.storeIndex - 1 + STORE_ITEMS.length) % STORE_ITEMS.length;
      renderStore();
    });
    this.registerKey(['down'], () => {
      this.storeIndex = (this.storeIndex + 1) % STORE_ITEMS.length;
      renderStore();
    });
    this.registerKey(['enter', 'return'], () => {
      this.buyItem(STORE_ITEMS[this.storeIndex], renderStore);
    });
    this.registerKey(['escape'], () => {
      this.updateStatus();
      this.showMainMenu();
    });
  }

  buyItem(item, renderStore) {
    const price = item.basePrice * this.multiplier;
    const qty = item.increment || 1;
    const cost = price * qty;

    if (this.gameState.money < cost) {
      this.showFlash(`Not enough money! Need $${cost.toFixed(2)}`, renderStore);
      return;
    }

    this.gameState.money -= cost;
    this.gameState.supplies[item.key] = (this.gameState.supplies[item.key] || 0) + qty;
    this.updateStatus();
    renderStore();
  }

  showFlash(msg, callback) {
    const flash = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: msg.length + 6,
      height: 3,
      border: { type: 'line' },
      tags: true,
      style: { border: { fg: colors.danger }, fg: colors.text, bg: colors.bg },
      padding: { left: 1, right: 1 },
      content: boldColor(colors.danger, msg),
    });
    this.screen.render();
    const t = setTimeout(() => {
      try {
        flash.detach();
      } catch (_) {}
      this.screen.render();
      if (callback) callback();
    }, 1200);
    this.intervals.push(t);
  }

  // ── Rest ─────────────────────────────────────────────────────

  showRest() {
    this.clearDialog();

    const box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 50,
      height: 7,
      border: { type: 'line' },
      label: ` ${bold('Rest at the Fort')} `,
      tags: true,
      shadow: true,
      style: {
        border: { fg: colors.highlight },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: [
        tag(colors.text, 'How many days would you like to rest? (1-9)'),
        '',
        tag(colors.muted, 'Press a number (1-9) or ESC to cancel'),
      ].join('\n'),
    });
    this.activeDialog = box;
    this.screen.render();

    for (let d = 1; d <= 9; d++) {
      this.registerKey([String(d)], () => {
        this.performRest(d);
      });
    }
    this.registerKey(['escape'], () => {
      this.showMainMenu();
    });
  }

  performRest(days) {
    this.clearDialog();
    this.gameState.addDays(days);

    // Heal party slightly
    const healed = [];
    for (const member of this.gameState.party) {
      if (member.health === 'dead') continue;
      if (typeof member.health === 'number' && member.health < 100) {
        const heal = Math.min(5 * days, 100 - member.health);
        member.health += heal;
        healed.push(member.name);
      } else if (member.health === 'very poor') {
        member.health = 'poor';
        healed.push(member.name);
      } else if (member.health === 'poor') {
        member.health = days >= 2 ? 'fair' : 'poor';
        if (days >= 2) healed.push(member.name);
      } else if (member.health === 'fair' && days >= 3) {
        member.health = 'good';
        healed.push(member.name);
      }
    }

    // Consume food during rest
    for (let i = 0; i < days; i++) {
      this.gameState.consumeFood();
    }

    const box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 50,
      height: 9,
      border: { type: 'line' },
      label: ` ${bold('Rest Complete')} `,
      tags: true,
      shadow: true,
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: [
        boldColor(colors.primary, `You rested for ${days} day${days > 1 ? 's' : ''}.`),
        '',
        healed.length > 0
          ? tag(colors.text, `${healed.join(', ')} feel${healed.length === 1 ? 's' : ''} better.`)
          : tag(colors.muted, 'The party is in the same condition.'),
        '',
        tag(colors.muted, 'Press ENTER to continue'),
      ].join('\n'),
    });
    this.activeDialog = box;
    this.updateStatus();
    this.screen.render();

    this.registerKey(['enter', 'return'], () => {
      this.showMainMenu();
    });
  }

  // ── Talk to people ───────────────────────────────────────────

  showTalkToPeople() {
    this.clearDialog();
    const fortConvos = conversations[this.landmark.name] || [];

    let content;
    if (fortConvos.length === 0) {
      content = tag(colors.muted, 'There is no one interesting to talk to here.');
    } else {
      const shuffled = fortConvos.slice().sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(2, shuffled.length));
      const lines = [];
      picked.forEach((c, i) => {
        if (i > 0) lines.push('');
        lines.push(boldColor(colors.secondary, c.speaker + ':'));
        lines.push(tag(colors.text, `"${c.text}"`));
      });
      content = lines.join('\n');
    }

    const box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 64,
      height: 14,
      border: { type: 'line' },
      label: ` ${bold('Talk to People')} `,
      tags: true,
      shadow: true,
      scrollable: true,
      style: {
        border: { fg: colors.highlight },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: content + '\n\n' + tag(colors.muted, 'Press ENTER to go back'),
    });
    this.activeDialog = box;
    this.screen.render();

    this.registerKey(['enter', 'return', 'escape'], () => {
      this.showMainMenu();
    });
  }

  // ── Trade ────────────────────────────────────────────────────

  showTrade() {
    this.clearDialog();

    const tradeGoods = [
      { key: 'food', name: 'food', unit: 'lbs', amounts: [30, 40, 50, 60, 80] },
      { key: 'clothing', name: 'sets of clothing', unit: 'sets', amounts: [1, 2, 3] },
      { key: 'ammunition', name: 'boxes of ammunition', unit: 'boxes', amounts: [2, 3, 5] },
      { key: 'oxen', name: 'oxen', unit: 'head', amounts: [1] },
    ];

    const offering = tradeGoods[Math.floor(Math.random() * tradeGoods.length)];
    const otherGoods = tradeGoods.filter((g) => g.key !== offering.key);
    const wanting = otherGoods[Math.floor(Math.random() * otherGoods.length)];

    const offerQty = offering.amounts[Math.floor(Math.random() * offering.amounts.length)];
    const wantQty = wanting.amounts[Math.floor(Math.random() * wanting.amounts.length)];

    const canTrade = (this.gameState.supplies[wanting.key] || 0) >= wantQty;

    const box = blessed.box({
      parent: this.menuArea,
      top: 0,
      left: 'center',
      width: 60,
      height: 10,
      border: { type: 'line' },
      label: ` ${bold('Trade Offer')} `,
      tags: true,
      shadow: true,
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: [
        boldColor(colors.secondary, 'A trader approaches you:'),
        '',
        tag(colors.text, `"I'll give you ${offerQty} ${offering.name}`),
        tag(colors.text, ` for ${wantQty} ${wanting.name}."`),
        '',
        canTrade
          ? `${boldColor(colors.highlight, 'Y')}${tag(colors.text, ' - Accept')}   ${boldColor(colors.highlight, 'N')}${tag(colors.text, ' - Decline')}`
          : tag(colors.danger, `You don't have enough ${wanting.name} to trade.`),
      ].join('\n'),
    });
    this.activeDialog = box;
    this.screen.render();

    if (canTrade) {
      this.registerKey(['y'], () => {
        this.gameState.supplies[wanting.key] -= wantQty;
        this.gameState.supplies[offering.key] = (this.gameState.supplies[offering.key] || 0) + offerQty;
        this.updateStatus();
        this.clearDialog();

        const resultBox = blessed.box({
          parent: this.menuArea,
          top: 0,
          left: 'center',
          width: 50,
          height: 6,
          border: { type: 'line' },
          tags: true,
          shadow: true,
          style: {
            border: { fg: colors.primary },
            fg: colors.text,
            bg: colors.bg,
          },
          padding: { left: 2, right: 2, top: 1, bottom: 1 },
          content: boldColor(colors.primary, 'Trade complete!') + '\n\n' + tag(colors.muted, 'Press ENTER to continue'),
        });
        this.activeDialog = resultBox;
        this.screen.render();
        this.registerKey(['enter', 'return'], () => {
          this.showMainMenu();
        });
      });
    }

    this.registerKey(['n', 'escape'], () => {
      this.showMainMenu();
    });
    if (!canTrade) {
      this.registerKey(['enter', 'return'], () => {
        this.showMainMenu();
      });
    }
  }
}

module.exports = FortScreen;
