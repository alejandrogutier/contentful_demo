# Contentful Demo – Dentsu

Demo de referencia para realizar presentaciones de Contentful con frontend en Next.js y un CRM simulado que recibe los formularios de la web. Incluye tooling para provisionar el espacio, guías operativas y diagramas de integración.

## Componentes principales
- `demo-frontend/`: Aplicación Next.js (App Router) que consulta Contentful y expone `/api/leads`.
- `scripts/mock-crm-server.js`: Servicio Node que persiste leads en `scripts/tmp/leads.json`.
- `contentful/migrations/`: Script `01-page-and-form.cjs` para crear los modelos de contenido.
- `docs/`: Runbook del demo y diagrama de integración con Odoo.
- `scripts/contentful-seed.mjs`: Utilidad para precargar contenido de ejemplo tras la migración.

## Requisitos previos
- Docker y Docker Compose v2 (principal vía de ejecución).
- Node.js 18+ solo si deseas correr el proyecto o el tooling fuera de contenedores.
- Espacio de Contentful con acceso a Delivery, Preview y Management API.

## Variables de entorno
| Archivo | Uso | Campos requeridos | Comentarios |
| --- | --- | --- | --- |
| `demo-frontend/.env.local` | Desarrollo local | `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ENVIRONMENT`, `CONTENTFUL_DELIVERY_TOKEN`, `CONTENTFUL_PREVIEW_TOKEN`, `CRM_WEBHOOK_URL` | `CRM_WEBHOOK_URL` debe apuntar al CRM que estés usando (`http://localhost:3333/leads` o el contenedor) |
| `demo-frontend/.env.docker` | Frontend en Docker | Mismos campos + `CONTENTFUL_MANAGEMENT_TOKEN` opcional | Puedes copiar desde `.env.local` y ajustar el webhook a `http://crm:3333/leads` |

> Consejo: guarda tus credenciales en un gestor seguro. Evita commitear `.env.*`.

## Arranque con Docker
1. **Configura variables**  
   Crea `demo-frontend/.env.docker` con tus credenciales de Contentful. Ejemplo:
   ```bash
   CONTENTFUL_SPACE_ID=<SPACE_ID>
   CONTENTFUL_ENVIRONMENT=master
   CONTENTFUL_DELIVERY_TOKEN=<CDA_TOKEN>
   CONTENTFUL_PREVIEW_TOKEN=<CPA_TOKEN>
   CONTENTFUL_MANAGEMENT_TOKEN=<CMA_TOKEN opcional>
   CRM_WEBHOOK_URL=http://crm:3333/leads
   CONTENTFUL_FORCE_DEMO=false
   ```
2. **Construye y levanta servicios**
   ```bash
   WEB_PORT=3001 docker compose up --build -d
   ```
   - `WEB_PORT` define el puerto *host*. Usa otro (p. ej. `3001`) si `3000` está ocupado.
3. **Verifica estado**
   ```bash
   docker compose ps
   docker compose logs crm
   docker compose logs web
   ```
   Espera ver:
   - CRM: `CRM simulado escuchando en http://localhost:3333`
   - Frontend: `✓ Ready in <ms>` tras `next start`
4. **Chequeo rápido**
   ```bash
   curl http://localhost:${WEB_PORT:-3000}
   curl http://localhost:3333/leads
   ```
   El primer comando debe devolver `HTTP/1.1 200 OK`; el segundo, `[]` cuando no hay leads.
5. **Detener y limpiar**
   ```bash
   docker compose down
   ```
   Añade `-v` si necesitas eliminar el directorio `scripts/tmp`.

### Comandos útiles dentro de los contenedores
```bash
docker compose exec web contentful --version
docker compose exec web contentful space use --space-id <SPACE_ID>
docker compose exec crm ls scripts/tmp
```

## Ejecución local sin Docker
```bash
# Terminal 1 – CRM
node scripts/mock-crm-server.js

# Terminal 2 – Next.js
cd demo-frontend
npm install
npm run dev
```
- Frontend en `http://localhost:3000`
- CRM en `http://localhost:3333/leads`

## Provisionar el espacio de Contentful
1. Instala las dependencias del tooling (root del repo):
   ```bash
   npm install
   ```
2. Autentícate:
   ```bash
   npm run contentful:login
   ```
3. Selecciona espacio y entorno por defecto:
   ```bash
   CONTENTFUL_SPACE_ID=<SPACE_ID> npm run contentful:space:use
   CONTENTFUL_SPACE_ID=<SPACE_ID> CONTENTFUL_ENVIRONMENT=master npm run contentful:env:use
   ```
4. Ejecuta la migración + seed (requiere `CONTENTFUL_MANAGEMENT_TOKEN`):
   ```bash
   CONTENTFUL_SPACE_ID=<SPACE_ID> \
   CONTENTFUL_ENVIRONMENT=master \
   CONTENTFUL_MANAGEMENT_TOKEN=<CMA_TOKEN> \
   npm run contentful:bootstrap
   ```

La migración crea los modelos **Page**, **Lead Form** y **Navigation**. El seed añade páginas multilenguaje, navegación y formularios de ejemplo listos para el demo.

## Escenarios de demo cubiertos
- **Publicación multilenguaje:** rutas `/[locale]/[slug]` renderizadas con datos de Contentful.
- **Formularios conectados:** componente `LeadForm` → API `/api/leads` → CRM simulado (persistencia en JSON).
- **Workflows editoriales:** soporte para `workflowStage` en las páginas y guion en `docs/demo_runbook.md`.
- **Integración con Odoo:** revisar `docs/odoo_integration_diagram.mmd` para explicar la arquitectura.

## Solución de problemas
- **Puerto 3000 ocupado:** define `WEB_PORT` al ejecutar `docker compose`.
- **No se crean leads:** revisa `CRM_WEBHOOK_URL` y los logs del CRM; el archivo `scripts/tmp/leads.json` debe regenerarse automáticamente.
- **Errores con Contentful CLI:** asegúrate de ejecutar los comandos dentro del contenedor `web` o de tener la CLI instalada globalmente (`npm install -g contentful-cli`).
- **Tokens caducados:** renueva los Delivery/Preview tokens desde la UI de Contentful y actualiza las variables de entorno.

## Recursos adicionales
- Guion del demo: `docs/demo_runbook.md`
- Diagrama de integración: `docs/odoo_integration_diagram.mmd`
- Código del CRM: `scripts/mock-crm-server.js`

¡Listo! Con Docker y las migraciones ejecutadas, deberías poder mostrar todo el flujo (creación de contenido, aprobación, publicación y recepción de leads) en cuestión de minutos.
