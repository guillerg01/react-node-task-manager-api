# API del gestor de tareas

Backend con NestJS, TypeScript, TypeORM y PostgreSQL. Permite crear tareas, listarlas por estado y página, y cambiar su estado.

[Frontend](https://github.com/guillerg01/react-node-task-manager-web) · [Demo](https://react-node-task-manager-web.onrender.com) · [Swagger](https://react-node-task-manager-api.onrender.com/docs) · [OpenAPI JSON](https://react-node-task-manager-api.onrender.com/docs-json)

## Ejecutar todo con Docker

Clona ambos repositorios como carpetas hermanas. Docker Desktop o Docker Engine con Compose debe estar iniciado.

```sh
git clone https://github.com/guillerg01/react-node-task-manager-api.git
git clone https://github.com/guillerg01/react-node-task-manager-web.git
cd react-node-task-manager-api
docker compose up --build
```

Abre [la aplicación](http://localhost:5174), [Swagger](http://localhost:3001/docs) o [el estado de la API](http://localhost:3001/health). El volumen de PostgreSQL conserva las tareas al detener y volver a iniciar los contenedores. La imagen de la API ejecuta las migraciones antes de arrancar.

## Datos de ejemplo opcionales

```sh
docker compose exec api npm run seed
docker compose exec db psql -U tasks -d tasks
```

El seed inserta tres tareas, una por estado. Repetirlo conserva los cambios manuales y evita duplicados. Se ejecuta bajo demanda.

## Contrato de la API

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| `GET /api/tasks` | `status`, `page` y `pageSize` opcionales | `200` con `items`, `page`, `pageSize` y `total` |
| `POST /api/tasks` | `title` y `assignee` | `201` con la tarea en `pending` |
| `PATCH /api/tasks/:id/status` | `status` y `version` | `200` con la tarea actualizada |

Cada tarea contiene `id` UUID, `title`, `assignee`, `status` y `version`. Los estados son `pending`, `in_progress` y `done`. Título y responsable son obligatorios, se recortan y admiten hasta 120 y 100 caracteres. La página inicial es 1, el tamaño predeterminado es 10 y el máximo es 100. PostgreSQL filtra, ordena y pagina.

La API devuelve `400` para entradas inválidas, `404` para tareas inexistentes, `409` para versiones desactualizadas y `500` para errores inesperados. El cliente envía la versión que leyó para evitar sobrescribir silenciosamente una actualización concurrente.

## Pruebas

Con Node.js 26.13.1, ejecuta `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. Para `npm run test:integration`, configura `TEST_DATABASE_URL` con una base dedicada cuyo nombre termine en `_test`.

GitHub Actions levanta PostgreSQL para integración y ejecuta Playwright contra los tres servicios de Docker. El frontend documenta cómo ejecutar las pruebas de navegador localmente.

## Desarrollo y despliegue

- `dev` es la rama de integración. Crea ramas `feature/*` o `fix/*` a partir de ella.
- Abre un pull request a `dev`, revisa los cambios y espera las comprobaciones.
- Promueve `dev` a `main` mediante un pull request. `main` es producción.
- CI corre en cada push y pull request. Render despliega `main` después de que las comprobaciones pasen.

El Blueprint de Render crea la API Docker y PostgreSQL en la misma región. `DATABASE_URL` usa la conexión privada y `WEB_ORIGIN` define el origen permitido del frontend. La API escucha en `PORT`. El PostgreSQL gratuito de Render caduca a los 30 días y la API gratuita puede tardar en despertar después de un periodo de inactividad.

## Decisiones y próximos pasos

NestJS separa controlador, servicio y repositorio de la feature. TypeORM gestiona la entidad y las migraciones con `synchronize` desactivado. La paginación y el total se leen dentro de una transacción consistente. Las actualizaciones comprueban la versión de la tarea.

Con más tiempo añadiría autenticación y propiedad por usuario, paginación por cursor para listas grandes y monitorización de la demo. Consulta [la arquitectura](./ARCHITECTURE.md) y [las decisiones](./DECISIONS.md).

## Uso de IA

Se pidió comparar herramientas, proponer la estructura, implementar partes y redactar pruebas. Se aceptaron la organización por features, el cliente HTTP compartido y las pruebas por niveles. Durante el desarrollo se ajustaron la gestión de caché, la validación, la concurrencia y la presentación mediante inspección del código y pruebas. El documento de decisiones recoge el uso de subagentes, skills, herramientas y contexto.
