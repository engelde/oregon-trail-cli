const blessed = require('blessed');
const ScreenManager = require('./screens/ScreenManager');
const GameEngine = require('./game/GameEngine');
const GameState = require('./game/GameState');

// Parse CLI flags
const args = process.argv.slice(2);
const noColor = args.includes('--no-color');
const noAnimation = args.includes('--no-animation');
const quickStart = args.includes('--quick-start');

// Create blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'The Oregon Trail',
  fullUnicode: true,
  autoPadding: true,
  dockBorders: true,
});

// Store options on the screen for other modules to reference
screen.options.noColor = noColor;
screen.options.noAnimation = noAnimation;

// Initialize managers
const screenManager = new ScreenManager(screen);
const gameState = new GameState();
const engine = new GameEngine(screen, screenManager, gameState);

// Global exit keys
screen.key(['q', 'C-c'], () => {
  engine.cleanup();
  screen.destroy();
  process.exit(0);
});

// Start the game
if (quickStart) {
  // Pre-fill game state for quick testing
  gameState.profession = 'banker';
  gameState.money = 400;
  gameState.party = [
    { name: 'John', health: 'good', leader: true, _hp: 4 },
    { name: 'Sara', health: 'good', _hp: 4 },
    { name: 'Johnny', health: 'good', _hp: 4 },
    { name: 'Lucy', health: 'good', _hp: 4 },
    { name: 'Tommy', health: 'good', _hp: 4 },
  ];
  gameState.supplies = { food: 500, oxen: 6, clothing: 5, ammunition: 100, wheels: 2, axles: 1, tongues: 1 };
  gameState.date = { month: 3, day: 1, year: 1848 };
  gameState.pace = 'steady';
  gameState.rations = 'filling';
  gameState.nextLandmarkIndex = 0;
  engine.startTravel();
} else {
  engine.start();
}
