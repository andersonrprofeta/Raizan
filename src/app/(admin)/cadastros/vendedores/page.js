"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Percent, Plus, RefreshCw, Search, Target, Trophy, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import Campanhas from "@/components/vendedores/Campanhas";
import ComissoesEquipe from "@/components/vendedores/ComissoesEquipe";
import EquipeMetas from "@/components/vendedores/EquipeMetas";
import { ModalVendedor } from "@/components/vendedores/Modais";
import SeletorMes, { mesDeHoje, nomeDoMes } from "@/components/vendedores/SeletorMes";
import {
  api, Avatar, BarraProgresso, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, EstadoVazio,
  estadoDeAcesso, Kpi, moeda, moedaCurta, Segmentado, StatusAcesso, VIDRO
} from "@/components/vendedores/ui";

const SECOES = [
  { id: "equipe", rotulo: "Equipe", icone: Users },
  { id: "metas", rotulo: "Metas", icone: Target },
  { id: "comissoes", rotulo: "Comissões", icone: Percent },
  { id: "campanhas", rotulo: "Campanhas", icone: Trophy }
];

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "ativo", rotulo: "No app" },
  { id: "sem_acesso", rotulo: "Sem acesso" },
  { id: "bloqueado", rotulo: "Bloqueados" }
];

const COLUNAS = "lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_20px]";

const dataCurta = (data) => (data ? new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") : "Sem pedidos");

function LinhaVendedor({ vendedor, resumo, onAbrir }) {
  const faturado = resumo?.faturado || 0;
  const meta = resumo?.meta || 0;
  const percentual = meta > 0 ? (faturado / meta) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`group w-full text-left grid grid-cols-2 ${COLUNAS} items-center gap-x-6 gap-y-3 px-5 py-4 hover:bg-black/[0.025] dark:hover:bg-white/[0.03] transition-colors`}
    >
      <div className="col-span-2 lg:col-span-1 flex items-center gap-3 min-w-0">
        <Avatar nome={vendedor.nome} foto={vendedor.foto} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white">
            <span className="truncate">{vendedor.nome}</span>
            {vendedor.manual && <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300">Manual</span>}
          </p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{vendedor.email || "Sem e-mail"}</p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="lg:hidden text-[11px] text-zinc-400 mb-0.5">Faturado</p>
        <p className="text-sm font-semibold tabular-nums truncate">{moeda(faturado)}</p>
      </div>

      <div className="min-w-0">
        {meta > 0 ? (
          <>
            <div className="flex justify-between gap-2 mb-1.5 text-xs">
              <span className="text-zinc-500 tabular-nums truncate">{moedaCurta(meta)}</span>
              <span className={`font-semibold tabular-nums ${percentual >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}>{percentual.toFixed(0)}%</span>
            </div>
            <BarraProgresso percentual={percentual} />
          </>
        ) : (
          <p className="text-xs text-zinc-400">Sem meta</p>
        )}
      </div>

      <div className="min-w-0">
        <p className="lg:hidden text-[11px] text-zinc-400 mb-0.5">Comissão</p>
        <p className="text-sm tabular-nums text-zinc-700 dark:text-zinc-300 truncate">{moeda(resumo?.comissao)}</p>
      </div>

      <div className="min-w-0">
        <StatusAcesso vendedor={vendedor} />
        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{dataCurta(resumo?.ultimo_pedido)}</p>
      </div>

      <ChevronRight size={16} className="hidden lg:block text-zinc-300 dark:text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

export default function VendedoresPage() {
  const router = useRouter();
  const [secao, setSecao] = useState("equipe");
  const [competencia, setCompetencia] = useState(mesDeHoje);
  const [vendedores, setVendedores] = useState([]);
  const [equipe, setEquipe] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [atualizandoMes, setAtualizandoMes] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [cadastrando, setCadastrando] = useState(false);
  const ultimaBusca = useRef(0);

  const carregarVendedores = useCallback(async () => {
    try {
      const data = await api("/vendedores");
      if (data.success) setVendedores(data.vendedores || []);
    } catch (erro) {
      toast.error("Erro ao carregar vendedores.");
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarMes = useCallback(async () => {
    const buscaAtual = ++ultimaBusca.current;
    setAtualizandoMes(true);
    try {
      const data = await api(`/vendedores/resumo?mes=${competencia.mes}&ano=${competencia.ano}`);
      if (buscaAtual !== ultimaBusca.current) return;
      if (!data.success) throw new Error();
      setEquipe(data.equipe || {});
    } catch (erro) {
      if (buscaAtual === ultimaBusca.current) {
        setEquipe({});
        toast.error("Erro ao carregar os números do mês.");
      }
    } finally {
      if (buscaAtual === ultimaBusca.current) setAtualizandoMes(false);
    }
  }, [competencia]);

  useEffect(() => { carregarVendedores(); }, [carregarVendedores]);
  useEffect(() => { carregarMes(); }, [carregarMes]);

  const sincronizar = async () => {
    setSincronizando(true);
    const aviso = toast.loading("Sincronizando com o ERP...");
    try {
      const data = await api("/vendedores/sync", { metodo: "POST", corpo: {} });
      if (data.success) {
        toast.success(data.message, { id: aviso });
        carregarVendedores();
      } else {
        toast.error(data.message, { id: aviso });
      }
    } catch (erro) {
      toast.error("Falha ao conectar com o servidor.", { id: aviso });
    } finally {
      setSincronizando(false);
    }
  };

  const ordenados = useMemo(
    () => [...vendedores].sort((a, b) => (equipe[b.id]?.faturado || 0) - (equipe[a.id]?.faturado || 0) || a.nome.localeCompare(b.nome)),
    [vendedores, equipe]
  );

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ordenados.filter((v) => (filtro === "todos" || estadoDeAcesso(v) === filtro)
      && (!termo || v.nome.toLowerCase().includes(termo) || (v.email || "").toLowerCase().includes(termo)));
  }, [ordenados, busca, filtro]);

  const numeros = Object.values(equipe);
  const faturado = numeros.reduce((acc, v) => acc + v.faturado, 0);
  const comissoes = numeros.reduce((acc, v) => acc + v.comissao, 0);
  const metaEquipe = numeros.reduce((acc, v) => acc + (v.meta || 0), 0);
  const naoFaturados = numeros.reduce((acc, v) => acc + v.nao_faturados, 0);
  const comAcesso = vendedores.filter((v) => estadoDeAcesso(v) === "ativo").length;
  // Só quem tem meta entra na conta: venda de quem não tem meta inflaria o percentual
  const faturadoComMeta = numeros.reduce((acc, v) => acc + (v.meta ? v.faturado : 0), 0);
  const percentualEquipe = metaEquipe > 0 ? (faturadoComMeta / metaEquipe) * 100 : 0;

  return (
    <CascaPagina>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-[34px] leading-tight font-bold tracking-tight">Vendedores</h1>
          <p className="text-sm sm:text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Equipe, metas, comissões e campanhas em um só lugar.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={sincronizar} disabled={sincronizando} className={BOTAO_SECUNDARIO}>
            <RefreshCw size={15} className={sincronizando ? "animate-spin" : ""} /> Sincronizar ERP
          </button>
          <button type="button" onClick={() => setCadastrando(true)} className={BOTAO_PRIMARIO}><Plus size={16} /> Novo vendedor</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Segmentado opcoes={SECOES} valor={secao} onChange={setSecao} />
        {secao !== "campanhas" && secao !== "comissoes" && <SeletorMes valor={competencia} onChange={setCompetencia} permitirFuturo={secao === "metas"} />}
      </div>

      {secao === "equipe" && (
        <>
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${atualizandoMes ? "opacity-50" : ""}`}>
            <Kpi rotulo="Faturado no mês" valor={moedaCurta(faturado)} detalhe={naoFaturados > 0 ? `${naoFaturados} pedido(s) a faturar` : nomeDoMes(competencia)} />
            <Kpi rotulo="Meta da equipe" valor={metaEquipe > 0 ? `${percentualEquipe.toFixed(0)}%` : "—"} detalhe={metaEquipe > 0 ? undefined : "Sem meta lançada"}>
              {metaEquipe > 0 && <div className="mt-3.5"><BarraProgresso percentual={percentualEquipe} /></div>}
            </Kpi>
            <Kpi rotulo="Comissões do mês" valor={moedaCurta(comissoes)} detalhe="Calculadas sobre o faturado" />
            <Kpi rotulo="No app" valor={`${comAcesso} de ${vendedores.length}`} detalhe={comAcesso < vendedores.length ? "Há vendedores sem acesso" : "Equipe completa"} />
          </div>

          <section className={`${VIDRO} overflow-hidden`}>
            <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={`${CAMPO} rounded-full pl-11 pr-10`}
                />
                {busca && (
                  <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/[0.08] dark:bg-white/[0.12] text-zinc-500">
                    <X size={13} />
                  </button>
                )}
              </div>
              <Segmentado opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
            </div>

            <div className={`hidden lg:grid ${COLUNAS} gap-x-6 px-5 py-2.5 text-xs font-medium text-zinc-400 border-b border-black/[0.05] dark:border-white/[0.06]`}>
              <span>Vendedor</span><span>Faturado</span><span>Meta</span><span>Comissão</span><span>Acesso</span><span />
            </div>

            {carregando ? (
              <Carregando texto="Buscando equipe..." />
            ) : visiveis.length === 0 ? (
              <EstadoVazio icone={Users} titulo="Nenhum vendedor encontrado" texto="Mude a busca, sincronize com o ERP ou cadastre um vendedor." />
            ) : (
              <div className={`divide-y divide-black/[0.05] dark:divide-white/[0.05] transition-opacity ${atualizandoMes ? "opacity-60" : ""}`}>
                {visiveis.map((vendedor) => (
                  <LinhaVendedor
                    key={vendedor.id}
                    vendedor={vendedor}
                    resumo={equipe[vendedor.id]}
                    onAbrir={() => router.push(`/cadastros/vendedores/detalhes?id=${vendedor.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {secao === "metas" && <EquipeMetas vendedores={ordenados} equipe={equipe} competencia={competencia} onAtualizar={carregarMes} />}
      {secao === "comissoes" && <ComissoesEquipe onAtualizar={carregarMes} />}
      {secao === "campanhas" && <Campanhas />}

      {cadastrando && (
        <ModalVendedor
          onFechar={() => setCadastrando(false)}
          onSalvo={() => { setCadastrando(false); carregarVendedores(); }}
        />
      )}
    </CascaPagina>
  );
}
