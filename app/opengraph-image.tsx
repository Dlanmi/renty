import { ImageResponse } from "next/og";
import { DEFAULT_SITE_DESCRIPTION, SITE_NAME } from "@/lib/domain/seo";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px",
          background:
            "radial-gradient(circle at top left, rgba(251,191,36,0.28), transparent 36%), linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(244,63,94,0.95) 52%, rgba(251,146,60,0.92) 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
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
              borderRadius: 999,
              padding: "12px 20px",
              backgroundColor: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.25)",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 24,
              opacity: 0.9,
            }}
          >
            Bogotá
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxWidth: "85%",
          }}
        >
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Arriendos en Bogotá con contacto directo
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.25,
              opacity: 0.94,
            }}
          >
            {DEFAULT_SITE_DESCRIPTION}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 24,
            opacity: 0.95,
          }}
        >
          <div>apartamentos</div>
          <div>habitaciones</div>
          <div>casas</div>
        </div>
      </div>
    ),
    size
  );
}
