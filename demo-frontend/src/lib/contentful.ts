import { createClient } from "contentful";
import type { Document } from "@contentful/rich-text-types";

const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const deliveryToken = process.env.CONTENTFUL_DELIVERY_TOKEN;
const previewToken = process.env.CONTENTFUL_PREVIEW_TOKEN ?? deliveryToken;
const forceDemo = process.env.CONTENTFUL_FORCE_DEMO === "true";

function assertConfig() {
  if (!space) {
    throw new Error("CONTENTFUL_SPACE_ID no está definido");
  }
  if (!deliveryToken) {
    throw new Error("CONTENTFUL_DELIVERY_TOKEN no está definido");
  }
  if (!previewToken) {
    throw new Error("CONTENTFUL_PREVIEW_TOKEN no está definido");
  }
}

const getClient = (preview = false) => {
  assertConfig();

  return createClient({
    space: space!,
    environment,
    accessToken: preview ? previewToken! : deliveryToken!,
    host: preview ? "preview.contentful.com" : "cdn.contentful.com"
  });
};

type ContentfulEntry<T> = {
  sys: {
    id: string;
  };
  fields: T;
};

export type PageEntryFields = {
  title: string;
  slug: string;
  template: "landing" | "standard";
  heroTitle?: string;
  heroImage?: {
    fields: {
      title: string;
      file: {
        url: string;
      };
    };
  };
  body?: any;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  url?: string;
  formReference?: {
    sys?: {
      id?: string;
    };
  };
  site?: string;
};

export type LeadFormFields = {
  internalName: string;
  successMessage?: string;
  description?: string;
  fields: Array<{
    id: string;
    label: string;
    type: "text" | "email" | "phone" | "textarea" | "select";
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
};

export type PageEntry = ContentfulEntry<PageEntryFields>;
export type LeadFormEntry = ContentfulEntry<LeadFormFields>;

function resolveLocale(locale: string) {
  if (locale === "es") return "es-ES";
  if (locale === "en") return "en-US";
  return locale;
}

function isUnknownLocaleError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string" &&
    (error as any).message.toLowerCase().includes("unknown locale")
  );
}

function isUnknownContentTypeError(error: any) {
  if (!error) {
    return false;
  }
  if (
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("unknowncontenttype")
  ) {
    return true;
  }
  const errors = error?.details?.errors;
  if (Array.isArray(errors)) {
    return errors.some(
      (item) =>
        typeof item?.name === "string" &&
        item.name.toLowerCase() === "unknowncontenttype"
    );
  }
  return false;
}

function createRichText(text: string): Document {
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

const FALLBACK_LEAD_FORM: LeadFormEntry = {
  sys: { id: "fallbackLeadForm" },
  fields: {
    internalName: "Formulario de proyectos constructivos",
    description:
      "Dinos qué tipo de desarrollo necesitas y agenda una asesoría técnica con nuestro equipo.",
    successMessage:
      "Gracias por tu interés. Un especialista de Construtech Dentsu te contactará en breve.",
    fields: [
      { id: "fullName", label: "Nombre completo", type: "text", required: true },
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
        id: "country",
        label: "Ubicación del proyecto",
        type: "select",
        required: true,
        options: [
          { label: "CDMX / Área Metropolitana", value: "cdmx" },
          { label: "Monterrey", value: "mty" },
          { label: "Bogotá", value: "bogota" },
          { label: "Otro mercado LATAM", value: "latam" }
        ]
      },
      {
        id: "projectType",
        label: "Tipo de proyecto",
        type: "select",
        required: true,
        options: [
          { label: "Residencial vertical", value: "residential" },
          { label: "Corporativo / Oficinas", value: "corporate" },
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
      { id: "notes", label: "Comentarios adicionales", type: "textarea" }
    ]
  }
};

const FALLBACK_PAGES: Record<string, PageEntry> = {
  "demo-home": {
    sys: { id: "demo-home" },
    fields: {
      title: "Soluciones constructivas 360°",
      slug: "demo-home",
      template: "landing",
      heroTitle: "Edificamos ciudades inteligentes y sostenibles",
      heroImage: {
        fields: {
          title: "Equipo de construcción revisando planos",
          file: {
            url: "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?auto=format&fit=crop&w=1600&q=80"
          }
        }
      },
      body: createRichText(
        "Integramos planeación, arquitectura BIM y ejecución en campo para entregar desarrollos residenciales, corporativos e industriales con ahorros de hasta el 30 % en tiempos de obra."
      ),
      seoTitle: "Construtech Dentsu | Soluciones constructivas 360°",
      seoDescription:
        "Modelo end-to-end para desarrolladores inmobiliarios: desde prefactibilidad y permisos hasta construcción y operación digital.",
      formReference: {
        sys: { id: FALLBACK_LEAD_FORM.sys.id }
      }
    }
  },
  "formulario-leads": {
    sys: { id: "formulario-leads" },
    fields: {
      title: "Agenda una reunión",
      slug: "formulario-leads",
      template: "standard",
      heroTitle: "Comparte los detalles clave de tu próximo desarrollo",
      heroImage: {
        fields: {
          title: "Arquitectos analizando planos",
          file: {
            url: "https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=1600&q=80"
          }
        }
      },
      body: createRichText(
        "Completa el formulario y recibe una propuesta técnica y financiera personalizada en un plazo máximo de 48 horas."
      ),
      seoTitle: "Construtech Dentsu | Contacto",
      seoDescription:
        "Contacta a nuestros especialistas en construcción modular y proyectos a gran escala.",
      formReference: {
        sys: { id: FALLBACK_LEAD_FORM.sys.id }
      }
    }
  },
  workflows: {
    sys: { id: "workflows" },
    fields: {
      title: "Control operativo en obra",
      slug: "workflows",
      template: "standard",
      heroTitle: "Aprobaciones, QA/QC y reportes diarios bajo un mismo panel",
      heroImage: {
        fields: {
          title: "Supervisión de obra en campo",
          file: {
            url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80"
          }
        }
      },
      body: createRichText(
        "Monitorea avance de frentes de obra, bitácoras fotográficas y estados financieros con dashboards en tiempo real para inversionistas y supervisores."
      ),
      seoTitle: "Construtech Dentsu | Control operativo"
    }
  },
  multisitio: {
    sys: { id: "multisitio" },
    fields: {
      title: "Portafolios multi-ciudad",
      slug: "multisitio",
      template: "landing",
      heroTitle: "Gestiona desarrollos en CDMX, Monterrey y Bogotá con un solo stack",
      heroImage: {
        fields: {
          title: "Panorama aéreo de desarrollo urbano",
          file: {
            url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80"
          }
        }
      },
      body: createRichText(
        "Centraliza branding, procurement y reporting financiero para cada proyecto inmobiliario dentro de una misma plataforma multisitio."
      ),
      seoTitle: "Construtech Dentsu | Multi-sitio",
      site: "construtech"
    }
  }
};

const FALLBACK_NAVIGATION = [
  {
    sys: { id: "nav-1" },
    fields: { label: "Servicios", slug: "demo-home", order: 1 }
  },
  {
    sys: { id: "nav-2" },
    fields: { label: "Proyectos", slug: "formulario-leads", order: 2 }
  },
  {
    sys: { id: "nav-3" },
    fields: { label: "Operación en obra", slug: "workflows", order: 3 }
  },
  {
    sys: { id: "nav-4" },
    fields: { label: "Portafolio corporativo", slug: "multisitio", order: 4 }
  }
];

function getFallbackPage(slug: string) {
  return FALLBACK_PAGES[slug] ?? null;
}

function getFallbackLeadForm(id: string) {
  if (id === FALLBACK_LEAD_FORM.sys.id) {
    return FALLBACK_LEAD_FORM;
  }
  return null;
}

export async function getPageBySlug(
  locale: string,
  slug: string,
  opts: { preview?: boolean } = {}
): Promise<PageEntry | null> {
  if (forceDemo) {
    return getFallbackPage(slug);
  }

  const client = getClient(opts.preview);
  const resolvedLocale = resolveLocale(locale);

  const baseQuery = {
    content_type: "page",
    "fields.slug": slug,
    include: 2,
    limit: 1
  } as const;

  console.info("[contentful] getPageBySlug query", {
    slug,
    locale: resolvedLocale
  });

  let result;
  try {
    result = await client.getEntries<PageEntryFields>({
      ...baseQuery,
      locale: resolvedLocale
    });
  } catch (error) {
    if (isUnknownLocaleError(error)) {
      result = await client.getEntries<PageEntryFields>(baseQuery as any);
    } else if (isUnknownContentTypeError(error)) {
      console.warn("[contentful] content type no disponible, usando fallback", error);
      return getFallbackPage(slug);
    } else {
      console.warn("[contentful] error fetching page, using fallback", error);
      return getFallbackPage(slug);
    }
  }
  const items = (result?.items as PageEntry[]) ?? [];
  const [entry] = items;
  return entry ?? getFallbackPage(slug);
}

export async function getLeadFormById(
  id: string,
  locale: string,
  opts: { preview?: boolean } = {}
): Promise<LeadFormEntry> {
  if (forceDemo) {
    const fallback = getFallbackLeadForm(id);
    return fallback ?? FALLBACK_LEAD_FORM;
  }

  const client = getClient(opts.preview);
  const resolvedLocale = resolveLocale(locale);

  const fallbackById = getFallbackLeadForm(id);
  if (fallbackById) {
    return fallbackById;
  }

  try {
    const entry = (await client.getEntry<LeadFormFields>(id, {
      locale: resolvedLocale,
      include: 0
    })) as LeadFormEntry;
    return entry ?? FALLBACK_LEAD_FORM;
  } catch (error) {
    if (isUnknownLocaleError(error)) {
      const entry = (await client.getEntry<LeadFormFields>(id, {
        include: 0
      })) as LeadFormEntry;
      return entry ?? FALLBACK_LEAD_FORM;
    }
    if (isUnknownContentTypeError(error)) {
      console.warn("[contentful] lead form no disponible, usando fallback", error);
      return FALLBACK_LEAD_FORM;
    }
    console.warn("[contentful] error fetching lead form, using fallback", error);
    return FALLBACK_LEAD_FORM;
  }
}

export async function getNavigation(locale: string) {
  if (forceDemo) {
    return FALLBACK_NAVIGATION;
  }

  const client = getClient();
  const resolvedLocale = resolveLocale(locale);

  try {
    const result = await client.getEntries({
      content_type: "navigationItem",
      locale: resolvedLocale,
      order: "fields.order"
    });
    return result.items.length > 0 ? result.items : FALLBACK_NAVIGATION;
  } catch (error) {
    if (isUnknownLocaleError(error)) {
      const result = await client.getEntries({
        content_type: "navigationItem",
        order: "fields.order"
      });
      return result.items.length > 0 ? result.items : FALLBACK_NAVIGATION;
    }
    if (isUnknownContentTypeError(error)) {
      console.warn("[contentful] navigation content type no disponible, usando fallback", error);
      return FALLBACK_NAVIGATION;
    }
    console.warn("[contentful] error fetching navigation, using fallback", error);
    return FALLBACK_NAVIGATION;
  }
}
