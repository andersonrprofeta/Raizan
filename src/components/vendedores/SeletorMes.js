"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const mesDeHoje = () => {
  const hoje = new Date();
  return { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
};

export const nomeDoMes = ({ mes, ano }) => `${MESES[mes - 1]} ${ano}`;

export const mesVizinho = ({ mes, ano }, passo) => {
  const data = new Date(ano, mes - 1 + passo, 1);
  return { mes: data.getMonth() + 1, ano: data.getFullYear() };
};

export default function SeletorMes({ valor, onChange, permitirFuturo = false }) {
  const hoje = mesDeHoje();
  const noMesAtual = valor.mes === hoje.mes && valor.ano === hoje.ano;
  const botao = "w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="inline-flex items-center gap-1 bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] p-1 rounded-full shadow-sm">
      <button type="button" onClick={() => onChange(mesVizinho(valor, -1))} className={botao} aria-label="Mês anterior">
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[132px] text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">{nomeDoMes(valor)}</span>
      <button type="button" onClick={() => onChange(mesVizinho(valor, 1))} disabled={noMesAtual && !permitirFuturo} className={botao} aria-label="Próximo mês">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
