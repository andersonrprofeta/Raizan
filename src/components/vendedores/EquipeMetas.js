"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Target } from "lucide-react";
import toast from "react-hot-toast";
import { mesVizinho, nomeDoMes } from "@/components/vendedores/SeletorMes";
import {
  api, Avatar, BarraProgresso, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio, Kpi,
  lerMoeda, mascaraMoeda, moeda, moedaCurta, Modal, ROTULO, valorParaMascara, VIDRO
} from "@/components/vendedores/ui";

export function ModalReplicar({ competencia, vendedor, onFechar, onReplicado }) {
  const [acrescimo, setAcrescimo] = useState("0");
  const [salvando, setSalvando] = useState(false);

  const replicar = async () => {
    setSalvando(true);
    try {
      const data = await api("/metas/replicar", {
        metodo: "POST",
        corpo: { vendedor_id: vendedor?.id, replicar_todos: !vendedor, acrescimo: Number(acrescimo.replace(",", ".")) || 0, ...competencia }
      });
      if (!data.success) {
        toast.error(data.message || "Erro ao replicar.");
        setSalvando(false);
        return;
      }
      const jaExistiam = data.ignoradas > 0 ? ` ${data.ignoradas} já existia(m) e não mudou(aram).` : "";
      toast.success(`${data.criadas} meta(s) criada(s).${jaExistiam}`);
      onReplicado();
    } catch (erro) {
      toast.error("Falha de conexão.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo="Replicar metas"
      descricao={`Copia ${vendedor ? `as metas de ${vendedor.nome}` : "as metas da equipe"} de ${nomeDoMes(mesVizinho(competencia, -1))} para ${nomeDoMes(competencia)}. O que já foi lançado não muda.`}
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={replicar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>Replicar</button>
      </>}
    >
      <label className={ROTULO}>Acréscimo sobre o mês anterior (%)</label>
      <input inputMode="decimal" value={acrescimo} onChange={(e) => setAcrescimo(e.target.value.replace(/[^0-9.,-]/g, ""))} className={CAMPO} />
    </Modal>
  );
}

function LinhaMeta({ vendedor, resumo, metaGeral, competencia, onSalvo }) {
  const [valor, setValor] = useState(valorParaMascara(metaGeral?.alvo));
  const [estado, setEstado] = useState("parado");
  const faturado = resumo?.faturado || 0;
  const alvo = lerMoeda(valor);
  const percentual = alvo > 0 ? (faturado / alvo) * 100 : 0;

  useEffect(() => { setValor(metaGeral?.alvo ? valorParaMascara(metaGeral.alvo) : ""); }, [metaGeral?.alvo]);

  const salvar = async () => {
    if (alvo <= 0 || alvo === Number(metaGeral?.alvo || 0)) return;
    setEstado("salvando");
    try {
      const data = await api("/metas/criar", {
        metodo: "POST",
        corpo: { vendedor_id: vendedor.id, tipo: "Geral", valor_alvo: alvo, ...competencia }
      });
      if (!data.success) throw new Error();
      setEstado("salvo");
      onSalvo();
      setTimeout(() => setEstado("parado"), 1800);
    } catch (erro) {
      setEstado("parado");
      toast.error(`Não foi possível salvar a meta de ${vendedor.nome}.`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_170px_minmax(0,1.4fr)] items-center gap-3 md:gap-6 px-5 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar nome={vendedor.nome} foto={vendedor.foto} tamanho={36} />
        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{vendedor.nome}</p>
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">R$</span>
        <input
          inputMode="numeric"
          aria-label={`Meta de ${vendedor.nome}`}
          placeholder="0,00"
          value={valor}
          onChange={(e) => setValor(mascaraMoeda(e.target.value))}
          onBlur={salvar}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={`${CAMPO} pl-10 pr-9 tabular-nums`}
        />
        {estado === "salvo" && <Check size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />}
      </div>
      <div className="min-w-0">
        <div className="flex justify-between items-baseline gap-3 mb-1.5 text-xs">
          <span className="text-zinc-500 truncate tabular-nums">{moeda(faturado)}</span>
          {alvo > 0 && <span className={`font-semibold tabular-nums ${percentual >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}>{percentual.toFixed(0)}%</span>}
        </div>
        <BarraProgresso percentual={percentual} />
      </div>
    </div>
  );
}

export default function EquipeMetas({ vendedores, equipe, competencia, onAtualizar }) {
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [replicando, setReplicando] = useState(false);
  const ultimaBusca = useRef(0);

  const carregar = useCallback(async () => {
    const busca = ++ultimaBusca.current;
    setCarregando(true);
    try {
      const data = await api(`/metas?mes=${competencia.mes}&ano=${competencia.ano}`);
      if (busca !== ultimaBusca.current) return;
      if (!data.success) throw new Error();
      setMetas(data.metas || []);
    } catch (erro) {
      if (busca === ultimaBusca.current) toast.error("Erro ao carregar as metas.");
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  }, [competencia]);

  useEffect(() => { carregar(); }, [carregar]);

  const atualizar = () => { carregar(); onAtualizar(); };

  const geralPorVendedor = Object.fromEntries(metas.filter((m) => m.tipo === "Geral").map((m) => [m.vendedor_id, m]));
  const metaEquipe = Object.values(geralPorVendedor).reduce((acc, m) => acc + m.alvo, 0);
  const faturadoEquipe = vendedores.reduce((acc, v) => acc + (geralPorVendedor[v.id] ? equipe[v.id]?.faturado || 0 : 0), 0);
  const lancadas = vendedores.filter((v) => geralPorVendedor[v.id]).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi rotulo="Meta da equipe" valor={moedaCurta(metaEquipe)} detalhe={`${nomeDoMes(competencia)}`} />
        <Kpi rotulo="Realizado" valor={moedaCurta(faturadoEquipe)} detalhe={metaEquipe > 0 ? `${((faturadoEquipe / metaEquipe) * 100).toFixed(1)}% da meta` : "Sem meta lançada"} />
        <Kpi rotulo="Metas lançadas" valor={`${lancadas} de ${vendedores.length}`} detalhe={lancadas < vendedores.length ? "Faltam vendedores" : "Equipe completa"} />
      </div>

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div>
            <h2 className="font-semibold tracking-tight">Meta geral por vendedor</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Digite o valor e saia do campo: salva sozinho. Metas por marca ficam na página do vendedor.</p>
          </div>
          <button type="button" onClick={() => setReplicando(true)} className={`${BOTAO_SECUNDARIO} shrink-0`}><Copy size={15} /> Replicar mês anterior</button>
        </div>

        {carregando && metas.length === 0 ? (
          <Carregando texto="Buscando metas..." />
        ) : vendedores.length === 0 ? (
          <EstadoVazio icone={Target} titulo="Nenhum vendedor na equipe" />
        ) : (
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {vendedores.map((vendedor) => (
              <LinhaMeta
                key={`${vendedor.id}-${competencia.mes}-${competencia.ano}`}
                vendedor={vendedor}
                resumo={equipe[vendedor.id]}
                metaGeral={geralPorVendedor[vendedor.id]}
                competencia={competencia}
                onSalvo={atualizar}
              />
            ))}
          </div>
        )}
      </section>

      {replicando && <ModalReplicar competencia={competencia} onFechar={() => setReplicando(false)} onReplicado={() => { setReplicando(false); atualizar(); }} />}
    </div>
  );
}
