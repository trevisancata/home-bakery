import { expect, test } from "@playwright/test";
import { baDesdeIso, isoDesdeBA } from "../lib/fecha-ba";
import { waLink, waNumero } from "../lib/whatsapp-numero";

test.describe("Fecha y hora de Buenos Aires", () => {
  test("arma el ISO con -03:00", () => {
    expect(isoDesdeBA("2026-11-14", "15:30")).toBe("2026-11-14T15:30:00-03:00");
    expect(new Date(isoDesdeBA("2026-11-14", "22:00")!).toISOString()).toBe("2026-11-15T01:00:00.000Z");
  });

  test("rechaza lo que no es una fecha u hora", () => {
    expect(isoDesdeBA("", "15:30")).toBeNull();
    expect(isoDesdeBA("2026-11-14", "")).toBeNull();
    expect(isoDesdeBA("14/11/2026", "15:30")).toBeNull();
  });

  test("y vuelve a fecha y hora de Buenos Aires desde cualquier zona", () => {
    expect(baDesdeIso("2026-11-15T01:00:00.000Z")).toEqual({ fecha: "2026-11-14", hora: "22:00" });
    expect(baDesdeIso("2026-11-14T15:30:00-03:00")).toEqual({ fecha: "2026-11-14", hora: "15:30" });
  });
});

test.describe("Número de WhatsApp de una inscripta", () => {
  test("lleva los formatos comunes a 549 + área + número", () => {
    for (const input of ["11 5555-6666", "011 15 5555 6666", "+54 9 11 5555 6666", "54 11 5555 6666", "1155556666", "11 15 5555 6666"]) {
      expect(waNumero(input), input).toBe("5491155556666");
    }
    expect(waNumero("351 555-6666")).toBe("5493515556666");
    expect(waNumero("0351 15 555 6666")).toBe("5493515556666");
  });

  test("si no parece un número argentino, no inventa", () => {
    expect(waNumero("123")).toBeNull();
    expect(waLink("123", "Hola")).toBe("https://wa.me/?text=Hola");
    expect(waLink("11 5555-6666", "Hola, Ana")).toBe("https://wa.me/5491155556666?text=Hola%2C%20Ana");
  });
});
