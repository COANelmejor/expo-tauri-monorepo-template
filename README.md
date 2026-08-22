# Plantilla monorepo multiplataforma

Una sola base de código para Android, iOS, web y escritorio.

## Requisitos previos

| Herramienta | Versión mínima |
| --- | --- |
| Node | 20 |
| pnpm | 10 |
| Rust | 1.77 (para escritorio) |
| Xcode + Command Line Tools | para iOS y escritorio en macOS |
| Android Studio + SDK | para Android |

En Windows, el escritorio necesita además WebView2.

## Puesta en marcha

    pnpm install
    pnpm dev:web

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Expo en desarrollo, eligiendo plataforma |
| `pnpm dev:web` | solo web, en el puerto 8081 |
| `pnpm build:web` | `expo export --platform web` |
| `pnpm dev:desktop` | Tauri en desarrollo |
| `pnpm build:desktop` | binario de escritorio |
| `pnpm typecheck` | `tsc --noEmit` en todos los paquetes |
| `pnpm test` | tests de `@app/core` |
| `pnpm lint` | Biome |

Para Android e iOS:

    pnpm --filter @app/mobile android
    pnpm --filter @app/mobile ios

## Estructura

    apps/mobile      Expo: Android, iOS y export web
    apps/desktop     Tauri: envuelve el export web
    packages/ui      componentes compartidos
    packages/core    lógica pura, sin dependencias de UI
    packages/config  tsconfig compartidos

## Qué reemplazar al clonar

| Qué | Dónde |
| --- | --- |
| Prefijo `@app/` de los paquetes | `package.json` de cada paquete y sus importaciones; los scripts `pnpm --filter @app/mobile` / `@app/desktop` del `package.json` raíz; `beforeDevCommand` y `beforeBuildCommand` en `apps/desktop/src-tauri/tauri.conf.json`; el campo `extends` de `apps/mobile/tsconfig.json`, `packages/ui/tsconfig.json` y `packages/core/tsconfig.json`; los ejemplos de comandos en `apps/mobile/CLAUDE.md` |
| Nombre del repositorio (`app-template`) | `package.json` raíz (`name`) y `apps/mobile/app.json` (`slug`) |
| Bundle identifier `com.ejemplo.app` | `apps/mobile/app.json` (`ios.bundleIdentifier`, `android.package`) y `apps/desktop/src-tauri/tauri.conf.json` (`identifier`) |
| Nombre visible `App Template` | `apps/mobile/app.json` (`name`) y `apps/desktop/src-tauri/tauri.conf.json` (`productName`) |
| Esquema de enlace profundo `apptemplate` | `apps/mobile/app.json` (`scheme`) |
| Iconos de escritorio | `apps/desktop/src-tauri/icons/`, regenerados con `tauri icon` a partir de una imagen de origen |
| Iconos de móvil/web | la PoC no declara ninguno y usa los de Expo por defecto; para poner los propios, añade los archivos al proyecto y decláralos en `apps/mobile/app.json` con las claves `icon` y `splash` |

## Notas de la plantilla

- TypeScript está fijado en la versión que Expo declara esperar (hoy 6.0.3).
  Al subir de SDK, comprueba con `npx expo-doctor` si esa expectativa cambió.
  La 7.x es el compilador reescrito en Go; espera a que Expo lo declare.
- El `.npmrc` con `node-linker=hoisted` es obligatorio: Metro no resuelve los
  enlaces simbólicos de pnpm.
- `apps/desktop/src-tauri/tauri.conf.json` tiene `security.csp` en `null`
  porque el export web de Expo inyecta estilos y scripts en línea, y una CSP
  restrictiva rompería la carga del bundle dentro de la ventana de Tauri.
  Cualquier producto que parta de esta plantilla debe definir su propia CSP
  en ese archivo antes de publicar la aplicación de escritorio.
