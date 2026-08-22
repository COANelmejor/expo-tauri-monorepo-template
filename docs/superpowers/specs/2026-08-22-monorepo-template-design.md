# Diseño: plantilla monorepo multiplataforma (PoC)

Fecha: 2026-08-22
Estado: aprobado

## Objetivo

Crear desde cero un monorepo plantilla que muestre la misma pantalla en Android,
iOS, web y escritorio a partir de una sola base de código. La pantalla saluda,
nombra la plataforma actual y lleva un contador con un botón.

Al terminar, el repositorio se congela como punto de partida para productos
nuevos. Nada específico de dominio, nombres genéricos, cero dependencias
innecesarias.

Fuera de alcance: lógica de negocio, autenticación, base de datos, backend,
`services/`, `infra/`, `api-client`, `types`, CI.

## Decisiones

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Lint y formato | Biome 2.5.x | Un solo binario reemplaza ESLint y Prettier, sin plugins |
| Tests | Vitest 4.x | Corre TypeScript puro sin configuración; `core` no necesita nada de React Native |
| TypeScript | 5.9.x | TS 7.0.2 es el compilador nuevo en Go; Expo 57 y los tipos de RN aún se declaran contra 5.x |
| Expo ↔ Tauri | Híbrido | Dev server con recarga en caliente en desarrollo, export estático en el binario |
| Salida web | `web.output: "single"` | SPA con enrutado en cliente; Tauri sirve archivos sin servidor detrás |
| `metro.config.js` | Sin `watchFolders` manuales | Desde el SDK 52 Expo configura Metro para monorepos automáticamente |
| Verificación | Web y escritorio automatizadas | Android e iOS los ejecuta la persona usuaria con los comandos preparados |

## Versiones

expo y expo-router 57.0.15 · react-native 0.87.0 · @tauri-apps/cli 2.11.4 ·
turbo 2.10.11 · @biomejs/biome 2.5.10 · vitest 4.1.11 · typescript 5.9.x ·
pnpm 10.33.0 · Rust 1.98.0

## Estructura

```
.
├── package.json            # scripts raíz, devDeps compartidas, packageManager
├── pnpm-workspace.yaml     # apps/*, packages/*
├── turbo.json              # typecheck, test, build:web
├── tsconfig.base.json      # strict: true, fuente de verdad de compilación
├── biome.json              # lint y formato de todo el monorepo
├── .npmrc                  # node-linker=hoisted
├── .gitignore
├── README.md
├── apps/
│   ├── mobile/             # @app/mobile
│   │   ├── app/_layout.tsx
│   │   ├── app/index.tsx
│   │   ├── app.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── CLAUDE.md
│   └── desktop/            # @app/desktop
│       ├── src-tauri/      # Cargo.toml, tauri.conf.json, build.rs, src/, icons/
│       ├── package.json
│       └── CLAUDE.md
└── packages/
    ├── core/               # @app/core
    ├── ui/                 # @app/ui
    └── config/             # @app/config
```

## Componentes

### `@app/core`

TypeScript puro. No importa React ni React Native.

API pública en `src/index.ts`:

```ts
export function buildGreeting(input: { platform: string }): string
```

Devuelve el texto del saludo a partir del nombre de plataforma que recibe. No
detecta la plataforma por su cuenta: `Platform.OS` pertenece a React Native y
entraría en conflicto con la regla de que `core` no dependa de UI. Se prueba con
Vitest.

### `@app/ui`

Solo primitivas de React Native: `View`, `Text`, `Pressable`, `StyleSheet`.

API pública en `src/index.ts`:

```ts
export function HomeScreen(): JSX.Element
```

Lee `Platform.OS`, se lo pasa a `buildGreeting` y mantiene el contador con
`useState`. Sin HTML crudo ni APIs exclusivas del DOM.

### `@app/config`

`tsconfig.base.json` en la raíz es la única fuente de opciones del compilador.
Este paquete expone las variantes que la heredan: `react-native.json` para `ui`
y `mobile`, `node.json` para `core`. El linter no se reparte aquí: Biome cubre
el monorepo entero desde `biome.json` en la raíz.

### `@app/mobile`

Expo 57 con Expo Router. `app/_layout.tsx` define el layout raíz y
`app/index.tsx` hace `export default` de un envoltorio sobre `HomeScreen`.
Ninguna lógica de presentación propia. `app.json` fija `web.output: "single"` y
los identificadores genéricos.

### `@app/desktop`

Solo `src-tauri/`. Si aparece un archivo de interfaz aquí, algo se hizo mal.

`tauri.conf.json`:

- `devUrl`: `http://localhost:8081`
- `frontendDist`: `../../mobile/dist`
- `beforeDevCommand` y `beforeBuildCommand` delegan en los scripts de `@app/mobile`

## Flujo de datos

`Platform.OS` → `HomeScreen` → `buildGreeting` → texto renderizado. El contador
es estado local de `HomeScreen`. No hay estado compartido ni persistencia.

## Comandos

Los ocho nombres que fija `CLAUDE.md` se respetan literalmente:

```
pnpm install · pnpm dev · pnpm dev:web · pnpm build:web
pnpm dev:desktop · pnpm build:desktop · pnpm typecheck · pnpm lint
```

Se añade un noveno, `pnpm test`, que `CLAUDE.md` no lista pese a pedir un test
en `core`. Al terminar la PoC se documenta en `CLAUDE.md` junto al resto.

Turborepo orquesta `typecheck` y `test`. `lint` no pasa por Turborepo: Biome
recorre el monorepo entero de una sola pasada desde la raíz. Los scripts de
`dev` pasan directo al paquete correspondiente.

## Errores y casos límite

La PoC no tiene entradas de usuario que validar ni operaciones que fallen. El
contador solo incrementa. Los riesgos reales son de integración:

- Metro no resuelve enlaces simbólicos de pnpm. Mitigación: `node-linker=hoisted`.
- El export web puede generar rutas absolutas. Si Tauri no las sirve, se ajusta
  la configuración de export, nunca el HTML a mano.
- Tauri exige Rust y, en macOS, Xcode Command Line Tools. Ambos verificados.

## Verificación

1. `pnpm typecheck` sin errores.
2. `pnpm lint` sin errores.
3. `pnpm test` en verde (test de `buildGreeting`).
4. `npx expo-doctor` sin problemas de compatibilidad.
5. `pnpm dev:web` levanta y la pantalla se ve correctamente.
6. `pnpm dev:desktop` abre la ventana con la misma pantalla.
7. Android e iOS: los ejecuta la persona usuaria con los comandos preparados.

Los pasos 1 a 6 se automatizan en esta sesión. El 7 queda documentado.

## Fase plantilla

Ningún identificador contiene nombre de producto. Se usan `@app/` y
`com.ejemplo.app`, fáciles de buscar y reemplazar. El `README.md` lista qué
reemplazar al clonar: nombre de paquete, bundle identifier, nombre visible e
iconos. También documenta la actualización a TypeScript 7 como paso posterior.
