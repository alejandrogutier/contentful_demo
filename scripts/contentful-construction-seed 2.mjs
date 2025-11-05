#!/usr/bin/env node

import contentfulManagement from "contentful-management";
import ora from "ora";
import assert from "node:assert";

const { createClient } = contentfulManagement;

const {
  CONTENTFUL_MANAGEMENT_TOKEN,
  CONTENTFUL_SPACE_ID,
  CONTENTFUL_ENVIRONMENT = "master"
} = process.env;

if (!CONTENTFUL_MANAGEMENT_TOKEN) {
  console.error("CONTENTFUL_MANAGEMENT_TOKEN no está definido.");
  process.exit(1);
}

if (!CONTENTFUL_SPACE_ID) {
  console.error("CONTENTFUL_SPACE_ID no está definido.");
  process.exit(1);
}

const spinner = ora("Conectando a Contentful...").start();

function richText(paragraphs) {
  const blocks = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map(
    (text) => ({
      nodeType: "paragraph",
      data: {},
      content: [
        {
          nodeType: "text",
          value: text,
          marks: [],
          data: {}
        }
      ]
    })
  );

  return {
    nodeType: "document",
    data: {},
    content: blocks
  };
}

async function run() {
  const client = createClient({
    accessToken: CONTENTFUL_MANAGEMENT_TOKEN
  });

  const space = await client.getSpace(CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(CONTENTFUL_ENVIRONMENT);

  spinner.succeed("Conexión establecida con Contentful.");

  const localesResponse = await environment.getLocales();
  const localeCodes = localesResponse.items.map((locale) => locale.code);
  const defaultLocale =
    localesResponse.items.find((locale) => locale.default)?.code ??
    localeCodes[0];

  assert(defaultLocale, "No se encontró locale por defecto en el espacio.");

  const esLocale = localeCodes.includes("es-ES") ? "es-ES" : defaultLocale;
  const enLocale = localeCodes.includes("en-US") ? "en-US" : defaultLocale;

  const allLocales = localeCodes;

  const localize = (values) => {
    const resolved = {};
    for (const code of allLocales) {
      resolved[code] =
        values[code] ??
        values.default ??
        values[esLocale] ??
        values[enLocale] ??
        values[defaultLocale] ??
        Object.values(values)[0];
    }
    return resolved;
  };

  const setField = (entry, fieldId, value) => {
    if (value === undefined || value === null) {
      return;
    }
    entry.fields[fieldId] = entry.fields[fieldId] ?? {};
    entry.fields[fieldId][defaultLocale] = value;
  };

  const setLocalizedField = (entry, fieldId, values) => {
    entry.fields[fieldId] = entry.fields[fieldId] ?? {};
    const localizedValues = localize(values);
    for (const [locale, val] of Object.entries(localizedValues)) {
      entry.fields[fieldId][locale] = val;
    }
  };

  const ensureLink = (entry, fieldId, linkId) => {
    entry.fields[fieldId] = entry.fields[fieldId] ?? {};
    entry.fields[fieldId][defaultLocale] = {
      sys: {
        id: linkId,
        linkType: "Entry",
        type: "Link"
      }
    };
  };

  const linkAsset = (entry, fieldId, assetId) => {
    if (!assetId) return;
    entry.fields[fieldId] = entry.fields[fieldId] ?? {};
    entry.fields[fieldId][defaultLocale] = {
      sys: {
        id: assetId,
        linkType: "Asset",
        type: "Link"
      }
    };
  };

  async function upsert(
    id,
    updater,
    { contentType, publish = true } = {}
  ) {
    spinner.start(`Actualizando ${id}...`);
    let entry;
    try {
      entry = await environment.getEntry(id);
    } catch (error) {
      if (error.name === "NotFound") {
        assert(
          contentType,
          `No existe el entry ${id} y no se proporcionó contentType`
        );
        entry = await environment.createEntryWithId(contentType, id, {
          fields: {}
        });
      } else {
        throw error;
      }
    }

    await updater(entry);
    const updated = await entry.update();
    if (publish) {
      await updated.publish();
    }
    spinner.succeed(`Actualizado ${id}`);
  }

  const leadFormId = "demoLeadForm";

  await upsert(
    leadFormId,
    async (entry) => {
      setLocalizedField(entry, "internalName", {
        [esLocale]: "Formulario de proyectos constructivos",
        [enLocale]: "Construction project inquiry form"
      });
      setLocalizedField(entry, "description", {
        [esLocale]:
          "Dinos qué tipo de desarrollo necesitas, nuestro equipo de obra te contactará en menos de 24 horas.",
        [enLocale]:
          "Tell us about your development needs and our construction team will get back within 24 hours."
      });
      setLocalizedField(entry, "successMessage", {
        [esLocale]:
          "¡Gracias! Un especialista de Construtech Dentsu se comunicará contigo pronto.",
        [enLocale]:
          "Thanks! A Construtech Dentsu specialist will reach out shortly."
      });

      const formFields = [
        {
          id: "fullName",
          label: "Nombre completo",
          type: "text",
          required: true
        },
        {
          id: "email",
          label: "Correo electrónico corporativo",
          type: "email",
          required: true
        },
        {
          id: "company",
          label: "Empresa / Desarrolladora",
          type: "text",
          required: true
        },
        {
          id: "projectType",
          label: "Tipo de proyecto",
          type: "select",
          required: true,
          options: [
            { label: "Residencial vertical", value: "residential" },
            { label: "Corporativo / Oficinas", value: "commercial" },
            { label: "Industrial / Logística", value: "industrial" },
            { label: "Infraestructura urbana", value: "infrastructure" }
          ]
        },
        {
          id: "investmentRange",
          label: "Rango de inversión estimado (USD)",
          type: "select",
          required: true,
          options: [
            { label: "Hasta 5 millones", value: "0-5m" },
            { label: "5 a 20 millones", value: "5-20m" },
            { label: "20 a 50 millones", value: "20-50m" },
            { label: "Más de 50 millones", value: "50m+" }
          ]
        },
        {
          id: "timeline",
          label: "Fecha objetivo de entrega",
          type: "text"
        },
        {
          id: "notes",
          label: "Comentarios adicionales",
          type: "textarea"
        }
      ];

      setField(entry, "fields", formFields);
    },
    { contentType: "leadForm" }
  );

  const pageConfigs = [
    {
      id: "demo-home",
      slug: "demo-home",
      template: "landing",
      heroTitle: {
        [esLocale]: "Edificamos ciudades inteligentes y sostenibles",
        [enLocale]: "We build smart and sustainable cities"
      },
      heroAsset: "hero-demo-home",
      title: "Soluciones constructivas 360°",
      description: {
        [esLocale]:
          "Descubre el enfoque end-to-end de Construtech Dentsu: desde master plan y permisos hasta obra, venta y operación digital del activo.",
        [enLocale]:
          "Discover Construtech Dentsu’s end-to-end approach: from master planning and permits to construction, sales, and digital operation of the asset."
      },
      body: {
        [esLocale]: richText([
          "Integramos analítica urbana, prefactibilidad financiera y coordinación con proveedores estratégicos para que cada desarrollo inicie con certeza técnica.",
          "Unificamos BIM, licitaciones digitales y workflows de obra para reducir hasta en 30% los plazos de construcción y maximizar el retorno por metro cuadrado.",
          "Complementamos la operación con experiencias digitales para residentes, inversionistas y property managers, todo desde Contentful."
        ]),
        [enLocale]: richText([
          "We combine urban analytics, financial feasibility and supplier orchestration so every development starts with technical certainty.",
          "BIM, digital procurement and site workflows run in a single platform, reducing construction times by up to 30% while boosting ROI per square meter.",
          "The experience extends post-handover with digital touchpoints for residents, investors and property managers powered by Contentful."
        ])
      },
      seoTitle: {
        [esLocale]: "Construtech Dentsu | Soluciones constructivas 360°",
        [enLocale]: "Construtech Dentsu | Holistic construction solutions"
      },
      seoDescription: {
        [esLocale]:
          "Modelo integral basado en data que cubre planeación, construcción y operación para desarrollos residenciales, corporativos e industriales.",
        [enLocale]:
          "Data-driven model covering planning, construction and operations for residential, corporate and industrial developments."
      },
      summary: {
        [esLocale]:
          "Modelo integral que cubre planeación, construcción y operación con data en tiempo real.",
        [enLocale]:
          "Integrated model covering planning, construction and operations with real-time data."
      },
      callToAction: {
        [esLocale]: {
          texto: "Agenda una reunión",
          url: "/es/formulario-leads"
        },
        [enLocale]: {
          texto: "Book a consultation",
          url: "/en/formulario-leads"
        }
      },
      seoKeywords: [
        "construcción",
        "desarrollos inmobiliarios",
        "BIM",
        "lean construction",
        "data driven"
      ]
    },
    {
      id: "formulario-leads",
      slug: "formulario-leads",
      template: "standard",
      heroTitle: {
        [esLocale]: "Cuéntanos sobre tu próximo desarrollo inmobiliario",
        [enLocale]: "Tell us about your next real estate development"
      },
      heroAsset: "hero-formulario",
      title: "Agenda una reunión con nuestros especialistas",
      description: {
        [esLocale]:
          "Integramos arquitectura BIM, coordinamos proveedores y administramos la trazabilidad del proyecto con dashboards en tiempo real.",
        [enLocale]:
          "We integrate BIM architecture, coordinate suppliers, and manage project traceability with real-time dashboards."
      },
      body: {
        [esLocale]: richText([
          "Comparte los datos clave del desarrollo y entregaremos un estudio técnico-financiero en un máximo de 48 horas.",
          "Incluimos cronograma estimado, CAPEX proyectado y plan de contratación de proveedores certificados.",
          "Además, te mostramos un demo del portal de residentes y dashboards de operación post-entrega."
        ]),
        [enLocale]: richText([
          "Share the core data of your development and we will deliver a technical and financial study within 48 hours.",
          "The packet includes timeline estimates, projected CAPEX and a supplier onboarding roadmap with certified partners.",
          "We also showcase the resident portal and post-handover operational dashboards."
        ])
      },
      seoTitle: {
        [esLocale]: "Construtech Dentsu | Agenda una reunión",
        [enLocale]: "Construtech Dentsu | Book a consultation"
      },
      seoDescription: {
        [esLocale]:
          "Solicita una presentación personalizada con cronograma, estimación de CAPEX y plan de proveedores.",
        [enLocale]:
          "Request a tailored presentation with timeline, CAPEX estimate and supplier roadmap."
      },
      summary: {
        [esLocale]:
          "Diagnóstico exprés con CAPEX y cronograma estimado para tu desarrollo.",
        [enLocale]:
          "Express diagnosis with estimated CAPEX and schedule for your development."
      },
      seoKeywords: [
        "cotización",
        "construcción",
        "BIM",
        "estudio financiero"
      ]
    },
    {
      id: "workflows",
      slug: "workflows",
      template: "standard",
      heroTitle: {
        [esLocale]: "Control documental y aprobaciones para cada frente de obra",
        [enLocale]:
          "Document control and approvals for every construction front"
      },
      heroAsset: "hero-workflows",
      title: "Workflows de construcción",
      description: {
        [esLocale]:
          "Revisa cómo orquestamos los hitos críticos: licencias, avances de obra, QA/QC y entrega a clientes.",
        [enLocale]:
          "See how we orchestrate critical milestones: permits, site progress, QA/QC, and client handover."
      },
      body: {
        [esLocale]: richText([
          "Cada frente de trabajo opera bajo matrices RACI y tableros de progreso que integran evidencias fotográficas y control de cambios.",
          "Los aprobadores reciben notificaciones automáticas y pueden firmar documentación desde web o móvil.",
          "Las métricas clave (productividad, desviaciones de cronograma y QA/QC) alimentan la sala de control ejecutiva."
        ]),
        [enLocale]: richText([
          "Each construction front runs on RACI matrices and progress dashboards consolidating photos, change control and field reports.",
          "Approvers receive automated notifications and can sign documentation from web or mobile.",
          "Key metrics—productivity, schedule variance and QA/QC—feed the executive control room."
        ])
      },
      seoTitle: {
        [esLocale]: "Construtech Dentsu | Workflows de obra",
        [enLocale]: "Construtech Dentsu | Construction workflows"
      },
      seoDescription: {
        [esLocale]:
          "Supervisión diaria, firmas digitales y KPIs críticos centralizados en un solo panel.",
        [enLocale]:
          "Daily supervision, digital signatures and critical KPIs centralized in one panel."
      },
      summary: {
        [esLocale]:
          "Supervisión diaria, firmas digitales y tableros QA/QC integrados.",
        [enLocale]:
          "Daily supervision, digital signatures and integrated QA/QC dashboards."
      },
      seoKeywords: ["workflows", "QA/QC", "control de obra", "aprobaciones"]
    },
    {
      id: "multisitio",
      slug: "multisitio",
      template: "landing",
      heroTitle: {
        [esLocale]: "Gestiona portafolios multi-ciudad con un solo stack",
        [enLocale]: "Manage multi-city portfolios with a single stack"
      },
      heroAsset: "hero-multisitio",
      title: "Portafolios y multi-sitio",
      description: {
        [esLocale]:
          "Operamos macroproyectos en CDMX, Monterrey y Bogotá con el mismo esquema de reporting y procurement.",
        [enLocale]:
          "We operate large-scale projects in CDMX, Monterrey, and Bogotá using the same reporting and procurement framework."
      },
      body: {
        [esLocale]: richText([
          "Configura micrositios por desarrollo con branding independiente y catálogos de unidades siempre actualizados.",
          "Los equipos locales tienen permisos específicos mientras la oficina corporativa conserva la visibilidad global.",
          "Integramos CRMs, ERPs y sistemas de facility management para una operación de punta a punta."
        ]),
        [enLocale]: richText([
          "Spin up microsites per development with independent branding and real-time inventory.",
          "Local teams have granular permissions while headquarters keeps global visibility.",
          "We integrate CRMs, ERPs and facility management platforms for true end-to-end operations."
        ])
      },
      seoTitle: {
        [esLocale]: "Construtech Dentsu | Multi-sitio",
        [enLocale]: "Construtech Dentsu | Multi-site portfolio"
      },
      site: {
        [esLocale]: "construtech",
        [enLocale]: "construtech"
      },
      summary: {
        [esLocale]:
          "Micrositios por proyecto con permisos por rol y reporting global.",
        [enLocale]:
          "Project-specific microsites with role-based permissions and global reporting."
      },
      seoKeywords: [
        "multi-sitio",
        "portafolio",
        "proptech",
        "facility management"
      ]
    }
  ];

  for (const page of pageConfigs) {
    await upsert(
      page.id,
      async (entry) => {
        setField(entry, "title", page.title);
        setField(entry, "slug", page.slug);
        setField(entry, "template", page.template ?? "standard");
        setLocalizedField(entry, "heroTitle", page.heroTitle);

        if (page.heroAsset) {
          linkAsset(entry, "heroImage", page.heroAsset);
        }

        const defaultBody =
          page.body[defaultLocale] ??
          page.body[esLocale] ??
          page.body[enLocale] ??
          Object.values(page.body)[0];
        setField(entry, "body", defaultBody);

        entry.fields.body = entry.fields.body ?? {};
        for (const localeCode of allLocales) {
          const textSource =
            page.body[localeCode] ??
            page.body[localeCode === enLocale ? enLocale : esLocale] ??
            defaultBody;
          entry.fields.body[localeCode] = textSource;
        }

        setLocalizedField(entry, "seoTitle", page.seoTitle);
        if (page.seoDescription) {
          setLocalizedField(entry, "seoDescription", page.seoDescription);
        }
        if (page.summary) {
          setLocalizedField(entry, "summary", page.summary);
        }
        if (page.callToAction) {
          setLocalizedField(entry, "callToAction", page.callToAction);
        }
        if (page.seoKeywords) {
          setField(entry, "seoKeywords", page.seoKeywords);
        }
        if (page.site) {
          setLocalizedField(entry, "site", page.site);
        }
        ensureLink(entry, "formReference", leadFormId);
      },
      { contentType: "page" }
    );
  }

  const navigationItems = [
    {
      id: "nav-demo-home",
      label: {
        [esLocale]: "Servicios",
        [enLocale]: "Services"
      },
      slug: "demo-home",
      order: 1
    },
    {
      id: "nav-demo-form",
      label: {
        [esLocale]: "Proyectos",
        [enLocale]: "Projects"
      },
      slug: "formulario-leads",
      order: 2
    },
    {
      id: "nav-demo-workflows",
      label: {
        [esLocale]: "Operación en obra",
        [enLocale]: "Site Operations"
      },
      slug: "workflows",
      order: 3
    },
    {
      id: "nav-demo-multisite",
      label: {
        [esLocale]: "Portafolio corporativo",
        [enLocale]: "Corporate portfolio"
      },
      slug: "multisitio",
      order: 4
    }
  ];

  for (const nav of navigationItems) {
    await upsert(
      nav.id,
      async (entry) => {
        setLocalizedField(entry, "label", nav.label);
        setField(entry, "slug", nav.slug);
        setField(entry, "order", nav.order);
        ensureLink(entry, "page", nav.slug);
      },
      { contentType: "navigationItem" }
    );
  }

  spinner.succeed(
    "Contenido actualizado con temática de constructora en Contentful."
  );
}

run().catch((error) => {
  spinner.fail("No se pudo completar la actualización de contenido.");
  console.error(error);
  process.exit(1);
});
