// ── Color palette ────────────────────────────────────────────────
const colors = {
  primary: 'green',
  secondary: 'yellow',
  danger: 'red',
  water: 'blue',
  text: 'white',
  bg: 'default',
  muted: 'gray',
  success: 'bright-green',
  highlight: 'cyan',
};

// ── Blessed tag helpers ──────────────────────────────────────────

/**
 * Wrap `text` in blessed color tags.
 * Usage: tag('green', 'Hello') → '{green-fg}Hello{/green-fg}'
 */
function tag(color, text) {
  return `{${color}-fg}${text}{/${color}-fg}`;
}

/** Bold wrapper */
function bold(text) {
  return `{bold}${text}{/bold}`;
}

/** Convenience: colored + bold */
function boldColor(color, text) {
  return bold(tag(color, text));
}

// ── Reusable box styles ──────────────────────────────────────────

const boxStyles = {
  /** Standard bordered menu / panel */
  menu: {
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      fg: colors.text,
      bg: colors.bg,
    },
    tags: true,
    padding: { left: 1, right: 1 },
  },

  /** Dialog / modal overlay */
  dialog: {
    border: { type: 'line' },
    style: {
      border: { fg: colors.highlight },
      fg: colors.text,
      bg: colors.bg,
    },
    tags: true,
    padding: { left: 2, right: 2, top: 1, bottom: 1 },
    shadow: true,
  },

  /** Persistent status bar (bottom of screen) */
  statusBar: {
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
      fg: colors.text,
      bg: colors.bg,
    },
    tags: true,
    padding: { left: 1, right: 1 },
  },

  /** Highlighted / selected item */
  selected: {
    fg: colors.bg,
    bg: colors.primary,
    bold: true,
  },

  /** Title banner style */
  title: {
    border: { type: 'line' },
    style: {
      border: { fg: colors.secondary },
      fg: colors.primary,
      bg: colors.bg,
      bold: true,
    },
    tags: true,
    padding: { left: 2, right: 2, top: 1, bottom: 1 },
  },
};

module.exports = {
  colors,
  boxStyles,
  tag,
  bold,
  boldColor,
};
