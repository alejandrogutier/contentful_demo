module.exports = function (migration) {
  const page = migration
    .createContentType("page")
    .name("Page")
    .description("Página gestionada desde Contentful con soporte multi-sitio")
    .displayField("title");

  page.createField("title").name("Título").type("Symbol").required(true);
  page.createField("slug").name("Slug").type("Symbol").required(true);
  page.createField("template").name("Template").type("Symbol").required(true).validations([
    {
      in: ["landing", "standard"]
    }
  ]);
  page.createField("site").name("Sitio/Micrositio").type("Symbol").required(false).localized(true);
  page.createField("heroTitle").name("Título de Hero").type("Symbol").localized(true);
  page.createField("heroImage").name("Imagen de Hero").type("Link").linkType("Asset");
  page.createField("body").name("Contenido principal").type("RichText").required(false);
  page
    .createField("formReference")
    .name("Formulario asociado")
    .type("Link")
    .linkType("Entry")
    .validations([
      {
        linkContentType: ["leadForm"]
      }
    ]);
  page.createField("seoTitle").name("SEO Title").type("Symbol").localized(true);
  page.createField("seoDescription").name("SEO Description").type("Text").localized(true);
  page.createField("seoKeywords").name("SEO Keywords").type("Array").items({
    type: "Symbol"
  });
  page.createField("url").name("URL amigable override").type("Symbol").localized(true);

  page.changeFieldControl("body", "builtin", "richTextEditor");
  page.changeFieldControl("template", "builtin", "dropdown");
  page.changeFieldControl("formReference", "builtin", "entryLinkEditor", {
    showCreateEntityAction: false,
    showLinkEntityAction: true
  });

  page.createField("workflowStage").name("workflowStage").type("Symbol").required(false);

  page.createField("tags").name("Etiquetas").type("Array").items({ type: "Symbol" });

  page.createField("seoMetaImage").name("SEO Meta Image").type("Link").linkType("Asset");

  page.createField("summary").name("Resumen").type("Text").localized(true);

  page.createField("callToAction").name("CTA principal").type("Object").localized(true);

  page.changeEditorInterface("callToAction", "structuredTextEditor");

  page.createField("relatedPages").name("Paginas relacionadas").type("Array").items({
    type: "Link",
    linkType: "Entry",
    validations: [
      {
        linkContentType: ["page"]
      }
    ]
  });

  page.createField("seoIndex").name("Permitir indexación").type("Boolean").required(false);

  const leadForm = migration
    .createContentType("leadForm")
    .name("Lead Form")
    .description("Configuración de formularios de captura de leads")
    .displayField("internalName");

  leadForm.createField("internalName").name("Nombre interno").type("Symbol").required(true);
  leadForm.createField("description").name("Descripción").type("Text").localized(true);
  leadForm.createField("successMessage").name("Mensaje de éxito").type("Text").localized(true);
  leadForm
    .createField("fields")
    .name("Campos")
    .type("Object")
    .required(true);

  leadForm.changeFieldControl("fields", "builtin", "jsonEditor");

  const navigation = migration
    .createContentType("navigationItem")
    .name("Navegación")
    .displayField("label");

  navigation.createField("label").name("Etiqueta").type("Symbol").required(true).localized(true);
  navigation.createField("slug").name("Slug destino").type("Symbol").required(true);
  navigation.createField("order").name("Orden").type("Integer").required(true);
  navigation.createField("site").name("Sitio").type("Symbol").required(false);
  navigation
    .createField("page")
    .name("Página asociada")
    .type("Link")
    .linkType("Entry")
    .validations([
      {
        linkContentType: ["page"]
      }
    ]);
};
