import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, PanelMain } from "@/components/admin/panel/Encabezado";
import { MostrarPestanaActual } from "@/components/admin/pedidos/MostrarPestanaActual";
import { TarjetaPedido } from "@/components/admin/pedidos/TarjetaPedido";
import { EstadoVacio } from "@/components/admin/ui/EstadoVacio";
import { admin } from "@/data/admin";
import { listarPedidos } from "@/lib/admin/pedidos";
import { agruparPorDia, type Pestana, pestanas, porPestana } from "@/lib/admin/pedidos-panel";
import { requireAdminPage } from "@/lib/auth";

const content = admin.pedidos;

/** Los pedidos repartidos en pestañas, con la hora con la que se calcularon (vencidas, "Hoy"). */
async function cargar() {
  const session = await requireAdminPage("/admin/pedidos");
  const now = Date.now();
  return { grupos: porPestana(await listarPedidos(session.supabase), now), now };
}

export const metadata: Metadata = content.metadata;

/**
 * Pedidos por etapa. Las pestañas son links (?tab=), así la página se arma
 * en el servidor, funciona sin JS y cada etapa tiene su URL (el Inicio linkea
 * a cada una). En "En curso", agrupados por día.
 */
export default async function PedidosPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const { tab } = await searchParams;
  // Los links viejos a "entregados" o "rechazados" llevan a la pestaña que los juntó.
  const pedida = tab === "entregados" || tab === "rechazados" ? "cerrados" : tab;
  const actual: Pestana = pestanas.includes(pedida as Pestana) ? (pedida as Pestana) : "por_confirmar";
  const { grupos, now } = await cargar();
  const pedidos = grupos[actual];

  return (
    <PanelMain>
      <Encabezado eyebrow={content.eyebrow} title={content.title} />
      <nav id="pedidos-pestanas" aria-label={content.tabsLabel} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <MostrarPestanaActual navId="pedidos-pestanas" />
        <ul className="flex gap-2 pb-1">
          {pestanas.map((p) => (
            <li key={p} className="shrink-0">
              <Link
                href={`/admin/pedidos?tab=${p}`}
                aria-current={p === actual ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full border px-4 text-14 no-underline ${
                  p === actual
                    ? "border-carbon bg-chocolate font-semibold text-hueso"
                    : "border-borde-control bg-white font-medium text-carbon hover:border-chocolate"
                }`}
              >
                {content.tabCount(content.tabs[p], grupos[p].length)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="pedidos-pestana" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="pedidos-pestana" className="text-26 lg:text-30">
            {content.tabs[actual]}
          </h2>
          <p className="text-14 text-secundario">{content.help[actual]}</p>
        </div>
        {pedidos.length === 0 ? (
          <EstadoVacio>{content.empty[actual]}</EstadoVacio>
        ) : actual === "en_curso" ? (
          agruparPorDia(pedidos, now).map((dia) => (
            <section key={dia.fecha} aria-labelledby={`dia-${dia.fecha}`} className="flex flex-col gap-3">
              <h3 id={`dia-${dia.fecha}`} className="font-label text-14 tracking-eyebrow text-chocolate uppercase">
                {dia.etiqueta}
              </h3>
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dia.pedidos.map((pedido) => (
                  <TarjetaPedido key={pedido.id} pedido={pedido} now={now} />
                ))}
              </ul>
            </section>
          ))
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pedidos.map((pedido) => (
              <TarjetaPedido key={pedido.id} pedido={pedido} now={now} />
            ))}
          </ul>
        )}
      </section>
    </PanelMain>
  );
}
