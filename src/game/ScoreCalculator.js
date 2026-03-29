/**
 * Calculate the final score for an Oregon Trail game.
 * @param {object} gameState
 * @param {Array} gameState.party - Array of {name, alive, health}
 * @param {object} gameState.supplies - {food, clothing, ammunition, wheels, axles, tongues, oxen}
 * @param {number} gameState.money - Remaining cash
 * @param {string} gameState.profession - 'banker' | 'carpenter' | 'farmer'
 * @returns {{total: number, breakdown: {party: number, supplies: number, cash: number, multiplier: number}}}
 */
function calculate(gameState) {
  const { party, supplies, money, profession } = gameState;

  // Party member points
  let partyPoints = 0;
  for (const member of party) {
    if (!member.alive) continue;
    partyPoints += 500; // base per survivor
    const health = member.health || 0;
    if (health >= 70)
      partyPoints += 200; // good health bonus
    else if (health >= 40) partyPoints += 100; // fair health bonus
  }

  // Supply points
  const food = (supplies.food || 0) * 0.04;
  const clothing = (supplies.clothing || 0) * 2;
  const ammunition = (supplies.ammunition || 0) * 2;
  const spareParts = ((supplies.wheels || 0) + (supplies.axles || 0) + (supplies.tongues || 0)) * 5;
  const oxenPoints = (supplies.oxen || 0) * 50;
  const supplyPoints = food + clothing + ammunition + spareParts + oxenPoints;

  // Cash points
  const cashPoints = (money || 0) * 0.04;

  // Profession multiplier
  const multiplierMap = {
    banker: 1,
    carpenter: 2,
    farmer: 3,
  };
  const multiplier = multiplierMap[(profession || '').toLowerCase()] || 1;

  const rawTotal = partyPoints + supplyPoints + cashPoints;
  const total = Math.round(rawTotal * multiplier);

  return {
    total,
    breakdown: {
      party: partyPoints,
      supplies: Math.round(supplyPoints * 100) / 100,
      cash: Math.round(cashPoints * 100) / 100,
      multiplier,
    },
  };
}

module.exports = { calculate };
