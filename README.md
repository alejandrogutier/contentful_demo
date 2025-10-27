# Contentful Demo – Dentsu

Repositorio preparado para ejecutar un demo en vivo de Contentful que cubre creación de contenidos, flujos editoriales, multilenguaje y una integración de formularios con un CRM simulado + diagrama de integración con Odoo.

## Estructura
- `demo-frontend/`: Aplicación Next.js (App Router) que consume Contentful y expone un formulario conectado al CRM simulado.
- `scripts/mock-crm-server.js`: Servidor Node.js que persiste leads y actúa como CRM/ERP dummy.
- `contentful/migrations/`: Scripts `contentful-migration` para provisionar modelos (**Page**, **Lead Form**, **Navigation**).
- `docs/`: Runbook del demo y diagrama Mermaid para la integración con Odoo.

## Requisitos
- Node.js >= 18.
- Cuenta de Contentful con acceso a Content Management (para migraciones) y Content Delivery/Preview.
- `contentful-cli` instalado globalmente (`npm install -g contentful-cli`).

## Variables de entorno (`demo-frontend/.env.local`)
```bash
CONTENTFUL_SPACE_ID=xxxxx
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_DELIVERY_TOKEN=xxxxx
CONTENTFUL_PREVIEW_TOKEN=xxxxx
CRM_WEBHOOK_URL=http://localhost:3333/leads
```

## Ejecución con Docker
```bash
cp demo-frontend/.env.docker.example demo-frontend/.env.docker
WEB_PORT=3001 docker compose up --build
```

- Frontend: http://localhost:3000 (ajusta `WEB_PORT` si necesitas otro puerto)
- CRM simulado (persistencia en `scripts/tmp/leads.json`): http://localhost:3333/leads
- Detener servicios: `docker compose down` (usa `-v` si deseas limpiar volúmenes)
- El contenedor `contentful-demo-web` incluye la Contentful CLI (`contentful`). Puedes ejecutar comandos así:
  ```bash
  docker compose exec web contentful --version
  docker compose exec web contentful space use --space-id <SPACE_ID>
  ```

## Puesta en marcha
```bash
cd demo-frontend
npm install
npm run dev
```

En otra terminal:
```bash
cd demo-frontend
npm run crm
```

- Frontend: http://localhost:3000
- CRM simulado: http://localhost:3333/leads

## Provisionar Contentful
1. Seleccionar el espacio: `contentful space use --space-id <SPACE_ID>`.
2. Ejecutar migraciones: `contentful migration --environment-id master contentful/migrations/01-page-and-form.cjs`.
3. Crear roles de usuario (Editor, Revisor, Admin) y activar Workflows en el espacio.
4. Configurar locales `es-ES` y `en-US`.

## Tooling para preparar el espacio
```bash
# Instalar dependencias del tooling (en el root del repo)
npm install

# Autenticarse (abre el browser)
npm run contentful:login

# Indicar el space y environment por defecto
CONTENTFUL_SPACE_ID=<SPACE_ID> npm run contentful:space:use
CONTENTFUL_SPACE_ID=<SPACE_ID> CONTENTFUL_ENVIRONMENT=master npm run contentful:env:use

# Ejecutar migración + contenido demo (requiere CONTENTFUL_MANAGEMENT_TOKEN)
CONTENTFUL_SPACE_ID=<SPACE_ID> \
CONTENTFUL_ENVIRONMENT=master \
CONTENTFUL_MANAGEMENT_TOKEN=<CMA_TOKEN> \
npm run contentful:bootstrap
```

- El comando `contentful:bootstrap` ejecuta la migración `01-page-and-form.cjs` y crea páginas, formularios y navegación de ejemplo listos para el demo.
- Variables recomendadas: copia `.env.example` y completa `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ENVIRONMENT` y `CONTENTFUL_MANAGEMENT_TOKEN` para exportarlas fácilmente.

## Escenarios cubiertos
1. **Creación y publicación de contenidos**: Page template con campos SEO y assets; renderizado en `/[locale]/[slug]`.
2. **Formularios e integraciones**: Content model `leadForm` + componente `LeadForm` → API `/api/leads` → CRM simulado.
3. **Multilingüismo**: i18n nativo de Next + locales de Contentful; `LocaleSwitcher` para navegar entre idiomas.
4. **Usuarios y aprobaciones**: soporte para Workflows de Contentful y campo `workflowStage`.
5. **Multi-sitio**: campo `site` en Page; navegación desacoplada con `navigationItem`.
6. **Integración con Odoo**: ver `docs/odoo_integration_diagram.mmd` + explicación en `docs/demo_runbook.md`.

## Cómo realizar el demo
- Seguir el guion `docs/demo_runbook.md`.
- Mantener visible la terminal del CRM para evidenciar la trazabilidad de leads.
- Usar la API Preview (`CONTENTFUL_PREVIEW_TOKEN`) para enseñar cambios en modo borrador.
- Mostrar roles y Workflows desde la UI de Contentful.

## Próximos pasos sugeridos
- Añadir autenticación (SSO) para el front de demo.
- Incorporar automatización de traducciones vía Localize o Smartling.
- Integrar pruebas E2E (Playwright) para validar flujo de publicación y formularios.
