import PageReveal from "@/components/ui/PageReveal";
import type { ReactNode } from "react";

export default function RootTemplate({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <PageReveal>{children}</PageReveal>;
}
