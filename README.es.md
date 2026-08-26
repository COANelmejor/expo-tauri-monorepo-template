# Plantilla de app multiplataforma

[English](README.md) · **Español**

Una sola base de código para Android, iOS, web y escritorio, pensada para
desarrollarse con un agente de programación como Claude Code.

Montar un monorepo que de verdad llegue a las cuatro plataformas cuesta un día
de pelea con las herramientas: los enlaces simbólicos de pnpm que Metro no
resuelve, la versión de TypeScript que Expo rechaza, un envoltorio de escritorio
que tiene que servir un bundle web que no construyó. Esta plantilla ya dio esas
peleas y las dejó documentadas, así que tu primera sesión empieza sobre terreno
firme.

## Por qué "para agentes"

Un agente de programación vale lo que valen las restricciones que le das.
Ponelo frente a un directorio vacío y obtendrás una arquitectura verosímil que
se rompe en la tercera plataforma. Ponelo frente a este repositorio y lo primero
que lee es `CLAUDE.md`, que le dice dónde va cada cosa, qué dependencias están
vetadas y cómo verificar su propio trabajo en los cuatro destinos.

Los tres archivos `CLAUDE.md` son el producto de verdad. El código es la
demostración de que las reglas se sostienen.

Son Markdown corriente, así que sirven con cualquier herramienta que lea
instrucciones del repositorio: Claude Code, Cursor, Copilot. Nada de esto es
exclusivo de Claude más allá del nombre del archivo.

## Qué incluye

Una sola pantalla —un saludo, el nombre de la plataforma actual y un contador—
que vive en un paquete compartido y que todas las apps montan. Existe para
demostrar que el cableado funciona. **Reemplazala por tu producto y conservá la
arquitectura.**

    apps/mobile      Expo: Android, iOS y el export web
    apps/desktop     Tauri: envuelve el export web, sin interfaz propia
    packages/ui      componentes compartidos (primitivas de React Native)
    packages/core    lógica pura, sin dependencias de UI
    packages/config  tsconfig compartidos

## Requisitos

| Herramienta | Versión mínima |
| --- | --- |
| Node | 20 |
| pnpm | 10 |
| Rust | 1.77 (solo escritorio) |
| Xcode + Command Line Tools | iOS, y escritorio en macOS |
| Android Studio + SDK | Android |

En Windows, el escritorio necesita además WebView2.

## Puesta en marcha

    pnpm install
    pnpm init:project

`init:project` convierte la plantilla en tu proyecto: renombra todos los
identificadores, reescribe la licencia, deja el README en el idioma que elijas,
actualiza el `CLAUDE.md` y se borra a sí mismo al terminar. Pregunta antes de
cambiar nada y nunca toca tu historial de git.

    pnpm dev:web

Después abrí http://localhost:8081.

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
| `pnpm format` | Biome, aplica correcciones |
| `pnpm init:project` | configuración inicial tras clonar; se elimina solo |

Para Android e iOS:

    pnpm --filter @app/mobile android
    pnpm --filter @app/mobile ios

## Qué reemplazar al clonar

`pnpm init:project` hace todo esto por vos. La tabla queda como referencia, o
por si preferís hacerlo a mano.

| Qué | Dónde |
| --- | --- |
| Prefijo `@app/` de los paquetes | el `package.json` de cada paquete y sus importaciones; los scripts `pnpm --filter @app/mobile` / `@app/desktop` del `package.json` raíz; `beforeDevCommand` y `beforeBuildCommand` en `apps/desktop/src-tauri/tauri.conf.json`; el campo `extends` de `apps/mobile/tsconfig.json`, `packages/ui/tsconfig.json` y `packages/core/tsconfig.json`; los ejemplos de comandos en `apps/mobile/CLAUDE.md` |
| Nombre del proyecto (`app-template`) | `package.json` raíz (`name`) y `apps/mobile/app.json` (`slug`) |
| Bundle identifier `com.ejemplo.app` | `apps/mobile/app.json` (`ios.bundleIdentifier`, `android.package`) y `apps/desktop/src-tauri/tauri.conf.json` (`identifier`) |
| Nombre visible `App Template` | `apps/mobile/app.json` (`name`) y `apps/desktop/src-tauri/tauri.conf.json` (`productName`) |
| Esquema de enlace profundo `apptemplate` | `apps/mobile/app.json` (`scheme`) |
| Iconos de escritorio | `apps/desktop/src-tauri/icons/`, regenerados con `tauri icon` a partir de una imagen de origen |
| Iconos de móvil y web | no hay ninguno declarado; se usan los de Expo por defecto. Para poner los tuyos, añadí los archivos y declaralos en `apps/mobile/app.json` con las claves `icon` y `splash` |
| Metadatos del binario de escritorio | `description` y `authors` en `apps/desktop/src-tauri/Cargo.toml` |
| Notas de diseño originales | `docs/superpowers/` contiene el spec y el plan de la prueba de concepto original; se puede borrar |

## Notas

- **TypeScript está fijado** a la versión que Expo declara esperar (hoy 6.0.3).
  `expo-doctor` falla con cualquier otra versión mayor, así que comprobalo al
  subir de SDK. La 7.x es el compilador reescrito en Go; esperá a que Expo lo
  declare.
- **El `.npmrc` con `node-linker=hoisted` es obligatorio**: sin él, Metro no
  resuelve los enlaces simbólicos de pnpm.
- **`security.csp` está en `null`** en
  `apps/desktop/src-tauri/tauri.conf.json`, porque el bundle web de Expo
  inyecta estilos y scripts en línea y una CSP restrictiva impediría que
  cargara dentro de la ventana de Tauri. Definí la tuya antes de publicar una
  aplicación de escritorio.

## Idioma del repositorio

El código, los comentarios y los `CLAUDE.md` están en inglés, para que la
plantilla sirva a cualquiera que la clone. Este README es la única traducción.

## Licencia

MIT — ver [LICENSE](LICENSE).
