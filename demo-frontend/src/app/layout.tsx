import type { Metadata } from "next";
import clsx from "clsx";

import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Contentful Demo - Dentsu",
    template: "%s | Contentful Demo"
  },
  description:
    "Demo preparado para exhibir capacidades de Contentful: edición, workflows, multisitio, multilenguaje e integraciones."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={clsx("bg-slate-50 text-slate-900 antialiased", "min-h-screen")}
      >
        <ClientProviders />
        {children}
      </body>
    </html>
  );
}
