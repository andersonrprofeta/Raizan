"use client";

// Expedição: pedidos com NF-e emitida esperando coleta, agrupados por transportadora, rota (UF) e cidade.
// Marque os pedidos e monte o romaneio. Depois da coleta, o rastreamento de cada pedido também fica aqui.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, ChevronDown, Loader2, MapPin, Minus, PackageOpen, Pencil, RefreshCw, Search, Truck, X } from "lucide-react";
import { api, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio, Modal, ROTULO, Segmentado, VIDRO, moeda } from "@/components/vendedores/ui";
import { BOTAO, RASTREIO, Selo, TRILHO, diaCurto, diaEHora, emAtraso, numeroNfe, peso } from "@/components/transportadora/ui";

export const VISOES = [
  { id: "aguardando", rotulo: "Aguardando coleta" },
  { id: "transito", rotulo: "Em trânsito" },
  { id: "atrasadas", rotulo: "Atrasadas" },
  { id: "ocorrencias", rotulo: "Ocorrências" },
  { id: "entregues", rotulo: "Entregues" },
];

// ==========================================
// CAIXA DE SELEÇÃO
// ==========================================
function Marcador({ estado, onClick, rotulo }) {
  const marcado = estado === "todos";
  const parte = estado === "parte";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcado ? "true" : parte ? "mixed" : "false"}
      aria-label={rotulo}
      onClick={onClick}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${marcado || parte ? "border-purple-500 bg-purple-500 text-white" : "border-zinc-300 dark:border-zinc-600 hover:border-purple-400"}`}
    >
      {marcado && <Check size={13} strokeWidth={3} />}
      {parte && <Minus size={13} strokeWidth={3} />}
    </button>
  );
}

const estadoDe = (ids, marcados) => {
  const n = ids.filter((id) => marcados.has(id)).length;
  return n === 0 ? "nenhum" : n === ids.length ? "todos" : "parte";
};

// ==========================================
// AGUARDANDO COLETA: AGRUPADO
// ==========================================
function LinhaPedido({ e, marcado, onMarcar }) {
  return (
    <li className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5 py-3 transition-colors ${marcado ? "bg-purple-500/[0.05]" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}>
      <Marcador estado={marcado ? "todos" : "nenhum"} onClick={onMarcar} rotulo={`Pedido ${e.numero_pedido || e.nfe_numero}`} />
      <button type="button" onClick={onMarcar} className="min-w-0 text-left">
        <span className="block line-clamp-2 sm:truncate text-sm font-medium text-zinc-900 dark:text-white">
          {e.numero_pedido ? `Pedido ${e.numero_pedido}` : "NF-e avulsa"} · {e.cliente_nome || "Cliente não informado"}
        </span>
        <span className="block truncate text-xs text-zinc-500">
          {numeroNfe(e) ? `NF-e ${numeroNfe(e)}` : "NF-e sem número no Core"}{e.nfe_emissao ? ` · emitida ${diaCurto(e.nfe_emissao)}` : ""} · {peso(e.peso_bruto)}{e.volumes ? ` · ${e.volumes} vol.` : ""}
        </span>
      </button>
      <span className="text-sm font-semibold tabular-nums whitespace-nowrap">{moeda(e.valor_total)}</span>
    </li>
  );
}

function GrupoTransportadora({ grupo, porId, marcados, alternar }) {
  const [aberto, setAberto] = useState(true);
  const ids = grupo.rotas.flatMap((r) => r.cidades.flatMap((c) => c.expedicoes));
  return (
    <section className={`${VIDRO} overflow-hidden`}>
      <header className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
        <Marcador estado={estadoDe(ids, marcados)} onClick={() => alternar(ids)} rotulo={`Todos de ${grupo.transportadora_nome || "sem transportadora"}`} />
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${grupo.transportadora_id ? "bg-purple-500/10 text-purple-600 dark:text-purple-300" : "bg-amber-500/10 text-amber-600"}`}><Truck size={18} /></span>
        <button type="button" onClick={() => setAberto((v) => !v)} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-semibold tracking-tight">{grupo.transportadora_nome || "Sem transportadora definida"}</span>
          <span className="block truncate text-xs text-zinc-500">
            {grupo.pedidos} {grupo.pedidos === 1 ? "pedido" : "pedidos"} · {peso(grupo.peso)}{grupo.volumes ? ` · ${grupo.volumes} vol.` : ""} · {moeda(grupo.valor)}
          </span>
        </button>
        <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-300 ${aberto ? "rotate-180" : ""}`} />
      </header>
      {aberto && grupo.rotas.map((rota) => (
        <div key={rota.uf}>
          {rota.cidades.map((cidade) => {
            const idsDaCidade = cidade.expedicoes;
            return (
              <div key={`${rota.uf}-${cidade.cidade}`}>
                <div className="flex items-center gap-3 px-4 sm:px-5 py-2 bg-black/[0.02] dark:bg-white/[0.025]">
                  <Marcador estado={estadoDe(idsDaCidade, marcados)} onClick={() => alternar(idsDaCidade)} rotulo={`Todos de ${cidade.cidade}`} />
                  <MapPin size={13} className="text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{cidade.cidade} · {rota.uf}</span>
                  <span className="text-[11px] text-zinc-400">{idsDaCidade.length}</span>
                </div>
                <ul className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {idsDaCidade.map((id) => porId.get(id) && (
                    <LinhaPedido key={id} e={porId.get(id)} marcado={marcados.has(id)} onMarcar={() => alternar([id])} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

// ==========================================
// EM TRÂNSITO, ENTREGUES...: LINHA COM LINHA DO TEMPO
// ==========================================
function LinhaDoTempo({ eventos, expedicao }) {
  const posicao = TRILHO.indexOf(expedicao.status_rastreio);
  const foraDoTrilho = !TRILHO.includes(expedicao.status_rastreio);
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto no-scrollbar">
        <ol className="flex min-w-[520px] items-start">
          {TRILHO.map((status, i) => {
            const feito = !foraDoTrilho && i <= posicao;
            return (
              <li key={status} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 && <span className={`absolute right-1/2 top-[9px] h-[2px] w-full ${!foraDoTrilho && i <= posicao ? "bg-purple-500" : "bg-black/[0.08] dark:bg-white/[0.1]"}`} />}
                <span className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#121214] ${feito ? "bg-purple-500 text-white" : "bg-zinc-200 dark:bg-zinc-700"}`}>
                  {feito && <Check size={11} strokeWidth={3} />}
                </span>
                <span className={`mt-2 text-[11px] font-medium leading-tight ${feito ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{RASTREIO[status].rotulo}</span>
              </li>
            );
          })}
        </ol>
      </div>
      {foraDoTrilho && <p className="rounded-xl bg-rose-500/[0.07] px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{RASTREIO[expedicao.status_rastreio]?.rotulo}{expedicao.ocorrencia ? `: ${expedicao.ocorrencia}` : ""}</p>}
      <ol className="relative space-y-4 border-l border-black/[0.08] dark:border-white/[0.1] pl-5 ml-1.5">
        {[...eventos].reverse().map((ev) => (
          <li key={ev.id} className="relative">
            <span className={`absolute -left-[25.5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-[#121214] ${ev.origem === "regra_rota" ? "bg-emerald-500" : "bg-purple-500"}`} />
            <p className="text-sm font-medium">{ev.descricao}</p>
            <p className="text-[11px] text-zinc-500">{diaEHora(ev.criado_em)}{ev.criado_por ? ` · ${ev.criado_por}` : ""}</p>
          </li>
        ))}
        {eventos.length === 0 && <li className="text-sm text-zinc-500">Sem eventos ainda.</li>}
      </ol>
    </div>
  );
}

function LinhaRastreio({ e, onAtualizar, onEditar }) {
  const [aberto, setAberto] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const atrasada = emAtraso(e);

  const alternar = async () => {
    const abrir = !aberto;
    setAberto(abrir);
    if (abrir) {
      try {
        const r = await api(`/logistica/expedicoes/${e.id}`);
        if (r.success) setDetalhe(r);
        else toast.error(r.message || "Não foi possível abrir o pedido.");
      } catch (erro) { toast.error("Sem conexão com o servidor."); }
    }
  };

  return (
    <li className={aberto ? "bg-black/[0.015] dark:bg-white/[0.02]" : ""}>
      <button type="button" onClick={alternar} aria-expanded={aberto} className="group w-full grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_160px_20px] items-center gap-x-4 gap-y-1 px-5 sm:px-6 py-3.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
        <span className="min-w-0">
          <span className="block line-clamp-2 sm:truncate font-medium text-zinc-900 dark:text-white">{e.numero_pedido ? `Pedido ${e.numero_pedido}` : `NF-e ${numeroNfe(e)}`} · {e.cliente_nome || "Cliente"}</span>
          <span className="block truncate text-xs text-zinc-500">{e.cidade || "Cidade?"}{e.uf ? ` · ${e.uf}` : ""}{numeroNfe(e) && e.numero_pedido ? ` · NF-e ${numeroNfe(e)}` : ""}{e.romaneio_numero ? ` · Romaneio ${e.romaneio_numero}` : ""}</span>
        </span>
        <span className="hidden md:block truncate text-sm text-zinc-600 dark:text-zinc-300">{e.transportadora_nome || "—"}</span>
        <span className={`hidden md:block text-sm tabular-nums ${atrasada ? "font-semibold text-rose-600 dark:text-rose-400" : "text-zinc-500"}`}>
          {e.status_rastreio === "entregue" ? `Entregue ${diaCurto(e.entregue_em)}` : e.previsao_entrega ? `Prev. ${diaCurto(e.previsao_entrega)}` : "Sem previsão"}
        </span>
        <span className="flex flex-col items-end md:items-start gap-1">
          <Selo mapa={RASTREIO} valor={e.status_rastreio} />
          {e.entrega_automatica && <span className="text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">pela regra de rota</span>}
        </span>
        <ChevronDown size={18} className={`hidden md:block text-zinc-300 group-hover:text-purple-500 transition-transform duration-300 ${aberto ? "rotate-180 text-purple-500" : ""}`} />
      </button>
      {aberto && (
        <div className="px-5 sm:px-6 pb-6 pt-1 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
          {!detalhe ? <div className="py-4 flex justify-center text-zinc-400"><Loader2 size={18} className="animate-spin" /></div> : (
            <>
              <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                {[
                  ["Coleta", diaEHora(e.coletado_em) || "—"],
                  ["Previsão", diaEHora(e.previsao_entrega) || "—"],
                  ["Peso", peso(e.peso_bruto)],
                  ["Volumes", e.volumes ?? "—"],
                  ["Valor", moeda(e.valor_total)],
                  e.codigo_rastreio && ["Rastreio", e.codigo_rastreio],
                  e.cte_numero && ["CT-e", e.cte_numero],
                  e.cte_valor_frete !== null && ["Frete", moeda(e.cte_valor_frete)],
                ].filter(Boolean).map(([rotulo, valor]) => (
                  <div key={rotulo}><dt className="text-[11px] text-zinc-500">{rotulo}</dt><dd className="font-medium tabular-nums">{valor}</dd></div>
                ))}
              </dl>
              <LinhaDoTempo eventos={detalhe.eventos} expedicao={detalhe.expedicao} />
              <div className="flex flex-wrap gap-2">
                {e.status_rastreio !== "aguardando_coleta" && <button type="button" onClick={() => onAtualizar(e)} className={`${BOTAO} h-10`}><RefreshCw size={15} />Atualizar rastreamento</button>}
                <button type="button" onClick={() => onEditar(e)} className={`${BOTAO_SECUNDARIO} h-10`}><Pencil size={15} />NF-e, CT-e e volumes</button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}

// ==========================================
// MODAIS DE RASTREAMENTO E AJUSTES
// ==========================================
const STATUS_MANUAIS = ["em_transferencia", "em_rota", "saiu_para_entrega", "entregue", "ocorrencia", "devolvido"];

function ModalRastreio({ expedicao, onFechar, onSalvo }) {
  const [status, setStatus] = useState(expedicao.status_rastreio === "coletado" ? "em_rota" : "entregue");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvar = async () => {
    setSalvando(true);
    try {
      const r = await api(`/logistica/expedicoes/${expedicao.id}/status`, { metodo: "POST", corpo: { status, descricao, entregue_em: data || undefined } });
      if (!r.success) { toast.error(r.message); return; }
      toast.success(r.message);
      onSalvo();
    } catch (erro) { toast.error("Sem conexão com o servidor."); } finally { setSalvando(false); }
  };
  return (
    <Modal titulo="Atualizar rastreamento" descricao={`${expedicao.numero_pedido ? `Pedido ${expedicao.numero_pedido}` : "NF-e"} · ${expedicao.cliente_nome || ""}`} onFechar={onFechar}
      rodape={<><button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Voltar</button><button type="button" disabled={salvando || status === expedicao.status_rastreio} onClick={salvar} className={`${BOTAO} flex-1`}>{salvando && <Loader2 size={15} className="animate-spin" />}Salvar</button></>}>
      <div className="grid grid-cols-2 gap-2">
        {STATUS_MANUAIS.map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} disabled={s === expedicao.status_rastreio}
            className={`h-11 rounded-2xl border px-3 text-sm font-semibold transition-colors disabled:opacity-30 ${status === s ? "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-200" : "border-black/[0.08] dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-purple-300"}`}>
            {RASTREIO[s].rotulo}
          </button>
        ))}
      </div>
      {status === "entregue" && (
        <div className="mt-4">
          <label className={ROTULO} htmlFor="r-data">Data da entrega</label>
          <input id="r-data" type="date" value={data} onChange={(ev) => setData(ev.target.value)} className={CAMPO} />
          <p className="mt-1 text-xs text-zinc-500">Vazio = agora.</p>
        </div>
      )}
      <div className="mt-4 mb-2">
        <label className={ROTULO} htmlFor="r-desc">{status === "ocorrencia" ? "O que aconteceu" : "Observação (opcional)"}</label>
        <input id="r-desc" value={descricao} onChange={(ev) => setDescricao(ev.target.value)} maxLength={255} placeholder={status === "ocorrencia" ? "Ex.: avaria em 1 volume, cliente ausente" : "Aparece na linha do tempo"} className={CAMPO} />
      </div>
    </Modal>
  );
}

function ModalAjustes({ expedicao, onFechar, onSalvo }) {
  const [form, setForm] = useState({
    nfe_numero: expedicao.nfe_numero || "", nfe_serie: expedicao.nfe_serie || "", nfe_chave: expedicao.nfe_chave || "",
    peso_bruto: expedicao.peso_bruto ?? "", volumes: expedicao.volumes ?? "", codigo_rastreio: expedicao.codigo_rastreio || "",
    cte_numero: expedicao.cte_numero || "", cte_chave: expedicao.cte_chave || "", cte_valor_frete: expedicao.cte_valor_frete ?? "",
    cidade: expedicao.cidade || "", uf: expedicao.uf || "",
  });
  const [salvando, setSalvando] = useState(false);
  const campo = (nome, rotulo, extra = {}) => (
    <div className={extra.largo ? "col-span-2" : ""}>
      <label className={ROTULO} htmlFor={`a-${nome}`}>{rotulo}</label>
      <input id={`a-${nome}`} value={form[nome]} onChange={(ev) => setForm({ ...form, [nome]: ev.target.value })} inputMode={extra.numerico ? "decimal" : undefined} maxLength={extra.max} className={CAMPO} />
    </div>
  );
  const salvar = async () => {
    setSalvando(true);
    try {
      const r = await api(`/logistica/expedicoes/${expedicao.id}`, { metodo: "PUT", corpo: form });
      if (!r.success) { toast.error(r.message); return; }
      toast.success(r.message);
      onSalvo();
    } catch (erro) { toast.error("Sem conexão com o servidor."); } finally { setSalvando(false); }
  };
  return (
    <Modal titulo="NF-e, CT-e e volumes" descricao="Para quando a integração não trouxe o dado." largura="max-w-lg" onFechar={onFechar}
      rodape={<><button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Voltar</button><button type="button" disabled={salvando} onClick={salvar} className={`${BOTAO} flex-1`}>{salvando && <Loader2 size={15} className="animate-spin" />}Salvar</button></>}>
      <div className="grid grid-cols-2 gap-3 pb-2">
        {campo("nfe_numero", "NF-e número")}{campo("nfe_serie", "Série", { max: 5 })}
        {campo("nfe_chave", "Chave da NF-e (44 números)", { largo: true, max: 54 })}
        {campo("peso_bruto", "Peso bruto (kg)", { numerico: true })}{campo("volumes", "Volumes", { numerico: true })}
        {campo("cidade", "Cidade de destino")}{campo("uf", "UF", { max: 2 })}
        {campo("codigo_rastreio", "Código de rastreio", { largo: true })}
        {campo("cte_numero", "CT-e número")}{campo("cte_valor_frete", "Frete do CT-e (R$)", { numerico: true })}
        {campo("cte_chave", "Chave do CT-e", { largo: true, max: 54 })}
      </div>
    </Modal>
  );
}

// ==========================================
// EXPEDIÇÃO
// ==========================================
// erp: { nome } quando há ERP conectado que a Central sabe ler. Sem ERP, o botão só atualiza a lista.
export function Expedicao({ visao, onVisao, onMontar, versao, erp = null }) {
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");
  const [marcados, setMarcados] = useState(new Set());
  const [rastrear, setRastrear] = useState(null);
  const [ajustar, setAjustar] = useState(null);
  const [lendo, setLendo] = useState(false);
  const pedidoAtual = useRef(0);

  const carregar = useCallback(async () => {
    const numero = ++pedidoAtual.current;
    const parametros = new URLSearchParams({ visao, ...(busca.trim() ? { busca: busca.trim() } : {}) });
    try {
      const r = await api(`/logistica/expedicoes?${parametros}`);
      if (numero !== pedidoAtual.current) return;
      if (!r.success) { toast.error(r.message || "Não foi possível carregar a expedição."); setDados({ expedicoes: [], grupos: [], contagem: {} }); return; }
      setDados(r);
    } catch (erro) {
      if (numero === pedidoAtual.current) { toast.error("Sem conexão com o servidor."); setDados({ expedicoes: [], grupos: [], contagem: {} }); }
    }
  }, [visao, busca]);

  useEffect(() => {
    const espera = setTimeout(carregar, busca ? 280 : 0);
    return () => clearTimeout(espera);
  }, [carregar, busca, versao]);

  useEffect(() => { setMarcados(new Set()); }, [visao]);

  const porId = useMemo(() => new Map((dados?.expedicoes || []).map((e) => [e.id, e])), [dados]);
  const selecionadas = useMemo(() => [...marcados].map((id) => porId.get(id)).filter(Boolean), [marcados, porId]);
  const totais = useMemo(() => selecionadas.reduce((t, e) => ({ peso: t.peso + (e.peso_bruto || 0), volumes: t.volumes + (e.volumes || 0), valor: t.valor + e.valor_total }), { peso: 0, volumes: 0, valor: 0 }), [selecionadas]);

  const alternar = (ids) => setMarcados((atual) => {
    const novo = new Set(atual);
    const todos = ids.every((id) => novo.has(id));
    ids.forEach((id) => (todos ? novo.delete(id) : novo.add(id)));
    return novo;
  });

  const lerNotas = async () => {
    if (!erp) { setLendo(true); await carregar(); setLendo(false); return; }
    setLendo(true);
    const aviso = toast.loading(`Lendo as NF-es de saída do ${erp.nome}...`);
    try {
      const r = await api("/logistica/expedicoes/sincronizar-nfe", { metodo: "POST", corpo: { dias: 30 } });
      if (r.success) { toast.success(r.message, { id: aviso, duration: 6000 }); carregar(); } else toast.error(r.message, { id: aviso });
    } catch (erro) { toast.error("Sem conexão com o servidor.", { id: aviso }); } finally { setLendo(false); }
  };

  const contagem = dados?.contagem || {};
  const opcoes = VISOES.map((v) => ({ ...v, rotulo: contagem[v.id] ? `${v.rotulo} · ${contagem[v.id]}` : v.rotulo }));
  const lista = dados?.expedicoes || [];

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1"><Segmentado opcoes={opcoes} valor={visao} onChange={onVisao} /></div>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={busca} onChange={(ev) => setBusca(ev.target.value)} placeholder="Pedido, NF-e, cliente ou cidade" aria-label="Buscar pedidos" className={`${CAMPO} pl-10 pr-9`} />
            {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"><X size={14} /></button>}
          </div>
          <button type="button" onClick={lerNotas} disabled={lendo} title={erp ? `Ler NF-es de saída do ${erp.nome}` : "Atualizar a lista"} aria-label={erp ? `Ler NF-es de saída do ${erp.nome}` : "Atualizar a lista"} className={`${BOTAO_SECUNDARIO.replace("px-5", "px-0")} w-11 shrink-0`}>
            <RefreshCw size={16} className={lendo ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {dados === null ? <div className={VIDRO}><Carregando texto="Carregando pedidos..." /></div> : visao === "aguardando" ? (
        dados.grupos.length === 0 ? (
          <div className={VIDRO}>
            <EstadoVazio icone={PackageOpen} titulo={busca ? "Nada encontrado" : "Nenhum pedido esperando coleta"} texto={busca ? "Nenhum pedido com essa busca." : (erp ? `Pedidos com NF-e emitida aparecem aqui sozinhos. Use o botão de atualizar para ler as notas do ${erp.nome}.` : "Pedidos com NF-e emitida aparecem aqui sozinhos.")} />
          </div>
        ) : (
          <div className="space-y-4">
            {dados.grupos.map((g) => <GrupoTransportadora key={g.transportadora_id || 0} grupo={g} porId={porId} marcados={marcados} alternar={alternar} />)}
          </div>
        )
      ) : (
        <section className={`${VIDRO} overflow-hidden`}>
          <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_160px_20px] gap-x-4 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 border-b border-black/[0.05] dark:border-white/[0.06]">
            <span>Pedido</span><span>Transportadora</span><span>Entrega</span><span>Situação</span><span />
          </div>
          {lista.length === 0 ? <EstadoVazio icone={Truck} titulo="Nada por aqui" texto={visao === "atrasadas" ? "Nenhuma entrega com a previsão vencida." : "Nenhum pedido nesta situação."} /> : (
            <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {lista.map((e) => <LinhaRastreio key={`${e.id}-${e.status_rastreio}-${versao}`} e={e} onAtualizar={setRastrear} onEditar={setAjustar} />)}
            </ul>
          )}
        </section>
      )}
      {dados?.limite && <p className="text-center text-xs text-zinc-500">Mostrando {dados.limite}. Use a busca para achar os demais.</p>}

      {selecionadas.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#1a1a1d]/90 py-2 pl-5 pr-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{selecionadas.length} {selecionadas.length === 1 ? "pedido" : "pedidos"}</p>
              <p className="truncate text-xs text-zinc-500 tabular-nums">{peso(totais.peso)}{totais.volumes ? ` · ${totais.volumes} vol.` : ""} · {moeda(totais.valor)}</p>
            </div>
            <button type="button" onClick={() => setMarcados(new Set())} className="hidden sm:inline-flex h-10 items-center px-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Limpar</button>
            <button type="button" onClick={() => onMontar(selecionadas, () => { setMarcados(new Set()); carregar(); })} className={`${BOTAO} h-11`}><Truck size={16} />Montar romaneio</button>
          </div>
        </div>
      )}

      {rastrear && <ModalRastreio expedicao={rastrear} onFechar={() => setRastrear(null)} onSalvo={() => { setRastrear(null); carregar(); }} />}
      {ajustar && <ModalAjustes expedicao={ajustar} onFechar={() => setAjustar(null)} onSalvo={() => { setAjustar(null); carregar(); }} />}
    </div>
  );
}
