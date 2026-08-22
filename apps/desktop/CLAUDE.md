# apps/desktop

Tauri v2 desktop wrapper. It has no interface of its own: it serves the web
output of `apps/mobile`.

## Rules

- Interface code inside `src-tauri` means something went wrong.
- In development, `devUrl` points at the Expo dev server on port 8081.
- For builds, `frontendDist` points at `apps/mobile/dist`, produced by
  `beforeBuildCommand`.
- Requires Rust, plus Xcode Command Line Tools on macOS and WebView2 on
  Windows. If the toolchain is missing, say so instead of working around it.
- `security.csp` is `null` on purpose: the Expo web bundle injects inline
  styles and scripts, and a restrictive CSP would break it. Any product built
  on this template must define its own CSP in `tauri.conf.json` before
  shipping.

## Commands

    pnpm dev:desktop     # boots the web server and wraps it
    pnpm build:desktop   # desktop binary
