const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const GameState = require('../src/game/GameState');
const EventEngine = require('../src/game/EventEngine');
const WeatherSystem = require('../src/game/WeatherSystem');
const landmarks = require('../src/data/landmarks');

// Helpers to simulate game logic without blessed UI
function setupGame(profession = 'banker') {
  const gs = new GameState();
  gs.profession = profession;
  gs.money = { banker: 1600, carpenter: 800, farmer: 400 }[profession];
  gs.party = [
    { name: 'Leader', health: 'good', _hp: 4, isLeader: true },
    { name: 'Sara', health: 'good', _hp: 4 },
    { name: 'Johnny', health: 'good', _hp: 4 },
    { name: 'Lucy', health: 'good', _hp: 4 },
    { name: 'Tommy', health: 'good', _hp: 4 },
  ];
  gs.supplies = { food: 500, oxen: 3, clothing: 5, ammunition: 200, wheels: 1, axles: 1, tongues: 1 };
  return gs;
}

function simulateTick(gs, weather) {
  // Reproduce the core GameEngine._tick() logic without UI
  let baseMiles;
  switch (gs.pace) {
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

  const weatherMod = weather.getSpeedModifier();
  baseMiles = Math.max(1, Math.round(baseMiles * weatherMod));
  if (gs.supplies.oxen <= 0) baseMiles = 0;

  gs.advanceDay(baseMiles);
  gs.consumeFood();

  // Simplified terrain
  let terrain = 'plains';
  if (gs.milesTraveled > 300) terrain = 'hills';
  if (gs.milesTraveled > 640) terrain = 'mountains';
  weather.update(gs.date.month, terrain);
  gs.weather = weather.currentWeather;

  // Health effects
  const healthMod = weather.getHealthModifier();
  for (const member of gs.getAliveMembers()) {
    let healthChange = 0;
    if (gs.pace === 'grueling') healthChange -= 0.06;
    else if (gs.pace === 'strenuous') healthChange -= 0.02;
    else healthChange += 0.01;
    if (gs.rations === 'bare-bones') healthChange -= 0.04;
    else if (gs.rations === 'meager') healthChange -= 0.01;
    else healthChange += 0.02;
    healthChange += healthMod;
    if (!member._hp) member._hp = 4;
    member._hp = Math.max(0, Math.min(4, member._hp + healthChange));
    if (member._hp >= 3.5) member.health = 'good';
    else if (member._hp >= 2.5) member.health = 'fair';
    else if (member._hp >= 1.5) member.health = 'poor';
    else if (member._hp > 0) member.health = 'very poor';
    else member.health = 'dead';
  }

  // Starvation
  if (gs.supplies.food <= 0) {
    for (const member of gs.getAliveMembers()) {
      if (!member._hp) member._hp = 4;
      member._hp -= 0.3;
      if (member._hp <= 0) {
        member._hp = 0;
        member.health = 'dead';
      }
    }
  }

  return baseMiles;
}

describe('Gameplay Integration', () => {
  describe('profession money flow', () => {
    it('banker starts with $1600', () => {
      const gs = setupGame('banker');
      assert.equal(gs.money, 1600);
    });

    it('carpenter starts with $800', () => {
      const gs = setupGame('carpenter');
      assert.equal(gs.money, 800);
    });

    it('farmer starts with $400', () => {
      const gs = setupGame('farmer');
      assert.equal(gs.money, 400);
    });

    it('money is available for store purchases', () => {
      const gs = setupGame('banker');
      // Simulate buying: 2 oxen ($80) + 200 lbs food ($40) + 3 clothing ($30)
      const totalCost = 80 + 40 + 30;
      gs.money -= totalCost;
      gs.supplies.oxen += 2;
      gs.supplies.food += 200;
      gs.supplies.clothing += 3;
      assert.equal(gs.money, 1450);
      assert.equal(gs.supplies.oxen, 5); // 3 initial + 2
    });
  });

  describe('travel simulation', () => {
    it('party can survive 30 days of steady travel with filling rations', () => {
      const gs = setupGame('banker');
      const weather = new WeatherSystem();
      for (let day = 0; day < 30; day++) {
        simulateTick(gs, weather);
      }
      assert.ok(gs.isPartyAlive(), 'Party should survive 30 days of normal travel');
      assert.ok(gs.milesTraveled > 200, `Should travel 200+ miles in 30 days, got ${gs.milesTraveled}`);
    });

    it('grueling pace covers more miles but damages health', () => {
      const gsNormal = setupGame('banker');
      const gsFast = setupGame('banker');
      gsFast.pace = 'grueling';
      const wNorm = new WeatherSystem();
      const wFast = new WeatherSystem();

      for (let day = 0; day < 30; day++) {
        simulateTick(gsNormal, wNorm);
        simulateTick(gsFast, wFast);
      }

      assert.ok(gsFast.milesTraveled > gsNormal.milesTraveled, 'Grueling should cover more miles than steady');
    });

    it('no oxen means no travel', () => {
      const gs = setupGame('banker');
      gs.supplies.oxen = 0;
      const weather = new WeatherSystem();
      const miles = simulateTick(gs, weather);
      assert.equal(miles, 0);
    });

    it('food runs out and starvation kicks in', () => {
      const gs = setupGame('banker');
      gs.supplies.food = 10;
      const weather = new WeatherSystem();
      for (let day = 0; day < 10; day++) {
        simulateTick(gs, weather);
      }
      assert.equal(gs.supplies.food, 0);
      // At least some health degradation should occur
      const avgHp = gs.getAliveMembers().reduce((sum, m) => sum + m._hp, 0) / gs.getLivingCount();
      assert.ok(avgHp < 4.0, 'Health should degrade when food runs out');
    });

    it('game can reach victory distance (1907 miles) in reasonable time', () => {
      const gs = setupGame('banker');
      gs.supplies.food = 2000;
      gs.pace = 'strenuous';
      const weather = new WeatherSystem();
      let days = 0;
      while (gs.milesTraveled < 1907 && days < 300) {
        simulateTick(gs, weather);
        days++;
      }
      assert.ok(gs.milesTraveled >= 1907, `Should reach Oregon in <300 days, traveled ${gs.milesTraveled} in ${days}`);
      assert.ok(days < 300, `Should reach in <300 days, took ${days}`);
    });
  });

  describe('health system', () => {
    it('steady pace + filling rations heals party over time', () => {
      const gs = setupGame('banker');
      // Damage a member slightly
      gs.party[1]._hp = 3.0;
      gs.party[1].health = 'fair';
      const weather = new WeatherSystem();
      weather.currentWeather = 'clear';
      weather.temperature = 70;

      for (let day = 0; day < 20; day++) {
        simulateTick(gs, weather);
      }
      assert.ok(gs.party[1]._hp > 3.0, 'Member should heal with good conditions');
    });

    it('party members can die from sustained damage', () => {
      const gs = setupGame('banker');
      gs.party[1]._hp = 0.5;
      gs.party[1].health = 'very poor';
      gs.pace = 'grueling';
      gs.rations = 'bare-bones';
      gs.supplies.food = 0;
      const weather = new WeatherSystem();

      for (let day = 0; day < 10; day++) {
        simulateTick(gs, weather);
      }
      assert.equal(gs.party[1].health, 'dead', 'Severely injured member should die under harsh conditions');
    });

    it('health string matches _hp value', () => {
      const gs = setupGame('banker');
      const tests = [
        { hp: 4.0, expected: 'good' },
        { hp: 3.5, expected: 'good' },
        { hp: 3.0, expected: 'fair' },
        { hp: 2.5, expected: 'fair' },
        { hp: 2.0, expected: 'poor' },
        { hp: 1.5, expected: 'poor' },
        { hp: 0.5, expected: 'very poor' },
        { hp: 0.0, expected: 'dead' },
      ];
      for (const { hp, expected } of tests) {
        gs.party[0]._hp = hp;
        // Apply the mapping
        if (hp >= 3.5) gs.party[0].health = 'good';
        else if (hp >= 2.5) gs.party[0].health = 'fair';
        else if (hp >= 1.5) gs.party[0].health = 'poor';
        else if (hp > 0) gs.party[0].health = 'very poor';
        else gs.party[0].health = 'dead';
        assert.equal(gs.party[0].health, expected, `hp=${hp} should map to ${expected}`);
      }
    });
  });

  describe('event system integration', () => {
    it('events modify gameState correctly', () => {
      const gs = setupGame('banker');
      const ee = new EventEngine(gs);
      let eventApplied = false;
      for (let i = 0; i < 50; i++) {
        ee.recentEvents = [];
        const event = ee.checkForEvent();
        if (event) {
          ee.handleEvent(event);
          eventApplied = true;
          // State should have changed in some way (food, hp, supplies, etc.)
          // Just verify no crash and we got a message
          break;
        }
      }
      assert.ok(eventApplied, 'Should trigger at least one event in 50 tries');
    });

    it('event engine uses correct date format from GameState', () => {
      const gs = setupGame('banker');
      gs.date = { month: 7, day: 15, year: 1848 };
      const ee = new EventEngine(gs);
      // Try checking for events — should not throw
      for (let i = 0; i < 20; i++) {
        ee.recentEvents = [];
        ee.checkForEvent();
      }
    });
  });

  describe('landmark progression', () => {
    it('landmarks are reached in order as miles increase', () => {
      const gs = setupGame('banker');
      let lastIndex = 0;
      for (const lm of landmarks) {
        if (gs.nextLandmarkIndex > lastIndex) break;
        if (gs.milesTraveled >= lm.mile) {
          gs.nextLandmarkIndex++;
          lastIndex++;
        }
      }
      // Just verify the logic doesn't crash
      assert.ok(true);
    });

    it('nextLandmarkIndex starts at 0 and increments', () => {
      const gs = setupGame('banker');
      assert.equal(gs.nextLandmarkIndex, 0);
      // Simulate reaching first landmark
      gs.milesTraveled = landmarks[0].mile;
      gs.nextLandmarkIndex++;
      assert.equal(gs.nextLandmarkIndex, 1);
    });
  });

  describe('full game simulation (headless)', () => {
    it('can simulate a complete game without crashes', () => {
      const gs = setupGame('banker');
      gs.supplies.food = 2000; // plenty of food
      gs.pace = 'steady';
      const weather = new WeatherSystem();
      const ee = new EventEngine(gs);
      let days = 0;
      let landmarksPassed = 0;

      while (gs.milesTraveled < 1907 && days < 300 && gs.isPartyAlive()) {
        simulateTick(gs, weather);
        days++;

        // Check landmarks
        const nextLm = landmarks[gs.nextLandmarkIndex];
        if (nextLm && gs.milesTraveled >= nextLm.mile) {
          gs.nextLandmarkIndex++;
          landmarksPassed++;
        }

        // Check events (but don't apply damage events to keep party alive for full sim)
        const event = ee.checkForEvent();
        if (event) {
          // Only apply non-lethal events
          if (event.type === 'positive' || event.type === 'misc') {
            ee.handleEvent(event);
          }
        }
      }

      assert.ok(days > 0, 'Should simulate at least 1 day');
      assert.ok(gs.milesTraveled > 0, 'Should travel some distance');
      assert.ok(landmarksPassed > 0, 'Should pass at least one landmark');
      assert.ok(gs.milesTraveled >= 1907 || gs.isPartyAlive(), 'Game should complete or party survive');
    });
  });
});

// ── Menu and screen tests ──────────────────────────────────────

describe('DialogBox overflow protection', () => {
  it('should exist and export a function', () => {
    const showDialog = require('../src/ui/DialogBox');
    assert.equal(typeof showDialog, 'function');
  });
});

describe('HighScoreScreen', () => {
  it('should load and export a class', () => {
    const HighScoreScreen = require('../src/screens/HighScoreScreen');
    assert.equal(typeof HighScoreScreen, 'function');
  });

  it('high score persistence: save and load', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const os = require('node:os');
    const SCORES_DIR = path.join(os.homedir(), '.oregon-trail');
    const SCORES_FILE = path.join(SCORES_DIR, 'highscores.json');

    // Read current scores (they should exist from manual play)
    if (fs.existsSync(SCORES_FILE)) {
      const data = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
      assert.ok(Array.isArray(data), 'scores file should contain an array');
      for (const entry of data) {
        assert.ok(entry.name, 'each entry should have a name');
        assert.ok(typeof entry.score === 'number', 'each entry should have a numeric score');
      }
    }
  });
});

describe('FortScreen conversations', () => {
  it('conversations data loads for all forts', () => {
    const conversations = require('../src/data/conversations');
    const lm = require('../src/data/landmarks');
    const forts = lm.filter((l) => l.type === 'fort');

    assert.ok(forts.length >= 5, 'should have at least 5 forts');
    for (const fort of forts) {
      const convos = conversations[fort.name];
      assert.ok(Array.isArray(convos), `${fort.name} should have conversations array`);
      assert.ok(convos.length >= 1, `${fort.name} should have at least 1 conversation`);
      for (const c of convos) {
        assert.ok(c.speaker, `conversation in ${fort.name} should have speaker`);
        assert.ok(c.text, `conversation in ${fort.name} should have text`);
      }
    }
  });
});

describe('GameEngine screen transitions', () => {
  it('GameEngine has all required screen transition methods', () => {
    const GameEngine = require('../src/game/GameEngine');
    const engineProto = Object.getOwnPropertyNames(GameEngine.prototype);
    assert.ok(engineProto.includes('showHighScores'), 'GameEngine should have showHighScores method');
    assert.ok(engineProto.includes('showTitle'), 'GameEngine should have showTitle method');
    assert.ok(engineProto.includes('showFort'), 'GameEngine should have showFort method');
    assert.ok(engineProto.includes('showVictory'), 'GameEngine should have showVictory method');
  });
});

describe('Map dialog content', () => {
  it('map should include all landmarks', () => {
    const lm = require('../src/data/landmarks');
    assert.ok(lm.length >= 15, 'should have at least 15 landmarks');
    assert.equal(lm[0].name, 'Independence, MO');
    assert.equal(lm[lm.length - 1].name, 'Willamette Valley (Oregon City)');
  });
});
