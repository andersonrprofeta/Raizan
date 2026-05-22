"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Save, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  MousePointerClick, 
  Plus, 
  Trash2, 
  Loader2,
  UploadCloud,
  Layers,
  MonitorPlay
} from "lucide-react";
import toast from 'react-hot-toast';

export default function BannersEcommercePage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  const [content, setContent] = useState({
    heroSlides: [
      {
        id: Date.now(),
        image: "",
        showText: true,
        title: "Garanta 70% OFF",
        subtitle: "Páscoa de ofertas Raizan",
        buttonText: "Ver Ofertas",
        buttonLink: "/ofertas"
      }
    ],
    megaMenu: {
      image: "",
      title: "Esquenta Black Friday",
      buttonText: "Aproveitar",
      link: "/black-friday"
    },
    promoBanners: [
      {
        id: 1,
        bgType: "color", 
        bgColor: "#e11d48",
        image: "",
        title: "Kits Prontos DaBelle",
        subtitle: "Acelere o giro no seu negócio",
        buttonText: "COMPRE E GANHE",
        link: "/dabelle",
      },
      {
        id: 2,
        bgType: "color",
        bgColor: "#2563eb",
        image: "",
        title: "Linha Eico",
        subtitle: "Mais retorno no PDV",
        buttonText: "COMPRE E GANHE",
        link: "/eico",
      }
    ],
    sections: {
      section1: "Sua semana cheia de ofertas",
      section2: "Novidades pra você!",
      section3: "Recomendados",
      section4: "Loja Oficial Samsung"
    }
  });

  // 🔥 Função para pegar o Tenant ID logado (O Crachá!)
  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

  useEffect(() => {
    buscarConteudoAtual();
  }, []);

  // 🟢 BUSCA REAL NO BANCO DE DADOS
  const buscarConteudoAtual = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      toast.error("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/ecommerce/config?tenant=${tenantId}`, {
        headers: { "x-tenant-id": tenantId }
      });
      const data = await res.json();
      
      if (data.success && data.config?.banners) {
        // Mescla o que veio do banco com o estado padrão para não quebrar a tela se faltar campo
        setContent(prev => ({ ...prev, ...data.config.banners }));
      }
    } catch (error) {
      toast.error("Erro ao carregar banners atuais.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 SALVAMENTO REAL NO BANCO DE DADOS
  const salvarConteudo = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) return toast.error("Sessão expirada.");

    setSalvando(true);
    const toastId = toast.loading("Sincronizando conteúdo com a loja...");

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/ecommerce/config/banners", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId 
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          banners: content // Manda o JSON completo dos banners
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Conteúdo atualizado! A loja já está com os novos banners.", { id: toastId });
      } else {
        toast.error("Falha ao salvar banners.", { id: toastId });
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.", { id: toastId });
    } finally {
      setSalvando(false);
    }
  };

  // 🟢 UPLOAD REAL DE IMAGEM PARA A NUVEM
  const handleFileUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    const tenantId = pegarCnpjLogado();
    const toastId = toast.loading("Enviando imagem...");
    
    const formData = new FormData();
    formData.append("imagem", file);
    formData.append("tenant_id", tenantId);

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/upload", {
        method: "POST",
        headers: { "x-tenant-id": tenantId },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        callback(data.url); // Devolve a URL oficial da nuvem pro Banner
        toast.success("Imagem enviada!", { id: toastId });
      } else {
        toast.error(data.message || "Erro no upload.", { id: toastId });
      }
    } catch (error) {
      toast.error("Falha ao enviar imagem para a nuvem.", { id: toastId });
    }
  };

  // ================= Funções do Hero (Carrossel) =================
  const addHeroSlide = () => {
    setContent(prev => ({
      ...prev,
      heroSlides: [
        ...prev.heroSlides, 
        { id: Date.now(), image: "", showText: true, title: "Novo Slide", subtitle: "Subtítulo", buttonText: "Clique aqui", buttonLink: "#" }
      ]
    }));
  };

  const removeHeroSlide = (id) => {
    if (content.heroSlides.length === 1) {
      toast.error("Você precisa ter pelo menos um slide principal.");
      return;
    }
    setContent(prev => ({
      ...prev,
      heroSlides: prev.heroSlides.filter(slide => slide.id !== id)
    }));
  };

  const updateHeroSlide = (id, field, value) => {
    setContent(prev => ({
      ...prev,
      heroSlides: prev.heroSlides.map(slide => slide.id === id ? { ...slide, [field]: value } : slide)
    }));
  };

  // ================= Funções Promos =================
  const handlePromoChange = (id, field, value) => {
    setContent(prev => ({
      ...prev,
      promoBanners: prev.promoBanners.map(banner => banner.id === id ? { ...banner, [field]: value } : banner)
    }));
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
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* CABEÇALHO DA PÁGINA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
               <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <Layout size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Gestão de Banners</h1>
                  <p className="text-sm text-zinc-500">Configure os slides, imagens e textos da vitrine.</p>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button 
                  onClick={salvarConteudo}
                  disabled={salvando}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Alterações
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* MENU LATERAL DE ABAS */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm flex flex-col gap-1 sticky top-6">
                  <button onClick={() => setActiveTab("hero")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === "hero" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <Layers size={18} /> Slides Principais
                  </button>
                  <button onClick={() => setActiveTab("promos")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === "promos" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <Layout size={18} /> Promocionais
                  </button>
                  <button onClick={() => setActiveTab("megamenu")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === "megamenu" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <MousePointerClick size={18} /> Menu Categorias
                  </button>
                  <button onClick={() => setActiveTab("sections")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === "sections" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <Type size={18} /> Textos Vitrines
                  </button>
                </div>
              </div>

              {/* ÁREA DE CONFIGURAÇÃO (MEIO) */}
              <div className="lg:col-span-5">
                
                {/* ABA: HERO SLIDES */}
                {activeTab === "hero" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" /> Banners do Topo
                      </h2>
                      <button onClick={addHeroSlide} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={14} /> Novo Slide
                      </button>
                    </div>

                    {content.heroSlides.map((slide, index) => (
                      <div key={slide.id} className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm relative">
                        <div className="absolute top-4 right-4">
                          <button onClick={() => removeHeroSlide(slide.id)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-500 bg-zinc-50 dark:bg-zinc-900 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 mb-4 uppercase">Slide {index + 1}</h3>
                        
                        <div className="space-y-5">
                          {/* Upload de Imagem */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Imagem do Banner</label>
                            <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={(e) => handleFileUpload(e, (url) => updateHeroSlide(slide.id, "image", url))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              {slide.image ? (
                                <img src={slide.image} alt="Preview" className="h-20 object-contain mb-2 rounded" />
                              ) : (
                                <UploadCloud size={32} className="text-blue-500 mb-2" />
                              )}
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Clique para selecionar ou arraste o arquivo</span>
                              <span className="text-[10px] text-zinc-500 mt-1">Formatos: JPG, PNG, WEBP. Tamanho Recomendado: 1920x600px. Máx: 2MB.</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <input type="checkbox" checked={slide.showText} onChange={(e) => updateHeroSlide(slide.id, "showText", e.target.checked)} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                            <label className="text-xs font-bold cursor-pointer">Adicionar Textos sobre a imagem</label>
                          </div>

                          {slide.showText && (
                            <div className="grid md:grid-cols-2 gap-4 p-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Título Principal</label>
                                <input type="text" value={slide.title} onChange={(e) => updateHeroSlide(slide.id, "title", e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Subtítulo</label>
                                <input type="text" value={slide.subtitle} onChange={(e) => updateHeroSlide(slide.id, "subtitle", e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Texto do Botão</label>
                                <input type="text" value={slide.buttonText} onChange={(e) => updateHeroSlide(slide.id, "buttonText", e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Link</label>
                                <input type="text" value={slide.buttonLink} onChange={(e) => updateHeroSlide(slide.id, "buttonLink", e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ABA: BANNERS PROMOCIONAIS */}
                {activeTab === "promos" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <div className="w-2 h-6 bg-pink-500 rounded-full" /> Banners Promocionais
                    </h2>

                    {content.promoBanners.map((banner, index) => (
                      <div key={banner.id} className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-wider mb-4">Banner Menor {index + 1}</h3>
                        
                        {/* Seletor de Tipo (Cor vs Imagem) */}
                        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg mb-6 w-fit">
                          <button onClick={() => handlePromoChange(banner.id, "bgType", "color")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${banner.bgType === 'color' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>Usar Cor de Fundo</button>
                          <button onClick={() => handlePromoChange(banner.id, "bgType", "image")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${banner.bgType === 'image' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>Usar Imagem</button>
                        </div>

                        <div className="space-y-4">
                          {banner.bgType === "color" ? (
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase">Cor de Fundo</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={banner.bgColor} onChange={(e) => handlePromoChange(banner.id, "bgColor", e.target.value)} className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent" />
                                <input type="text" value={banner.bgColor} onChange={(e) => handlePromoChange(banner.id, "bgColor", e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none font-mono text-sm uppercase" />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase">Upload da Imagem</label>
                              <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePromoChange(banner.id, "image", url))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {banner.image ? <span className="text-xs text-green-600 font-bold">Imagem Selecionada</span> : <span className="text-xs text-zinc-500 font-bold">Clique ou arraste a imagem aqui</span>}
                                <span className="text-[9px] text-zinc-400 mt-1">Recomendado: 600x300px. Máx: 1MB.</span>
                              </div>
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Título (Opcional se usar imagem com texto)</label>
                              <input type="text" value={banner.title} onChange={(e) => handlePromoChange(banner.id, "title", e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Subtítulo</label>
                              <input type="text" value={banner.subtitle} onChange={(e) => handlePromoChange(banner.id, "subtitle", e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Texto do Botão</label>
                              <input type="text" value={banner.buttonText} onChange={(e) => handlePromoChange(banner.id, "buttonText", e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Link de Destino</label>
                              <input type="text" value={banner.link} onChange={(e) => handlePromoChange(banner.id, "link", e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-10 outline-none text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ABA: MENU CATEGORIAS */}
                {activeTab === "megamenu" && (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-purple-600 rounded-full" /> Banner do Mega Menu
                    </h2>
                    <p className="text-xs text-zinc-500 mb-6">Imagem exibida ao abrir a aba "Todos os Departamentos".</p>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Imagem do Banner Lateral</label>
                        <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, (url) => setContent({...content, megaMenu: {...content.megaMenu, image: url}}))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {content.megaMenu.image ? (
                            <img src={content.megaMenu.image} alt="Menu" className="h-24 object-contain mb-2 rounded" />
                          ) : (
                            <ImageIcon size={32} className="text-purple-500 mb-2" />
                          )}
                          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Selecione uma imagem vertical</span>
                          <span className="text-[10px] text-zinc-500 mt-1">Recomendado: 400x500px. Máx: 1MB. (JPG, PNG)</span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Título Sobreposto (Opcional)</label>
                          <input type="text" value={content.megaMenu.title} onChange={(e) => setContent({...content, megaMenu: {...content.megaMenu, title: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Texto do Botão</label>
                          <input type="text" value={content.megaMenu.buttonText} onChange={(e) => setContent({...content, megaMenu: {...content.megaMenu, buttonText: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Link</label>
                          <input type="text" value={content.megaMenu.link} onChange={(e) => setContent({...content, megaMenu: {...content.megaMenu, link: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: TEXTOS DAS VITRINES */}
                {activeTab === "sections" && (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-orange-500 rounded-full" /> Títulos das Vitrines
                    </h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Vitrine 1 (Principal)</label>
                        <input type="text" value={content.sections.section1} onChange={(e) => setContent({...content, sections: {...content.sections, section1: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Vitrine 2</label>
                        <input type="text" value={content.sections.section2} onChange={(e) => setContent({...content, sections: {...content.sections, section2: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Vitrine 3</label>
                        <input type="text" value={content.sections.section3} onChange={(e) => setContent({...content, sections: {...content.sections, section3: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Vitrine 4</label>
                        <input type="text" value={content.sections.section4} onChange={(e) => setContent({...content, sections: {...content.sections, section4: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm font-medium" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ÁREA DE PREVIEW (DIREITA) */}
              <div className="lg:col-span-4 hidden lg:block">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sticky top-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center justify-center gap-2">
                    <MonitorPlay size={14} className="text-blue-500" />
                    Live Preview
                  </h3>
                  
                  {/* Container Mock do Site */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex flex-col gap-3 pb-4">
                    
                    {/* Mock Header Navbar */}
                    <div className="h-6 bg-zinc-800 flex items-center px-3 gap-2">
                      <div className="w-8 h-2 bg-zinc-600 rounded-full" />
                      <div className="flex-1 h-3 bg-white/10 rounded" />
                    </div>

                    {/* PREVIEW: HERO (Mostra o Slide 1) */}
                    <div 
                      className="h-28 mx-3 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-start p-4 relative overflow-hidden bg-cover bg-center"
                      style={{ backgroundImage: content.heroSlides[0]?.image ? `url(${content.heroSlides[0].image})` : 'none' }}
                    >
                      {/* Overlay Escuro para leitura */}
                      {content.heroSlides[0]?.image && <div className="absolute inset-0 bg-black/40"></div>}
                      
                      {content.heroSlides[0]?.showText && (
                        <div className="relative z-10 w-2/3">
                          <div className="text-[11px] font-black text-white leading-tight mb-1 truncate">{content.heroSlides[0].title || "Título"}</div>
                          <div className="text-[8px] text-white/80 mb-2 truncate">{content.heroSlides[0].subtitle}</div>
                          <div className="inline-block bg-white text-black text-[7px] font-bold px-2 py-1 rounded">{content.heroSlides[0].buttonText || "Botão"}</div>
                        </div>
                      )}
                    </div>

                    {/* PREVIEW: PROMO BANNERS */}
                    <div className="flex gap-2 mx-3">
                      {content.promoBanners.map(banner => (
                        <div 
                          key={banner.id} 
                          className="flex-1 h-16 rounded-lg p-2 relative overflow-hidden bg-cover bg-center"
                          style={banner.bgType === 'color' ? { backgroundColor: banner.bgColor } : { backgroundImage: banner.image ? `url(${banner.image})` : 'none', backgroundColor: '#e4e4e7' }}
                        >
                          {banner.bgType === 'image' && banner.image && <div className="absolute inset-0 bg-black/30"></div>}
                          <div className="relative z-10 h-full flex flex-col justify-center">
                            <span className="text-[8px] font-bold text-white leading-tight truncate">{banner.title || "Banner"}</span>
                            <span className="inline-block border border-white/50 text-white text-[6px] px-1 py-0.5 rounded mt-1 w-fit truncate max-w-[80%]">{banner.buttonText || "Link"}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* PREVIEW: SECTIONS */}
                    <div className="mx-3 mt-1">
                      <div className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">{content.sections.section1 || "Vitrine 1"}</div>
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex-1 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 p-1 flex flex-col gap-1">
                            <div className="w-full h-8 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
                              <ImageIcon size={10} className="text-zinc-300" />
                            </div>
                            <div className="w-3/4 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded" />
                            <div className="w-1/2 h-1.5 bg-blue-200 dark:bg-blue-900 rounded" />
                          </div>
                        ))}
                      </div>
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