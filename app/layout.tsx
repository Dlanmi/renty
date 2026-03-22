import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageReveal from "@/components/ui/PageReveal";
import { getSiteUrl } from "@/lib/domain/seo";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = getSiteUrl();
const defaultDescription =
  "Encuentra apartamentos, habitaciones y casas en arriendo en Bogotá con contacto directo por WhatsApp.";
const isPreviewDeployment = process.env.VERCEL_ENV === "preview";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Renty",
    template: "%s | Renty",
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.ico?v=2" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.ico?v=2",
  },
  openGraph: {
    title: "Renty",
    description: defaultDescription,
    url: siteUrl.toString(),
    siteName: "Renty",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/favicon.ico",
        alt: "Renty",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Renty",
    description: defaultDescription,
    images: ["/favicon.ico"],
  },
  robots: isPreviewDeployment
    ? {
        index: false,
        follow: false,
      }
    : {
        index: true,
        follow: true,
      },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* Material Symbols Outlined */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <Header />
        <main className="min-h-[calc(100vh-8rem)]">
          <PageReveal>{children}</PageReveal>
        </main>
        <Footer />
      </body>
    </html>
  );
}
