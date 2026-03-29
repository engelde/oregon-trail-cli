'use strict';

const events = require('../data/events');

class EventEngine {
  /**
   * @param {object} gameState - The live game state object (mutated in place by events)
   */
  constructor(gameState) {
    this.gameState = gameState;
    this.recentEvents = []; // track last 5 event IDs to avoid repetition
  }

  /**
   * Roll dice and return a triggered event or null.
   * Two-step: first check if ANY event happens (~30% base), then pick one.
   */
  checkForEvent() {
    const gs = this.gameState;

    // Step 1: base chance of ANY event occurring
    let baseChance = 0.30;
    // Increase late-game and far from forts
    if (gs.milesTraveled > 1000) baseChance += 0.05;
    if (gs.pace === 'grueling') baseChance += 0.08;
    else if (gs.pace === 'strenuous') baseChance += 0.04;
    if (gs.rations === 'bare-bones') baseChance += 0.05;

    if (Math.random() > baseChance) return null;

    // Step 2: gather eligible events and pick one by weighted probability
    const eligible = events.filter(e => {
      if (typeof e.condition === 'function' && !e.condition(gs)) return false;
      if (this.recentEvents.includes(e.id)) return false; // skip recent
      return true;
    });

    if (eligible.length === 0) return null;

    // Weighted random selection
    const totalWeight = eligible.reduce((sum, e) => sum + (e.probability || 0.01), 0);
    let roll = Math.random() * totalWeight;
    for (const event of eligible) {
      roll -= (event.probability || 0.01);
      if (roll <= 0) return event;
    }

    return eligible[eligible.length - 1];
  }

  /**
   * Apply event effects to gameState.
   * @param {object} event - An event from events.js
   * @returns {string} Message describing what happened
   */
  handleEvent(event) {
    if (!event || typeof event.effect !== 'function') {
      return '';
    }

    const message = event.effect(this.gameState);

    // Track recent events (keep last 5)
    this.recentEvents.push(event.id);
    if (this.recentEvents.length > 5) {
      this.recentEvents.shift();
    }

    return message;
  }

  // ── Probability modifiers ──

  _getPaceModifier(event) {
    const pace = this.gameState.pace || 'steady';
    if (event.type === 'health' || event.type === 'supply') {
      if (pace === 'grueling') return 1.6;
      if (pace === 'strenuous') return 1.3;
    }
    if (event.type === 'positive') {
      // Slower pace gives more time to find good things
      if (pace === 'steady') return 1.2;
      if (pace === 'grueling') return 0.7;
    }
    return 1.0;
  }

  _getRationsModifier(event) {
    const rations = this.gameState.rations || 'filling';
    if (event.type === 'health') {
      if (rations === 'bare bones') return 1.8;
      if (rations === 'meager') return 1.3;
    }
    return 1.0;
  }

  _getWeatherModifier(event) {
    const weather = this.gameState.weather || 'clear';
    if (event.type === 'weather') {
      // Bad weather breeds more bad weather
      const bad = ['rain', 'heavy rain', 'snow', 'blizzard', 'thunderstorm'];
      if (bad.includes(weather)) return 1.4;
    }
    if (event.type === 'positive') {
      if (weather === 'clear') return 1.3;
    }
    if (event.type === 'supply' && event.id.includes('thief')) {
      // Thieves less likely in bad weather
      if (weather === 'blizzard' || weather === 'heavy rain') return 0.3;
    }
    return 1.0;
  }

  _getDistanceModifier(event) {
    const distFromFort = this.gameState.distanceFromLastFort || 0;
    if (event.type === 'supply' || event.type === 'health') {
      // More danger further from forts
      if (distFromFort > 200) return 1.4;
      if (distFromFort > 100) return 1.2;
    }
    return 1.0;
  }

  _getTerrainModifier(event) {
    const terrain = this.gameState.terrain || 'plains';
    if (event.type === 'supply') {
      // Wagons break more in mountains and rough terrain
      if (terrain === 'mountains') return 1.5;
      if (terrain === 'hills') return 1.2;
    }
    if (event.type === 'weather') {
      if (terrain === 'mountains') return 1.3;
    }
    if (event.id === 'snakebite') {
      if (terrain === 'desert') return 1.5;
      if (terrain === 'mountains') return 0.5;
    }
    return 1.0;
  }
}

module.exports = EventEngine;
