# Cross-platform app template

**English** · [Español](README.es.md)

One codebase for Android, iOS, web and desktop — designed to be built out with
a coding agent like Claude Code.

Setting up a monorepo that actually ships to four platforms takes a day of
fighting toolchains: pnpm symlinks that Metro cannot resolve, TypeScript
versions Expo rejects, a desktop shell that has to serve a web bundle it did
not build. This template has those fights already lost and documented, so your
first session starts on working ground.

## Why "for agents"

A coding agent is only as good as the constraints it is given. Point one at an
empty directory and you get plausible architecture that breaks on the third
platform. Point one at this repository and it reads `CLAUDE.md` first, which
tells it where code belongs, which dependencies are off-limits, and how to
verify its own work on all four targets.

The three `CLAUDE.md` files are the real product here. The code is a
demonstration that the rules hold.

They are plain Markdown, so they work with any tool that reads repository
instructions — Claude Code, Cursor, Copilot. Nothing here is Claude-specific
beyond the filename.

## What you get

A single screen — a greeting, the current platform name, and a counter — living
in a shared package and mounted by every app. It exists to prove the wiring
works. **Replace it with your product; keep the architecture.**

    apps/mobile      Expo: Android, iOS and the web export
    apps/desktop     Tauri: wraps the web export, no UI of its own
    packages/ui      shared components (React Native primitives)
    packages/core    pure logic, no UI dependencies
    packages/config  shared tsconfig

## Requirements

| Tool | Minimum |
| --- | --- |
| Node | 20 |
| pnpm | 10 |
| Rust | 1.77 (desktop only) |
| Xcode + Command Line Tools | iOS, and desktop on macOS |
| Android Studio + SDK | Android |

Desktop on Windows also needs WebView2.

## Getting started

    pnpm install
    pnpm init:project

`init:project` turns the template into your project: it renames every
identifier, rewrites the license, keeps the README language you pick, updates
`CLAUDE.md`, and deletes itself when done. It asks before changing anything and
never touches your git history.

    pnpm dev:web

Then open http://localhost:8081.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Expo dev server, pick a platform |
| `pnpm dev:web` | web only, port 8081 |
| `pnpm build:web` | `expo export --platform web` |
| `pnpm dev:desktop` | Tauri in development |
| `pnpm build:desktop` | desktop binary |
| `pnpm typecheck` | `tsc --noEmit` across packages |
| `pnpm test` | `@app/core` tests |
| `pnpm lint` | Biome |
| `pnpm format` | Biome, writes fixes |
| `pnpm init:project` | one-off setup after cloning; removes itself |

For Android and iOS:

    pnpm --filter @app/mobile android
    pnpm --filter @app/mobile ios

## What to replace after cloning

`pnpm init:project` does all of this for you. The table is here for reference,
or if you would rather do it by hand.

| What | Where |
| --- | --- |
| `@app/` package prefix | each package's `package.json` and its imports; the `pnpm --filter @app/mobile` / `@app/desktop` scripts in the root `package.json`; `beforeDevCommand` and `beforeBuildCommand` in `apps/desktop/src-tauri/tauri.conf.json`; the `extends` field of `apps/mobile/tsconfig.json`, `packages/ui/tsconfig.json` and `packages/core/tsconfig.json`; the command examples in `apps/mobile/CLAUDE.md` |
| Project name (`app-template`) | root `package.json` (`name`) and `apps/mobile/app.json` (`slug`) |
| Bundle identifier `com.example.app` | `apps/mobile/app.json` (`ios.bundleIdentifier`, `android.package`) and `apps/desktop/src-tauri/tauri.conf.json` (`identifier`) |
| Display name `App Template` | `apps/mobile/app.json` (`name`) and `apps/desktop/src-tauri/tauri.conf.json` (`productName`) |
| Deep link scheme `apptemplate` | `apps/mobile/app.json` (`scheme`) |
| Desktop icons | `apps/desktop/src-tauri/icons/`, regenerated with `tauri icon` from a source image |
| Mobile/web icons | none are declared; Expo defaults are used. To add your own, put the files in the project and declare them in `apps/mobile/app.json` under `icon` and `splash` |
| Desktop binary metadata | `description` and `authors` in `apps/desktop/src-tauri/Cargo.toml` |
| Original design notes | `docs/superpowers/` holds the spec and plan of the original proof of concept; safe to delete |

## Notes

- **TypeScript is pinned** to the version Expo declares it expects (6.0.3
  today). `expo-doctor` fails on any other major, so check it when bumping the
  SDK. Version 7.x is the Go rewrite; wait until Expo declares it.
- **`.npmrc` with `node-linker=hoisted` is mandatory** — Metro cannot resolve
  pnpm's symlinks without it.
- **`security.csp` is `null`** in `apps/desktop/src-tauri/tauri.conf.json`,
  because the Expo web bundle injects inline styles and scripts and a
  restrictive CSP would stop it loading inside the Tauri window. Define your own
  CSP there before shipping a desktop app.

## License

MIT — see [LICENSE](LICENSE).
