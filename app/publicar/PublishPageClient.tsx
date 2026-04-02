"use client";

import Image from "next/image";
import Link from "next/link";
import { getButtonClasses } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import {
  SECTION_REVEAL_VARIANTS,
  LIST_ITEM_REVEAL_VARIANTS,
  STAGGER_CONTAINER_VARIANTS,
} from "@/lib/motion/animations";
import { motion } from "@/lib/motion/runtime";

interface Step {
  title: string;
  description: string;
  illustration: string;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface Requirement {
  icon: string;
  text: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  steps: Step[];
  benefits: Benefit[];
  requirements: Requirement[];
  faq: FaqItem[];
  footerWhatsAppHref: string;
}

export default function PublishPageClient({
  steps,
  benefits,
  requirements,
  faq,
  footerWhatsAppHref,
}: Props) {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 lg:space-y-24 lg:py-16">
      {/* ━━━ CÓMO FUNCIONA ━━━ */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
        variants={SECTION_REVEAL_VARIANTS}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Proceso simple
          </p>
          <h2 className="mt-2 text-2xl font-bold text-t-primary sm:text-3xl">
            Publicar es más fácil de lo que piensas
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-t-secondary">
            En 3 pasos tu inmueble estará publicado y recibiendo contactos reales.
          </p>
        </div>

        <motion.div
          className="mt-10 space-y-10 lg:space-y-0"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          variants={STAGGER_CONTAINER_VARIANTS}
        >
          {steps.map((step, index) => {
            const isEven = index % 2 === 1;
            return (
              <motion.div
                key={step.title}
                variants={LIST_ITEM_REVEAL_VARIANTS}
                className={`flex flex-col items-center gap-5 sm:gap-6 lg:flex-row lg:gap-12 ${isEven ? "lg:flex-row-reverse" : ""} ${index > 0 ? "lg:mt-16" : ""}`}
              >
                <div className="flex w-full shrink-0 items-center justify-center lg:w-1/2">
                  <div className="relative h-40 w-40 sm:h-52 sm:w-52">
                    <Image
                      src={step.illustration}
                      alt=""
                      fill
                      className="object-contain"
                      loading="lazy"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className={`w-full text-center lg:w-1/2 lg:text-left ${isEven ? "lg:text-right" : ""}`}>
                  <div className={`inline-flex items-center gap-3 ${isEven ? "lg:flex-row-reverse" : ""}`}>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-t-primary sm:text-xl">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-t-secondary">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* ━━━ POR QUÉ RENTY ━━━ */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
        variants={SECTION_REVEAL_VARIANTS}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Ventajas
          </p>
          <h2 className="mt-2 text-2xl font-bold text-t-primary sm:text-3xl">
            ¿Por qué publicar con Renty?
          </h2>
        </div>

        <motion.div
          className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          variants={STAGGER_CONTAINER_VARIANTS}
        >
          {benefits.map((item) => (
            <motion.article
              key={item.title}
              variants={LIST_ITEM_REVEAL_VARIANTS}
              className="group rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                <Icon name={item.icon} size={22} className="text-accent" />
              </div>
              <h3 className="mt-4 text-base font-bold text-t-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-t-secondary">
                {item.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      {/* ━━━ QUÉ NECESITAMOS ━━━ */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
        variants={SECTION_REVEAL_VARIANTS}
      >
        <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-surface shadow-card lg:flex">
          <div className="flex items-center justify-center bg-bg-elevated p-6 sm:p-8 lg:w-2/5">
            <div className="relative h-36 w-36 sm:h-52 sm:w-52">
              <Image
                src="/illustrations/done.svg"
                alt=""
                fill
                className="object-contain"
                loading="lazy"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:w-3/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Checklist
            </p>
            <h2 className="mt-2 text-xl font-bold text-t-primary sm:text-2xl">
              Qué necesitamos para publicar
            </h2>
            <motion.ul
              className="mt-5 grid gap-3 sm:grid-cols-2"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={STAGGER_CONTAINER_VARIANTS}
            >
              {requirements.map((item) => (
                <motion.li
                  key={item.text}
                  variants={LIST_ITEM_REVEAL_VARIANTS}
                  className="flex items-start gap-3 rounded-xl border border-bg-border bg-bg-elevated p-3"
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    className="mt-0.5 shrink-0 text-accent"
                  />
                  <span className="text-sm font-medium text-t-secondary">
                    {item.text}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </motion.section>

      {/* ━━━ FAQ ━━━ */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
        variants={SECTION_REVEAL_VARIANTS}
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-20 w-20 sm:h-24 sm:w-24">
              <Image
                src="/illustrations/faq.svg"
                alt=""
                fill
                className="object-contain"
                loading="lazy"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-2xl font-bold text-t-primary sm:text-3xl">
              Preguntas frecuentes
            </h2>
          </div>

          <motion.div
            className="mt-8 space-y-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={STAGGER_CONTAINER_VARIANTS}
          >
            {faq.map((item) => (
              <motion.div
                key={item.q}
                variants={LIST_ITEM_REVEAL_VARIANTS}
                className="rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card"
              >
                <p className="flex items-start gap-3 text-[15px] font-semibold text-t-primary">
                  <Icon
                    name="chat"
                    size={20}
                    className="mt-0.5 shrink-0 text-accent"
                  />
                  {item.q}
                </p>
                <p className="mt-2 pl-8 text-sm leading-relaxed text-t-secondary">
                  {item.a}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ━━━ CTA FINAL ━━━ */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-60px" }}
        variants={SECTION_REVEAL_VARIANTS}
        className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-dark/25 via-bg-surface to-bg-elevated p-6 text-center shadow-lg sm:p-10 lg:p-12"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo/10 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Empieza hoy
          </p>
          <h2 className="mt-3 text-2xl font-bold text-t-primary sm:text-3xl">
            Tu inmueble merece ser visto
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-t-secondary">
            Escríbenos por WhatsApp y en menos de 24 horas tu anuncio estará
            publicado, optimizado y listo para recibir contactos.
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:justify-center">
            <a
              href={footerWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="lift-hover inline-flex items-center justify-center gap-2.5 rounded-2xl bg-whatsapp px-7 py-4 text-[15px] font-semibold text-white shadow-lg transition-all hover:bg-whatsapp-hover hover:shadow-[0_0_32px_rgba(37,211,102,0.3)]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Publicar ahora por WhatsApp
            </a>
            <Link
              href="/"
              className={getButtonClasses(
                "secondary",
                "lift-hover justify-center rounded-2xl px-6 py-4 text-[15px]"
              )}
            >
              <Icon name="arrow_back" size={18} />
              Volver al inicio
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
