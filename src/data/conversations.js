'use strict';

const conversations = {
  'Fort Kearney': [
    {
      speaker: 'A fellow traveler',
      text: 'The Platte River valley ahead is flat and easy going, but don\'t let it fool you. There\'s no timber for firewood — collect buffalo chips along the way.',
    },
    {
      speaker: 'A soldier at the fort',
      text: 'We\'ve had reports of cholera along the trail this year. Boil your water and keep your camp clean. Many a family has been buried between here and Chimney Rock.',
    },
    {
      speaker: 'A fur trader',
      text: 'Stock up on food here while prices are fair. By Fort Laramie you\'ll pay half again as much, and it only gets worse from there.',
    },
    {
      speaker: 'An emigrant woman',
      text: 'We lost an ox to bad water twenty miles back. Make sure your animals drink from running streams, not stagnant pools.',
    },
  ],

  'Fort Laramie': [
    {
      speaker: 'A mountain man',
      text: 'The trail gets rougher past here. You\'ll be climbing into the foothills and the grass gets thinner. Rest your oxen well before moving on.',
    },
    {
      speaker: 'A blacksmith',
      text: 'I\'ve seen a dozen busted axles this week alone. The road to Independence Rock is rocky and hard on wagons. Buy spare parts if you haven\'t already.',
    },
    {
      speaker: 'An Army officer',
      text: 'Try to reach South Pass before October. I\'ve seen early snows trap wagon trains in the mountains. Time is not your friend past here.',
    },
    {
      speaker: 'A Sioux trader',
      text: 'The Sweetwater River is good water for your stock. Follow it west from Independence Rock and it will lead you through the pass.',
    },
  ],

  'Fort Bridger': [
    {
      speaker: 'Jim Bridger himself',
      text: 'The Green River is cold as snowmelt and fast. Pay the ferry toll — I\'ve seen too many fools try to ford it and lose everything.',
    },
    {
      speaker: 'A weary emigrant',
      text: 'We came over South Pass last week. The descent was gentle, but my wife took ill with fever. Let your people rest when they need it.',
    },
    {
      speaker: 'A supply merchant',
      text: 'Soda Springs is a wonder — water that fizzes like champagne right from the ground. But there\'s nothing to buy between here and Fort Hall, so stock up now.',
    },
    {
      speaker: 'A trail guide',
      text: 'If your food is running low, try hunting in the valleys. Game is scarce in the high desert ahead, but you might find antelope near the creeks.',
    },
  ],

  'Fort Hall': [
    {
      speaker: 'A Hudson\'s Bay Company trader',
      text: 'The Snake River canyon ahead is the most dangerous stretch on the whole trail. The crossing is deep and swift — use the ferry if one is running.',
    },
    {
      speaker: 'A missionary heading east',
      text: 'Oregon is everything they say it is — rich soil, mild winters, timber and fish aplenty. Keep your spirits up, you\'re past the halfway mark.',
    },
    {
      speaker: 'An old trapper',
      text: 'Some folks take the California cutoff from here, heading south for gold. But if it\'s farmland you want, stay the Oregon course. You won\'t regret it.',
    },
    {
      speaker: 'A Shoshone guide',
      text: 'There is little game along the Snake River. The land is dry sage and lava rock. Carry as much water and food as your wagons will hold.',
    },
  ],

  'Fort Boise': [
    {
      speaker: 'A fort trader',
      text: 'This is the last supply post before Oregon City. The Blue Mountains ahead are steep and thick with timber. It will test every ox you have left.',
    },
    {
      speaker: 'A returning emigrant',
      text: 'At The Dalles you\'ll have a choice — raft down the Columbia or take the Barlow Road over Mount Hood. The river is faster but far more dangerous.',
    },
    {
      speaker: 'A trail-worn family man',
      text: 'We nearly starved in the Blues. The trail is so steep you\'ll have to double-team your oxen on every hill. Go slow and steady.',
    },
    {
      speaker: 'A Nez Perce fisherman',
      text: 'Once you cross the mountains, the rivers run thick with salmon. The Willamette Valley has more food than any family could need.',
    },
    {
      speaker: 'A wagon master',
      text: 'Keep your wagon brakes in good order for the mountains. I\'ve seen wagons run away on the downhill and smash to kindling. Check your wheels and axles now.',
    },
  ],
};

module.exports = conversations;
