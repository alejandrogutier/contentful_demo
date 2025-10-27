#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import contentfulManagement from "contentful-management";
import ora from "ora";

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

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(decodeURIComponent(scriptDir), "..");
const mediaDir = path.resolve(projectRoot, "media");

const spinner = ora("Conectando con Contentful...").start();

const assetsToUpload = [
  {
    id: "hero-demo-home",
    title: "Skyline con grúas y edificios en construcción",
    description:
      "Vista aérea de proyecto urbano en construcción con grúas y edificios.",
    fileName: "francesca-tosolini-6japTIjUQoI-unsplash.jpg"
  },
  {
    id: "hero-formulario",
    title: "Arquitectos revisando planos en obra",
    description:
      "Equipo de arquitectos analizando planos en un sitio de construcción.",
    fileName: "glenov-brankovic-ZYUcxbMeaIY-unsplash.jpg"
  },
  {
    id: "hero-workflows",
    title: "Supervisor de obra observando el avance",
    description:
      "Ingeniero con casco supervisando la construcción en el lugar.",
    fileName: "jason-dent-w3eFhqXjkZE-unsplash.jpg"
  },
  {
    id: "hero-multisitio",
    title: "Panorama urbano moderno",
    description:
      "Vista panorámica de desarrollo urbano con edificios modernos.",
    fileName: "joe-holland-80zZ1s24Nag-unsplash.jpg"
  },
  {
    id: "modular-housing",
    title: "Construcción modular residencial",
    description:
      "Vista de casas modulares en proceso de construcción.",
    fileName: "josh-olalde-X1P1_EDNnok-unsplash.jpg"
  },
  {
    id: "corporate-campus",
    title: "Complejo corporativo premium",
    description:
      "Complejo de oficinas de alto nivel con áreas verdes.",
    fileName: "webaliser-_TPTXZd9mOo-unsplash.jpg"
  }
];

async function run() {
  if (!fs.existsSync(mediaDir)) {
    spinner.fail(`No existe la carpeta media en ${mediaDir}`);
    process.exit(1);
  }

  const client = createClient({
    accessToken: CONTENTFUL_MANAGEMENT_TOKEN
  });

  const space = await client.getSpace(CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(CONTENTFUL_ENVIRONMENT);
  spinner.succeed("Conexión establecida.");

  const locales = await environment.getLocales();
  const defaultLocale =
    locales.items.find((locale) => locale.default)?.code ?? "en-US";
  const secondaryLocale = locales.items.find(
    (locale) => !locale.default && locale.code.startsWith("es")
  )?.code;

  for (const assetConfig of assetsToUpload) {
    const filePath = path.join(mediaDir, assetConfig.fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(
        `[upload-assets] No se encontró el archivo ${assetConfig.fileName}, se omite.`
      );
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    spinner.start(`Subiendo asset ${assetConfig.id}...`);

    let asset;
    try {
      asset = await environment.getAsset(assetConfig.id);
      asset.fields.title = {
        ...asset.fields.title,
        [defaultLocale]: assetConfig.title
      };
      asset.fields.description = {
        ...asset.fields.description,
        [defaultLocale]: assetConfig.description
      };
    } catch (error) {
      if (error.name === "NotFound") {
        asset = await environment.createAssetWithId(assetConfig.id, {
          fields: {
            title: {
              [defaultLocale]: assetConfig.title
            },
            description: {
              [defaultLocale]: assetConfig.description
            }
          }
        });
      } else {
        throw error;
      }
    }

    const upload = await environment.createUpload({
      file: fileBuffer
    });

    const uploadLink = {
      sys: {
        type: "Link",
        linkType: "Upload",
        id: upload.sys.id
      }
    };

    asset.fields.file = asset.fields.file ?? {};
    asset.fields.file[defaultLocale] = {
      contentType: "image/jpeg",
      fileName: assetConfig.fileName,
      uploadFrom: uploadLink
    };

    if (secondaryLocale) {
      asset.fields.title[secondaryLocale] = assetConfig.title;
      asset.fields.description[secondaryLocale] = assetConfig.description;
      asset.fields.file[secondaryLocale] = {
        contentType: "image/jpeg",
        fileName: assetConfig.fileName,
        uploadFrom: uploadLink
      };
    }

    const updatedAsset = await asset.update();
    await updatedAsset.processForAllLocales();
    const processedAsset = await environment.getAsset(assetConfig.id);
    await processedAsset.publish();

    spinner.succeed(`Asset ${assetConfig.id} publicado.`);
  }

  spinner.succeed("Carga de assets completada.");
}

run().catch((error) => {
  spinner.fail("Fallo la carga de assets.");
  console.error(error);
  process.exit(1);
});
