# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Vue 3 and TypeScript local Go game built with Vite.

- `src/components/game/`: board, sidebar, dialogs, and game-level UI components
- `src/composables/useGoGame.ts`: application state and gameplay orchestration
- `src/services/`: rules engine integration, persistence, SGF conversion, and board adapter
- `src/types/`: shared domain and third-party type declarations
- `src/assets/main.css`: global styles
- `uno.config.ts`: UnoCSS configuration

Keep domain logic in `services`, stateful coordination in `composables`, and presentation behavior in Vue components. Static build output belongs in `dist/` and must not be committed.

## Build, Test, and Development Commands

Use pnpm, matching the version declared in `package.json`.

- `pnpm install`: install dependencies
- `pnpm dev`: start the Vite development server
- `pnpm build`: run TypeScript checks and create a production build
- `pnpm typecheck`: run `vue-tsc` without building
- `pnpm preview`: serve the production build locally

There is currently no automated test command. Add a documented script before introducing tests.

## Coding Style & Naming Conventions

Use Vue Composition API with `<script setup lang="ts">`. Follow the existing style:

- two-space indentation
- single quotes
- no semicolons
- `PascalCase.vue` for components
- `camelCase` for functions and variables
- `useXxx.ts` for composables
- explicit domain names such as `GameSnapshot` and `createScoreResult`

Keep functions focused and prefer typed, explicit behavior over broad abstractions. Do not invent undocumented fields or compatibility fallbacks.

## Testing Guidelines

No testing framework or coverage threshold is configured. For new tests, place unit tests beside the relevant module using `*.spec.ts`, add the required pnpm script, and document the chosen framework in this file. Prioritize game rules, SGF parsing, persistence, and state transitions.

## Commit & Pull Request Guidelines

Use Conventional Commits, consistent with the current history, for example:

```text
feat: add handicap game settings
fix: preserve dead-stone selection
```

Keep commits scoped and readable. Pull requests should include a concise summary, relevant issue links, verification notes, and screenshots for visible UI changes.

## Agent-Specific Instructions

Unless explicitly authorized, modify code only. Do not run builds, tests, linting, type checks, local services, or other self-verification commands.
