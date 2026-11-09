"use client";

import type { ComponentProps } from "react";
import { ImageFrame } from "@/components/ImageFrame";
import { useDespuesDelLoad } from "@/lib/use-despues-del-load";

/**
 * ImageFrame que pide la foto después del evento load, para fotos que no son
 * el LCP pero quedan a menos de ~2500 px (ahí el lazy loading de Chrome ya
 * las pide de entrada). Mientras, se ve el placeholder del mismo tamaño.
 */
export function DeferredImageFrame({ src, ...props }: ComponentProps<typeof ImageFrame>) {
  const cargado = useDespuesDelLoad();
  return <ImageFrame {...props} src={cargado ? src : undefined} />;
}
