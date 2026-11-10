"use client";

// Peças visuais da Central de Compras. Os nomes de tipo e situação são os mesmos que a API grava.

export const TIPOS = {
  orcamento: { rotulo: "Orçamento", curto: "ORÇAMENTO", cor: "text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 ring-indigo-500/20" },
  pedido: { rotulo: "Pedido de compra", curto: "PEDIDO", cor: "text-purple-700 dark:text-purple-300 bg-purple-500/10 ring-purple-500/20" },
  nfe: { rotulo: "NF-e de entrada", curto: "NF-E", cor: "text-teal-700 dark:text-teal-300 bg-teal-500/10 ring-teal-500/20" },
};

const CINZA = { ponto: "bg-zinc-400", texto: "text-zinc-600 dark:text-zinc-300", fundo: "bg-zinc-500/10" };
const AMBAR = { ponto: "bg-amber-500", texto: "text-amber-700 dark:text-amber-400", fundo: "bg-amber-500/10" };
const AZUL = { ponto: "bg-sky-500", texto: "text-sky-700 dark:text-sky-400", fundo: "bg-sky-500/10" };
const ROXO = { ponto: "bg-purple-500", texto: "text-purple-700 dark:text-purple-300", fundo: "bg-purple-500/10" };
const VERDE = { ponto: "bg-emerald-500", texto: "text-emerald-700 dark:text-emerald-400", fundo: "bg-emerald-500/10" };
const VERMELHO = { ponto: "bg-rose-500", texto: "text-rose-700 dark:text-rose-400", fundo: "bg-rose-500/10" };
const APAGADO = { ponto: "bg-zinc-300 dark:bg-zinc-600", texto: "text-zinc-400", fundo: "bg-zinc-500/5" };

export const STATUS = {
  orcamento: { rotulo: "Orçamento", ...CINZA },
  aguardando_aprovacao: { rotulo: "Aguardando aprovação", ...AMBAR },
  aprovado: { rotulo: "Aprovado", ...AZUL },
  pedido_emitido: { rotulo: "Pedido emitido", ...ROXO },
  recebimento_parcial: { rotulo: "Recebimento parcial", ...AMBAR },
  recebido: { rotulo: "Recebido", ...VERDE },
  cancelado: { rotulo: "Cancelado", ...APAGADO },
  pendente: { rotulo: "NF-e Pendente", ...AMBAR },
  recebida: { rotulo: "NF-e Recebida", ...VERDE },
  divergente: { rotulo: "NF-e Divergente", ...VERMELHO },
  integrada: { rotulo: "NF-e Integrada", ...AZUL },
  cancelada: { rotulo: "NF-e Cancelada", ...APAGADO },
};

// O texto do botão diz o que acontece, não o nome do status
export const ACAO_DO_STATUS = {
  aguardando_aprovacao: "Enviar para aprovação",
  orcamento: "Voltar para orçamento",
  aprovado: "Aprovar",
  pedido_emitido: "Emitir pedido",
  recebimento_parcial: "Recebido em parte",
  recebido: "Marcar como recebido",
  recebida: "Marcar NF-e recebida",
  divergente: "Marcar divergência",
  cancelado: "Cancelar",
};

export function SeloTipo({ tipo }) {
  const t = TIPOS[tipo] || TIPOS.pedido;
  return <span className={`inline-flex items-center h-6 px-2.5 rounded-lg text-[10.5px] font-bold tracking-[0.06em] ring-1 ring-inset ${t.cor}`}>{t.curto}</span>;
}

export function SeloStatus({ status }) {
  const s = STATUS[status] || CINZA;
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold whitespace-nowrap ${s.fundo} ${s.texto}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.ponto}`} />
      {s.rotulo || status}
    </span>
  );
}

// A API devolve dia como "2026-11-05" e hora como "2026-11-09 09:22:28", já na hora de Brasília
export const diaCurto = (valor) => {
  const [ano, mes, dia] = String(valor || "").slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${ano}` : "";
};

export const quantidade = (valor) => (valor === null || valor === undefined ? "—" : Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 3 }));

export const numeroDoDocumento = (documento) => {
  if (documento.tipo_documento === "nfe") return `${documento.numero_documento || "s/n"}${documento.serie ? `-${documento.serie}` : ""}`;
  return documento.numero_documento || "s/n";
};
