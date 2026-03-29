const blessed = require('blessed');
const { colors, tag, boldColor } = require('../ui/Theme');

// ── Rock definitions ──────────────────────────────────────────

const ROCKS = {
  small: {
    name: 'small',
    width: 4,
    height: 2,
    art: [' /\\', '/__\\'],
    damageMin: 5,
    damageMax: 10,
    spawnWeight: 0.5,
  },
  medium: {
    name: 'medium',
    width: 6,
    height: 3,
    art: ['  /\\', ' /  \\', '/____\\'],
    damageMin: 10,
    damageMax: 20,
    spawnWeight: 0.35,
  },
  large: {
    name: 'large',
    width: 8,
    height: 4,
    art: ['   /\\', '  /  \\', ' / /\\ \\', '/______\\'],
    damageMin: 20,
    damageMax: 30,
    spawnWeight: 0.15,
  },
};

const RAFT_ART = [' ╔══╗ ', ' ║▓▓║ ', ' ╚══╝ '];
const RAFT_WIDTH = 7;
const RAFT_HEIGHT = 3;

const TICK_MS = 100;
const ROCK_SPEED = 2; // chars per tick (fractional accumulation)
const SPAWN_INTERVAL_MS = 800;
const _RIVER_DURATION_S = 18; // seconds to cross
const COLLISION_COOLDOWN = 500; // ms between hits
const FLASH_DURATION_MS = 800;

const SUPPLY_KEYS = ['food', 'ammunition', 'clothing', 'oxen'];

class RiverMiniGame {
  constructor(screen, gameState, onComplete) {
    this.screen = screen;
    this.gameState = gameState;
    this.onComplete = onComplete;
    this.widgets = [];
    this.keyHandlers = [];
    this.intervals = [];

    // Dimensions
    this.width = screen.width;
    this.height = screen.height - 3; // leave room for status

    // River boundaries (banks take 2 rows each)
    this.bankHeight = 2;
    this.riverTop = this.bankHeight;
    this.riverBottom = this.height - this.bankHeight - 1;
    this.riverHeight = this.riverBottom - this.riverTop + 1;

    // Raft position (left quarter, vertically centered in river)
    this.raftX = 3;
    this.raftY = this.riverTop + Math.floor((this.riverHeight - RAFT_HEIGHT) / 2);

    // Game state
    this.rocks = [];
    this.phase = 'countdown'; // 'countdown' | 'playing' | 'results'
    this.countdownValue = 3;
    this.distanceTotal = Math.floor(this.width * 2.5); // total "distance" to cross
    this.distanceTraveled = 0;
    this.suppliesIntact = 100;
    this.suppliesLost = {};
    this.injuries = [];
    this.tickCount = 0;
    this.spawnAccum = 0;
    this.lastCollisionTime = 0;
    this.flashMessages = [];
    this.waterOffset = 0; // for animating water

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
      style: { fg: 'white', bg: 'black' },
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
        bg: 'black',
      },
      padding: { left: 1, right: 1 },
    });
    this.addWidget(this.statusBar);

    this.registerKey(['up'], () => this.moveRaft(-1));
    this.registerKey(['down'], () => this.moveRaft(1));

    this.startCountdown();
  }

  // ── Countdown ───────────────────────────────────────────────

  startCountdown() {
    this.renderCountdownFrame();
    const interval = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue <= 0) {
        clearInterval(interval);
        const idx = this.intervals.indexOf(interval);
        if (idx !== -1) this.intervals.splice(idx, 1);
        this.startGame();
      } else {
        this.renderCountdownFrame();
      }
    }, 1000);
    this.intervals.push(interval);
  }

  renderCountdownFrame() {
    const lines = this.buildBaseFrame();
    const text = this.countdownValue > 0 ? `${this.countdownValue}...` : 'GO!';
    const cx = Math.floor(this.width / 2) - Math.floor(text.length / 2);
    const cy = Math.floor(this.height / 2);
    if (cy >= 0 && cy < lines.length) {
      const line = lines[cy];
      lines[cy] =
        line.substring(0, cx) + `{bold}{white-fg}${text}{/white-fg}{/bold}` + line.substring(cx + text.length);
    }
    this.gameArea.setContent(lines.join('\n'));
    this.updateStatus();
    this.screen.render();
  }

  // ── Game start ──────────────────────────────────────────────

  startGame() {
    this.phase = 'playing';

    const gameLoop = setInterval(() => {
      if (this.phase !== 'playing') return;
      this.tick();
    }, TICK_MS);
    this.intervals.push(gameLoop);
  }

  // ── Game tick ───────────────────────────────────────────────

  tick() {
    this.tickCount++;
    const now = Date.now();

    // Progress distance
    this.distanceTraveled += ROCK_SPEED;
    this.waterOffset = (this.waterOffset + 1) % 4;

    // Move rocks left
    for (const rock of this.rocks) {
      rock.fractionalX -= ROCK_SPEED;
      rock.x = Math.floor(rock.fractionalX);
    }

    // Remove off-screen rocks
    this.rocks = this.rocks.filter((r) => r.x + r.def.width > -2);

    // Spawn rocks
    this.spawnAccum += TICK_MS;
    if (this.spawnAccum >= SPAWN_INTERVAL_MS) {
      this.spawnAccum -= SPAWN_INTERVAL_MS;
      this.trySpawnRock();
    }

    // Check collisions
    this.checkCollisions(now);

    // Expire flash messages
    this.flashMessages = this.flashMessages.filter((f) => now < f.expire);

    // Check completion
    if (this.distanceTraveled >= this.distanceTotal) {
      this.endGame(true);
      return;
    }

    this.renderFrame();
  }

  // ── Rock spawning ───────────────────────────────────────────

  trySpawnRock() {
    const roll = Math.random();
    let cumulative = 0;
    const types = Object.keys(ROCKS);

    for (const type of types) {
      cumulative += ROCKS[type].spawnWeight;
      if (roll <= cumulative) {
        this.spawnRock(type);
        return;
      }
    }
    // Fallback
    this.spawnRock('small');
  }

  spawnRock(type) {
    const def = ROCKS[type];
    const minY = this.riverTop;
    const maxY = this.riverBottom - def.height + 1;
    const y = minY + Math.floor(Math.random() * Math.max(1, maxY - minY));

    this.rocks.push({
      def,
      x: this.width,
      fractionalX: this.width,
      y,
    });
  }

  // ── Raft movement ──────────────────────────────────────────

  moveRaft(dy) {
    if (this.phase !== 'playing') return;
    const newY = this.raftY + dy;
    if (newY >= this.riverTop && newY + RAFT_HEIGHT - 1 <= this.riverBottom) {
      this.raftY = newY;
    }
  }

  // ── Collision detection ─────────────────────────────────────

  checkCollisions(now) {
    if (now - this.lastCollisionTime < COLLISION_COOLDOWN) return;

    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const rock = this.rocks[i];

      // AABB overlap check
      const raftLeft = this.raftX;
      const raftRight = this.raftX + RAFT_WIDTH - 1;
      const raftTopEdge = this.raftY;
      const raftBottomEdge = this.raftY + RAFT_HEIGHT - 1;

      const rockLeft = rock.x;
      const rockRight = rock.x + rock.def.width - 1;
      const rockTopEdge = rock.y;
      const rockBottomEdge = rock.y + rock.def.height - 1;

      const overlapX = raftLeft <= rockRight && raftRight >= rockLeft;
      const overlapY = raftTopEdge <= rockBottomEdge && raftBottomEdge >= rockTopEdge;

      if (overlapX && overlapY) {
        this.handleCollision(rock, i, now);
        break; // one collision per cooldown
      }
    }
  }

  handleCollision(rock, index, now) {
    this.lastCollisionTime = now;

    const def = rock.def;
    const damagePercent = def.damageMin + Math.floor(Math.random() * (def.damageMax - def.damageMin + 1));
    this.suppliesIntact = Math.max(0, this.suppliesIntact - damagePercent);

    // Pick a random supply to damage
    const supplyKey = SUPPLY_KEYS[Math.floor(Math.random() * SUPPLY_KEYS.length)];
    const currentAmount = this.gameState.supplies[supplyKey] || 0;
    const lossAmount = Math.ceil(currentAmount * (damagePercent / 100));

    if (lossAmount > 0) {
      if (!this.suppliesLost[supplyKey]) this.suppliesLost[supplyKey] = 0;
      this.suppliesLost[supplyKey] += lossAmount;
    }

    // Large rocks can injure party members
    if (def.name === 'large' && Math.random() < 0.4) {
      const alive = this.gameState.getAliveMembers();
      if (alive.length > 0) {
        const victim = alive[Math.floor(Math.random() * alive.length)];
        if (victim.health === 'good') victim.health = 'fair';
        else if (victim.health === 'fair') victim.health = 'poor';
        else if (victim.health === 'poor') victim.health = 'very poor';
        this.injuries.push(victim.name);
        this.addFlash(`{red-fg}${victim.name} was injured!{/red-fg}`, this.raftX + RAFT_WIDTH + 1, this.raftY);
      }
    }

    const label = supplyKey === 'ammunition' ? 'ammo' : supplyKey;
    this.addFlash(
      `{yellow-fg}CRASH! -${damagePercent}% ${label}{/yellow-fg}`,
      this.raftX + RAFT_WIDTH + 1,
      this.raftY + 1,
    );

    // Remove the rock on collision
    this.rocks.splice(index, 1);
  }

  addFlash(text, x, y) {
    this.flashMessages.push({
      text,
      x: Math.max(0, Math.min(this.width - 25, x)),
      y: Math.max(0, Math.min(this.height - 1, y)),
      expire: Date.now() + FLASH_DURATION_MS,
    });
  }

  // ── Rendering ───────────────────────────────────────────────

  buildBaseFrame() {
    const lines = [];
    const w = this.width;

    for (let r = 0; r < this.height; r++) {
      if (r < this.bankHeight) {
        // Top bank
        lines.push(this.buildBankLine(w, r));
      } else if (r > this.riverBottom) {
        // Bottom bank
        lines.push(this.buildBankLine(w, r));
      } else {
        // Water
        lines.push(this.buildWaterLine(w, r));
      }
    }
    return lines;
  }

  buildBankLine(w, row) {
    const patterns = [
      'vvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvVvvV',
      '.:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..:..',
    ];
    const pat = patterns[row % 2];
    const chunk = pat.substring(0, w).padEnd(w);
    return row % 2 === 0 ? `{green-fg}${chunk}{/green-fg}` : `{yellow-fg}${chunk}{/yellow-fg}`;
  }

  buildWaterLine(w, row) {
    const patterns = [
      '~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~',
      ' ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~  ',
      '  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ',
      '~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ',
    ];
    const patIdx = (row + this.waterOffset) % patterns.length;
    const pat = patterns[patIdx];
    const chunk = pat.substring(0, w).padEnd(w);
    return `{blue-fg}${chunk}{/blue-fg}`;
  }

  renderFrame() {
    if (this.phase !== 'playing') return;

    const lines = this.buildBaseFrame();

    // Draw rocks onto the frame
    for (const rock of this.rocks) {
      for (let row = 0; row < rock.def.art.length; row++) {
        const lineIdx = rock.y + row;
        if (lineIdx < 0 || lineIdx >= lines.length) continue;

        const artLine = rock.def.art[row];
        const rawLine = this.stripTags(lines[lineIdx]);
        const isWater = lineIdx >= this.riverTop && lineIdx <= this.riverBottom;

        let result = rawLine;
        for (let c = 0; c < artLine.length; c++) {
          const col = rock.x + c;
          if (col >= 0 && col < this.width && artLine[c] !== ' ') {
            result = result.substring(0, col) + artLine[c] + result.substring(col + 1);
          }
        }

        // Re-wrap in color: water portion blue, rock portion brown/white
        // Simpler: just re-color the whole line with rock chars highlighted
        if (isWater) {
          lines[lineIdx] = this.colorizeRiverLine(result, rock.x, rock.x + rock.def.width);
        } else {
          lines[lineIdx] = `{yellow-fg}${result}{/yellow-fg}`;
        }
      }
    }

    // Draw raft
    for (let row = 0; row < RAFT_ART.length; row++) {
      const lineIdx = this.raftY + row;
      if (lineIdx < 0 || lineIdx >= lines.length) continue;

      const artLine = RAFT_ART[row];
      const rawLine = this.stripTags(lines[lineIdx]);

      let result = rawLine;
      for (let c = 0; c < artLine.length; c++) {
        const col = this.raftX + c;
        if (col >= 0 && col < this.width && artLine[c] !== ' ') {
          result = result.substring(0, col) + artLine[c] + result.substring(col + 1);
        }
      }

      lines[lineIdx] = this.colorizeRiverLine(result, this.raftX, this.raftX + RAFT_WIDTH, 'yellow');
    }

    // Draw flash messages
    for (const f of this.flashMessages) {
      if (f.y >= 0 && f.y < lines.length) {
        const rawText = f.text.replace(/\{[^}]+\}/g, '');
        const rawLine = this.stripTags(lines[f.y]);
        const insertX = Math.max(0, Math.min(f.x, this.width - rawText.length));
        const before = rawLine.substring(0, insertX);
        const after = rawLine.substring(insertX + rawText.length);
        // Flash messages float on top with their own tags
        lines[f.y] = `{blue-fg}${before}{/blue-fg}` + f.text + `{blue-fg}${after}{/blue-fg}`;
      }
    }

    this.gameArea.setContent(lines.join('\n'));
    this.updateStatus();
    this.screen.render();
  }

  stripTags(str) {
    return str.replace(/\{[^}]+\}/g, '');
  }

  colorizeRiverLine(raw, objStart, objEnd, objColor) {
    // Color water portion blue and object portion with objColor (default white)
    const oc = objColor || 'white';
    let result = '';
    let i = 0;
    while (i < raw.length) {
      if (i >= objStart && i < objEnd && raw[i] !== '~' && raw[i] !== ' ') {
        // Object character
        let chunk = '';
        while (i < raw.length && i >= objStart && i < objEnd && raw[i] !== '~' && raw[i] !== ' ') {
          chunk += raw[i];
          i++;
        }
        result += `{${oc}-fg}${chunk}{/${oc}-fg}`;
      } else {
        // Water character
        let chunk = '';
        while (i < raw.length && !(i >= objStart && i < objEnd && raw[i] !== '~' && raw[i] !== ' ')) {
          chunk += raw[i];
          i++;
        }
        result += `{blue-fg}${chunk}{/blue-fg}`;
      }
    }
    return result;
  }

  updateStatus() {
    const pct = Math.min(100, Math.floor((this.distanceTraveled / this.distanceTotal) * 100));
    const _remaining = Math.max(0, 100 - pct);
    const sep = tag(colors.muted, ' │ ');

    // Build a mini progress bar
    const barLen = 15;
    const filled = Math.floor((pct / 100) * barLen);
    const bar =
      '{green-fg}' + '█'.repeat(filled) + '{/green-fg}' + '{muted}' + '░'.repeat(barLen - filled) + '{/muted}';

    const intactColor = this.suppliesIntact > 60 ? 'green' : this.suppliesIntact > 30 ? 'yellow' : 'red';

    const parts = [`Crossing: ${bar} ${pct}%`, `Supplies: ${boldColor(intactColor, `${this.suppliesIntact}%`)}`];

    if (this.injuries.length > 0) {
      parts.push(`Injured: ${tag('red', this.injuries.join(', '))}`);
    }

    this.statusBar.setContent(parts.join(sep));
  }

  // ── End game ────────────────────────────────────────────────

  endGame(success) {
    if (this.phase === 'results') return;
    this.phase = 'results';

    this.intervals.forEach((i) => clearInterval(i));
    this.intervals = [];

    // Apply supply losses to game state
    for (const [key, amount] of Object.entries(this.suppliesLost)) {
      this.gameState.supplies[key] = Math.max(0, (this.gameState.supplies[key] || 0) - amount);
    }

    this.showResults(success);
  }

  showResults(success) {
    const lines = [];

    if (success && Object.keys(this.suppliesLost).length === 0 && this.injuries.length === 0) {
      lines.push(
        '╔══════════════════════════════════════╗',
        '║      RIVER CROSSING COMPLETE         ║',
        '╠══════════════════════════════════════╣',
        '║                                      ║',
        '║  You made it across safely!           ║',
        '║  No supplies were lost.               ║',
        '║                                      ║',
        '╚══════════════════════════════════════╝',
      );
    } else if (success) {
      lines.push(
        '╔══════════════════════════════════════╗',
        '║      RIVER CROSSING COMPLETE         ║',
        '╠══════════════════════════════════════╣',
        '║                                      ║',
        '║  You made it, but lost some supplies. ║',
        '║                                      ║',
      );
      for (const [key, amount] of Object.entries(this.suppliesLost)) {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(
          `║  Lost ${label}: ${String(-amount).replace('-', '')}${' '.repeat(Math.max(1, 24 - label.length - String(amount).length))}║`,
        );
      }
      if (this.injuries.length > 0) {
        lines.push(`║  Injured: ${this.injuries.join(', ').padEnd(26)}║`);
      }
      lines.push('║                                      ║', '╚══════════════════════════════════════╝');
    } else {
      lines.push(
        '╔══════════════════════════════════════╗',
        '║      RIVER CROSSING FAILED           ║',
        '╠══════════════════════════════════════╣',
        '║                                      ║',
        '║  Your raft was overwhelmed!           ║',
        '║  Many supplies were lost.             ║',
        '║                                      ║',
        '╚══════════════════════════════════════╝',
      );
    }

    lines.push('', '        Press ENTER to continue');

    const vertPad = Math.max(0, Math.floor((this.height - lines.length) / 2));
    this.gameArea.setContent('\n'.repeat(vertPad) + lines.join('\n'));
    this.screen.render();

    const enterHandler = () => {
      this.destroy();
      if (this.onComplete) {
        this.onComplete({
          success,
          suppliesLost: this.suppliesLost,
          injuries: this.injuries,
        });
      }
    };
    this.registerKey(['enter', 'return'], enterHandler);
    this.screen.render();
  }
}

module.exports = RiverMiniGame;
