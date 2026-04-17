# Terraria Companion

A second-screen browser reference for Terraria players. Look up items, track bosses, plan builds, and browse NPC/biome guides — all in one place.

**Data version:** 1.4.5.6 (Bigger & Boulder)

## Features

- **Item Lookup** — Search 350+ items with fuzzy matching, view crafting recipes (crafts & used-in chains), inspect item stats, tool powers, and jump to the wiki
- **Prefix System** — Select prefixes in Item Lookup to preview effective stat changes live (base → prefixed values)
- **Boss Tracker** — All ~16 bosses with gear recommendations and strategy notes; progress is saved to localStorage
- **Build Planner** — Multi-loadout system with armor, weapon, and accessory slots; filter by class; saved to localStorage
- **NPC Guide** — All ~25 NPCs with full happiness tables and biome filter chips
- **Biome Guide** — All ~20 biomes with resources, enemies, and NPC affinities

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| State / persistence | Zustand (persist) |
| Fuzzy search | Fuse.js |
| Icons | Lucide React |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run validate:data` | Validate item data rules (stats, class rules, mana/crit consistency) |
| `npm run build` | Validate data, type-check, and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run lib:build` | Generate declaration files for library output |



## Deployment (Public Users)

Terraria Companion is now distributed only as a standalone local server for public users.

### 🌐 Standalone Server (Recommended)

1. Build the app:
	```bash
	npm install
	npm run build
	```
2. Start the local server:
	```bash
	node server.js
	# or use start-server.bat (Windows) / start-server.sh (macOS/Linux)
	```
3. Open [http://localhost:8000](http://localhost:8000) in your browser.

No installation or code signing required. Electron distribution is no longer used.

## Data Quality Rules

The project includes an automated data validator at `scripts/validate-items.mjs`.

- Weapons and tools must define `damage`
- Armor must define `defense`
- Summon/whip items must define `critChance: 0`
- `manaCost` is explicit only for magic/summon items

This validator runs automatically as part of `npm run build`.

## Project Structure

```
public/           # Static assets (favicon/icon SVGs)
scripts/          # Validation and maintenance scripts
src/
├── assets/       # App assets
├── components/   # Shared UI and layout components
├── data/         # Game data JSON + central typed exports
├── hooks/        # Custom hooks (search, recipes, prefixes)
├── lib/          # Utilities (search, prefix stat application)
├── pages/        # Route-level page components
├── store/        # Zustand stores (boss tracker, build planner)
├── styles/       # Global style layers
└── types/        # TypeScript domain types
server.js         # Standalone local server for production build
start-server.bat  # Windows launcher for standalone server
start-server.sh   # macOS/Linux launcher for standalone server
```

## License

This is an unofficial fan project and is not affiliated with Re-Logic. Terraria is a trademark of Re-Logic.
