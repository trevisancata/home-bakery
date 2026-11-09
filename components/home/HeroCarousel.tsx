"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui, type HeroSlide } from "@/data/site";
import { useDespuesDelLoad } from "@/lib/use-despues-del-load";

const content = pages.home.hero;
const labels = content.carousel;

/** Lo mínimo que hay que deslizar en horizontal para cambiar de foto, en px. */
const swipeThreshold = 40;

// Colores de los placeholders mientras no hay fotos: se alternan para que
// se note el cambio de diapositiva.
const placeholderTones = ["bg-chocolate-claro", "bg-chocolate", "bg-taupe"];

// Sutiles a los costados de la foto. En reposo, el ícono (hueso al 80% sobre
// capa/30) da 3.15:1 sobre una foto blanca con la capa del carrusel; con hover
// o foco, 4.6:1.
const arrowClass =
  "absolute top-1/3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-capa/30 text-hueso/80 transition-colors hover:bg-capa/55 hover:text-hueso focus-visible:bg-capa/55 focus-visible:text-hueso lg:top-1/2";

/**
 * Portada del inicio: carrusel a todo el ancho con fotos o videos, una capa
 * oscura y los textos de Maggie encima.
 *
 * No avanza solo: se cambia deslizando con el dedo, arrastrando con el mouse
 * o con las flechas de los costados, que son botones con nombre y foco
 * visible. Cada cambio anuncia "Foto 2 de 3" (aria-live polite). Los videos
 * se pausan con su propio ícono o tocándolos (BackgroundVideo).
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  // Vacío al cargar, para no anunciar nada hasta que la persona cambie de foto.
  const [announcement, setAnnouncement] = useState("");
  // Las demás fotos se piden después del evento load (o al cambiar de foto):
  // están en la pantalla, apiladas y transparentes, así que el lazy loading
  // no las frena y le sacaban ancho de banda a la primera, que es el LCP.
  const restoCargado = useDespuesDelLoad();
  const drag = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  const hasControls = total > 1;

  const go = (next: number) => {
    const target = (next + total) % total;
    setIndex(target);
    setAnnouncement(labels.position(target + 1, total));
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    dragged.current = false;
    if (!hasControls || event.button !== 0) return;
    // Desde un link o un botón, es un clic.
    if ((event.target as Element).closest("a, button")) return;
    drag.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < swipeThreshold || Math.abs(dx) < Math.abs(dy)) return;
    dragged.current = true;
    go(index + (dx < 0 ? 1 : -1));
  };

  // Después de arrastrar, el clic no pausa el video que quedó abajo.
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!dragged.current) return;
    dragged.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <section
      data-surface="dark"
      aria-roledescription="carrusel"
      aria-label={content.label}
      // pan-y: el scroll vertical sigue siendo del navegador; el horizontal, del carrusel.
      className="relative h-160 touch-pan-y touch-pinch-zoom overflow-hidden bg-chocolate select-none lg:h-180"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onClickCapture={onClickCapture}
    >
      <div className="absolute inset-0">
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
              {(i === 0 || active || restoCargado) && (
                <SlideMedia
                  slide={slide}
                  first={i === 0}
                  active={active}
                  tone={placeholderTones[i % placeholderTones.length]}
                />
              )}
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

      {/* Deja pasar los toques al video de abajo, salvo en los botones. */}
      <div className="contenedor pointer-events-none relative flex h-full flex-col justify-end gap-4 pb-5 lg:pb-22">
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
          <div className="pointer-events-auto flex flex-col gap-2.5 lg:mt-2 lg:flex-row lg:gap-4">
            <Button href={content.primaryCta.href} variant="light">
              {content.primaryCta.label}
            </Button>
            <Button href={content.secondaryCta.href} variant="outlineLight">
              {content.secondaryCta.label}
            </Button>
          </div>
        </div>
      </div>

      {hasControls && (
        <>
          <button type="button" className={`${arrowClass} left-2 lg:left-5`} aria-label={labels.previous} onClick={() => go(index - 1)}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className={`${arrowClass} right-2 lg:right-5`} aria-label={labels.next} onClick={() => go(index + 1)}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {/* Solo visuales: la posición ya la anuncia el aria-live. La actual es más ancha, no solo más clara. */}
          <div
            aria-hidden="true"
            data-testid="carrusel-puntos"
            className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 lg:bottom-8"
          >
            {slides.map((_, i) => (
              <span
                key={i}
                data-actual={i === index ? "" : undefined}
                className={`h-1.5 rounded-full transition-all motion-safe:duration-300 ${
                  i === index ? "w-4 bg-hueso/90" : "w-1.5 bg-hueso/45"
                }`}
              />
            ))}
          </div>
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </>
      )}
    </section>
  );
}

type SlideMediaProps = {
  slide: HeroSlide;
  first: boolean;
  active: boolean;
  tone: string;
};

function SlideMedia({ slide, first, active, tone }: SlideMediaProps) {
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
      <BackgroundVideo
        src={slide.src}
        poster={slide.poster}
        // La primera diapositiva es la imagen principal de la página (LCP).
        posterPreload={first}
        active={active}
        className="absolute inset-0"
        buttonClassName="right-4 top-4 lg:right-10 lg:top-7"
      />
    );
  }

  return (
    <Image
      src={slide.src}
      alt={slide.alt}
      fill
      sizes="100vw"
      // La primera foto es la imagen principal de la página (LCP).
      preload={first}
      draggable={false}
      className={`object-cover ${slide.objectPosition ?? ""}`}
    />
  );
}
