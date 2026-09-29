import Image from "next/image";

const ratios = {
  "1/1": "aspect-square",
  "4/3": "aspect-4/3",
  "4/5": "aspect-4/5",
  "3/2": "aspect-3/2",
} as const;

type ImageFrameProps = {
  /** Si todavía no hay foto, se muestra el placeholder de marca. */
  src?: string;
  alt: string;
  /** Texto visible del placeholder mientras no hay foto. */
  placeholderLabel?: string;
  ratio?: keyof typeof ratios;
  sizes: string;
  preload?: boolean;
  className?: string;
};

/**
 * Imagen con proporción fija y fondo arena, que funciona como placeholder
 * mientras carga la foto o mientras la foto definitiva no existe.
 */
export function ImageFrame({
  src,
  alt,
  placeholderLabel,
  ratio = "4/3",
  sizes,
  preload,
  className = "",
}: ImageFrameProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-arena ${ratios[ratio]} ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className="absolute inset-3 flex flex-col items-center justify-center gap-4 rounded-[1.25rem] border border-greige"
        >
          <span className="size-16 rounded-full bg-greige/60 ring-8 ring-caramelo/25" />
          {placeholderLabel && (
            <span aria-hidden="true" className="font-label text-xs tracking-[0.2em] text-secundario uppercase">
              {placeholderLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
