"use client";

import { Check, ClipboardCheck, PackageCheck, ShoppingCart, Warehouse } from "lucide-react";

// Mesmos nomes que a API grava em hub_compras.status_recebimento
export const STATUS_COMPRA = {
  aguardando: { rotulo: "Aguardando", ponto: "bg-zinc-400", texto: "text-zinc-600 dark:text-zinc-300", fundo: "bg-zinc-500/10" },
  parcial: { rotulo: "Recebido em parte", ponto: "bg-amber-500", texto: "text-amber-700 dark:text-amber-400", fundo: "bg-amber-500/10" },
  recebido: { rotulo: "Recebido", ponto: "bg-sky-500", texto: "text-sky-700 dark:text-sky-400", fundo: "bg-sky-500/10" },
  divergencia: { rotulo: "Divergência", ponto: "bg-rose-500", texto: "text-rose-700 dark:text-rose-400", fundo: "bg-rose-500/10" },
  conferido: { rotulo: "Conferido", ponto: "bg-emerald-500", texto: "text-emerald-700 dark:text-emerald-400", fundo: "bg-emerald-500/10" },
  cancelado: { rotulo: "Cancelado", ponto: "bg-zinc-300 dark:bg-zinc-600", texto: "text-zinc-400", fundo: "bg-zinc-500/5" },
};

export const ORIGEM = { omie: "Omie", tiny: "Tiny", planilha: "Planilha", api: "API", manual: "Manual" };

export function ChipStatus({ status }) {
  const estilo = STATUS_COMPRA[status] || STATUS_COMPRA.aguardando;
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold whitespace-nowrap ${estilo.fundo} ${estilo.texto}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${estilo.ponto}`} />
      {estilo.rotulo}
    </span>
  );
}

// A API devolve dia como "2026-11-05" e hora como "2026-11-09 09:22:28", já na hora de Brasília
export const diaCurto = (valor) => {
  const [ano, mes, dia] = String(valor || "").slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${ano}` : "";
};
export const diaEHora = (valor) => {
  const texto = String(valor || "");
  return texto.length >= 16 ? `${diaCurto(texto)}, ${texto.slice(11, 16)}` : diaCurto(texto);
};

export const hojeIso = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 10);

export function diasDeAtraso(compra, hoje = hojeIso()) {
  if (!compra.data_prevista || !["aguardando", "parcial"].includes(compra.status_recebimento)) return 0;
  const diferenca = (new Date(`${hoje}T12:00:00`) - new Date(`${compra.data_prevista}T12:00:00`)) / 86400000;
  return diferenca > 0 ? Math.round(diferenca) : 0;
}

export const quantidade = (valor) => (valor === null || valor === undefined ? "—" : Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 3 }));

const ICONES_DA_ETAPA = { pedido: ShoppingCart, entrada: PackageCheck, conferencia: ClipboardCheck, estoque: Warehouse };

// Pedido → Entrada → Conferência → Estoque
export function LinhaDoTempo({ eventos }) {
  return (
    <ol className="relative space-y-0">
      {eventos.map((evento, posicao) => {
        const Icone = ICONES_DA_ETAPA[evento.etapa] || Check;
        const ultimo = posicao === eventos.length - 1;
        return (
          <li key={`${evento.etapa}-${posicao}`} className="relative flex gap-4 pb-5">
            {!ultimo && <span className={`absolute left-[17px] top-9 bottom-0 w-px ${evento.feito ? "bg-purple-500/40" : "bg-black/[0.08] dark:bg-white/[0.08]"}`} />}
            <span className={`relative z-10 w-9 h-9 shrink-0 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#161618] ${evento.feito ? "bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-[0_6px_14px_-6px_rgba(124,58,237,0.7)]" : "bg-black/[0.05] dark:bg-white/[0.07] text-zinc-400"}`}>
              <Icone size={16} />
            </span>
            <div className="min-w-0 pt-1.5">
              <p className={`text-sm font-semibold ${evento.feito ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{evento.titulo}</p>
              {(evento.quando || evento.quem) && (
                <p className="text-xs text-zinc-500 mt-0.5">{[diaEHora(evento.quando), evento.quem].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
