"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Save, 
  Menu as MenuIcon, 
  PanelTop, 
  ListTree, 
  Plus, 
  Trash2, 
  Loader2,
  MonitorPlay,
  Truck,
  ShieldCheck,
  Globe,
  Heart,
  User,
  ShoppingCart,
  Search,
  Zap,
  Home,
  Star,
  Flame,
  Monitor,
  Smartphone,
  Gift,
  Tag
} from "lucide-react";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";

// 🟢 DICIONÁRIO DE ÍCONES (Versão JavaScript sem tipagem)
const ICON_OPTIONS = {
  None: null, // Representa "Sem Ícone"
  Home: <Home size={14} />,
  Star: <Star size={14} />,
  Flame: <Flame size={14} />,
  Monitor: <Monitor size={14} />,
  Smartphone: <Smartphone size={14} />,
  Gift: <Gift size={14} />,
  Tag: <Tag size={14} />,
  Truck: <Truck size={14} />,
  ShieldCheck: <ShieldCheck size={14} />
};

export default function HeaderEcommercePage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState("topbar");

  // Estado central do Header Turbinado
  const [content, setContent] = useState({
    topBar: {
      textLeft: "Frete grátis acima de R$ 199",
      announcementIcon: "Truck", 
      textCenter: "Compra 100% Segura no Raizan Commerce",
      centerIcon: "ShieldCheck", 
      showLangCurrency: true, 
    },
    categoryBar: {
      megaMenuBtn: "Todos os Departamentos",
      dealMenuText: "Ofertas do Dia",
      dealMenuLink: "/ofertas",
      mainMenu: [
        { id: 1, label: "Home", url: "/", icon: "Home" },
        { id: 2, label: "Ofertas", url: "/ofertas", icon: "Star" },
        { id: 3, label: "Mais vendidos", url: "/top", icon: "Flame" },
        { id: 4, label: "Eletrônicos", url: "/eletronicos", icon: "Monitor" },
        { id: 5, label: "Celulares", url: "/celulares", icon: "Smartphone" }
      ]
    },
    megaMenuContent: [
      {
        id: "col1",
        title: "Tecnologia",
        links: [
          { id: 1, label: "Smartphones & Celulares", url: "/" },
          { id: 2, label: "Notebooks & PCs", url: "/" },
          { id: 3, label: "TVs e Monitores", url: "/" },
        ]
      },
      {
        id: "col2",
        title: "Casa & Cozinha",
        links: [
          { id: 4, label: "Eletrodomésticos", url: "/" },
          { id: 5, label: "Climatização", url: "/" },
          { id: 6, label: "Móveis", url: "/" },
        ]
      },
      {
        id: "col3",
        title: "Top Marcas",
        links: [
          { id: 7, label: "Apple", url: "/" },
          { id: 8, label: "Samsung", url: "/" },
          { id: 9, label: "LG", url: "/" },
        ]
      }
    ]
  });

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      const userLogado = storedUser ? JSON.parse(storedUser) : {};
      const cabecalhosPadrao = getHeaders();
      return userLogado.tenant_id || cabecalhosPadrao["x-tenant-id"] || process.env.NEXT_PUBLIC_TENANT_ID || "";
    }
    return "";
  };

  useEffect(() => {
    buscarConteudoAtual();
  }, []);

  const buscarConteudoAtual = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      toast.error("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/ecommerce/config?tenant=${tenantId}`, {
        headers: { ...getHeaders(), "x-tenant-id": tenantId }
      });
      const data = await res.json();
      
      if (data.success && data.config?.header) {
        setContent(prev => {
          const merged = { ...prev, ...data.config.header };
          if (!merged.topBar.announcementIcon) merged.topBar.announcementIcon = "Truck";
          if (!merged.topBar.centerIcon) merged.topBar.centerIcon = "ShieldCheck";
          return merged;
        });
      }
    } catch (error) {
      console.error("Erro ao carregar cabeçalho:", error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConteudo = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) return toast.error("Sessão expirada.");

    setSalvando(true);
    const toastId = toast.loading("Atualizando cabeçalho da loja...");

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/ecommerce/config/header`, {
        method: "POST",
        headers: { 
          ...getHeaders(),
          "Content-Type": "application/json",
          "x-tenant-id": tenantId 
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          header: content 
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cabeçalho atualizado com sucesso!", { id: toastId });
      } else {
        toast.error("Falha ao salvar cabeçalho.", { id: toastId });
      }
    } catch (error) {
      console.error("ERRO CRÍTICO AO SALVAR NO SERVIDOR:", error);
      toast.error("Erro de conexão com o servidor. (Veja o F12)", { id: toastId });
    } finally {
      setSalvando(false);
    }
  };

  // Funções do Menu Principal (Sem tipagens TS)
  const addMainMenuItem = () => {
    if (content.categoryBar.mainMenu.length >= 8) {
      toast.error("O limite máximo é de 8 menus para não quebrar o layout.");
      return;
    }
    const newMenu = [...content.categoryBar.mainMenu];
    newMenu.push({ id: Date.now(), label: "Novo Menu", url: "/", icon: "None" });
    setContent({ ...content, categoryBar: { ...content.categoryBar, mainMenu: newMenu } });
  };

  const removeMainMenuItem = (id) => {
    const newMenu = content.categoryBar.mainMenu.filter(item => item.id !== id);
    setContent({ ...content, categoryBar: { ...content.categoryBar, mainMenu: newMenu } });
  };

  const updateMainMenuItem = (id, field, value) => {
    const newMenu = content.categoryBar.mainMenu.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setContent({ ...content, categoryBar: { ...content.categoryBar, mainMenu: newMenu } });
  };

  const updateMegaMenuColTitle = (colIndex, value) => {
    const newMega = [...content.megaMenuContent];
    newMega[colIndex].title = value;
    setContent({ ...content, megaMenuContent: newMega });
  };

  const addMegaMenuLink = (colIndex) => {
    if (content.megaMenuContent[colIndex].links.length >= 5) {
      toast.error("Máximo de 5 links por coluna atingido.");
      return;
    }
    const newMega = [...content.megaMenuContent];
    newMega[colIndex].links.push({ id: Date.now(), label: "Novo Link", url: "/" });
    setContent({ ...content, megaMenuContent: newMega });
  };

  const removeMegaMenuLink = (colIndex, linkId) => {
    const newMega = [...content.megaMenuContent];
    newMega[colIndex].links = newMega[colIndex].links.filter(l => l.id !== linkId);
    setContent({ ...content, megaMenuContent: newMega });
  };

  const updateMegaMenuLink = (colIndex, linkId, field, value) => {
    const newMega = [...content.megaMenuContent];
    const linkIndex = newMega[colIndex].links.findIndex(l => l.id === linkId);
    newMega[colIndex].links[linkIndex][field] = value;
    setContent({ ...content, megaMenuContent: newMega });
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
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
               <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <PanelTop size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Cabeçalho (Header)</h1>
                  <p className="text-sm text-zinc-500">Configure avisos de topo e a barra de categorias.</p>
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                <button onClick={salvarConteudo} disabled={salvando} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm flex flex-col gap-1 sticky top-6">
                  <button onClick={() => setActiveTab("topbar")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "topbar" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <PanelTop size={18} /> Faixa do Topo
                  </button>
                  <button onClick={() => setActiveTab("mainmenu")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "mainmenu" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <MenuIcon size={18} /> Menu Principal
                  </button>
                  <button onClick={() => setActiveTab("megamenu")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "megamenu" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <ListTree size={18} /> Mega Menu (Colunas)
                  </button>
                </div>
              </div>

              <div className="lg:col-span-9 xl:col-span-5">
                
                {activeTab === "topbar" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" /> Textos de Aviso (Top Bar)
                      </h2>

                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="sm:w-1/3">
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Ícone (Esq)</label>
                            <select 
                               value={content.topBar.announcementIcon || "Truck"} 
                               onChange={(e) => setContent({...content, topBar: {...content.topBar, announcementIcon: e.target.value}})}
                               className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-12 outline-none text-sm"
                            >
                               <option value="None">Sem Ícone</option>
                               <option value="Truck">Caminhão</option>
                               <option value="ShieldCheck">Escudo</option>
                               <option value="Gift">Presente</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Aviso Esquerdo (Ex: Frete)</label>
                            <input type="text" value={content.topBar.textLeft} onChange={(e) => setContent({...content, topBar: {...content.topBar, textLeft: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="sm:w-1/3">
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Ícone (Centro)</label>
                            <select 
                               value={content.topBar.centerIcon || "ShieldCheck"} 
                               onChange={(e) => setContent({...content, topBar: {...content.topBar, centerIcon: e.target.value}})}
                               className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-12 outline-none text-sm"
                            >
                               <option value="None">Sem Ícone</option>
                               <option value="ShieldCheck">Escudo</option>
                               <option value="Truck">Caminhão</option>
                               <option value="Star">Estrela</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Aviso Central (Ex: Segurança)</label>
                            <input type="text" value={content.topBar.textCenter} onChange={(e) => setContent({...content, topBar: {...content.topBar, textCenter: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-sm">Moeda e Idioma</h3>
                              <p className="text-xs text-zinc-500">Exibir o seletor de "BR | R$" no canto direito do topo.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={content.topBar.showLangCurrency} onChange={(e) => setContent({...content, topBar: {...content.topBar, showLangCurrency: e.target.checked}})} className="sr-only peer" />
                              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "mainmenu" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <div className="w-2 h-6 bg-orange-500 rounded-full" /> Links da Barra
                        </h2>
                        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded">{content.categoryBar.mainMenu.length}/8 MÁX</span>
                      </div>

                      <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-500/5 rounded-xl border border-purple-100 dark:border-purple-500/20">
                        <label className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider">Botão Principal (Abre o Mega Menu)</label>
                        <input type="text" value={content.categoryBar.megaMenuBtn} onChange={(e) => setContent({...content, categoryBar: {...content.categoryBar, megaMenuBtn: e.target.value}})} className="w-full bg-white dark:bg-[#0c0c0e] border border-purple-200 dark:border-purple-500/30 rounded-lg px-3 h-10 outline-none text-sm font-bold" />
                      </div>

                      <div className="space-y-3 mb-6">
                        {content.categoryBar.mainMenu.map((item, index) => (
                          <div key={item.id} className="flex flex-col sm:flex-row gap-2 bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 items-start sm:items-center">
                            
                            <div className="flex gap-2 w-full sm:w-auto">
                              <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-xs font-bold w-6 h-8 flex items-center justify-center rounded">{index + 1}</span>
                              
                              <select 
                                value={item.icon || "None"} 
                                onChange={(e) => updateMainMenuItem(item.id, "icon", e.target.value)}
                                className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded outline-none text-xs px-1 h-8 w-24 cursor-pointer"
                              >
                                <option value="None">Sem ícone</option>
                                <option value="Home">Casa</option>
                                <option value="Star">Estrela</option>
                                <option value="Flame">Fogo</option>
                                <option value="Monitor">Monitor</option>
                                <option value="Smartphone">Celular</option>
                                <option value="Gift">Presente</option>
                                <option value="Tag">Etiqueta</option>
                              </select>
                            </div>

                            <input type="text" placeholder="Nome (Ex: Ofertas)" value={item.label} onChange={(e) => updateMainMenuItem(item.id, "label", e.target.value)} className="w-full sm:flex-1 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded px-2 outline-none text-sm h-8" />
                            <input type="text" placeholder="URL (Ex: /ofertas)" value={item.url} onChange={(e) => updateMainMenuItem(item.id, "url", e.target.value)} className="w-full sm:flex-1 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded px-2 outline-none text-xs text-zinc-500 h-8" />
                            
                            <button onClick={() => removeMainMenuItem(item.id)} className="p-2 text-zinc-400 hover:text-red-500 w-full sm:w-auto flex justify-center mt-1 sm:mt-0">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button onClick={addMainMenuItem} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors w-full">
                        <Plus size={14} /> Adicionar Menu Manual
                      </button>

                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <label className="block text-[10px] font-bold text-orange-500 mb-2 uppercase tracking-wider">Menu de Destaque (Canto Direito)</label>
                        <div className="flex gap-2">
                           <input type="text" value={content.categoryBar.dealMenuText} onChange={(e) => setContent({...content, categoryBar: {...content.categoryBar, dealMenuText: e.target.value}})} className="flex-1 bg-white dark:bg-[#0c0c0e] border border-orange-200 dark:border-orange-500/30 rounded-lg px-3 h-10 outline-none text-sm font-bold" />
                           <input type="text" value={content.categoryBar.dealMenuLink} onChange={(e) => setContent({...content, categoryBar: {...content.categoryBar, dealMenuLink: e.target.value}})} className="flex-1 bg-white dark:bg-[#0c0c0e] border border-orange-200 dark:border-orange-500/30 rounded-lg px-3 h-10 outline-none text-xs text-zinc-500" placeholder="Link destino" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "megamenu" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
                      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <div className="w-2 h-6 bg-purple-600 rounded-full" /> Colunas do Mega Menu
                      </h2>
                      <p className="text-xs text-zinc-500 mb-6">Estas 3 colunas abrem quando o cliente clica no botão principal "Todos os Departamentos". Máx 5 links por coluna.</p>

                      <div className="space-y-8">
                        {content.megaMenuContent.map((col, colIndex) => (
                          <div key={col.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            
                            <div className="mb-4">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Título da Coluna {colIndex + 1}</label>
                              <input type="text" value={col.title} onChange={(e) => updateMegaMenuColTitle(colIndex, e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 h-10 outline-none text-sm font-black uppercase" />
                            </div>

                            <div className="space-y-2 mb-4">
                              {col.links.map(link => (
                                <div key={link.id} className="flex gap-2 items-center">
                                  <input type="text" placeholder="Nome" value={link.label} onChange={(e) => updateMegaMenuLink(colIndex, link.id, "label", e.target.value)} className="flex-1 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded px-2 h-8 outline-none text-xs" />
                                  <input type="text" placeholder="URL" value={link.url} onChange={(e) => updateMegaMenuLink(colIndex, link.id, "url", e.target.value)} className="flex-1 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded px-2 h-8 outline-none text-[10px] text-zinc-500" />
                                  <button onClick={() => removeMegaMenuLink(colIndex, link.id)} className="p-1.5 text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                              ))}
                            </div>

                            <button onClick={() => addMegaMenuLink(colIndex)} className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 px-3 py-2 rounded flex items-center gap-1 w-full justify-center transition-colors">
                              <Plus size={12} /> Adicionar Subcategoria
                            </button>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* LIVE PREVIEW (DIREITA) */}
              <div className="hidden xl:block xl:col-span-4">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sticky top-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center justify-center gap-2">
                    <MonitorPlay size={14} className="text-blue-500" /> Live Preview
                  </h3>
                  
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans bg-white dark:bg-[#0c0c0e]">
                    
                    <div className="bg-black text-white px-2 py-1.5 text-[6px] font-medium flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <span className="flex items-center gap-1">
                          {content.topBar.announcementIcon !== "None" && ICON_OPTIONS[content.topBar.announcementIcon]} 
                          {content.topBar.textLeft}
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="flex items-center gap-1">
                          {content.topBar.centerIcon !== "None" && ICON_OPTIONS[content.topBar.centerIcon || "ShieldCheck"]} 
                          {content.topBar.textCenter}
                        </span>
                      </div>
                      
                      {content.topBar.showLangCurrency ? (
                        <div className="flex items-center gap-1 text-zinc-300">
                           <Globe size={6} /> 🇧🇷 PT-BR | R$
                        </div>
                      ) : (
                        <span className="text-orange-400 font-bold">Ver ofertas do dia</span>
                      )}
                    </div>

                    <div className="bg-[#5c16c5] px-3 py-3 flex items-center justify-between">
                      <div className="text-white font-black text-sm tracking-tighter">Raizan.</div>
                      <div className="flex-1 mx-3 bg-white rounded flex items-center px-2 py-1 h-6">
                        <span className="text-zinc-400 text-[6px]">Buscar produtos...</span>
                        <Search size={8} className="ml-auto text-zinc-400" />
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <div className="flex flex-col items-center"><Heart size={10} /><span className="text-[4px] mt-0.5">Favoritos</span></div>
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <div className="flex flex-col"><span className="text-[4px]">Boas vindas :)</span><span className="text-[5px] font-bold">Entre ou Cadastre-se</span></div>
                        </div>
                        <div className="relative ml-1">
                          <ShoppingCart size={12} />
                          <div className="absolute -top-1 -right-1 bg-black text-white text-[4px] w-2.5 h-2.5 flex items-center justify-center rounded-full font-bold">1</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#fbbf24] px-2 py-1 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#4c1d95] text-white px-2 py-1 rounded text-[5px] font-bold flex items-center gap-1 shadow-sm cursor-pointer">
                          <MenuIcon size={8} /> {content.categoryBar.megaMenuBtn}
                        </div>
                        
                        <div className="flex gap-2">
                          {content.categoryBar.mainMenu.map(item => (
                            <div key={item.id} className="flex items-center gap-0.5 text-black text-[5px] font-medium">
                              {item.icon !== "None" && ICON_OPTIONS[item.icon]} 
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-black text-[5px] font-black uppercase">
                        <Zap size={8} /> {content.categoryBar.dealMenuText}
                      </div>
                    </div>

                    {activeTab === "megamenu" && (
                      <div className="p-3 grid grid-cols-3 gap-2 bg-white dark:bg-[#0c0c0e] border-b border-zinc-100 dark:border-zinc-800">
                        {content.megaMenuContent.map(col => (
                          <div key={col.id}>
                            <h4 className="text-[6px] font-black text-zinc-900 dark:text-zinc-100 mb-1.5 uppercase">{col.title}</h4>
                            <div className="flex flex-col gap-1">
                              {col.links.map(link => (
                                <span key={link.id} className="text-[5px] text-zinc-500">{link.label}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {activeTab === "megamenu" && <p className="text-[8px] text-zinc-400 text-center mt-2">Simulando o Mega Menu Aberto</p>}

                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}