'use strict';

const blessed = require('blessed');
const { colors, boxStyles, tag, bold, boldColor } = require('../ui/Theme');
const showDialog = require('../ui/DialogBox');

const storeItems = [
  { key: 'oxen', name: 'Oxen', price: 40, unit: 'yoke', description: '(a pair of oxen)' },
  { key: 'food', name: 'Food', price: 0.20, unit: 'lb', description: '(per pound)', buyIncrement: 50, displayPrice: '$10.00 per 50 lbs' },
  { key: 'clothing', name: 'Clothing', price: 10, unit: 'set', description: '(per set)' },
  { key: 'ammunition', name: 'Ammunition', price: 2, unit: 'box', description: '(box of 20 bullets)' },
  { key: 'wheels', name: 'Wagon wheels', price: 10, unit: 'each', description: '(spare wheel)' },
  { key: 'axles', name: 'Wagon axles', price: 10, unit: 'each', description: '(spare axle)' },
  { key: 'tongues', name: 'Wagon tongues', price: 10, unit: 'each', description: '(spare tongue)' },
];

class StoreScreen {
  constructor(screen, props) {
    this.screen = screen;
    this.engine = (props && props.engine) || null;
    this.gameState = (props && props.gameState) || null;
    this.onComplete = (props && props.onComplete) || null;
    this.widgets = [];
    this.keyHandlers = [];
    this._isBuying = false;

    // Initialize cash from gameState (set during profession selection)
    this.cash = (this.gameState && this.gameState.money) || 0;

    // Shopping cart
    this.cart = {};
    storeItems.forEach(item => { this.cart[item.key] = 0; });
  }

  addWidget(widget) {
    this.widgets.push(widget);
    this.screen.append(widget);
  }

  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }

  // ── Formatting helpers ───────────────────────────────────────

  formatMoney(amount) {
    return `$${amount.toFixed(2)}`;
  }

  getTotalSpent() {
    let total = 0;
    storeItems.forEach(item => {
      const qty = this.cart[item.key];
      if (item.buyIncrement) {
        total += qty * item.buyIncrement * item.price;
      } else {
        total += qty * item.price;
      }
    });
    return Math.round(total * 100) / 100;
  }

  getOwnedDisplay(item) {
    const qty = this.cart[item.key];
    if (item.buyIncrement) {
      const totalUnits = qty * item.buyIncrement;
      return `${totalUnits} ${item.unit}${totalUnits !== 1 ? 's' : ''}`;
    }
    if (item.unit === 'each') {
      return `${qty}`;
    }
    const plural = qty !== 1;
    return `${qty} ${item.unit}${plural ? 's' : ''}`;
  }

  getPriceDisplay(item) {
    if (item.displayPrice) return item.displayPrice;
    if (item.unit === 'each') return `${this.formatMoney(item.price)} each`;
    return `${this.formatMoney(item.price)}/${item.unit}`;
  }

  // ── Content builder ──────────────────────────────────────────

  buildContent() {
    const divider = tag(colors.muted, '\u2550'.repeat(54));
    const thinDiv = tag(colors.muted, '\u2500'.repeat(51));

    const lines = [
      divider,
      boldColor(colors.secondary, "  Matt's General Store \u2014 Independence, Missouri"),
      divider,
      '',
      `  Cash remaining: ${boldColor(colors.success, this.formatMoney(this.cash))}`,
      '',
      `  ${bold(tag(colors.highlight, 'Item'))}              ${bold(tag(colors.highlight, 'Price'))}              ${bold(tag(colors.highlight, 'Owned'))}`,
      `  ${thinDiv}`,
    ];

    storeItems.forEach((item, i) => {
      const num = tag(colors.highlight, `${i + 1}.`);
      const name = item.name.padEnd(18);
      const price = this.getPriceDisplay(item).padEnd(20);
      const owned = this.getOwnedDisplay(item);
      lines.push(`  ${num} ${name}${price}${owned}`);
    });

    lines.push(`  ${thinDiv}`);
    lines.push(`  Total bill: ${boldColor(colors.secondary, this.formatMoney(this.getTotalSpent()))}`);
    lines.push('');
    lines.push(`  ${tag(colors.muted, 'Press 1-7 to buy, ENTER to leave store')}`);

    return lines.join('\n');
  }

  // ── UI creation ──────────────────────────────────────────────

  create() {
    this.mainBox = blessed.box({
      top: 'center',
      left: 'center',
      width: '80%',
      height: '85%',
      border: { type: 'line' },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      tags: true,
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
    });
    this.addWidget(this.mainBox);

    this.refreshDisplay();

    // Number keys 1-7 to buy items
    for (let i = 1; i <= 7; i++) {
      this.registerKey([String(i)], () => {
        if (this._isBuying) return;
        this.promptBuy(storeItems[i - 1]);
      });
    }

    // ENTER to leave
    this.registerKey(['enter'], () => {
      if (this._isBuying) return;
      this.attemptLeave();
    });

    this.screen.render();
  }

  refreshDisplay() {
    this.mainBox.setContent(this.buildContent());
    this.screen.render();
  }

  // ── Buy prompt ───────────────────────────────────────────────

  promptBuy(item) {
    this._isBuying = true;

    const isFood = !!item.buyIncrement;
    const unitCost = isFood ? item.price * item.buyIncrement : item.price;
    const maxAfford = Math.floor(this.cash / unitCost);

    let promptMsg;
    if (isFood) {
      promptMsg =
        `Food is sold in ${item.buyIncrement} lb sacks for ${this.formatMoney(unitCost)} each.\n` +
        `You can afford ${maxAfford} sack${maxAfford !== 1 ? 's' : ''}.\n\n` +
        'How many sacks would you like to buy?';
    } else {
      promptMsg =
        `${item.name}: ${this.getPriceDisplay(item)} ${item.description}\n` +
        `You can afford ${maxAfford}.\n\n` +
        `How many would you like to buy?`;
    }

    const dialogWidth = Math.min(52, Math.floor(this.screen.width * 0.6));

    const dialog = blessed.box({
      top: 'center',
      left: 'center',
      width: dialogWidth,
      height: 12,
      label: ` ${boldColor(colors.highlight, item.name)} `,
      ...boxStyles.dialog,
    });
    this.screen.append(dialog);

    blessed.text({
      parent: dialog,
      top: 0,
      left: 0,
      width: '100%-4',
      tags: true,
      content: tag(colors.text, promptMsg),
      style: { fg: colors.text, bg: colors.bg },
    });

    const input = blessed.textbox({
      parent: dialog,
      bottom: 0,
      left: 0,
      width: '100%-4',
      height: 1,
      inputOnFocus: true,
      style: {
        fg: colors.text,
        bg: colors.bg,
        focus: { fg: colors.highlight, bg: colors.bg },
      },
    });

    input.on('submit', (value) => {
      const qty = parseInt(value, 10);
      dialog.destroy();

      if (isNaN(qty) || qty <= 0) {
        this._isBuying = false;
        this.refreshDisplay();
        return;
      }

      const cost = qty * unitCost;
      if (cost > this.cash) {
        this._showError(`Not enough cash! That would cost ${this.formatMoney(cost)}.`, () => {
          this._isBuying = false;
          this.refreshDisplay();
        });
        return;
      }

      this.cart[item.key] += qty;
      this.cash = Math.round((this.cash - cost) * 100) / 100;
      this._isBuying = false;
      this.refreshDisplay();
    });

    input.on('cancel', () => {
      dialog.destroy();
      this._isBuying = false;
      this.refreshDisplay();
    });

    this.screen.render();
    input.focus();
  }

  _showError(message, cb) {
    showDialog(this.screen, {
      title: ' Error ',
      message: boldColor(colors.danger, message),
      callback: () => { if (cb) cb(); },
    });
  }

  // ── Leave store ──────────────────────────────────────────────

  attemptLeave() {
    if (this.cart.oxen === 0) {
      this._isBuying = true;
      showDialog(this.screen, {
        title: ' Warning ',
        message: boldColor(colors.danger, 'You need at least 1 yoke of oxen to start!'),
        callback: () => {
          this._isBuying = false;
          this.refreshDisplay();
        },
      });
      return;
    }

    if (this.cart.food === 0) {
      this._isBuying = true;
      showDialog(this.screen, {
        title: ' Warning ',
        message: boldColor(colors.secondary, 'Are you sure? You have no food!'),
        choices: ['Yes, leave the store', 'No, keep shopping'],
        callback: (index) => {
          this._isBuying = false;
          if (index === 0) {
            this.finalize();
          } else {
            this.refreshDisplay();
          }
        },
      });
      return;
    }

    this.finalize();
  }

  finalize() {
    // Transfer cart to gameState supplies
    if (this.gameState) {
      storeItems.forEach(item => {
        const qty = this.cart[item.key];
        if (item.buyIncrement) {
          this.gameState.supplies[item.key] += qty * item.buyIncrement;
        } else {
          this.gameState.supplies[item.key] += qty;
        }
      });
      this.gameState.money = this.cash;
    }

    if (this.onComplete) {
      this.onComplete();
      return;
    }
    if (this.engine) {
      this.engine.startTravel();
    }
  }

  destroy() {
    this.keyHandlers.forEach(({ keys, handler }) => {
      this.screen.unkey(keys, handler);
    });
    this.keyHandlers = [];
    this.widgets.forEach(w => { w.detach(); });
    this.widgets = [];
    this.screen.render();
  }
}

module.exports = StoreScreen;
