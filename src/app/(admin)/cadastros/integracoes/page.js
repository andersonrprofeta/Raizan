"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Plug, Plus, Globe, Settings, Key, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import toast from 'react-hot-toast';

export default function IntegracoesPage() {
  const [integracoesAtivas, setIntegracoesAtivas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de qual formulário está aberto
  const [instalando, setInstalando] = useState(null); // null, 'woocommerce', 'shopee', etc.

  // Estado do Form do WooCommerce
  const [formWoo, setFormWoo] = useState({
    nome_integracao: "Meu WooCommerce",
    url_loja: "",
    consumer_key: "",
    consumer_secret: ""
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
        setInstalando(null); // Fecha o form
        carregarIntegracoes(); // Recarrega a lista
      } else {
        toast.error(data.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error("Erro de conexão.", { id: loadingToast });
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1000px] mx-auto space-y-6">
            
            {/* CABEÇALHO DA PÁGINA */}
            <div className="flex items-center justify-between bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20">
                  <Plug size={28} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Minhas Integrações</h1>
                  <p className="text-sm text-zinc-500">Conecte o Raizan Core com marketplaces e e-commerces.</p>
                </div>
              </div>
              
              {!instalando && (
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all">
                  <Plus size={18} /> Adicionar Integração
                </button>
              )}
            </div>

            {/* SEÇÃO 1: LISTA DE INTEGRAÇÕES ATIVAS (Só aparece se não estiver instalando nada) */}
            {!instalando && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* CARD PARA ADICIONAR NOVA (Catalogo) */}
                <div onClick={() => setInstalando('catalogo')} className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors min-h-[200px]">
                  <Plus size={32} className="text-zinc-400 mb-2" />
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Nova Integração</p>
                  <p className="text-xs text-zinc-500 mt-1">Ver plataformas disponíveis</p>
                </div>

                {/* CARDS DAS INTEGRAÇÕES JÁ SALVAS */}
                {integracoesAtivas.map(int => (
                  <div key={int.id} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow min-h-[200px]">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center bg-zinc-50">
                        {int.plataforma === 'woocommerce' ? <img src="/woocommerce.svg" className="w-6 h-6 object-contain" /> : <Globe size={20} className="text-zinc-400" />}
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle2 size={12} /> Ativo
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-lg truncate" title={int.nome_integracao}>{int.nome_integracao}</h3>
                      <p className="text-xs text-zinc-500 mt-1 truncate">{int.url_loja}</p>
                    </div>
                    <button className="mt-4 w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg text-sm hover:bg-zinc-200 transition-colors">
                      Gerenciar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* SEÇÃO 2: CATÁLOGO DE PLATAFORMAS (Aparece ao clicar em Nova Integração) */}
            {instalando === 'catalogo' && (
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                  <h2 className="text-lg font-bold">Escolha a Plataforma</h2>
                  <button onClick={() => setInstalando(null)} className="text-sm font-bold text-zinc-500 hover:text-zinc-900">Cancelar</button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* CARD WOOCOMMERCE */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer bg-zinc-50 dark:bg-zinc-900/30">
                    <img src="/woocommerce.svg" alt="Woo" className="h-12 object-contain mb-4" />
                    <h3 className="font-bold text-sm mb-4">WooCommerce</h3>
                    <button onClick={() => setInstalando('woocommerce')} className="w-full py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 hover:text-purple-700">
                      Instalar
                    </button>
                  </div>
                  
                  {/* Outros cards (Shopee, Mercado Livre...) ficariam aqui */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center opacity-50 grayscale cursor-not-allowed">
                    <img src="/shopee.svg" alt="Shopee" className="h-12 object-contain mb-4" />
                    <h3 className="font-bold text-sm mb-4">Shopee</h3>
                    <span className="text-xs font-bold text-zinc-400">Em Breve</span>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 3: FORMULÁRIO DE INSTALAÇÃO DO WOOCOMMERCE (Igualzinho o do Vídeo) */}
            {instalando === 'woocommerce' && (
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-right-4">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <img src="/woocommerce.svg" alt="Woo" className="w-8 h-8 object-contain" />
                    <h2 className="text-xl font-bold">Conectar Integração</h2>
                  </div>
                  <button onClick={() => setInstalando('catalogo')} className="text-sm font-bold text-zinc-500 hover:text-zinc-900">Voltar</button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* FORMULÁRIO */}
                  <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={salvarWooCommerce} className="space-y-6">
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><Settings size={14} className="text-zinc-400"/> Nome da integração no ERP</label>
                        <input 
                          type="text" required value={formWoo.nome_integracao} onChange={e => setFormWoo({...formWoo, nome_integracao: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl outline-none focus:border-indigo-500" 
                          placeholder="Ex: Minha Loja Principal" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><LinkIcon size={14} className="text-zinc-400"/> URL da Loja</label>
                        <input 
                          type="url" required value={formWoo.url_loja} onChange={e => setFormWoo({...formWoo, url_loja: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl outline-none focus:border-indigo-500" 
                          placeholder="https://sualoja.com.br" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><Key size={14} className="text-zinc-400"/> Consumer Key</label>
                        <input 
                          type="text" required value={formWoo.consumer_key} onChange={e => setFormWoo({...formWoo, consumer_key: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" 
                          placeholder="ck_..." 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><Key size={14} className="text-zinc-400"/> Consumer Secret</label>
                        <input 
                          type="text" required value={formWoo.consumer_secret} onChange={e => setFormWoo({...formWoo, consumer_secret: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" 
                          placeholder="cs_..." 
                        />
                      </div>

                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                        <button type="submit" className="bg-[#96588a] hover:bg-[#7a4670] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                          Conectar com WooCommerce
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* INSTRUÇÕES LATERAIS */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/30 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-fit">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={16}/> Instruções</h3>
                    <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <li>Acesse o painel WordPress da sua loja.</li>
                      <li>Vá em <b>WooCommerce &gt; Configurações</b>.</li>
                      <li>Clique na aba <b>Avançado</b> e depois em <b>API REST</b>.</li>
                      <li>Clique em <b>Adicionar Chave</b>.</li>
                      <li>Crie a chave com permissão de <b>Ler/Escrever</b>.</li>
                      <li>Copie a <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">Consumer Key</span> e <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">Consumer Secret</span> e cole aqui.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}