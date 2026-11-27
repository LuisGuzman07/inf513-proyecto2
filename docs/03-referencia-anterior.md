# Referencia del semestre anterior — alcance de inspección

Fuente solicitada: C:\UAGRM\SEPTIMO SEMESTRE-20260811T031905Z-1-001\SEPTIMO SEMESTRE\TECNOLOGIA WEB\Proyecto #2\codigo-tucafe-web\tucafe-web.

## Observado

El listado inicial de la raíz mostró app/, bootstrap/, config/, database/, resources/, routes/, storage/, tests/, public/, vendor/, node_modules/, artisan, composer.json, composer.lock, package.json, package-lock.json, vite.config.js, README.md, CLAUDE.md y docs/. Esa disposición es compatible con una aplicación Laravel integrada, pero un listado no demuestra versiones, renderizado, endpoints ni funcionamiento.

## Bloqueo

La inspección detallada delegada en modo solo lectura fue rechazada por la herramienta: “The user has specified a rule which prevents you from using this specific tool call”. No se eludió ese rechazo. No se leyeron manifiestos, instrucciones internas, rutas, controladores ni servicios del ejemplo. Tampoco se leyó .env ni se modificó la fuente.

Por tanto quedan NO VERIFICADOS: stack/versiones concretas; uso de React o Blade/Inertia; integración frontend/backend; autenticación; SMTP/POP3; OCR; IA; cumplimiento de condiciones académicas. Este archivo no presenta una auditoría terminada ni atribuye al ejemplo soluciones no observadas.

## Recomendable para Grupo 18B (no observado en TuCafé)

Separar SPA y API JSON; contratos de datos y errores explícitos; secretos e integraciones en backend. Documentar una matriz requisito → ruta/servicio → interfaz → prueba/demostración → limitación. Verificar SMTP y recepción POP3 por separado, OCR con documentos escaneados e IA contra un proveedor real, cuando esos RF se seleccionen. Autenticación y permisos requieren decisiones propias.

Para completar el análisis hace falta habilitar la lectura de esta fuente en los permisos de la sesión. Aun después, las funcionalidades y reglas de negocio del ejemplo no deben trasladarse como requisitos.
