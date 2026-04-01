import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
          borderRadius: 40,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M17 11V3H7v4H3v14h18V11h-4ZM9 19H5v-2h4v2Zm0-4H5v-2h4v2Zm0-4H5V9h4v2Zm6 8h-4v-2h4v2Zm0-4h-4v-2h4v2Zm0-4h-4V9h4v2Zm0-4h-4V5h4v2Z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
