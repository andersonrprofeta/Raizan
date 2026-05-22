"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Plug, Plus, Globe, Settings, Key, Link as LinkIcon, 
  CheckCircle2, RefreshCw, Loader2, Store, Fingerprint, Database,
  Server, Trash2, Pencil, AlertTriangle, CreditCard, Truck, LayoutTemplate
} from "lucide-react";
import toast from 'react-hot-toast';

export default function IntegracoesPage() {
  const [integracoesAtivas, setIntegracoesAtivas] = useState([]);
  const [oracleConfigurado, setOracleConfigurado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [instalando, setInstalando] = useState(null); 
  const [menuAberto, setMenuAberto] = useState(null); 
  
  const [integracaoParaDeletar, setIntegracaoParaDeletar] = useState(null); 

  const [formWoo, setFormWoo] = useState({
    nome_integracao: "Minha Loja WooCommerce",
    url_loja: "",
    consumer_key: "",
    consumer_secret: ""
  });

  const [formRaizan, setFormRaizan] = useState({
    nome_integracao: "Loja Oficial NUEV",
    url_loja: "https://nuev.com.br",
    tenant_id: "", 
    api_token: crypto.randomUUID() 
  });

  // 🟢 NOVO: ESTADO DO PORTAL B2B COM TENANT_ID INCLUSO
  const [formB2B, setFormB2B] = useState({
    url_loja: "https://portal.rafany.com.br",
    url_api_local: "https://api.rafany.com.br",
    tenant_id: "" // 🟢 Adicionado para a trava visual
  });

  const [formMP, setFormMP] = useState({
    nome_integracao: "Mercado Pago Oficial",
    access_token: "",
    public_key: "",
    disponivel_b2b: true,
    disponivel_raizan: false
  });

  const [formFrenet, setFormFrenet] = useState({
    nome_integracao: "Frenet Oficial",
    chave_frenet: "",
    senha_frenet: "",
    token_frenet: ""
  });

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        return JSON.parse(storedUser).tenant_id;
      }
    }
    return "";
  };

  useEffect(() => {
    const cnpj = pegarCnpjLogado();
    if (cnpj) {
      setFormRaizan(prev => ({ ...prev, tenant_id: cnpj }));
      setFormB2B(prev => ({ ...prev, tenant_id: cnpj })); // 🟢 Preenche o CNPJ visual no B2B
    }
    carregarIntegracoesEStatus();
  }, []);

  const carregarIntegracoesEStatus = async () => {
    const cnpj = pegarCnpjLogado();
    if (!cnpj) return;

    const cacheInt = localStorage.getItem(`@raizan:cache_integracoes_${cnpj}`);
    const cacheOracle = localStorage.getItem(`@raizan:cache_oracle_${cnpj}`);
    
    if (cacheInt) setIntegracoesAtivas(JSON.parse(cacheInt));
    if (cacheOracle) setOracleConfigurado(JSON.parse(cacheOracle));
    if (cacheInt || cacheOracle) setLoading(false); 

    try {
      const [resInt, resConf] = await Promise.all([
        fetch("https://api.raizan.com.br/api/hub/integracoes", { headers: { "x-tenant-id": cnpj } }),
        fetch("https://api.raizan.com.br/api/hub/configuracoes", { headers: { "x-tenant-id": cnpj } })
      ]);

      const dataInt = await resInt.json();
      const dataConf = await resConf.json();

      if (dataInt.success) {
        setIntegracoesAtivas(dataInt.integracoes);
        localStorage.setItem(`@raizan:cache_integracoes_${cnpj}`, JSON.stringify(dataInt.integracoes)); 
      }

      if (dataConf.success && dataConf.configuracoes?.oracle_host) {
        setOracleConfigurado(true);
        localStorage.setItem(`@raizan:cache_oracle_${cnpj}`, JSON.stringify(true)); 
      } else {
        setOracleConfigurado(false);
        localStorage.setItem(`@raizan:cache_oracle_${cnpj}`, JSON.stringify(false)); 
      }
    } catch (error) {
      console.log("Aviso: Falha ao sincronizar em background.");
    } finally {
      setLoading(false);
    }
  };

  const salvarFrenet = async (e) => {
    e.preventDefault();
    const cnpj = pegarCnpjLogado();
    const loadingToast = toast.loading("Configurando Frenet...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/frenet", {
        method: "POST", headers: { "Content-Type": "application/json", "x-tenant-id": cnpj },
        body: JSON.stringify(formFrenet)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Frenet configurada com sucesso!", { id: loadingToast });
        setInstalando(null); carregarIntegracoesEStatus(); 
      } else { toast.error(data.message || "Erro ao salvar credenciais.", { id: loadingToast }); }
    } catch (error) { toast.error("Erro de conexão.", { id: loadingToast }); }
  };

  const salvarWooCommerce = async (e) => {
    e.preventDefault();
    const cnpj = pegarCnpjLogado();
    const loadingToast = toast.loading("Conectando ao WooCommerce...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/woocommerce", {
        method: "POST", headers: { "Content-Type": "application/json", "x-tenant-id": cnpj },
        body: JSON.stringify(formWoo)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: loadingToast });
        setInstalando(null); carregarIntegracoesEStatus(); 
      } else { toast.error(data.message, { id: loadingToast }); }
    } catch (error) { toast.error("Erro de conexão.", { id: loadingToast }); }
  };

  const salvarRaizanCommerce = async (e) => {
    e.preventDefault();
    const cnpj = pegarCnpjLogado();
    const loadingToast = toast.loading("Registrando Loja Nativa...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/raizan", {
        method: "POST", headers: { "Content-Type": "application/json", "x-tenant-id": cnpj },
        body: JSON.stringify(formRaizan)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Raizan Commerce conectado com sucesso!", { id: loadingToast });
        setInstalando(null); carregarIntegracoesEStatus(); 
      } else { toast.error(data.message || "Erro ao registrar loja.", { id: loadingToast }); }
    } catch (error) { toast.error("Erro de conexão com o Hub.", { id: loadingToast }); }
  };

  const salvarPortalB2B = async (e) => {
    e.preventDefault();
    const cnpj = pegarCnpjLogado();
    const loadingToast = toast.loading("Instalando Portal B2B...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/b2b", {
        method: "POST", headers: { "Content-Type": "application/json", "x-tenant-id": cnpj },
        body: JSON.stringify(formB2B)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Portal B2B ativado com sucesso!", { id: loadingToast });
        setInstalando(null); carregarIntegracoesEStatus(); 
      } else { toast.error(data.message || "Erro ao instalar portal.", { id: loadingToast }); }
    } catch (error) { toast.error("Erro de conexão com o Hub.", { id: loadingToast }); }
  };

  const salvarMercadoPago = async (e) => {
    e.preventDefault();
    const cnpj = pegarCnpjLogado();
    const loadingToast = toast.loading("Configurando Mercado Pago...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/mercadopago", {
        method: "POST", headers: { "Content-Type": "application/json", "x-tenant-id": cnpj },
        body: JSON.stringify(formMP)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Mercado Pago configurado com sucesso!", { id: loadingToast });
        setInstalando(null); carregarIntegracoesEStatus(); 
      } else { toast.error(data.message || "Erro ao salvar credenciais.", { id: loadingToast }); }
    } catch (error) { toast.error("Erro de conexão com a Nuvem Raizan.", { id: loadingToast }); }
  };

  const sincronizarDadosDaLoja = async (idIntegracao) => {
    const cnpj = pegarCnpjLogado();
    setSincronizando(idIntegracao);
    const toastId = toast.loading("Buscando dados da loja...");
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes/sync/${idIntegracao}`, {
        method: "POST", headers: { "x-tenant-id": cnpj } 
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sucesso! Dados sincronizados.`, { id: toastId, duration: 5000 });
      } else { toast.error(data.message || "Falha ao sincronizar.", { id: toastId }); }
    } catch (error) { toast.error("Erro ao comunicar com o servidor.", { id: toastId }); } 
    finally { setSincronizando(null); }
  };

  const confirmarExclusao = async () => {
    if (!integracaoParaDeletar) return;
    const cnpj = pegarCnpjLogado();
    const id = integracaoParaDeletar.id;
    const toastId = toast.loading("Excluindo integração...");
    
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes/${id}`, {
        method: "DELETE", headers: { "x-tenant-id": cnpj }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Integração removida com sucesso!", { id: toastId });
        carregarIntegracoesEStatus(); 
      } else { toast.error(data.message || "Erro ao excluir.", { id: toastId }); }
    } catch (error) { toast.error("Erro ao comunicar com o servidor.", { id: toastId }); } 
    finally { setIntegracaoParaDeletar(null); }
  };

  const editarIntegracao = (int) => {
    toast("A tela de edição será liberada na próxima atualização!", { icon: '🚧' });
    setMenuAberto(null);
  };

  const getPlataformaIcon = (plataforma) => {
    const imgClass = "h-12 w-auto max-w-[140px] object-contain drop-shadow-sm";
    if (plataforma === 'woocommerce') return <img src="/woocommerce.svg" className={imgClass} />;
    if (plataforma === 'raizan_commerce') return <img src="/RaizanCommerce.png" className={imgClass} />;
    if (plataforma === 'mercadopago') return <img src="/Mercadopago.svg" className={imgClass} />;
    if (plataforma === 'frenet') return <img src="/Frenet.svg" className={imgClass} />;
    if (plataforma === 'shopify') return <img src="/shopify.svg" className={imgClass} />;
    if (plataforma === 'mercadolivre') return <img src="/mercadolibre.svg" className={imgClass} />;
    if (plataforma === 'shopee') return <img src="/shopee.svg" className={imgClass} />;
    if (plataforma === 'oracle') return <img src="/oracle.svg" className={imgClass} />;
    if (plataforma === 'portal_b2b') return <Globe size={48} className="text-indigo-500 drop-shadow-sm" />; 
    return <Store size={48} className="text-zinc-300 dark:text-zinc-700 drop-shadow-sm" />;
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" onClick={() => setMenuAberto(null)}>
          <div className="max-w-[1200px] mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden gap-4">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
                  <Plug size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Minhas Integrações</h1>
                  <p className="text-sm font-medium text-zinc-500 mt-1">Conecte o Raizan Hub com suas frentes de loja e ERP.</p>
                </div>
              </div>
              
              {!instalando && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setInstalando('catalogo'); }}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all z-10 active:scale-95"
                >
                  <Plus size={18} /> Nova Integração
                </button>
              )}
            </div>

            {loading && integracoesAtivas.length === 0 && !oracleConfigurado ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={40} className="animate-spin text-purple-600 mb-4" />
                <p className="text-zinc-500 font-bold tracking-widest text-sm uppercase">Carregando integrações...</p>
              </div>
            ) : (
              <>
                {!instalando && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                    
                    <div onClick={(e) => { e.stopPropagation(); setInstalando('catalogo'); }} className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors min-h-[220px]">
                      <Plus size={32} className="text-zinc-400 mb-2" />
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">Nova Integração</p>
                      <p className="text-xs font-medium text-zinc-500 mt-1">Ver plataformas disponíveis</p>
                    </div>

                    {oracleConfigurado && (
                      <div className="bg-white dark:bg-[#121214] border border-red-200 dark:border-red-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all min-h-[220px] relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
                        
                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex items-center justify-center">
                            <img src="/oracle.svg" alt="Oracle" className="h-10 w-auto max-w-[140px] object-contain drop-shadow-sm" />
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                            <CheckCircle2 size={12} /> Ativo
                          </span>
                        </div>

                        <div className="mt-4 mb-5 relative z-10">
                          <h3 className="font-bold text-lg truncate text-zinc-900 dark:text-zinc-100">Oracle Database</h3>
                          <p className="text-xs font-medium text-zinc-500 mt-1 truncate flex items-center gap-1.5"><Database size={12}/> Motor Local Vinculado</p>
                        </div>
                        
                        <div className="flex w-full mt-auto relative z-10">
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.location.href = '/configuracoes'; }}
                            className="w-full py-2.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-bold rounded-xl text-xs hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-500/30"
                          >
                            <Settings size={14} /> Ajustar Conexão
                          </button>
                        </div>
                      </div>
                    )}

                    {integracoesAtivas.map(int => (
                      <div key={int.id} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all min-h-[220px] relative group">
                        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
                          {int.plataforma === 'raizan_commerce' && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />}
                          {int.plataforma === 'mercadopago' && <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />}
                          {int.plataforma === 'portal_b2b' && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />}
                        </div>
                        
                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex items-center justify-center">
                            {getPlataformaIcon(int.plataforma)}
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                            <CheckCircle2 size={12} /> Ativo
                          </span>
                        </div>

                        <div className="mt-4 mb-5 relative z-10">
                          <h3 className="font-bold text-lg truncate text-zinc-900 dark:text-zinc-100" title={int.nome_integracao}>{int.nome_integracao}</h3>
                          <p className="text-xs font-medium text-zinc-500 mt-1 truncate flex items-center gap-1.5"><Globe size={12}/> {int.url_loja || 'Módulo Interno'}</p>
                        </div>
                        
                        <div className="flex gap-2 w-full mt-auto relative z-10">
                          {int.plataforma !== 'mercadopago' && int.plataforma !== 'portal_b2b' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); sincronizarDadosDaLoja(int.id); }}
                              disabled={sincronizando === int.id}
                              className="flex-1 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                            >
                              {sincronizando === int.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                              Sync Manual
                            </button>
                          )}
                          
                          <div className={`relative ${int.plataforma === 'mercadopago' || int.plataforma === 'portal_b2b' ? 'w-full' : ''}`}>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setMenuAberto(menuAberto === int.id ? null : int.id); 
                              }}
                              className={`${int.plataforma === 'mercadopago' || int.plataforma === 'portal_b2b' ? 'w-full px-4' : 'px-4'} py-2.5 font-bold rounded-xl text-xs transition-colors flex items-center justify-center border ${menuAberto === int.id ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                              <Settings size={16} /> {(int.plataforma === 'mercadopago' || int.plataforma === 'portal_b2b') && <span className="ml-2">Configurações</span>}
                            </button>

                            {menuAberto === int.id && (
                              <div 
                                className={`absolute bottom-full mb-2 w-40 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 ${int.plataforma === 'mercadopago' || int.plataforma === 'portal_b2b' ? 'left-1/2 -translate-x-1/2' : 'right-0'}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button onClick={() => editarIntegracao(int)} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50">
                                  <Pencil size={14} /> Editar
                                </button>
                                <button onClick={() => { setIntegracaoParaDeletar(int); setMenuAberto(null); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                  <Trash2 size={14} /> Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {instalando === 'catalogo' && (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 shadow-sm">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                      <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Catálogo de Aplicativos</h2>
                        <p className="text-sm font-medium text-zinc-500 mt-1">Selecione a plataforma para iniciar a configuração.</p>
                      </div>
                      <button onClick={() => setInstalando(null)} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg transition-colors">Cancelar</button>
                    </div>
                    
                    <div className="space-y-10">
                      
                      {/* CATEGORIA 1: E-COMMERCE E MARKETPLACES */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Store size={16} /> E-commerce & Portais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          <div className="border-2 border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-900/10 dark:to-[#0c0c0e] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider z-10">Nativo</div>
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-purple-100 dark:border-purple-500/20 group-hover:scale-110 transition-transform">
                              <img src="/RaizanCommerce.png" alt="Raizan" className="w-10 h-10 object-contain drop-shadow-sm" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Raizan Commerce</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Headless Store de altíssima performance.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('raizan'); }} className="w-full py-2.5 bg-purple-600 rounded-xl text-sm font-bold text-white hover:bg-purple-500 shadow-md shadow-purple-500/20 transition-all">Ativar Módulo</button>
                          </div>

                          <div className="border-2 border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-[#0c0c0e] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider z-10">Nativo</div>
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform">
                              <Globe size={32} className="text-indigo-500 drop-shadow-sm" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Portal B2B</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Seu portal de vendas exclusivo para lojistas.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('b2b'); }} className="w-full py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all">Configurar</button>
                          </div>

                          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-[#121214] group">
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                              <img src="/woocommerce.svg" alt="Woo" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">WooCommerce</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Sincronização de catálogo e pedidos WP.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('woocommerce'); }} className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Conectar</button>
                          </div>

                          {['shopify', 'mercadolibre', 'shopee'].map(plataforma => (
                            <div key={plataforma} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center opacity-50 grayscale cursor-not-allowed bg-zinc-50/50 dark:bg-zinc-900/10">
                              <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
                                <img src={`/${plataforma}.svg`} alt={plataforma} className="w-10 h-10 object-contain" />
                              </div>
                              <h3 className="font-bold text-base mb-1 capitalize">{plataforma.replace('mercadolibre', 'Mercado Livre')}</h3>
                              <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Integração em desenvolvimento.</p>
                              <span className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 uppercase tracking-widest">Em Breve</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CATEGORIA 2: PAGAMENTOS */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
                          <CreditCard size={16} /> Meios de Pagamento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          <div className="border border-sky-200 dark:border-sky-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-sky-500 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-b from-sky-50/50 to-white dark:from-sky-900/10 dark:to-[#0c0c0e] group relative overflow-hidden">
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-sky-100 dark:border-sky-500/20 group-hover:scale-110 transition-transform">
                              <img src="/Mercadopago.svg" alt="Mercado Pago" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Mercado Pago</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Pix, Cartões e Boleto Transparente.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('mercadopago'); }} className="w-full py-2.5 bg-sky-600 rounded-xl text-sm font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-500/20 transition-all">Configurar</button>
                          </div>

                        </div>
                      </div>

                      {/* CATEGORIA: LOGÍSTICA E FRETE */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
                          <Truck size={16} /> Logística e Frete
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="border border-orange-200 dark:border-orange-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-900/10 dark:to-[#0c0c0e] group relative overflow-hidden">
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-500/20 group-hover:scale-110 transition-transform">
                              <img src="/Frenet.svg" alt="Frenet" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Frenet</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Cálculo de fretes e transportadoras.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('frenet'); }} className="w-full py-2.5 bg-orange-500 rounded-xl text-sm font-bold text-white hover:bg-orange-400 shadow-md shadow-orange-500/20 transition-all">Configurar</button>
                          </div>
                        </div>
                      </div>

                      {/* CATEGORIA 3: ERP E BANCOS DE DADOS */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
                          <Server size={16} /> Bancos de Dados & ERPs
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          <div className={`border ${oracleConfigurado ? 'border-red-200 dark:border-red-500/40 bg-red-50/30 dark:bg-red-900/10' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214]'} rounded-2xl p-5 flex flex-col items-center text-center hover:border-red-50 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden`}>
                            {oracleConfigurado && (
                              <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider z-10">Conectado</div>
                            )}
                            <div className={`w-16 h-16 shadow-sm rounded-2xl flex items-center justify-center mb-4 border group-hover:scale-110 transition-transform ${oracleConfigurado ? 'bg-white dark:bg-zinc-900 border-red-200 dark:border-red-500/30' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                              <img src="/oracle.svg" alt="Oracle" className="w-12 h-12 object-contain" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Oracle Database</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">{oracleConfigurado ? 'Sincronização bidirecional ativa.' : 'Sincronização bidirecional do ERP.'}</p>
                            <button onClick={(e) => { e.stopPropagation(); toast("Acesse o menu Configurações para ajustar os parâmetros do Oracle.", { icon: '⚙️' }); }} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${oracleConfigurado ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20' : 'bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-500/20'}`}>Ajustar Conexão</button>
                          </div>

                          {['microsoft-sql', 'mysql'].map(db => (
                            <div key={db} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center opacity-50 grayscale cursor-not-allowed bg-zinc-50/50 dark:bg-zinc-900/10">
                              <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
                                <img src={`/${db}.svg`} alt={db} className="w-10 h-10 object-contain" />
                              </div>
                              <h3 className="font-bold text-base mb-1">{db === 'mysql' ? 'MySQL' : 'SQL Server'}</h3>
                              <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Driver de banco de dados.</p>
                              <span className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 uppercase tracking-widest">Em Breve</span>
                            </div>
                          ))}

                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 🟢 NOVO FORMULÁRIO WOOCOMMERCE */}
                {instalando === 'woocommerce' && (
                  <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700/50 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-zinc-500/5 overflow-hidden">
                    <div className="p-8 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/30">
                          <img src="/woocommerce.svg" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">WooCommerce</h2>
                          <p className="text-sm text-zinc-500 font-medium mt-1">Conecte sua loja virtual WordPress.</p>
                        </div>
                      </div>
                      <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
                    </div>

                    <div className="p-8 max-w-3xl">
                      <form onSubmit={salvarWooCommerce} className="space-y-6">
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                            <Store size={14} className="text-zinc-500"/> Apelido da Loja
                          </label>
                          <input type="text" required value={formWoo.nome_integracao} onChange={e => setFormWoo({...formWoo, nome_integracao: e.target.value})} placeholder="Ex: Filial São Paulo, Varejo Matriz..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                          <p className="text-xs font-medium text-zinc-500 mt-1">Isso ajudará você a identificar esta loja no painel.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                            <Globe size={14} className="text-zinc-500"/> URL do Site
                          </label>
                          <input type="url" required value={formWoo.url_loja} onChange={e => setFormWoo({...formWoo, url_loja: e.target.value})} placeholder="https://www.sualoja.com.br" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Key size={14} className="text-zinc-500"/> Consumer Key
                            </label>
                            <input type="text" required value={formWoo.consumer_key} onChange={e => setFormWoo({...formWoo, consumer_key: e.target.value})} placeholder="ck_1234567890abcdef..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-purple-500 transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Key size={14} className="text-zinc-500"/> Consumer Secret
                            </label>
                            <input type="password" required value={formWoo.consumer_secret} onChange={e => setFormWoo({...formWoo, consumer_secret: e.target.value})} placeholder="cs_1234567890abcdef..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-purple-500 transition-all" />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
                          <button type="submit" className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[0.98]">
                            <LinkIcon size={18} /> Conectar WooCommerce
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                  {/* FORMULÁRIO RAIZAN COMMERCE */}
                {instalando === 'raizan' && (
                  <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-purple-200 dark:border-purple-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-purple-500/5 overflow-hidden">
                    <div className="p-8 border-b border-purple-100 dark:border-purple-500/20 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-500/30">
                          <img src="/RaizanCommerce.png" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100 tracking-tight">Raizan Commerce</h2>
                          <p className="text-sm text-purple-600/80 dark:text-purple-400/80 font-medium mt-1">Conecte sua Headless Store de alta performance.</p>
                        </div>
                      </div>
                      <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
                    </div>

                    <div className="p-8 max-w-3xl">
                      <form onSubmit={salvarRaizanCommerce} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Store size={14} className="text-purple-500"/> Apelido da Loja
                            </label>
                            <input type="text" required value={formRaizan.nome_integracao} onChange={e => setFormRaizan({...formRaizan, nome_integracao: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Globe size={14} className="text-purple-500"/> URL da Loja (Site Oficial)
                            </label>
                            <input type="url" required value={formRaizan.url_loja} onChange={e => setFormRaizan({...formRaizan, url_loja: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                          </div>
                        </div>

                        {/* 🟢 TRAVA DE SEGURANÇA E TOKENS */}
                        <div className="p-6 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-2xl space-y-5 relative overflow-hidden mt-6">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Fingerprint size={80}/></div>
                          <h3 className="text-sm font-black text-purple-900 dark:text-purple-300 flex items-center gap-2 relative z-10"><Fingerprint size={16} /> Identidade do Módulo</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">CNPJ Vinculado (Tenant ID)</label>
                              <input type="text" readOnly value={formRaizan.tenant_id} className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/30 p-3 rounded-xl font-mono font-bold text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Token da API Automático</label>
                              <input type="text" readOnly value={formRaizan.api_token} className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/30 p-3 rounded-xl font-mono font-bold text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" />
                            </div>
                          </div>
                          <p className="text-xs font-medium text-zinc-500 mt-1 relative z-10">A loja vai ler seu catálogo de produtos e estoque unificado através destas credenciais.</p>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
                          <button type="submit" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95">
                            <Globe size={18} /> Ativar Raizan Commerce
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}


                {/* FORMULÁRIO PORTAL B2B COM TRAVA VISUAL */}
                {instalando === 'b2b' && (
                  <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-indigo-200 dark:border-indigo-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                    <div className="p-8 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-500/30">
                          <Globe className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">Portal B2B Nativo</h2>
                          <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 font-medium mt-1">Habilite o portal e integre com seu Motor Local.</p>
                        </div>
                      </div>
                      <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
                    </div>

                    <div className="p-8 max-w-3xl">
                      <form onSubmit={salvarPortalB2B} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <LayoutTemplate size={14} className="text-indigo-500"/> URL do Portal (Acesso Lojista)
                            </label>
                            <input type="url" required value={formB2B.url_loja} onChange={e => setFormB2B({...formB2B, url_loja: e.target.value})} placeholder="https://portal.suaempresa.com.br" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Server size={14} className="text-indigo-500"/> URL da API Local (Túnel Cloudflare)
                            </label>
                            <input type="url" required value={formB2B.url_api_local} onChange={e => setFormB2B({...formB2B, url_api_local: e.target.value})} placeholder="https://api.suaempresa.com.br" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                            <p className="text-xs font-medium text-zinc-500 mt-1">A Nuvem usará este endereço para consultar o Oracle.</p>
                          </div>
                        </div>

                        {/* 🟢 TRAVA DE SEGURANÇA */}
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl space-y-5 relative overflow-hidden mt-6">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Fingerprint size={80}/></div>
                          <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-2 relative z-10"><Fingerprint size={16} /> Identidade do Módulo</h3>
                          <div className="space-y-2 relative z-10">
                            <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">CNPJ Vinculado (Tenant ID)</label>
                            <input type="text" readOnly value={formB2B.tenant_id} className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-500/30 p-3 rounded-xl font-mono font-bold text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" />
                            <p className="text-xs font-medium text-zinc-500 mt-1">As requisições deste portal responderão exclusivamente por este CNPJ.</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
                          <button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                            <Globe size={18} /> Salvar e Ativar Portal B2B
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* FORMULÁRIO MERCADO PAGO */}
                {instalando === 'mercadopago' && (
                  <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-sky-200 dark:border-sky-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-sky-500/5 overflow-hidden">
                    <div className="p-8 border-b border-sky-100 dark:border-sky-500/20 flex items-center justify-between bg-sky-50/50 dark:bg-sky-900/10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-sky-100 dark:border-sky-500/30">
                          <img src="/Mercadopago.svg" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-sky-900 dark:text-sky-100 tracking-tight">Mercado Pago</h2>
                          <p className="text-sm text-sky-600/80 dark:text-sky-400/80 font-medium mt-1">Configuração de checkout transparente.</p>
                        </div>
                      </div>
                      <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
                    </div>

                    <div className="p-8 max-w-3xl">
                      <form onSubmit={salvarMercadoPago} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Identificação Interna</label>
                          <input type="text" required value={formMP.nome_integracao} onChange={e => setFormMP({...formMP, nome_integracao: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium transition-all" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Access Token (Produção)</label>
                            <input type="password" required value={formMP.access_token} onChange={e => setFormMP({...formMP, access_token: e.target.value})} placeholder="APP_USR-..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-sky-500 transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Public Key (Produção)</label>
                            <input type="text" required value={formMP.public_key} onChange={e => setFormMP({...formMP, public_key: e.target.value})} placeholder="APP_USR-..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-sky-500 transition-all" />
                          </div>
                        </div>

                        <div className="pt-6 pb-2">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Disponibilizar este meio de pagamento em:</h3>
                          <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formMP.disponivel_b2b ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'}`}>
                                {formMP.disponivel_b2b && <CheckCircle2 size={14} />}
                              </div>
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Portal B2B (Lojistas)</span>
                              <input type="checkbox" className="hidden" checked={formMP.disponivel_b2b} onChange={(e) => setFormMP({...formMP, disponivel_b2b: e.target.checked})} />
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formMP.disponivel_raizan ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'}`}>
                                {formMP.disponivel_raizan && <CheckCircle2 size={14} />}
                              </div>
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Raizan Commerce (Varejo)</span>
                              <input type="checkbox" className="hidden" checked={formMP.disponivel_raizan} onChange={(e) => setFormMP({...formMP, disponivel_raizan: e.target.checked})} />
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <button type="submit" className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95">
                            <CreditCard size={18} /> Salvar e Ativar Módulo
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* FORMULÁRIO FRENET */}
                {instalando === 'frenet' && (
                  <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-orange-200 dark:border-orange-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-orange-500/5 overflow-hidden">
                    <div className="p-8 border-b border-orange-100 dark:border-orange-500/20 flex items-center justify-between bg-orange-50/50 dark:bg-orange-900/10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-500/30">
                          <img src="/Frenet.svg" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-orange-900 dark:text-orange-100 tracking-tight">Frenet Logística</h2>
                          <p className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium mt-1">Cálculo de frete no checkout do portal.</p>
                        </div>
                      </div>
                      <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
                    </div>

                    <div className="p-8 max-w-3xl">
                      <form onSubmit={salvarFrenet} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Identificação Interna</label>
                          <input type="text" required value={formFrenet.nome_integracao} onChange={e => setFormFrenet({...formFrenet, nome_integracao: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium transition-all" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Chave (E-mail)</label>
                            <input type="text" required value={formFrenet.chave_frenet} onChange={e => setFormFrenet({...formFrenet, chave_frenet: e.target.value})} placeholder="mkt@rafany.com.br" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl text-sm outline-none focus:border-orange-500 transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Senha</label>
                            <input type="password" required value={formFrenet.senha_frenet} onChange={e => setFormFrenet({...formFrenet, senha_frenet: e.target.value})} placeholder="vZ3yi+RoZ..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-orange-500 transition-all" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Token</label>
                          <input type="text" required value={formFrenet.token_frenet} onChange={e => setFormFrenet({...formFrenet, token_frenet: e.target.value})} placeholder="26F6D137R95BER..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-orange-500 transition-all" />
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
                          <button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95">
                            <Truck size={18} /> Salvar e Ativar Transportadoras
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </>
            )}

          </div>
        </main>
      </div>

      {/* MODAL DE EXCLUSÃO CUSTOMIZADO */}
      {integracaoParaDeletar && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIntegracaoParaDeletar(null)} 
        >
          <div 
            className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5 border border-red-100 dark:border-red-500/20">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
            </div>
            
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Excluir Integração</h2>
            
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Tem certeza que deseja desconectar e excluir a integração <b className="text-zinc-700 dark:text-zinc-300">{integracaoParaDeletar.nome_integracao}</b>? Esta ação não poderá ser desfeita.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIntegracaoParaDeletar(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-500/20 transition-all active:scale-95"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}