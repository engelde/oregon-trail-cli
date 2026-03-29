const blessed = require('blessed');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { colors, tag, boldColor } = require('../ui/Theme');

// ── High-score persistence ───────────────────────────────────────
const SCORES_DIR = path.join(os.homedir(), '.oregon-trail');
const SCORES_FILE = path.join(SCORES_DIR, 'highscores.json');
const MAX_SCORES = 10;

function loadScores() {
  try {
    const data = fs.readFileSync(SCORES_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
}

function saveScores(scores) {
  try {
    if (!fs.existsSync(SCORES_DIR)) {
      fs.mkdirSync(SCORES_DIR, { recursive: true });
    }
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (_e) {
    // Silently fail — high scores are not critical
  }
}

function formatNumber(n) {
  return Number(n).toLocaleString();
}

// ── Screen ───────────────────────────────────────────────────────
class HighScoreScreen {
  constructor(screen, props) {
    this.screen = screen;
    this.engine = props.engine;
    this.gameState = props.gameState;
    this.score = props.score || 0;
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

  create() {
    const scores = loadScores();

    // Check if this score qualifies for the top 10
    const qualifies =
      this.score > 0 && (scores.length < MAX_SCORES || this.score > (scores[scores.length - 1]?.score || 0));

    if (qualifies) {
      this._promptForInitials(scores);
    } else {
      this._showScoreBoard(scores, -1);
    }
  }

  _promptForInitials(scores) {
    const promptBox = blessed.box({
      top: 'center',
      left: 'center',
      width: 50,
      height: 13,
      border: { type: 'line' },
      label: ` ${boldColor(colors.secondary, '★ NEW HIGH SCORE ★')} `,
      tags: true,
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: [
        boldColor(colors.highlight, `Score: ${formatNumber(this.score)}`),
        '',
        tag(colors.text, 'Enter your name for the Top 10:'),
        '',
      ].join('\n'),
    });
    this.addWidget(promptBox);

    const input = blessed.textbox({
      parent: promptBox,
      top: 5,
      left: 2,
      width: 30,
      height: 3,
      border: { type: 'line' },
      style: {
        fg: colors.highlight,
        bg: colors.bg,
        border: { fg: colors.primary },
        focus: { border: { fg: colors.highlight } },
      },
      inputOnFocus: true,
      value: this.gameState.party[0] ? this.gameState.party[0].name : '',
    });
    this.widgets.push(input);

    const hintBox = blessed.box({
      parent: promptBox,
      top: 9,
      left: 2,
      width: 40,
      height: 1,
      tags: true,
      style: { fg: colors.muted, bg: colors.bg },
      content: tag(colors.muted, 'Type your name then press ENTER'),
    });
    this.widgets.push(hintBox);

    this.screen.render();

    input.on('submit', (value) => {
      const name = (value || '').trim() || (this.gameState.party[0] ? this.gameState.party[0].name : 'Unknown');

      const newEntry = {
        name,
        score: this.score,
        profession: this.gameState.profession || 'unknown',
        date: new Date().toLocaleDateString(),
      };

      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      scores.length = Math.min(scores.length, MAX_SCORES);
      saveScores(scores);

      const highlightIndex = scores.findIndex(
        (e) => e.score === newEntry.score && e.name === newEntry.name && e.date === newEntry.date,
      );

      // Remove prompt widgets and show the board
      this.widgets.forEach((w) => w.detach());
      this.widgets = [];
      this._showScoreBoard(scores, highlightIndex);
    });

    input.on('cancel', () => {
      // Use default name on cancel
      const name = this.gameState.party[0] ? this.gameState.party[0].name : 'Unknown';
      const newEntry = {
        name,
        score: this.score,
        profession: this.gameState.profession || 'unknown',
        date: new Date().toLocaleDateString(),
      };

      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      scores.length = Math.min(scores.length, MAX_SCORES);
      saveScores(scores);

      const highlightIndex = scores.findIndex(
        (e) => e.score === newEntry.score && e.name === newEntry.name && e.date === newEntry.date,
      );

      this.widgets.forEach((w) => w.detach());
      this.widgets = [];
      this._showScoreBoard(scores, highlightIndex);
    });

    // Focus the input so user can type immediately
    input.focus();
  }

  _showScoreBoard(scores, highlightIndex) {
    // ── Build content ──────────────────────────────────────────
    const COL_RANK = 6;
    const COL_NAME = 18;
    const COL_SCORE = 10;

    const lines = [];
    lines.push('');
    lines.push(boldColor(colors.secondary, '       THE OREGON TRAIL — TOP TEN'));
    lines.push('');

    const headerLine =
      tag(colors.muted, '  ' + 'Rank'.padEnd(COL_RANK)) +
      tag(colors.muted, 'Name'.padEnd(COL_NAME)) +
      tag(colors.muted, 'Score'.padStart(COL_SCORE)) +
      tag(colors.muted, '    ' + 'Profession');

    const separator = tag(colors.muted, '  ' + '─'.repeat(52));

    lines.push(headerLine);
    lines.push(separator);

    for (let i = 0; i < MAX_SCORES; i++) {
      const entry = scores[i];
      const rank = `${String(i + 1).padStart(2)}.  `;

      if (entry) {
        const name = (entry.name || 'Unknown').substring(0, COL_NAME).padEnd(COL_NAME);
        const score = formatNumber(entry.score).padStart(COL_SCORE);
        const prof = '    ' + (entry.profession || '—');
        const isHighlighted = i === highlightIndex;

        if (isHighlighted) {
          lines.push(
            '  ' +
              boldColor(colors.highlight, rank) +
              boldColor(colors.highlight, name) +
              boldColor(colors.highlight, score) +
              boldColor(colors.highlight, prof),
          );
        } else {
          lines.push(
            '  ' + tag(colors.text, rank) + tag(colors.text, name) + tag(colors.text, score) + tag(colors.text, prof),
          );
        }
      } else {
        lines.push(
          '  ' +
            tag(colors.muted, rank) +
            tag(colors.muted, '---'.padEnd(COL_NAME)) +
            tag(colors.muted, '---'.padStart(COL_SCORE)) +
            tag(colors.muted, '    ---'),
        );
      }
    }

    lines.push(separator);
    lines.push('');
    lines.push(
      tag(colors.muted, '  Press ') +
        boldColor(colors.primary, 'ENTER') +
        tag(colors.muted, ' to return to the main menu'),
    );

    // ── Single scrollable box ──────────────────────────────────
    const contentBox = blessed.box({
      top: 0,
      left: 'center',
      width: 62,
      height: '100%',
      border: { type: 'line' },
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1, top: 0, bottom: 1 },
      content: lines.join('\n'),
    });
    this.addWidget(contentBox);

    // ── Key binding ────────────────────────────────────────────
    this.registerKey(['enter', 'return'], () => {
      this.engine.showTitle();
    });

    this.screen.render();
  }

  destroy() {
    this.intervals.forEach((i) => clearInterval(i));
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.widgets.forEach((w) => w.detach());
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.screen.render();
  }
}

module.exports = HighScoreScreen;
