"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getHubUrl, getHeaders } from "@/components/utils/api";
import {
  MessageCircle, Copy, RefreshCw, Settings2, Plus, Trash2, Check, Download,
  Loader2, X, Search, PhoneCall, ArrowRight, Info, ChevronLeft, ChevronRight, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

const CARD = "relative overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white/85 dark:bg-[#121214]/90 backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] transition-colors duration-300";
const PANEL = "bg-white/95 dark:bg-[#121214]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]";
const FIELD = "w-full h-11 px-4 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all";
const BUTTON_GREEN = "h-11 px-5 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_10px_24px_-8px_rgba(16,185,129,.55)] transition-all active:scale-95 disabled:opacity-60";
const MUTED_BUTTON = "h-11 px-4 rounded-full bg-black/[0.05] hover:bg-black/[0.08] dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95";

const ENDERECO = `${getHubUrl()}/api/hub/catalogo-whatsapp`;
const ESPERA_DA_BUSCA_MS = 350;

const PASSOS_META = [
  {
    texto: "Abra o Gerenciador de Comércio, entre com a conta que administra a empresa e crie um catálogo de e-commerce. Se já tiver um, é só abrir.",
    link: { rotulo: "Abrir Gerenciador de Comércio", url: "https://business.facebook.com/commerce/" },
  },
  { texto: "No catálogo, vá em Fontes de dados, escolha adicionar por link agendado e cole o link que está acima." },
  { texto: "Escolha a atualização mais frequente disponível e aguarde a primeira leitura. O status no topo desta tela muda quando o link for acessado." },
  {
    texto: "Abra o WhatsApp Manager, entre na área de Catálogo e conecte esse catálogo à conta que tem os números da equipe.",
    link: { rotulo: "Abrir WhatsApp Manager", url: "https://business.facebook.com/wa/manage/home/" },
  },
];

const formatarMoeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarInteiro = (v) => Number(v || 0).toLocaleString("pt-BR");

const formatarNumero = (numero) => {
  const n = String(numero || "");
  if (n.length === 13 && n.startsWith("55")) return `+55 ${n.slice(2, 4)} ${n.slice(4, 9)}-${n.slice(9)}`;
  if (n.length === 12 && n.startsWith("55")) return `+55 ${n.slice(2, 4)} ${n.slice(4, 8)}-${n.slice(8)}`;
  return `+${n}`;
};

const formatarAcesso = (data) => {
  if (!data) return "Ainda não lido";
  return new Date(data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const Metrica = ({ rotulo, valor, detalhe, tom = "text-zinc-400" }) => (
  <div>
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{rotulo}</p>
    <p className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums">{valor}</p>
    <p className={`mt-1.5 text-xs font-medium ${tom}`}>{detalhe}</p>
  </div>
);

export default function CatalogoWhatsappPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState({ produtos: [], pagina: 1, paginas: 1, total: 0 });
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [ocultarSemEstoque, setOcultarSemEstoque] = useState(true);
  const [nomeLoja, setNomeLoja] = useState("");
  const [site, setSite] = useState("");
  const [canais, setCanais] = useState([]);
  const [novoSetor, setNovoSetor] = useState("");
  const [novoNumero, setNovoNumero] = useState("");
  const [copiado, setCopiado] = useState(false);

  const carregarResumo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ENDERECO}/resumo`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setDados(data);
        if (data.config) {
          setOcultarSemEstoque(Boolean(data.config.ocultar_sem_estoque));
          setNomeLoja(data.config.nome_loja || "");
          setSite(data.config.site || "");
          setCanais(Array.isArray(data.config.canais) ? data.config.canais : []);
        }
      } else {
        toast.error(data.message || "Erro ao carregar o catálogo.");
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  useEffect(() => {
    const espera = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(1);
    }, ESPERA_DA_BUSCA_MS);
    return () => clearTimeout(espera);
  }, [busca]);

  const instalado = Boolean(dados?.instalado);

  useEffect(() => {
    if (!instalado) return undefined;
    let cancelado = false;

    (async () => {
      setCarregandoLista(true);
      try {
        const parametros = new URLSearchParams({ pagina: String(pagina), busca: buscaAplicada });
        const res = await fetch(`${ENDERECO}/produtos?${parametros}`, { headers: getHeaders() });
        const data = await res.json();
        if (!cancelado && data.success) setLista(data);
      } catch (err) {
        if (!cancelado) toast.error("Erro ao carregar os produtos.");
      } finally {
        if (!cancelado) setCarregandoLista(false);
      }
    })();

    return () => { cancelado = true; };
  }, [instalado, pagina, buscaAplicada, dados]);

  const copiarLink = () => {
    if (!dados?.link) return;
    navigator.clipboard.writeText(dados.link);
    setCopiado(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiado(false), 3000);
  };

  const adicionarCanal = () => {
    const numero = novoNumero.replace(/\D/g, "");
    if (!novoSetor.trim() || numero.length < 10) {
      return toast.error("Preencha o setor e o número com DDI e DDD.");
    }
    if (canais.some((c) => c.numero === numero)) return toast.error("Esse número já está na lista.");
    setCanais([...canais, { setor: novoSetor.trim(), numero }]);
    setNovoSetor("");
    setNovoNumero("");
  };

  const salvarConfiguracao = async () => {
    setSalvando(true);
    try {
      const res = await fetch(`${ENDERECO}/config`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ nome_loja: nomeLoja, site, ocultar_sem_estoque: ocultarSemEstoque, canais }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Catálogo salvo!");
        setModalConfigOpen(false);
        carregarResumo();
      } else {
        toast.error(data.message || "Erro ao salvar.");
      }
    } catch (e) {
      toast.error("Falha ao comunicar com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const estatisticas = dados?.estatisticas;
  const noCatalogo = (estatisticas?.em_estoque || 0) + (dados?.config?.ocultar_sem_estoque ? 0 : (estatisticas?.sem_estoque || 0));
  const foraDoCatalogo = (estatisticas?.sem_foto || 0) + (estatisticas?.sem_preco || 0);
  const lido = Boolean(dados?.ultimo_acesso);

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.07] blur-[130px]" />
        </div>

        <Header />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-5xl mx-auto space-y-6">

            {loading && !dados ? (
              <div className={`${CARD} min-h-[420px] flex items-center justify-center`}>
                <Loader2 size={32} className="animate-spin text-emerald-500" />
              </div>
            ) : !dados?.instalado ? (
              <div className={`${CARD} p-10 sm:p-14 text-center`}>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_10px_24px_-8px_rgba(16,185,129,.65)]">
                  <MessageCircle size={30} />
                </span>
                <h1 className="mt-5 text-2xl font-bold tracking-tight">Catálogo WhatsApp ainda não conectado</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Instale o módulo em Integrações para gerar o link que a Meta usa para manter seu catálogo atualizado.
                </p>
                <Link href="/cadastros/integracoes" className={`${BUTTON_GREEN} mx-auto mt-6 w-fit`}>
                  Ir para Integrações <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <div className={`${CARD} p-6 sm:p-8 space-y-8`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-[18px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(16,185,129,.65)]">
                        <MessageCircle size={28} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight">Catálogo WhatsApp</h1>
                          <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${lido ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"}`}>
                            {lido ? "Link em uso" : "Aguardando a Meta"}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{dados.config?.nome_loja}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button onClick={carregarResumo} className={MUTED_BUTTON} title="Atualizar dados" aria-label="Atualizar dados">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                      </button>
                      <button onClick={() => setModalConfigOpen(true)} className={BUTTON_GREEN}>
                        <Settings2 size={17} /> Configurar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-8">
                    <Metrica rotulo="No catálogo" valor={formatarInteiro(noCatalogo)} detalhe="Enviados no link" tom="text-emerald-600 dark:text-emerald-400" />
                    <Metrica rotulo="Sem estoque" valor={formatarInteiro(estatisticas?.sem_estoque)} detalhe={dados.config?.ocultar_sem_estoque ? "Ocultos do catálogo" : "Aparecem como esgotados"} />
                    <Metrica rotulo="Fora do catálogo" valor={formatarInteiro(foraDoCatalogo)} detalhe={`${formatarInteiro(estatisticas?.sem_foto)} sem foto, ${formatarInteiro(estatisticas?.sem_preco)} sem preço`} tom={foraDoCatalogo > 0 ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"} />
                    <Metrica rotulo="Último acesso ao link" valor={<span className="text-xl">{formatarAcesso(dados.ultimo_acesso)}</span>} detalhe="Conta qualquer leitura do link" />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-lg font-bold tracking-tight">Números de WhatsApp</h2>

                    <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-5 sm:p-6">
                      {canais.length === 0 ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum número cadastrado. Adicione os números da equipe em Configurar.</p>
                      ) : (
                        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                          {canais.map((canal) => (
                            <div key={canal.numero} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3.5">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <MessageCircle size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-sm sm:text-base leading-tight">{canal.setor}</p>
                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 tabular-nums mt-0.5">{formatarNumero(canal.numero)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="mt-4 flex items-start gap-2 border-t border-black/[0.06] pt-4 text-xs leading-relaxed text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                        <Info size={15} className="mt-px shrink-0" aria-hidden />
                        Esta lista é um cadastro interno. O número passa a mostrar o catálogo quando está na conta do WhatsApp Business ligada a ele na Meta.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${CARD} overflow-hidden`}>
                  <div className="p-5 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base">Produtos no link</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatarInteiro(lista.total)} {lista.total === 1 ? "produto" : "produtos"} que a Meta recebe ao ler o catálogo</p>
                    </div>
                    <div className="relative sm:w-64">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar SKU ou produto..." aria-label="Buscar produto" className={`${FIELD} pl-10 h-10`} />
                    </div>
                  </div>
                  <div className={`overflow-x-auto transition-opacity ${carregandoLista ? "opacity-60" : ""}`}>
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs font-semibold text-zinc-500 border-b border-black/[0.06] dark:border-white/[0.07]">
                        <tr>
                          <th className="px-5 py-3.5">Item</th>
                          <th className="px-5 py-3.5">SKU</th>
                          <th className="px-5 py-3.5">Marca</th>
                          <th className="px-5 py-3.5 text-right">Preço</th>
                          <th className="px-5 py-3.5 text-center">Disponibilidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                        {lista.produtos.map((item) => (
                          <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="px-5 py-3 flex items-center gap-3">
                              <img src={item.imagem} alt="" loading="lazy" className="w-10 h-10 rounded-xl object-cover border border-black/10 bg-white shrink-0" />
                              <span className="font-semibold line-clamp-1">{item.nome}</span>
                            </td>
                            <td className="px-5 py-3 font-mono text-xs text-zinc-500">{item.sku}</td>
                            <td className="px-5 py-3 text-zinc-500">{item.marca}</td>
                            <td className="px-5 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatarMoeda(item.preco)}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${item.disponivel ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-zinc-500/15 text-zinc-500"}`}>
                                {item.disponivel ? `${formatarInteiro(item.estoque)} em estoque` : "Sem estoque"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!carregandoLista && lista.produtos.length === 0 && <p className="p-10 text-center text-sm text-zinc-500">Nenhum produto encontrado.</p>}
                  </div>
                  {lista.paginas > 1 && (
                    <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] p-4 dark:border-white/[0.07]">
                      <button type="button" onClick={() => setPagina(lista.pagina - 1)} disabled={lista.pagina <= 1 || carregandoLista} className={`${MUTED_BUTTON} h-10 disabled:opacity-40`}>
                        <ChevronLeft size={16} /> Anterior
                      </button>
                      <span className="text-sm text-zinc-500 tabular-nums">Página {lista.pagina} de {lista.paginas}</span>
                      <button type="button" onClick={() => setPagina(lista.pagina + 1)} disabled={lista.pagina >= lista.paginas || carregandoLista} className={`${MUTED_BUTTON} h-10 disabled:opacity-40`}>
                        Próxima <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </main>
      </div>

      {modalConfigOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div role="dialog" aria-modal="true" aria-label="Configurar catálogo" className={`${PANEL} rounded-[30px] w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
            <div className="px-7 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Configurar catálogo</h2>
                <p className="text-xs text-zinc-500 mt-1">Link da Meta, dados da loja e números da equipe.</p>
              </div>
              <button onClick={() => setModalConfigOpen(false)} aria-label="Fechar" className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center">
                <X size={17} />
              </button>
            </div>

            <div className="p-7 space-y-7 overflow-y-auto custom-scrollbar">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold">Link do catálogo</h3>
                  <a href={dados?.link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                    <Download size={13} /> Testar arquivo
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" readOnly value={dados?.link || ""} aria-label="Link do catálogo" className={`${FIELD} flex-1 font-mono text-xs`} />
                  <button type="button" onClick={copiarLink} className={BUTTON_GREEN}>
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                    {copiado ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Trate este link como uma senha: quem tiver ele consegue ver os produtos e preços enviados.</p>
                <ol className="space-y-3 pt-1">
                  {PASSOS_META.map(({ texto, link }, indice) => (
                    <li key={texto} className="flex gap-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{indice + 1}</span>
                      <div>
                        {texto}
                        {link && (
                          <a href={link.url} target="_blank" rel="noreferrer" className="mt-2 flex h-9 w-fit items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/25 dark:text-emerald-300">
                            {link.rotulo} <ExternalLink size={13} aria-hidden />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="space-y-3 border-t border-black/[0.06] pt-6 dark:border-white/[0.08]">
                <h3 className="text-sm font-bold">Dados da loja</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} placeholder="Nome da loja" aria-label="Nome da loja" className={FIELD} />
                  <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="www.sualoja.com.br" aria-label="Site da loja" className={FIELD} />
                </div>
                <label className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={ocultarSemEstoque} onChange={(e) => setOcultarSemEstoque(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                  Tirar do catálogo os produtos sem estoque
                </label>
              </section>

              <section className="space-y-3 border-t border-black/[0.06] pt-6 dark:border-white/[0.08]">
                <h3 className="text-sm font-bold">Números da equipe</h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input value={novoSetor} onChange={(e) => setNovoSetor(e.target.value)} placeholder="Setor (ex: Televendas)" aria-label="Setor" className={`${FIELD} sm:col-span-2`} />
                  <input value={novoNumero} onChange={(e) => setNovoNumero(e.target.value)} placeholder="+55 62 99999-0000" aria-label="Número" className={`${FIELD} sm:col-span-2`} />
                  <button type="button" onClick={adicionarCanal} className={MUTED_BUTTON}>
                    <Plus size={16} /> Adicionar
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {canais.map((c) => (
                    <div key={c.numero} className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <PhoneCall size={15} className="text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold">{c.setor}</p>
                          <p className="text-xs text-zinc-500 tabular-nums">{formatarNumero(c.numero)}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setCanais(canais.filter((item) => item.numero !== c.numero))} aria-label={`Remover ${c.setor}`} className="text-zinc-400 hover:text-rose-500 p-1.5">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="px-7 py-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end gap-3">
              <button type="button" onClick={() => setModalConfigOpen(false)} className={MUTED_BUTTON}>Fechar</button>
              <button type="button" onClick={salvarConfiguracao} disabled={salvando} className={BUTTON_GREEN}>
                {salvando && <Loader2 size={16} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
