# Terraria Companion

A second-screen browser reference for Terraria players. Look up items, track bosses, plan builds, and browse NPC/biome guides — all in one place.

**Data version:** 1.4.5.6 (Bigger & Boulder)

## Features

- **Item Lookup** — Search ~180 items with fuzzy matching, view crafting recipes (crafts & used-in chains), and jump to the wiki
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
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |



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

No installation or code signing required. Electron and NPM package distribution are no longer available for public users.

## Project Structure

```
src/
├── data/         # Game data (items, bosses, NPCs, biomes) + central index
├── pages/        # Route-level page components
├── components/   # Shared UI components
├── store/        # Zustand stores (boss tracker, build planner)
├── hooks/        # Custom hooks (e.g. debounced item search)
├── lib/          # Utilities (Fuse.js search instance)
└── types/        # TypeScript types
```

## License

This is an unofficial fan project and is not affiliated with Re-Logic. Terraria is a trademark of Re-Logic.
