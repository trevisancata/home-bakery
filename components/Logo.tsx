import Image from "next/image";
import { site } from "@/data/site";

type LogoProps = {
  alt: string;
  /** Blanco (header y footer) o negro (sobre fondos claros sin círculo). */
  tone?: "white" | "black";
  /** Con círculo taupe (header) o el logo solo (footer). */
  circle?: boolean;
  className?: string;
  /** Ancho del logo dentro del círculo. */
  imageClassName?: string;
  /** Ancho en pantalla, para elegir la resolución (con círculo, 80px por defecto). */
  sizes?: string;
  /** Sin círculo: "eager" si está arriba de todo (header). */
  loading?: "eager" | "lazy";
};

/** Logo de la marca, sin la bajada "cakes & pastries". */
export function Logo({
  alt,
  tone = "white",
  circle = true,
  className = "",
  imageClassName = "w-2/3",
  sizes = "80px",
  loading,
}: LogoProps) {
  const { src, width, height } = site.logo[tone];

  if (!circle) {
    return <Image src={src} alt={alt} width={width} height={height} sizes="160px" loading={loading} className={`h-auto ${className}`} />;
  }

  return (
    <span className={`flex items-center justify-center rounded-full bg-taupe ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} loading="eager" className={`h-auto ${imageClassName}`} />
    </span>
  );
}
