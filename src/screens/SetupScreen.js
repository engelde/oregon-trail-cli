'use strict';

const blessed = require('blessed');
const { colors, tag, bold, boldColor } = require('../ui/Theme');

const PROFESSIONS = [
  { label: 'Be a banker from Boston', profession: 'banker', money: 1600, multiplier: 1, difficulty: 'easy' },
  { label: 'Be a carpenter from Ohio', profession: 'carpenter', money: 800, multiplier: 2, difficulty: 'medium' },
  { label: 'Be a farmer from Illinois', profession: 'farmer', money: 400, multiplier: 3, difficulty: 'hard' },
];

const DEFAULT_COMPANIONS = ['Sara', 'Johnny', 'Lucy', 'Tommy'];

const MONTHS = [
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
];

class SetupScreen {
  constructor(screen, props) {
    this.screen = screen;
    this.engine = (props && props.engine) || null;
    this.gameState = (props && props.gameState) || null;
    this.onComplete = (props && props.onComplete) || null;
    this.widgets = [];
    this.keyHandlers = [];
    this.step = 1;
    this._selectedIndex = 0;
    this._leaderName = '';
    this._companionNames = [];
    this._companionIndex = 0;
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
    this._showStep1();
  }

  // ── Step 1: Profession Selection ─────────────────────────────

  _showStep1() {
    this._clearWidgets();
    this._selectedIndex = 0;

    const headerBox = blessed.box({
      top: 2,
      left: 'center',
      width: 62,
      height: 6,
      content:
        'Many kinds of people made the trip to Oregon.\n\n' +
        'You may:',
      tags: true,
      border: { type: 'line' },
      padding: { left: 2, right: 2, top: 1 },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
    });
    this.addWidget(headerBox);

    this.menuBox = blessed.box({
      top: 8,
      left: 'center',
      width: 62,
      height: PROFESSIONS.length + 6,
      border: { type: 'line' },
      label: ` ${boldColor(colors.primary, 'Choose your profession')} `,
      tags: true,
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
    });
    this.addWidget(this.menuBox);
    this._renderProfessionMenu();

    // Info box with money / score details
    const infoBox = blessed.box({
      top: 8 + PROFESSIONS.length + 6,
      left: 'center',
      width: 62,
      height: 5,
      content: tag(colors.muted,
        'Bankers start with the most money but earn fewer\n' +
        'points. Farmers start with the least but earn the\n' +
        'highest score multiplier.'),
      tags: true,
      border: { type: 'line' },
      padding: { left: 2, right: 2 },
      style: {
        border: { fg: colors.muted },
        fg: colors.muted,
        bg: colors.bg,
      },
    });
    this.addWidget(infoBox);

    this.registerKey(['up', 'k'], () => {
      this._selectedIndex = (this._selectedIndex - 1 + PROFESSIONS.length) % PROFESSIONS.length;
      this._renderProfessionMenu();
    });

    this.registerKey(['down', 'j'], () => {
      this._selectedIndex = (this._selectedIndex + 1) % PROFESSIONS.length;
      this._renderProfessionMenu();
    });

    this.registerKey(['enter'], () => {
      this._selectProfession(this._selectedIndex);
    });

    for (let i = 1; i <= 3; i++) {
      this.registerKey([String(i)], () => {
        this._selectedIndex = i - 1;
        this._renderProfessionMenu();
        this._selectProfession(i - 1);
      });
    }

    this.screen.render();
  }

  _renderProfessionMenu() {
    const lines = PROFESSIONS.map((p, i) => {
      const num = `${i + 1}`;
      const money = `$${p.money}`;
      const mult = `Score \u00d7${p.multiplier}`;
      if (i === this._selectedIndex) {
        return `{green-bg}{white-fg}{bold} ${num}. ${p.label.padEnd(28)} ${money.padEnd(8)} ${mult} {/bold}{/white-fg}{/green-bg}`;
      }
      return `{green-fg} ${num}. ${p.label.padEnd(28)}{/green-fg} ${tag(colors.secondary, money.padEnd(8))} ${tag(colors.muted, mult)}`;
    });
    lines.push('');
    lines.push(tag(colors.muted, 'What is your choice?'));
    this.menuBox.setContent(lines.join('\n'));
    this.screen.render();
  }

  _selectProfession(index) {
    const chosen = PROFESSIONS[index];
    if (this.gameState) {
      this.gameState.profession = chosen.profession;
      this.gameState.money = chosen.money;
    }
    this.step = 2;
    this._showStep2();
  }

  // ── Step 2: Name the wagon leader ────────────────────────────

  _showStep2() {
    this._clearWidgets();

    const promptBox = blessed.box({
      top: 2,
      left: 'center',
      width: 62,
      height: 7,
      content: 'What is the first name of the wagon leader?',
      tags: true,
      border: { type: 'line' },
      padding: { left: 2, right: 2, top: 1 },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
    });
    this.addWidget(promptBox);

    const textInput = blessed.textbox({
      top: 9,
      left: 'center',
      width: 62,
      height: 3,
      border: { type: 'line' },
      padding: { left: 1 },
      style: {
        border: { fg: colors.highlight },
        fg: colors.text,
        bg: colors.bg,
        focus: { border: { fg: colors.secondary } },
      },
      inputOnFocus: true,
    });
    this.addWidget(textInput);

    textInput.on('submit', (value) => {
      const name = (value || '').trim();
      if (!name) {
        textInput.clearValue();
        textInput.focus();
        this.screen.render();
        return;
      }
      this._leaderName = name;
      if (this.gameState) {
        this.gameState.party = [{ name, health: 'good' }];
      }
      this._companionIndex = 0;
      this._companionNames = [];
      this.step = 3;
      this._showStep3();
    });

    textInput.on('cancel', () => {
      // Escape goes back to profession selection
      this.step = 1;
      this._showStep1();
    });

    textInput.focus();
    this.screen.render();
  }

  // ── Step 3: Name companions ──────────────────────────────────

  _showStep3() {
    this._clearWidgets();

    const ordinal = this._companionIndex + 1;
    const defaultName = DEFAULT_COMPANIONS[this._companionIndex];

    const promptBox = blessed.box({
      top: 2,
      left: 'center',
      width: 62,
      height: 7,
      content:
        `What is the first name of companion #${ordinal}?\n\n` +
        tag(colors.muted, `(Leave blank for "${defaultName}")`),
      tags: true,
      border: { type: 'line' },
      padding: { left: 2, right: 2, top: 1 },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
    });
    this.addWidget(promptBox);

    // Show party members entered so far
    if (this._leaderName || this._companionNames.length > 0) {
      const partyLines = [bold(tag(colors.secondary, 'Party so far:'))];
      partyLines.push(`  1. ${this._leaderName} ${tag(colors.muted, '(leader)')}`);
      this._companionNames.forEach((n, i) => {
        partyLines.push(`  ${i + 2}. ${n}`);
      });
      const partyBox = blessed.box({
        top: 9,
        left: 'center',
        width: 62,
        height: partyLines.length + 2,
        content: partyLines.join('\n'),
        tags: true,
        border: { type: 'line' },
        padding: { left: 2, right: 2 },
        style: {
          border: { fg: colors.muted },
          fg: colors.text,
          bg: colors.bg,
        },
      });
      this.addWidget(partyBox);
    }

    const inputTop = 9 + (this._leaderName ? this._companionNames.length + 4 : 0);
    const textInput = blessed.textbox({
      top: inputTop,
      left: 'center',
      width: 62,
      height: 3,
      border: { type: 'line' },
      padding: { left: 1 },
      style: {
        border: { fg: colors.highlight },
        fg: colors.text,
        bg: colors.bg,
        focus: { border: { fg: colors.secondary } },
      },
      inputOnFocus: true,
    });
    this.addWidget(textInput);

    textInput.on('submit', (value) => {
      const name = (value || '').trim() || defaultName;
      this._companionNames.push(name);
      if (this.gameState) {
        this.gameState.party.push({ name, health: 'good' });
      }
      this._companionIndex++;
      if (this._companionIndex < 4) {
        this._showStep3();
      } else {
        this.step = 4;
        this._showStep4();
      }
    });

    textInput.on('cancel', () => {
      // Use default name on escape
      const name = defaultName;
      this._companionNames.push(name);
      if (this.gameState) {
        this.gameState.party.push({ name, health: 'good' });
      }
      this._companionIndex++;
      if (this._companionIndex < 4) {
        this._showStep3();
      } else {
        this.step = 4;
        this._showStep4();
      }
    });

    textInput.focus();
    this.screen.render();
  }

  // ── Step 4: Departure Month ──────────────────────────────────

  _showStep4() {
    this._clearWidgets();
    this._selectedIndex = 0;

    const headerBox = blessed.box({
      top: 2,
      left: 'center',
      width: 62,
      height: 8,
      content:
        'It is 1848. When would you like to leave Independence?\n\n' +
        tag(colors.muted, 'You should leave between March and July.\n') +
        tag(colors.muted, 'Tip: April or May is best for grass and weather.'),
      tags: true,
      border: { type: 'line' },
      padding: { left: 2, right: 2, top: 1 },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
    });
    this.addWidget(headerBox);

    this.menuBox = blessed.box({
      top: 10,
      left: 'center',
      width: 62,
      height: MONTHS.length + 4,
      border: { type: 'line' },
      label: ` ${boldColor(colors.primary, 'Departure month')} `,
      tags: true,
      padding: { left: 2, right: 2, top: 1, bottom: 0 },
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
    });
    this.addWidget(this.menuBox);
    this._renderMonthMenu();

    this.registerKey(['up', 'k'], () => {
      this._selectedIndex = (this._selectedIndex - 1 + MONTHS.length) % MONTHS.length;
      this._renderMonthMenu();
    });

    this.registerKey(['down', 'j'], () => {
      this._selectedIndex = (this._selectedIndex + 1) % MONTHS.length;
      this._renderMonthMenu();
    });

    this.registerKey(['enter'], () => {
      this._selectMonth(this._selectedIndex);
    });

    for (let i = 1; i <= 5; i++) {
      this.registerKey([String(i)], () => {
        this._selectedIndex = i - 1;
        this._renderMonthMenu();
        this._selectMonth(i - 1);
      });
    }

    this.screen.render();
  }

  _renderMonthMenu() {
    const lines = MONTHS.map((m, i) => {
      const num = `${i + 1}`;
      if (i === this._selectedIndex) {
        return `{green-bg}{white-fg}{bold} ${num}. ${m.label.padEnd(20)}{/bold}{/white-fg}{/green-bg}`;
      }
      return `{green-fg} ${num}. ${m.label}{/green-fg}`;
    });
    this.menuBox.setContent(lines.join('\n'));
    this.screen.render();
  }

  _selectMonth(index) {
    const chosen = MONTHS[index];
    if (this.gameState) {
      this.gameState.date.month = chosen.value;
      this.gameState.date.day = 1;
      this.gameState.date.year = 1848;
    }
    this._finish();
  }

  _finish() {
    if (this.onComplete) {
      this.onComplete();
      return;
    }
    if (this.engine) {
      this.engine.showStore();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────

  _clearWidgets() {
    this.keyHandlers.forEach(({ keys, handler }) => {
      this.screen.unkey(keys, handler);
    });
    this.keyHandlers = [];
    this.widgets.forEach(w => { w.detach(); });
    this.widgets = [];
  }

  destroy() {
    this._clearWidgets();
    this.screen.render();
  }
}

module.exports = SetupScreen;
