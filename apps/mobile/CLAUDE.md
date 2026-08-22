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
