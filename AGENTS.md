# Reglas del proyecto

- Lee este archivo antes de trabajar en cada módulo y revisa los cambios contra estas reglas.
- Organiza NestJS por features. La feature de tareas vive en `src/tasks` y la conexión en `src/database`. Separa controlador, servicio y repositorio.
- Usa TypeORM con entidades y migraciones explícitas. Mantén `synchronize` desactivado y aplica filtros y paginación en PostgreSQL.
- Reutiliza los validadores comunes desde `src/common`. Cada feature define sus límites y reglas.
- Usa TypeScript estricto, Node LTS y versiones estables compatibles. Versiona el lockfile.
- Escribe código, pruebas y commits en inglés. La interfaz, los README, las decisiones y estas reglas se escriben en español.
- Los commits deben tener título descriptivo y cuerpo con comportamiento, decisiones y verificación.
- Mantén el código sin comentarios, emojis ni firmas generadas.
- Ejecuta lint, tipos, pruebas unitarias y de integración y build. Comprueba los flujos y controles en navegador antes de entregar.
- Trabaja mediante ramas desde `dev`. Promueve a `main` mediante pull request y comprobaciones. `main` es producción.
- Mantén secretos y artefactos fuera de Git. Documenta las decisiones y el uso real de IA.
