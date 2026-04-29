"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Palette, Save, Loader2, ShoppingCart, Menu as MenuIcon } from "lucide-react";
import toast from 'react-hot-toast';

export default function CoresEcommercePage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estado das cores com as novas adições
  const [cores, setCores] = useState({
    primaryColor: "#0066cc",   // Cor do topo principal (onde fica a logo)
    primaryHover: "#0052a3",
    topBarBg: "#111827",      // Faixinha do topo (Frete grátis)
    topBarText: "#f3f4f6",
    categoryBarBg: "#ffffff", // Fundo da barra de menus
    categoryBarText: "#4b5563",// Letra dos menus
    badgeColor: "#f97316"     // Cor do carrinho/ofertas (Laranja por padrão)
  });

  useEffect(() => {
    buscarCoresAtuais();
  }, []);

  const buscarCoresAtuais = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/ecommerce/config?tenant=rafany");
      const data = await res.json();
      if (data.success && data.config?.theme) {
        setCores(prev => ({ ...prev, ...data.config.theme }));
      }
    } catch (error) {
      toast.error("Erro ao carregar cores atuais.");
    } finally {
      setLoading(false);
    }
  };

  const salvarCores = async () => {
    setSalvando(true);
    const toastId = toast.loading("Sincronizando cores com a loja...");

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/ecommerce/config/cores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "rafany",
          cores: cores
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cores atualizadas! A loja já está com o novo visual.", { id: toastId });
      } else {
        toast.error("Falha ao salvar.", { id: toastId });
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.", { id: toastId });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-[1000px] mx-auto space-y-6">
            
            {/* CABEÇALHO DA PÁGINA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
               <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <Palette size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Cores do Tema</h1>
                  <p className="text-sm text-zinc-500">Personalize a identidade visual da sua vitrine.</p>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button 
                  onClick={salvarCores}
                  disabled={salvando}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COLUNA ESQUERDA: FORMULÁRIOS DE COR */}
              <div className="space-y-6">
                
                {/* Cabeçalho Superior e Principal */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <div className="w-2 h-6 bg-blue-600 rounded-full" />
                    Cabeçalho Principal
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold">Cor Primária (Fundo da Logo)</p>
                        <p className="text-[10px] text-zinc-500">A cor central da sua marca</p>
                      </div>
                      <input type="color" value={cores.primaryColor} onChange={(e) => setCores({...cores, primaryColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold">Fundo do Aviso (Topo)</p>
                        <p className="text-[10px] text-zinc-500">Barra de frete grátis</p>
                      </div>
                      <input type="color" value={cores.topBarBg} onChange={(e) => setCores({...cores, topBarBg: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold">Texto do Aviso (Topo)</p>
                        <p className="text-[10px] text-zinc-500">Cor das letras na barra superior</p>
                      </div>
                      <input type="color" value={cores.topBarText} onChange={(e) => setCores({...cores, topBarText: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                    </div>
                  </div>
                </div>

                {/* Categorias e Destaques */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <div className="w-2 h-6 bg-orange-500 rounded-full" />
                    Menus e Destaques
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold">Fundo do Menu (Categorias)</p>
                        <p className="text-[10px] text-zinc-500">Cor da barra de departamentos</p>
                      </div>
                      <input type="color" value={cores.categoryBarBg} onChange={(e) => setCores({...cores, categoryBarBg: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold">Texto do Menu</p>
                        <p className="text-[10px] text-zinc-500">Links de categorias na home</p>
                      </div>
                      <input type="color" value={cores.categoryBarText} onChange={(e) => setCores({...cores, categoryBarText: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold">Cor de Destaque (Badge)</p>
                        <p className="text-[10px] text-zinc-500">Quantidade no carrinho e selos de oferta</p>
                      </div>
                      <input type="color" value={cores.badgeColor} onChange={(e) => setCores({...cores, badgeColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                    </div>
                  </div>
                </div>

              </div>

              {/* COLUNA DIREITA: PREVIEW VISUAL COMPLETO */}
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-fit sticky top-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Preview da Loja
                </h3>
                
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans">
                  
                  {/* Fake Top Header */}
                  <div style={{ backgroundColor: cores.topBarBg, color: cores.topBarText }} className="px-4 py-1.5 text-[9px] font-medium flex justify-between">
                    <span>Frete grátis acima de R$ 199</span>
                    <span>Ver ofertas</span>
                  </div>

                  {/* Fake Main Header */}
                  <div style={{ backgroundColor: cores.primaryColor }} className="px-4 py-4 flex items-center justify-between transition-colors">
                    <span className="text-white font-extrabold text-xl">Loja.</span>
                    
                    {/* Barra de Busca Mock */}
                    <div className="flex-1 mx-4 bg-white rounded flex items-center px-2 py-1.5 h-8 opacity-90">
                      <div className="w-full h-1.5 bg-zinc-200 rounded-full" />
                    </div>

                    {/* Carrinho Mock */}
                    <div className="relative text-white flex items-center justify-center">
                      <ShoppingCart size={20} />
                      <span style={{ backgroundColor: cores.badgeColor }} className="absolute -top-2 -right-2 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-transparent shadow-sm transition-colors">
                        3
                      </span>
                    </div>
                  </div>

                  {/* Fake Category Bar */}
                  <div style={{ backgroundColor: cores.categoryBarBg }} className="px-4 py-2 border-b border-zinc-200 flex gap-4 transition-colors">
                    <button style={{ backgroundColor: cores.primaryColor }} className="text-white text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm">
                      <MenuIcon size={12} /> Departamentos
                    </button>
                    <div style={{ color: cores.categoryBarText }} className="flex items-center gap-4 text-[10px] font-medium transition-colors">
                      <span>Início</span>
                      <span>Moda</span>
                      <span>Eletrônicos</span>
                    </div>
                  </div>

                  {/* Fake Hero Image */}
                  <div className="h-32 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-col gap-2 relative overflow-hidden">
                    <div className="w-3/4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    <div className="w-1/2 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    <button style={{ backgroundColor: cores.primaryColor }} className="mt-2 px-4 py-1.5 rounded text-white text-[10px] font-bold shadow-md transition-colors">
                      Comprar Agora
                    </button>
                  </div>
                  
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}