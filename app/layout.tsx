import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import "@/styles/globals.css";
import Providers from "@/app/providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StructuredData from "@/components/seo/StructuredData";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SITE_LOCALE,
  SITE_NAME,
  getSiteUrl,
} from "@/lib/domain/seo";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  display: "swap",
  variable: "--font-inter",
});

const materialSymbolsOutlined = localFont({
  src: "./fonts/MaterialSymbolsOutlinedSubset.woff2",
  display: "block",
  preload: true,
  variable: "--font-material-symbols-outlined",
});

const siteUrl = getSiteUrl();
const isPreviewDeployment = process.env.VERCEL_ENV === "preview";
const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = stored || 'system';
      var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL('https://renty-seven.vercel.app'),
  title: {
    default: DEFAULT_SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SITE_DESCRIPTION,
  keywords: [
    "arriendos en Bogota",
    "apartamentos en arriendo Bogota",
    "habitaciones en arriendo Bogota",
    "casas en arriendo Bogota",
    "arriendo con WhatsApp",
  ],
  icons: {
    icon: [
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.ico?v=2" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.ico?v=2",
  },
  openGraph: {
    title: `${DEFAULT_SITE_TITLE} | ${SITE_NAME}`,
    description: DEFAULT_SITE_DESCRIPTION,
    url: siteUrl.toString(),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: DEFAULT_SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${DEFAULT_SITE_TITLE} | ${SITE_NAME}`,
    description: DEFAULT_SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: isPreviewDeployment
    ? {
        index: false,
        follow: false,
        nocache: true,
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl.toString(),
      areaServed: "Bogotá",
      sameAs: ["https://wa.me/573144436688"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl.toString(),
      inLanguage: "es-CO",
      description: DEFAULT_SITE_DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl.toString()}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${materialSymbolsOutlined.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          id="renty-theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#FFFFFF"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0F1117"
        />
      </head>
      <body className="min-h-screen bg-bg-base font-sans text-t-primary antialiased">
        <Providers>
          <StructuredData id="global-structured-data" data={websiteJsonLd} />
          <Header />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
        </Providers>
        {/* Vercel recoge datos reales en despliegues preview/production; en local no aparecen métricas en el dashboard. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
