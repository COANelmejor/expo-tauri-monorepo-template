# CLAUDE.md

## What this repository is

A cross-platform monorepo template. One codebase ships to Android, iOS, web and
desktop (Windows/macOS). It is built to be driven by a coding agent — Claude
Code or any comparable tool — so this file is the contract the agent works
under. Read it before changing anything.

What ships today is a deliberately tiny proof of concept: one screen showing a
greeting, the current platform name, and a counter with a button. That screen
lives in a shared package and every app just mounts it. It exists to prove the
four platforms work from a single source, not to be a starting feature.

**Replace that screen with your product. Keep the architecture.**

## How to work here with an agent

- State the goal, not the file list. The rules below tell the agent where code
  belongs; let it place things.
- Work one package at a time. If a task touches `apps/mobile` and
  `packages/ui`, start with the shared package.
- If a change needs an architectural decision this file does not cover, ask
  before implementing.
- Verify before claiming done. The checklist is at the end of this file, and
  "the types compile" is not the same as "the screen renders".
- When a convention changes, update this file in the same commit. This document
  is the source of truth; a stale rule here misleads every future session.
- Keep this file under ~200 lines. Long material belongs in `docs/` and gets
  linked from here.

## Stack (decided — do not propose alternatives)

| Layer | Technology |
| --- | --- |
| Package manager | pnpm workspaces |
| Task runner | Turborepo |
| Language | TypeScript (`strict: true`) |
| Mobile + web | Expo (React Native + React Native Web) + Expo Router |
| Desktop | Tauri v2 (wraps the Expo web export) |
| Styling | React Native StyleSheet (no UI library in the template) |
| Lint and format | Biome |
| Tests | Vitest |

## Structure

```
.
├── CLAUDE.md
├── README.md                 # English
├── README.es.md              # Spanish
├── package.json              # root scripts, shared devDeps
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── biome.json
├── .npmrc                    # node-linker=hoisted (required by Metro)
├── apps/
│   ├── mobile/               # Expo: Android, iOS and the web export
│   │   ├── app/              # Expo Router
│   │   ├── app.json
│   │   └── CLAUDE.md
│   └── desktop/              # Tauri v2
│       ├── src-tauri/
│       └── CLAUDE.md
└── packages/
    ├── ui/                   # shared components (RN + RN Web)
    ├── core/                 # pure logic, no UI dependencies
    └── config/               # shared tsconfig
```

Add `services/`, `api-client` or `types` when a real product needs them, not
before.

## Architecture rules

1. **Apps are thin shells.** Anything shareable lives in `packages/`. An app in
   `apps/` only configures the environment, mounts routes and renders
   components from `packages/ui`.
2. **`packages/core` never imports React or React Native.** Pure, testable
   TypeScript.
3. **`packages/ui` uses React Native primitives only** (`View`, `Text`,
   `Pressable`, `StyleSheet`). No raw HTML, no DOM-only APIs — they break on
   mobile.
4. **`apps/desktop` has no UI of its own.** It points at the
   `expo export --platform web` output of `apps/mobile`. Interface code inside
   `src-tauri` means something went wrong.
5. **Cross-package dependencies use `workspace:*`.**
6. **No new dependencies without justification.** If React Native or the
   standard library solves it, use that.

## Code conventions

- TypeScript `strict`. No `any`; use `unknown` and narrow.
- Function components, `export function ComponentName()`. No default exports
  except where Expo Router requires them (route files).
- Component files in `PascalCase.tsx`; everything else in `kebab-case.ts`.
- Each package exposes its public API from a single `src/index.ts`. Never
  import another package's internal paths.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- No comments restating the code. Comment the why, never the what.
- Source, comments and commit messages in English. The Spanish README is the
  only translated file.

## Commands

```bash
pnpm install            # install the workspace
pnpm init:project       # one-off setup after cloning the template
pnpm dev                # Expo dev server, pick a platform
pnpm dev:web            # web only, port 8081
pnpm build:web          # expo export --platform web
pnpm dev:desktop        # Tauri dev, boots the web server and wraps it
pnpm build:desktop      # desktop binary
pnpm typecheck          # tsc --noEmit across packages
pnpm test               # packages/core tests (Vitest)
pnpm lint               # Biome
pnpm format             # Biome, writes fixes
```

## Known traps

- **pnpm + Metro:** `.npmrc` with `node-linker=hoisted` is mandatory, not
  optional. Conversely, never hand-write `watchFolders` or `extraNodeModules`:
  Expo has configured Metro for monorepos automatically since SDK 52.
- **TypeScript version:** pinned to whatever Expo declares it expects (6.0.3
  today). `expo-doctor` fails on any other major. Check it when bumping the SDK.
- **New Architecture** is on by default and cannot be disabled on React Native
  0.82+. Verify any native library supports it before adding it.
- **Tauri needs Rust**, plus WebView2 on Windows and Xcode Command Line Tools on
  macOS. If the toolchain is missing, say so instead of working around it.
- **`web.output` must stay `single`.** Tauri serves static files and cannot run
  the `server` target.
- **`security.csp` is `null` on purpose** — the Expo web bundle injects inline
  styles and scripts. Define your own CSP before shipping a desktop app.
- **Never mix `npm` or `yarn`.** pnpm only.

## Verification

Before calling any task done:

1. `pnpm lint` passes.
2. `pnpm typecheck` passes.
3. `pnpm test` passes.
4. `npx expo-doctor` reports no compatibility problems.
5. `pnpm dev:web` serves the screen and it renders correctly.
6. `pnpm dev:desktop` opens a window showing the same screen.
7. The same screen renders on Android and iOS (simulator or Expo Go).

Steps 5 to 7 mean looking at the result, not assuming it. An agent with
simulator access should drive them itself and capture the screen.
