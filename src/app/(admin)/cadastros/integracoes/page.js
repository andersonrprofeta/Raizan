"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Plug, Plus, Globe, Settings, Pencil, Trash2, 
  CheckCircle2, RefreshCw, Loader2, Store, Database,
  Server, AlertTriangle, CreditCard, Truck, LayoutTemplate
} from "lucide-react";
import toast from 'react-hot-toast';

// 🟢 IMPORTAÇÃO DOS COMPONENTES ISOLADOS
import FormWooCommerce from "@/components/integracoes/FormWooCommerce";
import FormRaizanCommerce from "@/components/integracoes/FormRaizanCommerce";
import FormPortalB2B from "@/components/integracoes/FormPortalB2B";
import FormMercadoPago from "@/components/integracoes/FormMercadoPago";
import FormFrenet from "@/components/integracoes/FormFrenet";
import FormOmie from "@/components/integracoes/FormOmie";
import FormTiny from "@/components/integracoes/FormTiny"; 
import EditarOmie from "@/components/integracoes/EditarOmie"; 

export default function IntegracoesPage() {
  const [integracoesAtivas, setIntegracoesAtivas] = useState([]);
  const [oracleConfigurado, setOracleConfigurado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [instalando, setInstalando] = useState(null); 
  const [menuAberto, setMenuAberto] = useState(null); 
  const [integracaoParaDeletar, setIntegracaoParaDeletar] = useState(null); 
  
  // 🟢 ESTADO PARA CONTROLAR A EDIÇÃO
  const [editandoInt, setEditandoInt] = useState(null); 

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

  useEffect(() => {
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

  const [passosSync, setPassosSync] = useState([]);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 🟢 NOVA FUNÇÃO PREMIUM DE SINCRONIZAÇÃO (COM O CARROSSEL COMPLETO)
  const sincronizarDadosDaLoja = async (idIntegracao) => {
    const cnpj = pegarCnpjLogado();
    setSincronizando(idIntegracao);
    setIsSyncModalOpen(true);

    // Passo 1 inicial (Mostrando já as pendentes!)
    setPassosSync([
      { id: 1, texto: "Mapeando Vendedores...", status: "loading" },
      { id: 2, texto: "Sincronizando Clientes e Títulos em Aberto...", status: "pending" },
      { id: 3, texto: "Carregando Catálogo de Produtos e Preços...", status: "pending" },
      { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "pending" },
    ]);

    // Animação progressiva das etapas no ecrã
    let estagio = 1;
    const temporizadorEtapas = setInterval(() => {
      estagio++;
      if (estagio === 2) {
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Sincronizando Clientes e Títulos em Aberto...", status: "loading" },
          { id: 3, texto: "Carregando Catálogo de Produtos e Preços...", status: "pending" },
          { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "pending" },
        ]);
      } else if (estagio === 3) {
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Clientes e Títulos Atualizados", status: "done" },
          { id: 3, texto: "Carregando Catálogo de Produtos e Preços...", status: "loading" },
          { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "pending" },
        ]);
      } else if (estagio === 4) {
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Clientes e Títulos Atualizados", status: "done" },
          { id: 3, texto: "Produtos e Fotos Atualizados", status: "done" },
          { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "loading" },
        ]);
      }
    }, 2800);

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes/sync/${idIntegracao}`, {
        method: "POST", headers: { "x-tenant-id": cnpj } 
      });
      const data = await res.json();
      
      clearInterval(temporizadorEtapas);

      if (data.success) {
        // Marca todas as etapas como concluídas com sucesso!
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Clientes e Títulos Atualizados", status: "done" },
          { id: 3, texto: "Produtos e Fotos Atualizados", status: "done" },
          { id: 4, texto: "Saldos de Estoque Reais Gravados", status: "done" },
          { id: 5, texto: "Sincronização Finalizada!", status: "done" },
        ]);

        toast.success("Carga realizada com sucesso!");
        setTimeout(() => setIsSyncModalOpen(false), 3000);
      } else {
        // Mostra o erro no último passo caso falhe
        setPassosSync(prev => {
          const comErro = [...prev];
          const indiceLoading = comErro.findIndex(p => p.status === 'loading');
          if (indiceLoading !== -1) comErro[indiceLoading].status = 'error';
          return [...comErro, { id: 99, texto: data.message || "Erro na sincronização.", status: "error" }];
        });
        toast.error(data.message || "Erro na sincronização.");
        setTimeout(() => setIsSyncModalOpen(false), 4000);
      }
    } catch (error) {
      clearInterval(temporizadorEtapas);
      setPassosSync(prev => [
        ...prev.map(p => p.status === 'loading' ? { ...p, status: 'error' } : p),
        { id: 99, texto: "Erro crítico ao comunicar com o servidor.", status: "error" }
      ]);
      toast.error("Falha ao comunicar com o servidor.");
      setTimeout(() => setIsSyncModalOpen(false), 4000);
    } finally {
      setSincronizando(null);
    }
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
    if (int.plataforma === 'omie') {
      setEditandoInt(int); 
    } else {
      toast("A tela de edição será liberada na próxima atualização!", { icon: '🚧' });
    }
    setMenuAberto(null);
  };

  const getPlataformaIcon = (plataforma) => {
    const imgClass = "h-14 w-auto max-w-[150px] object-contain drop-shadow-sm transition-transform hover:scale-105";
    const frenetClass = `${imgClass} brightness-0 dark:brightness-100`; 

    if (plataforma === 'woocommerce') return <img src="/woocommerce.svg" alt="WooCommerce" className={imgClass} />;
    if (plataforma === 'raizan_commerce') return <img src="/RaizanCommerce.png" alt="Raizan" className={imgClass} />;
    if (plataforma === 'mercadopago') return <img src="/Mercadopago.svg" alt="Mercado Pago" className={imgClass} />;
    if (plataforma === 'frenet') return <img src="/Frenet.svg" alt="Frenet" className={frenetClass} />;
    if (plataforma === 'shopify') return <img src="/shopify.svg" alt="Shopify" className={imgClass} />;
    if (plataforma === 'mercadolivre') return <img src="/mercadolibre.svg" alt="Mercado Livre" className={imgClass} />;
    if (plataforma === 'shopee') return <img src="/shopee.svg" alt="Shopee" className={imgClass} />;
    if (plataforma === 'oracle') return <img src="/oracle.svg" alt="Oracle" className={imgClass} />;
    if (plataforma === 'portal_b2b') return <Globe size={48} className="text-indigo-500 drop-shadow-sm transition-transform hover:scale-105" />; 
    if (plataforma === 'omie') return <img src="/omie.png" alt="Omie" className={imgClass} />;
    if (plataforma === 'tiny') return <img src="/olist.svg" alt="Tiny" className={imgClass} />;
    
    return <Store size={48} className="text-zinc-300 dark:text-zinc-700 drop-shadow-sm" />;
  };

  const handleSuccess = () => {
    setInstalando(null);
    setEditandoInt(null);
    carregarIntegracoesEStatus();
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" onClick={() => setMenuAberto(null)}>
          <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* HEADER DA PÁGINA */}
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
                {/* LISTAGEM DAS INTEGRAÇÕES ATIVAS */}
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

                {/* O CATÁLOGO MESTRE DE APPs */}
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
                      
                      {/* E-COMMERCE */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Store size={16} /> E-commerce & Portais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          <div className="border-2 border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-900/10 dark:to-[#0c0c0e] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider z-10">Nativo</div>
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-purple-100 dark:border-purple-500/20 group-hover:scale-110 transition-transform">
                              <img src="/RaizanCommerce.png" alt="Raizan" className="w-12 h-12 object-contain drop-shadow-sm" />
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
                              <img src="/woocommerce.svg" alt="Woo" className="w-12 h-12 object-contain" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">WooCommerce</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Sincronização de catálogo e pedidos WP.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('woocommerce'); }} className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Conectar</button>
                          </div>

                          {['shopify', 'mercadolivre', 'shopee'].map(plataforma => (
                            <div key={plataforma} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center opacity-50 grayscale cursor-not-allowed bg-zinc-50/50 dark:bg-zinc-900/10">
                              <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
                                <img src={`/${plataforma}.svg`} alt={plataforma} className="w-12 h-12 object-contain" />
                              </div>
                              <h3 className="font-bold text-base mb-1 capitalize">{plataforma.replace('mercadolivre', 'Mercado Livre')}</h3>
                              <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Integração em desenvolvimento.</p>
                              <span className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 uppercase tracking-widest">Em Breve</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PAGAMENTOS */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
                          <CreditCard size={16} /> Meios de Pagamento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          <div className="border border-sky-200 dark:border-sky-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-sky-500 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-b from-sky-50/50 to-white dark:from-sky-900/10 dark:to-[#0c0c0e] group relative overflow-hidden">
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-sky-100 dark:border-sky-500/20 group-hover:scale-110 transition-transform">
                              <img src="/Mercadopago.svg" alt="Mercado Pago" className="w-12 h-12 object-contain" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Mercado Pago</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Pix, Cartões e Boleto Transparente.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('mercadopago'); }} className="w-full py-2.5 bg-sky-600 rounded-xl text-sm font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-500/20 transition-all">Configurar</button>
                          </div>

                        </div>
                      </div>

                      {/* LOGÍSTICA E FRETE */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
                          <Truck size={16} /> Logística e Frete
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="border border-orange-200 dark:border-orange-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-900/10 dark:to-[#0c0c0e] group relative overflow-hidden">
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-500/20 group-hover:scale-110 transition-transform">
                              <img src="/Frenet.svg" alt="Frenet" className="w-12 h-12 object-contain brightness-0 dark:brightness-100" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Frenet</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Cálculo de fretes e transportadoras.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('frenet'); }} className="w-full py-2.5 bg-orange-500 rounded-xl text-sm font-bold text-white hover:bg-orange-400 shadow-md shadow-orange-500/20 transition-all">Configurar</button>
                          </div>
                        </div>
                      </div>

                      {/* ERP E BANCOS DE DADOS */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
                          <Server size={16} /> Bancos de Dados & ERPs
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          <div className="border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-[#0c0c0e] group relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider z-10">Ativo</div>
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition-transform">
                              <img src="/omie.png" alt="Omie" className="w-12 h-12 object-contain drop-shadow-sm" /> 
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Omie ERP</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Sincronização de Pedidos e Clientes.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('omie'); }} className="w-full py-2.5 bg-emerald-600 rounded-xl text-sm font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20 transition-all">Configurar</button>
                          </div>

                          <div className="border border-blue-200 dark:border-blue-500/30 rounded-2xl p-5 flex flex-col items-center text-center hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-900/10 dark:to-[#0c0c0e] group relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider z-10">Novo</div>
                            <div className="w-16 h-16 bg-white dark:bg-[#121214] shadow-sm rounded-2xl flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-500/20 group-hover:scale-110 transition-transform">
                              <img src="/olist.svg" alt="Tiny" className="w-12 h-12 object-contain drop-shadow-sm" />
                            </div>
                            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-zinc-100">Tiny ERP</h3>
                            <p className="text-xs font-medium text-zinc-500 mb-5 h-8">Sincronização Bidirecional.</p>
                            <button onClick={(e) => { e.stopPropagation(); setInstalando('tiny'); }} className="w-full py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all">Configurar</button>
                          </div>

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
                                <img src={`/${db}.svg`} alt={db} className="w-12 h-12 object-contain" />
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

                {/* COMPONENTES ISOLADOS (FORMULÁRIOS) */}
                {instalando === 'woocommerce' && <FormWooCommerce onCancel={() => setInstalando('catalogo')} onSuccess={handleSuccess} />}
                {instalando === 'raizan' && <FormRaizanCommerce onCancel={() => setInstalando('catalogo')} onSuccess={handleSuccess} />}
                {instalando === 'b2b' && <FormPortalB2B onCancel={() => setInstalando('catalogo')} onSuccess={handleSuccess} />}
                {instalando === 'mercadopago' && <FormMercadoPago onCancel={() => setInstalando('catalogo')} onSuccess={handleSuccess} />}
                {instalando === 'frenet' && <FormFrenet onCancel={() => setInstalando('catalogo')} onSuccess={handleSuccess} />}
                {instalando === 'omie' && <FormOmie onCancel={() => setInstalando('catalogo')} onSuccess={handleSuccess} />}
                {instalando === 'tiny' && <FormTiny onCancel={() => setInstalando('catalogo')} onSuccess={handleSuccess} />}

              </>
            )}

          </div>
        </main>
      </div>

      {/* MODAL DE EXCLUSÃO */}
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
              <button onClick={() => setIntegracaoParaDeletar(null)} className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
              <button onClick={confirmarExclusao} className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-500/20 transition-all active:scale-95">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL CHECKLIST DE ETAPAS */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-500">
                <RefreshCw size={22} className="animate-spin" />
              </div>
              <div>
                <h3 className="font-black text-lg text-zinc-900 dark:text-white">Motor de Sincronização</h3>
                <p className="text-xs text-zinc-500 font-medium">Processando fluxo Omie ERP em tempo real.</p>
              </div>
            </div>

            <div className="space-y-4">
              {passosSync.map((p) => (
                <div key={p.id} className="flex items-center gap-3 animate-in slide-in-from-left-2">
                  {p.status === 'done' && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
                  {p.status === 'loading' && <Loader2 size={20} className="animate-spin text-emerald-500 shrink-0" />}
                  {p.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-800 shrink-0" />}
                  {p.status === 'error' && <AlertTriangle size={20} className="text-rose-500 shrink-0" />}
                  
                  <span className={`text-xs ${p.status === 'done' ? "font-bold text-emerald-600 dark:text-emerald-400" : p.status === 'loading' ? "font-bold text-zinc-900 dark:text-white" : "font-medium text-zinc-400"}`}>
                    {p.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editandoInt && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setEditandoInt(null)} 
        >
          {editandoInt.plataforma === 'omie' && (
            <EditarOmie 
              integracao={editandoInt} 
              onCancel={() => setEditandoInt(null)} 
              onSuccess={() => {
                setEditandoInt(null);
                carregarIntegracoesEStatus(); 
              }} 
            />
          )}
        </div>
      )}

    </div>
  );
}