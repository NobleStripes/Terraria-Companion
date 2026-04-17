# Distribution Guide - Terraria Companion

This guide explains how to package and distribute Terraria Companion in two ways:
1. **Standalone Server** - No installation needed, just run a simple server
2. **Electron Desktop App** - Distributable `.exe` (Windows) or `.dmg` (macOS) installers

---

## Option 1: Standalone Server (No Installation)

Perfect for users who just want to run the app locally without installation.

### For End Users:

**Prerequisites:**
- Node.js installed ([download here](https://nodejs.org/))

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

---

## Option 2: Electron Desktop App

Create professional `.exe` and `.dmg` installers for distribution.

### For Developers:

**Prerequisites:**
- Node.js installed
- Build tools (for native modules):
  - **Windows:** Visual Studio Build Tools
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux:** Build essentials (`sudo apt-get install build-essential`)

### Development:

**Run in development mode (with hot reload):**
```bash
npm run electron-dev
```

This starts:
- Vite dev server on `http://localhost:5173`
- Electron window connecting to the dev server
- DevTools automatically opens for debugging

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

The Electron setup uses:
- `electron-main.cjs` - Main process (Node.js, system access)
- `electron-preload.cjs` - Preload script (secure bridge to renderer)
- `electron-builder.json` - Build configuration for installers

---

## Comparison Table

| Feature | Server | Electron |
|---------|--------|----------|
| Installation | No | Yes (`.exe`/`.dmg`) |
| Setup Difficulty | Easy | Medium |
| File Size | ~5-10 MB | ~150-200 MB |
| Startup Time | Fast | Slower |
| Native OS Integration | No | Yes (menus, taskbar, etc.) |
| Offline Mode | Yes | Yes |
| Auto Updates | No | Can add |
| Professional Feel | No | Yes |
| Distribution | Share `dist/` folder | Share installer |

---

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

---

## Troubleshooting

### Server Issues:
- **"Port 8000 already in use":** Change port: `PORT=3000 node server.js`
- **"dist folder not found":** Run `npm run build` first
- **Node.js not found:** Install from https://nodejs.org/

### Electron Issues:
- **"Cannot find module 'electron'":** Run `npm install`
- **Blank window:** Check console for errors (DevTools opens automatically in dev mode)
- **Build fails:** Ensure build tools are installed for your OS
- **File permissions:** On macOS/Linux, run `chmod +x start-server.sh` and `npm run electron-build`

---

## Next Steps

- **Add auto-update capability** to Electron app
- **Create branded installer** with custom logo/icon
- **Add crash reporting** with services like Sentry
- **Code signing** for production distribution
- **Release to app stores** (Microsoft Store, Mac App Store, etc.)
