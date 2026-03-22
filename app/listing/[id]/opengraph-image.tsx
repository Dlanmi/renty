/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import {
  getListingByIdAnyStatus,
  isValidListingId,
} from "@/lib/data/listings";
import { formatCOP, formatBillingPeriod } from "@/lib/domain/format";
import { truncateMetaText } from "@/lib/domain/seo";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const revalidate = 3600;

interface ImageProps {
  params: Promise<{ id: string }>;
}

function truncateTitle(title: string): string {
  return truncateMetaText(title, 86);
}

function truncateSubtitle(subtitle: string): string {
  return truncateMetaText(subtitle, 96);
}

function buildFallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px",
          background:
            "linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(190,24,93,1) 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            opacity: 0.95,
          }}
        >
          Renty
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05 }}>
            Arriendos en Bogotá
          </div>
          <div style={{ fontSize: 30, opacity: 0.95 }}>
            Encuentra y comparte propiedades fácilmente
          </div>
        </div>
      </div>
    ),
    size
  );
}

export default async function OpenGraphImage({ params }: ImageProps) {
  const { id } = await params;

  if (!isValidListingId(id)) {
    return buildFallbackImage();
  }

  const listing = await getListingByIdAnyStatus(id);
  if (!listing) {
    return buildFallbackImage();
  }

  const price = `${formatCOP(listing.price_cop)}${formatBillingPeriod(
    listing.billing_period
  )}`;
  const subtitle = truncateSubtitle(
    `${listing.property_type} • ${listing.bedrooms} hab • ${listing.neighborhood}, ${listing.city}`
  );
  const title = truncateTitle(listing.title);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <img
          src={listing.cover_photo_url}
          alt={listing.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,0.86) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "46px",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              alignSelf: "flex-start",
              borderRadius: 999,
              backgroundColor: "rgba(244,63,94,0.93)",
              padding: "12px 20px",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            Renty
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.32)",
                padding: "10px 16px",
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.1,
                backdropFilter: "blur(2px)",
              }}
            >
              {price}
            </div>

            <div
              style={{
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                textWrap: "balance",
                maxWidth: "96%",
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                opacity: 0.95,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
