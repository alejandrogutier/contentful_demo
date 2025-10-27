# Guion del demo de Contentful

> Preparado para mostrar las capacidades clave solicitadas por Dentsu (Contentful + Next.js).

## 0. Preparación previa (30 min antes del demo)
- Opción sin Docker: ejecutar `npm install` dentro de `demo-frontend` y `npm run dev`.
- Opción con Docker: `cp demo-frontend/.env.docker.example demo-frontend/.env.docker && WEB_PORT=3001 docker compose up --build` (ajusta el puerto si el 3000 está ocupado).
- Para preparar modelos y contenido demo vía CLI: `npm install` (root) y `CONTENTFUL_SPACE_ID=... CONTENTFUL_MANAGEMENT_TOKEN=... npm run contentful:bootstrap`.
- Si necesitas ejecutar la Contentful CLI desde el contenedor, usa `docker compose exec web contentful <comando>`.
- Si se eligió la opción sin Docker, en otra terminal ejecutar el CRM simulado: `npm run crm`.
- Verificar que las variables de entorno estén cargadas (`.env.local` o `.env.docker`) con llaves válidas.
- Activar el espacio de Contentful con los roles/usuarios de demo y la API Preview habilitada.

## 1. Creación y publicación de contenidos

### Objetivo
Crear una nueva página usando un template existente, editar textos, añadir multimedia y configurar SEO básico.

### Pasos sugeridos
1. En Contentful, ingresar al Content Model **Page** y explicar los campos clave (template, SEO, multi-sitio).
2. Crear una entrada nueva usando el template `landing` y asignar slug `demo-home`.
3. Completar:
   - Hero (title, imágenes, video opcional mediante asset o embed).
   - Cuerpo rich text con componentes (toggle la vista JSON en Contentful para resaltar estructura).
   - Campos SEO (`seoTitle`, `seoDescription`, `seoKeywords`, `url`).
4. Mostrar el workflow: enviar la página a revisión y luego aprobarla con un usuario diferente (usar roles preparadas).
5. Publicar la página y refrescar la vista en el frontend (`http://localhost:3000/es/demo-home`).

## 2. Gestión de formularios e integraciones

### Objetivo
Configurar un formulario de leads, integrarlo a un CRM simulado y mostrar trazabilidad.

### Pasos
1. Crear o seleccionar un **Lead Form** existente en Contentful.
2. Mostrar cómo los campos se definen desde Contentful (tipos y validaciones).
3. Asociar el formulario a la página `demo-home` (campo `formReference`).
4. En el sitio (`http://localhost:3000/es/formulario-leads`) completar y enviar el formulario.
5. Explicar cómo `/api/leads` transforma y pasa el payload al CRM simulado (tab Terminal con logs).
6. Abrir `scripts/tmp/leads.json` para mostrar la persistencia y explicar cómo sería la conexión real (Webhook → Bus → Odoo).

## 3. Multilingüismo (ES–EN)

### Objetivo
Mostrar cómo Contentful habilita locales, traducción manual/automática y navegación fluida.

### Pasos
1. Activar la versión EN de una página (usar switching de locales en Contentful).
2. Demostrar la traducción manual de campos y comentar opciones con plugins de Localize/Smartling.
3. Navegar a `http://localhost:3000` y usar el componente **LocaleSwitcher**.
4. Mostrar cómo el slug se mantiene amigable y el SEO se ajusta por `generateMetadata`.

## 4. Gestión de usuarios y flujos de aprobación

### Objetivo
Crear roles y evidenciar el flujo Editor → Revisor → Publicador.

### Pasos
1. En la configuración del espacio, mostrar roles creados (Editor, Revisor, Admin).
2. Crear contenido con un usuario Editor y trasladarlo al estado “Listo para Revisión”.
3. Cambiar de sesión (o usar la vista de Workflow) y aprobar/publicar.
4. Mostrar la auditoría y registros de actividad dentro de Contentful.

## 5. Escalabilidad y multi-sitio (opcional)

### Objetivo
Explicar cómo soportar múltiples sitios/micrositios desde el mismo espacio.

### Pasos
1. En Contentful, crear un nuevo entry **Page** con campo `site = corporate` y otro `site = micrositio`.
2. Mostrar en el frontend cómo `getPageBySlug` podría filtrar por `site`.
3. Presentar la estructura de navegación (`navigationItem`) para micrositios.

## 6. Integración con Odoo

### Entregable
- Revisar el diagrama `docs/odoo_integration_diagram.mmd`.
- Resaltar los puntos de integración:
  - Webhooks → Orquestador (Azure Functions/AWS Lambda).
  - Normalización y encolado.
  - API de Odoo (JSON-RPC/REST) para crear oportunidades o clientes.
- Comentar posibilidad de sincronización inversa (Odoo → Contentful) usando la Content Management API.

## Annex: Checklist de herramientas
- [ ] Contentful CLI (`contentful space use` y `contentful migration`).
- [ ] Usuarios de demo creados (Admin, Editor, Revisor).
- [ ] Variables de entorno cargadas (`CONTENTFUL_*`, `CRM_WEBHOOK_URL`).
- [ ] Dashboard en Contentful con KPIs (opcional).
- [ ] CRM simulado respondiendo en `http://localhost:3333/leads`.

## Tips para la sesión en vivo
- Mantener la consola del CRM visible para reforzar trazabilidad.
- Mostrar el modo Preview (borrador) usando `previewToken`.
- Comparar tiempo de publicación vs. método tradicional.
- Si el tiempo lo permite, crear rápidamente un segundo micrositio con `site = "eventos"` y enseñar cómo clonar componentes.
