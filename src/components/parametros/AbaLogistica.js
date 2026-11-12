"use client";

// Parâmetros de sistema > Logística: prazo de entrega por rota e entrega automática.
// Vencido o prazo da rota (contado da coleta) sem confirmação, o pedido vira "Entregue" com o log
// "Entrega confirmada automaticamente por regra de rota". Recurso obrigatório para transportadora sem API.

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Aviso, CAMPO, Grupo, LinhaCampo, LinhaSwitch } from "@/components/parametros/ui";

const PADRAO = { uf_origem: null, entrega_automatica: true, prazos_rota: [], tags_transportadora: ["Transportadora"] };

export default function AbaLogistica({ logistica, ufs, onChange }) {
  const atual = { ...PADRAO, ...logistica };
  const [nova, setNova] = useState({ destino: "", dias: "" });
  const [novaTag, setNovaTag] = useState("");
  const origem = atual.uf_origem || "";
  const rotas = [...atual.prazos_rota].sort((a, b) => (a.destino === "*") - (b.destino === "*") || a.dias - b.dias || a.destino.localeCompare(b.destino));

  const alterar = (mudanca) => onChange({ ...atual, ...mudanca });
  const adicionar = () => {
    const dias = Number(nova.dias);
    if (!origem || !nova.destino || nova.dias === "" || !Number.isInteger(dias) || dias < 0 || dias > 60) return;
    const outras = atual.prazos_rota.filter((r) => !(r.origem === origem && r.destino === nova.destino));
    alterar({ prazos_rota: [...outras, { origem, destino: nova.destino, dias }] });
    setNova({ destino: "", dias: "" });
  };
  const remover = (rota) => alterar({ prazos_rota: atual.prazos_rota.filter((r) => !(r.origem === rota.origem && r.destino === rota.destino)) });
  const mudarDias = (rota, texto) => {
    const dias = texto.replace(/\D/g, "").slice(0, 2);
    alterar({ prazos_rota: atual.prazos_rota.map((r) => (r.origem === rota.origem && r.destino === rota.destino ? { ...r, dias: dias === "" ? "" : Number(dias) } : r)) });
  };
  const adicionarTag = () => {
    const tag = novaTag.trim();
    if (!tag || atual.tags_transportadora.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    alterar({ tags_transportadora: [...atual.tags_transportadora, tag] });
    setNovaTag("");
  };

  return (
    <div className="space-y-6">
      <Aviso>
        Para transportadora sem rastreamento: depois do prazo da rota, contado da hora da coleta (geração do romaneio), o pedido vira <b>Entregue</b> sozinho e o histórico mostra
        “Entrega confirmada automaticamente por regra de rota”. Se a entrega for confirmada antes, vale a confirmação.
      </Aviso>

      <Grupo titulo="Entrega automática por rota" texto="Dias corridos. O robô confere a cada 30 minutos e também quando a Central Logística é aberta.">
        <LinhaSwitch titulo="Confirmar entrega pela regra de rota" texto="Desligado, os pedidos ficam em trânsito até alguém confirmar." ligado={atual.entrega_automatica} onChange={(valor) => alterar({ entrega_automatica: valor })} />
        <LinhaCampo titulo="UF de onde a carga sai" texto="Estado do seu centro de distribuição. As rotas abaixo partem dele.">
          <select value={origem} onChange={(e) => alterar({ uf_origem: e.target.value || null })} aria-label="UF de origem" className={CAMPO}>
            <option value="">Escolha</option>
            {ufs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </LinhaCampo>
        <div className="py-4 last:pb-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Prazo por rota</p>
          {!origem ? <p className="mt-1 text-xs text-zinc-500">Escolha a UF de origem para cadastrar as rotas.</p> : (
            <>
              <ul className="mt-3 divide-y divide-black/[0.05] dark:divide-white/[0.06] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                {rotas.filter((r) => r.origem === origem).map((rota) => (
                  <li key={`${rota.origem}>${rota.destino}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1 text-sm font-semibold tabular-nums">{rota.origem} <span className="text-zinc-400">→</span> {rota.destino === "*" ? "Qualquer outra UF" : rota.destino}</span>
                    <span className="w-16 shrink-0"><input value={rota.dias} onChange={(e) => mudarDias(rota, e.target.value)} inputMode="numeric" aria-label={`Dias de ${rota.origem} para ${rota.destino}`} className={`${CAMPO} !h-9 !px-2 text-center`} /></span>
                    <span className="w-8 text-xs text-zinc-500">{rota.dias === 1 ? "dia" : "dias"}</span>
                    <button type="button" onClick={() => remover(rota)} aria-label={`Remover rota para ${rota.destino}`} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"><Trash2 size={15} /></button>
                  </li>
                ))}
                {rotas.filter((r) => r.origem === origem).length === 0 && <li className="px-4 py-3 text-sm text-zinc-500">Nenhuma rota. Exemplo: {origem} → {origem} = 1 dia.</li>}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{origem} →</span>
                <span className="min-w-[9rem] flex-1 sm:w-48 sm:flex-none">
                  <select value={nova.destino} onChange={(e) => setNova({ ...nova, destino: e.target.value })} aria-label="UF de destino" className={`${CAMPO} !h-10`}>
                    <option value="">Destino</option>
                    <option value="*">Qualquer outra UF</option>
                    {ufs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </span>
                <span className="w-20 shrink-0"><input value={nova.dias} onChange={(e) => setNova({ ...nova, dias: e.target.value.replace(/\D/g, "").slice(0, 2) })} onKeyDown={(e) => e.key === "Enter" && adicionar()} inputMode="numeric" placeholder="Dias" aria-label="Dias" className={`${CAMPO} !h-10 text-center`} /></span>
                <button type="button" onClick={adicionar} disabled={!nova.destino || nova.dias === ""} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 px-4 text-sm font-semibold text-white disabled:opacity-40"><Plus size={15} />Adicionar</button>
              </div>
            </>
          )}
        </div>
      </Grupo>

      <Grupo titulo="Transportadoras do ERP" texto="No Omie, cliente, fornecedor e transportadora ficam no mesmo cadastro. Só entra como transportadora quem tiver uma destas tags.">
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {atual.tags_transportadora.map((tag) => (
            <span key={tag} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 pl-3 pr-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
              {tag}
              {atual.tags_transportadora.length > 1 && <button type="button" onClick={() => alterar({ tags_transportadora: atual.tags_transportadora.filter((t) => t !== tag) })} aria-label={`Remover tag ${tag}`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-purple-500/20"><X size={12} /></button>}
            </span>
          ))}
          <span className="w-36 shrink-0"><input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && adicionarTag()} maxLength={60} placeholder="Outra tag" aria-label="Nova tag" className={`${CAMPO} !h-8 !text-xs`} /></span>
          <button type="button" onClick={adicionarTag} className="h-8 px-2 text-xs font-semibold text-purple-600 dark:text-purple-400">Adicionar</button>
        </div>
      </Grupo>
    </div>
  );
}
