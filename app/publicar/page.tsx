import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getButtonClasses } from "@/components/ui/Button";
import StructuredData from "@/components/seo/StructuredData";
import { SITE_NAME, buildPageMetadata, toAbsoluteUrl } from "@/lib/domain/seo";

const WHATSAPP_PUBLISH_URL = "https://wa.me/573144436688";

const WHY_RENTY = [
  "Publicación clara y organizada del inmueble",
  "Contacto directo por WhatsApp con interesados reales",
  "Acompañamiento humano para cargar y optimizar tu anuncio",
  "Experiencia simple para quien busca y para quien publica",
];

const PUBLISH_STEPS = [
  {
    title: "Cuéntanos tu inmueble",
    description:
      "Nos escribes por WhatsApp con los datos básicos: ubicación, precio y tipo de propiedad.",
    icon: "chat",
  },
  {
    title: "Nos envías fotos y detalles",
    description:
      "Te pedimos información clave para que el anuncio se entienda fácil y genere confianza.",
    icon: "photo_camera",
  },
  {
    title: "Publicamos y te conectamos",
    description:
      "Subimos tu inmueble en Renty y recibes contactos directos para cerrar más rápido.",
    icon: "rocket_launch",
  },
];

const REQUIRED_INFO = [
  "Título del inmueble y descripción corta",
  "Barrio o ubicación aproximada en Bogotá",
  "Precio mensual y número de habitaciones y baños",
  "Características importantes: parqueadero, amoblado, servicios y reglas",
  "Fotos reales y recientes del inmueble",
  "Número de WhatsApp para contacto",
];

const FAQ = [
  {
    q: "¿Qué tipo de inmuebles puedo publicar?",
    a: "Apartamentos, casas, apartaestudios y habitaciones en arriendo en Bogotá.",
  },
  {
    q: "¿Necesito saber usar un panel técnico?",
    a: "No. Tú nos compartes la información por WhatsApp y nosotros hacemos la carga por ti.",
  },
  {
    q: "¿Cómo recibo los interesados?",
    a: "Directamente por WhatsApp, sin formularios complicados ni procesos largos.",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Publicar inmueble en Bogotá",
  description:
    "Publica tu apartamento, casa o habitación en arriendo en Bogotá y recibe contactos directos por WhatsApp con acompañamiento humano.",
  path: "/publicar",
  keywords: [
    "publicar inmueble en Bogota",
    "publicar apartamento en arriendo",
    "publicar habitacion en arriendo",
    "publicar casa en arriendo",
    "anuncio de arriendo por WhatsApp",
  ],
});

export default function PublishPage() {
  const serviceJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `Publicar inmueble en ${SITE_NAME}`,
      areaServed: "Bogotá",
      serviceType: "Publicación de inmuebles en arriendo",
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        url: toAbsoluteUrl("/"),
      },
      url: toAbsoluteUrl("/publicar"),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:space-y-10 lg:py-10">
      <StructuredData id="publish-structured-data" data={serviceJsonLd} />
      <section className="relative overflow-hidden rounded-card-lg border border-bg-border bg-bg-surface px-5 py-8 text-center shadow-card sm:px-8 sm:py-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#6366f1]/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <p className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dark/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            <Icon name="verified" size={14} />
            Publicación asistida
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-t-primary sm:text-4xl">
            Publica tu inmueble en{" "}
            <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
              Renty
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-t-secondary">
            Te ayudamos a publicar tu arriendo con información clara, fotos
            bien presentadas y contacto directo por WhatsApp para que cierres
            más rápido.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={WHATSAPP_PUBLISH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lift-hover inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#22c55e] hover:shadow-[0_0_20px_rgba(37,211,102,0.2)]"
            >
              <Icon name="chat" size={18} />
              Quiero publicar mi inmueble
              <span className="sr-only">(abre en nueva pestaña)</span>
            </a>

            <Link
              href="/"
              className={getButtonClasses("secondary", "lift-hover rounded-xl")}
            >
              <Icon name="home" size={18} />
              Ir al sitio
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-t-primary">
            ¿Por qué publicar con Renty?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-t-secondary">
            Menos fricción para publicar, más claridad para atraer buenos
            contactos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_RENTY.map((item) => (
            <article
              key={item}
              className="lift-hover rounded-2xl border border-bg-border bg-bg-surface p-4 text-center shadow-card"
            >
              <Icon name="task_alt" size={18} className="text-accent" />
              <p className="mt-2 text-sm font-medium leading-relaxed text-t-secondary">
                {item}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-t-primary">Cómo publicar</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-t-secondary">
            Proceso simple en 3 pasos. Nosotros te acompañamos en todo el
            flujo.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {PUBLISH_STEPS.map((item, index) => (
            <article
              key={item.title}
              className="h-full rounded-2xl border border-bg-border bg-bg-elevated p-5"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-sm">
                  {index + 1}
                </div>
                <h3 className="text-sm font-semibold leading-snug text-t-primary sm:text-base">
                  {item.title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-t-secondary">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="lift-hover rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold text-t-primary">
            Qué necesitamos para publicar tu inmueble
          </h2>
          <ul className="mt-3 space-y-2">
            {REQUIRED_INFO.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-t-secondary"
              >
                <Icon
                  name="check_circle"
                  size={18}
                  className="mt-0.5 shrink-0 text-success"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="lift-hover rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold text-t-primary">
            Preguntas frecuentes
          </h2>
          <ul className="mt-3 space-y-3">
            {FAQ.map((item) => (
              <li
                key={item.q}
                className="rounded-xl border border-bg-border bg-bg-elevated p-3"
              >
                <p className="text-sm font-semibold text-t-primary">{item.q}</p>
                <p className="mt-1 text-sm leading-relaxed text-t-secondary">
                  {item.a}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-accent/30 bg-accent-dark/20 p-5 text-center shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Publica con Renty
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-lg font-semibold text-t-primary">
          Tu inmueble merece una publicación clara y profesional para atraer
          mejores contactos.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-t-secondary">
          Escríbenos por WhatsApp y te ayudamos a publicarlo paso a paso.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href={WHATSAPP_PUBLISH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="lift-hover inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#22c55e] hover:shadow-[0_0_20px_rgba(37,211,102,0.2)]"
          >
            <Icon name="chat" size={18} />
            Hablar por WhatsApp
            <span className="sr-only">(abre en nueva pestaña)</span>
          </a>
          <Link
            href="/"
            className={getButtonClasses("secondary", "lift-hover rounded-xl")}
          >
            <Icon name="arrow_back" size={18} />
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}
