# Plantilla monorepo multiplataforma — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un monorepo plantilla que muestre la misma pantalla —saludo, nombre de plataforma y contador— en Android, iOS, web y escritorio desde una sola base de código.

**Architecture:** Las apps son cascarones delgados. `@app/core` guarda lógica pura sin React, `@app/ui` la pantalla con primitivas de React Native, `@app/mobile` la monta con Expo Router y `@app/desktop` envuelve la salida web con Tauri sin aportar interfaz propia.

**Tech Stack:** pnpm 10.33 workspaces · Turborepo 2.10 · TypeScript 6.0 · Expo 57 + Expo Router · React Native 0.86 · Tauri 2.11 · Biome 2.5 · Vitest 4.1

**Spec:** `docs/superpowers/specs/2026-08-22-monorepo-template-design.md`

## Global Constraints

- TypeScript `strict: true`. Prohibido `any`; usar `unknown` y estrechar el tipo.
- `@app/core` no importa React ni React Native bajo ninguna circunstancia.
- `@app/ui` usa solo `View`, `Text`, `Pressable`, `StyleSheet`. Nada de HTML crudo ni APIs del DOM.
- `apps/desktop` no contiene archivos de interfaz. Solo `src-tauri/` y su `package.json`.
- Cada paquete expone su API pública en un único `src/index.ts`. Prohibido importar rutas internas de otro paquete.
- Dependencias entre paquetes del workspace con `workspace:*`.
- Componentes con `export function NombreComponente()`. Sin `default export` salvo en archivos de ruta de Expo Router.
- Archivos de componente en `PascalCase.tsx`; el resto en `kebab-case.ts`.
- Identificadores genéricos: paquetes bajo `@app/`, bundle identifier `com.ejemplo.app`.
- Commits convencionales: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Sin comentarios que expliquen lo obvio. Comentar solo el porqué.
- Solo `pnpm`. Nunca `npm` ni `yarn` para instalar.
- No escribir `metro.config.js` con `watchFolders` ni `extraNodeModules`: Expo 52+ lo configura solo.
- TypeScript se fija en `~6.0.3`, la versión que Expo 57 declara esperar. No usar 7.x.

---

### Task 1: Andamiaje del workspace

Deja el monorepo instalable y con linter funcionando. Sin esto ninguna tarea posterior puede ejecutarse.

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `turbo.json`
- Create: `packages/config/package.json`
- Create: `packages/config/react-native.json`
- Create: `packages/config/node.json`

**Interfaces:**
- Consumes: nada.
- Produces: los tsconfig `@app/config/react-native.json` (para `ui` y `mobile`) y `@app/config/node.json` (para `core`); los scripts raíz `typecheck`, `lint`, `test`.

- [ ] **Step 1: Crear `.npmrc`**

Metro no resuelve los enlaces simbólicos de pnpm. Este archivo no es opcional.

```
node-linker=hoisted
```

- [ ] **Step 2: Crear `pnpm-workspace.yaml`**

`onlyBuiltDependencies` hace falta porque pnpm 10 bloquea los scripts de postinstalación por defecto.

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

onlyBuiltDependencies:
  - '@biomejs/biome'
  - esbuild
```

- [ ] **Step 3: Crear `package.json` en la raíz**

```json
{
  "name": "app-template",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "dev": "pnpm --filter @app/mobile dev",
    "dev:web": "pnpm --filter @app/mobile dev:web",
    "build:web": "pnpm --filter @app/mobile build:web",
    "dev:desktop": "pnpm --filter @app/desktop dev",
    "build:desktop": "pnpm --filter @app/desktop build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "lint": "biome check .",
    "format": "biome check --write ."
  },
  "devDependencies": {
    "@biomejs/biome": "^2.5.10",
    "turbo": "^2.10.11",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 4: Crear `.gitignore`**

```
node_modules/
.turbo/
dist/
.expo/
apps/desktop/src-tauri/target/
*.log
.DS_Store
```

- [ ] **Step 5: Crear `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ESNext", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

- [ ] **Step 6: Crear `packages/config/package.json`**

El campo `exports` es necesario para que TypeScript resuelva `@app/config/react-native.json` desde otros paquetes.

```json
{
  "name": "@app/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./react-native.json": "./react-native.json",
    "./node.json": "./node.json"
  }
}
```

- [ ] **Step 7: Crear `packages/config/react-native.json`**

La ruta de `extends` se resuelve desde este archivo, no desde quien lo consume.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "Bundler"
  }
}
```

- [ ] **Step 8: Crear `packages/config/node.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ESNext"],
    "types": []
  }
}
```

- [ ] **Step 9: Crear `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.10/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "includes": ["**", "!**/dist/**", "!**/.expo/**", "!**/target/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "asNeeded" }
  }
}
```

- [ ] **Step 10: Crear `turbo.json`**

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "typecheck": { "dependsOn": ["^typecheck"] },
    "test": {},
    "build:web": { "dependsOn": ["^typecheck"], "outputs": ["dist/**"] }
  }
}
```

- [ ] **Step 11: Instalar**

Run: `pnpm install`
Expected: termina sin errores y crea `node_modules/` y `pnpm-lock.yaml`.

- [ ] **Step 12: Verificar el linter**

Run: `pnpm lint`
Expected: PASS. Si Biome reporta problemas de formato en los JSON, corregir con `pnpm format` y volver a ejecutar `pnpm lint`.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "chore: andamiaje del monorepo con pnpm, turborepo y biome"
```

---

### Task 2: `@app/core` con su test

Lógica pura del saludo, desarrollada con TDD. Es la única tarea con test automatizado.

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/greeting.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/greeting.test.ts`

**Interfaces:**
- Consumes: `@app/config/node.json` de la Task 1.
- Produces: `buildGreeting(input: GreetingInput): string` e `interface GreetingInput { platform: string }`, exportados desde `packages/core/src/index.ts`. `@app/ui` los consume en la Task 3.

- [ ] **Step 1: Crear `packages/core/package.json`**

`main` apunta a TypeScript sin compilar a propósito: Metro y Vitest lo transpilan, y así la plantilla evita un paso de build.

```json
{
  "name": "@app/core",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@app/config": "workspace:*",
    "typescript": "~6.0.3",
    "vitest": "^4.1.11"
  }
}
```

- [ ] **Step 2: Crear `packages/core/tsconfig.json`**

```json
{
  "extends": "@app/config/node.json",
  "include": ["src"]
}
```

- [ ] **Step 3: Instalar las dependencias nuevas**

Run: `pnpm install`
Expected: enlaza `@app/config` e instala Vitest.

- [ ] **Step 4: Escribir el test que falla**

Crear `packages/core/src/greeting.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildGreeting } from './greeting'

describe('buildGreeting', () => {
  it('nombra la plataforma recibida', () => {
    expect(buildGreeting({ platform: 'web' })).toBe('Hola mundo desde web')
  })

  it('usa un texto neutro cuando la plataforma viene vacía', () => {
    expect(buildGreeting({ platform: '   ' })).toBe('Hola mundo desde una plataforma desconocida')
  })
})
```

- [ ] **Step 5: Ejecutar el test para verificar que falla**

Run: `pnpm --filter @app/core test`
Expected: FAIL — no se puede resolver `./greeting`.

- [ ] **Step 6: Implementar lo mínimo**

Crear `packages/core/src/greeting.ts`:

```ts
export interface GreetingInput {
  platform: string
}

export function buildGreeting({ platform }: GreetingInput): string {
  const name = platform.trim()
  return name.length > 0
    ? `Hola mundo desde ${name}`
    : 'Hola mundo desde una plataforma desconocida'
}
```

- [ ] **Step 7: Ejecutar el test para verificar que pasa**

Run: `pnpm --filter @app/core test`
Expected: PASS, 2 tests.

- [ ] **Step 8: Crear la API pública**

Crear `packages/core/src/index.ts`:

```ts
export { buildGreeting } from './greeting'
export type { GreetingInput } from './greeting'
```

- [ ] **Step 9: Verificar tipos y linter**

Run: `pnpm typecheck && pnpm lint`
Expected: ambos PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: añadir @app/core con la construcción del saludo"
```

---

### Task 3: `@app/ui` con la pantalla compartida

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/HomeScreen.tsx`
- Create: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `buildGreeting` de `@app/core` (Task 2).
- Produces: `HomeScreen(): JSX.Element`, exportado desde `packages/ui/src/index.ts`. `@app/mobile` lo monta en la Task 4.

- [ ] **Step 1: Crear `packages/ui/package.json`**

React y React Native van como `peerDependencies`: las versiones concretas las fija la app, no el paquete compartido.

```json
{
  "name": "@app/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@app/core": "workspace:*"
  },
  "peerDependencies": {
    "react": "*",
    "react-native": "*"
  },
  "devDependencies": {
    "@app/config": "workspace:*",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: Crear `packages/ui/tsconfig.json`**

```json
{
  "extends": "@app/config/react-native.json",
  "include": ["src"]
}
```

- [ ] **Step 3: Crear `packages/ui/src/HomeScreen.tsx`**

```tsx
import { buildGreeting } from '@app/core'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

export function HomeScreen() {
  const [count, setCount] = useState(0)
  const greeting = buildGreeting({ platform: Platform.OS })

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.counter}>Contador: {count}</Text>
      <Pressable style={styles.button} onPress={() => setCount((value) => value + 1)}>
        <Text style={styles.buttonLabel}>Incrementar</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#0b1120',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
  },
  counter: {
    fontSize: 16,
    color: '#94a3b8',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
})
```

- [ ] **Step 4: Crear `packages/ui/src/index.ts`**

```ts
export { HomeScreen } from './HomeScreen'
```

- [ ] **Step 5: Instalar**

Run: `pnpm install`
Expected: enlaza `@app/core` dentro de `@app/ui`.

- [ ] **Step 6: Verificar el linter**

Run: `pnpm lint`
Expected: PASS.

El `typecheck` de este paquete todavía fallará porque `react` y `react-native` no están instalados en ningún sitio: los trae la app en la Task 4. Es esperado; no instalarlos aquí.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: añadir @app/ui con la pantalla compartida"
```

---

### Task 4: `@app/mobile` con Expo Router

Al terminar esta tarea la pantalla se ve en web y el proyecto está listo para Android e iOS.

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`
- Create: `apps/mobile/CLAUDE.md`

**Interfaces:**
- Consumes: `HomeScreen` de `@app/ui` (Task 3).
- Produces: el servidor de desarrollo web en `http://localhost:8081` y el export estático en `apps/mobile/dist`. La Task 5 depende de ambos.

- [ ] **Step 1: Crear `apps/mobile/package.json`**

Sin dependencias todavía: las añade `expo install` en el paso 3, que elige las versiones compatibles con el SDK.

```json
{
  "name": "@app/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "dev:web": "expo start --web",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "build:web": "expo export --platform web",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@app/core": "workspace:*",
    "@app/ui": "workspace:*"
  },
  "devDependencies": {
    "@app/config": "workspace:*",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: Instalar el workspace**

Run: `pnpm install`
Expected: PASS.

- [ ] **Step 3: Añadir Expo y sus dependencias**

`expo install` resuelve las versiones correctas para el SDK; no fijarlas a mano.

```bash
pnpm --filter @app/mobile exec npx expo install expo expo-router expo-constants expo-linking expo-status-bar react react-native react-native-safe-area-context react-native-screens react-native-web react-dom
```

Expected: `apps/mobile/package.json` queda con `expo` en la versión 57.x.

- [ ] **Step 4: Crear `apps/mobile/app.json`**

`output: "single"` genera una SPA, que es lo que Tauri puede servir sin un servidor detrás.

```json
{
  "expo": {
    "name": "App Template",
    "slug": "app-template",
    "scheme": "apptemplate",
    "version": "0.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "ios": {
      "bundleIdentifier": "com.ejemplo.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.ejemplo.app"
    },
    "web": {
      "bundler": "metro",
      "output": "single"
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 5: Crear `apps/mobile/tsconfig.json`**

```json
{
  "extends": "@app/config/react-native.json",
  "compilerOptions": {
    "types": ["expo/types"]
  },
  "include": ["app", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 6: Crear `apps/mobile/app/_layout.tsx`**

Los archivos de ruta de Expo Router exigen `default export`; es la única excepción a la regla.

```tsx
import { Stack } from 'expo-router'

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 7: Crear `apps/mobile/app/index.tsx`**

```tsx
import { HomeScreen } from '@app/ui'

export default function Index() {
  return <HomeScreen />
}
```

- [ ] **Step 8: Crear `apps/mobile/CLAUDE.md`**

```markdown
# apps/mobile

App de Expo con Expo Router. Cubre Android, iOS y el export web que consume
`apps/desktop`.

## Reglas

- Es un cascarón delgado. Los archivos de `app/` solo montan componentes de
  `@app/ui`; no llevan lógica de presentación.
- `default export` únicamente en archivos de ruta, porque Expo Router lo exige.
- No escribir `metro.config.js` con `watchFolders` ni `extraNodeModules`: Expo
  configura Metro para el monorepo automáticamente desde el SDK 52.
- `web.output` debe seguir en `single`. Tauri sirve archivos estáticos y no
  puede ejecutar el modo `server`.

## Comandos

    pnpm --filter @app/mobile dev        # elegir plataforma
    pnpm --filter @app/mobile dev:web    # solo web, en el puerto 8081
    pnpm --filter @app/mobile android
    pnpm --filter @app/mobile ios
    pnpm --filter @app/mobile build:web  # genera dist/
```

- [ ] **Step 9: Verificar tipos y linter**

Run: `pnpm typecheck && pnpm lint`
Expected: ambos PASS, ahora también para `@app/ui`, que ya encuentra React Native.

- [ ] **Step 10: Comprobar la compatibilidad del proyecto**

Run: `pnpm --filter @app/mobile exec npx expo-doctor`
Expected: sin problemas. Si señala versiones desalineadas, corregir con `npx expo install --check`.

- [ ] **Step 11: Verificar el export web**

Run: `pnpm build:web`
Expected: se crea `apps/mobile/dist/index.html` junto a la carpeta `_expo/`.

- [ ] **Step 12: Verificar la web en el navegador**

Run: `pnpm dev:web`
Expected: en `http://localhost:8081` se ve el saludo con la palabra `web`, el contador en 0, y al pulsar el botón sube a 1. Detener el servidor al terminar.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: añadir @app/mobile con expo router montando la pantalla"
```

---

### Task 5: `@app/desktop` con Tauri

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/CLAUDE.md`
- Create: `apps/desktop/src-tauri/` (lo genera `tauri init`)
- Modify: `apps/desktop/src-tauri/tauri.conf.json` (ajustes tras la generación)

**Interfaces:**
- Consumes: el servidor de desarrollo de `@app/mobile` en `http://localhost:8081` y su export en `apps/mobile/dist` (Task 4).
- Produces: los scripts `dev` y `build` de `@app/desktop`, que los scripts raíz `dev:desktop` y `build:desktop` invocan.

- [ ] **Step 1: Crear `apps/desktop/package.json`**

```json
{
  "name": "@app/desktop",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "tauri": "tauri"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.11.4"
  }
}
```

- [ ] **Step 2: Instalar**

Run: `pnpm install`
Expected: instala la CLI de Tauri.

- [ ] **Step 3: Generar `src-tauri`**

Los flags evitan las preguntas interactivas. Este comando también genera los iconos, que son binarios y no pueden escribirse a mano.

```bash
pnpm --filter @app/desktop exec tauri init \
  --app-name "app-template" \
  --window-title "App Template" \
  --frontend-dist "../../mobile/dist" \
  --dev-url "http://localhost:8081" \
  --before-dev-command "pnpm --filter @app/mobile dev:web" \
  --before-build-command "pnpm --filter @app/mobile build:web" \
  --ci
```

Expected: se crea `apps/desktop/src-tauri/` con `Cargo.toml`, `tauri.conf.json`, `build.rs`, `src/` e `icons/`.

- [ ] **Step 4: Confirmar que no se generó interfaz propia**

Run: `ls apps/desktop`
Expected: solo `package.json`, `CLAUDE.md` y `src-tauri`. Si aparece `index.html`, `src/` o `dist/` fuera de `src-tauri`, borrarlos: la regla es que esta app no tiene interfaz.

- [ ] **Step 5: Ajustar `apps/desktop/src-tauri/tauri.conf.json`**

Leer el archivo generado y verificar que el bloque `build` y el identificador quedan así. Conservar el resto de claves tal como las generó la CLI.

```json
{
  "productName": "App Template",
  "identifier": "com.ejemplo.app",
  "build": {
    "beforeDevCommand": "pnpm --filter @app/mobile dev:web",
    "beforeBuildCommand": "pnpm --filter @app/mobile build:web",
    "devUrl": "http://localhost:8081",
    "frontendDist": "../../mobile/dist"
  }
}
```

- [ ] **Step 6: Crear `apps/desktop/CLAUDE.md`**

```markdown
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

## Comandos

    pnpm dev:desktop     # levanta la web y la envuelve
    pnpm build:desktop   # binario de escritorio
```

- [ ] **Step 7: Verificar el linter**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 8: Verificar la app de escritorio**

Run: `pnpm dev:desktop`
Expected: la primera compilación de Rust tarda varios minutos. Se abre una ventana titulada `App Template` con el saludo, y el contador sube al pulsar el botón. Cerrar la ventana al terminar.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: añadir @app/desktop envolviendo el export web con tauri"
```

---

### Task 6: Documentación y verificación final

**Files:**
- Create: `README.md`
- Modify: `CLAUDE.md` (sección de comandos y trampas conocidas)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: nada que consuma otra tarea.

- [ ] **Step 1: Crear `README.md`**

```markdown
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
| Prefijo `@app/` de los paquetes | `package.json` de cada paquete y sus importaciones |
| Nombre del repositorio (`app-template`) | `package.json` raíz, `apps/mobile/app.json`, `tauri.conf.json` |
| Bundle identifier `com.ejemplo.app` | `apps/mobile/app.json` (`ios.bundleIdentifier`, `android.package`) y `tauri.conf.json` (`identifier`) |
| Nombre visible `App Template` | `apps/mobile/app.json` (`name`) y `tauri.conf.json` (`productName`) |
| Esquema de enlace profundo `apptemplate` | `apps/mobile/app.json` (`scheme`) |
| Iconos | `apps/mobile/assets/`, y `apps/desktop/src-tauri/icons/` regenerados con `tauri icon` |

## Notas de la plantilla

- TypeScript está fijado en la versión que Expo declara esperar (hoy 6.0.3).
  Al subir de SDK, comprueba con `npx expo-doctor` si esa expectativa cambió.
  La 7.x es el compilador reescrito en Go; espera a que Expo lo declare.
- El `.npmrc` con `node-linker=hoisted` es obligatorio: Metro no resuelve los
  enlaces simbólicos de pnpm.
```

- [ ] **Step 2: Añadir `pnpm test` a la lista de comandos de `CLAUDE.md`**

En el bloque de comandos, insertar la línea siguiente justo después de la de `pnpm typecheck`:

```
pnpm test               # tests de packages/core (Vitest)
```

- [ ] **Step 3: Documentar las herramientas elegidas en `CLAUDE.md`**

En la tabla del stack, añadir estas dos filas al final:

```
| Lint y formato | Biome |
| Tests | Vitest |
```

- [ ] **Step 4: Corregir la trampa desactualizada de `CLAUDE.md`**

En «Trampas conocidas», reemplazar el punto sobre pnpm y Metro por este texto, porque la configuración manual de Metro ya no aplica:

```
- **pnpm + Metro:** el `.npmrc` con `node-linker=hoisted` es obligatorio, no
  opcional. En cambio, no añadas `watchFolders` ni `extraNodeModules` a mano:
  desde el SDK 52 Expo configura Metro para el monorepo automáticamente.
```

- [ ] **Step 5: Ejecutar la verificación completa**

Run: `pnpm install && pnpm lint && pnpm typecheck && pnpm test`
Expected: los cuatro PASS.

- [ ] **Step 6: Comprobar la compatibilidad**

Run: `pnpm --filter @app/mobile exec npx expo-doctor`
Expected: sin problemas.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: añadir README y alinear CLAUDE.md con la implementación"
```

- [ ] **Step 8: Verificación manual en móvil**

Estos dos comandos los ejecuta la persona usuaria; no forman parte de la automatización.

```bash
pnpm --filter @app/mobile ios
pnpm --filter @app/mobile android
```

Expected: la misma pantalla, con `ios` y `android` respectivamente en el saludo.

La PoC está completa cuando la pantalla se ve igual en las cuatro plataformas sin código duplicado.
