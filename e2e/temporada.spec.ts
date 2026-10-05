import { expect, test } from "@playwright/test";
import { isInSeason, seasonRange } from "../lib/temporada";

// Fechas al mediodía de Buenos Aires (-03:00) para no depender del huso de la máquina.
const date = (iso: string) => new Date(`${iso}T12:00:00-03:00`);

test.describe("Temporada de un producto", () => {
  test("sin temporada se puede pedir siempre", () => {
    expect(isInSeason(null, date("2026-07-01"))).toBe(true);
  });

  test("rango dentro del mismo año (marzo a mayo)", () => {
    const season = { from: 3, to: 5 };
    expect(isInSeason(season, date("2026-02-28"))).toBe(false);
    expect(isInSeason(season, date("2026-03-01"))).toBe(true);
    expect(isInSeason(season, date("2026-05-31"))).toBe(true);
    expect(isInSeason(season, date("2026-06-01"))).toBe(false);
  });

  test("rango que cruza el año (septiembre a febrero)", () => {
    const season = { from: 9, to: 2 };
    expect(isInSeason(season, date("2026-08-31"))).toBe(false);
    expect(isInSeason(season, date("2026-09-01"))).toBe(true);
    expect(isInSeason(season, date("2026-12-25"))).toBe(true);
    expect(isInSeason(season, date("2027-02-28"))).toBe(true);
    expect(isInSeason(season, date("2027-03-01"))).toBe(false);
  });

  test("usa el mes de Buenos Aires, no el de UTC", () => {
    // 31/08 a las 22 h en Argentina ya es 1/09 en UTC: todavía no es temporada.
    expect(isInSeason({ from: 9, to: 2 }, new Date("2026-08-31T22:00:00-03:00"))).toBe(false);
  });

  test("arma el texto del rango", () => {
    expect(seasonRange({ from: 9, to: 2 })).toBe("de septiembre a febrero");
  });
});
