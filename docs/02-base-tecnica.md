# Decisiones y análisis de la plantilla

Actualización Windows 05/10/2026: Composer ya resolvió Laravel 12.69.3 en backend/composer.lock y el backend fue instalado/probado. Las menciones posteriores a ausencia de PHP/lock describen la preparación anterior y se conservan como historia. Estado vigente en [04-verificacion.md](04-verificacion.md); fuentes Notion y alternativas conservadas en [05-fuentes-notion.md](05-fuentes-notion.md).

## Fuentes e inspección

Raíz existente con Git y frontend/, backend/, docs/ vacíos. No había instrucciones en la raíz ni en los ancestros comprobados. Se leyeron AGENTS.md y CLAUDE.md de la plantilla; se mantienen como documentación heredada. Las instrucciones de publicación de la plantilla no autorizan publicación de este proyecto.

Fuente de solo lectura: C:\Programacion\templates\react\antd-multipurpose-dashboard, accesible en WSL bajo /mnt/c/Programacion/templates/react/antd-multipurpose-dashboard. Copiada a frontend/ con rsync, excluyendo .git, node_modules, entornos, dist, coverage y storybook-static. Se omitieron .github y .husky para no activar publicación upstream ni cambiar hooks de Git raíz. Licencia y README originales conservados. No se instaló nada en la fuente.

## Stack observado

| Componente | Manifest | Lockfile |
| --- | --- | --- |
| Plantilla | antd-multi-dashboard 2.0.2 | pnpm-lock.yaml, formato 9 |
| Gestor | pnpm@9.15.4 | sin regenerar |
| React / React DOM | ^18.2.0 | 18.3.1 |
| TypeScript | ^5.0.2 | 5.9.3 |
| Vite | ^5.4.21 | 5.4.21 |
| React Router DOM | ^6.30.3 | 6.30.3 |
| Ant Design | ^6.6.2 | 6.6.2 |
| TanStack React Query | ^5.90.10 | 5.90.10 |
| Axios | ^1.18.0 | 1.18.0 |

La aplicación usa SWC, Redux Toolkit/persist, i18next, Storybook 8.6 y Vitest 2.1. No se actualizaron dependencias. Versiones de ejecución y resultados se registran en 04-verificacion.md.

Comandos originales: pnpm dev; pnpm build (tsc && vite build); pnpm lint (cero warnings); pnpm test:run; pnpm preview; pnpm storybook; pnpm build-storybook. Se invocan con corepack pnpm para respetar packageManager y no usar el pnpm de Windows presente en PATH.

## Organización, rutas y datos

- src/main.tsx: proveedores de TanStack Query, Redux/persist y contexto de autenticación; GA solo cuando existe VITE_GA_MEASUREMENT_ID.
- src/App.tsx: ConfigProvider de Ant Design y RouterProvider.
- src/routes/routes.tsx: createBrowserRouter, PageWrapper y ProtectedRoute. Rutas originales: /, /dashboards (default, projects, ecommerce, marketing, social, bidding, learning, logistics, analytics, healthcare, finance), /corporate, /user-profile, /auth, /errors, /about, /gallery, /releases, /sitemap.
- src/pages y src/layouts: páginas y layouts demo. src/components: elementos compartidos y dashboards. src/lib/queries: consultas; src/types: tipos. public/mocks: JSON simulados.
- src/services/api/apiClient.ts: Axios con timeout de 30 segundos, mapeador hacia archivos mock y eliminación de Authorization/baseURL. No respeta una base URL real para endpoints no mapeados. Su rama 401 intenta refrescar un token demo: no acredita autenticación real.
- src/services/auth/authService.ts: usuario/token ficticios; acepta credenciales arbitrarias. AuthContext y tokenStorage almacenan estado demo local; ProtectedRoute no representa permisos institucionales.

Hallazgo de documentación desactualizada: AGENTS.md menciona src/config/api.config.ts, redux/data-mode y authSlice; esos archivos no existen en esta descarga. El comportamiento observado es mock-only por el interceptor actual, no por esos archivos ausentes. Prevalece el código inspeccionado.

## Arquitectura elegida

Un solo Git raíz. SPA React en frontend/ y API JSON Laravel en backend/. PostgreSQL. Sin Inertia ni starter kit visual. Se conserva TanStack Query y Axios; el cliente real de salud queda separado del cliente mock para no heredar redirecciones, tokens ni falsos éxitos. Las demos permanecen y se identifican con un aviso visible; no introducir datos privados reales en ellas.

Laravel: esqueleto oficial laravel/laravel v12.0.0 descargado sin Git; composer.json requiere PHP ^8.2 y framework ^12.0. Elección provisional para ampliar compatibilidad: no se pudo confirmar contra PHP local porque no se encontró un runtime disponible. No hay versión resuelta del framework ni composer.lock hasta ejecutar Composer. README oficial conservado; el tarball no incluye LICENSE separado, por lo que se agregó backend/LICENSE con el texto oficial de laravel/framework 12.x (https://github.com/laravel/framework/blob/12.x/LICENSE.md). Se retiraron únicamente los archivos visuales/Vite del esqueleto nuevo, no archivos del usuario. No se instaló Sanctum: la autenticación real y permisos quedan para una entrega definida.

## Comprobación técnica

Contrato GET /api/health: 200 con status=ok, api=ok, database=ok después de SELECT 1 sobre la conexión pgsql; 503 con status=degraded, api=ok, database=unavailable si falla. No migra ni modifica datos, no depende de tablas. /up es solo la salud del framework, no sustituye esta consulta.

Frontend en /estado-tecnico: TanStack Query, timeout, cancelación y reintento manual; distingue error de comunicación/respuesta inválida de API disponible con PostgreSQL no disponible. Nunca muestra el cuerpo de errores internos. No usa servicios mock ni credenciales demo.

Desarrollo: proxy Vite /api → http://127.0.0.1:8000 por defecto, puerto 5173 estricto. VITE_API_BASE_URL puede apuntar directamente a la API sin /api; en ese caso CORS debe admitir el origen configurado en FRONTEND_URL. Variables VITE_ son públicas: nunca contener secretos. CORS mínimo GET/OPTIONS, sin cookies ni wildcard. No constituye una política de autenticación futura.

APP_DEBUG=false en los entornos de ejemplo; los errores API se normalizan a JSON genérico incluso con debug activado. Contratos y CORS tienen pruebas preparadas; mocks de pruebas no prueban una conexión real. Cache/sesión en archivo y cola sync para no exigir tablas antes del chequeo. Correo log explícitamente pendiente, no SMTP/POP3 simulado.
