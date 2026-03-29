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
    // 1. Load existing scores
    const scores = loadScores();

    // 2. Possibly insert a new entry
    let highlightIndex = -1;

    if (this.score > 0) {
      const newEntry = {
        name: this.gameState.party[0] ? this.gameState.party[0].name : 'Unknown',
        score: this.score,
        profession: this.gameState.profession || 'unknown',
        date: new Date().toLocaleDateString(),
      };

      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      scores.length = Math.min(scores.length, MAX_SCORES);
      saveScores(scores);

      // Find the new entry in the sorted list
      highlightIndex = scores.findIndex(
        (e) => e.score === newEntry.score && e.name === newEntry.name && e.date === newEntry.date,
      );
    }

    // ── Title ──────────────────────────────────────────────────
    const titleBox = blessed.box({
      top: 1,
      left: 'center',
      width: 60,
      height: 5,
      border: { type: 'line' },
      tags: true,
      align: 'center',
      style: {
        border: { fg: colors.secondary },
        fg: colors.secondary,
        bg: colors.bg,
        bold: true,
      },
      padding: { top: 1, bottom: 1 },
      content: boldColor(colors.secondary, 'THE OREGON TRAIL — TOP TEN'),
    });
    this.addWidget(titleBox);

    // ── Score table ────────────────────────────────────────────
    const COL_RANK = 6;
    const COL_NAME = 18;
    const COL_SCORE = 10;
    const _COL_PROF = 14;

    const headerLine =
      tag(colors.muted, '  ' + 'Rank'.padEnd(COL_RANK)) +
      tag(colors.muted, 'Name'.padEnd(COL_NAME)) +
      tag(colors.muted, 'Score'.padStart(COL_SCORE)) +
      tag(colors.muted, '    ' + 'Profession');

    const separator = tag(colors.muted, '  ' + '─'.repeat(52));

    const rows = [headerLine, separator];

    for (let i = 0; i < MAX_SCORES; i++) {
      const entry = scores[i];
      const rank = `${String(i + 1).padStart(2)}.  `;

      if (entry) {
        const name = (entry.name || 'Unknown').substring(0, COL_NAME).padEnd(COL_NAME);
        const score = formatNumber(entry.score).padStart(COL_SCORE);
        const prof = '    ' + (entry.profession || '—');
        const isHighlighted = i === highlightIndex;

        if (isHighlighted) {
          rows.push(
            '  ' +
              boldColor(colors.highlight, rank) +
              boldColor(colors.highlight, name) +
              boldColor(colors.highlight, score) +
              boldColor(colors.highlight, prof),
          );
        } else {
          rows.push(
            '  ' + tag(colors.text, rank) + tag(colors.text, name) + tag(colors.text, score) + tag(colors.text, prof),
          );
        }
      } else {
        rows.push(
          '  ' +
            tag(colors.muted, rank) +
            tag(colors.muted, '---'.padEnd(COL_NAME)) +
            tag(colors.muted, '---'.padStart(COL_SCORE)) +
            tag(colors.muted, '    ---'),
        );
      }
    }

    rows.push(separator);

    const tableBox = blessed.box({
      top: 7,
      left: 'center',
      width: 60,
      height: rows.length + 4,
      border: { type: 'line' },
      tags: true,
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1, top: 1, bottom: 1 },
      content: rows.join('\n'),
    });
    this.addWidget(tableBox);

    // ── Bottom prompt ──────────────────────────────────────────
    const promptBox = blessed.box({
      bottom: 1,
      left: 'center',
      width: 60,
      height: 3,
      tags: true,
      align: 'center',
      style: { fg: colors.muted, bg: colors.bg },
      content:
        tag(colors.muted, 'Press ') +
        boldColor(colors.primary, 'ENTER') +
        tag(colors.muted, ' to return to the main menu'),
    });
    this.addWidget(promptBox);

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
