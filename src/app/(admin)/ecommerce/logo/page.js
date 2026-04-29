"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Save, 
  Fingerprint, 
  UploadCloud, 
  X, 
  MonitorPlay, 
  Globe, 
  Search, 
  LayoutTemplate,
  Loader2
} from "lucide-react";
import toast from 'react-hot-toast';

export default function IdentityEcommercePage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estado central da Identidade
  const [identity, setIdentity] = useState({
    logo: "", // URL da Logo
    favicon: "", // URL do Favicon
    siteTitle: "Raizan Store",
    siteTagline: "Tudo que você ama está aqui" // Pegando a sua referência das Americanas!
  });

  useEffect(() => {
    // Simulação de carregamento da API
    setTimeout(() => setLoading(false), 500);
  }, []);

  const salvarIdentidade = async () => {
    setSalvando(true);
    const toastId = toast.loading("Salvando identidade visual...");
    try {
      // Simulação de requisição
      setTimeout(() => {
        toast.success("Identidade atualizada com sucesso!", { id: toastId });
        setSalvando(false);
      }, 1500);
    } catch (error) {
      toast.error("Erro ao salvar.", { id: toastId });
      setSalvando(false);
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 2MB.");
        return;
      }
      // Criando URL temporária para o Preview local (padrão Electron/React)
      const url = URL.createObjectURL(file);
      setIdentity(prev => ({ ...prev, [field]: url }));
    }
  };

  const removeImage = (field) => {
    setIdentity(prev => ({ ...prev, [field]: "" }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* CABEÇALHO DA PÁGINA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
               <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <Fingerprint size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Logotipo e Identidade</h1>
                  <p className="text-sm text-zinc-500">Defina o nome, a descrição e as marcas visuais da sua loja.</p>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button onClick={salvarIdentidade} disabled={salvando} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* ÁREA DE FORMULÁRIO (ESQUERDA) */}
              <div className="xl:col-span-7 space-y-6">
                
                {/* BLOCO DE IMAGENS */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-blue-600 rounded-full" /> Marcas Visuais
                  </h2>

                  <div className="grid md:grid-cols-2 gap-8">
                    
                    {/* Logo Principal */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Logo Principal (Cabeçalho)</label>
                      <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors h-48 bg-zinc-50/50 dark:bg-zinc-900/20">
                        <input 
                          type="file" accept="image/png, image/svg+xml, image/webp"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {identity.logo ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img src={identity.logo} alt="Logo Preview" className="max-h-24 max-w-full object-contain" />
                            <button onClick={(e) => { e.preventDefault(); removeImage('logo'); }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-20 transition-colors shadow-md">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud size={32} className="text-blue-500 mb-3" />
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Upload da Logo</span>
                            <span className="text-[10px] text-zinc-500 mt-2 leading-tight">Formatos recomendados: PNG ou SVG transparente. Máx 2MB.</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Favicon */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Ícone do Site (Favicon)</label>
                      <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors h-48 bg-zinc-50/50 dark:bg-zinc-900/20">
                        <input 
                          type="file" accept="image/png, image/ico, image/jpeg"
                          onChange={(e) => handleFileUpload(e, 'favicon')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {identity.favicon ? (
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <img src={identity.favicon} alt="Favicon Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                            <button onClick={(e) => { e.preventDefault(); removeImage('favicon'); }} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-20 transition-colors shadow-md">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <LayoutTemplate size={32} className="text-purple-500 mb-3" />
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Upload do Favicon</span>
                            <span className="text-[10px] text-zinc-500 mt-2 leading-tight">O ícone que aparece nas abas do navegador. Exatamente 512x512 pixels.</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* BLOCO DE TEXTOS (SEO/TÍTULO) */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-orange-500 rounded-full" /> Título e Descrição
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Título do Site</label>
                      <input 
                        type="text" 
                        value={identity.siteTitle} 
                        onChange={(e) => setIdentity({...identity, siteTitle: e.target.value})} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm font-bold focus:border-blue-500 dark:focus:border-blue-500 transition-colors" 
                        placeholder="Ex: Americanas"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1.5">O nome principal da sua marca.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Descrição (Slogan/Tagline)</label>
                      <input 
                        type="text" 
                        value={identity.siteTagline} 
                        onChange={(e) => setIdentity({...identity, siteTagline: e.target.value})} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm focus:border-blue-500 dark:focus:border-blue-500 transition-colors" 
                        placeholder="Ex: Tudo que você ama está aqui"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1.5">Uma frase curta de impacto. Explicará sobre o que é o seu site de forma rápida.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* ÁREA DE PREVIEW (DIREITA) */}
              <div className="xl:col-span-5">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sticky top-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                    <MonitorPlay size={16} className="text-blue-500" />
                    Live Preview
                  </h3>
                  
                  <div className="space-y-8">
                    
                    {/* PREVIEW 1: ABA DO NAVEGADOR */}
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Globe size={12}/> Aba do Navegador</h4>
                      <div className="bg-[#dee1e6] dark:bg-[#202124] rounded-t-xl p-2 flex items-end h-12 border border-zinc-200 dark:border-zinc-800/50 shadow-inner">
                        <div className="bg-white dark:bg-[#323639] w-48 h-8 rounded-t-lg flex items-center px-3 gap-2 shadow-sm relative z-10">
                          {identity.favicon ? (
                            <img src={identity.favicon} alt="Favicon" className="w-4 h-4 rounded-sm object-cover" />
                          ) : (
                            <div className="w-4 h-4 rounded-sm bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-[8px] font-black text-zinc-400">?</div>
                          )}
                          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                            {identity.siteTitle} {identity.siteTagline ? `- ${identity.siteTagline}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PREVIEW 2: GOOGLE SEARCH (SEO) */}
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Search size={12}/> Resultado no Google</h4>
                      <div className="bg-white dark:bg-[#202124] rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          {identity.favicon ? (
                            <img src={identity.favicon} alt="Favicon" className="w-4 h-4 rounded-full bg-zinc-100 object-cover" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-zinc-800 dark:text-zinc-300 leading-none">{identity.siteTitle || "Seu Site"}</span>
                            <span className="text-[9px] text-zinc-500">https://www.seusite.com.br</span>
                          </div>
                        </div>
                        <h3 className="text-base font-normal text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate mt-2">
                          {identity.siteTitle} - {identity.siteTagline}
                        </h3>
                        <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] mt-1 line-clamp-2">
                          Compre produtos na {identity.siteTitle} com os melhores preços. {identity.siteTagline}. Aproveite as ofertas exclusivas e frete rápido para todo o Brasil.
                        </p>
                      </div>
                    </div>

                    {/* PREVIEW 3: CABEÇALHO DA LOJA */}
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><LayoutTemplate size={12}/> Cabeçalho da Loja</h4>
                      <div className="bg-[#111827] rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center">
                          {identity.logo ? (
                            <img src={identity.logo} alt="Logo" className="h-8 max-w-[120px] object-contain" />
                          ) : (
                            <span className="text-white font-black text-xl tracking-tighter">{identity.siteTitle || "Raizan."}</span>
                          )}
                        </div>
                        <div className="bg-white/10 w-32 h-6 rounded px-2 flex items-center">
                          <div className="w-20 h-1.5 bg-white/20 rounded-full"></div>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-400 mt-2 text-center">Fundo ilustrativo simulando a cor primária da loja.</p>
                    </div>

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