const supplies = {
  oxen: {
    name: 'Oxen',
    unit: 'yoke',
    unitSize: 2,
    basePrice: 40,
    description: 'A yoke of 2 oxen',
    min: 1,
    max: 9,
  },
  food: {
    name: 'Food',
    unit: 'pounds',
    unitSize: 1,
    basePrice: 0.2,
    description: 'Pounds of food',
    min: 0,
    max: 2000,
    buyIncrement: 50,
  },
  clothing: {
    name: 'Clothing',
    unit: 'sets',
    unitSize: 1,
    basePrice: 10,
    description: 'Sets of clothing',
    min: 0,
    max: 99,
  },
  ammunition: {
    name: 'Ammunition',
    unit: 'boxes',
    unitSize: 20,
    basePrice: 2,
    description: 'Box of 20 bullets',
    min: 0,
    max: 99,
  },
  wheels: {
    name: 'Wagon wheels',
    unit: 'each',
    unitSize: 1,
    basePrice: 10,
    description: 'Spare wagon wheel',
    min: 0,
    max: 9,
  },
  axles: {
    name: 'Wagon axles',
    unit: 'each',
    unitSize: 1,
    basePrice: 10,
    description: 'Spare wagon axle',
    min: 0,
    max: 9,
  },
  tongues: {
    name: 'Wagon tongues',
    unit: 'each',
    unitSize: 1,
    basePrice: 10,
    description: 'Spare wagon tongue',
    min: 0,
    max: 9,
  },
};

/**
 * Returns a price multiplier based on how far west a landmark is.
 * Prices increase from 1.0 at Independence to ~3.0 at Fort Boise.
 */
function getPriceMultiplier(landmarkIndex) {
  // Landmark indices with stores: 0 (Independence), 3 (Fort Kearney),
  // 5 (Fort Laramie), 9 (Fort Bridger), 11 (Fort Hall), 13 (Fort Boise)
  const multipliers = {
    0: 1.0, // Independence, MO
    3: 1.25, // Fort Kearney
    5: 1.5, // Fort Laramie
    9: 2.0, // Fort Bridger
    11: 2.5, // Fort Hall
    13: 3.0, // Fort Boise
  };

  if (multipliers[landmarkIndex] !== undefined) {
    return multipliers[landmarkIndex];
  }

  // Interpolate for any other index
  const keys = Object.keys(multipliers)
    .map(Number)
    .sort((a, b) => a - b);
  if (landmarkIndex <= keys[0]) return multipliers[keys[0]];
  if (landmarkIndex >= keys[keys.length - 1]) return multipliers[keys[keys.length - 1]];

  for (let i = 0; i < keys.length - 1; i++) {
    if (landmarkIndex >= keys[i] && landmarkIndex <= keys[i + 1]) {
      const range = keys[i + 1] - keys[i];
      const progress = (landmarkIndex - keys[i]) / range;
      return multipliers[keys[i]] + progress * (multipliers[keys[i + 1]] - multipliers[keys[i]]);
    }
  }

  return 1.0;
}

module.exports = { supplies, getPriceMultiplier };
