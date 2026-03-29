const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const diseasesData = require('../src/data/diseases');

describe('Diseases data', () => {
  it('exports an object with diseases property', () => {
    assert.ok(diseasesData.diseases, 'Should export a diseases object');
    assert.ok(typeof diseasesData.diseases === 'object');
  });

  it('includes dysentery (the classic!)', () => {
    const names = Object.keys(diseasesData.diseases);
    assert.ok(
      names.some((n) => n.toLowerCase().includes('dysentery')),
      'Missing dysentery — the most iconic Oregon Trail disease!',
    );
  });

  it('has multiple diseases', () => {
    const count = Object.keys(diseasesData.diseases).length;
    assert.ok(count >= 3, `Expected at least 3 diseases, got ${count}`);
  });

  it('each disease has a name', () => {
    for (const [key, d] of Object.entries(diseasesData.diseases)) {
      assert.ok(d.name, `Disease ${key} missing name`);
    }
  });
});
