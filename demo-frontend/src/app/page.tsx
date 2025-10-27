import Image from "next/image";
import Link from "next/link";

import NavigationMenu from "@/components/NavigationMenu";
import PageHealth from "@/components/PageHealth";

const DEFAULT_LOCALE = "es";

const showcaseCards = [
  {
    title: "Master planning con data en tiempo real",
    description:
      "Centralizamos prefactibilidad, permisos y modelados BIM para que cada obra arranque con precisión financiera y de cronograma.",
    href: `/${DEFAULT_LOCALE}/demo-home`,
    tag: "Planeación"
  },
  {
    title: "Relación comercial transparente",
    description:
      "Integra a inversionistas, brokers y equipos legales en un mismo tablero, con reporting disponible 24/7 desde Contentful.",
    href: `/${DEFAULT_LOCALE}/formulario-leads`,
    tag: "Ventas"
  },
  {
    title: "Workflows de obra hiper-documentados",
    description:
      "Seguimiento diario de avances, control de cambios y evidencias fotográficas para cada frente de trabajo en campo.",
    href: `/${DEFAULT_LOCALE}/workflows`,
    tag: "Operación"
  },
  {
    title: "Gestión multi-sitio corporativa",
    description:
      "Maneja portafolios en CDMX, Monterrey y Bogotá desde un único stack que replica branding, procurement y BI financiero.",
    href: `/${DEFAULT_LOCALE}/multisitio`,
    tag: "Corporativo"
  }
];

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <NavigationMenu locale={DEFAULT_LOCALE} />
      <main className="container page-content">
        <section className="card hero-card">
          <div className="hero-card__top">
            <Link className="locale-pill" href="/en/demo-home">
              View in English
            </Link>
          </div>
          <h1>Construcción inteligente centrada en datos y experiencia digital</h1>
          <p>
            Construtech Dentsu orquesta cada fase del desarrollo inmobiliario,
            conectando stakeholders, cuadrillas y clientes finales con un único
            hub de contenido en Contentful.
          </p>
          <div className="hero-card__image">
            <Image
              src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80"
              alt="Skyline con grúas y edificios en construcción"
              width={1600}
              height={820}
              unoptimized
              priority
            />
          </div>
        </section>

        <section className="card">
          <h2>¿Qué explorar en el demo?</h2>
          <div className="feature-grid">
            {showcaseCards.map((card) => (
              <Link key={card.href} href={card.href} className="feature-card">
                <span>{card.tag}</span>
                <strong>{card.title}</strong>
                <p>{card.description}</p>
                <span>Ver detalle →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Checklist técnico</h2>
          <PageHealth />
        </section>
      </main>
    </>
  );
}
