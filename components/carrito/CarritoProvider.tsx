"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { pedidos } from "@/data/site";
import { agregarLinea, claveCarrito, claveLinea, guardarCarrito, type Linea } from "@/lib/carrito/lineas";

// Carrito en el navegador: localStorage + un contexto de React. Con
// useSyncExternalStore, el servidor y la primera pasada del cliente ven el
// carrito vacío (no hay mismatch de hidratación) y otra pestaña que lo
// cambia avisa con el evento "storage". localStorage puede no estar
// (navegación privada, almacenamiento bloqueado): todo va con try/catch.
//
// El esquema zod que valida lo guardado se carga con import() después de
// hidratar, cuando el navegador está libre, para no sumarlo al JS del
// primer render de cada página.
// Hasta que llega, el carrito no está "listo" y las acciones esperan: así
// nunca se escribe encima de lo guardado sin haberlo leído.

const vacio: Linea[] = [];
const listeners = new Set<() => void>();
let cacheRaw: string | null = null;
let cacheLines: Linea[] = vacio;
let leer: ((raw: string | null) => Linea[]) | null = null;
let cargando: Promise<void> | null = null;

function avisar() {
  for (const listener of listeners) listener();
}

function cargar() {
  cargando ??= import("@/lib/carrito/esquema").then((esquema) => {
    leer = esquema.leerCarrito;
    avisar();
  });
  return cargando;
}

/**
 * Al montar, el esquema se pide cuando el navegador está libre (no compite
 * con la hidratación). Si antes hay una acción, cambiar() lo pide al toque.
 */
function cargarCuandoPueda() {
  if (cargando) return;
  if ("requestIdleCallback" in window) window.requestIdleCallback(() => void cargar(), { timeout: 2000 });
  else setTimeout(() => void cargar(), 200);
}

/** Aplica un cambio sobre el carrito leído (si todavía no se leyó, espera). */
function cambiar(fn: (lines: Linea[]) => Linea[]) {
  if (leer) escribir(fn(snapshot()));
  else void cargar().then(() => escribir(fn(snapshot())));
}

function leerRaw() {
  try {
    return window.localStorage.getItem(claveCarrito);
  } catch {
    return null;
  }
}

function snapshot() {
  if (!leer) return vacio;
  const raw = leerRaw();
  // Misma cadena → mismo arreglo: useSyncExternalStore necesita referencias estables.
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheLines = leer(raw);
  }
  return cacheLines;
}

function escribir(lines: Linea[]) {
  try {
    if (lines.length === 0) window.localStorage.removeItem(claveCarrito);
    else window.localStorage.setItem(claveCarrito, guardarCarrito(lines));
  } catch {
    // Sin almacenamiento: el carrito vive solo en esta pestaña.
    cacheRaw = guardarCarrito(lines);
    cacheLines = lines;
  }
  avisar();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  cargarCuandoPueda();
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === claveCarrito) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const listo = () => leer !== null;

type Carrito = {
  lines: Linea[];
  /** false en el servidor, en la primera pasada y hasta que llega el esquema: todavía no se leyó localStorage. */
  ready: boolean;
  add: (linea: Linea) => void;
  setQuantity: (clave: string, quantity: number) => void;
  remove: (clave: string) => void;
  /**
   * Cambia las líneas a partir de las de ese momento (no de las de un
   * render viejo): la revisión de precios termina cuando quiere, y si
   * mientras tanto se quitó una línea, no tiene que volver.
   */
  update: (fn: (lines: Linea[]) => Linea[]) => void;
  clear: () => void;
  /** Último aviso para la región aria-live del header. */
  announcement: string;
  announce: (text: string) => void;
};

const CarritoContext = createContext<Carrito | null>(null);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, snapshot, () => vacio);
  const ready = useSyncExternalStore(subscribe, listo, () => false);
  const [announcement, setAnnouncement] = useState("");

  const add = useCallback((linea: Linea) => cambiar((lines) => agregarLinea(lines, linea)), []);
  const setQuantity = useCallback((clave: string, quantity: number) => {
    const q = Math.max(1, Math.min(pedidos.maxCantidad, Math.round(quantity)));
    cambiar((lines) => lines.map((linea) => (claveLinea(linea) === clave ? { ...linea, quantity: q } : linea)));
  }, []);
  const remove = useCallback((clave: string) => cambiar((lines) => lines.filter((linea) => claveLinea(linea) !== clave)), []);
  const update = useCallback((fn: (lines: Linea[]) => Linea[]) => cambiar(fn), []);
  const clear = useCallback(() => cambiar(() => []), []);

  const value = useMemo(
    () => ({ lines, ready, add, setQuantity, remove, update, clear, announcement, announce: setAnnouncement }),
    [lines, ready, add, setQuantity, remove, update, clear, announcement],
  );
  return <CarritoContext value={value}>{children}</CarritoContext>;
}

export function useCarrito() {
  const carrito = useContext(CarritoContext);
  if (!carrito) throw new Error("useCarrito va adentro de <CarritoProvider>.");
  return carrito;
}
