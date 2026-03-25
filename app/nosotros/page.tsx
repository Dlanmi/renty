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

const BRAND_PHRASES = [
  "Renty — encontrar vivienda no debería ser complicado.",
  "Menos tiempo buscando. Más tiempo viviendo.",
  "Encuentra arriendos en Bogotá de forma simple.",
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
      <section className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-white px-5 py-8 text-center shadow-card sm:px-8 sm:py-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-100/75 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-orange-100/65 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <p className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
            <Icon name="home_work" size={14} />
            Sobre Renty
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl">
            Encontrar vivienda debería ser más simple
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
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

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-900">Cómo funciona</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Un flujo simple para reducir fricción y ayudarte a encontrar vivienda más rápido.
          </p>
        </div>

        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <li
              key={step}
              className="rounded-xl border border-stone-200 bg-stone-50 p-4"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-2 text-sm font-semibold text-stone-900">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold text-stone-900">Qué es Renty</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          En lugar de perder tiempo caminando por barrios o revisando cientos
          de anuncios confusos, Renty reúne información clara sobre propiedades
          disponibles y facilita el contacto directo con quienes las ofrecen.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          Nuestro objetivo es simple: hacer que encontrar un lugar para vivir
          sea un proceso rápido, claro y confiable.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold text-stone-900">
          Qué puedes hacer en Renty
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {YOU_CAN_DO.map((item) => (
            <li
              key={item.text}
              className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700"
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

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold text-stone-900">Nuestro objetivo</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          Renty comenzó como un proyecto académico, pero rápidamente
          entendimos que el problema que queríamos resolver era mucho más
          grande.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          Miles de personas en Bogotá pasan días o semanas buscando vivienda.
          Nuestro objetivo es construir una plataforma que haga ese proceso más
          sencillo.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          Hoy Renty se enfoca en facilitar la búsqueda de arriendos. En el
          futuro, la plataforma está pensada para incluir más formas de
          encontrar vivienda, como propiedades en venta o alquileres temporales.
        </p>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
          Renty
        </p>
        <div className="mt-3 space-y-2">
          {BRAND_PHRASES.map((phrase) => (
            <p key={phrase} className="text-sm font-medium text-stone-800">
              {phrase}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
