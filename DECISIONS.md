# Engineering decisions and working record

## Scope and delivery boundaries

The assessment is a TypeScript task manager with a React frontend, a NestJS API, PostgreSQL persistence, status filtering, validation, visible errors, and tests on both sides. Two public repositories separate frontend and backend delivery. Supporting work includes pagination, an optional seed, OpenAPI, Docker, CI/CD, and responsive browser verification.

The goal is a small, reviewable implementation. Production deployment demonstrates delivery, but does not establish production readiness for private data. Authentication, ownership, monitoring, throttling, and operational recovery remain explicit limitations.

## Decision register

| Decision | Reason and trade-off |
| --- | --- |
| React, Vite, and strict TypeScript | A small static frontend with explicit types and a focused build; no server-side rendering requirement |
| NestJS feature module | Established dependency injection and HTTP integration; more structure than a minimal Express handler, with clear ownership |
| PostgreSQL and TypeORM | Relational persistence, transactions, entity mapping, and tracked migrations; database behavior still needs integration tests |
| Explicit migrations; synchronization disabled | Reviewable schema changes and controlled startup; migrations must succeed before serving requests |
| Controller/service/repository | HTTP parsing, application operations, and SQL behavior remain separately reviewable; avoid inventing a generic CRUD framework |
| Shared request parsers | Reuse required-text/integer behavior while feature code supplies task-specific limits |
| Version-checked updates | Atomic compare-and-update prevents silent lost writes; clients must handle conflicts and refresh |
| Server-side filtering and pagination | Bounded responses and one authoritative result/count; offset pagination is adequate here but has large-dataset limits |
| Repeatable-read list transaction | Items and total share a consistent database snapshot; adds a transaction to each list read |
| Material UI and Tailwind | Established controls with utility-based layout; feature-specific labels and behavior remain local |
| React Hook Form | Local input/submission state and reusable field integration; it does not own remote cache state |
| Module-scoped Axios instance | One base URL, timeout, and response-error interceptor without an unnecessary singleton class |
| TanStack Query | Cache identity, cancellation, freshness, and reconciliation; avoid a second global store for server data |
| Feature-local task hook | Task endpoints, statuses, query keys, and updates are task behavior; generic folder placement would obscure ownership |
| Shared notification provider | Queue and accessible toast behavior are reusable; task components retain message ownership and inline fallback |
| Single frontend route | One screen needs no router; a later multi-page requirement can justify routing |
| Two repositories | Independent builds and ownership, at the cost of coordinating compatible releases |
| Docker Compose | Reproducible API/frontend/database startup with health dependencies and persistent local data |
| GitHub Actions and Render | Repeatable checks and deployment from main; provider configuration and branch protection remain operational concerns |

## Cache and concurrency contracts

The query key is `['tasks', statusFilter, page, pageSize]`, with 30-second freshness. Reads receive cancellation signals. Window-focus refetching is disabled. Creation invalidates task queries. A saved status response updates the visible row directly when the row still matches the view; changes in filter membership require a fresh page and total. Other cached views are invalidated. Pending writes reconcile against the currently committed filter/page.

Writes do not retry automatically. A timeout may happen after the server committed a write; silently retrying could create duplicates. The UI retains unsuccessful form drafts and allows deliberate retry. There is no idempotency-key implementation.

The database status update checks both UUID and version in a single statement, then increments version. Concurrent callers with the same version cannot both overwrite the task: one receives a conflict. This prevents lost writes; it is not real-time cross-browser synchronization. External changes require another read.

## AI requests, accepted output, and corrections

AI was asked to compare libraries, plan the contract and feature structure, implement bounded modules, suggest tests, and prepare documentation. Accepted proposals included the selected stack, shared HTTP transport, feature ownership, and layered verification. The candidate supplied requirements and technology constraints and steered scope, deployment, documentation, and review expectations.

Luna subagents handled bounded API, interface, and test tasks. They shared project rules and a common HTTP contract. Delegation accelerated independent work; the main agent remained responsible for integration, resolving mismatches, and personally reviewing the completed result. Subagent output was not treated as independent proof of correctness.

Code review and tests led to refinements in cache reconciliation while filters change during pending writes, redundant-read avoidance, validation, status concurrency, field focus styling, and card alignment. Those changes were accepted because observed behavior and checks supported them. Documentation distinguishes implemented behavior from future work rather than treating generated explanations as evidence.

## Context management and tool use

Project-specific `AGENTS.md` files define feature boundaries, language conventions, commit expectations, and verification requirements. The plan, HTTP contract, repository files, and this decision record retain implementation context. Agents coordinate file ownership and contract changes to reduce conflicting edits. Independent inspection and implementation can run in parallel; dependent edits and final integration remain sequential.

The public record summarizes decisions and engineering practice. It does not publish raw conversations, private candidate information, access tokens, or verification codes. Environment templates contain local examples only. Repositories ignore real environment files.

Official framework/library documentation informed technical choices. The installed UI/UX Pro Max skill supported review of labels, focus, contrast, touch targets, and responsive layout. Browser-control/MCP tooling supported application inspection and Render setup. Git and GitHub CLI supported repository operations and CI inspection. Shell tools and Docker handled local builds, migrations, and tests.

Integrated-browser access became unavailable during later verification. Playwright then exercised the running application and generated screenshots for direct inspection. This limitation is disclosed rather than describing those runs as integrated-browser sessions.

## Verification strategy and evidence

| Layer | What it establishes | What it does not establish |
| --- | --- | --- |
| Backend unit tests | Parsers, controller outcomes, service delegation, and persistence operation behavior | Actual database/HTTP integration |
| Backend integration tests | Real PostgreSQL persistence, HTTP validation, pagination, conflict handling, and OpenAPI behavior | Production load or operational resilience |
| Frontend unit/UI integration tests | Error normalization, filter storage, forms, query behavior, and rendered flows with MSW | A real backend connection in those tests |
| Playwright on Compose | Frontend/API/database interaction, state changes, filters, pagination, notifications, and recovery in three viewports | Complete accessibility, security, or performance certification |
| Visual inspection | Card alignment, focus presentation, responsive screenshots, and overflow checks | Exhaustive device or assistive-technology coverage |
| Production smoke check | Deployed create/status toasts, manual close, automatic dismissal, and API response behavior | A substitute for isolated repeatable tests |

The verified baseline is 27 backend unit tests, eight PostgreSQL integration tests, 30 frontend tests, and nine browser scenarios. Controlled error injection avoids interrupting production infrastructure. Production smoke-check records were removed after verification. A later explicitly authorized production clear returned 204 and a subsequent read confirmed zero tasks.

## Security and dependencies

Lockfiles preserve reviewed dependency resolution. A `minimatch` 11.0.8 override addresses a transitive tooling advisory. Axios is pinned at 1.21.1 in the frontend. Audits reported zero vulnerabilities at the verified baseline; this is a point-in-time result, not a permanent security guarantee. CI audits dependencies alongside tests and build checks.

The API validates independently of the form. Unexpected server errors do not expose internal details. CORS uses configured frontend origins. Neither CORS nor unpublished endpoints replace authentication. No claim of authorization or API rate limiting is made.

## Development and release flow

Work starts in `feature/*` or `fix/*` from `dev`, integrates through a pull request to `dev`, and is promoted through a pull request to `main`. Commits include a descriptive title and body covering behavior and verification. `main` represents production.

CI is configured on pushes and pull requests in both repositories. It audits, lints, typechecks, tests, and builds; PostgreSQL integration and full-stack browser jobs cover the shared contract. Companion checkout selects `dev` for integration and `main` for production. Render is configured to deploy main after checks pass. Independent repositories require coordinated, backward-compatible contract changes because deployment is not atomic.

## Next priorities

Before handling private user data, add authentication, task ownership, request throttling, operational monitoring, and backup/restore verification. Add a full screen-reader audit, stronger repository release protection, and idempotent create semantics where requirements justify them. Evaluate cursor pagination and database query plans under realistic load. Replace the expiring free database for any long-lived service.
