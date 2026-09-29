import Image from "next/image";

const ratios = {
  "1/1": "aspect-square",
  "4/3": "aspect-4/3",
  "4/5": "aspect-4/5",
  "3/2": "aspect-3/2",
} as const;

const tones = {
  // Placeholder de marca, con la etiqueta en chocolate (5.57:1).
  claro: { frame: "bg-placeholder", label: "text-chocolate" },
  // Dentro de la banda chocolate (crema sobre chocolate-claro: 4.54:1).
  oscuro: { frame: "bg-chocolate-claro", label: "text-crema" },
} as const;

type ImageFrameProps = {
  /** Si todavía no hay foto, se muestra el placeholder de marca. */
  src?: string;
  alt: string;
  /** Texto visible del placeholder mientras no hay foto. */
  placeholderLabel?: string;
  /** Proporción fija; si se omite, el tamaño lo da `className`. */
  ratio?: keyof typeof ratios;
  /** Radio de las esquinas; por defecto el de las fotos del mockup. */
  rounded?: string;
  tone?: keyof typeof tones;
  sizes: string;
  preload?: boolean;
  className?: string;
};

/**
 * Imagen sobre el color placeholder del mockup, que se ve mientras carga la
 * foto o mientras la foto definitiva no existe.
 */
export function ImageFrame({
  src,
  alt,
  placeholderLabel,
  ratio,
  rounded = "rounded-card-sm lg:rounded-card",
  tone = "claro",
  sizes,
  preload,
  className = "",
}: ImageFrameProps) {
  const colors = tones[tone];

  return (
    <div className={`relative overflow-hidden ${colors.frame} ${rounded} ${ratio ? ratios[ratio] : ""} ${className}`}>
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
            <span aria-hidden="true" className={`text-11 font-medium tracking-foto uppercase lg:text-12 ${colors.label}`}>
              {placeholderLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
