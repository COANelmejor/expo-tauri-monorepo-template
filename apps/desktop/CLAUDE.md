# apps/desktop

Envoltorio de escritorio con Tauri v2. No tiene interfaz propia: sirve la
salida web de `apps/mobile`.

## Reglas

- Si aparece código de interfaz dentro de `src-tauri`, algo se hizo mal.
- En desarrollo, `devUrl` apunta al servidor de Expo en el puerto 8081.
- En la compilación, `frontendDist` apunta a `apps/mobile/dist`, que genera
  `beforeBuildCommand`.
- Requiere Rust y, en macOS, las Command Line Tools de Xcode. En Windows hace
  falta WebView2. Si falta el toolchain, decirlo en vez de rodearlo.
- `security.csp` está en `null` a propósito: el bundle de Expo web inyecta
  estilos y scripts en línea, y una CSP restrictiva lo rompería. Todo
  producto que herede esta plantilla debe definir su propia CSP en
  `tauri.conf.json` antes de publicar.

## Comandos

    pnpm dev:desktop     # levanta la web y la envuelve
    pnpm build:desktop   # binario de escritorio
