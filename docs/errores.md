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

## 21/10/2026

### Tests atados a una fecha de ejemplo que ya pasó

**PR:** #12 (`feat/e5-auth-admin-api`)

**Qué pasó:** dos tests del E4 buscaban el workshop de ejemplo `budines-para-empezar` por slug. Su fecha (17/10) ya había pasado, así que salió de `/workshops` y los tests fallaron, aunque el código estaba bien. Un tercero ("404 si el workshop es de ejemplo") seguía pasando, pero por la razón equivocada: daba 404 porque ya había empezado, no por ser de ejemplo.

**Solución:** `proximoWorkshopDeEjemplo()` (`e2e/support/supabase.ts`) busca el próximo de ejemplo que todavía no empezó. Si no queda ninguno, esos tests se saltean con el motivo.

**Para que no se repita:** un test no puede depender de una fecha fija de los datos reales. Se crean datos propios (como los workshops `e2e-…`) o se buscan de forma dinámica.

### `getByRole("alert")` encontraba el aviso de Next

**PR:** #12

**Qué pasó:** Next agrega a cada página un `<p role="alert">` vacío (el *route announcer*, que anuncia los cambios de página a los lectores de pantalla). El test del login esperaba el aviso de error con `getByRole("alert")` y encontraba ese, vacío.

**Solución:** los tests buscan el aviso dentro del formulario: `page.locator("form").getByRole("alert")`.

### Lighthouse midió un servidor viejo

**PR:** #12

**Qué pasó:** la primera medición de `/admin/ingresar` dio errores de consola y botones de 18 px de alto. En el puerto quedaba un `next start` anterior, que servía un build ya borrado: el CSS y el JS respondían 500 y la página se veía sin estilos. El servidor nuevo no había podido arrancar porque el puerto estaba ocupado.

**Solución:** liberar el puerto (`lsof -ti tcp:3200 | xargs kill`), volver a levantar el build y medir de nuevo: 100 en Accessibility y en Best Practices.

**Para que no se repita:** antes de medir, confirmar que el puerto está libre y que el servidor que responde es el del último build.

### Cerrar sesión cerraba todas las sesiones

**PR:** #12

**Qué pasó:** `signOut()` de Supabase usa por defecto `scope: "global"`: revoca todas las sesiones de la usuaria, en todos los dispositivos. En los tests, el que prueba "Cerrar sesión" habría cerrado también la sesión compartida que usan los demás tests de la admin. Lo mismo le pasaría a Maggie: cerrar sesión en la compu la sacaría también del celular.

**Solución:** `signOut({ scope: "local" })` cierra solo la sesión de ese navegador. El test usa una sesión propia.

### Las plantillas de mail no se pueden editar sin SMTP propio

**PR:** #12

**Qué pasó:** el plan usaba una plantilla de mail propia con `token_hash` para la recuperación de contraseña. Pero en este proyecto de Supabase las plantillas no se pueden editar sin SMTP propio. Además, el SMTP por defecto solo manda mails a los miembros del equipo del proyecto, y pocos por hora.

**Solución:** a pedido de Catalina, `/admin/auth/confirm` acepta las dos formas de link: `?code=` (PKCE, la plantilla por defecto) y `?token_hash=` (para cuando haya SMTP). Si el link no sirve (venció o se abrió en otro navegador), lo explica y ofrece pedir otro. La configuración de producción quedó como `TODO(SMTP)` en el README, con la plantilla en español. Mientras tanto, si Maggie olvida la contraseña, Catalina se la resetea desde el dashboard.

## 21/10/2026 (E6)

### La página de resultado mostraba "pendiente" con el pago ya registrado

**PR:** #13 (`feat/e6-mercadopago-sena`)

**Qué pasó:** al volver de Mercado Pago, la página lee la inscripción, concilia con la API de MP y la vuelve a leer. El pago quedaba registrado en la base, pero la página seguía diciendo "Estamos esperando la confirmación del pago". Los e2e lo detectaron.

**Causa:** dos problemas juntos.
1. Next **memoiza los `fetch` GET iguales dentro de un render**, y supabase-js usa `fetch`. La segunda lectura era idéntica a la primera, así que devolvía el mismo resultado viejo.
2. La conciliación llamaba a `revalidatePath` durante el render de un Server Component. Next no lo permite y lanza un error.

**Solución:**
- La lectura usa `.abortSignal(new AbortController().signal)`, que es como la documentación de Next indica salir de la memoización.
- La revalidación va en `after()`, que corre después del render.
- Se encontró reproduciendo el caso a mano: el pago estaba en `pagos`, pero la página no lo mostraba.

**Para que no se repita:** si una página escribe y después vuelve a leer en el mismo render, la segunda lectura tiene que salir de la memoización. `revalidatePath` va siempre en una Server Action, en un Route Handler o en `after()`.

### El `.ics` no escapaba el punto y coma

**PR:** #13

**Qué pasó:** el test unitario del `.ics` falló: `;` quedaba sin escapar, y en un título con `;` el calendario lo cortaría. En el código había `"\;"` en lugar de `"\;"`. El archivo se había escrito con un heredoc de la terminal, que se comió una barra.

**Solución:** corregido, y el test lo cubre ("Workshop: Tortas, capas; y más").

**Para que no se repita:** cuando un archivo tiene barras invertidas (regex, escapes), escribirlo con el editor y no con un heredoc. Y que un test cubra el escape.

## 22/10/2026

### 401 del webhook con los pagos reales

**PR:** #14 (`fix/webhook-firma`)

**Síntoma:** en producción, el webhook de Mercado Pago respondía **401** a los avisos de los pagos reales. Las inscripciones igual se reservaban por la conciliación de la página de resultado, pero sin ella un pago aprobado habría quedado sin registrar.

**Cómo lo diagnosticamos:**
1. **Logs de Vercel:** el webhook registraba "Webhook de Mercado Pago con firma inválida (SignatureMismatch)". Los avisos llegaban con `?data.id=…&type=payment&source_news=webhooks`, es decir, por la `notification_url` que mandaba la preferencia.
2. **"Simular notificación" en Tus integraciones (modo prueba):** respondía **200**. La clave cargada en Vercel (`MP_WEBHOOK_SECRET`) era la correcta, y la validación del código funcionaba.
3. **Conclusión:** los avisos por la `notification_url` de la preferencia no validaban con la clave del panel; los del panel, sí.

**Solución:**
- La preferencia **ya no manda `notification_url`**, así MP usa el webhook configurado en el panel, que firma con su clave.
- `MP_WEBHOOK_SECRET` se usa con `trim()`, por si se pegó con un salto de línea.
- Cuando la firma falla, el log suma un diagnóstico sin la clave, sin la firma y sin datos personales: `ts`, `x-request-id`, `data.id`, si vino `source_news` y el largo de la clave. Se sacó después, cuando el webhook quedó andando (ver [401 del webhook con las credenciales TEST-](#401-del-webhook-con-las-credenciales-test)).
- Los tests unitarios cubren las tres cosas.

**Para que no se repita:**
- El webhook se configura en un solo lugar, el panel de MP, documentado en [pagos.md](pagos.md#el-webhook-se-configura-en-el-panel-no-en-la-preferencia).
- Ante un 401, comparar con "Simular notificación": si la simulación da 200, la clave está bien y hay que mirar por dónde llega el aviso.

### Los diálogos enfocaban "Borrar definitivamente"

**PR:** #15 (`feat/e5-panel-admin`)

**Qué pasó:** el e2e de borrar un producto esperaba que, al abrirse el diálogo de confirmación, el foco estuviera en la opción segura ("Pausarlo en su lugar"). Estaba en el primer botón del diálogo. Con el teclado, un Enter de más podía borrar el producto.

**Causa:** el botón tenía `autoFocus`, pero React no pone el atributo `autofocus` en el HTML: lo maneja con JavaScript cuando el elemento se monta. El diálogo está siempre montado y se abre con `showModal()`, que busca el atributo en el HTML, no lo encontraba y enfocaba el primer botón.

**Solución:** la opción segura lleva `data-autofocus`, y `ConfirmDialog` la enfoca después de `showModal()`. Vale para los cuatro diálogos del panel.

**Para que no se repita:** con `<dialog>` y `showModal()`, no usar `autoFocus` de React: hay que llevar el foco a mano.

### 401 del webhook con las credenciales TEST-

**PR:** #16 (`fix/mp-webhook-docs`)

**Síntoma:** después del PR #14, el webhook seguía respondiendo **401 SignatureMismatch** a los avisos de los pagos reales del sandbox (pagos con la cuenta compradora de prueba). La clave cargada en `MP_WEBHOOK_SECRET` era la del panel, sin espacios.

**Causa:** se usaban las credenciales de prueba (`TEST-…`). Con ellas, la firma `x-signature` de esos avisos no validaba con la clave secreta del webhook.
<!-- TODO: confirmar con la documentación de Mercado Pago por qué la firma no valida con las credenciales TEST-. Lo verificado es que con TEST- da 401 y con la configuración de abajo da 200. -->

**Solución:**
- Se creó la aplicación "Home-Bakery2" **dentro de la cuenta vendedora de prueba**, y se usan **sus credenciales de producción** (`APP_USR-…`) como `MP_ACCESS_TOKEN`.
- El webhook se configuró en esa aplicación, en **Modo productivo**, solo con el evento **Pagos**, y su clave secreta es `MP_WEBHOOK_SECRET`.
- Se paga con la cuenta compradora de prueba, en una ventana de incógnito.
- Verificado: el aviso `payment.created` se entregó con **200** y el pago quedó conciliado.
- El diagnóstico de la firma que había sumado el PR #14 se sacó: el log de una firma inválida quedó en un `console.warn` con el motivo y el `x-request-id`.

**Para que no se repita:**
- Los pasos están en [pruebas-mercadopago.md](pruebas-mercadopago.md#configuración-que-funciona), y qué credenciales van en cada etapa, en [pagos.md](pagos.md#qué-credenciales-se-usan-en-cada-etapa).
- El token y la clave del webhook tienen que ser de la **misma aplicación** y del **mismo modo** (productivo). Al publicar, se cambian los dos juntos por los de la cuenta de Maggie.

## 27/10/2026

### El LCP del video esperaba a que arrancara

**PR:** `feat/contenido-maggie-2`

**Qué pasó:** con el reel en el hero de `/workshops`, Lighthouse marcaba el `<video>` como LCP, con casi todo el tiempo en "Render Delay". El póster se descargaba primero, con prioridad alta, pero el LCP recién se registraba cuando el video empezaba a reproducirse. Y el video arranca después de hidratar, porque en el servidor se asume movimiento reducido.

**Solución:**
- El póster es un `<img>` de next/image con `preload` debajo del video. Se pinta con el HTML y Chrome lo toma como LCP. El primer cuadro del video tiene el mismo tamaño, así que ya no cuenta como un LCP nuevo.
- next/image lo sirve en WebP (9,6 KB contra 40 KB del JPG).
- El video no lleva el atributo `poster`, para no descargar la imagen dos veces. Sin reproducir, `preload="none"`, así que con movimiento reducido queda solo el póster.
- Se comparó contra `main` con 8 corridas de cada uno: el LCP observado quedó prácticamente igual (1,26 s contra 1,20 s). Ver [lighthouse.md](lighthouse.md#workshops-con-el-video-del-hero).

**Para que no se repita:**
- Con un video arriba de todo, medir el LCP y mirar qué elemento es y en qué fase se va el tiempo.
- Comparar el LCP **observado** además del simulado, y contra `main` con varias corridas: una sola corrida varía mucho.
