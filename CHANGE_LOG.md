# Change Log

This is a fork of [yoshi389111/github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib), branched from upstream release **v0.9.1** (2025-09-13). Only changes made in this fork are listed below.

---

## Fork changes (newest first)

### Pie chart breathing animation
- Redesigned continuous breathing effect: unified opacity sweep, radial arc expansion, and glow pulse filter.

### Radar chart
- Shortened label from "PullReq" to "PR" for a cleaner layout.

### Layout & visual polish
- Added subtle gradient background (auto light/dark detection).
- Added translucent card backgrounds behind pie and radar charts.
- Repositioned stats bar (contributions / stars / forks) below the pie chart, left-aligned with even spacing.

### Wave animation on 3D blocks
- Added continuous vertical wave oscillation after the initial grow animation completes.

### Themed pie colors
- Added `pieColors` support in settings JSON so pie chart slices can match the theme palette.

### Custom themes
- Added 5 theme pairs (light + dark): Nord, Solarized, Gruvbox, Rose Pine, Graphite.
- Removed upstream's multi-language README translations and original demo images.

### Tooling & CI
- Migrated to Bun as the primary package manager.
- Added `update-demo.yml` workflow to auto-regenerate demo SVGs on push.
- Updated `build.yml` workflow to use Bun with lint and type-check steps.
- Added `OUTPUT_DIR` env var support for custom output directory.

### Cleanup
- Removed `package-lock.json` (Bun-only).
- Removed `CODE_OF_CONDUCT.md` (not needed for personal fork).
- Extracted shared `OTHER_COLOR` constant to `utils.ts`.
- Replaced loose equality (`==`) with strict equality (`===`) in `create-css-colors.ts`.
- Extracted magic numbers to named constants across source files.
- Refactored panel color selection in `create-3d-contrib.ts` into a shared `applyPanelColor()` helper.
