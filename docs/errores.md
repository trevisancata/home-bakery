# Errores y problemas

Problemas que aparecieron mientras se trabajaba con Claude Code, cómo se resolvieron y qué hacer para que no se repitan. El contexto de cada PR está en [bitacora-ia.md](bitacora-ia.md).

## 29/09/2026

### Archivos revertidos entre VS Code y Claude Code

**PR:** #4 (`feat/diseno-marca`)

**Qué pasó:** la primera sesión del PR se interrumpió y se relanzó con el prompt completo. Al retomar, la rama ya tenía seis commits, pero en el working tree `app/globals.css` y `data/site.ts` tenían cambios sin commitear que los devolvían a la versión provisoria del PR #3. Con eso la rama no compilaba, porque los componentes nuevos usaban tokens y datos que la versión vieja no tenía.

**Causa:** VS Code y Claude Code estaban trabajando sobre los mismos archivos al mismo tiempo, y quedó en disco la versión vieja. El mecanismo exacto no quedó registrado.
<!-- TODO: confirmar el mecanismo (por ejemplo, un guardado desde el editor o un deshacer) si se repite. -->

**Solución:** Claude Code frenó y preguntó cómo seguir. Catalina eligió descartar esos cambios (`git restore app/globals.css data/site.ts`) y continuar sobre los seis commits, que estaban bien.

**Para que no se repita:**

- No editar ni guardar en VS Code los archivos que Claude Code está modificando, sobre todo después de interrumpir una sesión.
- Antes de retomar una sesión interrumpida, revisar `git status` y `git diff`.
- Commits chicos: lo commiteado no se pierde y lo revertido se ve enseguida en el diff.

### El guardado en memoria no persiste en Vercel

**PR:** #7 (`feat/inscripcion-workshop`)

**Qué pasó:** el prompt pedía guardar las inscripciones en memoria hasta tener Supabase (E5). En Vercel, esa memoria se pierde con cada cold start. Como el sitio es público, una inscripción real podía guardarse, devolver 201 y perderse sin que Maggie se enterara.

**Solución:** se detectó al revisar el plan, antes de escribir código. Hasta E5, el paso de éxito muestra "Para confirmar tu lugar, mandale este mensaje a Maggie por WhatsApp", con un botón primario que abre `wa.me` con el mensaje ya armado: workshop, fecha, cantidad de lugares, nombre, WhatsApp, email, experiencia y alergias.

- El mensaje lo arma `lib/inscripcion-whatsapp.ts`, con un `TODO(E5)` para quitarlo cuando las inscripciones se guarden en Supabase.
- `lib/inscripciones.ts` sigue guardando en memoria, con un `TODO(E5)` para pasar a Supabase con el cupo y el alta en una transacción.
- El botón de Mercado Pago ("Muy pronto") quedó como secundario.
- El test e2e verifica que el link de WhatsApp tenga el nombre y la cantidad de lugares.

**Para que no se repita:** con cualquier guardado provisorio, preguntarse qué pasa en producción. Si una clienta puede perder algo, tiene que haber un respaldo que no dependa del servidor.

### Datos inventados en los borradores

**PRs:** #5, #6 y #7

**Qué pasó:** para completar lo que el mockup dejaba entre corchetes, los borradores traían precios provisorios, respuestas de preguntas frecuentes, una política de cancelación, frases en primera persona de Maggie y años en su línea de tiempo. Además, el mockup de inscripción tenía textos que prometen cosas a las clientas. Nada de eso estaba confirmado, y el sitio es público.

**Solución:** en los PRs #5 y #6 se pidió sacarlos antes de mergear y usar "Precio a confirmar", "A confirmar", la bio de Instagram de Maggie o un link a WhatsApp. En el PR #7, con la regla ya en `AGENTS.md`, Claude Code dejó afuera por su cuenta los textos del mockup que comprometen al negocio. El detalle está en [bitacora-ia.md](bitacora-ia.md#decisión-no-publicar-datos-inventados).

**Para que no se repita:** la regla quedó al principio de `AGENTS.md`, así que Claude Code la lee en cada sesión. Lo que falta está marcado con `TODO` en `data/`.
