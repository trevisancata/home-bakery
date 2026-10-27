"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ui } from "@/data/site";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type BackgroundVideoProps = {
  /** Sin video todavía, se muestra el placeholder de marca. */
  src?: string;
  poster?: string;
  /** Si el póster es la imagen principal de la página (LCP): se precarga. */
  posterPreload?: boolean;
  /** `sizes` del póster, para que next/image elija el ancho justo. */
  posterSizes?: string;
  /** Color del placeholder. */
  tone?: string;
  /** Posición del botón de pausa dentro del contenedor. */
  buttonClassName?: string;
  /** Ubicación de la etiqueta del placeholder. */
  placeholderClassName?: string;
  /** Clases del <video> (por defecto, cubre todo el contenedor). */
  videoClassName?: string;
  className?: string;
};

/**
 * Video decorativo de fondo: sin audio, en loop y con póster. Tiene un botón
 * de pausa visible (WCAG 2.2.2) y con prefers-reduced-motion se queda en el
 * póster. En el servidor se asume movimiento reducido, así que el HTML no
 * lleva autoplay: arranca recién al hidratar, y lo primero que se ve es el
 * póster.
 *
 * El póster es un <img> (next/image, optimizado) debajo del video, no el
 * atributo poster: se pinta con el HTML, sin esperar a que el video arranque,
 * y Chrome lo toma como LCP. El video es transparente hasta tener su primer
 * cuadro, así que mientras tanto se ve el póster. Sin reproducir, el video
 * no pide nada (preload="none") y queda solo el póster; al reproducir,
 * "metadata".
 * Mientras no hay video, muestra el placeholder y no hay nada que pausar:
 * el botón aparece recién con el video.
 */
export function BackgroundVideo({
  src,
  poster,
  posterPreload = false,
  posterSizes = "100vw",
  tone = "bg-chocolate-claro",
  buttonClassName = "right-4 bottom-4",
  placeholderClassName = "items-end p-3 lg:p-4",
  videoClassName = "absolute inset-0 size-full object-cover",
  className = "",
}: BackgroundVideoProps) {
  const reducedMotion = useReducedMotion();
  const [choice, setChoice] = useState<boolean | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const playing = choice ?? !reducedMotion;

  useEffect(() => {
    if (!video.current) return;
    if (playing) {
      video.current.play().catch(() => {});
    } else {
      video.current.pause();
    }
  }, [playing]);

  if (!src) {
    return (
      <div className={`flex ${placeholderClassName} ${tone} ${className}`}>
        <span aria-hidden="true" className="text-11 font-medium tracking-foto text-crema uppercase lg:text-12">
          {ui.videoPending}
        </span>
      </div>
    );
  }

  return (
    <div className={`${tone} ${className}`}>
      {poster && (
        <Image src={poster} alt="" fill preload={posterPreload} sizes={posterSizes} className="object-cover" />
      )}
      <video
        ref={video}
        src={src}
        autoPlay={playing}
        muted
        loop
        playsInline
        preload={playing ? "metadata" : "none"}
        aria-hidden="true"
        className={videoClassName}
      />
      <button
        type="button"
        onClick={() => setChoice(!playing)}
        className={`absolute z-20 inline-flex min-h-11 items-center gap-2 rounded-full border-trazo border-hueso bg-capa/25 px-4.5 text-14 font-semibold text-hueso transition-colors hover:bg-capa/60 lg:min-h-12 ${buttonClassName}`}
      >
        {playing ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 6v12M15 6v12" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4.5" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
        {playing ? ui.video.pause : ui.video.play}
      </button>
    </div>
  );
}
