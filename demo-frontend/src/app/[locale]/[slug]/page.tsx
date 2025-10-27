import { Suspense } from "react";

import Image from "next/image";
import { notFound } from "next/navigation";

import LeadForm from "@/components/LeadForm";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import NavigationMenu from "@/components/NavigationMenu";
import RichTextRenderer from "@/components/RichTextRenderer";
import type { LeadFormConfig } from "@/components/LeadForm";
import {
  getLeadFormById,
  getPageBySlug,
  type LeadFormEntry,
  type LeadFormFields,
  type PageEntryFields
} from "@/lib/contentful";

type PageProps = {
  params: {
    locale: string;
    slug: string;
  };
};

export async function generateMetadata({ params }: PageProps) {
  const page = await getPageBySlug(params.locale, params.slug);
  if (!page) {
    return {};
  }

  const fields = page.fields as PageEntryFields;

  return {
    title: fields.seoTitle ?? fields.title,
    description: fields.seoDescription ?? "",
    alternates: {
      canonical: fields.url ?? `/${params.locale}/${params.slug}`
    },
    keywords: fields.seoKeywords
  };
}

function mapLeadForm(entry: LeadFormEntry | null) {
  if (!entry) {
    return null;
  }

  const entryFields = entry.fields as unknown as LeadFormFields;
  const fields = entryFields.fields ?? [];

  const config: LeadFormConfig = {
    sysId: entry.sys.id,
    title: entryFields.internalName ?? "Captura de lead",
    description: entryFields.description,
    successMessage: entryFields.successMessage,
    fields: fields.map((field) =>
      field.type === "select"
        ? {
            id: field.id,
            label: field.label,
            type: "select",
            required: field.required,
            options: field.options ?? []
          }
        : {
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required
          }
    )
  };

  return config;
}

export default async function Page({ params }: PageProps) {
  const page = await getPageBySlug(params.locale, params.slug);
  if (!page) {
    notFound();
  }

  const fields = page.fields as PageEntryFields;

  const formConfig =
    fields.formReference?.sys?.id
      ? mapLeadForm(
          await getLeadFormById(
            fields.formReference.sys.id,
            params.locale
          )
        )
      : null;

  const assetUrl = fields.heroImage?.fields?.file?.url;
  const heroImageUrl = assetUrl
    ? assetUrl.startsWith("http")
      ? assetUrl
      : `https:${assetUrl}`
    : null;

  return (
    <>
      <NavigationMenu locale={params.locale} />
      <main className="container page-content">
        <section className="card hero-card">
          <div className="hero-card__top">
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
          </div>
          <h1>{fields.heroTitle ?? fields.title}</h1>
          {heroImageUrl && (
          <div className="hero-card__image">
            <Image
              src={heroImageUrl}
              alt={fields.heroImage?.fields?.title ?? ""}
              width={1200}
              height={640}
              unoptimized
              priority
            />
          </div>
        )}
        </section>

        <section className="card">
          <RichTextRenderer document={fields.body as any} />
        </section>

        {formConfig && (
          <section>
            <LeadForm config={formConfig} />
          </section>
        )}
      </main>
    </>
  );
}
