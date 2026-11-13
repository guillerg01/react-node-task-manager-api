# Decisiones del proyecto

## Alcance

La prueba consiste en un gestor de tareas con React y Node.js, ambos en TypeScript, persistencia SQL, filtro por estado, validación, errores visibles y pruebas de backend y frontend. La implementación incluye paginación, seed opcional, Swagger, Docker y CI/CD.

## Arquitectura y herramientas

| Decisión | Motivo |
| --- | --- |
| NestJS por features | Separar HTTP, comportamiento y persistencia en módulos revisables. |
| TypeORM y PostgreSQL | Representar tareas con una entidad, gestionar migraciones y persistir entre reinicios. |
| Migraciones con `synchronize: false` | Controlar explícitamente los cambios de esquema y conservar los datos. |
| Versión por tarea | Detectar cambios concurrentes y devolver `409` ante una versión antigua. |
| React y Vite | Construir una interfaz pequeña con compilación rápida. |
| Material UI y Tailwind | Reutilizar controles establecidos y definir la distribución responsive. |
| React Hook Form | Gestionar campos, mensajes, foco y validación del formulario. |
| Axios compartido | Centralizar origen, timeout y clasificación de errores de transporte. |
| TanStack Query | Cachear por filtro y página, cancelar lecturas e invalidar resultados tras escrituras. |
| Dos repositorios | Versionar y comprobar frontend y backend de forma independiente. |
| Docker Compose | Iniciar ambos repositorios y la base de datos con un comando. |
| Render y GitHub Actions | Ejecutar comprobaciones y desplegar la rama de producción cuando pasan. |

## Uso de IA y subagentes

Se pidió investigar opciones, definir el contrato HTTP, implementar módulos y proponer pruebas. Se aceptó una estructura por features con límites pequeños entre componentes, estado, transporte y persistencia.

Los subagentes Luna recibieron responsabilidades delimitadas para API, interfaz y pruebas de frontend. Compartieron el mismo contrato y leyeron las reglas del proyecto. La integración, la revisión final y la verificación del despliegue corresponden al agente principal.

El contexto se conserva en el plan, los archivos `AGENTS.md`, el contrato HTTP y esta documentación. Los mensajes entre subagentes coordinan nombres, rutas y archivos para reducir cambios incompatibles. Las tareas independientes se ejecutaron en paralelo.

## Skills, MCP y verificación

Se consultaron las fuentes oficiales de NestJS, TypeORM, Axios, TanStack Query, Playwright y Render. La skill UI/UX Pro Max se usó para revisar foco, etiquetas, contraste, objetivos táctiles y distribución responsive. La skill de instalación permitió incorporar esa guía al entorno.

Las herramientas de control de navegador se usaron para inspeccionar la aplicación y configurar los Blueprints de Render. Playwright automatiza el flujo real sobre Docker en escritorio, tablet y móvil. Los repositorios y CI se gestionan con Git y GitHub CLI. Las credenciales quedan fuera de los archivos y commits.

Las pruebas unitarias aíslan validación, almacenamiento y lógica. Las pruebas HTTP usan PostgreSQL real y una base dedicada. Testing Library y MSW comprueban los flujos de la interfaz. Las pruebas de navegador incluyen errores, reintento, estados, paginación y recarga. La inspección visual verifica además la alineación y los indicadores de foco.

## Ajustes realizados durante el desarrollo

Se corrigieron el uso de datos asociados a filtros antiguos durante escrituras pendientes, el foco duplicado en campos y la alineación de las tarjetas. Se verificaron las claves de caché y el uso de la respuesta del servidor para evitar lecturas redundantes. Las actualizaciones concurrentes se cubren mediante una versión comprobada en PostgreSQL.

Los commits describen el comportamiento entregado y las comprobaciones. La rama `dev` integra el trabajo y `main` representa producción.

## Dependencias

Se fijó `minimatch` 11.0.8 mediante un override para resolver la alerta transitiva de las herramientas de lint. El lockfile conserva la resolución comprobada. Axios usa la versión 1.21.1. `npm audit` se ejecuta sobre las dependencias instaladas y las comprobaciones verifican la compatibilidad.

## Verificación de la entrega

En el entorno local pasaron 27 pruebas unitarias y 8 de integración de backend, junto con las comprobaciones de tipos, lint y compilación. La integración incluye PostgreSQL, cambios concurrentes, códigos HTTP y el contrato OpenAPI. Las pruebas de frontend cubren almacenamiento, errores de transporte, caché y flujos de tareas.

Playwright recorre el sistema en 375, 768 y 1440 píxeles. Las capturas de la interfaz están enlazadas desde el README del frontend. Se verificaron la alineación de tarjetas, el foco de los campos y la ausencia de desbordamiento horizontal.
