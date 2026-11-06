"use client";

import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getHubUrl, getHeaders } from "@/components/utils/api";
import {
  MessageCircle, Copy, CheckCircle2, RefreshCw, Settings2,
  Plus, Trash2, Check, Download, Loader2, X, Search, Package, PhoneCall
} from "lucide-react";
import toast from "react-hot-toast";

const CARD = "relative overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white/85 dark:bg-[#121214]/90 backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] transition-colors duration-300";
const PANEL = "bg-white/95 dark:bg-[#121214]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]";
const FIELD = "w-full h-11 px-4 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all";
const BUTTON_GREEN = "h-11 px-5 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_10px_24px_-8px_rgba(16,185,129,.55)] transition-all active:scale-95 disabled:opacity-60";
const MUTED_BUTTON = "h-11 px-4 rounded-full bg-black/[0.05] hover:bg-black/[0.08] dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95";

const formatarMoeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CatalogoWhatsappPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");

  // Estados da Configuração (Modal da Integração)
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [ocultarSemEstoque, setOcultarSemEstoque] = useState(false);
  const [canais, setCanais] = useState([
    { id: 1, setor: "Televendas", numero: "+55 62 99999-1111", status: "Conectado" },
    { id: 2, setor: "Representantes", numero: "+55 62 99999-2222", status: "Conectado" },
    { id: 3, setor: "Atendimento", numero: "+55 11 99999-3333", status: "Conectado" }
  ]);
  const [novoSetor, setNovoSetor] = useState("");
  const [novoNumero, setNovoNumero] = useState("");
  const [copiado, setCopiado] = useState(false);

  const obterTenantSeguro = () => {
    if (typeof window === "undefined") return "";
    try {
      const raw = localStorage.getItem("@raizan:user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u.tenant_id) return u.tenant_id;
        if (u.cnpj) return u.cnpj;
      }
    } catch (e) {}
    return localStorage.getItem("@raizan:tenant") || "";
  };

  const carregarResumo = useCallback(async () => {
    setLoading(true);
    try {
      const tenantId = obterTenantSeguro();
      const res = await fetch(`${getHubUrl()}/api/hub/catalogo-whatsapp/resumo`, {
        headers: { ...getHeaders(), "x-tenant-id": tenantId }
      });
      const data = await res.json();
      if (data.success) {
        setDados(data);
        if (data.config) {
          setOcultarSemEstoque(Boolean(data.config.ocultar_sem_estoque));
          if (Array.isArray(data.config.canais) && data.config.canais.length > 0) {
            setCanais(data.config.canais);
          }
        }
      } else {
        toast.error(data.message || "Erro ao carregar catálogo.");
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

  const linkAtivo = ocultarSemEstoque ? dados?.links?.apenas_em_estoque : dados?.links?.todos;

  const copiarLink = () => {
    if (!linkAtivo) return;
    navigator.clipboard.writeText(linkAtivo);
    setCopiado(true);
    toast.success("Link do Feed copiado!");
    setTimeout(() => setCopiado(false), 3000);
  };

  const adicionarCanal = () => {
    if (!novoSetor.trim() || !novoNumero.trim()) {
      return toast.error("Preencha o nome do setor e o número do WhatsApp.");
    }
    const novo = {
      id: Date.now(),
      setor: novoSetor.trim(),
      numero: novoNumero.trim(),
      status: "Conectado"
    };
    setCanais([...canais, novo]);
    setNovoSetor("");
    setNovoNumero("");
  };

  const removerCanal = (id) => {
    setCanais(canais.filter((c) => c.id !== id));
  };

  const salvarConfiguracao = async () => {
    setSalvando(true);
    try {
      const tenantId = obterTenantSeguro();
      const res = await fetch(`${getHubUrl()}/api/hub/catalogo-whatsapp/config`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          ocultar_sem_estoque: ocultarSemEstoque,
          canais
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Configurações do Catálogo WhatsApp salvas!");
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

  const produtosFiltrados = (dados?.preview || []).filter((p) =>
    (p.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        {/* Glow de fundo estilo Apple */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.07] blur-[130px]" />
        </div>

        <Header />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-5xl mx-auto space-y-6">

            {loading ? (
              <div className={`${CARD} min-h-[420px] flex items-center justify-center`}>
                <Loader2 size={32} className="animate-spin text-emerald-500" />
              </div>
            ) : (
              <>
                {/* ========================================================= */}
                {/* 🟢 PAINEL CENTRAL DE DISTRIBUIÇÃO COMERCIAL (SEU LAYOUT) */}
                {/* ========================================================= */}
                <div className={`${CARD} p-6 sm:p-8 space-y-8`}>
                  
                  {/* Topo: Ícone + Título + Botão de Configuração da Integração */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-[18px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(16,185,129,.65)]">
                        <MessageCircle size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight">Raizan Catálogo</h1>
                          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Operacional
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Central de distribuição comercial
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button onClick={carregarResumo} className={MUTED_BUTTON} title="Atualizar dados">
                        <RefreshCw size={16} />
                      </button>
                      <button onClick={() => setModalConfigOpen(true)} className={BUTTON_GREEN}>
                        <Settings2 size={17} /> Configurar Integração
                      </button>
                    </div>
                  </div>

                  {/* Grid 2x2 de Métricas Limpas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 pt-2">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Produtos no catálogo</p>
                      <p className="text-4xl font-bold tracking-tight mt-1.5 tabular-nums">
                        {Number(dados?.estatisticas?.em_estoque || 0).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                        Produtos sincronizados
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Números conectados</p>
                      <p className="text-4xl font-bold tracking-tight mt-1.5 tabular-nums">
                        {canais.length}
                      </p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                        {canais.length} {canais.length === 1 ? "canal ativo" : "canais ativos"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Última sincronização</p>
                      <p className="text-2xl font-bold tracking-tight mt-1.5">
                        {dados?.estatisticas?.ultima_sync_label || "Tempo real"}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Feed automático via ERP
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Produtos indisponíveis</p>
                      <p className="text-4xl font-bold tracking-tight mt-1.5 tabular-nums">
                        {Number(dados?.estatisticas?.sem_estoque || 0).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">
                        Sem estoque
                      </p>
                    </div>
                  </div>

                  {/* Seção: Distribuição do Catálogo (Multi-Números) */}
                  <div className="space-y-3 pt-2">
                    <h2 className="text-lg font-bold tracking-tight">Distribuição do catálogo</h2>

                    <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-5 sm:p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold">WhatsApp Business</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Ativo
                        </span>
                      </div>

                      <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                        {canais.map((canal) => (
                          <div key={canal.id} className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <MessageCircle size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-sm sm:text-base leading-tight">{canal.setor}</p>
                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 tabular-nums mt-0.5">
                                  {canal.numero}
                                </p>
                              </div>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              {canal.status || "Conectado"}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                        <span>Um catálogo compartilhado entre os canais</span>
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* ========================================================= */}
                {/* 📦 VITRINE DE PRODUTOS ATIVOS NO CATÁLOGO */}
                {/* ========================================================= */}
                <div className={`${CARD} overflow-hidden`}>
                  <div className="p-5 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base">Produtos Transmitidos para os Canais</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Itens sincronizados automaticamente com os números conectados</p>
                    </div>
                    <div className="relative sm:w-64">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar SKU ou produto..."
                        className={`${FIELD} pl-10 h-10`}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs font-semibold text-zinc-500 border-b border-black/[0.06] dark:border-white/[0.07]">
                        <tr>
                          <th className="px-5 py-3.5">Item</th>
                          <th className="px-5 py-3.5">SKU</th>
                          <th className="px-5 py-3.5">Marca</th>
                          <th className="px-5 py-3.5 text-right">Preço Catálogo</th>
                          <th className="px-5 py-3.5 text-center">Disponibilidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                        {produtosFiltrados.map((item) => (
                          <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="px-5 py-3 flex items-center gap-3">
                              <img src={item.imagem} alt={item.nome} className="w-10 h-10 rounded-xl object-cover border border-black/10 bg-white shrink-0" />
                              <span className="font-semibold line-clamp-1">{item.nome}</span>
                            </td>
                            <td className="px-5 py-3 font-mono text-xs text-zinc-500">{item.sku}</td>
                            <td className="px-5 py-3 text-zinc-500">{item.marca}</td>
                            <td className="px-5 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {formatarMoeda(item.preco)}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                item.disponivel
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-zinc-500/15 text-zinc-500"
                              }`}>
                                {item.disponivel ? `${item.estoque} em estoque` : "Sem estoque"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* ⚙️ MODAL DE CONFIGURAÇÃO DA INTEGRAÇÃO (TODA A PARTE TÉCNICA AQUI) */}
      {/* ========================================================= */}
      {modalConfigOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`${PANEL} rounded-[30px] w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
            <div className="px-7 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Configuração do Módulo WhatsApp Catálogo</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Gerencie o link de sincronização da Meta (WABA) e os números comerciais conectados.
                </p>
              </div>
              <button
                onClick={() => setModalConfigOpen(false)}
                className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-7 space-y-6 overflow-y-auto custom-scrollbar">
              {/* 1. Link do Feed Único */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    1. Link do Feed Dinâmico (Meta Commerce Manager)
                  </label>
                  {linkAtivo && (
                    <a href={linkAtivo} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1">
                      <Download size={13} /> Testar arquivo CSV
                    </a>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={linkAtivo || ""}
                    className={`${FIELD} flex-1 font-mono text-xs`}
                  />
                  <button type="button" onClick={copiarLink} className={BUTTON_GREEN}>
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                    {copiado ? "Copiado!" : "Copiar URL"}
                  </button>
                </div>
                <label className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ocultarSemEstoque}
                    onChange={(e) => setOcultarSemEstoque(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  Ocultar automaticamente produtos zerados (enviar apenas disponíveis em estoque)
                </label>
              </div>

              {/* 2. Cadastro de Múltiplos Números (Canais que compartilham o catálogo) */}
              <div className="space-y-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  2. Números de WhatsApp Conectados ao Catálogo
                </label>
                <p className="text-xs text-zinc-500">
                  No Gerenciador de Negócios da Meta (WhatsApp Manager), todos os números da mesma conta empresarial podem compartilhar este único catálogo simultaneamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    value={novoSetor}
                    onChange={(e) => setNovoSetor(e.target.value)}
                    placeholder="Setor (Ex: Televendas)"
                    className={`${FIELD} sm:col-span-2`}
                  />
                  <input
                    value={novoNumero}
                    onChange={(e) => setNovoNumero(e.target.value)}
                    placeholder="+55 62 99999-0000"
                    className={`${FIELD} sm:col-span-2`}
                  />
                  <button type="button" onClick={adicionarCanal} className={MUTED_BUTTON}>
                    <Plus size={16} /> Adicionar
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {canais.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <PhoneCall size={15} className="text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold">{c.setor}</p>
                          <p className="text-xs text-zinc-500 tabular-nums">{c.numero}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerCanal(c.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-7 py-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end gap-3">
              <button type="button" onClick={() => setModalConfigOpen(false)} className={MUTED_BUTTON}>
                Fechar
              </button>
              <button type="button" onClick={salvarConfiguracao} disabled={salvando} className={BUTTON_GREEN}>
                {salvando ? <Loader2 size={16} className="animate-spin" /> : null}
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}