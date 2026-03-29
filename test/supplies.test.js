const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const suppliesData = require('../src/data/supplies');

describe('Supplies data', () => {
  it('exports an object with supplies property', () => {
    assert.ok(suppliesData.supplies, 'Should export a supplies object');
    assert.ok(typeof suppliesData.supplies === 'object');
  });

  it('has the core supply types', () => {
    const keys = Object.keys(suppliesData.supplies);
    const required = ['oxen', 'food', 'clothing', 'ammunition'];
    for (const req of required) {
      assert.ok(keys.includes(req), `Missing supply: ${req}`);
    }
  });

  it('all supplies have name and basePrice', () => {
    for (const [key, s] of Object.entries(suppliesData.supplies)) {
      assert.ok(s.name, `Supply ${key} missing name`);
      assert.ok(typeof s.basePrice === 'number', `Supply ${key} missing basePrice`);
      assert.ok(s.basePrice > 0, `Supply ${key} has non-positive basePrice`);
    }
  });

  it('getPriceMultiplier returns a number', () => {
    assert.equal(typeof suppliesData.getPriceMultiplier, 'function');
    const mult = suppliesData.getPriceMultiplier(500);
    assert.equal(typeof mult, 'number');
    assert.ok(mult > 0);
  });
});
