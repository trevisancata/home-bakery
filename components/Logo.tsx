import Image from "next/image";
import { site } from "@/data/site";

/** Logo blanco sobre un círculo taupe. */
export function Logo({ alt, className = "" }: { alt: string; className?: string }) {
  const { src, width, height } = site.logo.white;

  return (
    <span className={`flex items-center justify-center rounded-full bg-taupe ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} sizes="80px" loading="eager" className="h-auto w-[74%]" />
    </span>
  );
}
