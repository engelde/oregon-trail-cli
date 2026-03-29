'use strict';

const blessed = require('blessed');
const { colors, tag, bold, boldColor } = require('../ui/Theme');

let victoryArt = '';
try { victoryArt = require('../art/misc').victory || ''; } catch (_) {}

let landmarkArt = {};
try { landmarkArt = require('../art/landmarks').landmarks || {}; } catch (_) {}

class VictoryScreen {
  constructor(screen, gameState, onComplete) {
    this.screen = screen;
    this.gameState = gameState;
    this.onComplete = onComplete;
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
  }

  addWidget(widget) { this.widgets.push(widget); this.screen.append(widget); }

  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }

  create() {
    const gs = this.gameState;
    const alive = gs.getAliveMembers();
    const dead = gs.party.filter(m => m.health === 'dead');
    const supplies = gs.supplies;

    // ── Score calculation ──────────────────────────────────────

    const survivorCount = alive.length;
    const partyPoints = survivorCount * 500;
    const foodPoints = Math.floor((supplies.food || 0) / 25) * 5;
    const clothingPoints = (supplies.clothing || 0) * 15;
    const ammoPoints = (supplies.ammunition || 0) * 10;
    const oxenPoints = (supplies.oxen || 0) * 50;
    const spareCount = (supplies.wheels || 0) + (supplies.axles || 0) + (supplies.tongues || 0);
    const sparePoints = spareCount * 20;
    const cashPoints = Math.floor((gs.money || 0) / 5) * 2;
    const subtotal = partyPoints + foodPoints + clothingPoints + ammoPoints
      + oxenPoints + sparePoints + cashPoints;
    const multiplier = gs.getProfessionMultiplier();
    const profLabel = (gs.profession || 'unknown').charAt(0).toUpperCase()
      + (gs.profession || 'unknown').slice(1);
    const finalScore = subtotal * multiplier;

    // ── Helpers ────────────────────────────────────────────────

    const fmt = (n) => Number(n).toLocaleString('en-US');
    const fmtMoney = (n) => '$' + Number(n).toFixed(2);

    const COL = 42;
    const scoreLine = (label, value) => {
      const valStr = fmt(value);
      const pad = Math.max(1, COL - label.length);
      return `  ${tag(colors.text, label)}${boldColor('green', valStr.padStart(pad))}`;
    };

    // ── Art ────────────────────────────────────────────────────

    const artText = victoryArt
      || landmarkArt['Willamette Valley (Oregon City)']
      || '';

    // ── Assemble content ──────────────────────────────────────

    const lines = [];

    // Section 1: Celebration art
    if (artText) {
      lines.push(artText);
      lines.push('');
    }

    // Section 2: Congratulations message
    lines.push(boldColor(colors.primary, '  Congratulations!'));
    lines.push(tag(colors.text, '  You have arrived in Oregon City, Willamette Valley!'));
    lines.push(tag(colors.muted, `  Date of arrival: ${gs.getDateString()}`));
    lines.push('');

    // Section 3: Party status
    lines.push(boldColor(colors.secondary, '  Party members who survived the journey:'));
    lines.push('');
    for (const m of alive) {
      const healthStr = m.health || 'good';
      lines.push(
        `  ${tag('green', '✓')} ${tag(colors.text, m.name)}` +
        ` ${tag(colors.muted, '—')} ${tag(colors.text, 'Health:')}` +
        ` ${tag('green', healthStr)}`
      );
    }
    for (const m of dead) {
      lines.push(
        `  ${tag('red', '✗')} ${tag(colors.text, m.name)}` +
        ` ${tag(colors.muted, '—')} ${tag('red', 'Did not survive')}`
      );
    }
    lines.push('');
    lines.push(
      tag(colors.text, `  ${survivorCount} of ${gs.party.length} party members survived.`)
    );
    lines.push('');

    // Section 4: Score breakdown
    lines.push(boldColor(colors.secondary, '  Points breakdown:'));
    lines.push(tag(colors.muted, '  ' + '─'.repeat(50)));

    lines.push(scoreLine(
      `Surviving party members:  ${survivorCount} × 500 =`, partyPoints
    ));
    lines.push(tag(colors.text, '  Remaining supplies:'));
    lines.push(scoreLine(`    Food (${fmt(supplies.food || 0)} lbs):`, foodPoints));
    lines.push(scoreLine(`    Clothing (${supplies.clothing || 0} sets):`, clothingPoints));
    lines.push(scoreLine(`    Ammunition (${supplies.ammunition || 0} boxes):`, ammoPoints));
    lines.push(scoreLine(`    Oxen (${supplies.oxen || 0}):`, oxenPoints));
    lines.push(scoreLine(`    Spare parts (${spareCount}):`, sparePoints));
    lines.push(scoreLine(
      `  Remaining cash:  ${fmtMoney(gs.money || 0)} →`, cashPoints
    ));

    lines.push(tag(colors.muted, '  ' + '─'.repeat(50)));
    lines.push(scoreLine('  Subtotal:', subtotal));
    lines.push(
      tag(colors.text, `  Profession multiplier (${profLabel}):`) +
      boldColor(colors.secondary, `  ×${multiplier}`)
    );
    lines.push(tag(colors.muted, '  ' + '─'.repeat(50)));
    lines.push('');
    lines.push(
      `  ${boldColor(colors.highlight, 'FINAL SCORE:')}` +
      `  ${boldColor(colors.secondary, fmt(finalScore))}`
    );
    lines.push('');

    // Section 5: Prompt
    lines.push(tag(colors.muted, '  Press ENTER to see the Top 10 list'));

    // ── Main scrollable box ───────────────────────────────────

    const contentBox = blessed.box({
      top: 0,
      left: 'center',
      width: '95%',
      height: '100%',
      border: { type: 'line' },
      label: ` ${boldColor(colors.secondary, '★ VICTORY ★')} `,
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { style: { bg: colors.primary } },
      keys: true,
      vi: true,
      mouse: true,
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1, top: 1, bottom: 1 },
      content: lines.join('\n'),
    });
    this.addWidget(contentBox);

    this.screen.render();

    // ── Key binding ───────────────────────────────────────────

    this.registerKey(['enter', 'return'], () => {
      if (this.onComplete) this.onComplete(finalScore);
    });
  }

  destroy() {
    this.intervals.forEach(i => clearInterval(i));
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.widgets.forEach(w => w.detach());
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.screen.render();
  }
}

module.exports = VictoryScreen;
