import Image from "next/image";
import { site } from "@/data/site";

type LogoProps = {
  alt: string;
  /** Con círculo taupe (header) o el logo blanco solo (footer). */
  circle?: boolean;
  className?: string;
  /** Ancho del logo dentro del círculo. */
  imageClassName?: string;
};

/** Logo blanco de la marca. */
export function Logo({ alt, circle = true, className = "", imageClassName = "w-2/3" }: LogoProps) {
  const { src, width, height } = site.logo.white;

  if (!circle) {
    return <Image src={src} alt={alt} width={width} height={height} sizes="160px" className={`h-auto ${className}`} />;
  }

  return (
    <span className={`flex items-center justify-center rounded-full bg-taupe ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} sizes="80px" loading="eager" className={`h-auto ${imageClassName}`} />
    </span>
  );
}
