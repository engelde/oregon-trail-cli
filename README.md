# 🐂 The Oregon Trail — CLI Edition

A faithful CLI recreation of the classic 1990 MECC Oregon Trail, built in Node.js with terminal graphics.

> *"The trail is long and dangerous, but the promise of a new life in Oregon keeps you going."*

```
                         ─── T H E ───
  ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ ╔╗   ╦   ╔╦╗ ╔═══╗ ╔═══╗ ╦  ╦
  ║   ║ ║   ║ ║     ║     ║   ║ ║╚╗  ║    ║  ║   ║ ║   ║ ║  ║
  ║   ║ ╠══╦╝ ╠═══  ║ ╔═╗ ║   ║ ║ ╚╗ ║    ║  ╠══╦╝ ╠═══╣ ║  ║
  ║   ║ ║  ╚╗ ║     ║   ║ ║   ║ ║  ╚╗║    ║  ║  ╚╗ ║   ║ ║  ║
  ╚═══╝ ╩   ╩ ╚═══╝ ╚═══╝ ╚═══╝ ╩   ╚╝    ╩  ╩   ╩ ╩   ╩ ╩  ╚═══╝
```

*A terminal game — best experienced in a terminal with color support.*

## Features

- 🗺️ Full journey from Independence, MO to Oregon City, OR (1,907 miles)
- 🎨 ASCII art scenes for landmarks, wagon, weather, and more
- 🐎 Real-time animated wagon travel with terrain changes
- 🦌 Interactive hunting mini-game with moving animals
- 🌊 River crossing choices with rafting mini-game
- 🏪 Fort visits (buy supplies, rest, trade, talk to NPCs)
- 🎲 Random events: diseases, weather, thieves, wagon breakdowns
- 🤒 Health system: dysentery, cholera, typhoid, measles, snakebite
- 💼 Profession choice affects starting money and final score multiplier
- 🏆 High score board saved locally
- 💚 Retro terminal aesthetic with color

## Quick Start

```bash
npx oregon-trail-cli
```

### Or install globally

```bash
npm install -g oregon-trail-cli
oregon-trail
```

### Or clone and run

```bash
git clone https://github.com/engelde/oregon-trail-cli.git
cd oregon-trail-cli
npm install
npm start
```

## Requirements

- **Node.js 18+**

## Controls

| Key | Action |
|---|---|
| Arrow keys / `j`, `k` | Navigate menus |
| Enter | Select / Continue |
| Space | Pause travel to open trail menu |
| Number keys | Quick-select menu options |
| `q` / `Ctrl+C` | Quit |

## Game Tips

- **Start in March–May** for the best weather window.
- **Banker** has the most starting money but the lowest score multiplier.
- **Farmer** has the least starting money but the highest score multiplier.
- **Rest at forts** to recover health.
- **Watch your food supply** — hunt to supplement when running low.
- **Filling rations** keep your party healthier on the trail.
- **Don't push grueling pace** too long — your party's health will suffer.

## Development

```bash
git clone https://github.com/engelde/oregon-trail-cli.git
cd oregon-trail-cli
npm install
```

### Scripts

| Command | Description |
|---|---|
| `npm start` | Run the game |
| `npm test` | Run tests (99 tests) |
| `npm run lint` | Lint with Biome |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Biome |

### Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) with:

- **pre-commit** — runs linting and tests
- **commit-msg** — enforces [Conventional Commits](https://www.conventionalcommits.org/) via commitlint

### CI/CD

- **CI** — lint + tests on Node 18/20/22 for every push and PR
- **Releases** — automated via [release-please](https://github.com/googleapis/release-please) with semantic versioning

## Credits

Inspired by the original *The Oregon Trail* by **MECC** (1990).

## License

[MIT](LICENSE)
