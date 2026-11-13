"use client";

// Módulo Meu site (Raizan Insight). Instruções do dono em docs/website-instrucoes.md e contrato da API
// em docs/RAIZAN-INSIGHT.md. Esta página só orquestra: quem decide o que aparece é capacidades.js,
// quem busca dados é dados.js e cada aba carrega a própria fonte, então uma falha não derruba as outras.

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, FileText, Globe, Lock, PlugZap, ShieldCheck, Sparkles } from "lucide-react";
import { BOTAO_PRIMARIO, CAMPO, Carregando, CascaPagina, EstadoVazio, ROTULO, Segmentado, VIDRO } from "@/components/vendedores/ui";
import { contextoDoPainel, resolverAreasDoSite, resolverBlocosDaVisao } from "@/components/website/capacidades";
import { instalarSite, sitesDaEmpresa } from "@/components/website/dados";
import { EVENTO_ABRIR_INTERACAO } from "@/components/website/avisosDoSino";
import { EstadoDaFonte, Etiqueta, STATUS_CONEXAO, saudacao, tempoRelativo } from "@/components/website/comum";
import VisaoGeral from "@/components/website/VisaoGeral";
import Interacoes from "@/components/website/Interacoes";
import Analytics from "@/components/website/Analytics";
import Servicos from "@/components/website/Servicos";

const RECURSOS = [
  { icone: BarChart3, titulo: "Analytics do site", texto: "Visitas, visitantes, páginas, regiões e origem do tráfego." },
  { icone: FileText, titulo: "Formulários e leads", texto: "Todo formulário do site chega aqui com todos os campos, sem configurar nada." },
  { icone: ShieldCheck, titulo: "Gestão do site", texto: "Licença, domínio e hospedagem com vencimentos separados." },
];

// Apresentação do módulo enquanto a empresa ainda não tem site conectado
function Apresentacao({ resposta, podeInstalar, onInstalado }) {
  const [nome, setNome] = useState("");
  const [dominio, setDominio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const moduloAtivo = resposta.estado === "ok";

  const instalar = async (e) => {
    e.preventDefault();
    const limpo = dominio.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!nome.trim()) return toast.error("Dê um nome para o site.");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(limpo)) return toast.error("Digite um domínio válido, por exemplo: empresa.com.br");
    setSalvando(true);
    const r = await instalarSite({ nome: nome.trim(), dominio: limpo });
    setSalvando(false);
    if (r.estado !== "ok") return toast.error(r.mensagem || "Não foi possível instalar a integração.");
    toast.success("Integração instalada. Agora gere a chave do site.");
    onInstalado();
  };

  return (
    <div className={`${VIDRO} relative overflow-hidden`}>
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" aria-hidden />
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-10">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full"><Sparkles size={12} /> Raizan Insight</span>
          <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Conecte seu site ao Raizan Core</h2>
          <p className="mt-3 text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Acompanhe visitas, interações, formulários, oportunidades comerciais e o desempenho digital em um só lugar.
            Funciona mesmo sem ERP e com qualquer plataforma: Next.js, React, WordPress, WooCommerce, Shopify ou Raizan Commerce.
          </p>
          <ul className="mt-6 space-y-4">
            {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0"><Icone size={17} /></span>
                <span><b className="block text-sm text-zinc-900 dark:text-white">{titulo}</b><span className="text-sm text-zinc-500">{texto}</span></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex">
          {moduloAtivo && podeInstalar ? (
            <form onSubmit={instalar} className="w-full self-center rounded-[24px] bg-black/[0.025] dark:bg-white/[0.035] border border-black/[0.05] dark:border-white/[0.06] p-6 space-y-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Instalar integração</h3>
              <div>
                <label htmlFor="nome-site" className={ROTULO}>Nome do site</label>
                <input id="nome-site" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Site institucional" className={CAMPO} maxLength={120} />
              </div>
              <div>
                <label htmlFor="dominio-novo" className={ROTULO}>Domínio principal</label>
                <input id="dominio-novo" value={dominio} onChange={(e) => setDominio(e.target.value)} placeholder="empresa.com.br" className={CAMPO} maxLength={253} />
              </div>
              <button type="submit" disabled={salvando} className={`${BOTAO_PRIMARIO} w-full`}><PlugZap size={16} /> {salvando ? "Instalando..." : "Instalar integração"}</button>
            </form>
          ) : (
            <div className="w-full self-center rounded-[24px] bg-black/[0.025] dark:bg-white/[0.035] border border-black/[0.05] dark:border-white/[0.06]">
              {moduloAtivo
                ? <EstadoVazio icone={Lock} titulo="Nenhum site conectado" texto="Peça a um administrador da empresa para instalar a integração." />
                : <EstadoDaFonte resposta={resposta} titulo="Módulo em ativação" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ABAS_DO_LINK = ["visao", "interacoes", "analytics", "gestao"];

// Lê a URL no navegador (sem useSearchParams, que exigiria Suspense no build estático)
function linkDireto() {
  try {
    const p = new URLSearchParams(window.location.search);
    const aba = p.get("aba");
    return {
      aba: ABAS_DO_LINK.includes(aba) ? aba : null,
      site: /^[\w-]{1,40}$/.test(p.get("site") || "") ? p.get("site") : null,
      id: /^[\w-]{1,40}$/.test(p.get("id") || "") ? p.get("id") : null,
    };
  } catch (e) {
    return {};
  }
}

export default function MeuSitePage() {
  const [contexto, setContexto] = useState(null);
  const [resposta, setResposta] = useState(null);
  const [siteId, setSiteId] = useState("");
  const [aba, setAba] = useState("visao");
  const [abrirInteracao, setAbrirInteracao] = useState(null);

  // localStorage só existe no navegador: o contexto nasce depois da montagem
  useEffect(() => {
    setContexto(contextoDoPainel());
    // Link direto vindo de um aviso: /website?aba=interacoes&site=st_...&id=123
    const pedido = linkDireto();
    if (pedido.aba) setAba(pedido.aba);
    if (pedido.site) setSiteId(pedido.site);
    if (pedido.id) setAbrirInteracao(pedido.id);

    // Aviso clicado com esta tela já aberta (o link não remonta a página)
    const abrirDoAviso = (e) => {
      setAba("interacoes");
      if (e.detail?.site) setSiteId(e.detail.site);
      if (e.detail?.id) setAbrirInteracao(String(e.detail.id));
    };
    window.addEventListener(EVENTO_ABRIR_INTERACAO, abrirDoAviso);
    return () => window.removeEventListener(EVENTO_ABRIR_INTERACAO, abrirDoAviso);
  }, []);

  const carregarSites = useCallback(async () => {
    const r = await sitesDaEmpresa();
    setResposta(r);
    const sites = r.estado === "ok" ? r.dados.sites || [] : [];
    setSiteId((atual) => (atual && sites.some((s) => s.id === atual) ? atual : sites[0]?.id || ""));
  }, []);

  useEffect(() => { carregarSites(); }, [carregarSites]);

  const areas = useMemo(() => (contexto ? resolverAreasDoSite(contexto) : []), [contexto]);
  const blocos = useMemo(() => (contexto ? resolverBlocosDaVisao(contexto) : new Set()), [contexto]);
  const abaAtual = areas.some((a) => a.id === aba) ? aba : areas[0]?.id;

  const sites = resposta?.estado === "ok" ? resposta.dados.sites || [] : [];
  const site = sites.find((s) => s.id === siteId) || null;
  const empresa = typeof window !== "undefined" ? localStorage.getItem("@raizan:nome") || "" : "";

  const irPara = useCallback((destino, interacaoId) => {
    setAba(destino);
    if (interacaoId) setAbrirInteracao(interacaoId);
  }, []);
  const limparAbertura = useCallback(() => setAbrirInteracao(null), []);

  if (!contexto || !resposta) return <CascaPagina><Carregando texto="Carregando Meu site..." /></CascaPagina>;

  if (!areas.length) {
    return (
      <CascaPagina>
        <div className={VIDRO}><EstadoVazio icone={Lock} titulo="Acesso restrito" texto="Seu usuário não tem acesso ao módulo Meu site." /></div>
      </CascaPagina>
    );
  }

  const conexao = site ? STATUS_CONEXAO[site.status_conexao] || STATUS_CONEXAO.desconectado : null;

  return (
    <CascaPagina>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{saudacao()}{empresa ? `, ${empresa}` : ""}</p>
          <h1 className="text-3xl md:text-[34px] font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            Meu site
            {conexao && <Etiqueta tom={conexao.tom} ponto>{conexao.rotulo}</Etiqueta>}
          </h1>
          {site && (
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5 min-w-0">
              <Globe size={14} className="shrink-0" />
              <span className="truncate">{site.dominio}</span>
              <span className="shrink-0">· atualizado {site.ultima_comunicacao ? tempoRelativo(site.ultima_comunicacao) : "nunca"}</span>
            </p>
          )}
        </div>
        {sites.length > 1 && (
          <label className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] text-zinc-500">Site</span>
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={`${CAMPO.replace("w-full", "w-full sm:w-auto")} h-10 min-w-0 sm:min-w-[200px]`} aria-label="Escolher site">
              {sites.map((s) => <option key={s.id} value={s.id}>{s.nome} ({s.dominio})</option>)}
            </select>
          </label>
        )}
      </div>

      {!site ? (
        <>
          <Apresentacao resposta={resposta} podeInstalar={contexto.pode("cadastros/integracoes")} onInstalado={carregarSites} />
          {/* Domínio ou e-mail contratados antes do site ficar pronto também aparecem */}
          {areas.some((a) => a.id === "gestao") && <Servicos discreto />}
        </>
      ) : (
        <>
          <Segmentado opcoes={areas} valor={abaAtual} onChange={setAba} />
          {abaAtual === "visao" && <VisaoGeral key={site.id} site={site} tenantId={contexto.tenantId} blocos={blocos} onAtualizarSites={carregarSites} onIrPara={irPara} />}
          {abaAtual === "interacoes" && <Interacoes key={site.id} siteId={site.id} abrirId={abrirInteracao} onAberto={limparAbertura} />}
          {abaAtual === "analytics" && <Analytics key={site.id} siteId={site.id} />}
          {abaAtual === "gestao" && <Servicos />}
        </>
      )}
    </CascaPagina>
  );
}
