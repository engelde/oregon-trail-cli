const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../src/game/ScoreCalculator');

describe('ScoreCalculator', () => {
  it('calculates score for a winning banker game', () => {
    const gs = {
      party: [
        { name: 'A', alive: true, health: 80 },
        { name: 'B', alive: true, health: 50 },
      ],
      supplies: { food: 100, clothing: 3, ammunition: 50, wheels: 1, axles: 1, tongues: 1, oxen: 2 },
      money: 200,
      profession: 'banker',
    };
    const result = calculate(gs);
    assert.ok(result.total > 0, 'Score should be positive');
    assert.equal(result.breakdown.multiplier, 1);
  });

  it('farmer gets 3x multiplier', () => {
    const gs = {
      party: [{ name: 'A', alive: true, health: 80 }],
      supplies: { food: 100, oxen: 1 },
      money: 0,
      profession: 'farmer',
    };
    const result = calculate(gs);
    assert.equal(result.breakdown.multiplier, 3);
  });

  it('carpenter gets 2x multiplier', () => {
    const gs = {
      party: [{ name: 'A', alive: true, health: 80 }],
      supplies: { food: 100, oxen: 1 },
      money: 0,
      profession: 'carpenter',
    };
    const result = calculate(gs);
    assert.equal(result.breakdown.multiplier, 2);
  });

  it('dead party members do not contribute points', () => {
    const gs = {
      party: [
        { name: 'A', alive: false, health: 0 },
        { name: 'B', alive: true, health: 80 },
      ],
      supplies: { food: 0, oxen: 0 },
      money: 0,
      profession: 'banker',
    };
    const result = calculate(gs);
    // Only 1 alive member should score, not 2
    assert.equal(result.breakdown.party, 700); // 500 base + 200 health bonus
  });

  it('returns breakdown with party, supplies, cash, multiplier', () => {
    const gs = {
      party: [{ name: 'A', alive: true, health: 80 }],
      supplies: { food: 100, oxen: 1, clothing: 2, ammunition: 10 },
      money: 50,
      profession: 'banker',
    };
    const result = calculate(gs);
    assert.ok('total' in result);
    assert.ok('breakdown' in result);
    assert.ok('party' in result.breakdown);
    assert.ok('supplies' in result.breakdown);
    assert.ok('cash' in result.breakdown);
    assert.ok('multiplier' in result.breakdown);
  });

  it('handles empty/missing supplies gracefully', () => {
    const gs = {
      party: [],
      supplies: {},
      money: 0,
      profession: 'banker',
    };
    const result = calculate(gs);
    assert.equal(result.total, 0);
  });
});
