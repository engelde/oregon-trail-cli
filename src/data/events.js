function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getAlive(gs) {
  return gs.party.filter((m) => m.health !== 'dead');
}

function damageHp(member, amount) {
  if (!member._hp && member._hp !== 0) member._hp = 4;
  member._hp = Math.max(0, member._hp - amount);
  updateHealthString(member);
}

function healHp(member, amount) {
  if (!member._hp && member._hp !== 0) member._hp = 4;
  member._hp = Math.min(4, member._hp + amount);
  updateHealthString(member);
}

function killMember(member, cause) {
  member._hp = 0;
  member.health = 'dead';
  member.causeOfDeath = cause;
}

function updateHealthString(member) {
  if (member._hp >= 3.5) member.health = 'good';
  else if (member._hp >= 2.5) member.health = 'fair';
  else if (member._hp >= 1.5) member.health = 'poor';
  else if (member._hp > 0) member.health = 'very poor';
  else member.health = 'dead';
}

const events = [
  // ── Weather events ──
  {
    id: 'heavy_rain',
    type: 'weather',
    name: 'Heavy Rain',
    description: 'Dark clouds open up and rain pours down in sheets, turning the trail to deep mud.',
    probability: 0.06,
    effect(gs) {
      const lost = randInt(1, 2);
      gs.daysLost = (gs.daysLost || 0) + lost;
      gs.speedModifier = 0.5;
      return `Heavy rain! You lose ${lost} day${lost > 1 ? 's' : ''} and travel is slow through the mud.`;
    },
    condition(gs) {
      const m = gs.date ? gs.date.month - 1 : 3;
      return m >= 2 && m <= 9; // March through October
    },
  },
  {
    id: 'thunderstorm',
    type: 'weather',
    name: 'Thunderstorm',
    description: 'Lightning splits the sky and thunder shakes the ground. The oxen are terrified.',
    probability: 0.04,
    effect(gs) {
      gs.daysLost = (gs.daysLost || 0) + 1;
      if (Math.random() < 0.3) {
        gs.supplies.food = Math.max(0, gs.supplies.food - randInt(5, 20));
        return 'A violent thunderstorm! Lightning strikes near the wagon, damaging some food supplies. You lose a day.';
      }
      return 'A fierce thunderstorm forces you to make camp. You lose a day waiting it out.';
    },
  },
  {
    id: 'blizzard',
    type: 'weather',
    name: 'Blizzard',
    description: 'A wall of white engulfs the wagon train. Temperatures plummet and visibility drops to nothing.',
    probability: 0.03,
    effect(gs) {
      const lost = randInt(2, 3);
      gs.daysLost = (gs.daysLost || 0) + lost;
      for (const member of gs.party) {
        if (member.health !== 'dead') {
          damageHp(member, 0.3 + Math.random() * 0.3);
        }
      }
      return `A terrible blizzard! You are trapped for ${lost} days. Everyone suffers from the bitter cold.`;
    },
    condition(gs) {
      const m = gs.date ? gs.date.month - 1 : 3;
      return m >= 9 || m <= 2; // October through March
    },
  },
  {
    id: 'very_hot',
    type: 'weather',
    name: 'Very Hot Day',
    description: 'The sun beats down mercilessly. Heat shimmers rise from the parched trail ahead.',
    probability: 0.05,
    effect(gs) {
      for (const member of gs.party) {
        if (member.health !== 'dead') {
          damageHp(member, 0.1 + Math.random() * 0.2);
        }
      }
      gs.supplies.water = Math.max(0, (gs.supplies.water || 0) - 5);
      return "Sweltering heat! The blazing sun saps everyone's strength.";
    },
    condition(gs) {
      const m = gs.date ? gs.date.month - 1 : 3;
      return m >= 5 && m <= 7; // June through August
    },
  },
  {
    id: 'hail_storm',
    type: 'weather',
    name: 'Hail Storm',
    description: 'Ice chunks the size of walnuts rain down from a green-black sky.',
    probability: 0.02,
    effect(gs) {
      gs.supplies.clothing = Math.max(0, gs.supplies.clothing - randInt(1, 2));
      gs.supplies.food = Math.max(0, gs.supplies.food - randInt(10, 30));
      for (const member of gs.party) {
        if (member.health !== 'dead') {
          damageHp(member, 0.08 + Math.random() * 0.12);
        }
      }
      return 'A brutal hail storm batters the wagon! Some clothing and food are damaged.';
    },
  },
  {
    id: 'heavy_fog',
    type: 'weather',
    name: 'Heavy Fog',
    description: 'A thick fog rolls in, blanketing the trail in white. You can barely see the oxen.',
    probability: 0.04,
    effect(gs) {
      gs.speedModifier = 0.4;
      return 'Dense fog makes travel nearly impossible. You creep along at a crawl today.';
    },
  },

  // ── Health events ──
  {
    id: 'cholera',
    type: 'health',
    name: 'Cholera',
    description: 'The dreaded cholera strikes without warning, the scourge of the overland trails.',
    probability: 0.02,
    effect(gs) {
      const alive = getAlive(gs);
      if (alive.length === 0) return 'No one in the party is affected.';
      const victim = pickRandom(alive);
      if (Math.random() < 0.4) {
        killMember(victim, 'cholera');
        return `${victim.name} has died of cholera.`;
      }
      damageHp(victim, 1.2 + Math.random() * 0.8);
      victim.illness = 'cholera';
      victim.illnessDays = randInt(5, 12);
      return `${victim.name} has cholera. They are very ill.`;
    },
  },
  {
    id: 'dysentery',
    type: 'health',
    name: 'Dysentery',
    description: 'Contaminated water brings the misery of dysentery to the wagon train.',
    probability: 0.03,
    effect(gs) {
      const alive = getAlive(gs);
      if (alive.length === 0) return 'No one in the party is affected.';
      const victim = pickRandom(alive);
      if (Math.random() < 0.2) {
        killMember(victim, 'dysentery');
        return `${victim.name} has died of dysentery.`;
      }
      damageHp(victim, 0.8 + Math.random() * 0.6);
      victim.illness = 'dysentery';
      victim.illnessDays = randInt(3, 8);
      return `${victim.name} has dysentery. They are miserable but hanging on.`;
    },
  },
  {
    id: 'typhoid',
    type: 'health',
    name: 'Typhoid Fever',
    description: 'Typhoid fever, the silent killer of the frontier, has found your wagon.',
    probability: 0.015,
    effect(gs) {
      const alive = getAlive(gs);
      if (alive.length === 0) return 'No one in the party is affected.';
      const victim = pickRandom(alive);
      if (Math.random() < 0.3) {
        killMember(victim, 'typhoid fever');
        return `${victim.name} has died of typhoid fever.`;
      }
      damageHp(victim, 1.0 + Math.random() * 0.8);
      victim.illness = 'typhoid';
      victim.illnessDays = randInt(7, 14);
      return `${victim.name} has typhoid fever. It will be a long recovery.`;
    },
  },
  {
    id: 'measles',
    type: 'health',
    name: 'Measles',
    description: 'Red spots and fever — the measles have spread to your party.',
    probability: 0.02,
    effect(gs) {
      const alive = getAlive(gs);
      if (alive.length === 0) return 'No one in the party is affected.';
      const victim = pickRandom(alive);
      if (Math.random() < 0.15) {
        killMember(victim, 'measles');
        return `${victim.name} has died of measles.`;
      }
      damageHp(victim, 0.6 + Math.random() * 0.6);
      victim.illness = 'measles';
      victim.illnessDays = randInt(5, 10);
      return `${victim.name} has the measles. They need rest.`;
    },
  },
  {
    id: 'snakebite',
    type: 'health',
    name: 'Snakebite',
    description: 'A rattlesnake strikes from beneath a rock as someone gathers firewood.',
    probability: 0.02,
    effect(gs) {
      const alive = getAlive(gs);
      if (alive.length === 0) return 'No one in the party is affected.';
      const victim = pickRandom(alive);
      if (Math.random() < 0.15) {
        killMember(victim, 'a snakebite');
        return `${victim.name} was bitten by a rattlesnake and has died.`;
      }
      damageHp(victim, 0.6 + Math.random() * 0.4);
      victim.illness = 'snakebite';
      victim.illnessDays = randInt(2, 5);
      return `${victim.name} was bitten by a rattlesnake! They are in pain but will recover.`;
    },
    condition(gs) {
      const m = gs.date ? gs.date.month - 1 : 3;
      return m >= 3 && m <= 8; // April through September
    },
  },
  {
    id: 'broken_arm',
    type: 'health',
    name: 'Broken Arm',
    description: 'A fall from the wagon results in a broken arm.',
    probability: 0.02,
    effect(gs) {
      const alive = getAlive(gs);
      if (alive.length === 0) return 'No one in the party is affected.';
      const victim = pickRandom(alive);
      damageHp(victim, 0.3 + Math.random() * 0.3);
      victim.illness = 'brokenArm';
      victim.illnessDays = randInt(5, 15);
      return `${victim.name} has broken their arm. They can't help with camp duties.`;
    },
  },
  {
    id: 'broken_leg',
    type: 'health',
    name: 'Broken Leg',
    description: "A wagon wheel rolls over someone's leg, breaking it badly.",
    probability: 0.015,
    effect(gs) {
      const alive = getAlive(gs);
      if (alive.length === 0) return 'No one in the party is affected.';
      const victim = pickRandom(alive);
      if (Math.random() < 0.02) {
        killMember(victim, 'a broken leg');
        return `${victim.name} broke their leg badly and has died from complications.`;
      }
      damageHp(victim, 0.6 + Math.random() * 0.4);
      victim.illness = 'brokenLeg';
      victim.illnessDays = randInt(7, 20);
      return `${victim.name} has a broken leg. Travel will be slower while they heal.`;
    },
  },
  {
    id: 'exhaustion',
    type: 'health',
    name: 'Exhaustion',
    description: 'The relentless pace has taken its toll on the party.',
    probability: 0.04,
    effect(gs) {
      for (const member of gs.party) {
        if (member.health !== 'dead') {
          damageHp(member, 0.2 + Math.random() * 0.3);
        }
      }
      return 'The whole party is suffering from exhaustion. Consider resting or slowing down.';
    },
    condition(gs) {
      return gs.pace === 'grueling' || gs.pace === 'strenuous';
    },
  },

  // ── Supply events ──
  {
    id: 'thief_food',
    type: 'supply',
    name: 'Thief Steals Food',
    description: 'In the night, someone crept into camp and made off with some of your food.',
    probability: 0.02,
    effect(gs) {
      const stolen = randInt(20, 50);
      gs.supplies.food = Math.max(0, gs.supplies.food - stolen);
      return `A thief stole ${stolen} pounds of food during the night!`;
    },
  },
  {
    id: 'thief_clothes',
    type: 'supply',
    name: 'Thief Steals Clothing',
    description: 'A sneaky thief made off with some clothing from the wagon.',
    probability: 0.015,
    effect(gs) {
      const stolen = randInt(1, 2);
      gs.supplies.clothing = Math.max(0, gs.supplies.clothing - stolen);
      return `A thief stole ${stolen} set${stolen > 1 ? 's' : ''} of clothing!`;
    },
  },
  {
    id: 'thief_ammo',
    type: 'supply',
    name: 'Thief Steals Ammunition',
    description: 'Someone made off with some of your ammunition boxes while you slept.',
    probability: 0.015,
    effect(gs) {
      const stolen = randInt(1, 3);
      gs.supplies.ammunition = Math.max(0, gs.supplies.ammunition - stolen);
      return `A thief stole ${stolen} box${stolen > 1 ? 'es' : ''} of ammunition!`;
    },
  },
  {
    id: 'ox_wanders',
    type: 'supply',
    name: 'Ox Wanders Off',
    description: 'One of your oxen has wandered away from camp during the night.',
    probability: 0.02,
    effect(gs) {
      if (gs.supplies.oxen > 1) {
        gs.supplies.oxen -= 1;
        return 'An ox wandered off during the night and could not be found. You now have fewer oxen.';
      }
      return 'An ox tried to wander off but you caught it just in time!';
    },
  },
  {
    id: 'ox_dies',
    type: 'supply',
    name: 'Ox Injured or Dies',
    description: 'One of your oxen steps in a prairie dog hole and goes down hard.',
    probability: 0.02,
    effect(gs) {
      if (gs.supplies.oxen > 1) {
        gs.supplies.oxen -= 1;
        return 'An ox stepped in a hole and broke its leg. You had to put it down.';
      }
      return 'An ox stumbled badly but managed to get back on its feet.';
    },
  },
  {
    id: 'wheel_breaks',
    type: 'supply',
    name: 'Wagon Wheel Breaks',
    description: 'A loud crack rings out — one of your wagon wheels has shattered on a rock.',
    probability: 0.03,
    effect(gs) {
      if (gs.supplies.wheels > 0) {
        gs.supplies.wheels -= 1;
        gs.daysLost = (gs.daysLost || 0) + 1;
        return 'A wagon wheel broke! You used a spare to replace it, losing a day for repairs.';
      }
      gs.daysLost = (gs.daysLost || 0) + 3;
      return 'A wagon wheel broke and you have no spares! You lose 3 days jury-rigging a repair.';
    },
  },
  {
    id: 'axle_breaks',
    type: 'supply',
    name: 'Wagon Axle Breaks',
    description: 'The wagon lurches violently — an axle has snapped under the strain.',
    probability: 0.02,
    effect(gs) {
      if (gs.supplies.axles > 0) {
        gs.supplies.axles -= 1;
        gs.daysLost = (gs.daysLost || 0) + 1;
        return 'A wagon axle broke! You used a spare to fix it, losing a day.';
      }
      gs.daysLost = (gs.daysLost || 0) + 3;
      return 'A wagon axle broke and you have no spares! You lose 3 days making repairs.';
    },
  },
  {
    id: 'tongue_breaks',
    type: 'supply',
    name: 'Wagon Tongue Breaks',
    description: 'The wagon tongue snaps, leaving the wagon unhitched from the team.',
    probability: 0.02,
    effect(gs) {
      if (gs.supplies.tongues > 0) {
        gs.supplies.tongues -= 1;
        gs.daysLost = (gs.daysLost || 0) + 1;
        return 'The wagon tongue broke! You used a spare to replace it, losing a day.';
      }
      gs.daysLost = (gs.daysLost || 0) + 3;
      return 'The wagon tongue broke and you have no spares! You lose 3 days fashioning a new one.';
    },
  },
  {
    id: 'wagon_fire',
    type: 'supply',
    name: 'Fire in Wagon',
    description: 'A spark from the campfire catches the wagon canvas. Flames spread quickly!',
    probability: 0.01,
    effect(gs) {
      const foodLost = randInt(30, 80);
      const clothingLost = randInt(1, 3);
      const ammoLost = randInt(1, 4);
      gs.supplies.food = Math.max(0, gs.supplies.food - foodLost);
      gs.supplies.clothing = Math.max(0, gs.supplies.clothing - clothingLost);
      gs.supplies.ammunition = Math.max(0, gs.supplies.ammunition - ammoLost);
      return `Fire in the wagon! You lost ${foodLost} lbs of food, ${clothingLost} sets of clothing, and ${ammoLost} boxes of ammo before putting it out.`;
    },
  },
  {
    id: 'bad_water',
    type: 'supply',
    name: 'Bad Water',
    description: 'The water source looked clean, but it was anything but.',
    probability: 0.03,
    effect(gs) {
      const alive = getAlive(gs);
      for (const member of alive) {
        damageHp(member, 0.2 + Math.random() * 0.4);
      }
      return 'The party drank bad water! Everyone feels ill.';
    },
  },

  // ── Positive events ──
  {
    id: 'wild_fruit',
    type: 'positive',
    name: 'Find Wild Fruit',
    description: 'Bushes heavy with ripe berries line the trail — a welcome sight!',
    probability: 0.04,
    effect(gs) {
      const found = randInt(20, 50);
      gs.supplies.food += found;
      return `You found wild fruit! You gathered ${found} pounds of berries and plums.`;
    },
    condition(gs) {
      const m = gs.date ? gs.date.month - 1 : 5;
      return m >= 4 && m <= 8; // May through September
    },
  },
  {
    id: 'abandoned_wagon',
    type: 'positive',
    name: 'Find Abandoned Wagon',
    description: 'An abandoned wagon sits by the trail, its owners long gone.',
    probability: 0.02,
    effect(gs) {
      const messages = [];
      if (Math.random() < 0.5) {
        const food = randInt(10, 40);
        gs.supplies.food += food;
        messages.push(`${food} lbs of food`);
      }
      if (Math.random() < 0.3) {
        gs.supplies.clothing += 1;
        messages.push('1 set of clothing');
      }
      if (Math.random() < 0.3) {
        gs.supplies.ammunition += randInt(1, 2);
        messages.push('some ammunition');
      }
      if (Math.random() < 0.2) {
        const part = pickRandom(['wheels', 'axles', 'tongues']);
        gs.supplies[part] += 1;
        messages.push(`a spare wagon ${part.slice(0, -1)}`);
      }
      if (messages.length === 0) {
        return 'You found an abandoned wagon, but it had already been picked clean.';
      }
      return `You found an abandoned wagon with ${messages.join(', ')}!`;
    },
  },
  {
    id: 'travelers_share',
    type: 'positive',
    name: 'Fellow Travelers Share Food',
    description: 'A kind family traveling the trail offers to share their surplus.',
    probability: 0.03,
    effect(gs) {
      const food = randInt(25, 50);
      gs.supplies.food += food;
      return `Fellow travelers share ${food} pounds of food with your party. How generous!`;
    },
  },
  {
    id: 'fresh_spring',
    type: 'positive',
    name: 'Fresh Water Spring',
    description: 'You discover a clear, cold spring bubbling up from the rocks.',
    probability: 0.03,
    effect(gs) {
      for (const member of gs.party) {
        if (member.health !== 'dead') {
          healHp(member, 0.2 + Math.random() * 0.2);
        }
      }
      return 'A fresh water spring! Everyone drinks deeply and feels refreshed.';
    },
  },
  {
    id: 'beautiful_weather',
    type: 'positive',
    name: 'Beautiful Weather',
    description: 'A perfect day on the trail — blue skies, gentle breeze, and good road.',
    probability: 0.05,
    effect(gs) {
      for (const member of gs.party) {
        if (member.health !== 'dead') {
          healHp(member, 0.08 + Math.random() * 0.12);
          member.morale = Math.min(100, (member.morale || 50) + randInt(3, 8));
        }
      }
      return 'What a beautiful day! Spirits are high and everyone feels good.';
    },
  },

  // ── Misc events ──
  {
    id: 'lost_trail',
    type: 'misc',
    name: 'Lost Trail',
    description: 'The trail fades into the prairie grass. Which way now?',
    probability: 0.03,
    effect(gs) {
      const extra = randInt(10, 20);
      gs.extraMiles = (gs.extraMiles || 0) + extra;
      return `You lost the trail and wandered ${extra} extra miles before finding it again.`;
    },
  },
  {
    id: 'bad_road',
    type: 'misc',
    name: 'Bad Road Conditions',
    description: 'Deep ruts, rocks, and washouts make the trail nearly impassable.',
    probability: 0.04,
    effect(gs) {
      gs.speedModifier = 0.5;
      return 'Terrible road conditions! You can only manage half your normal distance today.';
    },
  },
  {
    id: 'native_trade',
    type: 'misc',
    name: 'Encounter Native Americans',
    description: 'A group of Native Americans approaches your wagon. They seem friendly and interested in trading.',
    probability: 0.03,
    effect(gs) {
      if (gs.supplies.clothing > 2) {
        gs.supplies.clothing -= 1;
        const food = randInt(30, 60);
        gs.supplies.food += food;
        return `You traded 1 set of clothing with Native Americans for ${food} pounds of food. A fair exchange!`;
      }
      return 'Native Americans visit your camp. You share a meal and they point out good water ahead.';
    },
  },
  {
    id: 'find_grave',
    type: 'misc',
    name: 'Find Grave Along Trail',
    description: 'A lonely wooden marker stands by the trail, weathered by wind and sun.',
    probability: 0.06,
    effect(gs) {
      const names = [
        'Mary Henderson',
        'James Polk',
        'Sarah Mitchell',
        'William Cooper',
        'little Eliza',
        'Thomas Gray',
        'Margaret White',
        'an unknown traveler',
      ];
      const causes = [
        'cholera',
        'fever',
        'drowning at a river crossing',
        'an accidental gunshot',
        'dysentery',
        'exposure',
      ];
      const name = pickRandom(names);
      const cause = pickRandom(causes);
      for (const member of gs.party) {
        if (member.health !== 'dead') {
          member.morale = Math.max(0, (member.morale || 50) - randInt(1, 3));
        }
      }
      return `You pass the grave of ${name}, who died of ${cause}. A somber reminder of the trail's dangers.`;
    },
  },
  {
    id: 'river_flooded',
    type: 'misc',
    name: 'River Flooded',
    description: 'Recent rains have swollen a creek into a raging torrent. There is no crossing today.',
    probability: 0.02,
    effect(gs) {
      const lost = randInt(1, 3);
      gs.daysLost = (gs.daysLost || 0) + lost;
      return `A flooded creek blocks your path! You wait ${lost} day${lost > 1 ? 's' : ''} for the water to recede.`;
    },
    condition(gs) {
      const m = gs.date ? gs.date.month - 1 : 3;
      return m >= 2 && m <= 5; // March through June (spring runoff)
    },
  },
];

module.exports = events;
