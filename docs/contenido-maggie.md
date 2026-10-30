# Contenido aprobado por Maggie

Textos que mandó Maggie por WhatsApp el 01/10/2026. Son la fuente para `data/site.ts`. Solo se corrigió ortografía (tildes, mayúsculas); el contenido es suyo y **no se reescribe sin su OK**.

## Logo

Usar solo "home bakery", sin "cakes & pastries" (con la bajada queda todo más chiquito).
Archivos: `public/brand/homebakery_logo_sin_tagline.png` y `public/brand/homebakery_logo_sin_tagline_white.png`.

## Portada (inicio)

- Encabezado (eyebrow): Artesanal, delicado y casero
- Título: Pastelería y workshops
- Bajada: Workshops reducidos en mi cocina y pastelería por encargo. Pedidos con 48 h de anticipación. Take away en San Isidro.
- Foto: bien horizontal, a todo el ancho (como la web de Violeta Massey). No a la derecha con bordes redondeados. Si puede ser video, suma. Idealmente un carrusel de 3 o 4 imágenes o videos.

## Presentación (Maggie)

Foto: `public/fotos/maggie-presentacion.jpg`.

> Home Bakery nació en mi cocina, horneando siempre para mi familia y amigos.
>
> Soy diseñadora gráfica, dediqué casi 15 años al mundo del diseño y la publicidad. Aprendí mucho y lo disfruté un montón, pero cumplió un ciclo en mi vida.
>
> Y como a muchas mujeres nos pasa, la llegada de los hijos en nuestra vida trae cambios y desestructura un poco. Ya no quería trabajar fuera de casa tanto tiempo, quería estar más cerca de ellos.
>
> Así fue que me animé a cambiar y empezar el camino de la gastronomía, que siempre fue parte de mi vida, siempre cociné como modo de conexión y desconexión a la vez.
>
> Me formé en el IAG como chef profesional y como pastelera en el Ott College. Dediqué mucho tiempo a aprender de grandes referentes. Hice pasantías y me nutrí de quienes tuve cerca para aprender.
>
> Hoy pude conformar una comunidad que le suma a lo que hago, pero casi todo sigue llegando porque alguien le contó a alguien. Y como soy muy inquieta, empecé a organizar workshops de pastelería en mi cocina, para compartirles todo lo que fui aprendiendo en estos 10 años.
>
> Espero verte pronto en mi cocina.

## Workshops: "Grupos reducidos en mi cocina"

> Enseñar pastelería no es solo pasar recetas. Es aprender a leer una masa, a entender por qué algo sale bien o por qué no sale. Es saber cuándo seguir una receta y cuándo no. Eso no se aprende en un PDF, se aprende mirando, preguntando, probando y equivocándose con alguien al lado. Yo aprendí así. Y así también trabajo.
>
> Los workshops son un lugar de encuentro, un momento para frenar, compartir y disfrutar.
> Las recibo con un rico café, una mini degustación. Preparo mi espacio para que todos se sientan cómodos.
> Les hago una demo de las recetas que vamos a preparar y luego trabajan ustedes. ¡Y ahí es cuando más aprenden, disfrutan, se ríen y nos divertimos!
> La mejor parte es que cada uno se lleva una cajita con todo lo que preparamos. ¡Los espero!

Indicaciones de Maggie: primero mostrar qué son los workshops, con video de fondo que muestre la dinámica de cocina (tiene varios reels para pasar). No darle tanto protagonismo al workshop del mes: ponerlo abajo, tipo agenda.

## Preguntas frecuentes de workshops

- **¿Dónde es?** En mi cocina, en San Isidro.
- **¿Cuánto dura?** Dura 2 horas aprox. La primera hora es una demostración y la segunda hora trabajan ustedes las recetas que aprendieron.
- **¿Cómo reservo mi lugar?** Completá el formulario y dejá una seña del 50%. Tu lugar solo queda reservado con la seña.
- **¿Puedo cancelar o pasar mi lugar a otra persona si a último momento no puedo ir?** ¡Sí, obvio! La idea es que esa clase no se pierda. Lo que no hacemos es reembolsar el dinero si no pudo venir nadie.
- **¿Hasta cuántas personas es?** Los workshops son grupos reducidos de hasta 8 personas.
- **¿En qué situación se suspende el workshop?** Si no llegamos a un mínimo de 4 personas, el workshop se reagenda para otra fecha.

## Reglas de negocio que salen de estos textos

- Cupo máximo por workshop: 8 personas. Mínimo para que se haga: 4.
- Duración: 2 h aprox. (1 h demo + 1 h práctica).
- Reserva con **seña del 50%**. Pendiente con Maggie: cuándo y cómo se paga el saldo.
- No hay reembolso; se puede pasar el lugar a otra persona.

## Pedidos de la tienda (confirmado por Maggie, 28/10)

Están en una sola config, [`data/site.ts`](../data/site.ts) → `pedidos`, y la base las vuelve a validar (`crear_pedido`, migración 0007).

- **Entrega:**
  - **Retiro en San Isidro.** Si el cliente vive lejos, puede mandar un Uber o una moto a retirarlo (se muestra como ayuda en el checkout).
  - **Envío** solo con un total desde **$ 400.000** y a **10 km o menos**. La distancia no se calcula: el cliente carga dirección y localidad, y Maggie la valida al aceptar.
- **Horarios de retiro o entrega:** lunes a viernes de 10 a 19 h, en franjas de 10 a 13, 13 a 16 y 16 a 19; sábados de 9 a 13; domingos, cerrado.
- **Anticipación:** la mayor de los productos del pedido (hoy, 48 h), contada hasta que empieza la franja. Se puede encargar hasta 30 días adelante.
- **Pago:** el 100% con Mercado Pago al hacer el pedido. No hay mínimo de compra ni tope de pedidos por día.
- **Maggie tiene que aceptar cada pedido:** pagarlo no lo confirma. Se dice en el checkout y en la página de resultado ("Tu pedido está pagado y Maggie lo va a confirmar; te escribe por WhatsApp").
- **A medida** (number cakes y tortas a medida): no van al carrito, se consultan por WhatsApp con un mensaje armado.
- **Inactivos o fuera de temporada:** no se pueden agregar ni comprar.

Decisiones de implementación (no son de Maggie): los tamaños con "Precio a confirmar" no van al carrito; si el producto tiene sabores, hay que elegir uno, y la decoración es opcional.

## Pendiente de Maggie

- 3 o 4 fotos o videos horizontales para el carrusel de la portada.
- Reels de los workshops para el video de fondo.
- Nombre, mes/año y foto de 4 workshops pasados.
- Saldo de la seña: cuándo y cómo se paga.
- Costo del envío. Hoy no se cobra y el checkout lo aclara (`TODO(Maggie)` en `data/site.ts`).
- Feriados: hoy se puede elegir un feriado de lunes a sábado.
- Plazo y forma de la devolución cuando rechaza un pedido pagado.
