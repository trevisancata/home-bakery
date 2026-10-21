// Textos del panel de administración (login, recuperación, 403). Igual que
// data/site.ts: los componentes no tienen textos escritos adentro.

export const admin = {
  metadata: { title: "Panel" },
  brandAlt: "Home Bakery",
  accessNote: ["Acceso solo para administración.", "Los clientes compran sin crear cuenta."],
  login: {
    metadata: { title: "Ingresar" },
    // Saludo del mockup (docs/mockup/admin-login.html).
    title: "Hola, Maggie",
    email: "Email",
    password: "Contraseña",
    submit: "Ingresar",
    submitting: "Ingresando…",
    forgot: { label: "¿Olvidaste tu contraseña?", href: "/admin/recuperar" },
    errors: {
      // Genérico a propósito: no dice si el email existe.
      credentials: "El email o la contraseña no coinciden. Probá de nuevo.",
      tooMany: (minutes: number) =>
        `Demasiados intentos. Probá de nuevo en ${minutes === 1 ? "1 minuto" : `${minutes} minutos`}.`,
      tooManyLater: "Demasiados intentos. Probá de nuevo en unos minutos.",
      email: "Ingresá tu email.",
      emailFormat: "Revisá el email: tiene que ser del estilo nombre@ejemplo.com.",
      password: "Ingresá tu contraseña.",
    },
  },
  recover: {
    metadata: { title: "Recuperar la contraseña" },
    title: "Recuperar la contraseña",
    text: "Escribí tu email y te mandamos un link para elegir una contraseña nueva.",
    submit: "Mandar el link",
    submitting: "Mandando…",
    // Mismo mensaje exista o no el email.
    sent: "Si el email está registrado, te llega un link en unos minutos. Revisá también el correo no deseado.",
    back: { label: "Volver a ingresar", href: "/admin/ingresar" },
    invalidLink: "El link venció o ya se usó. Pedí uno nuevo.",
    unexpected: "No pudimos mandar el link. Probá de nuevo en un rato.",
  },
  newPassword: {
    metadata: { title: "Contraseña nueva" },
    title: "Elegí una contraseña nueva",
    password: "Contraseña nueva",
    passwordHint: "Al menos 8 caracteres.",
    confirm: "Repetí la contraseña",
    submit: "Guardar la contraseña",
    submitting: "Guardando…",
    errors: {
      short: "Usá al menos 8 caracteres.",
      long: "Usá menos de 72 caracteres.",
      mismatch: "Las contraseñas no coinciden.",
      unexpected: "No pudimos cambiar la contraseña. Pedí un link nuevo y probá otra vez.",
    },
  },
  forbidden: {
    metadata: { title: "No tenés permiso" },
    eyebrow: "Error 403",
    title: "No tenés permiso",
    text: "Ingresaste, pero tu cuenta no tiene acceso al panel. Si creés que es un error, pedile a la administradora que te asigne el rol.",
    signOut: "Cerrar sesión",
    home: { label: "Ir al sitio", href: "/" },
  },
  home: {
    title: "Panel de Home Bakery",
    // TODO(E5): el panel (productos, workshops e inscripciones) llega en el próximo PR.
    text: "El panel con productos, workshops e inscripciones llega en el próximo PR. Por ahora, la API de admin ya está disponible en /api/v1/admin.",
    signedInAs: (email: string) => `Ingresaste como ${email}.`,
    signOut: "Cerrar sesión",
  },
};
