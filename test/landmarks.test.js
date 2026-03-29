const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const landmarks = require('../src/data/landmarks');

describe('Landmarks data', () => {
  it('exports an array', () => {
    assert.ok(Array.isArray(landmarks));
  });

  it('has at least 15 landmarks', () => {
    assert.ok(landmarks.length >= 15, `Expected 15+ landmarks, got ${landmarks.length}`);
  });

  it('all landmarks have required fields', () => {
    for (const lm of landmarks) {
      assert.ok(lm.name, 'Landmark missing name');
      assert.ok(typeof lm.mile === 'number', `Landmark ${lm.name} missing mile`);
      assert.ok(lm.type, `Landmark ${lm.name} missing type`);
    }
  });

  it('landmark types are valid', () => {
    const validTypes = ['landmark', 'fort', 'river', 'end', 'start', 'choice'];
    for (const lm of landmarks) {
      assert.ok(validTypes.includes(lm.type), `Landmark ${lm.name} has invalid type: ${lm.type}`);
    }
  });

  it('landmarks are in ascending mile order', () => {
    for (let i = 1; i < landmarks.length; i++) {
      assert.ok(
        landmarks[i].mile >= landmarks[i - 1].mile,
        `Landmark ${landmarks[i].name} (mile ${landmarks[i].mile}) ` +
          `comes before ${landmarks[i - 1].name} (mile ${landmarks[i - 1].mile})`,
      );
    }
  });

  it('starts near Independence, MO', () => {
    assert.ok(landmarks[0].mile <= 20, 'First landmark should be near the start');
  });

  it('ends at Oregon City', () => {
    const last = landmarks[landmarks.length - 1];
    assert.ok(last.name.includes('Oregon') || last.type === 'end', 'Last landmark should be Oregon City or end type');
  });

  it('includes key historical landmarks', () => {
    const names = landmarks.map((lm) => lm.name.toLowerCase());
    const keyLandmarks = ['independence', 'fort kearney', 'chimney rock', 'fort laramie', 'south pass'];
    for (const key of keyLandmarks) {
      assert.ok(
        names.some((n) => n.includes(key)),
        `Missing key landmark: ${key}`,
      );
    }
  });

  it('has at least one river crossing', () => {
    assert.ok(
      landmarks.some((lm) => lm.type === 'river'),
      'No river crossings found',
    );
  });

  it('has at least one fort', () => {
    assert.ok(
      landmarks.some((lm) => lm.type === 'fort'),
      'No forts found',
    );
  });
});
