import { permanentRedirect } from "next/navigation";

interface LegacyListingPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function toRedirectQuery(
  searchParams?: Record<string, string | string[] | undefined>
): string {
  if (!searchParams) return "";

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) query.append(key, item);
      }
      continue;
    }

    if (value) query.set(key, value);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function LegacyListingPage({
  params,
  searchParams,
}: LegacyListingPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  permanentRedirect(`/arriendos/${slug}${toRedirectQuery(resolvedSearchParams)}`);
}
