"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import EtiquetaVolume from "@/components/checkout/etiqueta";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";
import { Printer, Save, Ruler, Settings2, Box } from "lucide-react";

// Função blindada para pegar o Tenant (a mesma que você usa nos Pedidos)
const obterTenantSeguro = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userRaw = localStorage.getItem("@raizan:user");
    if (userRaw) {
      const userObj = JSON.parse(userRaw);
      if (userObj.tenant_id) return userObj.tenant_id;
      if (userObj.cnpj) return userObj.cnpj;
    }
  } catch(e) {}
  return localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID || null;
};

export default function EtiquetasConfig() {
  const [largura, setLargura] = useState(100); // Padrão 100mm
  const [altura, setAltura] = useState(150);   // Padrão 150mm
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    setLoading(true);
    try {
      const tenantId = obterTenantSeguro();
      if (!tenantId) return;

      // 🟢 Rota na sua API Node (vamos criá-la a seguir)
      const res = await fetch(`${getHubUrl()}/api/hub/configuracoes/etiquetas`, {
        method: "GET",
        headers: { ...getHeaders(), "x-tenant-id": tenantId }
      });
      
      const data = await res.json();
      if (data.success && data.config) {
        setLargura(data.config.largura || 100);
        setAltura(data.config.altura || 150);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de etiqueta:", error);
    }
    setLoading(false);
  };

  const salvarConfiguracoes = async () => {
    setSaving(true);
    const loadingToast = toast.loading("Salvando proporções da etiqueta...");
    try {
      const tenantId = obterTenantSeguro();
      const res = await fetch(`${getHubUrl()}/api/hub/configuracoes/etiquetas`, {
        method: "POST",
        headers: { ...getHeaders(), "x-tenant-id": tenantId },
        body: JSON.stringify({ largura: Number(largura), altura: Number(altura) })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Dimensões salvas com sucesso!", { id: loadingToast });
      } else {
        toast.error(data.message || "Falha ao salvar.", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Erro de comunicação com o servidor.", { id: loadingToast });
    }
    setSaving(false);
  };

  // Cálculo matemático para o Preview (Mantendo 100% de largura máxima do box e ajustando altura)
  const proporcao = altura / largura;

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* HEADERS APPLE STYLE */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                <Printer className="text-purple-600 dark:text-purple-400" size={32} />
                Etiquetas Térmicas
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium max-w-2xl">
                Configure as dimensões físicas das etiquetas de volume. Este tamanho será utilizado pelo Raizan Core para gerar o PDF compatível com impressoras Zebra, Argox, Elgin, etc.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LADO ESQUERDO: FORMULÁRIO */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] shadow-sm p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Settings2 className="text-zinc-400" size={24} />
                    <h2 className="text-xl font-bold">Dimensões do Rolo</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Input Largura */}
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Largura (Milímetros)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Ruler size={18} className="text-zinc-400" />
                        </div>
                        <input
                          type="number"
                          value={largura}
                          onChange={(e) => setLargura(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-16 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold text-lg"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-zinc-400 font-bold text-sm">
                          mm
                        </div>
                      </div>
                    </div>

                    {/* Input Altura */}
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Altura (Milímetros)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Ruler size={18} className="text-zinc-400 transform rotate-90" />
                        </div>
                        <input
                          type="number"
                          value={altura}
                          onChange={(e) => setAltura(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-16 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold text-lg"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-zinc-400 font-bold text-sm">
                          mm
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-300 font-medium flex gap-3">
                    <Box size={20} className="shrink-0 mt-0.5" />
                    <p>O padrão logístico dos Correios e principais transportadoras é <strong>100x150mm</strong>. Se for imprimir apenas marcação de volumes simples, 100x100mm costuma ser suficiente.</p>
                  </div>
                </div>

                <button
                  onClick={salvarConfiguracoes}
                  disabled={saving || loading}
                  className="mt-8 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 dark:shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-70 active:scale-[0.98] uppercase tracking-wider text-sm"
                >
                  {saving ? "Gravando..." : (
                    <>
                      <Save size={18} /> Salvar Parâmetros
                    </>
                  )}
                </button>
              </div>

              {/* LADO DIREITO: PREVIEW VISUAL */}
              <div className="bg-zinc-200/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center min-h-[500px]">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8 text-center">Preview em Tempo Real</p>
                
                {/* O container mágico do Preview refatorado! */}
                <div className="relative flex items-center justify-center w-full max-w-[300px] min-h-[400px] overflow-hidden border border-zinc-300 dark:border-zinc-700 shadow-xl pointer-events-none rounded-xl bg-zinc-100 dark:bg-zinc-800/50">
                  
                  {/* O scale-[0.65] encolhe visualmente a etiqueta (que tem tamanho real em mm) para caber na tela */}
                  <div className="origin-center scale-[0.65] flex justify-center items-center">
                    
                    {/* O componente real desenhando na tela! */}
                    <EtiquetaVolume 
                      config={{ largura, altura }}
                      logoUrl={typeof window !== 'undefined' ? localStorage.getItem('@raizan:logo') : ''} 
                    />
                    
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