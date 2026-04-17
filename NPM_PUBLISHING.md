# NPM Library Distribution

This guide explains how to publish Terraria Companion as an npm package so other developers can use the game data in their own projects.

## What You Can Export

The library exports:
- **Game Data:** `items`, `bosses`, `npcs`, `biomes`, `recipes`
- **TypeScript Types:** All type definitions for full IDE support
- **Utility Functions:** Search and filtering hooks for easy integration

## Example Usage

After publishing to npm as `terraria-companion-data`:

```typescript
import { items, bosses, recipes } from 'terraria-companion-data';
import type { Item, Boss } from 'terraria-companion-data';
import { searchItems } from 'terraria-companion-data';

// Use the data
const item: Item = items[0];
console.log(item.name); // "Copper Shortsword"

// Search
const results = searchItems('copper');

// Type-safe
const boss: Boss = bosses[0];
```

## Publishing Steps

### 1. Create NPM Account
```bash
npm adduser
# or
npm login
```

### 2. Build the Library
```bash
npm run lib:build
```

Generates TypeScript declaration files in `dist/`.

### 3. Update Version
Edit `package.json`:
```json
{
  "version": "1.0.0"  // Change version before each publish
}
```

### 4. Publish to NPM
```bash
npm publish
```

### 5. Update in Your Projects
```bash
npm install terraria-companion-data
```

## Alternative: Private Package

For internal use only (company/team):

```bash
# Create scoped package
npm publish --access=restricted
```

Or use private npm registries:
- GitHub Packages
- GitLab Packages
- npm private packages
- Verdaccio (self-hosted)

## Local Testing

Before publishing, test locally:

```bash
npm link

# In another project:
npm link terraria-companion-data
```

## Package Configuration

The library configuration is in `package-lib.json` and includes:
- Main entry point: `dist/lib-index.js`
- TypeScript declarations: `dist/lib-index.d.ts`
- Sub-exports for data: `terraria-companion-data/data`
- Source maps for debugging

## Semantic Versioning

Follow [semver.org](https://semver.org/):

- **MAJOR** (1.0.0) — Breaking API changes
- **MINOR** (0.1.0) — New features, backwards compatible
- **PATCH** (0.0.1) — Bug fixes, no API changes

Example version progression:
```
0.1.0 → Initial release with basic data
0.2.0 → Added more items
1.0.0 → Stable API, ready for production use
```

## GitHub Integration

### Publish from GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish NPM Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run lib:build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then create a GitHub release to trigger auto-publish!

## Maintenance

### Keep Data Updated

When Terraria updates:
1. Update `src/data/*.json`
2. Bump version in `package.json`
3. Run `npm run lib:build`
4. Run `npm publish`

### Monitor Usage

Track your package:
- [npm stats](https://www.npmjs.com/package/terraria-companion-data)
- GitHub releases and tags
- Issues and feedback

## Documentation

### README for npm

Create `NPM_README.md`:

```markdown
# Terraria Companion Data

Complete Terraria game data (items, bosses, NPCs, biomes) as an npm package.

## Installation

\`\`\`bash
npm install terraria-companion-data
\`\`\`

## Usage

\`\`\`typescript
import { items, bosses } from 'terraria-companion-data';
\`\`\`

## Data Included

- 300+ items with crafting recipes
- 16+ bosses with loot tables
- 25+ NPCs with happiness data
- 20+ biomes with resources
- Complete type definitions

## License

MIT - See LICENSE file

This is an unofficial fan project not affiliated with Re-Logic.
\`\`\`

### TypeScript Docs

Add JSDoc comments to exported types:

```typescript
/**
 * Represents an in-game item.
 * @example
 * const sword = items.find(i => i.name === 'Copper Shortsword');
 */
export interface Item {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'tool' | 'material' | ...;
  // ...
}
```

## Monetization (Optional)

- Use `npm fund` to add donation links
- Sponsor via GitHub Sponsors
- Include in sponsorship section of README

## Checklist

- [ ] Code is published on GitHub
- [ ] Package name is unique on npm (check: `npm view terraria-companion-data`)
- [ ] README.md is detailed and clear
- [ ] Types are exported and documented
- [ ] `lib:build` script works
- [ ] Version bumped in package.json
- [ ] `npm publish` succeeds
- [ ] Test install: `npm install terraria-companion-data`
