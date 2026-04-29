"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Plug, Plus, Globe, Settings, Key, Link as LinkIcon, 
  CheckCircle2, RefreshCw, Loader2, Store, Fingerprint
} from "lucide-react";
import toast from 'react-hot-toast';

export default function IntegracoesPage() {
  const [integracoesAtivas, setIntegracoesAtivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  
  const [instalando, setInstalando] = useState(null); 

  // Formulário do WooCommerce (antigo)
  const [formWoo, setFormWoo] = useState({
    nome_integracao: "WooCommerce Legado",
    url_loja: "",
    consumer_key: "",
    consumer_secret: ""
  });

  // 🔥 NOVO: Formulário do Raizan Commerce
  const [formRaizan, setFormRaizan] = useState({
    nome_integracao: "Loja Oficial NUEV",
    url_loja: "https://nuev.com.br",
    tenant_id: "rafany", // Seu identificador único
    api_token: crypto.randomUUID() // Gera um token seguro automaticamente
  });

  useEffect(() => {
    carregarIntegracoes();
  }, []);

  const carregarIntegracoes = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes");
      const data = await res.json();
      if (data.success) {
        setIntegracoesAtivas(data.integracoes);
      }
    } catch (error) {
      toast.error("Erro ao carregar integrações.");
    } finally {
      setLoading(false);
    }
  };

  const salvarWooCommerce = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Conectando ao WooCommerce...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/woocommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formWoo)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: loadingToast });
        setInstalando(null); 
        carregarIntegracoes(); 
      } else {
        toast.error(data.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error("Erro de conexão.", { id: loadingToast });
    }
  };

  // 🔥 NOVO: Função para salvar a loja nativa
  const salvarRaizanCommerce = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Registrando Loja Nativa...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/raizan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formRaizan)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Raizan Commerce conectado com sucesso!", { id: loadingToast });
        setInstalando(null); 
        carregarIntegracoes(); 
      } else {
        toast.error(data.message || "Erro ao registrar loja.", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Erro de conexão com o Hub.", { id: loadingToast });
    }
  };

  const sincronizarDadosDaLoja = async (idIntegracao) => {
    setSincronizando(idIntegracao);
    const toastId = toast.loading("Buscando dados da loja...");
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes/sync/${idIntegracao}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sucesso! Dados sincronizados.`, { id: toastId, duration: 5000 });
      } else {
        toast.error(data.message || "Falha ao sincronizar.", { id: toastId });
      }
    } catch (error) {
      toast.error("Erro ao comunicar com o servidor.", { id: toastId });
    } finally {
      setSincronizando(null);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1000px] mx-auto space-y-6">
            
            <div className="flex items-center justify-between bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
                  <Plug size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Minhas Integrações</h1>
                  <p className="text-sm text-zinc-500">Conecte o Raizan Hub com suas frentes de loja.</p>
                </div>
              </div>
              
              {!instalando && (
                <button 
                  onClick={() => setInstalando('catalogo')}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all z-10"
                >
                  <Plus size={18} /> Nova Integração
                </button>
              )}
            </div>

            {/* LISTA DE INTEGRAÇÕES ATIVAS */}
            {!instalando && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div onClick={() => setInstalando('catalogo')} className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors min-h-[200px]">
                  <Plus size={32} className="text-zinc-400 mb-2" />
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Nova Integração</p>
                  <p className="text-xs text-zinc-500 mt-1">Ver plataformas disponíveis</p>
                </div>

                {integracoesAtivas.map(int => (
                  <div key={int.id} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow min-h-[200px] relative overflow-hidden group">
                    {/* Brilho de fundo se for Raizan */}
                    {int.plataforma === 'raizan_commerce' && (
                       <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                    )}
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${int.plataforma === 'raizan_commerce' ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                        {int.plataforma === 'woocommerce' ? <img src="/woocommerce.svg" className="w-6 h-6 object-contain" /> : <Store size={22} />}
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 size={12} /> Ativo
                      </span>
                    </div>
                    <div className="mt-4 mb-4 relative z-10">
                      <h3 className="font-bold text-lg truncate text-zinc-900 dark:text-zinc-100" title={int.nome_integracao}>{int.nome_integracao}</h3>
                      <p className="text-xs text-zinc-500 mt-1 truncate">{int.url_loja}</p>
                    </div>
                    
                    <div className="flex gap-2 w-full mt-auto relative z-10">
                      <button 
                        onClick={() => sincronizarDadosDaLoja(int.id)}
                        disabled={sincronizando === int.id}
                        className="flex-1 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                      >
                        {sincronizando === int.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Sync
                      </button>
                      <button className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SEÇÃO 2: CATÁLOGO DE PLATAFORMAS */}
            {instalando === 'catalogo' && (
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                  <h2 className="text-lg font-bold">Escolha a Plataforma</h2>
                  <button onClick={() => setInstalando(null)} className="text-sm font-bold text-zinc-500 hover:text-zinc-900">Cancelar</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* CARD RAIZAN COMMERCE (Destaque Premium) */}
                  <div className="border-2 border-purple-200 dark:border-purple-500/30 rounded-xl p-5 flex flex-col items-center text-center hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-900/10 dark:to-[#0c0c0e] relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider">
                      Nativo
                    </div>
                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-4">
                      <Store size={28} />
                    </div>
                    <h3 className="font-bold text-sm mb-2 text-zinc-900 dark:text-zinc-100">Raizan Commerce</h3>
                    <p className="text-xs text-zinc-500 mb-4 h-8">Headless Store de alta performance.</p>
                    <button onClick={() => setInstalando('raizan')} className="w-full py-2 bg-purple-600 rounded-lg text-sm font-bold text-white hover:bg-purple-500 shadow-md shadow-purple-500/20">
                      Ativar Módulo
                    </button>
                  </div>

                  {/* CARD WOOCOMMERCE */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col items-center text-center hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/20">
                    <img src="/woocommerce.svg" alt="Woo" className="h-14 object-contain mb-4 opacity-80" />
                    <h3 className="font-bold text-sm mb-2">WooCommerce</h3>
                    <p className="text-xs text-zinc-500 mb-4 h-8">Loja baseada em WordPress.</p>
                    <button onClick={() => setInstalando('woocommerce')} className="w-full py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                      Conectar
                    </button>
                  </div>
                  
                  {/* EM BREVE */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col items-center text-center opacity-40 grayscale cursor-not-allowed bg-zinc-50/50 dark:bg-zinc-900/20">
                    <img src="/shopee.svg" alt="Shopee" className="h-14 object-contain mb-4" />
                    <h3 className="font-bold text-sm mb-2">Shopee</h3>
                    <p className="text-xs text-zinc-500 mb-4 h-8">Integração de Marketplace.</p>
                    <span className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-sm font-bold text-zinc-500">Em Breve</span>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 3A: FORMULÁRIO RAIZAN COMMERCE */}
            {instalando === 'raizan' && (
              <div className="bg-white dark:bg-[#0c0c0e] border border-purple-200 dark:border-purple-500/30 rounded-2xl animate-in fade-in slide-in-from-right-4 shadow-xl shadow-purple-500/5 overflow-hidden">
                <div className="p-6 border-b border-purple-100 dark:border-purple-500/20 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/10">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 text-white p-2 rounded-lg shadow-sm">
                      <Store size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">Ativar Raizan Commerce</h2>
                      <p className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">Configuração do Headless CMS</p>
                    </div>
                  </div>
                  <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">Voltar</button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <form onSubmit={salvarRaizanCommerce} className="space-y-6">
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300"><Settings size={14} className="text-purple-500"/> Nome da Vitrine</label>
                          <input 
                            type="text" required value={formRaizan.nome_integracao} onChange={e => setFormRaizan({...formRaizan, nome_integracao: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" 
                          />
                        </div>

                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300"><LinkIcon size={14} className="text-purple-500"/> URL Oficial</label>
                          <input 
                            type="url" required value={formRaizan.url_loja} onChange={e => setFormRaizan({...formRaizan, url_loja: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" 
                          />
                        </div>
                      </div>

                      <div className="p-5 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-xl space-y-4">
                        <h3 className="text-sm font-black text-purple-900 dark:text-purple-300 flex items-center gap-2">
                          <Fingerprint size={16} /> Credenciais de API (Headless)
                        </h3>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Tenant ID (Identificador da Empresa)</label>
                          <input 
                            type="text" readOnly value={formRaizan.tenant_id} 
                            className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/30 p-2.5 rounded-lg font-mono text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Storefront API Token</label>
                          <input 
                            type="text" readOnly value={formRaizan.api_token} 
                            className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/30 p-2.5 rounded-lg font-mono text-sm text-zinc-600 dark:text-zinc-400 select-all" 
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button type="submit" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20">
                          <Store size={18} /> Instalar Raizan Commerce
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* INSTRUÇÕES RAIZAN COMMERCE */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/30 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-fit">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-zinc-800 dark:text-zinc-200"><Globe size={16} className="text-purple-500"/> Como conectar?</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                      Como o Raizan Commerce é uma solução nativa, a conexão é instantânea.
                    </p>
                    <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <li>Revise o nome e a URL da sua vitrine de vendas.</li>
                      <li>Clique em <b>Instalar Raizan Commerce</b>.</li>
                      <li>Copie o <b>Tenant ID</b> e o <b>API Token</b> gerados.</li>
                      <li>Cole essas variáveis no arquivo <code className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">.env</code> do seu projeto frontend (Next.js/React).</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 3B: FORMULÁRIO DO WOOCOMMERCE (Oculto se não clicar) */}
            {instalando === 'woocommerce' && (
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-right-4 shadow-sm">
                 <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <img src="/woocommerce.svg" alt="Woo" className="w-8 h-8 object-contain" />
                    <h2 className="text-xl font-bold">Conectar Integração</h2>
                  </div>
                  <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900">Voltar</button>
                </div>
                {/* ... (resto do form do Woo mantido igual você enviou) ... */}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}