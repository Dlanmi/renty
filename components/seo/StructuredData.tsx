interface StructuredDataProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

function toSafeJson(data: StructuredDataProps["data"]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function StructuredData({
  data,
  id,
}: StructuredDataProps) {
  return (
    <script
      {...(id ? { id } : {})}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toSafeJson(data) }}
    />
  );
}
