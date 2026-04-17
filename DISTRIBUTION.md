# Distribution Guide - Terraria Companion

This guide explains three ways to distribute Terraria Companion:
1. **Standalone Server** - No installation needed, just run a simple server
2. **Electron Desktop App** - Distributable `.exe` (Windows) or `.dmg` (macOS) installers
3. **NPM Library** - Reusable package for other developers

---

## Option 1: Standalone Server (No Installation)

Perfect for users who just want to run the app locally without installation.

### For End Users:

**Prerequisites:**

**Steps:**

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Start the server:**

   **Windows:**
   ```bash
   start-server.bat
   ```

   **macOS/Linux:**
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```

   **Manual (any platform):**
   ```bash
   node server.js
   ```

3. **Open in browser:**
   - The server automatically opens `http://localhost:8000` in your default browser
   - Or manually visit `http://localhost:8000`

4. **Stop the server:**
   - Press `Ctrl+C` in the terminal

### Directory Structure:
```
dist/                    # Built application files (created by npm run build)
server.js               # Node.js HTTP server
start-server.bat        # Windows batch script
start-server.sh         # macOS/Linux shell script
```


## Option 2: Electron Desktop App

Create professional `.exe` and `.dmg` installers for distribution.

### For Developers:

**Prerequisites:**
  - **Windows:** Visual Studio Build Tools
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux:** Build essentials (`sudo apt-get install build-essential`)

### Development:

**Run in development mode (with hot reload):**
```bash
npm run electron-dev
```

This starts:

### Building Installers:

**Build for your current platform:**
```bash
npm run electron-build
```

**Build for specific platforms:**
```bash
npm run electron-build:win    # Windows (.exe)
npm run electron-build:mac    # macOS (.dmg)
npm run electron-build:linux  # Linux (.AppImage, .deb)
```

**Output location:**
```
dist/                  # Built Electron apps and installers
├── Terraria Companion.exe
├── Terraria Companion Installer.exe
└── (other platform-specific files)
```

### Electron Configuration:



## Option 3: NPM Library

For developers who want to use Terraria game data in their own projects.

### Features:


### Example Usage:

```typescript
import { items, bosses, recipes } from 'terraria-companion-data';
import type { Item, Boss } from 'terraria-companion-data';

// Access data
const sword = items.find(i => i.name === 'Copper Shortsword');

// Type-safe queries
const bosses: Boss[] = bosses.filter(b => b.difficulty === 'easy');

// Use utility functions
import { searchItems } from 'terraria-companion-data';
const results = searchItems('copper');
```

### Publishing:

**Build the library:**
```bash
npm run lib:build
```

**Publish to npm:**
```bash
npm publish
```

Users can then:
```bash
npm install terraria-companion-data
```

**Full guide:** See [NPM_PUBLISHING.md](./NPM_PUBLISHING.md)


| Feature | Server | Electron | NPM Library |
|---------|--------|----------|------------|
| Installation | No | Yes (`.exe`/`.dmg`) | `npm install` |
| Setup Difficulty | Easy | Medium | Easy |
| File Size | ~5-10 MB | ~150-200 MB | ~50-100 KB |
| Startup Time | Fast | Slower | N/A (code library) |
| Target Users | End users | End users | Developers |
| Native OS Integration | No | Yes (menus, taskbar) | N/A |
| Offline Mode | Yes | Yes | Yes |
| Auto Updates | No | Can add | Semver + npm |
| Professional Feel | No | Yes | N/A |
| TypeScript Support | No | Yes | Yes |
| Reusable in Other Apps | No | No | Yes |
| Distribution | Share `dist/` folder | Share installer | Publish to npm |


## Deployment Tips

### For Standalone Server:
1. **Package for distribution:**
   ```bash
   npm run build
   ```
   
2. **Create a ZIP file:**
   ```bash
   # Include: dist/, server.js, start-server.bat, start-server.sh, package.json, README.md
   ```

3. **Users just run:**
   - Windows: Double-click `start-server.bat`
   - macOS/Linux: Run `./start-server.sh`

### For Electron:
1. **Build:**
   ```bash
   npm run electron-build
   ```

2. **Distribute installers from `dist/`:**
   - `Terraria Companion.exe` - Portable (no installation needed!)
   - `Terraria Companion Installer.exe` - Full installer

3. **Or share via:**
   - GitHub Releases
   - itch.io
   - Your website

### For NPM Library:
1. **Build types:**
   ```bash
   npm run lib:build
   ```

2. **Publish:**
   ```bash
   npm publish
   ```

3. **Users install:**
   ```bash
   npm install terraria-companion-data
   ```

4. **Or publish privately:**
   - GitHub Packages
   - npm private packages
   - Private registries (Verdaccio, Artifactory)

## Troubleshooting

### Server Issues:

### Electron Issues:


## Next Steps

