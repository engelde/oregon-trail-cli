const landmarks = require('../data/landmarks');
const EventEngine = require('./EventEngine');
const WeatherSystem = require('./WeatherSystem');

const TitleScreen = require('../screens/TitleScreen');
const SetupScreen = require('../screens/SetupScreen');
const StoreScreen = require('../screens/StoreScreen');
const TravelScreen = require('../screens/TravelScreen');
const LandmarkScreen = require('../screens/LandmarkScreen');
const FortScreen = require('../screens/FortScreen');
const RiverScreen = require('../screens/RiverScreen');
const EventScreen = require('../screens/EventScreen');
const DeathScreen = require('../screens/DeathScreen');
const VictoryScreen = require('../screens/VictoryScreen');
const HighScoreScreen = require('../screens/HighScoreScreen');
const RiverMiniGame = require('../screens/RiverMiniGame');
const HuntingScreen = require('../screens/HuntingScreen');

const TOTAL_MILES = 1907;

class GameEngine {
  constructor(screen, screenManager, gameState) {
    this.screen = screen;
    this.sm = screenManager;
    this.gs = gameState;
    this.state = 'title';
    this.currentScreen = null;
    this.eventEngine = new EventEngine(gameState);
    this.weather = new WeatherSystem();
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  start() {
    this.showTitle();
  }

  cleanup() {
    this._destroyCurrent();
  }

  // ── Screen management ─────────────────────────────────────────

  _destroyCurrent() {
    if (this.currentScreen && typeof this.currentScreen.destroy === 'function') {
      this.currentScreen.destroy();
    }
    this.currentScreen = null;
  }

  _show(screenInstance) {
    this._destroyCurrent();
    this.currentScreen = screenInstance;
    if (typeof screenInstance.create === 'function') {
      screenInstance.create();
    }
    this.screen.render();
  }

  // ── Screen transitions ────────────────────────────────────────

  showTitle() {
    this.state = 'title';
    const s = new TitleScreen(this.screen, {
      onComplete: (action) => {
        if (action === 'travel') {
          this.showSetup();
        } else if (action === 'highscores') {
          this.showHighScores(null);
        }
      },
    });
    this._show(s);
  }

  showSetup() {
    this.state = 'setup';
    const s = new SetupScreen(this.screen, {
      gameState: this.gs,
      onComplete: () => {
        this.showStore();
      },
    });
    this._show(s);
  }

  showStore() {
    this.state = 'store';
    const s = new StoreScreen(this.screen, {
      gameState: this.gs,
      onComplete: () => {
        this.startTravel();
      },
    });
    this._show(s);
  }

  startTravel() {
    this.state = 'traveling';
    // Initialize weather for current month
    this._updateWeather();

    const callbacks = {
      onTick: () => this._tick(),
      onHunt: () => this._launchHunt(),
      onTrade: null, // TravelScreen handles trade internally
      onRest: (days) => this._rest(days),
      onContinue: () => {},
    };

    const s = new TravelScreen(this.screen, this.gs, callbacks);
    this._show(s);
  }

  _resumeTravel() {
    // After an event/landmark/river, go back to travel
    this.startTravel();
  }

  showLandmark(landmark) {
    this.state = 'landmark';
    const s = new LandmarkScreen(
      this.screen,
      this.gs,
      (choice) => {
        if (choice === 'columbia_river') {
          this._launchRiverMiniGame(() => this._resumeTravel());
        } else {
          this._resumeTravel();
        }
      },
      landmark,
    );
    this._show(s);
  }

  showFort(landmark) {
    this.state = 'fort';
    const s = new FortScreen(
      this.screen,
      this.gs,
      () => {
        this._resumeTravel();
      },
      landmark,
    );
    this._show(s);
  }

  showRiver(landmark) {
    this.state = 'river';
    const s = new RiverScreen(
      this.screen,
      this.gs,
      (result) => {
        if (result === 'raft') {
          this._launchRiverMiniGame(() => this._resumeTravel());
        } else {
          // Check for deaths from crossing
          this._checkPartyDeaths('drowning', () => this._resumeTravel());
        }
      },
      landmark,
    );
    this._show(s);
  }

  showEvent(event) {
    this.state = 'event';
    // Apply event effects
    const message = this.eventEngine.handleEvent(event);
    const eventData = {
      name: event.name,
      description: event.description || message,
      type: event.type,
      effects: message,
    };
    const s = new EventScreen(
      this.screen,
      this.gs,
      () => {
        // After event, check for deaths then resume
        this._checkPartyDeaths(event.name, () => this._resumeTravel());
      },
      eventData,
    );
    this._show(s);
  }

  showDeath(member, cause) {
    this.state = 'death';
    const s = new DeathScreen(this.screen, {
      engine: this,
      gameState: this.gs,
      member,
      cause,
    });
    this._show(s);
  }

  showGameOver() {
    this.state = 'gameover';
    // Show death screen for the leader with game over
    const _showDialog = require('../ui/DialogBox');
    this._destroyCurrent();
    let miscArt = {};
    try {
      miscArt = require('../art/misc');
    } catch (_) {}

    const blessed = require('blessed');
    const box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '70%',
      height: '70%',
      tags: true,
      border: { type: 'line' },
      style: { border: { fg: 'red' }, fg: 'white', bg: 'black' },
      content: [
        '',
        miscArt.gameOver || '  {bold}{red-fg}GAME OVER{/red-fg}{/bold}',
        '',
        '  {red-fg}Your party has perished on the Oregon Trail.{/red-fg}',
        '',
        `  Date: ${this.gs.getDateString()}`,
        `  Miles traveled: ${this.gs.milesTraveled} of ${TOTAL_MILES}`,
        '',
        '  {gray-fg}Press ENTER to return to the main menu{/gray-fg}',
      ].join('\n'),
    });

    const handler = () => {
      this.screen.unkey(['enter', 'return'], handler);
      box.detach();
      // Reset game state
      this._resetGame();
      this.showTitle();
    };
    this.screen.key(['enter', 'return'], handler);
    this.screen.render();
  }

  showVictory() {
    this.state = 'victory';
    const s = new VictoryScreen(this.screen, this.gs, (score) => {
      this.showHighScores(score);
    });
    this._show(s);
  }

  showHighScores(newScore) {
    const s = new HighScoreScreen(this.screen, {
      engine: this,
      gameState: this.gs,
      score: newScore,
    });
    this._show(s);
  }

  // ── Game tick (one day of travel) ─────────────────────────────

  _tick() {
    // Calculate daily miles based on pace and weather
    let baseMiles;
    switch (this.gs.pace) {
      case 'steady':
        baseMiles = 12 + Math.floor(Math.random() * 6);
        break;
      case 'strenuous':
        baseMiles = 16 + Math.floor(Math.random() * 8);
        break;
      case 'grueling':
        baseMiles = 20 + Math.floor(Math.random() * 10);
        break;
      default:
        baseMiles = 14;
    }

    // Weather speed modifier
    const weatherMod = this.weather.getSpeedModifier();
    baseMiles = Math.max(1, Math.round(baseMiles * weatherMod));

    // No oxen = can't travel
    if (this.gs.supplies.oxen <= 0) {
      baseMiles = 0;
    }

    this.gs.advanceDay(baseMiles);
    this.gs.consumeFood();
    this._updateWeather();
    this._applyHealthEffects();

    // Starvation check
    if (this.gs.supplies.food <= 0) {
      this._applyStarvation();
    }

    // Victory check
    if (this.gs.milesTraveled >= TOTAL_MILES) {
      this.showVictory();
      return { victory: true };
    }

    // Game over check
    if (!this.gs.isPartyAlive()) {
      this.showGameOver();
      return { gameover: true };
    }

    // Landmark check
    const nextLm = landmarks[this.gs.nextLandmarkIndex];
    if (nextLm && this.gs.milesTraveled >= nextLm.mile) {
      this.gs.nextLandmarkIndex++;
      if (nextLm.type === 'end') {
        this.showVictory();
        return { victory: true };
      }
      if (nextLm.type === 'river') {
        this.showRiver(nextLm);
        return { landmark: nextLm };
      }
      if (nextLm.type === 'fort') {
        this.showFort(nextLm);
        return { landmark: nextLm };
      }
      this.showLandmark(nextLm);
      return { landmark: nextLm };
    }

    // Random event check
    const event = this.eventEngine.checkForEvent();
    if (event) {
      this.showEvent(event);
      return { event };
    }

    // Normal day — no interruption
    return null;
  }

  // ── Health / weather helpers ───────────────────────────────────

  _updateWeather() {
    const terrain = this._getTerrainType();
    this.weather.update(this.gs.date.month, terrain);
    this.gs.weather = this.weather.currentWeather;
  }

  _getTerrainType() {
    const m = this.gs.milesTraveled;
    if (m < 300) return 'plains';
    if (m < 640) return 'hills';
    if (m < 1025) return 'mountains';
    if (m < 1340) return 'desert';
    if (m < 1630) return 'mountains';
    return 'valley';
  }

  _applyHealthEffects() {
    const healthMod = this.weather.getHealthModifier();
    const alive = this.gs.getAliveMembers();

    for (const member of alive) {
      let healthChange = 0;

      // Pace effects
      if (this.gs.pace === 'grueling') healthChange -= 0.06;
      else if (this.gs.pace === 'strenuous') healthChange -= 0.02;
      else healthChange += 0.01;

      // Rations effects
      if (this.gs.rations === 'bare-bones') healthChange -= 0.04;
      else if (this.gs.rations === 'meager') healthChange -= 0.01;
      else healthChange += 0.02;

      // Weather effects
      healthChange += healthMod;

      // Apply (using internal numeric health tracking)
      if (!member._hp) member._hp = 4; // good=4, fair=3, poor=2, very poor=1
      member._hp = Math.max(0, Math.min(4, member._hp + healthChange));

      // Map numeric hp to string
      if (member._hp >= 3.5) member.health = 'good';
      else if (member._hp >= 2.5) member.health = 'fair';
      else if (member._hp >= 1.5) member.health = 'poor';
      else if (member._hp > 0) member.health = 'very poor';
      else member.health = 'dead';
    }
  }

  _applyStarvation() {
    const alive = this.gs.getAliveMembers();
    for (const member of alive) {
      if (!member._hp) member._hp = 4;
      member._hp -= 0.3;
      if (member._hp <= 0) {
        member._hp = 0;
        member.health = 'dead';
      } else if (member._hp < 1) {
        member.health = 'very poor';
      } else if (member._hp < 2) {
        member.health = 'poor';
      }
    }
  }

  _rest(days) {
    for (let i = 0; i < days; i++) {
      this.gs.addDays(1);
      this.gs.consumeFood();
      // Healing during rest
      for (const member of this.gs.getAliveMembers()) {
        if (!member._hp) member._hp = 4;
        member._hp = Math.min(4, member._hp + 0.15);
        if (member._hp >= 3.5) member.health = 'good';
        else if (member._hp >= 2.5) member.health = 'fair';
        else if (member._hp >= 1.5) member.health = 'poor';
        else member.health = 'very poor';
      }
    }
    this._updateWeather();
  }

  // ── Mini-game launchers ───────────────────────────────────────

  _launchHunt() {
    this._destroyCurrent();
    const s = new HuntingScreen(this.screen, this.gs, () => {
      this._resumeTravel();
    });
    this.currentScreen = s;
    // HuntingScreen creates itself in constructor
    this.screen.render();
  }

  _launchRiverMiniGame(onDone) {
    this._destroyCurrent();
    const s = new RiverMiniGame(this.screen, this.gs, () => {
      onDone();
    });
    this.currentScreen = s;
    this.screen.render();
  }

  // ── Death checking ────────────────────────────────────────────

  _checkPartyDeaths(cause, onDone) {
    const dead = this.gs.party.filter((m) => m.health === 'dead' && !m._deathShown);
    if (dead.length === 0) {
      onDone();
      return;
    }

    // Show death screen for the first dead member
    const member = dead[0];
    member._deathShown = true;

    this.showDeath(member, cause);
  }

  // ── Game reset ────────────────────────────────────────────────

  _resetGame() {
    const _GameState = require('./GameState');
    // Reset all state
    this.gs.party = [];
    this.gs.supplies = { food: 0, oxen: 0, clothing: 0, ammunition: 0, wheels: 0, axles: 0, tongues: 0 };
    this.gs.money = 0;
    this.gs.profession = null;
    this.gs.date = { month: 3, day: 1, year: 1848 };
    this.gs.milesTraveled = 0;
    this.gs.pace = 'steady';
    this.gs.rations = 'filling';
    this.gs.nextLandmarkIndex = 0;
    this.gs.weather = 'clear';
    this.gs.morale = 5;
    this.eventEngine = new EventEngine(this.gs);
    this.weather = new WeatherSystem();
  }
}

module.exports = GameEngine;
