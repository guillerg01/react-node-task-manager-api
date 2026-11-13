# Decisiones técnicas y registro de trabajo

## Alcance y límites

La prueba es un gestor de tareas TypeScript con React, NestJS, PostgreSQL, filtro por estado, validación, errores visibles y pruebas de ambos lados. Dos repositorios públicos separan frontend y backend. La entrega incorpora paginación, seed opcional, OpenAPI, Docker, CI/CD y verificación responsive.

Se busca una solución pequeña y revisable. El despliegue demuestra capacidad de entrega, pero no acredita preparación para datos privados. Autenticación, propiedad de tareas, monitorización, limitación de peticiones y recuperación operativa son mejoras pendientes.

## Registro de decisiones

| Decisión | Motivo y contrapartida |
| --- | --- |
| React, Vite y TypeScript estricto | Frontend estático con tipos explícitos y compilación enfocada; no hay necesidad de renderizado en servidor |
| Módulo NestJS por feature | Inyección de dependencias y límites claros; más estructura que un controlador Express mínimo |
| PostgreSQL y TypeORM | Persistencia relacional, transacciones, entidades y migraciones; exige comprobar comportamiento con base real |
| Migraciones explícitas y sincronización desactivada | Cambios de esquema revisables; deben completarse antes de atender peticiones |
| Controlador, servicio y repositorio | Separa HTTP, operaciones y SQL sin inventar un framework CRUD genérico |
| Validadores compartidos | Reutilizan texto obligatorio y enteros; la feature define sus restricciones |
| Versión por tarea | Evita sobrescrituras silenciosas con actualización atómica; el cliente debe gestionar conflictos |
| Filtros y paginación en servidor | Respuestas acotadas y total autoritativo; la paginación por desplazamiento tiene límites a gran escala |
| Lectura repetible | Elementos y total comparten una vista consistente; cada listado usa una transacción |
| Material UI y Tailwind | Controles establecidos y distribución mediante utilidades; las reglas específicas permanecen en la feature |
| React Hook Form | Gestiona campos, validación y envío; no es responsable de la caché remota |
| Instancia Axios de módulo | Centraliza origen, timeout e interceptor sin necesitar una clase singleton |
| TanStack Query | Identidad, vigencia, cancelación y reconciliación de datos; evita duplicar estado remoto en otro almacén |
| Hook de tareas dentro de la feature | Sus estados, rutas y claves son específicos de tareas; una carpeta genérica ocultaría esa dependencia |
| Proveedor de notificaciones | Cola y presentación accesible reutilizables; mensajes específicos y alternativa en línea en el tablero |
| Guard de mantenimiento | Comprueba una credencial configurada en el backend antes de ejecutar la operación; rechaza accesos si falta configuración y no expone la clave al frontend |
| Una ruta frontend | Una pantalla no necesita una biblioteca de enrutado |
| Dos repositorios | Compilación y responsabilidad independientes; exige coordinar contratos y publicaciones |
| Docker Compose | Arranque reproducible de tres servicios con salud y persistencia local |
| GitHub Actions y Render | Comprobaciones repetibles y publicación desde main; la configuración operativa también debe verificarse |

## Caché y concurrencia

La clave es `['tasks', statusFilter, page, pageSize]`, con 30 segundos de vigencia. Las lecturas reciben cancelación y no se repiten automáticamente al enfocar la ventana. Crear invalida las consultas. Cambiar estado actualiza la fila con la respuesta guardada si aún pertenece a la vista; si deja de pertenecer, se consulta la página y el total. Las demás vistas quedan invalidadas. Una escritura pendiente se reconcilia con el filtro y página actuales.

Las escrituras no se reintentan automáticamente. Un timeout puede ocurrir después de guardar; repetir silenciosamente podría duplicar una creación. El formulario conserva borradores fallidos y permite reintento deliberado. No se implementan claves de idempotencia.

La actualización SQL comprueba UUID y versión y la incrementa en una sola operación. Dos clientes con la misma versión no pueden sobrescribir ambos: uno recibe conflicto. Esto evita actualizaciones perdidas, pero no proporciona sincronización en tiempo real. Los cambios externos requieren otra lectura.

## Qué se pidió a la IA, qué se aceptó y qué se corrigió

Se pidió comparar bibliotecas, planificar arquitectura y contrato HTTP, implementar módulos delimitados y proponer pruebas y documentación. Se aceptaron el stack seleccionado, transporte compartido, organización por features y verificación por niveles. El candidato definió requisitos, restricciones técnicas, alcance, proveedor de despliegue y expectativas de revisión.

Subagentes Luna asumieron tareas delimitadas de API, interfaz y pruebas. Compartieron reglas y contrato HTTP. El reparto permitió avanzar en trabajo independiente; el agente principal conservó responsabilidad sobre integración, resolución de diferencias y revisión final personal. Las respuestas de un subagente no se consideraron prueba suficiente de corrección.

La inspección y las pruebas llevaron a ajustar reconciliación de caché al cambiar filtros durante escrituras, lecturas redundantes, validación, concurrencia, foco de campos y alineación de tarjetas. Se aceptaron esos cambios por su comportamiento observado y comprobaciones, no solamente por una explicación generada. La documentación distingue implementación y trabajo futuro.

## Contexto y herramientas

Los archivos `AGENTS.md` fijan límites de features, idioma, commits y verificación. El plan, contrato HTTP, código y este registro conservan contexto. La coordinación de archivos y contratos reduce cambios incompatibles. Las inspecciones y tareas independientes pueden ejecutarse en paralelo; los cambios dependientes y la integración final se realizan en secuencia.

El registro público resume decisiones y prácticas; no publica conversaciones privadas, datos personales, tokens ni códigos de acceso. Las plantillas de entorno contienen ejemplos locales y los archivos reales están excluidos de Git.

Se consultó documentación oficial de frameworks y bibliotecas. La skill UI/UX Pro Max apoyó la revisión de etiquetas, foco, contraste, objetivos táctiles y distribución responsive. Las herramientas de navegador y MCP apoyaron la inspección y configuración de Render. Git y GitHub CLI gestionaron repositorios y comprobaciones. La terminal y Docker ejecutaron compilaciones, migraciones y pruebas.

El navegador integrado dejó de estar disponible durante verificaciones posteriores. Playwright permitió recorrer el sistema y obtener capturas para inspección directa. Esas comprobaciones se describen como Playwright, sin atribuirlas a sesiones del navegador integrado.

## Estrategia de verificación

| Nivel | Qué comprueba | Qué no acredita |
| --- | --- | --- |
| Unitario backend | Validadores, resultados HTTP, delegación y operaciones del repositorio | Integración real HTTP/base de datos |
| Integración backend | PostgreSQL real, validación HTTP, paginación, conflictos y OpenAPI | Resistencia bajo carga de producción |
| Unitario e integración frontend | Errores, almacenamiento, formularios, consultas y recorridos con MSW | Conexión real al backend en esas pruebas |
| Playwright sobre Compose | Integración de tres servicios, estados, filtros, paginación, notificaciones y recuperación en tres tamaños | Certificación completa de accesibilidad, seguridad o rendimiento |
| Inspección visual | Alineación, foco, capturas responsive y desbordamiento | Todos los dispositivos o tecnologías de asistencia |
| Comprobación en producción | Notificaciones de creación y estado, cierre manual y automático y respuestas desplegadas | Sustituir pruebas aisladas y repetibles |

La base verificada tiene 35 pruebas unitarias backend, ocho de integración PostgreSQL, 30 frontend y nueve recorridos de navegador. Los errores controlados evitan interrumpir infraestructura de producción. Los registros creados para comprobar notificaciones se eliminaron después. Un vaciado de producción autorizado posteriormente devolvió 204 y la lectura siguiente confirmó cero tareas.

## Dependencias y seguridad

Los lockfiles conservan resoluciones verificadas. Un override de `minimatch` 11.0.8 aborda una alerta transitiva de herramientas. Axios está fijado en 1.21.1. Las auditorías no detectaron vulnerabilidades en la base verificada; es un resultado puntual, no una garantía permanente. CI repite auditoría junto a pruebas y compilación.

El servidor valida independientemente del formulario y no expone detalles internos en fallos inesperados. CORS utiliza orígenes configurados. CORS y ocultar rutas no sustituyen autenticación. No se atribuye al sistema autorización ni limitación de peticiones inexistentes.

## Desarrollo y publicación

Las ramas `feature/*` o `fix/*` parten de `dev`, se integran mediante pull request a `dev` y se promueven mediante otro a `main`. Cada commit lleva título y cuerpo descriptivos del comportamiento y verificación. `main` representa producción.

CI se configura en pushes y pull requests de ambos repositorios. Audita, revisa lint y tipos, prueba y compila. PostgreSQL y navegador comprueban integración. La rama compañera usa `dev` para integración y `main` para producción. Render publica main después de comprobaciones correctas. Los cambios incompatibles requieren coordinación y compatibilidad porque los despliegues son independientes.

## Próximas prioridades

Antes de datos privados: autenticación, propiedad de tareas, limitación de peticiones, observabilidad y recuperación de copias. Añadir una auditoría completa con lector de pantalla, protección de publicaciones y creación idempotente cuando lo justifiquen los requisitos. Evaluar cursores y planes SQL con carga real y sustituir la base gratuita con caducidad si el sistema va a mantenerse.
