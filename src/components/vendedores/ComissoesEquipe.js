"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, Percent, Search, UserCog, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio, Modal, ROTULO, VIDRO
} from "@/components/vendedores/ui";

const limitarPercentual = (valor) => {
  const limpo = valor.replace(",", ".").replace(/[^0-9.]/g, "");
  return Number(limpo) > 100 ? "100" : limpo;
};

const formatar = (percentual) => `${Number(percentual).toLocaleString("pt-BR")}%`;

function ModalRemover({ itens, onFechar, onRemovido }) {
  const [salvando, setSalvando] = useState(false);
  const umaSo = itens.length === 1;

  const confirmar = async () => {
    setSalvando(true);
    try {
      const corpo = { itens: itens.map(({ vendedor_id, marca }) => ({ vendedor_id, marca })) };
      const data = await api("/comissoes/excecoes/remover", { metodo: "POST", corpo });
      if (!data.success) throw new Error();
      toast.success(umaSo ? "Regra própria removida." : `${itens.length} regras próprias removidas.`);
      onRemovido();
    } catch (erro) {
      toast.error("Não foi possível remover.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo={umaSo ? "Remover regra própria?" : `Remover ${itens.length} regras próprias?`}
      descricao={umaSo ? `${itens[0].nome} passa a seguir a regra da equipe.` : "Toda a equipe passa a seguir as regras desta tela."}
      largura="max-w-sm"
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={confirmar} disabled={salvando} className="flex-1 inline-flex items-center justify-center h-11 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-40">Remover</button>
      </>}
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Meses sem fechamento são recalculados com a regra nova.</p>
    </Modal>
  );
}

export default function ComissoesEquipe({ onAtualizar }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [geral, setGeral] = useState("");
  const [marcas, setMarcas] = useState([]);
  const [percentuais, setPercentuais] = useState({});
  const [excecoes, setExcecoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const [dataMarcas, dataEquipe] = await Promise.all([api("/marcas"), api("/comissoes/equipe")]);
      if (!dataEquipe.success) throw new Error();
      setGeral(dataEquipe.geral === null ? "" : String(Number(dataEquipe.geral)));
      setPercentuais(Object.fromEntries((dataEquipe.marcas || []).map((m) => [m.marca, String(Number(m.percentual))])));
      setExcecoes(dataEquipe.excecoes || []);
      if (dataMarcas.success) setMarcas((dataMarcas.marcas || []).filter((m) => !m.nome.toLowerCase().startsWith("provador")));
    } catch (erro) {
      toast.error("Erro ao carregar as regras da equipe.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const data = await api("/comissoes/equipe", {
        metodo: "POST",
        corpo: {
          comissao_geral: geral === "" ? null : Number(geral),
          marcas: Object.entries(percentuais).filter(([, valor]) => valor !== "").map(([marca, percentual]) => ({ marca, percentual: Number(percentual) }))
        }
      });
      if (!data.success) throw new Error(data.message);
      toast.success("Regras da equipe salvas.");
      onAtualizar();
    } catch (erro) {
      toast.error(erro.message || "Erro ao salvar as regras.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <Carregando texto="Buscando regras da equipe..." />;

  const visiveis = marcas.filter((m) => m.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <section className={`${VIDRO} p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4`}>
        <div className="flex-1 min-w-0">
          <label htmlFor="comissao-geral-equipe" className={ROTULO}>Comissão geral da equipe (%)</label>
          <input id="comissao-geral-equipe" inputMode="decimal" placeholder="5" value={geral} onChange={(e) => setGeral(limitarPercentual(e.target.value))} className={`${CAMPO} sm:w-44 text-lg font-semibold tabular-nums`} />
          <p className="text-xs text-zinc-500 mt-2">Vale para o que não tem regra de marca. Quem paga só por marca coloca 0.</p>
        </div>
        <button type="button" onClick={salvar} disabled={salvando} className={BOTAO_PRIMARIO}>{salvando ? "Salvando..." : "Salvar regras"}</button>
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-1">
        A regra mais específica vence: marca do vendedor, marca da equipe, geral do vendedor e geral da equipe. Salvar recalcula os meses sem fechamento.
      </p>

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div>
            <h2 className="font-semibold tracking-tight">Comissão por marca</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Em branco, a marca usa a comissão geral.</p>
          </div>
          <div className="relative sm:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input placeholder="Buscar marca" value={busca} onChange={(e) => setBusca(e.target.value)} className={`${CAMPO} rounded-full pl-10`} />
          </div>
        </div>
        {marcas.length === 0 ? (
          <EstadoVazio icone={Layers} titulo="Nenhuma marca cadastrada" texto="As marcas chegam pela sincronização com o ERP." />
        ) : (
          <div className="max-h-[460px] overflow-y-auto custom-scrollbar divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {visiveis.map((marca) => (
              <div key={marca.id ?? marca.nome} className="flex items-center justify-between gap-4 px-5 py-2.5">
                <span className="text-sm font-medium truncate">{marca.nome}</span>
                <div className="relative w-24 shrink-0">
                  <input
                    inputMode="decimal"
                    aria-label={`Comissão da equipe em ${marca.nome}`}
                    placeholder="Geral"
                    value={percentuais[marca.nome] ?? ""}
                    onChange={(e) => setPercentuais((atuais) => ({ ...atuais, [marca.nome]: limitarPercentual(e.target.value) }))}
                    className={`${CAMPO} h-9 text-right pr-7 tabular-nums`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div>
            <h2 className="font-semibold tracking-tight">Regras próprias de vendedores</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {excecoes.length === 0 ? "Toda a equipe segue as regras acima." : `${excecoes.length} exceção(ões) às regras da equipe.`}
            </p>
          </div>
          {excecoes.length > 1 && (
            <button type="button" onClick={() => setRemovendo(excecoes)} className={BOTAO_SECUNDARIO}>Remover todas</button>
          )}
        </div>
        {excecoes.length === 0 ? (
          <EstadoVazio icone={UserCog} titulo="Nenhuma exceção" texto="Regras próprias são criadas no cadastro de cada vendedor." />
        ) : (
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {excecoes.map((excecao) => (
              <div key={`${excecao.vendedor_id}-${excecao.marca ?? "geral"}`} className="flex items-center gap-4 px-5 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{excecao.nome}</p>
                  <p className="text-xs text-zinc-500 truncate">{excecao.marca ?? "Comissão geral"}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums shrink-0"><Percent size={12} className="text-zinc-400" />{formatar(excecao.percentual).replace("%", "")}</span>
                <button type="button" onClick={() => setRemovendo([excecao])} aria-label={`Remover regra de ${excecao.nome}`} className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-rose-600 transition-colors"><X size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      {removendo && (
        <ModalRemover
          itens={removendo}
          onFechar={() => setRemovendo(null)}
          onRemovido={() => { setRemovendo(null); carregar(); onAtualizar(); }}
        />
      )}
    </div>
  );
}
