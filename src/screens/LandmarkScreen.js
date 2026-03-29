'use strict';

const blessed = require('blessed');
const { colors, tag, bold, boldColor } = require('../ui/Theme');

let landmarkArt = {};
try { landmarkArt = require('../art/landmarks').landmarks; } catch (_) {}

class LandmarkScreen {
  constructor(screen, gameState, onComplete, landmark) {
    this.screen = screen;
    this.gameState = gameState;
    this.onComplete = onComplete;
    this.landmark = landmark;
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];

    this.init();
  }

  addWidget(w) { this.widgets.push(w); this.screen.append(w); }

  registerKey(keys, fn) {
    const handler = fn;
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
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

  init() {
    const art = landmarkArt[this.landmark.name] || null;

    const artBox = blessed.box({
      top: 0,
      left: 'center',
      width: '100%',
      height: '50%',
      border: { type: 'line' },
      label: ` ${boldColor(colors.primary, this.landmark.name)} `,
      tags: true,
      align: 'center',
      valign: 'middle',
      content: art || tag(colors.muted, `You have arrived at ${bold(this.landmark.name)}.`),
      style: {
        border: { fg: colors.primary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(artBox);

    const dateStr = this.gameState.getDateString();
    const miles = this.gameState.milesTraveled;
    const description = this.landmark.description || 'A notable landmark along the Oregon Trail.';

    const infoContent = [
      boldColor(colors.secondary, this.landmark.name),
      '',
      tag(colors.text, description),
      '',
      `${tag(colors.muted, 'Date:')} ${tag(colors.text, dateStr)}   ${tag(colors.muted, 'Miles traveled:')} ${tag(colors.highlight, String(miles))}`,
    ].join('\n');

    const infoBox = blessed.box({
      top: '50%',
      left: 'center',
      width: '100%',
      height: '30%',
      border: { type: 'line' },
      tags: true,
      content: infoContent,
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1 },
    });
    this.addWidget(infoBox);

    const isChoice = this.landmark.name === 'The Dalles' || this.landmark.type === 'choice';

    const promptBox = blessed.box({
      top: '80%',
      left: 'center',
      width: '100%',
      height: '20%',
      border: { type: 'line' },
      tags: true,
      align: 'center',
      valign: 'middle',
      content: isChoice
        ? boldColor(colors.secondary, 'You must decide how to continue...')
        : tag(colors.muted, 'Press ENTER to continue on the trail'),
      style: {
        border: { fg: colors.muted },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(promptBox);

    this.screen.render();

    if (isChoice) {
      this.showDallesChoice();
    } else {
      this.registerKey(['enter', 'return'], () => {
        this.destroy();
        if (this.onComplete) this.onComplete();
      });
    }
  }

  showDallesChoice() {
    this.selectedChoice = 0;
    const choices = [
      '1. Take the Barlow Toll Road ($20, safer)',
      '2. Float down the Columbia River (risky but free)',
    ];

    this.choiceBox = blessed.box({
      top: 'center',
      left: 'center',
      width: 55,
      height: 10,
      border: { type: 'line' },
      label: ` ${bold('The Dalles')} `,
      tags: true,
      shadow: true,
      style: {
        border: { fg: colors.highlight },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
    });
    this.addWidget(this.choiceBox);

    const renderChoices = () => {
      const lines = [
        boldColor(colors.secondary, 'The trail ends here at the Columbia River.'),
        tag(colors.text, 'You must choose how to reach the Willamette Valley:'),
        '',
      ];
      choices.forEach((c, i) => {
        if (i === this.selectedChoice) {
          lines.push(bold(tag(colors.highlight, `▸ ${c}`)));
        } else {
          lines.push(`  ${c}`);
        }
      });
      this.choiceBox.setContent(lines.join('\n'));
      this.screen.render();
    };

    renderChoices();

    this.registerKey(['up', 'down'], () => {
      this.selectedChoice = this.selectedChoice === 0 ? 1 : 0;
      renderChoices();
    });

    this.registerKey(['enter', 'return'], () => {
      this.destroy();
      if (this.onComplete) {
        this.onComplete(this.selectedChoice === 0 ? 'toll_road' : 'columbia_river');
      }
    });

    this.registerKey(['1'], () => {
      this.destroy();
      if (this.onComplete) this.onComplete('toll_road');
    });

    this.registerKey(['2'], () => {
      this.destroy();
      if (this.onComplete) this.onComplete('columbia_river');
    });
  }
}

module.exports = LandmarkScreen;
