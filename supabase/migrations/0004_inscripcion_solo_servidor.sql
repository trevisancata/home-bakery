-- Home Bakery · E6: crear_inscripcion solo desde el servidor.
-- Se corre una vez en el SQL Editor, después de 0003. Ver docs/seguridad.md.
--
-- Hasta acá, cualquiera con la clave publishable (que es pública) podía
-- llamar a crear_inscripcion directo por la API de Supabase, sin pasar por
-- POST /api/v1/inscripciones: sin rate limit y sin preferencia de pago.
-- Desde ahora solo la ejecuta el servidor con la secret key (service_role),
-- después de validar el pedido y el rate limit.

revoke execute on function public.crear_inscripcion(text, text, text, text, integer, boolean, text, text, text)
  from public, anon, authenticated;
grant execute on function public.crear_inscripcion(text, text, text, text, integer, boolean, text, text, text)
  to service_role;
