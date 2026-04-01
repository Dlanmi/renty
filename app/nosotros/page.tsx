import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getButtonClasses } from "@/components/ui/Button";
import StructuredData from "@/components/seo/StructuredData";
import { SITE_NAME, buildPageMetadata, toAbsoluteUrl } from "@/lib/domain/seo";

const HOW_IT_WORKS = [
  "Explora arriendos disponibles",
  "Filtra por lo que necesitas",
  "Contacta directamente por WhatsApp",
];

const YOU_CAN_DO = [
  { icon: "home_work", text: "Explorar arriendos disponibles en Bogotá" },
  { icon: "tune", text: "Filtrar propiedades por precio, ubicación o características" },
  { icon: "chat", text: "Contactar directamente por WhatsApp" },
  { icon: "shield", text: "Acceder a información clara y recomendaciones de seguridad" },
];


export const metadata: Metadata = buildPageMetadata({
  title: "Sobre Renty y cómo funciona",
  description:
    "Conoce qué es Renty, cómo funciona la plataforma y cómo facilita encontrar vivienda en arriendo en Bogotá con información clara y contacto directo.",
  path: "/nosotros",
  keywords: [
    "que es Renty",
    "como funciona Renty",
    "plataforma de arriendos en Bogota",
    "buscar vivienda en Bogota",
    "arriendos con contacto directo",
  ],
});

export default function AboutPage() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `Sobre ${SITE_NAME}`,
    url: toAbsoluteUrl("/nosotros"),
    description:
      "Información sobre la plataforma Renty y su propuesta para encontrar arriendos en Bogotá.",
    about: {
      "@type": "Organization",
      name: SITE_NAME,
      url: toAbsoluteUrl("/"),
      areaServed: "Bogotá, Colombia",
    },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:space-y-10 lg:py-10">
      <StructuredData id="about-structured-data" data={aboutJsonLd} />
      <section className="relative overflow-hidden rounded-card-lg border border-bg-border bg-bg-surface px-5 py-8 text-center shadow-card sm:px-8 sm:py-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#6366f1]/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <p className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dark/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            <Icon name="home_work" size={14} />
            Sobre Renty
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-t-primary sm:text-4xl">
            Encontrar vivienda debería ser más simple
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-t-secondary">
            Renty es una plataforma diseñada para ayudar a las personas a
            encontrar vivienda de forma más fácil y transparente.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className={getButtonClasses("primary", "lift-hover rounded-xl px-5")}
            >
              <Icon name="search" size={18} />
              Explorar arriendos
            </Link>
            <Link
              href="/publicar"
              className={getButtonClasses("secondary", "lift-hover rounded-xl")}
            >
              <Icon name="add_home" size={18} />
              Publicar inmueble
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-t-primary">Cómo funciona</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-t-secondary">
            Un flujo simple para reducir fricción y ayudarte a encontrar vivienda más rápido.
          </p>
        </div>

        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <li
              key={step}
              className="rounded-xl border border-bg-border bg-bg-elevated p-4"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-2 text-sm font-semibold text-t-primary">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold text-t-primary">Qué es Renty</h2>
        <p className="mt-3 text-sm leading-relaxed text-t-secondary">
          En lugar de perder tiempo caminando por barrios o revisando cientos
          de anuncios confusos, Renty reúne información clara sobre propiedades
          disponibles y facilita el contacto directo con quienes las ofrecen.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-t-secondary">
          Nuestro objetivo es simple: hacer que encontrar un lugar para vivir
          sea un proceso rápido, claro y confiable.
        </p>
      </section>

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold text-t-primary">
          Qué puedes hacer en Renty
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {YOU_CAN_DO.map((item) => (
            <li
              key={item.text}
              className="flex items-start gap-2 rounded-xl border border-bg-border bg-bg-elevated p-3 text-sm text-t-secondary"
            >
              <Icon
                name={item.icon}
                size={18}
                className="mt-0.5 shrink-0 text-accent"
              />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold text-t-primary">Nuestro objetivo</h2>
        <p className="mt-3 text-sm leading-relaxed text-t-secondary">
          Renty nació de una pregunta simple: ¿por qué encontrar arriendo en
          Bogotá tiene que ser tan complicado? Después de meses entendiendo el
          problema de primera mano, construimos la plataforma que nos habría
          gustado tener.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-t-secondary">
          Miles de personas en Bogotá pasan días o semanas buscando vivienda.
          Nuestro objetivo es hacer ese proceso más rápido, claro y confiable.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-t-secondary">
          Hoy Renty se enfoca en facilitar la búsqueda de arriendos con
          información clara, fotos reales y contacto directo. En el futuro,
          queremos incluir más formas de encontrar vivienda en la ciudad.
        </p>
      </section>

      <section className="rounded-2xl border border-accent/30 bg-accent-dark/20 p-5 text-center shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Renty
        </p>
        <p className="mx-auto mt-3 max-w-md text-lg font-semibold text-t-primary">
          ¿Listo para encontrar tu arriendo?
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-t-secondary">
          Menos tiempo buscando. Más tiempo viviendo.
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className={getButtonClasses("primary", "lift-hover rounded-xl px-5")}
          >
            <Icon name="search" size={18} />
            Explorar arriendos
          </Link>
        </div>
      </section>
    </div>
  );
}
