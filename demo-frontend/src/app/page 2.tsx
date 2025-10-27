import { Suspense } from "react";

import Link from "next/link";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import PageHealth from "@/components/PageHealth";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <main className="container">
      <section className="card">
        <h1>Demo de Contentful para Dentsu</h1>
        <p>
          Punto de partida para mostrar cómo Contentful habilita experiencias
          omnicanal con flujos editoriales avanzados.
        </p>
        <Suspense fallback={null}>
          <LocaleSwitcher />
        </Suspense>
      </section>

      <section className="card grid grid-2">
        <article>
          <h2>Escenarios clave</h2>
          <ol>
            <li>
              <Link href="/es/demo-home">Creación y publicación de contenidos</Link>
            </li>
            <li>
              <Link href="/es/formulario-leads">Gestión de formularios e integraciones</Link>
            </li>
            <li>
              <Link href="/es/demo-home?langSwitcher=true">
                Multilingüismo (ES/EN)
              </Link>
            </li>
            <li>
              <Link href="/es/workflows">Gestión de usuarios y aprobaciones</Link>
            </li>
            <li>
              <Link href="/es/multisitio">Escalabilidad y multi-sitio</Link>
            </li>
          </ol>
        </article>

        <PageHealth />
      </section>
    </main>
  );
}
