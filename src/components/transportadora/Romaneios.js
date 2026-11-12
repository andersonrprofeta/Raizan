"use client";

// Romaneios: visualizar, imprimir/PDF, editar (em montagem), gerar, reabrir e cancelar.

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Ban, ChevronDown, FileText, Loader2, Pencil, Printer, RotateCcw, Search, Truck, X } from "lucide-react";
import { api, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio, Modal, ROTULO, Segmentado, VIDRO, moeda } from "@/components/vendedores/ui";
import { BOTAO, RASTREIO, ROMANEIO, Selo, diaEHora, formatarCnpj, numeroNfe, peso } from "@/components/transportadora/ui";
import { montarRomaneio } from "@/components/transportadora/romaneioPdf";
import { abrirDocumento } from "@/components/utils/documentoPdf";

const FILTROS = [
  { id: "", rotulo: "Todos" },
  { id: "aberto", rotulo: "Em montagem" },
  { id: "gerado", rotulo: "Gerados" },
  { id: "cancelado", rotulo: "Cancelados" },
];

function ModalCancelar({ romaneio, onFechar, onConfirmar }) {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  return (
    <Modal titulo={`Cancelar romaneio nº ${romaneio.numero}?`} descricao="A coleta é desfeita e os pedidos voltam para Aguardando coleta. O romaneio fica no histórico como cancelado." onFechar={onFechar}
      rodape={<><button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Voltar</button>
        <button type="button" disabled={enviando} onClick={async () => { setEnviando(true); await onConfirmar(motivo); setEnviando(false); }} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-500 active:scale-95 disabled:opacity-40">
          {enviando && <Loader2 size={15} className="animate-spin" />}Cancelar romaneio</button></>}>
      <label className={ROTULO} htmlFor="c-motivo">Motivo (opcional)</label>
      <input id="c-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} placeholder="Ex.: caminhão não compareceu" className={`${CAMPO} mb-2`} />
    </Modal>
  );
}

function Detalhe({ detalhe, onAcao, ocupado }) {
  const { romaneio, transportadora, expedicoes } = detalhe;
  const imprimir = () => {
    if (!abrirDocumento(montarRomaneio({ romaneio, transportadora, expedicoes }))) toast.error("Libere as janelas do navegador para imprimir o romaneio.");
  };
  const informacoes = [
    ["Coleta", romaneio.gerado_em ? diaEHora(romaneio.gerado_em) : "Ainda não gerado"],
    ["Motorista", romaneio.motorista || "—"],
    ["Veículo", [romaneio.veiculo, romaneio.placa && `${romaneio.placa}${romaneio.uf_placa ? `/${romaneio.uf_placa}` : ""}`].filter(Boolean).join(" · ") || "—"],
    transportadora?.cnpj && ["CNPJ da transportadora", formatarCnpj(transportadora.cnpj)],
    ["Criado por", `${romaneio.criado_por || "—"}${romaneio.criado_em ? ` em ${diaEHora(romaneio.criado_em)}` : ""}`],
    romaneio.cancelado_em && ["Cancelado", `${diaEHora(romaneio.cancelado_em)}${romaneio.motivo_cancelamento ? ` · ${romaneio.motivo_cancelamento}` : ""}`],
  ].filter(Boolean);

  return (
    <div className="px-5 sm:px-6 pb-6 pt-1 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {informacoes.map(([rotulo, valor]) => <div key={rotulo}><dt className="text-[11px] text-zinc-500">{rotulo}</dt><dd className="font-medium">{valor}</dd></div>)}
      </dl>
      {romaneio.rota_resumo && <p className="text-sm text-zinc-600 dark:text-zinc-300"><span className="text-[11px] text-zinc-500 mr-2">Rota</span>{romaneio.rota_resumo}</p>}
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-zinc-500 bg-black/[0.02] dark:bg-white/[0.03]">
                <th className="text-left font-semibold px-4 py-2.5">Pedido</th>
                <th className="text-left font-semibold px-3 py-2.5">Destino</th>
                <th className="text-right font-semibold px-3 py-2.5">Vol.</th>
                <th className="text-right font-semibold px-3 py-2.5">Peso</th>
                <th className="text-right font-semibold px-3 py-2.5">Valor</th>
                <th className="text-left font-semibold px-4 py-2.5">Rastreamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {expedicoes.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 min-w-[200px]"><p className="font-medium">{e.numero_pedido ? `Pedido ${e.numero_pedido}` : "NF-e"} · {e.cliente_nome}</p><p className="text-[11px] text-zinc-500">{numeroNfe(e) ? `NF-e ${numeroNfe(e)}` : "Sem NF-e no Core"}</p></td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{e.cidade || "?"}{e.uf ? `/${e.uf}` : ""}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{e.volumes ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{peso(e.peso_bruto)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{moeda(e.valor_total)}</td>
                  <td className="px-4 py-2.5">{romaneio.status === "cancelado" ? <span className="text-xs text-zinc-400">—</span> : <Selo mapa={RASTREIO} valor={e.status_rastreio} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {romaneio.observacao && <p className="text-sm rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3">{romaneio.observacao}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={imprimir} className={`${BOTAO_SECUNDARIO} h-10`}><Printer size={15} />Imprimir ou PDF</button>
        {romaneio.status === "aberto" && <button type="button" disabled={ocupado} onClick={() => onAcao("editar")} className={`${BOTAO_SECUNDARIO} h-10`}><Pencil size={15} />Editar</button>}
        {romaneio.status === "gerado" && <button type="button" disabled={ocupado} onClick={() => onAcao("reabrir")} className={`${BOTAO_SECUNDARIO} h-10`}><RotateCcw size={15} />Reabrir</button>}
        <span className="flex-1" />
        {romaneio.status !== "cancelado" && <button type="button" disabled={ocupado} onClick={() => onAcao("cancelar")} className="h-10 px-4 rounded-full text-sm font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-40 inline-flex items-center gap-2"><Ban size={15} />Cancelar</button>}
        {romaneio.status === "aberto" && <button type="button" disabled={ocupado} onClick={() => onAcao("gerar")} className={`${BOTAO} h-10`}><Truck size={15} />Gerar romaneio</button>}
      </div>
    </div>
  );
}

export function Romaneios({ abrirId, onEditar, versao }) {
  const [romaneios, setRomaneios] = useState(null);
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(abrirId || null);
  const [detalhes, setDetalhes] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [cancelando, setCancelando] = useState(null);
  const pedidoAtual = useRef(0);

  const carregar = useCallback(async () => {
    const numero = ++pedidoAtual.current;
    const parametros = new URLSearchParams(Object.entries({ status, busca: busca.trim() }).filter(([, v]) => v));
    try {
      const r = await api(`/logistica/romaneios?${parametros}`);
      if (numero !== pedidoAtual.current) return;
      if (!r.success) { toast.error(r.message); setRomaneios([]); return; }
      setRomaneios(r.romaneios);
    } catch (erro) { if (numero === pedidoAtual.current) { toast.error("Sem conexão com o servidor."); setRomaneios([]); } }
  }, [status, busca]);

  const carregarDetalhe = useCallback(async (id) => {
    try {
      const r = await api(`/logistica/romaneios/${id}`);
      if (!r.success) { toast.error(r.message); return; }
      setDetalhes((atual) => ({ ...atual, [id]: r }));
    } catch (erro) { toast.error("Sem conexão com o servidor."); }
  }, []);

  useEffect(() => {
    const espera = setTimeout(carregar, busca ? 280 : 0);
    return () => clearTimeout(espera);
  }, [carregar, busca, versao]);

  useEffect(() => { if (abrirId) { setAberto(abrirId); carregarDetalhe(abrirId); } }, [abrirId, carregarDetalhe]);
  useEffect(() => { if (aberto && versao) carregarDetalhe(aberto); }, [versao]); // eslint-disable-line react-hooks/exhaustive-deps

  const alternar = (id) => {
    if (aberto === id) { setAberto(null); return; }
    setAberto(id);
    carregarDetalhe(id);
  };

  const agir = async (id, acao, motivo) => {
    if (acao === "editar") { onEditar(detalhes[id]); return; }
    if (acao === "cancelar" && motivo === undefined) { setCancelando(detalhes[id].romaneio); return; }
    setOcupado(true);
    try {
      const r = await api(`/logistica/romaneios/${id}/${acao}`, { metodo: "POST", corpo: acao === "cancelar" ? { motivo } : undefined });
      if (!r.success) { toast.error(r.message); return; }
      toast.success(r.message);
      setCancelando(null);
      await Promise.all([carregar(), carregarDetalhe(id)]);
    } catch (erro) { toast.error("Sem conexão com o servidor."); } finally { setOcupado(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><Segmentado opcoes={FILTROS} valor={status} onChange={setStatus} /></div>
        <div className="relative sm:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Número, placa, motorista, pedido ou NF-e" aria-label="Buscar romaneios" className={`${CAMPO} pl-10 pr-9`} />
          {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"><X size={14} /></button>}
        </div>
      </div>

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="hidden md:grid md:grid-cols-[72px_minmax(0,1.3fr)_minmax(0,1fr)_150px_140px_20px] gap-x-4 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 border-b border-black/[0.05] dark:border-white/[0.06]">
          <span>Nº</span><span>Transportadora</span><span>Carga</span><span>Coleta</span><span>Situação</span><span />
        </div>
        {romaneios === null ? <Carregando texto="Carregando romaneios..." /> : romaneios.length === 0 ? (
          <EstadoVazio icone={FileText} titulo={busca || status ? "Nada encontrado" : "Nenhum romaneio ainda"} texto={busca || status ? "Nenhum romaneio com esses filtros." : "Na aba Expedição, marque os pedidos com NF-e e clique em Montar romaneio."} />
        ) : (
          <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {romaneios.map((r) => (
              <li key={r.id} className={aberto === r.id ? "bg-black/[0.015] dark:bg-white/[0.02]" : ""}>
                <button type="button" onClick={() => alternar(r.id)} aria-expanded={aberto === r.id} className="group w-full grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[72px_minmax(0,1.3fr)_minmax(0,1fr)_150px_140px_20px] items-center gap-x-4 gap-y-1 px-5 sm:px-6 py-3.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                  <span className={`flex h-10 w-12 items-center justify-center rounded-2xl text-sm font-bold tabular-nums ${r.status === "cancelado" ? "bg-zinc-500/10 text-zinc-400" : "bg-purple-500/10 text-purple-700 dark:text-purple-300"}`}>{r.numero}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-zinc-900 dark:text-white">{r.transportadora_nome || "Sem transportadora"}</span>
                    <span className="block truncate text-xs text-zinc-500">{[r.motorista, r.placa].filter(Boolean).join(" · ") || "Motorista não informado"}</span>
                  </span>
                  <span className="hidden md:block text-sm text-zinc-600 dark:text-zinc-300 tabular-nums truncate">{r.total_pedidos} ped. · {r.volumes_total} vol. · {peso(r.peso_total)}</span>
                  <span className="hidden md:block text-sm text-zinc-500 tabular-nums">{r.gerado_em ? diaEHora(r.gerado_em) : "—"}</span>
                  <span className="flex flex-col items-end md:items-start gap-1">
                    <Selo mapa={ROMANEIO} valor={r.status} />
                    {r.status === "gerado" && <span className="text-[11px] text-zinc-500 tabular-nums">{r.entregues}/{r.total_pedidos} entregues</span>}
                  </span>
                  <ChevronDown size={18} className={`hidden md:block text-zinc-300 group-hover:text-purple-500 transition-transform duration-300 ${aberto === r.id ? "rotate-180 text-purple-500" : ""}`} />
                </button>
                {aberto === r.id && (detalhes[r.id] ? <Detalhe detalhe={detalhes[r.id]} ocupado={ocupado} onAcao={(acao) => agir(r.id, acao)} /> : <div className="py-6 flex justify-center text-zinc-400"><Loader2 size={18} className="animate-spin" /></div>)}
              </li>
            ))}
          </ul>
        )}
      </section>
      {cancelando && <ModalCancelar romaneio={cancelando} onFechar={() => setCancelando(null)} onConfirmar={(motivo) => agir(cancelando.id, "cancelar", motivo)} />}
    </div>
  );
}
