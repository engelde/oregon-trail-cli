'use strict';

const blessed = require('blessed');
const { colors, tag, bold, boldColor } = require('../ui/Theme');

let tombstoneArt = {};
try { tombstoneArt = require('../art/tombstone'); } catch (_) { /* graceful fallback */ }

let miscArt = {};
try { miscArt = require('../art/misc'); } catch (_) { /* graceful fallback */ }

class DeathScreen {
  constructor(screen, props) {
    this.screen = screen;
    this.engine = props.engine;
    this.gameState = props.gameState;
    this.member = props.member;
    this.cause = props.cause || 'unknown causes';
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
  }

  addWidget(widget) {
    this.widgets.push(widget);
    this.screen.append(widget);
  }

  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }

  _isGameOver() {
    const party = this.gameState.party;
    const isLeader = party.length > 0 &&
      (this.member === party[0] || this.member.name === party[0].name);
    const nooneAlive = !this.gameState.isPartyAlive();
    return isLeader || nooneAlive;
  }

  _healthTag(health) {
    const map = {
      good: colors.primary,
      fair: colors.secondary,
      poor: colors.danger,
      'very poor': colors.danger,
      dead: colors.muted,
    };
    return tag(map[health] || colors.text, health);
  }

  // ── Build UI ──────────────────────────────────────────────────

  create() {
    const gameOver = this._isGameOver();
    const displayName = this.member.name || 'Unknown';
    const dateStr = this.gameState.getDateString();

    // Tombstone art (with fallback)
    let stone = '';
    if (typeof tombstoneArt.tombstone === 'function') {
      stone = tombstoneArt.tombstone(displayName, this.cause, dateStr);
    } else if (tombstoneArt.grave) {
      stone = tombstoneArt.grave;
    } else {
      stone = bold('R.I.P.') + '\n' + displayName + '\n' + this.cause + '\n' + dateStr;
    }

    const stoneLines = stone.split('\n').length;

    // ── Tombstone ───────────────────────────────────────────────
    const artBox = blessed.box({
      top: 1,
      left: 'center',
      width: '80%',
      height: stoneLines + 2,
      tags: true,
      align: 'center',
      valign: 'middle',
      content: stone,
      style: { fg: colors.text, bg: colors.bg },
    });
    this.addWidget(artBox);

    let nextTop = stoneLines + 3;

    if (gameOver) {
      this._buildGameOverLayout(displayName, nextTop);
    } else {
      this._buildMournLayout(displayName, nextTop);
    }

    this.screen.render();

    // Delay before accepting input for somber pause
    const delay = setTimeout(() => {
      if (gameOver) {
        this.registerKey(['enter', 'return'], () => {
          this.destroy();
          this.engine.showGameOver();
        });
      } else {
        this.registerKey(['enter', 'return'], () => {
          this.destroy();
          this.engine.startTravel();
        });
      }
      this.screen.render();
    }, 1500);
    this.intervals.push(delay);
  }

  _buildGameOverLayout(displayName, top) {
    const lines = [
      boldColor(colors.danger, `${displayName} has died of ${this.cause}.`),
      '',
      tag(colors.muted, 'Your journey has come to an end.'),
    ];

    const msgBox = blessed.box({
      top,
      left: 'center',
      width: '80%',
      height: 5,
      border: { type: 'line' },
      tags: true,
      align: 'center',
      valign: 'middle',
      content: lines.join('\n'),
      style: { border: { fg: colors.danger }, fg: colors.text, bg: colors.bg },
      padding: { left: 2, right: 2 },
    });
    this.addWidget(msgBox);

    // Game Over ASCII art
    const goArt = miscArt.gameOver || boldColor(colors.danger, 'GAME OVER');
    const goLines = goArt.split('\n').length;
    const goBox = blessed.box({
      top: top + 5,
      left: 'center',
      width: '80%',
      height: goLines + 2,
      tags: true,
      align: 'center',
      valign: 'middle',
      content: goArt,
      style: { fg: colors.text, bg: colors.bg },
    });
    this.addWidget(goBox);

    const promptBox = blessed.box({
      top: top + 5 + goLines + 2,
      left: 'center',
      width: '80%',
      height: 3,
      tags: true,
      align: 'center',
      valign: 'middle',
      content: tag(colors.muted, 'Press ENTER to continue'),
      style: { fg: colors.muted, bg: colors.bg },
    });
    this.addWidget(promptBox);
  }

  _buildMournLayout(displayName, top) {
    // Remaining alive members
    const alive = this.gameState.getAliveMembers();
    const partyLines = alive.map(
      m => `  ${tag(colors.text, m.name)}: ${this._healthTag(m.health)}`
    );

    const lines = [
      boldColor(colors.secondary, `${displayName} has died of ${this.cause}.`),
      '',
      tag(colors.text, `The party mourns the loss of ${displayName}.`),
      tag(colors.muted, 'Rest in peace.'),
      '',
      tag(colors.muted, 'Remaining party:'),
      ...partyLines,
    ];

    const msgBox = blessed.box({
      top,
      left: 'center',
      width: '80%',
      height: lines.length + 4,
      border: { type: 'line' },
      tags: true,
      align: 'center',
      valign: 'middle',
      content: lines.join('\n'),
      style: { border: { fg: colors.muted }, fg: colors.text, bg: colors.bg },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
    });
    this.addWidget(msgBox);

    const promptBox = blessed.box({
      top: top + lines.length + 4,
      left: 'center',
      width: '80%',
      height: 3,
      tags: true,
      align: 'center',
      valign: 'middle',
      content: tag(colors.muted, 'Press ENTER to continue on the trail'),
      style: { fg: colors.muted, bg: colors.bg },
    });
    this.addWidget(promptBox);
  }

  // ── Cleanup ───────────────────────────────────────────────────

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

module.exports = DeathScreen;
