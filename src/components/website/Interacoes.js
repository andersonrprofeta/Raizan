"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Archive, Briefcase, Building2, CheckCircle2, Clock3, Download, ExternalLink, Globe, Handshake,
  History, Inbox, Mail, MessageCircle, MessageSquareText, Phone, Search, Sparkles, StickyNote, UserRound, X,
} from "lucide-react";
import { Avatar, BOTAO_PRIMARIO, CAMPO, Carregando, EstadoVazio, VIDRO } from "@/components/vendedores/ui";
import { anotarInteracao, atualizarInteracao, lerInteracao, lerInteracoes } from "./dados";
import {
  EstadoDaFonte, Etiqueta, STATUS_INTERACAO, SeletorPeriodo, dataHora, intervaloDoPeriodo, nomeDoContato, tempoRelativo,
} from "./comum";

const SELECT = `${CAMPO.replace("w-full", "w-auto")} h-10 pr-8 cursor-pointer`;

const CARTOES = [
  { id: "", rotulo: "Total", icone: Inbox, tom: "text-zinc-900 dark:text-white" },
  { id: "novo", rotulo: "Novos", icone: Sparkles, tom: "text-purple-600 dark:text-purple-400" },
  { id: "atendimento", rotulo: "Em atendimento", icone: Clock3, tom: "text-sky-600 dark:text-sky-400" },
  { id: "negociacao", rotulo: "Em negociação", icone: Handshake, tom: "text-amber-600 dark:text-amber-400" },
  { id: "convertido", rotulo: "Convertidos", icone: CheckCircle2, tom: "text-emerald-600 dark:text-emerald-400" },
  { id: "arquivado", rotulo: "Arquivados", icone: Archive, tom: "text-zinc-500" },
];

// Telefone brasileiro com DDD (10 ou 11 dígitos) vira link de WhatsApp
const linkWhatsapp = (telefone) => {
  const digitos = String(telefone || "").replace(/\D/g, "").replace(/^55/, "");
  return digitos.length === 10 || digitos.length === 11 ? `https://wa.me/55${digitos}` : null;
};

// Valores complexos ficam legíveis: lista vira texto, sim/não, objeto vira linhas
function ValorDoCampo({ valor }) {
  if (valor === null || valor === undefined || valor === "") return <span className="text-zinc-400">Não informado</span>;
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) {
    return (
      <span className="flex flex-wrap gap-1.5 justify-end">
        {valor.map((v, i) => <span key={i} className="rounded-full bg-black/[0.05] dark:bg-white/[0.07] px-2 py-0.5 text-xs">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>)}
      </span>
    );
  }
  if (typeof valor === "object") {
    return (
      <span className="block text-right">
        {Object.entries(valor).map(([k, v]) => <span key={k} className="block"><span className="text-zinc-400">{k}:</span> {String(v)}</span>)}
      </span>
    );
  }
  const texto = String(valor);
  if (/^https?:\/\//i.test(texto)) return <a href={texto} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline break-all">{texto}</a>;
  return <span className="whitespace-pre-wrap break-words">{texto}</span>;
}

// O detalhe aceita "campos" (lista com rótulo) ou "payload" (objeto livre): renderiza o que vier
function camposDaInteracao(interacao) {
  if (Array.isArray(interacao.campos)) return interacao.campos;
  const payload = interacao.payload && typeof interacao.payload === "object" ? interacao.payload : {};
  return Object.entries(payload).map(([chave, valor]) => ({ chave, rotulo: chave.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase()), valor }));
}

function exportarInteracao(interacao) {
  const linhas = [["Campo", "Valor"], ...camposDaInteracao(interacao).map((c) => [c.rotulo, typeof c.valor === "object" && c.valor !== null ? JSON.stringify(c.valor) : c.valor ?? ""])];
  linhas.push(["Formulário", interacao.formulario], ["Site", interacao.dominio], ["Recebido em", dataHora(interacao.recebido_em)], ["Status", STATUS_INTERACAO[interacao.status]?.rotulo || interacao.status]);
  const csv = linhas.map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `interacao-${interacao.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Secao({ titulo, icone: Icone, children }) {
  return (
    <section className="py-5 border-b border-black/[0.05] dark:border-white/[0.06] last:border-0">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3"><Icone size={13} /> {titulo}</h3>
      {children}
    </section>
  );
}

function Par({ rotulo, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-[13px] text-zinc-500 shrink-0 max-w-[45%]">{rotulo}</span>
      <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 text-right min-w-0">{children}</span>
    </div>
  );
}

// ---------- Painel lateral de detalhes ----------

function Detalhe({ id, responsaveis, onFechar, onMudou }) {
  const [resposta, setResposta] = useState(null);
  const [nota, setNota] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setResposta(await lerInteracao(id));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    const aoApertar = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, [onFechar]);

  const interacao = resposta?.estado === "ok" ? resposta.dados.interacao : null;

  const alterar = async (corpo, aviso) => {
    setSalvando(true);
    const r = await atualizarInteracao(id, corpo);
    setSalvando(false);
    if (r.estado !== "ok") return toast.error(r.mensagem || "Não foi possível salvar.");
    toast.success(aviso);
    if (r.dados.interacao) setResposta({ estado: "ok", dados: { interacao: r.dados.interacao } });
    else carregar();
    onMudou();
  };

  const anotar = async () => {
    const texto = nota.trim();
    if (!texto) return;
    setSalvando(true);
    const r = await anotarInteracao(id, texto);
    setSalvando(false);
    if (r.estado !== "ok") return toast.error(r.mensagem || "Não foi possível salvar a observação.");
    setNota("");
    toast.success("Observação adicionada.");
    if (r.dados.interacao) setResposta({ estado: "ok", dados: { interacao: r.dados.interacao } });
    else carregar();
  };

  const copiar = async (texto, aviso) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(aviso);
    } catch (e) {
      toast.error("Não foi possível copiar.");
    }
  };

  const whatsapp = linkWhatsapp(interacao?.telefone);
  const campos = interacao ? camposDaInteracao(interacao) : [];

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/40 animate-in fade-in duration-150" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <aside role="dialog" aria-modal="true" aria-label="Detalhes da interação" className="h-full w-full sm:max-w-xl bg-white dark:bg-[#161618] border-l border-black/[0.06] dark:border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start gap-4 p-5 sm:p-6 border-b border-black/[0.05] dark:border-white/[0.06]">
          {interacao ? <Avatar nome={interacao.nome || interacao.empresa} tamanho={48} /> : <div className="w-12 h-12" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white truncate">{interacao ? nomeDoContato(interacao) : "Carregando..."}</h2>
            {interacao && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Etiqueta tom={(STATUS_INTERACAO[interacao.status] || STATUS_INTERACAO.novo).tom} ponto>{(STATUS_INTERACAO[interacao.status] || STATUS_INTERACAO.novo).rotulo}</Etiqueta>
                <span className="text-xs text-zinc-500">{interacao.formulario} · {tempoRelativo(interacao.recebido_em)}</span>
              </div>
            )}
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={15} /></button>
        </div>

        {!resposta ? <Carregando /> : !interacao ? <EstadoDaFonte resposta={resposta} onTentar={carregar} /> : (
          <>
            <div className="flex flex-wrap gap-2 px-5 sm:px-6 pt-4">
              {interacao.email && <button type="button" onClick={() => copiar(interacao.email, "E-mail copiado.")} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07]"><Mail size={14} /> Copiar e-mail</button>}
              {interacao.telefone && <button type="button" onClick={() => copiar(interacao.telefone, "Telefone copiado.")} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07]"><Phone size={14} /> Copiar telefone</button>}
              {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold text-white bg-gradient-to-b from-green-500 to-green-600"><MessageCircle size={14} /> WhatsApp</a>}
              <button type="button" onClick={() => exportarInteracao(interacao)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07]"><Download size={14} /> Exportar</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6">
              <Secao titulo="Atendimento" icone={Briefcase}>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {Object.entries(STATUS_INTERACAO).map(([chave, { rotulo }]) => (
                    <button
                      key={chave}
                      type="button"
                      disabled={salvando || interacao.status === chave}
                      onClick={() => alterar({ status: chave }, `Marcado como ${rotulo.toLowerCase()}.`)}
                      className={`h-9 rounded-full text-[12px] font-semibold transition-all active:scale-95 ${interacao.status === chave ? "bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-sm" : "bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.07]"}`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
                <label className="block mt-4">
                  <span className="text-[13px] text-zinc-500">Responsável pelo atendimento</span>
                  <select
                    value={interacao.responsavel?.id ?? ""}
                    disabled={salvando}
                    onChange={(e) => alterar({ responsavel_id: e.target.value ? Number(e.target.value) : null }, "Responsável atualizado.")}
                    className={`${CAMPO} mt-1.5`}
                  >
                    <option value="">Sem responsável</option>
                    {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </label>
              </Secao>

              <Secao titulo="Contato" icone={UserRound}>
                <Par rotulo="Nome">{interacao.nome || <span className="text-zinc-400">Não informado</span>}</Par>
                <Par rotulo="E-mail">{interacao.email || <span className="text-zinc-400">Não informado</span>}</Par>
                <Par rotulo="Telefone">{interacao.telefone || <span className="text-zinc-400">Não informado</span>}</Par>
                {interacao.empresa && <Par rotulo="Empresa">{interacao.empresa}</Par>}
                {interacao.documento && <Par rotulo="Documento">{interacao.documento}</Par>}
              </Secao>

              <Secao titulo="Origem" icone={Globe}>
                <Par rotulo="Site">{interacao.site_nome || interacao.dominio}</Par>
                <Par rotulo="Formulário">{interacao.formulario}</Par>
                <Par rotulo="Recebido em">{dataHora(interacao.recebido_em)}</Par>
                {interacao.pagina_url && <Par rotulo="Página"><ValorDoCampo valor={interacao.pagina_url} /></Par>}
                {interacao.origem && <Par rotulo="Origem do tráfego">{interacao.origem}</Par>}
                {interacao.campanha && Object.entries(interacao.campanha).map(([k, v]) => <Par key={k} rotulo={k}>{v}</Par>)}
              </Secao>

              <Secao titulo={`Campos do formulário (${campos.length})`} icone={MessageSquareText}>
                <div className="rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] px-4 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                  {campos.map((campo) => <Par key={campo.chave} rotulo={campo.rotulo || campo.chave}><ValorDoCampo valor={campo.valor} /></Par>)}
                </div>
              </Secao>

              {Array.isArray(interacao.navegacao) && interacao.navegacao.length > 0 && (
                <Secao titulo="Navegação antes do envio" icone={ExternalLink}>
                  <ol className="space-y-2">
                    {interacao.navegacao.map((passo, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="flex items-center gap-2 min-w-0"><span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span><code className="truncate">{passo.pagina}</code></span>
                        <span className="text-zinc-400 shrink-0">{tempoRelativo(passo.quando)}</span>
                      </li>
                    ))}
                  </ol>
                </Secao>
              )}

              <Secao titulo="Observações internas" icone={StickyNote}>
                <div className="flex gap-2">
                  <input value={nota} onChange={(e) => setNota(e.target.value)} onKeyDown={(e) => e.key === "Enter" && anotar()} placeholder="Escreva uma observação para a equipe" maxLength={1000} className={CAMPO} />
                  <button type="button" onClick={anotar} disabled={salvando || !nota.trim()} className={`${BOTAO_PRIMARIO} shrink-0`}>Salvar</button>
                </div>
                {(interacao.observacoes || []).map((obs, i) => (
                  <div key={i} className="mt-3 rounded-2xl bg-amber-500/[0.07] border border-amber-500/15 p-3">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{obs.texto}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">{obs.quem} · {dataHora(obs.quando)}</p>
                  </div>
                ))}
              </Secao>

              <Secao titulo="Histórico" icone={History}>
                <ol className="relative border-l border-black/[0.08] dark:border-white/[0.08] ml-1.5 space-y-3 pb-2">
                  {(interacao.historico || []).map((h, i) => (
                    <li key={i} className="pl-4 relative">
                      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-purple-500" />
                      <p className="text-[13px] text-zinc-800 dark:text-zinc-200">{h.acao}</p>
                      <p className="text-[11px] text-zinc-500">{h.quem} · {dataHora(h.quando)}</p>
                    </li>
                  ))}
                </ol>
              </Secao>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

// ---------- Lista ----------

export default function Interacoes({ siteId, abrirId, onAberto }) {
  const [periodo, setPeriodo] = useState("30d");
  const [personalizado, setPersonalizado] = useState({});
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [origem, setOrigem] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [resposta, setResposta] = useState(null);
  const [aberto, setAberto] = useState(abrirId || null);

  // Espera a pessoa parar de digitar
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    if (abrirId) {
      setAberto(abrirId);
      onAberto?.();
    }
  }, [abrirId, onAberto]);

  const intervalo = intervaloDoPeriodo(periodo, personalizado);

  const carregar = useCallback(async () => {
    setResposta((r) => (r?.estado === "ok" ? { ...r, atualizando: true } : null));
    setResposta(await lerInteracoes({ site_id: siteId, status, tipo, origem, responsavel, busca: buscaAplicada, de: intervalo.de, ate: intervalo.ate }));
  }, [siteId, status, tipo, origem, responsavel, buscaAplicada, intervalo.de, intervalo.ate]);

  useEffect(() => { carregar(); }, [carregar]);

  const dados = resposta?.estado === "ok" ? resposta.dados : null;
  const responsaveis = dados?.responsaveis || [];
  const formularios = useMemo(() => {
    const vistos = new Map();
    (dados?.formularios || dados?.itens || []).forEach((f) => { if (f.tipo && !vistos.has(f.tipo)) vistos.set(f.tipo, f.formulario); });
    return [...vistos.entries()];
  }, [dados]);
  const origens = useMemo(() => [...new Set((dados?.itens || []).map((i) => i.origem).filter(Boolean))], [dados]);

  if (resposta && !dados) return <div className={VIDRO}><EstadoDaFonte resposta={resposta} onTentar={carregar} /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {CARTOES.map(({ id, rotulo, icone: Icone, tom }) => {
          const valor = dados ? (id ? dados.resumo?.[id] : dados.resumo?.total) : null;
          const ativo = status === id;
          return (
            <button
              key={id || "total"}
              type="button"
              aria-pressed={ativo}
              onClick={() => setStatus(id)}
              className={`${VIDRO} !rounded-3xl p-4 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98] ${ativo ? "ring-2 ring-purple-500/60" : ""}`}
            >
              <span className="flex items-center gap-2 text-[12px] font-medium text-zinc-500"><Icone size={14} className={tom} /> {rotulo}</span>
              <span className={`block mt-2 text-2xl font-bold tracking-tight tabular-nums ${tom}`}>{valor ?? "—"}</span>
            </button>
          );
        })}
      </div>

      <div className={`${VIDRO} p-4 space-y-3`}>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail, telefone, empresa ou documento" className={`${CAMPO} pl-11`} aria-label="Buscar interações" />
          </div>
          <SeletorPeriodo periodo={periodo} personalizado={personalizado} onPeriodo={setPeriodo} onPersonalizado={setPersonalizado} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Formulário" value={tipo} onChange={(e) => setTipo(e.target.value)} className={SELECT}>
            <option value="">Todos os formulários</option>
            {formularios.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_INTERACAO).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
          <select aria-label="Origem" value={origem} onChange={(e) => setOrigem(e.target.value)} className={SELECT}>
            <option value="">Todas as origens</option>
            {origens.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select aria-label="Responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className={SELECT}>
            <option value="">Todos os responsáveis</option>
            {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>
      </div>

      <div className={`${VIDRO} overflow-hidden`}>
        {!dados ? <Carregando texto="Carregando interações..." /> : dados.itens.length === 0 ? (
          <EstadoVazio icone={Inbox} titulo="Nenhuma interação encontrada" texto="Mude os filtros ou o período. Os formulários enviados pelo site aparecem aqui assim que chegam." />
        ) : (
          <ul className={`divide-y divide-black/[0.05] dark:divide-white/[0.05] transition-opacity ${resposta.atualizando ? "opacity-60" : ""}`}>
            {dados.itens.map((item) => {
              const st = STATUS_INTERACAO[item.status] || STATUS_INTERACAO.novo;
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => setAberto(item.id)} className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group">
                    <span className="relative shrink-0">
                      <Avatar nome={item.nome || item.empresa} tamanho={40} />
                      {item.nova && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-purple-500 ring-2 ring-white dark:ring-[#121214]" aria-label="Nova interação" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm truncate ${item.nova ? "font-bold" : "font-semibold"} text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors`}>{nomeDoContato(item)}</span>
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500 truncate">
                        {item.empresa && item.nome && <><Building2 size={12} className="shrink-0" /><span className="truncate">{item.empresa}</span><span>·</span></>}
                        <span className="truncate">{item.formulario}</span>
                        <span className="hidden md:inline">· {item.dominio}</span>
                      </span>
                    </span>
                    <span className="hidden lg:block text-xs text-zinc-500 w-32 truncate">{item.responsavel?.nome || <span className="text-zinc-400">Sem responsável</span>}</span>
                    <span className="hidden sm:block text-xs text-zinc-500 w-28 text-right">{dataHora(item.recebido_em)}</span>
                    <Etiqueta tom={st.tom}>{st.rotulo}</Etiqueta>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {aberto && <Detalhe id={aberto} responsaveis={responsaveis} onFechar={() => setAberto(null)} onMudou={carregar} />}
    </div>
  );
}
