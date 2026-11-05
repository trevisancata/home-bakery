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
  /** En un carrusel, solo se reproduce el video de la diapositiva visible. */
  active?: boolean;
  /** Ubicación de la etiqueta del placeholder. */
  placeholderClassName?: string;
  /** Clases del <video> (por defecto, cubre todo el contenedor). */
  videoClassName?: string;
  className?: string;
};

/**
 * Video decorativo de fondo: sin audio, en loop y con póster. Se pausa y se
 * reanuda con un ícono chico en una esquina (WCAG 2.2.2: "Pausar video", 32 px
 * de área táctil) o tocando el video. Con prefers-reduced-motion se queda en
 * el póster. En el servidor se asume movimiento reducido, así que el HTML no
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
  buttonClassName = "right-3 bottom-3",
  active = true,
  placeholderClassName = "items-end p-3 lg:p-4",
  videoClassName = "absolute inset-0 size-full object-cover",
  className = "",
}: BackgroundVideoProps) {
  const reducedMotion = useReducedMotion();
  const [choice, setChoice] = useState<boolean | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const playing = choice ?? !reducedMotion;
  const running = playing && active;
  const toggle = () => setChoice(!playing);

  useEffect(() => {
    if (!video.current) return;
    if (running) {
      video.current.play().catch(() => {});
    } else {
      video.current.pause();
    }
  }, [running]);

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
        <Image src={poster} alt="" fill preload={posterPreload} sizes={posterSizes} draggable={false} className="object-cover" />
      )}
      <video
        ref={video}
        src={src}
        autoPlay={running}
        muted
        loop
        playsInline
        preload={running ? "metadata" : "none"}
        aria-hidden="true"
        // Atajo con el mouse o el dedo; con el teclado, el botón.
        onClick={toggle}
        className={`cursor-pointer ${videoClassName}`}
      />
      {/* Chico y sutil, pero el ícono hueso sobre capa/55 da 3.3:1 aun sobre un cuadro blanco. */}
      <button
        type="button"
        aria-label={playing ? ui.video.pause : ui.video.play}
        onClick={toggle}
        className={`absolute z-20 flex size-8 items-center justify-center rounded-full bg-capa/55 text-hueso transition-colors hover:bg-capa/80 focus-visible:bg-capa/80 ${buttonClassName}`}
      >
        {playing ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M9 6v12M15 6v12" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
