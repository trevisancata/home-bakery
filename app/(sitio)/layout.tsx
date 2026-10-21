import { SitioChrome } from "@/components/SitioChrome";

export default function SitioLayout({ children }: LayoutProps<"/">) {
  return <SitioChrome>{children}</SitioChrome>;
}
