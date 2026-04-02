import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildWhatsAppProxyPath } from "@/lib/analytics/shared";
import TrackEventOnMount from "@/components/analytics/TrackEventOnMount";
import Icon from "@/components/ui/Icon";
import StructuredData from "@/components/seo/StructuredData";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { SITE_NAME, buildPageMetadata, toAbsoluteUrl } from "@/lib/domain/seo";
import heroImage from "@/app/assets/foto_publicar.webp";
import PublishPageClient from "@/app/publicar/PublishPageClient";

/* ── Data ── */

const TRUST_SIGNALS = [
  { icon: "bolt", label: "Publicamos en 24h" },
  { icon: "shield", label: "Sin intermediarios" },
  { icon: "payments", label: "100% gratis" },
];

const WHY_RENTY = [
  {
    icon: "bolt",
    title: "Acompañamiento humano",
    description:
      "No estás solo. Te guiamos paso a paso para que tu anuncio quede perfecto.",
  },
  {
    icon: "photo_camera",
    title: "Fotos bien presentadas",
    description:
      "Optimizamos tus imágenes para que tu inmueble se vea profesional.",
  },
  {
    icon: "chat",
    title: "Contacto directo por WhatsApp",
    description:
      "Los interesados te escriben directo. Sin formularios, sin esperas.",
  },
  {
    icon: "verified",
    title: "Sin costos ocultos",
    description:
      "Publicar es completamente gratis. Sin comisiones, sin sorpresas.",
  },
];

const PUBLISH_STEPS = [
  {
    title: "Cuéntanos tu inmueble",
    description:
      "Nos escribes por WhatsApp con los datos básicos: ubicación, precio y tipo de propiedad.",
    illustration: "/illustrations/message-sent.svg",
  },
  {
    title: "Nos envías fotos y detalles",
    description:
      "Te pedimos información clave para que el anuncio se entienda fácil y genere confianza.",
    illustration: "/illustrations/selfie.svg",
  },
  {
    title: "Publicamos y te conectamos",
    description:
      "Subimos tu inmueble en Renty y recibes contactos directos para cerrar más rápido.",
    illustration: "/illustrations/high-five.svg",
  },
];

const REQUIRED_INFO = [
  { icon: "description", text: "Título del inmueble y descripción corta" },
  { icon: "place", text: "Barrio o ubicación aproximada en Bogotá" },
  { icon: "home", text: "Precio mensual, habitaciones y baños" },
  { icon: "task_alt", text: "Características: parqueadero, amoblado, servicios" },
  { icon: "photo_camera", text: "Fotos reales y recientes del inmueble" },
  { icon: "chat", text: "Número de WhatsApp para contacto" },
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

/* ── Metadata ── */

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

/* ── Page (server component, renders client wrapper for animations) ── */

export default function PublishPage() {
  const heroWhatsAppHref = buildWhatsAppProxyPath({
    intent: "publish",
    source: "publish_hero",
    pagePath: "/publicar",
  });
  const footerWhatsAppHref = buildWhatsAppProxyPath({
    intent: "publish",
    source: "publish_footer",
    pagePath: "/publicar",
  });
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
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <>
      <TrackEventOnMount
        eventName="publish_page_view"
        source="publish_page"
        pagePath="/publicar"
        dedupeKey="publish_page_view"
      />
      <StructuredData id="publish-structured-data" data={serviceJsonLd} />

      {/* ━━━ HERO con imagen de fondo ━━━ */}
      <section className="relative overflow-hidden">
        <Image
          src={heroImage}
          alt="Ilustración de Bogotá — Publica tu inmueble en Renty"
          fill
          priority
          placeholder="blur"
          className="object-cover"
          sizes="100vw"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pb-14 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-24">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            <Icon name="verified" size={13} />
            Sin intermediarios · Sin comisiones
          </p>

          <h1 className="mx-auto mt-5 max-w-[18ch] text-[28px] font-extrabold leading-[1.12] tracking-tight text-white sm:mt-6 sm:max-w-3xl sm:text-4xl lg:text-5xl lg:leading-[1.1]">
            Publica tu inmueble y conecta con{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
              inquilinos reales
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/85 sm:mt-5 sm:max-w-2xl sm:text-lg">
            Te ayudamos a crear un anuncio profesional con fotos claras y
            contacto directo por WhatsApp.
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row">
            <a
              href={heroWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="lift-hover inline-flex items-center justify-center gap-2.5 rounded-2xl bg-whatsapp px-7 py-4 text-[15px] font-semibold text-white shadow-lg transition-all hover:bg-whatsapp-hover hover:shadow-[0_0_32px_rgba(37,211,102,0.3)]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Quiero publicar mi inmueble
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-[15px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Icon name="home" size={18} />
              Ver arriendos
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ TRUST STRIP ━━━ */}
      <section className="border-b border-bg-border bg-bg-surface">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-2 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6">
          {TRUST_SIGNALS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2.5 sm:text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Icon name={item.icon} size={18} className="text-accent" />
              </div>
              <span className="text-[12px] font-medium leading-tight text-t-secondary sm:text-sm">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ Secciones animadas (client component) ━━━ */}
      <PublishPageClient
        steps={PUBLISH_STEPS}
        benefits={WHY_RENTY}
        requirements={REQUIRED_INFO}
        faq={FAQ}
        footerWhatsAppHref={footerWhatsAppHref}
      />
    </>
  );
}
