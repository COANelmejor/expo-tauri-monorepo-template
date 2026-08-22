# CLAUDE.md

## Qué es este repositorio

Monorepo plantilla multiplataforma. El objetivo de esta primera fase es **una PoC "Hola mundo"** que corra en Android, iOS, web y escritorio (Windows/macOS) desde una sola base de código compartida.

**No implementes lógica de negocio, autenticación, base de datos ni backend.** El único objetivo funcional es: una pantalla que muestre un saludo, el nombre de la plataforma actual y un contador con un botón. Esa pantalla vive en un paquete compartido y las apps solo la montan.

Al terminar la PoC, este repositorio se convertirá en plantilla para nuevos productos. Por eso: **nada específico de dominio, nombres genéricos, cero dependencias innecesarias.**

## Stack (decidido — no proponer alternativas)

| Capa | Tecnología |
| --- | --- |
| Gestor de paquetes | pnpm workspaces |
| Orquestador | Turborepo |
| Lenguaje | TypeScript (`strict: true`) |
| Móvil + web | Expo (React Native + React Native Web) + Expo Router |
| Escritorio | Tauri v2 (envuelve el export web de Expo) |
| Estilos | StyleSheet de React Native (sin librerías de UI en la PoC) |
| Lint y formato | Biome |
| Tests | Vitest |

## Estructura objetivo

```
.
├── CLAUDE.md
├── README.md
├── package.json              # scripts raíz, devDeps compartidas
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── biome.json                # config de lint y formato
├── .npmrc                    # node-linker=hoisted (requerido por Metro)
├── apps/
│   ├── mobile/               # Expo: Android, iOS y export web
│   │   ├── app/              # Expo Router
│   │   ├── app.json
│   │   └── CLAUDE.md
│   └── desktop/              # Tauri v2
│       ├── src-tauri/
│       └── CLAUDE.md
└── packages/
    ├── ui/                   # componentes compartidos (RN + RN Web)
    ├── core/                 # lógica pura, sin dependencias de UI
    └── config/               # tsconfig compartidos
```

En la PoC **no crees** `services/`, `infra/`, `api-client` ni `types`. Se añadirán cuando haya producto real.

## Reglas de arquitectura

1. **Las apps son cascarones delgados.** Todo lo que se pueda compartir vive en `packages/`. Una app en `apps/` solo debe: configurar el entorno, montar rutas y renderizar componentes de `packages/ui`.
2. **`packages/core` no importa React ni React Native.** Es TypeScript puro y testeable.
3. **`packages/ui` usa solo primitivas de React Native** (`View`, `Text`, `Pressable`, `StyleSheet`). Nada de HTML crudo ni APIs exclusivas del DOM, o se rompe en móvil.
4. **`apps/desktop` no tiene UI propia.** Apunta a la salida de `expo export --platform web` de `apps/mobile`. Si aparece código de interfaz en `src-tauri`, algo se hizo mal.
5. **Dependencias compartidas con `workspace:*`** en los `package.json` de las apps.
6. **Sin dependencias nuevas sin justificarlas.** Si algo se resuelve con la librería estándar o con RN, se usa eso.

## Convenciones de código

- TypeScript `strict`. Nada de `any`; usa `unknown` y estrecha el tipo.
- Componentes en función, con `export function NombreComponente()`. Sin `default export` salvo donde Expo Router lo exija (archivos de ruta).
- Archivos de componentes en `PascalCase.tsx`; el resto en `kebab-case.ts`.
- Cada paquete expone su API pública en un único `src/index.ts`. No importar rutas internas de otro paquete.
- Commits convencionales: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Sin comentarios que expliquen lo obvio. Comenta solo el porqué, no el qué.

## Comandos

Defínelos en la raíz y mantenlos con estos nombres exactos:

```bash
pnpm install            # instalar todo el workspace
pnpm dev                # Expo en modo desarrollo (elige plataforma)
pnpm dev:web            # solo web
pnpm build:web          # expo export --platform web
pnpm dev:desktop        # Tauri en dev (levanta la web y la envuelve)
pnpm build:desktop      # binario de escritorio
pnpm typecheck          # tsc --noEmit en todos los paquetes
pnpm test               # tests de packages/core (Vitest)
pnpm lint
pnpm format             # Biome, aplica correcciones
```

## Verificación

Antes de dar por terminada cualquier tarea:

1. `pnpm typecheck` pasa sin errores.
2. `pnpm lint` pasa sin errores.
3. `pnpm dev:web` levanta y la pantalla se ve correctamente.
4. La misma pantalla se ve en Android e iOS (simulador o Expo Go).
5. `npx expo-doctor` no reporta problemas de compatibilidad.

La PoC está completa cuando la misma pantalla se ve en las cuatro plataformas —web, Android, iOS y escritorio vía Tauri— sin código duplicado entre ellas.

## Trampas conocidas

- **pnpm + Metro:** el `.npmrc` con `node-linker=hoisted` es obligatorio, no
  opcional. En cambio, no añadas `watchFolders` ni `extraNodeModules` a mano:
  desde el SDK 52 Expo configura Metro para el monorepo automáticamente.
- **New Architecture:** está activa por defecto en Expo SDK actual y no se puede desactivar en React Native 0.82+. Antes de añadir cualquier librería nativa, verifica que la soporte.
- **Tauri necesita Rust instalado** y, en Windows, WebView2. En macOS requiere Xcode Command Line Tools. Si falta el toolchain, indícalo en vez de intentar rodearlo.
- **Rutas absolutas en el export web:** Tauri sirve los archivos localmente; si Expo genera rutas absolutas rotas, ajusta la configuración de export en lugar de parchear el HTML a mano.
- **No mezclar `npm` o `yarn`.** Solo `pnpm`.

## Cómo trabajar en este repositorio

- Trabaja de a un paquete por vez. Si una tarea toca `apps/mobile` y `packages/ui`, empieza por el paquete compartido.
- Si un cambio requiere una decisión de arquitectura que este archivo no cubre, pregunta antes de implementar.
- Al terminar un hito, actualiza este archivo si alguna convención cambió. Este documento es la fuente de verdad.
- Mantén este archivo por debajo de ~200 líneas. Los detalles largos van a `docs/` y se enlazan desde aquí.

## Orden de trabajo sugerido

1. Andamiaje del monorepo: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.npmrc`, `packages/config`.
2. `packages/core` con una función trivial (por ejemplo, generar el texto del saludo) y su test.
3. `packages/ui` con la pantalla de la PoC, consumiendo `core`.
4. `apps/mobile` con Expo Router montando la pantalla. Verificar web, Android e iOS.
5. `apps/desktop` con Tauri apuntando al export web. Verificar en escritorio.
6. `README.md` con los requisitos previos y los pasos para clonar la plantilla.

## Fase plantilla (después de la PoC)

Cuando la PoC funcione, este repositorio se congela como punto de partida. Para ese momento:

- Ningún identificador debe contener el nombre de un producto concreto. Usa marcadores claros (`@app/`, `com.ejemplo.app`) fáciles de buscar y reemplazar.
- El `README.md` debe listar exactamente qué reemplazar al clonar: nombre del paquete, bundle identifier, nombre visible de la app e iconos.
- Cualquier decisión tomada durante la PoC que un producto futuro debería heredar se documenta aquí.