import { ImageResponse } from "next/og";
import {
  getListingById,
  getListingBySlug,
} from "@/lib/data/listings";
import { isValidListingId } from "@/lib/domain/listing-paths";
import { formatCOP, formatBillingPeriod } from "@/lib/domain/format";
import { SITE_NAME } from "@/lib/domain/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ListingOgImage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();

  const listing = isValidListingId(normalizedSlug)
    ? await getListingById(normalizedSlug)
    : await getListingBySlug(normalizedSlug);

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0F1117",
            color: "#fff",
            fontSize: 48,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {SITE_NAME}
        </div>
      ),
      size
    );
  }

  const price = formatCOP(listing.price_cop);
  const period = formatBillingPeriod(listing.billing_period);
  const specs: string[] = [];
  if (listing.bedrooms > 0)
    specs.push(`${listing.bedrooms} hab`);
  if (listing.bathrooms > 0)
    specs.push(`${listing.bathrooms} ${listing.bathrooms === 1 ? "baño" : "baños"}`);
  if (listing.area_m2 != null)
    specs.push(`${listing.area_m2} m²`);

  const coverUrl = listing.cover_photo_url;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Cover photo background */}
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: coverUrl
              ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.25) 100%)"
              : "linear-gradient(135deg, #064E3B 0%, #0F172A 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 54px",
            color: "#ffffff",
          }}
        >
          {/* Top bar: brand + neighborhood */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                padding: "10px 20px",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                fontSize: 22,
                opacity: 0.9,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {listing.neighborhood}
              {listing.zone ? `, ${listing.zone}` : ""} · {listing.city}
            </div>
          </div>

          {/* Bottom: title + price + specs */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 48,
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                maxWidth: "85%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {listing.title}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              {/* Price pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  borderRadius: 16,
                  padding: "10px 22px",
                  backgroundColor: "#10B981",
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                {price}
                <span style={{ fontSize: 18, fontWeight: 500, opacity: 0.9 }}>
                  {period}
                </span>
              </div>

              {/* Specs */}
              {specs.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    fontSize: 24,
                    opacity: 0.9,
                  }}
                >
                  {specs.map((spec) => (
                    <span key={spec}>{spec}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
