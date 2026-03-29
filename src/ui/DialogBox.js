const blessed = require('blessed');
const { colors, boxStyles, tag, bold } = require('./Theme');

/**
 * Show a centered dialog box with an optional list of choices.
 *
 * @param {blessed.screen} screen
 * @param {Object}   opts
 * @param {string}   opts.title     — dialog title
 * @param {string}   opts.message   — body text (blessed tags allowed)
 * @param {string[]} [opts.choices] — list of selectable choices
 * @param {Function} opts.callback  — called with (choiceIndex, choiceText) or (null) on dismiss
 * @returns {{ destroy: Function }} handle to tear down the dialog
 */
function showDialog(screen, opts) {
  const { title, message, choices, callback } = opts;
  const hasChoices = Array.isArray(choices) && choices.length > 0;

  // Size the box to content
  const msgLines = (message || '').split('\n').length;
  const choiceLines = hasChoices ? choices.length + 1 : 0; // +1 for blank separator
  const contentHeight = msgLines + choiceLines + 2; // padding
  const height = contentHeight + 4; // border + top/bottom padding
  const width = Math.min(60, Math.floor(screen.width * 0.8));

  const box = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width,
    height,
    label: title ? ` ${title} ` : undefined,
    ...boxStyles.dialog,
  });

  // Body text
  let selectedIndex = 0;

  function renderContent() {
    let content = message || '';
    if (hasChoices) {
      content += '\n';
      choices.forEach((c, i) => {
        const prefix = i === selectedIndex ? bold(tag(colors.highlight, '▸ ')) : '  ';
        const label = i === selectedIndex ? bold(tag(colors.highlight, c)) : c;
        content += `\n${prefix}${label}`;
      });
    } else {
      content += `\n\n${tag(colors.muted, 'Press ENTER to continue')}`;
    }
    box.setContent(content);
    screen.render();
  }

  renderContent();

  // Keyboard handling
  function onKeypress(ch, key) {
    if (!key) return;

    if (hasChoices) {
      if (key.name === 'up' || key.name === 'k') {
        selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
        renderContent();
        return;
      }
      if (key.name === 'down' || key.name === 'j') {
        selectedIndex = (selectedIndex + 1) % choices.length;
        renderContent();
        return;
      }
      // Number shortcuts (1-9)
      const num = parseInt(ch, 10);
      if (num >= 1 && num <= choices.length) {
        selectedIndex = num - 1;
        teardown();
        if (callback) callback(selectedIndex, choices[selectedIndex]);
        return;
      }
    }

    if (key.name === 'return' || key.name === 'enter') {
      teardown();
      if (callback) {
        if (hasChoices) {
          callback(selectedIndex, choices[selectedIndex]);
        } else {
          callback(null);
        }
      }
      return;
    }

    if (key.name === 'escape') {
      teardown();
      if (callback) callback(null);
    }
  }

  screen.on('keypress', onKeypress);

  function teardown() {
    screen.removeListener('keypress', onKeypress);
    box.destroy();
    screen.render();
  }

  return { destroy: teardown };
}

module.exports = showDialog;
