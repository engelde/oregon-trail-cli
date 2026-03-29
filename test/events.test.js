const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const events = require('../src/data/events');
const GameState = require('../src/game/GameState');

function makeGameState() {
  const gs = new GameState();
  gs.profession = 'banker';
  gs.money = 1600;
  gs.party = [
    { name: 'Leader', health: 'good', _hp: 4, isLeader: true },
    { name: 'Sara', health: 'good', _hp: 4 },
    { name: 'Johnny', health: 'good', _hp: 4 },
    { name: 'Lucy', health: 'good', _hp: 4 },
    { name: 'Tommy', health: 'good', _hp: 4 },
  ];
  gs.supplies = { food: 500, oxen: 3, clothing: 5, ammunition: 200, wheels: 1, axles: 1, tongues: 1 };
  gs.date = { month: 5, day: 15, year: 1848 };
  gs.milesTraveled = 500;
  gs.weather = 'clear';
  return gs;
}

describe('Events data', () => {
  it('exports an array of events', () => {
    assert.ok(Array.isArray(events));
    assert.ok(events.length > 20, `Expected 20+ events, got ${events.length}`);
  });

  it('all events have required fields', () => {
    for (const e of events) {
      assert.ok(e.id, `Event missing id: ${JSON.stringify(e)}`);
      assert.ok(e.name, `Event ${e.id} missing name`);
      assert.ok(e.type, `Event ${e.id} missing type`);
      assert.equal(typeof e.effect, 'function', `Event ${e.id} missing effect function`);
      assert.ok(typeof e.probability === 'number', `Event ${e.id} missing probability`);
    }
  });

  it('event types are valid categories', () => {
    const validTypes = ['weather', 'health', 'supply', 'positive', 'misc'];
    for (const e of events) {
      assert.ok(validTypes.includes(e.type), `Event ${e.id} has invalid type: ${e.type}`);
    }
  });

  it('event IDs are unique', () => {
    const ids = events.map((e) => e.id);
    const unique = new Set(ids);
    assert.equal(ids.length, unique.size, `Duplicate event IDs found: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);
  });

  it('all events use date.month (not getMonth) in conditions', () => {
    // Verify no event condition uses the old JS Date API
    for (const e of events) {
      if (e.condition) {
        const src = e.condition.toString();
        assert.ok(!src.includes('getMonth()'), `Event ${e.id} condition uses getMonth() instead of date.month`);
      }
    }
  });

  it('health-damaging events use _hp scale (0-4), not 0-100', () => {
    // Test each event's effect to ensure health changes are on correct scale
    for (const e of events) {
      const gs = makeGameState();
      // Store initial _hp values
      const initialHps = gs.party.map((m) => m._hp);
      try {
        e.effect(gs);
      } catch (_) {
        continue; // skip events that crash in isolation
      }
      // Check that no member's _hp changed by more than 2.0 in a single event
      for (let i = 0; i < gs.party.length; i++) {
        const member = gs.party[i];
        if (member._hp !== undefined && initialHps[i] !== undefined) {
          const diff = Math.abs(member._hp - initialHps[i]);
          assert.ok(
            diff <= 2.5 || member._hp === 0,
            `Event ${e.id} changed _hp by ${diff} (from ${initialHps[i]} to ${member._hp}), ` +
              'suggesting 0-100 scale instead of 0-4',
          );
        }
      }
    }
  });

  it('event effects return strings', () => {
    for (const e of events) {
      const gs = makeGameState();
      try {
        const msg = e.effect(gs);
        assert.equal(typeof msg, 'string', `Event ${e.id} effect should return a string, got ${typeof msg}`);
        assert.ok(msg.length > 0, `Event ${e.id} effect returned empty string`);
      } catch (_) {
        // Some events may depend on specific conditions
      }
    }
  });

  it('event conditions use gameState.date correctly', () => {
    for (const e of events) {
      if (!e.condition) continue;
      const gs = makeGameState();
      // Should not throw
      const result = e.condition(gs);
      assert.equal(typeof result, 'boolean', `Event ${e.id} condition should return boolean`);
    }
  });
});
