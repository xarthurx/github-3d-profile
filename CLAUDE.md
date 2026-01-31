# Project CLAUDE.md

## Overview

Forked GitHub Action that generates animated 3D isometric contribution calendars as SVG.
Source repo: `xarthurx/github-profile-3d-contrib`. Used by the profile repo `xarthurx/xarthurx`.

## Build & Test

- Use **bun** (not npm): `bun install`, `bun run build`, `bun run test`
- Build pipeline: `tsc` then `ncc` to bundle into `dist/index.js`
- Tests: `bun run test` (jest, specs in `spec/`)
- Generate demo themes locally: set `GITHUB_TOKEN` env, then `bun run dev USERNAME`

## Architecture

- `src/index.ts` — Entry point. Fetches GitHub data, applies settings, writes SVGs
- `src/create-svg.ts` — Main SVG compositor. Positions 3D calendar, radar, pie, stats
- `src/create-3d-contrib.ts` — 3D isometric contribution blocks with grow + wave animation
- `src/create-pie-language.ts` — Language donut pie chart with breathing animation
- `src/create-radar-contrib.ts` — Radar chart for contribution types
- `src/create-css-colors.ts` — Generates CSS classes from theme settings
- `src/type.ts` — All TypeScript interfaces (settings, user info, etc.)
- `src/aggregate-user-info.ts` — Transforms GitHub GraphQL response into UserInfo
- `src/settings/` — Built-in theme JSON presets (Normal, Season, Night, etc.)

## Custom Themes

Theme config lives in `sample-settings/theme-preview.json` (array of settings objects).
Each theme object supports:

- `type`, `fileName`, `backgroundColor`, `foregroundColor`, `strongColor`, `weakColor`, `radarColor`
- `contribColors`: 5-color array for contribution intensity levels
- `pieColors`: optional array (up to 6) to override GitHub's default language colors in the pie chart — **should match the theme palette**
- `growingAnimation`: enable grow intro animation

Current custom themes: Nord, Solarized, Gruvbox, Rose Pine, Graphite (light + dark each).

## Design Decisions

- **Pie chart colors** must harmonize with the overall theme. Always set `pieColors` using colors from the theme's palette.
- **Animations**: Grow intro (3s, one-shot) followed by continuous effects — wave on 3D blocks, breathing on pie chart.
- **Stats bar** (contributions/stars/forks) is left-aligned below the pie chart.
- **No "most worked on projects"** feature — the pie chart already covers language breakdown, and commit count is a misleading metric.

## Workflow

- When making changes, always generate example SVGs to visually verify before committing.
- To generate test SVGs: write a small script using `spec/dummy-data.ts` + `createSvg()`, run with `bun run script.ts`.
- After code changes: `bun run test && bun run build` before committing.
- The GitHub Action workflow in the profile repo (`xarthurx/xarthurx`) runs daily at 03:00 JST.
