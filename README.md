# LetsGO

[简体中文](./README.zh-CN.md)

LetsGO is a local two-player Go application built with Vue 3, TypeScript, and Vite. The in-app Go room is named "Songyan Go Room", and all game data remains in the current browser.

## Features

- 9x9, 13x13, and 19x19 boards
- Custom player names and komi
- Chinese area scoring and positional superko
- Play, capture, pass, undo, resign, and end-game scoring
- Automatic local game saving and recovery
- SGF import, export, main-line review, and variation play
- Light, dark, and system themes
- Multiple stone-placement sounds with an option to disable audio

## Tech Stack

- Vue 3
- TypeScript
- Vite
- UnoCSS
- Tenuki
- WGo.js
- `@sabaki/sgf`

## Getting Started

This project uses `pnpm@11.5.0`.

```bash
pnpm install
pnpm dev
```

After the development server starts, open the URL shown in the terminal.

## Available Commands

```bash
# Start the development server
pnpm dev

# Run TypeScript checks and create a production build
pnpm build

# Run TypeScript checks only
pnpm typecheck

# Preview the production build
pnpm preview
```

## SGF Support

SGF import supports:

- A single Go game per file
- 9x9, 13x13, or 19x19 boards
- Alternating black and white moves on the main line
- UTF-8 encoding

SGF files containing handicap settings, setup stones, removed stones, or an explicitly assigned starting player are not currently supported.

## Project Structure

```text
src/
├── components/game/       # Board, sidebar, and dialog components
├── composables/           # Game, theme, and sound state coordination
├── services/              # Rules engine, persistence, SGF, and board adapters
├── types/                 # Shared type definitions
└── assets/                # Global styles and sound assets
```

## Data Storage

Game saves, theme preferences, and sound preferences are stored in browser `localStorage` and are not uploaded to a remote service.
