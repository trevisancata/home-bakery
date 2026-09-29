import type { RichText } from "@/data/site";

/** Renderiza un RichText de data/site.ts: texto, negritas y links. */
export function Rich({ text }: { text: RichText }) {
  return text.map((part, index) => {
    if (typeof part === "string") return part;
    if ("strong" in part) return <strong key={index}>{part.strong}</strong>;
    return (
      <a key={index} href={part.href} className="text-chocolate underline hover:text-carbon">
        {part.text}
      </a>
    );
  });
}
