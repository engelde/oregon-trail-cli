'use strict';

const blessed = require('blessed');
const { colors, tag, bold, boldColor } = require('../ui/Theme');
const { diseases } = require('../data/diseases');

let miscArt = {};
try { miscArt = require('../art/misc'); } catch (_) {}

// ── Health helpers ──────────────────────────────────────────────

const HEALTH_LEVELS = ['dead', 'very poor', 'poor', 'fair', 'good'];

function degradeHealth(member) {
  const idx = HEALTH_LEVELS.indexOf(member.health);
  if (idx > 0) {
    member.health = HEALTH_LEVELS[idx - 1];
  }
  return member.health;
}

function improveHealth(member) {
  const idx = HEALTH_LEVELS.indexOf(member.health);
  if (idx >= 0 && idx < HEALTH_LEVELS.length - 1) {
    member.health = HEALTH_LEVELS[idx + 1];
  }
  return member.health;
}

// ── Event pool ─────────────────────────────────────────────────

const EVENT_POOL = [
  // Negative events (more common)
  { name: 'Dysentery!', type: 'disease', disease: 'dysentery', weight: 10 },
  { name: 'Cholera strikes!', type: 'disease', disease: 'cholera', weight: 5 },
  { name: 'Typhoid fever!', type: 'disease', disease: 'typhoid', weight: 4 },
  { name: 'Measles outbreak!', type: 'disease', disease: 'measles', weight: 4 },
  { name: 'Snakebite!', type: 'disease', disease: 'snakebite', weight: 6 },
  { name: 'Broken arm!', type: 'disease', disease: 'brokenArm', weight: 5 },
  { name: 'Broken leg!', type: 'disease', disease: 'brokenLeg', weight: 3 },
  { name: 'Thief in camp!', type: 'theft', weight: 6 },
  { name: 'Wagon breaks down!', type: 'breakdown', weight: 7 },
  { name: 'Oxen wanders off!', type: 'ox_lost', weight: 4 },
  { name: 'Bad water!', type: 'bad_water', weight: 5 },
  { name: 'Heavy rain!', type: 'weather', weather: 'heavy rain', weight: 5 },
  { name: 'Blizzard!', type: 'weather', weather: 'blizzard', weight: 2 },
  { name: 'Fog!', type: 'weather', weather: 'fog', weight: 4 },

  // Positive events (less common)
  { name: 'Found wild berries!', type: 'find_food', amount: [10, 40], weight: 6 },
  { name: 'Found abandoned wagon!', type: 'find_supplies', weight: 3 },
  { name: 'Kind strangers share food!', type: 'find_food', amount: [20, 60], weight: 3 },
  { name: 'Beautiful weather!', type: 'good_weather', weight: 5 },
  { name: 'Found a shortcut!', type: 'shortcut', weight: 2 },
  { name: 'Indian guide helps party!', type: 'guide_help', weight: 2 },
];

const POSITIVE_TYPES = new Set([
  'find_food', 'find_supplies', 'good_weather', 'shortcut', 'guide_help',
]);
const NEGATIVE_TYPES = new Set([
  'disease', 'theft', 'breakdown', 'ox_lost', 'bad_water',
]);

// ── Weighted random selection ──────────────────────────────────

function pickWeightedEvent() {
  const totalWeight = EVENT_POOL.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of EVENT_POOL) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return EVENT_POOL[EVENT_POOL.length - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── EventScreen ────────────────────────────────────────────────

class EventScreen {
  constructor(screen, gameState, onComplete, eventData) {
    this.screen = screen;
    this.gameState = gameState;
    this.onComplete = onComplete;
    // eventData: { name, description, type, effects }
    this.eventData = eventData || {};
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

  // ── Build UI ─────────────────────────────────────────────────

  create() {
    // Use pre-processed event data from GameEngine
    const event = {
      name: this.eventData.name || 'Trail Event',
      type: this.eventData.type || 'misc',
    };
    const result = {
      description: this.eventData.description || 'Something happened on the trail.',
      effect: this.eventData.effects || '',
      art: null,
    };

    // Try to get relevant art
    if (event.type === 'weather' && miscArt.weather) {
      result.art = typeof miscArt.weather === 'function' ? miscArt.weather() : miscArt.weather;
    } else if (event.type === 'theft' && miscArt.thief) {
      result.art = typeof miscArt.thief === 'function' ? miscArt.thief() : miscArt.thief;
    } else if ((event.type === 'oxen' || event.name.toLowerCase().includes('ox')) && miscArt.oxDead) {
      result.art = typeof miscArt.oxDead === 'function' ? miscArt.oxDead() : miscArt.oxDead;
    }

    // Title color by category
    let titleColor;
    if (POSITIVE_TYPES.has(event.type)) titleColor = colors.primary;
    else if (event.type === 'weather') titleColor = colors.highlight;
    else titleColor = colors.danger;

    // ── Title ──────────────────────────────────────────────────
    const titleBox = blessed.box({
      top: 0,
      left: 'center',
      width: '100%',
      height: 3,
      border: { type: 'line' },
      tags: true,
      align: 'center',
      valign: 'middle',
      content: boldColor(titleColor, event.name),
      style: {
        border: { fg: titleColor },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(titleBox);

    // ── Art (if applicable) ────────────────────────────────────
    let nextTop = 3;
    if (result.art) {
      const artLines = result.art.split('\n').length;
      const artHeight = artLines + 2;
      const artBox = blessed.box({
        top: nextTop,
        left: 'center',
        width: '80%',
        height: artHeight,
        border: { type: 'line' },
        tags: true,
        align: 'center',
        valign: 'middle',
        content: result.art,
        style: {
          border: { fg: colors.muted },
          fg: colors.text,
          bg: colors.bg,
        },
        padding: { left: 1, right: 1 },
      });
      this.addWidget(artBox);
      nextTop += artHeight;
    }

    // ── Description ────────────────────────────────────────────
    const descBox = blessed.box({
      top: nextTop,
      left: 'center',
      width: '100%',
      height: 5,
      border: { type: 'line' },
      tags: true,
      content: tag(colors.text, result.description),
      style: {
        border: { fg: colors.secondary },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1 },
    });
    this.addWidget(descBox);
    nextTop += 5;

    // ── Effect ─────────────────────────────────────────────────
    const effectColor = POSITIVE_TYPES.has(event.type) ? colors.primary
      : NEGATIVE_TYPES.has(event.type) ? colors.danger
      : colors.text;

    const effectBox = blessed.box({
      top: nextTop,
      left: 'center',
      width: '100%',
      height: 5,
      border: { type: 'line' },
      tags: true,
      content: tag(effectColor, result.effect),
      style: {
        border: { fg: colors.muted },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 2, right: 2, top: 1 },
    });
    this.addWidget(effectBox);
    nextTop += 5;

    // ── Prompt ─────────────────────────────────────────────────
    const promptBox = blessed.box({
      top: nextTop,
      left: 'center',
      width: '100%',
      height: 3,
      border: { type: 'line' },
      tags: true,
      align: 'center',
      valign: 'middle',
      content: tag(colors.muted, 'Press ENTER to continue'),
      style: {
        border: { fg: colors.muted },
        fg: colors.text,
        bg: colors.bg,
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(promptBox);

    this.screen.render();

    this.registerKey(['enter', 'return'], () => {
      this.destroy();
      if (this.onComplete) this.onComplete();
    });
  }

  // ── Apply event effects to gameState ─────────────────────────

  _applyEvent(event) {
    const gs = this.gameState;
    let description = '';
    let effect = '';
    let art = null;

    switch (event.type) {
      case 'disease': {
        const alive = gs.getAliveMembers();
        if (alive.length === 0) break;
        const victim = alive[randInt(0, alive.length - 1)];
        const diseaseName = diseases[event.disease]
          ? diseases[event.disease].name
          : event.disease;
        if (victim.health === 'poor' || victim.health === 'very poor') {
          victim.health = 'very poor';
        } else {
          degradeHealth(victim);
        }
        description = `${victim.name} has ${diseaseName}.`;
        effect = `${victim.name}'s health is now ${victim.health}.`;
        break;
      }

      case 'theft': {
        const foodLost = randInt(20, 50);
        const clothingLost = randInt(0, 2);
        const ammoLost = randInt(0, 1);
        gs.supplies.food = Math.max(0, gs.supplies.food - foodLost);
        gs.supplies.clothing = Math.max(0, gs.supplies.clothing - clothingLost);
        gs.supplies.ammunition = Math.max(0, gs.supplies.ammunition - ammoLost);
        if (miscArt.thief) art = miscArt.thief;
        description = 'A thief raided your camp during the night!';
        const losses = [];
        if (foodLost > 0) losses.push(`${foodLost} lbs of food`);
        if (clothingLost > 0) losses.push(`${clothingLost} sets of clothing`);
        if (ammoLost > 0) losses.push(`${ammoLost} boxes of ammunition`);
        effect = `You lost ${losses.join(', ')}.`;
        break;
      }

      case 'breakdown': {
        const parts = ['wheel', 'axle', 'tongue'];
        const part = parts[randInt(0, parts.length - 1)];
        const spareKey = part + 's';
        if (gs.supplies[spareKey] > 0) {
          gs.supplies[spareKey] -= 1;
          description = `A wagon ${part} broke.`;
          effect = `You replaced it with a spare. (${gs.supplies[spareKey]} ${spareKey} remaining)`;
        } else {
          const daysLost = randInt(1, 2);
          gs.addDays(daysLost);
          description = `A wagon ${part} broke! You have no spare.`;
          effect = `You lost ${daysLost} day${daysLost > 1 ? 's' : ''} fixing it.`;
        }
        break;
      }

      case 'ox_lost': {
        gs.supplies.oxen = Math.max(0, gs.supplies.oxen - 1);
        if (miscArt.oxDead) art = miscArt.oxDead;
        description = 'One of your oxen has wandered off and can\'t be found.';
        effect = `You now have ${gs.supplies.oxen} oxen.`;
        break;
      }

      case 'bad_water': {
        const alive = gs.getAliveMembers();
        if (alive.length > 0) {
          const victim = alive[randInt(0, alive.length - 1)];
          degradeHealth(victim);
          description = 'The party drank bad water!';
          effect = `${victim.name} fell ill. Health is now ${victim.health}.`;
        } else {
          description = 'The party drank bad water!';
          effect = '';
        }
        break;
      }

      case 'weather': {
        gs.weather = event.weather;
        const weatherDesc = {
          'heavy rain': 'Heavy rains slow your progress and dampen spirits.',
          'blizzard': 'A fierce blizzard descends! Travel is nearly impossible.',
          'fog': 'Thick fog rolls in, making navigation difficult.',
        };
        description = weatherDesc[event.weather]
          || `The weather has turned to ${event.weather}.`;
        effect = `Weather is now: ${event.weather}.`;
        break;
      }

      case 'find_food': {
        const amount = randInt(event.amount[0], event.amount[1]);
        gs.supplies.food += amount;
        description = event.name;
        effect = `You gained ${amount} lbs of food!`;
        break;
      }

      case 'find_supplies': {
        const food = randInt(20, 80);
        const clothing = Math.random() < 0.5 ? 1 : 0;
        const ammo = Math.random() < 0.5 ? 1 : 0;
        gs.supplies.food += food;
        gs.supplies.clothing += clothing;
        gs.supplies.ammunition += ammo;
        description = 'You found an abandoned wagon with supplies!';
        const gains = [`${food} lbs of food`];
        if (clothing) gains.push('1 set of clothing');
        if (ammo) gains.push('1 box of ammunition');
        effect = `You gained: ${gains.join(', ')}.`;
        break;
      }

      case 'good_weather': {
        gs.weather = 'clear';
        gs.morale = Math.min(10, (gs.morale || 5) + 1);
        description = 'The weather is beautiful today. Spirits are high!';
        effect = 'Morale improved.';
        break;
      }

      case 'shortcut': {
        const miles = randInt(5, 15);
        gs.milesTraveled += miles;
        description = 'You found a shortcut!';
        effect = `Saved ${miles} miles of travel.`;
        break;
      }

      case 'guide_help': {
        const alive = gs.getAliveMembers();
        const sick = alive.filter(m => m.health !== 'good');
        if (sick.length > 0) {
          const helped = sick[randInt(0, sick.length - 1)];
          const oldHealth = helped.health;
          improveHealth(helped);
          description = 'A friendly guide helped tend to the sick.';
          effect = `${helped.name}'s health improved from ${oldHealth} to ${helped.health}.`;
        } else {
          description = 'A friendly guide shared wisdom about the trail ahead.';
          effect = 'The party\'s spirits are lifted.';
          gs.morale = Math.min(10, (gs.morale || 5) + 1);
        }
        break;
      }

      default: {
        description = 'Something happened on the trail.';
        effect = '';
        break;
      }
    }

    return { description, effect, art };
  }

  // ── Cleanup ──────────────────────────────────────────────────

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

module.exports = EventScreen;
