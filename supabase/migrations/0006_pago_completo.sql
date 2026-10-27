-- Home Bakery · pago completo: se paga el 100% al inscribirse, sin seña.
-- Se corre una vez en el SQL Editor, después de 0005. Ver docs/pagos.md.
--
-- No se renombra nada: sena_porcentaje, monto_sena y el estado
-- pendiente_sena quedan como nombres internos. crear_inscripcion y
-- confirmar_pago no cambian: con el 100% calculan y exigen el total.
-- Las inscripciones pendientes que ya existían conservan su monto_sena y
-- vencen solas a los 30 minutos.

-- ---------------------------------------------------------------- workshops
alter table public.workshops
  alter column sena_porcentaje set default 100;

update public.workshops
  set sena_porcentaje = 100
  where sena_porcentaje <> 100;
