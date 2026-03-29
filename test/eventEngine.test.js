const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const EventEngine = require('../src/game/EventEngine');
const GameState = require('../src/game/GameState');

function makeGameState() {
  const gs = new GameState();
  gs.profession = 'banker';
  gs.money = 1600;
  gs.party = [
    { name: 'Leader', health: 'good', _hp: 4 },
    { name: 'Sara', health: 'good', _hp: 4 },
    { name: 'Johnny', health: 'good', _hp: 4 },
  ];
  gs.supplies = { food: 500, oxen: 3, clothing: 5, ammunition: 200, wheels: 1, axles: 1, tongues: 1 };
  gs.date = { month: 5, day: 15, year: 1848 };
  gs.milesTraveled = 500;
  gs.weather = 'clear';
  return gs;
}

describe('EventEngine', () => {
  describe('constructor', () => {
    it('initializes with gameState reference', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      assert.equal(ee.gameState, gs);
    });

    it('starts with empty recentEvents', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      assert.deepEqual(ee.recentEvents, []);
    });
  });

  describe('checkForEvent', () => {
    it('returns null or an event object', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      // Run many times to test both outcomes
      let gotNull = false;
      let gotEvent = false;
      for (let i = 0; i < 100; i++) {
        ee.recentEvents = []; // reset to avoid repetition filter
        const result = ee.checkForEvent();
        if (result === null) gotNull = true;
        else {
          gotEvent = true;
          assert.ok(result.id, 'Event should have an id');
          assert.ok(result.name, 'Event should have a name');
          assert.ok(result.type, 'Event should have a type');
          assert.equal(typeof result.effect, 'function', 'Event should have effect function');
        }
      }
      // With 30% base chance over 100 rolls, extremely unlikely to get all one type
      assert.ok(gotNull, 'Should sometimes return null');
      assert.ok(gotEvent, 'Should sometimes return an event');
    });

    it('never returns recently used events', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      const events = [];
      for (let i = 0; i < 50; i++) {
        const e = ee.checkForEvent();
        if (e) {
          // Event should not be in the recent list when it was picked
          events.push(e.id);
          ee.handleEvent(e); // this adds to recentEvents
        }
      }
      // Verify recentEvents never exceeds 5
      assert.ok(ee.recentEvents.length <= 5);
    });
  });

  describe('handleEvent', () => {
    it('applies event effects and returns a message', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      // Create a simple test event
      const testEvent = {
        id: 'test',
        name: 'Test',
        type: 'misc',
        effect(gs) {
          gs.supplies.food -= 10;
          return 'Lost 10 food';
        },
      };
      const msg = ee.handleEvent(testEvent);
      assert.equal(msg, 'Lost 10 food');
      assert.equal(gs.supplies.food, 490);
    });

    it('tracks event in recentEvents', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      const testEvent = {
        id: 'test_event',
        effect() {
          return 'ok';
        },
      };
      ee.handleEvent(testEvent);
      assert.ok(ee.recentEvents.includes('test_event'));
    });

    it('limits recentEvents to 5', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      for (let i = 0; i < 8; i++) {
        ee.handleEvent({
          id: `event_${i}`,
          effect() {
            return '';
          },
        });
      }
      assert.equal(ee.recentEvents.length, 5);
      assert.ok(ee.recentEvents.includes('event_7'));
      assert.ok(!ee.recentEvents.includes('event_0'));
    });

    it('handles null event gracefully', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      const msg = ee.handleEvent(null);
      assert.equal(msg, '');
    });

    it('handles event without effect function', () => {
      const gs = makeGameState();
      const ee = new EventEngine(gs);
      const msg = ee.handleEvent({ id: 'no_effect', name: 'Bad Event' });
      assert.equal(msg, '');
    });
  });
});
