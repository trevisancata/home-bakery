"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { preload } from "react-dom";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui, type HeroSlide } from "@/data/site";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const content = pages.home.hero;
const labels = content.carousel;

/** Cada cuánto avanza solo, en milisegundos. */
const interval = 6000;

// Colores de los placeholders mientras no hay fotos: se alternan para que
// se note el cambio de diapositiva.
const placeholderTones = ["bg-chocolate-claro", "bg-chocolate", "bg-taupe"];

const controlClass =
  "flex size-11 shrink-0 items-center justify-center rounded-full border-trazo border-hueso bg-capa/25 text-hueso transition-colors hover:bg-capa/60 lg:size-12";

/**
 * Portada del inicio: carrusel a todo el ancho con fotos o videos, una capa
 * oscura y los textos de Maggie encima.
 *
 * Accesibilidad (WCAG 2.2.2): anterior / siguiente, un punto por diapositiva
 * y botón de pausa siempre visible. Avanza solo cada 6 s, salvo que la
 * persona lo pause, tenga el mouse o el foco adentro, o haya pedido reducir
 * el movimiento. Mientras avanza solo, los cambios no se anuncian.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  // null: lo que corresponda según prefers-reduced-motion; si no, lo que eligió la persona.
  const [choice, setChoice] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  const playing = choice ?? !reducedMotion;
  const hasControls = total > 1;
  const rotating = hasControls && playing && !hovered && !focused;

  const first = slides[0];
  if (first?.type === "video" && first.poster) {
    // La primera diapositiva es la imagen principal de la página (LCP).
    preload(first.poster, { as: "image", fetchPriority: "high" });
  }

  // Se reinicia en cada cambio, así cada diapositiva dura 6 s completos.
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % total), interval);
    return () => clearTimeout(timer);
  }, [rotating, index, total]);

  // Solo se reproduce el video visible, y la pausa también lo frena.
  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (!video) return;
      if (i === index && playing) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [index, playing]);

  const go = (next: number) => setIndex((next + total) % total);

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };

  return (
    <section
      data-surface="dark"
      aria-roledescription="carrusel"
      aria-label={content.label}
      className="relative h-160 overflow-hidden bg-chocolate lg:h-180"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <div aria-live={rotating ? "off" : "polite"} className="absolute inset-0">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={labels.slide(i + 1, total)}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 transition-opacity motion-safe:duration-700 ${active ? "opacity-100" : "opacity-0"}`}
            >
              <SlideMedia
                slide={slide}
                first={i === 0}
                tone={placeholderTones[i % placeholderTones.length]}
                videoRef={(video) => {
                  videos.current[i] = video;
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Capa pareja del mockup + degradé debajo del texto para llegar a AA sobre fotos claras. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-capa/42" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-capa/60 via-capa/55 via-65% to-transparent lg:bg-linear-to-r lg:from-capa/65 lg:via-capa/60 lg:via-50% lg:to-transparent lg:to-85%"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-linear-to-t from-capa/40 to-transparent to-40% lg:block"
      />

      <div className="contenedor relative flex h-full flex-col justify-end gap-4 pb-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:pb-22">
        <div className="flex max-w-195 flex-col gap-4 lg:gap-6">
          <Eyebrow tone="crema">{content.eyebrow}</Eyebrow>
          <SectionTitle
            as="h1"
            title={content.title}
            script={content.script}
            size="text-48 leading-hero tracking-titulo text-hueso lg:text-92 lg:leading-none"
            // Margen para que el trazo bajo de la manuscrita no pise la bajada.
            className="mb-1 lg:mb-6"
          />
          <p className="max-w-150 text-16 leading-medio text-hueso lg:text-20 lg:leading-parrafo">{content.text}</p>
          <div className="flex flex-col gap-2.5 lg:mt-2 lg:flex-row lg:gap-4">
            <Button href={content.primaryCta.href} variant="light">
              {content.primaryCta.label}
            </Button>
            <Button href={content.secondaryCta.href} variant="outlineLight">
              {content.secondaryCta.label}
            </Button>
          </div>
        </div>

        {hasControls && (
          <div role="group" aria-label={labels.controls} className="flex items-center gap-1 lg:gap-2.5">
            <button type="button" className={controlClass} aria-label={labels.previous} onClick={() => go(index - 1)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={labels.dot(i + 1)}
                aria-current={i === index ? "true" : undefined}
                onClick={() => go(i)}
                className="group flex h-11 w-8 items-center justify-center rounded-full"
              >
                <span
                  aria-hidden="true"
                  className={`size-3 rounded-full border-trazo border-hueso transition-colors ${
                    i === index ? "bg-hueso" : "bg-capa/25 group-hover:bg-hueso/60"
                  }`}
                />
              </button>
            ))}
            <button type="button" className={controlClass} aria-label={labels.next} onClick={() => go(index + 1)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              className={controlClass}
              aria-label={playing ? labels.pause : labels.play}
              onClick={() => setChoice(!playing)}
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
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

type SlideMediaProps = {
  slide: HeroSlide;
  first: boolean;
  tone: string;
  videoRef: (video: HTMLVideoElement | null) => void;
};

function SlideMedia({ slide, first, tone, videoRef }: SlideMediaProps) {
  if (!slide.src) {
    return (
      <div className={`absolute inset-0 flex items-start justify-end p-4 lg:px-10 lg:py-7 ${tone}`}>
        <span aria-hidden="true" className="text-11 font-medium tracking-foto text-hueso uppercase lg:text-12">
          {slide.type === "video" ? ui.videoPending : ui.imagePending}
        </span>
      </div>
    );
  }

  if (slide.type === "video") {
    return (
      <video
        ref={videoRef}
        src={slide.src}
        poster={slide.poster}
        muted
        loop
        playsInline
        preload={first ? "auto" : "metadata"}
        aria-label={slide.alt || undefined}
        aria-hidden={slide.alt ? undefined : true}
        className="absolute inset-0 size-full object-cover"
      />
    );
  }

  return <Image src={slide.src} alt={slide.alt} fill sizes="100vw" preload={first} className="object-cover" />;
}
