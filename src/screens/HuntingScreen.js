const blessed = require('blessed');
const { colors, tag, boldColor } = require('../ui/Theme');

const ANIMALS = {
  rabbit: {
    name: 'Rabbit',
    width: 6,
    height: 2,
    art: ['(\\__/)', '(o.o )'],
    speed: 3,
    food: () => 2 + Math.floor(Math.random() * 4),
    spawnChance: 0.4,
    points: 1,
  },
  deer: {
    name: 'Deer',
    width: 12,
    height: 3,
    art: ['  /|    |\\', ' / |    | \\', '/__|____|__\\'],
    speed: 2,
    food: () => 30 + Math.floor(Math.random() * 30),
    spawnChance: 0.3,
    points: 2,
  },
  buffalo: {
    name: 'Buffalo',
    width: 16,
    height: 4,
    art: ['    __  ___', '   /  \\/   \\', '  |  ()  () |', '  \\________/'],
    speed: 1,
    food: () => 100 + Math.floor(Math.random() * 100),
    spawnChance: 0.2,
    points: 3,
  },
  bear: {
    name: 'Bear',
    width: 14,
    height: 4,
    art: ['   _     _', '  / \\   / \\', ' | (o) (o) |', '  \\_______/'],
    speed: 1.5,
    food: () => 100 + Math.floor(Math.random() * 100),
    spawnChance: 0.1,
    points: 4,
  },
};

const CARRY_LIMIT = 200;
const GAME_DURATION = 30;
const TICK_MS = 100;
const SPAWN_INTERVAL_MS = 1500;
const FLASH_DURATION_MS = 600;

class HuntingScreen {
  constructor(screen, gameState, onComplete) {
    this.screen = screen;
    this.gameState = gameState;
    this.onComplete = onComplete;
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];

    // Game dimensions (leave 3 rows for status bar)
    this.width = screen.width;
    this.height = screen.height - 3;

    // Crosshair position (center of play area)
    this.crossX = Math.floor(this.width / 2);
    this.crossY = Math.floor(this.height / 2);

    // Game state
    this.animals = [];
    this.totalBullets = Math.max(1, gameState.supplies.ammunition || 0) * 20;
    this.bulletsUsed = 0;
    this.foodGathered = 0;
    this.animalsKilled = 0;
    this.timeLeft = GAME_DURATION;
    this.phase = 'countdown'; // 'countdown' | 'playing' | 'results'
    this.countdownValue = 3;
    this.flashMessages = []; // [{text, x, y, expire}]
    this.tickCount = 0;
    this.spawnAccum = 0;
    this.gameStartTime = 0;

    this.init();
  }

  // ── Widget / handler management ─────────────────────────────

  addWidget(widget) {
    this.widgets.push(widget);
    this.screen.append(widget);
  }

  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }

  destroy() {
    this.intervals.forEach((i) => clearInterval(i));
    this.keyHandlers.forEach(({ keys, handler }) => this.screen.unkey(keys, handler));
    this.widgets.forEach((w) => w.detach());
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];
    this.screen.render();
  }

  // ── Initialization ──────────────────────────────────────────

  init() {
    this.gameArea = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: this.height,
      tags: true,
      style: { fg: 'white', bg: 'default' },
    });
    this.addWidget(this.gameArea);

    this.statusBar = blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      tags: true,
      border: { type: 'line' },
      style: {
        border: { fg: colors.muted },
        fg: 'white',
        bg: 'default',
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(this.statusBar);

    this.registerKey(['up'], () => this.moveCrosshair(0, -2));
    this.registerKey(['down'], () => this.moveCrosshair(0, 2));
    this.registerKey(['left'], () => this.moveCrosshair(-2, 0));
    this.registerKey(['right'], () => this.moveCrosshair(2, 0));
    this.registerKey(['space'], () => this.shoot());

    this.startCountdown();
  }

  // ── Countdown ───────────────────────────────────────────────

  startCountdown() {
    this.renderCountdown();
    const countdownInterval = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue <= 0) {
        clearInterval(countdownInterval);
        const idx = this.intervals.indexOf(countdownInterval);
        if (idx !== -1) this.intervals.splice(idx, 1);
        this.startGame();
      } else {
        this.renderCountdown();
      }
    }, 1000);
    this.intervals.push(countdownInterval);
  }

  renderCountdown() {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    const buffer = this.createEmptyBuffer();

    const text = this.countdownValue > 0 ? `${this.countdownValue}...` : 'HUNT!';

    this.writeToBuffer(buffer, cx - Math.floor(text.length / 2), cy, text);
    this.gameArea.setContent(this.bufferToString(buffer));
    this.updateStatus();
    this.screen.render();
  }

  // ── Game start ──────────────────────────────────────────────

  startGame() {
    this.phase = 'playing';
    this.gameStartTime = Date.now();

    // Main game loop
    const gameLoop = setInterval(() => {
      if (this.phase !== 'playing') return;
      this.tick();
    }, TICK_MS);
    this.intervals.push(gameLoop);

    // Timer countdown (1 per second)
    const timerLoop = setInterval(() => {
      if (this.phase !== 'playing') return;
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.endGame();
      }
    }, 1000);
    this.intervals.push(timerLoop);
  }

  // ── Game loop tick ──────────────────────────────────────────

  tick() {
    this.tickCount++;
    const now = Date.now();

    // Move animals
    this.moveAnimals();

    // Remove off-screen animals
    this.animals = this.animals.filter((a) => {
      if (a.direction === 1) return a.x < this.width + 5;
      return a.x + a.def.width > -5;
    });

    // Attempt to spawn new animals periodically
    this.spawnAccum += TICK_MS;
    if (this.spawnAccum >= SPAWN_INTERVAL_MS) {
      this.spawnAccum -= SPAWN_INTERVAL_MS;
      this.trySpawnAnimal();
    }

    // Expire flash messages
    this.flashMessages = this.flashMessages.filter((f) => now < f.expire);

    // Render
    this.renderFrame();
  }

  // ── Animal spawning ─────────────────────────────────────────

  trySpawnAnimal() {
    const types = Object.keys(ANIMALS);
    // Shuffle and try each type based on spawnChance
    const shuffled = types.sort(() => Math.random() - 0.5);
    for (const type of shuffled) {
      const def = ANIMALS[type];
      if (Math.random() < def.spawnChance) {
        this.spawnAnimal(type);
        return;
      }
    }
  }

  spawnAnimal(type) {
    const def = ANIMALS[type];
    const direction = Math.random() < 0.5 ? 1 : -1; // 1=left-to-right, -1=right-to-left
    const x = direction === 1 ? -def.width : this.width;
    // Keep animals within play area vertically (avoid top row and bottom rows)
    const minY = 1;
    const maxY = this.height - def.height - 1;
    const y = minY + Math.floor(Math.random() * Math.max(1, maxY - minY));

    this.animals.push({ type, def, x: Math.floor(x), y, direction, fractionalX: x });
  }

  // ── Animal movement ─────────────────────────────────────────

  moveAnimals() {
    for (const animal of this.animals) {
      animal.fractionalX += animal.direction * animal.def.speed * (TICK_MS / 100);
      animal.x = Math.floor(animal.fractionalX);
    }
  }

  // ── Crosshair movement ─────────────────────────────────────

  moveCrosshair(dx, dy) {
    if (this.phase !== 'playing') return;
    this.crossX = Math.max(0, Math.min(this.width - 3, this.crossX + dx));
    this.crossY = Math.max(0, Math.min(this.height - 2, this.crossY + dy));
    this.renderFrame();
  }

  // ── Shooting ────────────────────────────────────────────────

  shoot() {
    if (this.phase !== 'playing') return;

    const bulletsRemaining = this.totalBullets - this.bulletsUsed;
    if (bulletsRemaining <= 0) {
      this.addFlash('{red-fg}Out of ammo!{/red-fg}', this.crossX - 5, this.crossY - 2);
      this.renderFrame();
      // End game shortly after running out
      setTimeout(() => {
        if (this.phase === 'playing') this.endGame();
      }, 1000);
      return;
    }

    this.bulletsUsed++;

    // Check hit against all animals — crosshair center is at (crossX+1, crossY)
    const cx = this.crossX + 1;
    const cy = this.crossY;
    let hit = false;

    for (let i = this.animals.length - 1; i >= 0; i--) {
      const a = this.animals[i];
      if (cx >= a.x && cx < a.x + a.def.width && cy >= a.y && cy < a.y + a.def.height) {
        // Hit!
        hit = true;
        const foodAmount = a.def.food();
        const actualFood = Math.min(foodAmount, CARRY_LIMIT - this.foodGathered);

        if (actualFood > 0) {
          this.foodGathered += actualFood;
          this.animalsKilled++;
          this.addFlash(`{green-fg}HIT! +${actualFood} lbs{/green-fg}`, a.x, Math.max(0, a.y - 1));
        } else {
          this.addFlash("{yellow-fg}HIT! Can't carry more{/yellow-fg}", a.x, Math.max(0, a.y - 1));
          this.animalsKilled++;
        }

        this.animals.splice(i, 1);
        break;
      }
    }

    if (!hit) {
      this.addFlash('{red-fg}MISS{/red-fg}', this.crossX - 1, Math.max(0, this.crossY - 1));
    }

    // Check if out of ammo after this shot
    if (this.totalBullets - this.bulletsUsed <= 0) {
      this.addFlash('{red-fg}Out of ammo!{/red-fg}', this.crossX - 5, this.crossY - 2);
      setTimeout(() => {
        if (this.phase === 'playing') this.endGame();
      }, 1200);
    }

    this.renderFrame();
  }

  // ── Flash messages ──────────────────────────────────────────

  addFlash(text, x, y) {
    this.flashMessages.push({
      text,
      x: Math.max(0, Math.min(this.width - 20, x)),
      y: Math.max(0, Math.min(this.height - 1, y)),
      expire: Date.now() + FLASH_DURATION_MS,
    });
  }

  // ── Rendering ───────────────────────────────────────────────

  createEmptyBuffer() {
    const buf = [];
    for (let r = 0; r < this.height; r++) {
      buf.push(new Array(this.width).fill(' '));
    }
    return buf;
  }

  writeToBuffer(buf, x, y, text) {
    const row = buf[y];
    if (!row) return;
    for (let i = 0; i < text.length && x + i < this.width; i++) {
      if (x + i >= 0) {
        row[x + i] = text[i];
      }
    }
  }

  bufferToString(buf) {
    return buf.map((row) => row.join('')).join('\n');
  }

  renderFrame() {
    if (this.phase !== 'playing') return;

    const buf = this.createEmptyBuffer();

    // Draw ground elements (grass dots scattered)
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        // Sparse grass pattern
        if ((r * 7 + c * 13) % 47 === 0) buf[r][c] = '.';
        if ((r * 11 + c * 3) % 53 === 0) buf[r][c] = ',';
        if ((r * 5 + c * 17) % 61 === 0) buf[r][c] = "'";
      }
    }

    // Draw animals
    for (const a of this.animals) {
      for (let row = 0; row < a.def.art.length; row++) {
        const line = a.def.art[row];
        this.writeToBuffer(buf, a.x, a.y + row, line);
      }
    }

    // Draw crosshair
    this.writeToBuffer(buf, this.crossX, this.crossY, '[+]');

    // Convert buffer to string, then overlay blessed color tags for flash messages
    const frame = this.bufferToString(buf);

    // Add flash messages as tagged overlays (render below the frame)
    const flashLines = [];
    for (const f of this.flashMessages) {
      flashLines.push(f);
    }

    // Build final output: use the plain frame, then append flash messages
    // We'll position flash text using blessed tags inline
    // Simpler approach: render frame lines, and for lines that have flash messages,
    // append the tag after
    const lines = frame.split('\n');

    for (const f of this.flashMessages) {
      if (f.y >= 0 && f.y < lines.length) {
        // Strip tags to get raw text length for positioning
        const rawText = f.text.replace(/\{[^}]+\}/g, '');
        const insertX = Math.max(0, Math.min(f.x, this.width - rawText.length));
        const line = lines[f.y];
        // Replace characters at position with tagged text
        const before = line.substring(0, insertX);
        const after = line.substring(insertX + rawText.length);
        lines[f.y] = before + f.text + after;
      }
    }

    // Color the crosshair line
    const crossLine = lines[this.crossY];
    if (crossLine) {
      const ci = this.crossX;
      const before = crossLine.substring(0, ci);
      const cross = crossLine.substring(ci, ci + 3);
      const after = crossLine.substring(ci + 3);
      // Only colorize if crosshair text is intact (no flash overlap)
      if (cross === '[+]') {
        lines[this.crossY] = before + `{red-fg}{bold}${cross}{/bold}{/red-fg}` + after;
      }
    }

    this.gameArea.setContent(lines.join('\n'));
    this.updateStatus();
    this.screen.render();
  }

  updateStatus() {
    const bulletsRemaining = Math.max(0, this.totalBullets - this.bulletsUsed);
    const sep = tag(colors.muted, ' │ ');

    const parts = [
      `Bullets: ${boldColor('yellow', String(bulletsRemaining))}`,
      `Food: ${boldColor('green', `${this.foodGathered} lbs`)}`,
      `Carry limit: ${tag(colors.muted, `${CARRY_LIMIT} lbs`)}`,
      `Time: ${boldColor(this.timeLeft <= 5 ? 'red' : 'cyan', `${this.timeLeft}s`)}`,
    ];

    this.statusBar.setContent(parts.join(sep));
  }

  // ── End game ────────────────────────────────────────────────

  endGame() {
    if (this.phase === 'results') return;
    this.phase = 'results';

    // Stop all intervals
    this.intervals.forEach((i) => clearInterval(i));
    this.intervals = [];

    this.showResults();
  }

  showResults() {
    const carried = Math.min(this.foodGathered, CARRY_LIMIT);
    const overLimit = this.foodGathered > CARRY_LIMIT;

    const carryText = overLimit
      ? `You could only carry ${CARRY_LIMIT} lbs back.`
      : `You carried ${carried} lbs back to the wagon.`;

    const lines = [
      '╔══════════════════════════════════╗',
      '║        HUNTING RESULTS           ║',
      '╠══════════════════════════════════╣',
      `║  Animals killed: ${String(this.animalsKilled).padEnd(16)}║`,
      `║  Food gathered:  ${String(carried + ' lbs').padEnd(16)}║`,
      `║  Bullets used:   ${String(this.bulletsUsed).padEnd(16)}║`,
      '║                                  ║',
      `║  ${carryText.padEnd(32)}║`,
      '╚══════════════════════════════════╝',
      '',
      '        Press ENTER to continue',
    ];

    this.gameArea.setContent('\n'.repeat(Math.max(0, Math.floor((this.height - lines.length) / 2))) + lines.join('\n'));
    this.screen.render();

    const enterHandler = () => {
      this.finalize(carried);
    };
    this.registerKey(['enter', 'return'], enterHandler);
    this.screen.render();
  }

  finalize(foodCarried) {
    // Update game state
    this.gameState.supplies.food += foodCarried;
    const ammoUsedBoxes = Math.ceil(this.bulletsUsed / 20);
    this.gameState.supplies.ammunition = Math.max(0, this.gameState.supplies.ammunition - ammoUsedBoxes);

    this.destroy();
    if (this.onComplete) this.onComplete(foodCarried);
  }
}

module.exports = HuntingScreen;
