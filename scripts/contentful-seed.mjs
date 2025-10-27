#!/usr/bin/env node
/**
 * Seed script to populate Contentful with demo content used by the presentation.
 * Requires the Contentful Management Token.
 */

import contentfulManagement from "contentful-management";
import ora from "ora";

const { createClient } = contentfulManagement;

const {
  CONTENTFUL_MANAGEMENT_TOKEN,
  CONTENTFUL_SPACE_ID,
  CONTENTFUL_ENVIRONMENT = "master"
} = process.env;

if (!CONTENTFUL_MANAGEMENT_TOKEN || !CONTENTFUL_SPACE_ID) {
  console.error(
    "ERROR: CONTENTFUL_MANAGEMENT_TOKEN and CONTENTFUL_SPACE_ID must be set in the environment."
  );
  process.exit(1);
}

const spinner = ora("Conectando con Contentful...");

const client = createClient({
  accessToken: CONTENTFUL_MANAGEMENT_TOKEN
});

function richTextParagraph(text, locale) {
  return {
    nodeType: "document",
    data: {},
    content: [
      {
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
      }
    ]
  };
}

async function ensureLocale(environment, localeCode, payload) {
  const locales = await environment.getLocales();
  if (locales.items.some((locale) => locale.code === localeCode)) {
    return locales;
  }

  const defaultLocale = locales.items.find((locale) => locale.default);
  try {
    await environment.createLocale({
      code: localeCode,
      name: payload.name,
      fallbackCode: payload.fallbackCode ?? defaultLocale?.code ?? null,
      default: payload.default ?? false,
      contentManagementApi: true,
      contentDeliveryApi: true
    });
  } catch (error) {
    console.warn(`[contentful-seed] No se pudo crear locale ${localeCode}`, error);
  }

  return environment.getLocales();
}

async function getLocalizedFieldSet(environment, contentTypeId) {
  const contentType = await environment.getContentType(contentTypeId);
  return new Set(
    contentType.fields.filter((field) => field.localized).map((field) => field.id)
  );
}

async function run() {
  spinner.start();
  const space = await client.getSpace(CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(CONTENTFUL_ENVIRONMENT);
  spinner.succeed("Conexión exitosa con Contentful");

  const locales = await ensureLocale(environment, "es-ES", {
    name: "Spanish (Spain)",
    default: !(
      await environment.getLocales()
    ).items.some((locale) => locale.default),
    fallbackCode: null
  });

  const updatedLocales = await ensureLocale(environment, "en-US", {
    name: "English (United States)",
    fallbackCode: "es-ES"
  });

  const availableLocaleCodes = new Set(
    updatedLocales.items.map((locale) => locale.code)
  );
  const defaultLocale =
    updatedLocales.items.find((locale) => locale.default)?.code ?? "en-US";
  const hasEs = availableLocaleCodes.has("es-ES");
  const hasEn = availableLocaleCodes.has("en-US");

  function localizedField(esValue, enValue) {
    const baseValue =
      defaultLocale === "en-US"
        ? enValue ?? esValue ?? ""
        : esValue ?? enValue ?? "";

    const localizedValues = {};
    if (hasEs && esValue !== undefined) {
      localizedValues["es-ES"] = esValue;
    }
    if (hasEn && enValue !== undefined) {
      localizedValues["en-US"] = enValue;
    }

    return {
      value: baseValue,
      localized: Object.keys(localizedValues).length ? localizedValues : undefined
    };
  }

  const localizedFieldsMap = new Map();
  localizedFieldsMap.set(
    "leadForm",
    await getLocalizedFieldSet(environment, "leadForm")
  );
  localizedFieldsMap.set(
    "page",
    await getLocalizedFieldSet(environment, "page")
  );
  localizedFieldsMap.set(
    "navigationItem",
    await getLocalizedFieldSet(environment, "navigationItem")
  );

  async function upsertEntry({
    entryId,
    contentTypeId,
    fields,
    publish = true
  }) {
    spinner.start(`Sincronizando "${entryId}" (${contentTypeId})...`);

    let entry;
    try {
      entry = await environment.getEntry(entryId);
    } catch (error) {
      if (error.name === "NotFound") {
        entry = await environment.createEntryWithId(contentTypeId, entryId, {
          fields: {}
        });
      } else {
        throw error;
      }
    }

    entry.fields = entry.fields ?? {};
    const localizedFields = localizedFieldsMap.get(contentTypeId) ?? new Set();

    for (const [fieldId, config] of Object.entries(fields)) {
      if (config === undefined || config === null) {
        continue;
      }
      const fieldIsLocalized = localizedFields.has(fieldId);
      const values =
        typeof config === "object" && config !== null ? config : { value: config };

      if (values.value === undefined) {
        continue;
      }

    entry.fields[fieldId] = entry.fields[fieldId] ?? {};
    entry.fields[fieldId][defaultLocale] = values.value;

    if (fieldIsLocalized && values.localized) {
      for (const [localeCode, localeValue] of Object.entries(
        values.localized
      )) {
        if (!availableLocaleCodes.has(localeCode)) {
          continue;
        }
        entry.fields[fieldId][localeCode] = localeValue;
      }
    }

    if (fieldIsLocalized) {
      for (const localeCode of availableLocaleCodes) {
        if (!entry.fields[fieldId][localeCode]) {
          entry.fields[fieldId][localeCode] = values.value;
        }
      }
    }
  }

    const updatedEntry = await entry.update();

    if (publish) {
      const publishedEntry = await updatedEntry.publish();
      spinner.succeed(`Publicado "${entryId}"`);
      return publishedEntry;
    }

    spinner.succeed(`Actualizado "${entryId}"`);
    return updatedEntry;
  }

  const leadFormEntry = await upsertEntry({
    entryId: "demoLeadForm",
    contentTypeId: "leadForm",
    fields: {
      internalName: localizedField(
        "Formulario demo captura leads",
        "Demo lead capture form"
      ),
      description: localizedField(
        "Formulario rápido para captar leads del sitio demo.",
        "Quick form to capture leads in the demo site."
      ),
      successMessage: localizedField(
        "¡Gracias! Nos pondremos en contacto muy pronto.",
        "Thanks! We will get back to you shortly."
      ),
      fields: {
        value: [
          {
            id: "fullName",
            label: "Nombre completo",
            type: "text",
            required: true
          },
          {
            id: "email",
            label: "Email corporativo",
            type: "email",
            required: true
          },
          {
            id: "company",
            label: "Empresa",
            type: "text"
          },
          {
            id: "country",
            label: "País",
            type: "select",
            required: true,
            options: [
              { label: "México", value: "mx" },
              { label: "Colombia", value: "co" },
              { label: "Argentina", value: "ar" },
              { label: "Otro", value: "other" }
            ]
          },
          {
            id: "notes",
            label: "Notas adicionales",
            type: "textarea"
          }
        ]
      }
    }
  });

  const pageDefinitions = [
    {
      entryId: "demo-home",
      title: {
        es: "Headless por dentro y fuera",
        en: "Headless from the inside out"
      },
      heroTitle: {
        es: "Construye experiencias omnicanal con Contentful",
        en: "Build omnichannel experiences with Contentful"
      },
      slug: "demo-home",
      template: "landing",
      body: {
        es: richTextParagraph(
          "Presentación central para demostrar la edición de contenido, workflows y multilingüismo en Contentful.",
          "es-ES"
        ),
        en: richTextParagraph(
          "Core presentation page to showcase content editing, workflows and multilingual features in Contentful.",
          "en-US"
        )
      },
      seoTitle: {
        es: "Demo Contentful Home",
        en: "Contentful Demo Home"
      },
      seoDescription: {
        es: "Página central del demo de Contentful preparado por dentsu.",
        en: "Main landing page for the Contentful demo prepared by dentsu."
      },
      formReference: {
        link: leadFormEntry.sys.id
      }
    },
    {
      entryId: "formulario-leads",
      title: {
        es: "Formularios e Integraciones",
        en: "Forms & Integrations"
      },
      heroTitle: {
        es: "Captura leads y envíalos al CRM en minutos",
        en: "Capture leads and push them to the CRM in minutes"
      },
      slug: "formulario-leads",
      template: "standard",
      body: {
        es: richTextParagraph(
          "Configura formularios dinámicos desde Contentful y monitorea la respuesta en tiempo real gracias al CRM simulado.",
          "es-ES"
        ),
        en: richTextParagraph(
          "Configure dynamic forms directly in Contentful and monitor responses in real time through the simulated CRM.",
          "en-US"
        )
      },
      seoTitle: {
        es: "Formularios e Integraciones",
        en: "Forms and Integrations"
      },
      formReference: {
        link: leadFormEntry.sys.id
      }
    },
    {
      entryId: "workflows",
      title: {
        es: "Workflows editoriales",
        en: "Editorial workflows"
      },
      heroTitle: {
        es: "Controla aprobaciones y roles en Contentful",
        en: "Control approvals and roles in Contentful"
      },
      slug: "workflows",
      template: "standard",
      body: {
        es: richTextParagraph(
          "Demuestra cómo los distintos roles (Editor, Revisor, Admin) colaboran usando etapas y comentarios.",
          "es-ES"
        ),
        en: richTextParagraph(
          "Show how different roles (Editor, Reviewer, Admin) collaborate with workflow stages and comments.",
          "en-US"
        )
      },
      seoTitle: {
        es: "Workflows editoriales en Contentful",
        en: "Editorial workflows in Contentful"
      }
    },
    {
      entryId: "multisitio",
      title: {
        es: "Escalabilidad y multi-sitio",
        en: "Scalability & multi-site"
      },
      heroTitle: {
        es: "Gestiona micrositios desde un mismo espacio",
        en: "Manage microsites from a single space"
      },
      slug: "multisitio",
      template: "landing",
      body: {
        es: richTextParagraph(
          "Usa el campo \"site\" para diferenciar propiedades digitales como campañas o landings regionales.",
          "es-ES"
        ),
        en: richTextParagraph(
          "Use the \"site\" field to differentiate digital properties like campaigns or regional landings.",
          "en-US"
        )
      },
      seoTitle: {
        es: "Contentful multi-sitio",
        en: "Contentful multi-site"
      },
      site: {
        es: "corporate",
        en: "corporate"
      }
    }
  ];

  const createdPages = [];

  for (const page of pageDefinitions) {
    const entry = await upsertEntry({
      entryId: page.entryId,
      contentTypeId: "page",
      fields: {
        title: localizedField(page.title.es, page.title.en),
        slug: { value: page.slug },
        template: { value: page.template },
        heroTitle: localizedField(page.heroTitle.es, page.heroTitle.en),
        body: localizedField(page.body.es, page.body.en),
        seoTitle: localizedField(page.seoTitle.es, page.seoTitle.en),
        seoDescription: page.seoDescription
          ? localizedField(page.seoDescription.es, page.seoDescription.en)
          : undefined,
        seoKeywords: page.seoKeywords
          ? {
              value: page.seoKeywords
            }
          : undefined,
        site: page.site ? localizedField(page.site.es, page.site.en) : undefined,
        formReference: page.formReference
          ? {
              value: {
                sys: {
                  type: "Link",
                  linkType: "Entry",
                  id: page.formReference.link
                }
              }
            }
          : undefined
      }
    });
    createdPages.push(entry);
  }

  const navigationEntries = [
    {
      entryId: "nav-demo-home",
      label: {
        es: "Inicio demo",
        en: "Demo home"
      },
      slug: "demo-home",
      order: 1,
      pageId: "demo-home"
    },
    {
      entryId: "nav-demo-form",
      label: {
        es: "Formularios",
        en: "Forms"
      },
      slug: "formulario-leads",
      order: 2,
      pageId: "formulario-leads"
    },
    {
      entryId: "nav-demo-workflows",
      label: {
        es: "Workflows",
        en: "Workflows"
      },
      slug: "workflows",
      order: 3,
      pageId: "workflows"
    },
    {
      entryId: "nav-demo-multisite",
      label: {
        es: "Multi-sitio",
        en: "Multi-site"
      },
      slug: "multisitio",
      order: 4,
      pageId: "multisitio"
    }
  ];

  for (const nav of navigationEntries) {
    await upsertEntry({
      entryId: nav.entryId,
      contentTypeId: "navigationItem",
      fields: {
        label: {
          ...localizedField(nav.label.es, nav.label.en)
        },
        slug: { value: nav.slug },
        order: { value: nav.order },
        page: {
          value: {
            sys: {
              type: "Link",
              linkType: "Entry",
              id: nav.pageId
            }
          }
        }
      }
    });
  }

  spinner.succeed("Seed de Contentful completado con éxito");
  console.log(
    "\nEntradas creadas y publicadas. Valida en Contentful que los workflows y roles estén configurados según tu demo."
  );
}

run().catch((error) => {
  spinner.fail("Seed falló");
  console.error(error);
  process.exit(1);
});
