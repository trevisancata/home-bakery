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
 * Imagen con proporción fija sobre el color placeholder del mockup, que se
 * ve mientras carga la foto o mientras la foto definitiva no existe.
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
    <div className={`relative overflow-hidden rounded-card-sm bg-placeholder lg:rounded-card ${ratios[ratio]} ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className="absolute inset-0 flex items-end p-3 lg:p-4"
        >
          {placeholderLabel && (
            <span aria-hidden="true" className="text-11 font-medium tracking-foto text-chocolate uppercase lg:text-12">
              {placeholderLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
