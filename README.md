# API del gestor de tareas

API REST con NestJS, TypeScript, PostgreSQL y TypeORM. Cada tarea tiene título, responsable, estado y versión. La prueba incluye creación, listado, filtro por estado, cambios de estado, validación, errores visibles y pruebas automatizadas.

- Repositorio frontend: https://github.com/guillerg01/react-node-task-manager-web
- Aplicación: https://react-node-task-manager-web.onrender.com
- API: https://react-node-task-manager-api.onrender.com/api/tasks
- Swagger: https://react-node-task-manager-api.onrender.com/docs
- OpenAPI JSON: https://react-node-task-manager-api.onrender.com/docs-json
- [Diagramas de arquitectura](ARCHITECTURE.md) · [Decisiones y uso de IA](DECISIONS.md)

## Ejecutar todo con Docker

Clona ambos repositorios como carpetas hermanas. Con Docker Desktop o Docker Engine y Compose iniciados:

```sh
git clone https://github.com/guillerg01/react-node-task-manager-api.git
git clone https://github.com/guillerg01/react-node-task-manager-web.git
cd react-node-task-manager-api
docker compose up --build
```

Abre http://localhost:5174, Swagger en http://localhost:3001/docs y salud en http://localhost:3001/health. Compose proporciona configuración local, espera la salud de los servicios y aplica migraciones antes de iniciar la API. Este camino no necesita `.env`. Un volumen de PostgreSQL conserva los datos entre reinicios.

Docker reproduce el entorno y sus dependencias; no sustituye migraciones, pruebas ni configuración. La imagen de la API también se ejecuta en Render. El frontend se publica separadamente como sitio estático.

## Variables de entorno y ejecución nativa

Usa la versión de Node indicada en `.nvmrc`. Copia `.env.example` a `.env` y adapta sus credenciales locales a una instalación de PostgreSQL. Crea previamente las bases `tasks` y `tasks_test`. Compose no publica PostgreSQL al host: la ejecución nativa necesita una base accesible por separado.

```sh
npm ci
npm run build
node --env-file=.env scripts/migrate.mjs
node --env-file=.env dist/src/main.js
```

La API lee variables del proceso y no carga `.env` automáticamente. El argumento explícito `--env-file` de Node carga ese archivo en la ejecución nativa. Docker y Render inyectan las variables directamente.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL obligatoria; también la usan migraciones y seed |
| `WEB_ORIGIN` | Orígenes permitidos del frontend separados por comas |
| `PORT` | Puerto HTTP; 3000 por defecto y proporcionado por Render en producción |
| `NODE_ENV` | Entorno de ejecución; el modo test desactiva el registro de la aplicación |
| `TEST_DATABASE_URL` | Base exclusiva de integración cuyo nombre debe terminar en `_test` |
| `TASK_DELETE_PASSWORD` | Credencial del backend para operaciones de mantenimiento; vacía o ausente rechaza el acceso protegido |

Los archivos `.env` están excluidos de Git; únicamente se publica `.env.example`. Sus credenciales son ejemplos locales. Nunca se incluyen conexiones de producción en Git ni variables del frontend.

## Datos de ejemplo opcionales

```sh
docker compose exec api npm run seed
docker compose exec db psql -U tasks -d tasks
```

El seed inserta una tarea por estado. Sus identificadores estables y manejo de conflictos evitan duplicados y conservan modificaciones manuales al repetirlo. Es opcional y no se ejecuta al iniciar producción. En ejecución nativa: `node --env-file=.env scripts/seed.mjs`.

## Contrato REST

| Método y ruta | Entrada | Resultado |
| --- | --- | --- |
| `GET /api/tasks` | `status`, `page` y `pageSize` opcionales | `200`: `{ items, page, pageSize, total }` |
| `POST /api/tasks` | `{ title, assignee }` | `201`: tarea en `pending`, versión 1 |
| `PATCH /api/tasks/:id/status` | `{ status, version }` | `200`: tarea guardada con versión incrementada |
| `GET /health` | Ninguna | `200` con conexión disponible; `503` en caso contrario |

Las tareas contienen `id` UUID, `title`, `assignee`, `status` y `version`. Los estados son `pending`, `in_progress` y `done`. Los textos obligatorios se recortan; título y responsable admiten 120 y 100 caracteres. La página empieza en 1, el tamaño predeterminado es 10 y el máximo es 100. PostgreSQL filtra y pagina con orden determinista `created_at DESC, id DESC`. Elementos y total se leen en una transacción de lectura repetible para obtener una vista consistente.

Swagger describe esquemas, ejemplos, restricciones, parámetros y respuestas de error. Se puede explorar sin iniciar el frontend.

### Validación, errores y concurrencia

| Código | Significado |
| --- | --- |
| `400` | Cuerpo, texto obligatorio, estado, UUID, versión o paginación inválidos |
| `404` | La tarea no existe |
| `409` | La versión enviada está desactualizada |
| `500` | Fallo inesperado sin exponer detalles internos |
| `503` | La comprobación de salud no puede acceder a PostgreSQL |

El servidor valida independientemente del formulario. Los validadores comunes reutilizan comprobaciones de texto y enteros; la feature aporta límites y estados permitidos. Los DTO describen OpenAPI y el controlador aplica la validación en ejecución.

El cambio de estado ejecuta una actualización condicional por `id` y `version`, incrementando la versión atómicamente. Si dos clientes envían la versión 1, uno guarda y el otro recibe `409`, evitando una sobrescritura silenciosa. El frontend actualiza los datos antes de un reintento deliberado. La API no implementa limitación de peticiones; el frontend sí explica un `429` procedente de un servicio intermedio.

## Arquitectura por features

| Ubicación | Responsabilidad |
| --- | --- |
| `src/tasks/tasks.controller.ts` | Entrada HTTP, validación, códigos y metadatos OpenAPI |
| `src/tasks/tasks.service.ts` | Operaciones de aplicación con repositorio inyectado |
| `src/tasks/tasks.repository.ts` | Persistencia TypeORM, filtros, paginación y actualizaciones condicionales |
| `src/tasks/task.entity.ts` | Mapeo de columnas y restricciones |
| `src/database` | Configuración de conexión TypeORM |
| `src/common` | Validadores reutilizables de peticiones |
| `scripts` | Migraciones explícitas, seed y ejecución aislada de integración |

NestJS aporta inyección de dependencias y límites de módulos. TypeORM gestiona entidades y migraciones explícitas; `synchronize` permanece desactivado. PostgreSQL aporta persistencia, transacciones y comprobación atómica de versiones.

La responsabilidad única separa HTTP, operaciones y persistencia. La inyección permite sustituir colaboradores en pruebas. El servicio es pequeño deliberadamente: no se añade un framework CRUD genérico ni una jerarquía de dominio sin necesidad concreta. Los detalles SQL permanecen en el repositorio y la validación reutilizable fuera de la feature.

## Pruebas y comprobaciones

```sh
npm run lint
npm run typecheck
npm test
npm run build
node --env-file=.env scripts/test-integration.mjs
```

El último comando utiliza `TEST_DATABASE_URL`, verifica el nombre reservado para pruebas, aplica migraciones y comprueba HTTP con PostgreSQL real. No debe apuntarse a datos de aplicación ni producción.

| Nivel | Cobertura verificada |
| --- | --- |
| Unitario backend | 35 pruebas de validadores, controlador, delegación, repositorio y autorización de mantenimiento |
| Integración backend | Ocho pruebas de validación HTTP, persistencia, filtros, páginas, concurrencia, OpenAPI y fallos controlados |
| Unitario e integración frontend | 30 pruebas con Testing Library y MSW |
| Navegador | Nueve recorridos Playwright sobre Docker en escritorio, tablet y móvil |

Los números describen la base verificada, no un porcentaje de corrección total. Los fallos se provocan con inyecciones o interceptaciones controladas, sin interrumpir producción. Las aserciones de navegador comprueban recorridos completos y la inspección visual revisa distribución y foco.

## Ramas, CI/CD y despliegue

1. Crea `feature/*` o `fix/*` desde `dev`.
2. Abre un pull request a `dev` y revisa cambios y comprobaciones.
3. Promueve `dev` a `main` mediante otro pull request. `main` es producción.

Ambos repositorios configuran GitHub Actions para pushes y pull requests. CI instala dependencias bloqueadas, ejecuta `npm audit --audit-level=moderate`, lint, tipos, pruebas y compilación. La API usa un servicio PostgreSQL dedicado para migraciones e integración. Los trabajos de navegador obtienen ambos repositorios, levantan Compose y ejecutan Playwright. La rama compañera es `dev` o `main` según el destino de integración.

Render sigue `main` y se configura para publicar después de comprobaciones correctas. El Blueprint crea una API Docker y PostgreSQL privado en la misma región. `DATABASE_URL` proviene de la base, `WEB_ORIGIN` permite el frontend y `/health` comprueba el despliegue. El frontend publica su compilación estática con el origen público de la API.

Los repositorios independientes no ofrecen publicación atómica. Un cambio incompatible requiere coordinación y compatibilidad durante la transición. Las protecciones de ramas y aprobaciones dependen de la configuración del repositorio; documentar el flujo no lo impone por sí mismo.

## Límites y próximos pasos

La entrega no equivale a preparación para datos sensibles o múltiples usuarios privados. Quedan autenticación, propiedad por usuario, limitación de peticiones, monitorización y recuperación desde copias. La API gratuita puede tardar en despertar y PostgreSQL gratuito caduca después de 30 días. Para más volumen evaluaría paginación por cursor y planes de consulta antes de añadir infraestructura.

## Uso de IA y forma de trabajo

Se pidió comparar bibliotecas, definir arquitectura y contrato HTTP, implementar módulos delimitados y proponer pruebas y documentación. Se aceptaron NestJS, TypeORM/PostgreSQL, Axios compartido, TanStack Query, React Hook Form y pruebas por niveles.

Subagentes Luna repartieron API, interfaz y pruebas con reglas y contrato compartidos. El agente principal integró y revisó el resultado final. El contexto se conservó en `AGENTS.md`, el plan, el contrato y el registro de decisiones; las tareas independientes pudieron ejecutarse en paralelo y los cambios de contrato se coordinaron.

Las propuestas se revisaron mediante código y pruebas. Se ajustaron validación, caché durante escrituras y cambios de filtro, foco, alineación y concurrencia. UI/UX Pro Max apoyó la revisión visual. Herramientas de navegador y MCP apoyaron inspección y configuración de Render; Git y GitHub CLI gestionaron repositorios y CI. Playwright permitió repetir las pruebas cuando el navegador integrado dejó de estar disponible.

[DECISIONS.md](DECISIONS.md) detalla motivos, decisiones aceptadas, correcciones, herramientas y límites. No se publican credenciales ni conversaciones privadas. El esfuerzo de implementación, planificación y verificación anterior a esta ampliación documental fue aproximadamente 90 minutos; el tiempo posterior debe sumarse al comunicar la dedicación final.
