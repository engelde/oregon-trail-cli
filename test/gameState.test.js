const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const GameState = require('../src/game/GameState');

describe('GameState', () => {
  describe('constructor', () => {
    it('initializes with zero money', () => {
      const gs = new GameState();
      assert.equal(gs.money, 0);
    });

    it('initializes empty party', () => {
      const gs = new GameState();
      assert.deepEqual(gs.party, []);
    });

    it('initializes all supply types to zero', () => {
      const gs = new GameState();
      assert.equal(gs.supplies.food, 0);
      assert.equal(gs.supplies.oxen, 0);
      assert.equal(gs.supplies.clothing, 0);
      assert.equal(gs.supplies.ammunition, 0);
      assert.equal(gs.supplies.wheels, 0);
      assert.equal(gs.supplies.axles, 0);
      assert.equal(gs.supplies.tongues, 0);
    });

    it('starts on March 1, 1848', () => {
      const gs = new GameState();
      assert.deepEqual(gs.date, { month: 3, day: 1, year: 1848 });
    });

    it('starts with steady pace and filling rations', () => {
      const gs = new GameState();
      assert.equal(gs.pace, 'steady');
      assert.equal(gs.rations, 'filling');
    });
  });

  describe('date system', () => {
    it('addDays advances single day correctly', () => {
      const gs = new GameState();
      gs.addDays(1);
      assert.deepEqual(gs.date, { month: 3, day: 2, year: 1848 });
    });

    it('addDays rolls over month correctly', () => {
      const gs = new GameState();
      gs.date = { month: 3, day: 31, year: 1848 };
      gs.addDays(1);
      assert.equal(gs.date.month, 4);
      assert.equal(gs.date.day, 1);
    });

    it('addDays rolls over year correctly', () => {
      const gs = new GameState();
      gs.date = { month: 12, day: 31, year: 1848 };
      gs.addDays(1);
      assert.equal(gs.date.month, 1);
      assert.equal(gs.date.day, 1);
      assert.equal(gs.date.year, 1849);
    });

    it('addDays handles February (28 days)', () => {
      const gs = new GameState();
      gs.date = { month: 2, day: 28, year: 1848 };
      gs.addDays(1);
      assert.equal(gs.date.month, 3);
      assert.equal(gs.date.day, 1);
    });

    it('addDays handles multi-day advance across months', () => {
      const gs = new GameState();
      gs.date = { month: 3, day: 29, year: 1848 };
      gs.addDays(5); // March 29 + 5 = April 3
      assert.equal(gs.date.month, 4);
      assert.equal(gs.date.day, 3);
    });

    it('advanceDay adds miles and advances date', () => {
      const gs = new GameState();
      gs.advanceDay(15);
      assert.equal(gs.milesTraveled, 15);
      assert.equal(gs.date.day, 2);
    });

    it('getDateString formats correctly', () => {
      const gs = new GameState();
      assert.equal(gs.getDateString(), 'March 1, 1848');
    });

    it('getDateString handles all months', () => {
      const gs = new GameState();
      gs.date.month = 7;
      gs.date.day = 15;
      assert.equal(gs.getDateString(), 'July 15, 1848');
    });
  });

  describe('food consumption', () => {
    it('filling rations consume 3 lbs per person per day', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'good' },
        { name: 'B', health: 'good' },
      ];
      gs.supplies.food = 100;
      gs.rations = 'filling';
      const consumed = gs.consumeFood();
      assert.equal(consumed, 6); // 2 people × 3 lbs
      assert.equal(gs.supplies.food, 94);
    });

    it('meager rations consume 2 lbs per person per day', () => {
      const gs = new GameState();
      gs.party = [{ name: 'A', health: 'good' }];
      gs.supplies.food = 100;
      gs.rations = 'meager';
      const consumed = gs.consumeFood();
      assert.equal(consumed, 2);
      assert.equal(gs.supplies.food, 98);
    });

    it('bare-bones rations consume 1 lb per person per day', () => {
      const gs = new GameState();
      gs.party = [{ name: 'A', health: 'good' }];
      gs.supplies.food = 100;
      gs.rations = 'bare-bones';
      const consumed = gs.consumeFood();
      assert.equal(consumed, 1);
    });

    it('dead members do not consume food', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'good' },
        { name: 'B', health: 'dead' },
      ];
      gs.supplies.food = 100;
      gs.rations = 'filling';
      const consumed = gs.consumeFood();
      assert.equal(consumed, 3); // only 1 alive × 3 lbs
    });

    it('food cannot go below zero', () => {
      const gs = new GameState();
      gs.party = [{ name: 'A', health: 'good' }];
      gs.supplies.food = 1;
      gs.rations = 'filling';
      gs.consumeFood();
      assert.equal(gs.supplies.food, 0);
    });
  });

  describe('party helpers', () => {
    it('isPartyAlive returns true when at least one member alive', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'dead' },
        { name: 'B', health: 'poor' },
      ];
      assert.equal(gs.isPartyAlive(), true);
    });

    it('isPartyAlive returns false when all dead', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'dead' },
        { name: 'B', health: 'dead' },
      ];
      assert.equal(gs.isPartyAlive(), false);
    });

    it('getAliveMembers filters out dead members', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'good' },
        { name: 'B', health: 'dead' },
        { name: 'C', health: 'fair' },
      ];
      const alive = gs.getAliveMembers();
      assert.equal(alive.length, 2);
      assert.equal(alive[0].name, 'A');
      assert.equal(alive[1].name, 'C');
    });

    it('getLivingCount returns count of alive members', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'good' },
        { name: 'B', health: 'dead' },
        { name: 'C', health: 'fair' },
      ];
      assert.equal(gs.getLivingCount(), 2);
    });

    it('getHealthStatus returns good when all members healthy', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'good' },
        { name: 'B', health: 'good' },
      ];
      assert.equal(gs.getHealthStatus(), 'good');
    });

    it('getHealthStatus returns fair for mixed health', () => {
      const gs = new GameState();
      gs.party = [
        { name: 'A', health: 'good' },
        { name: 'B', health: 'poor' },
      ];
      // (4 + 2) / 2 = 3.0, which is >= 2.5 → 'fair'
      assert.equal(gs.getHealthStatus(), 'fair');
    });

    it('getHealthStatus returns dead when no one alive', () => {
      const gs = new GameState();
      gs.party = [{ name: 'A', health: 'dead' }];
      assert.equal(gs.getHealthStatus(), 'dead');
    });

    it('getProfessionMultiplier returns correct values', () => {
      const gs = new GameState();
      gs.profession = 'banker';
      assert.equal(gs.getProfessionMultiplier(), 1);
      gs.profession = 'carpenter';
      assert.equal(gs.getProfessionMultiplier(), 2);
      gs.profession = 'farmer';
      assert.equal(gs.getProfessionMultiplier(), 3);
    });
  });
});
