# apps/mobile

Expo app with Expo Router. Covers Android, iOS and the web export that
`apps/desktop` consumes.

## Rules

- This is a thin shell. Files under `app/` only mount components from
  `@app/ui`; they hold no presentation logic.
- Default exports only in route files, because Expo Router requires them.
- Never hand-write `metro.config.js` with `watchFolders` or
  `extraNodeModules`: Expo configures Metro for monorepos automatically since
  SDK 52.
- `web.output` must stay `single`. Tauri serves static files and cannot run the
  `server` target.
- Add native dependencies with `npx expo install`, never with `pnpm add`, so
  versions stay aligned with the SDK. Verify with `npx expo-doctor`.

## Commands

    pnpm --filter @app/mobile dev        # pick a platform
    pnpm --filter @app/mobile dev:web    # web only, port 8081
    pnpm --filter @app/mobile android
    pnpm --filter @app/mobile ios
    pnpm --filter @app/mobile build:web  # writes dist/
