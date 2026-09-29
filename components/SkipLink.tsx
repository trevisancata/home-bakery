import { ui } from "@/data/site";

export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-chocolate focus:px-5 focus:py-3 focus:font-medium focus:text-hueso"
    >
      {ui.skipLink}
    </a>
  );
}
