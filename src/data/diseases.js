const diseases = {
  cholera: {
    name: 'cholera',
    severity: 'severe',
    daysToRecover: [5, 12],
    deathChance: 0.4,
    restBonus: 0.3,
  },
  dysentery: {
    name: 'dysentery',
    severity: 'moderate',
    daysToRecover: [3, 8],
    deathChance: 0.2,
    restBonus: 0.25,
  },
  typhoid: {
    name: 'typhoid fever',
    severity: 'severe',
    daysToRecover: [7, 14],
    deathChance: 0.3,
    restBonus: 0.3,
  },
  measles: {
    name: 'measles',
    severity: 'moderate',
    daysToRecover: [5, 10],
    deathChance: 0.15,
    restBonus: 0.2,
  },
  snakebite: {
    name: 'a snakebite',
    severity: 'moderate',
    daysToRecover: [2, 5],
    deathChance: 0.15,
    restBonus: 0.15,
  },
  brokenArm: {
    name: 'a broken arm',
    severity: 'minor',
    daysToRecover: [5, 15],
    deathChance: 0.0,
    restBonus: 0.1,
  },
  brokenLeg: {
    name: 'a broken leg',
    severity: 'minor',
    daysToRecover: [7, 20],
    deathChance: 0.02,
    restBonus: 0.1,
  },
};

/**
 * Returns the daily chance of contracting a disease based on conditions.
 * @param {'steady'|'strenuous'|'grueling'} pace - Travel pace
 * @param {'filling'|'meager'|'bare bones'} rations - Ration level
 * @param {string} weather - Current weather condition
 * @returns {number} Probability 0-1
 */
function getDiseaseChance(pace, rations, weather) {
  let chance = 0.02; // 2% base daily chance

  // Pace modifier
  if (pace === 'strenuous') chance += 0.02;
  else if (pace === 'grueling') chance += 0.05;

  // Rations modifier
  if (rations === 'meager') chance += 0.02;
  else if (rations === 'bare bones') chance += 0.06;

  // Weather modifier
  const badWeather = ['heavy rain', 'blizzard', 'thunderstorm', 'snow'];
  const mildBadWeather = ['rain', 'hot', 'fog'];
  if (badWeather.includes(weather)) chance += 0.04;
  else if (mildBadWeather.includes(weather)) chance += 0.01;

  return Math.min(chance, 0.25);
}

module.exports = { diseases, getDiseaseChance };
