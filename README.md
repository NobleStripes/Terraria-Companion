# Terraria Companion

A second-screen browser reference for Terraria players. Look up items, track bosses, browse recommended builds by stage, and explore NPC/biome guides — all in one place.

**App version:** 1.0.4  
**Data version:** 1.4.5.6 (Bigger & Boulder)

## Features

- **Item Lookup** — Search 350+ items with fuzzy matching, view crafting recipes (crafts & used-in chains), inspect item stats, tool powers, and jump to the wiki
- **Prefix System** — Select prefixes in Item Lookup to preview effective stat changes live (base → prefixed values)
- **Boss Tracker** — All ~16 bosses with gear recommendations and strategy notes; progress is saved to localStorage
- **Recommended Builds** — Stage-based progression builds (Early Game → Endgame) for melee, ranged, magic, and summoner classes
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

### Using on Mobile or Tablet

The app is fully responsive and works on phones and tablets via a local network connection.

1. Start the dev or production server on your PC as normal.
2. Find your PC's local IP address (e.g. `192.168.1.x`):
   - **Windows:** run `ipconfig` in Command Prompt and look for *IPv4 Address* under your active adapter
   - **macOS/Linux:** run `ip addr` or `ifconfig`
3. On your phone or tablet, open a browser and navigate to:
   - Dev server: `http://<your-pc-ip>:5173`
   - Production server: `http://<your-pc-ip>:8000`
4. Both devices must be on the same Wi-Fi network.

> **Note:** The dev server (`npm run dev`) may need `--host` to expose itself on the network:
> ```bash
> npm run dev -- --host
> ```

#### Mobile UI notes

| Page | Mobile behaviour |
|---|---|
| Item Lookup | Filter panel is hidden by default — tap **Filters** to expand |
| Build Stages | Filters and Presets panels each have a dedicated toggle button |
| Boss Tracker | The boss guide opens as a bottom sheet rather than a side drawer |
| Biome Guide | Filter panel collapsed by default; layer chips scroll horizontally |
| NPC Guide | Planner and Biome panels each have a toggle button; chip rows scroll horizontally |

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
4. To open the production build from another device on your local network, use `http://<your-pc-ip>:8000`.

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
├── store/        # Zustand stores (boss tracking state)
├── styles/       # Global style layers
└── types/        # TypeScript domain types
server.js         # Standalone local server for production build
start-server.bat  # Windows launcher for standalone server
start-server.sh   # macOS/Linux launcher for standalone server
```

## Content & Trademarks

- Terraria Companion is an unofficial fan-made project.
- It is **not affiliated with or endorsed by** [Re-Logic](https://re-logic.com/).
- **Terraria** and related names/logos are trademarks of [Re-Logic](https://re-logic.com/).
- Game-reference content is sourced from [Terraria Wiki](https://terraria.wiki.gg/) and should be treated as informational guidance.

## License

Code and project-specific assets in this repository are provided under the repository license.
