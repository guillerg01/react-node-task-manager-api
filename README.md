# Task manager API

NestJS and TypeScript REST API backed by PostgreSQL and TypeORM. Tasks have a title, assignee, status, and version. The assessment covers creation, listing, status filtering, status changes, validation, visible client failures, and automated tests.

- Frontend repository: https://github.com/guillerg01/react-node-task-manager-web
- Application: https://react-node-task-manager-web.onrender.com
- API: https://react-node-task-manager-api.onrender.com/api/tasks
- Swagger: https://react-node-task-manager-api.onrender.com/docs
- OpenAPI JSON: https://react-node-task-manager-api.onrender.com/docs-json
- [Architecture diagrams](ARCHITECTURE.md) · [Technical decisions and AI workflow](DECISIONS.md)

## Run everything with Docker

Clone the two repositories into sibling directories. Start Docker Desktop or Docker Engine with Compose, then run:

```sh
git clone https://github.com/guillerg01/react-node-task-manager-api.git
git clone https://github.com/guillerg01/react-node-task-manager-web.git
cd react-node-task-manager-api
docker compose up --build
```

Open http://localhost:5174, Swagger at http://localhost:3001/docs, and health at http://localhost:3001/health. Compose supplies local environment values, waits for database/API health, and runs migrations before API startup. No `.env` is required for this path. A named PostgreSQL volume preserves data across container restarts.

Docker makes the runtime and local dependencies reproducible; it does not replace migrations, tests, or environment configuration. The API image also runs on Render. The frontend is deployed separately as a static site.

## Environment configuration and native execution

Use the Node version in `.nvmrc`. Copy `.env.example` to `.env` and adjust its development-only credentials for a local PostgreSQL installation. Create the `tasks` and `tasks_test` databases beforehand. Compose does not publish PostgreSQL to the host, so native execution requires a separate reachable database.

```sh
npm ci
npm run build
node --env-file=.env scripts/migrate.mjs
node --env-file=.env dist/src/main.js
```

The API reads process environment variables; it does not automatically load `.env`. The explicit Node `--env-file` flag loads it for native commands. Docker and Render inject variables directly.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL connection string; also used by migrations and seed |
| `WEB_ORIGIN` | Comma-separated permitted frontend origins |
| `PORT` | HTTP port; defaults to 3000, supplied by Render in production |
| `NODE_ENV` | Runtime environment; test mode suppresses application logging |
| `TEST_DATABASE_URL` | Dedicated integration database; database name must end in `_test` |

`.env` files are ignored; only `.env.example` is tracked. Example credentials are local placeholders. Never put production connection strings in Git or frontend variables.

## Optional sample data

```sh
docker compose exec api npm run seed
docker compose exec db psql -U tasks -d tasks
```

The seed inserts one task per status. Stable identifiers and conflict handling avoid duplicates and preserve manually changed records on repeated runs. It is opt-in and does not run during production startup. For native execution, use `node --env-file=.env scripts/seed.mjs`.

## REST contract

| Method and path | Input | Result |
| --- | --- | --- |
| `GET /api/tasks` | Optional `status`, `page`, `pageSize` | `200`: `{ items, page, pageSize, total }` |
| `POST /api/tasks` | `{ title, assignee }` | `201`: task in `pending`, version 1 |
| `PATCH /api/tasks/:id/status` | `{ status, version }` | `200`: saved task with incremented version |
| `GET /health` | None | `200` when database connectivity succeeds; `503` otherwise |

Task responses contain `id` (UUID), `title`, `assignee`, `status`, and `version`. Supported statuses are `pending`, `in_progress`, and `done`. Required strings are trimmed; title and assignee limits are 120 and 100 characters. Pagination starts at 1, defaults to ten items, and accepts at most 100 items per page. PostgreSQL filters and paginates with deterministic `created_at DESC, id DESC` ordering. Items and count are read in a repeatable-read transaction for a consistent snapshot.

Swagger documents request/response schemas, examples, validation constraints, query parameters, and error responses. Documentation is available without running the frontend.

### Validation, failures, and concurrent updates

| Status | Meaning |
| --- | --- |
| `400` | Invalid body, required text, task status, UUID, version, or pagination bounds |
| `404` | Task does not exist |
| `409` | Supplied task version is stale |
| `500` | Unexpected server failure, with internal details excluded from the response |
| `503` | Health check cannot reach the database |

Validation runs on the server independently of the React form. Shared parsers implement reusable text and integer checks; the task feature supplies its limits and allowed statuses. DTOs describe the OpenAPI contract, while controller parsing enforces runtime input constraints.

A status update performs one conditional database update against both `id` and `version`, incrementing the version atomically. If two clients submit version 1, one succeeds and the other receives `409` rather than silently overwriting the first change. The frontend refreshes before a deliberate retry. The API does not implement rate limiting; the frontend can nevertheless explain a `429` returned by an upstream service.

## Feature architecture and design decisions

| Location | Responsibility |
| --- | --- |
| `src/tasks/tasks.controller.ts` | HTTP boundary, runtime validation, response codes, OpenAPI metadata |
| `src/tasks/tasks.service.ts` | Task application operations through an injected repository |
| `src/tasks/tasks.repository.ts` | TypeORM persistence, filtering, pagination, and conditional updates |
| `src/tasks/task.entity.ts` | Database mapping and constraints |
| `src/database` | TypeORM connection configuration |
| `src/common` | Reusable request parsers |
| `scripts` | Explicit migrations, seed, and isolated integration-test execution |

NestJS provides dependency injection and module boundaries; TypeORM supplies entity mapping and explicit migration tracking. `synchronize` is disabled to keep schema changes deliberate. PostgreSQL supplies persistence, transactions, and atomic concurrency checks.

The design applies single responsibility by separating HTTP, application operations, and persistence. Dependencies are injected so tests can substitute collaborators. The service remains intentionally small; there is no generic CRUD framework or extra domain hierarchy without a concrete need. SQL-specific behavior stays in the repository, and reusable validation stays outside the feature.

## Tests and quality checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
node --env-file=.env scripts/test-integration.mjs
```

The final command uses `TEST_DATABASE_URL`, validates its dedicated test-database name, applies migrations, and exercises the HTTP API with real PostgreSQL. Do not point it at application or production data.

| Level | Verified coverage |
| --- | --- |
| Backend unit | 27 tests covering parsers, controller outcomes, service delegation, and repository behavior |
| Backend integration | Eight tests covering HTTP validation, persistence, filters/pages, concurrent updates, OpenAPI, and controlled infrastructure failures |
| Frontend unit/integration | 30 tests with Testing Library and MSW; see the frontend README |
| Browser | Nine Playwright scenarios across desktop, tablet, and mobile against the Docker stack |

These counts describe the verified baseline, not a percentage of total correctness. Failure tests use controlled injections/interceptions instead of deliberately damaging production. Browser assertions cover complete user flows; direct visual inspection supplements them for layout and focus behavior.

## Branching, CI/CD, and deployment

1. Branch from `dev` using `feature/*` or `fix/*`.
2. Open a pull request into `dev` and review the changes and checks.
3. Promote `dev` into `main` through a pull request. `main` is production.

Both repositories configure GitHub Actions on pushes and pull requests. Checks install locked dependencies, run `npm audit --audit-level=moderate`, lint, typecheck, test, and build. The API job uses a dedicated PostgreSQL service for migration and integration tests. Browser jobs check out both repositories, start Compose, and run Playwright; they select the companion `dev` or `main` branch to match the integration target.

Render follows `main` with deployment configured after passing checks. The API Blueprint uses a Docker web service and private PostgreSQL connection in the same region. `DATABASE_URL` is supplied from the database, `WEB_ORIGIN` allows the deployed frontend, and `/health` is the deployment health check. The frontend separately publishes its static build with a public API origin.

Independent repositories mean releases are not atomic. Future breaking API changes would need a backward-compatible rollout and coordinated promotion. Branch protections and organizational approvals depend on repository settings; a documented workflow alone does not enforce them.

## Limitations and priorities with more time

This assessment is not a claim of production readiness for sensitive or multi-tenant data. Authentication, per-user ownership, request throttling, centralized monitoring, and a backup/restore procedure remain future work. The free Render API can cold-start, and its free PostgreSQL instance expires after 30 days. For larger datasets, I would evaluate cursor pagination and query plans before adding abstractions or infrastructure.

## AI usage and engineering workflow

I asked AI to compare libraries, outline feature boundaries and the HTTP contract, implement bounded modules, and propose tests and documentation. Accepted choices included NestJS, TypeORM/PostgreSQL, the shared Axios client, TanStack Query, React Hook Form, and tests at unit, HTTP, UI, and browser levels.

Luna subagents split API, interface, and test responsibilities using shared project rules and a common contract. The main agent integrated changes and performed the final review. Context was kept in `AGENTS.md`, the plan, API contract, and decision record rather than relying solely on chat. Independent work ran in parallel; contract changes and integration remained coordinated.

Generated output was checked rather than accepted wholesale. Validation, cache behavior during pending writes/filter changes, focus styling, card alignment, and concurrent-update handling were refined through inspection and tests. UI/UX Pro Max supported interface checks. Browser-control/MCP tools supported inspection and Render configuration; Git and GitHub CLI handled repositories and CI. Playwright provided repeatable browser checks when integrated-browser access became unavailable.

See [DECISIONS.md](DECISIONS.md) for rationale, accepted choices, corrections, tooling, and verification boundaries. Credentials and private conversation records are excluded from the public project. Overall implementation, planning, and verification effort before this documentation pass was approximately 90 minutes; subsequent work should be included in the final time reported to the reviewer.
