"use client";

import { Truck } from "lucide-react";
import { moeda } from "./ui";

// O mínimo vem da regra de frete do cliente: a ligada a ele, ou a da cidade, ou a do estado
export default function BarraFrete({ frete, compacta }) {
  if (!frete.temRegra) {
    if (compacta) return null;
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        <Truck size={17} className="shrink-0" /> Frete combinado com a distribuidora
      </p>
    );
  }

  const texto = frete.gratis ? "Frete grátis garantido" : <>Faltam <strong className="font-bold">{moeda(frete.falta)}</strong> para o frete grátis</>;
  return (
    <div className={compacta ? "" : "rounded-2xl border border-zinc-200 bg-white p-4"}>
      <p className={`flex items-center gap-2 ${compacta ? "text-xs" : "text-sm"} ${frete.gratis ? "font-semibold text-emerald-700" : "text-zinc-700"}`}>
        <Truck size={compacta ? 14 : 17} className="shrink-0" /> <span>{texto}</span>
      </p>
      <div className={`overflow-hidden rounded-full bg-zinc-100 ${compacta ? "mt-1.5 h-1" : "mt-2.5 h-1.5"}`}>
        <div className={`h-full rounded-full transition-[width] duration-300 ${frete.gratis ? "bg-emerald-500" : "bg-violet-600"}`} style={{ width: `${frete.progresso * 100}%` }} />
      </div>
      {!compacta && <p className="mt-2 text-xs text-zinc-500">Frete grátis em pedidos a partir de {moeda(frete.minimo)}{frete.regiao ? ` · ${frete.regiao}` : ""}</p>}
    </div>
  );
}
