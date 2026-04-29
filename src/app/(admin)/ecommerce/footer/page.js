"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Save, 
  Building2, 
  Link as LinkIcon, 
  Share2, 
  Plus, 
  Trash2, 
  Loader2,
  UploadCloud,
  MonitorPlay,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  GripVertical,
  Layout
} from "lucide-react";
import toast from 'react-hot-toast';

export default function FooterEcommercePage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // Estado central do Footer
  const [content, setContent] = useState({
    info: {
      logoUrl: "", // Se vazio, usa o texto abaixo
      companyName: "Raizan Store.",
      description: "Destacamos que os preços previstos no site prevalecem aos demais anunciados em outros meios de comunicação e sites de buscas.",
      cnpj: "CNPJ 43.214.055/0001-07\nRaizan Comércio e Tecnologia S.A.\nRua Luziânia, 47, Aparecida, Goiânia / GO - CEP 74000-000",
      disclaimer: "*Ofertas válidas para produtos vendidos e entregues pelo Raizan Core. As ações estão sujeitas a saírem do ar antecipadamente. Verifique o regulamento da campanha. As condições comerciais (Disponibilidade de Estoque, Preço, Valor do Frete e Prazo de entrega) são válidas para a região de entrega informada."
    },
    menus: [
      {
        id: "col1",
        title: "INSTITUCIONAL",
        links: [
          { id: 1, label: "Sobre o Raizan Store", url: "/sobre" },
          { id: 2, label: "Trabalhe conosco", url: "/vagas" },
          { id: 3, label: "Blog Corporativo", url: "/blog" }
        ]
      },
      {
        id: "col2",
        title: "ATENDIMENTO",
        links: [
          { id: 4, label: "Central de Ajuda", url: "/ajuda" },
          { id: 5, label: "Políticas de Envio", url: "/envio" },
          { id: 6, label: "Trocas e devoluções", url: "/trocas" }
        ]
      },
      {
        id: "col3",
        title: "MINHA CONTA",
        links: [
          { id: 7, label: "Meu Perfil", url: "/perfil" },
          { id: 8, label: "Meus Pedidos", url: "/pedidos" },
          { id: 9, label: "Lista de Desejos", url: "/favoritos" }
        ]
      },
      {
        id: "col4",
        title: "LEGAL",
        links: [
          { id: 10, label: "Políticas de Privacidade", url: "/privacidade" },
          { id: 11, label: "Termos de Uso", url: "/termos" },
          { id: 12, label: "Configurar Cookies", url: "/cookies" }
        ]
      }
    ],
    social: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com",
      youtube: "https://youtube.com"
    },
    apps: {
      show: true,
      playStore: "https://play.google.com",
      appStore: "https://apple.com"
    }
  });

  useEffect(() => {
    // Simulação de busca inicial
    setTimeout(() => setLoading(false), 600);
  }, []);

  const salvarConteudo = async () => {
    setSalvando(true);
    const toastId = toast.loading("Atualizando rodapé da loja...");
    try {
      setTimeout(() => {
        toast.success("Rodapé atualizado com sucesso!", { id: toastId });
        setSalvando(false);
      }, 1500);
    } catch (error) {
      toast.error("Erro ao salvar.", { id: toastId });
      setSalvando(false);
    }
  };

  const handleFileUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB.");
        return;
      }
      callback(URL.createObjectURL(file));
    }
  };

  // Funções de Menu Dinâmico
  const addLink = (colIndex) => {
    const newMenus = [...content.menus];
    newMenus[colIndex].links.push({ id: Date.now(), label: "Novo Link", url: "/" });
    setContent({ ...content, menus: newMenus });
  };

  const removeLink = (colIndex, linkId) => {
    const newMenus = [...content.menus];
    newMenus[colIndex].links = newMenus[colIndex].links.filter(l => l.id !== linkId);
    setContent({ ...content, menus: newMenus });
  };

  const updateLink = (colIndex, linkId, field, value) => {
    const newMenus = [...content.menus];
    const linkIndex = newMenus[colIndex].links.findIndex(l => l.id === linkId);
    newMenus[colIndex].links[linkIndex][field] = value;
    setContent({ ...content, menus: newMenus });
  };

  // 🔥 Nova função para atualizar o título da coluna
  const updateColTitle = (colIndex, newTitle) => {
    const newMenus = [...content.menus];
    newMenus[colIndex].title = newTitle;
    setContent({ ...content, menus: newMenus });
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
            
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
               <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <Layout size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Rodapé (Footer)</h1>
                  <p className="text-sm text-zinc-500">Gerencie informações, links, CNPJ e redes sociais.</p>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button onClick={salvarConteudo} disabled={salvando} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* MENU LATERAL */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm flex flex-col gap-1 sticky top-6">
                  <button onClick={() => setActiveTab("info")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "info" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <Building2 size={18} /> Info. da Empresa
                  </button>
                  <button onClick={() => setActiveTab("menus")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "menus" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <LinkIcon size={18} /> Colunas de Menus
                  </button>
                  <button onClick={() => setActiveTab("social")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "social" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <Share2 size={18} /> Redes & Apps
                  </button>
                </div>
              </div>

              {/* EDITOR */}
              <div className="lg:col-span-5">
                
                {/* ABA: INFO */}
                {activeTab === "info" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" /> Marca e Textos Legais
                      </h2>

                      <div className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Logo do Rodapé (Fundo Escuro)</label>
                          <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center bg-zinc-900 transition-colors">
                            <input 
                              type="file" accept="image/png, image/svg+xml"
                              onChange={(e) => handleFileUpload(e, (url) => setContent({...content, info: {...content.info, logoUrl: url}}))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {content.info.logoUrl ? (
                              <div className="relative">
                                <img src={content.info.logoUrl} alt="Logo Footer" className="h-10 object-contain mb-2" />
                                <button 
                                  onClick={(e) => { e.preventDefault(); setContent({...content, info: {...content.info, logoUrl: ""}}); }}
                                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                                >
                                  &times;
                                </button>
                              </div>
                            ) : (
                              <div className="text-center text-white/50">
                                <UploadCloud size={32} className="mx-auto mb-2 opacity-50" />
                                <span className="text-sm font-bold block">Upload PNG (Fundo Transparente)</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-1">Se não houver logo, exibiremos o nome em texto branco.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Nome da Loja (Texto Alternativo)</label>
                          <input type="text" value={content.info.companyName} onChange={(e) => setContent({...content, info: {...content.info, companyName: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Breve Descrição (Abaixo da Logo)</label>
                          <textarea rows="3" value={content.info.description} onChange={(e) => setContent({...content, info: {...content.info, description: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 outline-none text-sm resize-none" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">CNPJ e Endereço Físico</label>
                          <textarea rows="4" value={content.info.cnpj} onChange={(e) => setContent({...content, info: {...content.info, cnpj: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 outline-none text-sm resize-none font-mono" />
                        </div>

                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                          <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Texto de Condições/Rodapé (Disclaimer)</label>
                          <textarea rows="5" value={content.info.disclaimer} onChange={(e) => setContent({...content, info: {...content.info, disclaimer: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 outline-none text-xs resize-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: MENUS */}
                {activeTab === "menus" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {content.menus.map((col, colIndex) => (
                      <div key={col.id} className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                        
                        {/* 🔥 Input de Título da Coluna Editável */}
                        <div className="mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Título da Coluna {colIndex + 1}</label>
                          <input 
                            type="text" 
                            value={col.title} 
                            onChange={(e) => updateColTitle(colIndex, e.target.value)} 
                            placeholder="Ex: INSTITUCIONAL"
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm font-black uppercase tracking-wider focus:border-blue-500 transition-colors" 
                          />
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          {col.links.map((link, linkIndex) => (
                            <div key={link.id} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <GripVertical size={16} className="text-zinc-400 cursor-grab" />
                              <input 
                                type="text" placeholder="Nome do Link" 
                                value={link.label} onChange={(e) => updateLink(colIndex, link.id, "label", e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                              />
                              <input 
                                type="text" placeholder="URL (/sobre)" 
                                value={link.url} onChange={(e) => updateLink(colIndex, link.id, "url", e.target.value)}
                                className="flex-1 bg-transparent border-l border-zinc-200 dark:border-zinc-700 pl-2 outline-none text-xs text-zinc-500"
                              />
                              <button onClick={() => removeLink(colIndex, link.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <button onClick={() => addLink(colIndex)} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 rounded-lg flex items-center gap-1 transition-colors w-full justify-center">
                          <Plus size={14} /> Adicionar Link nesta Coluna
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ABA: SOCIAL & APPS */}
                {activeTab === "social" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-pink-500 rounded-full" /> Redes Sociais
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300"><Facebook size={18}/></div>
                          <input type="text" placeholder="URL do Facebook" value={content.social.facebook} onChange={(e) => setContent({...content, social: {...content.social, facebook: e.target.value}})} className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300"><Instagram size={18}/></div>
                          <input type="text" placeholder="URL do Instagram" value={content.social.instagram} onChange={(e) => setContent({...content, social: {...content.social, instagram: e.target.value}})} className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300"><Linkedin size={18}/></div>
                          <input type="text" placeholder="URL do LinkedIn" value={content.social.linkedin} onChange={(e) => setContent({...content, social: {...content.social, linkedin: e.target.value}})} className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300"><Youtube size={18}/></div>
                          <input type="text" placeholder="URL do YouTube" value={content.social.youtube} onChange={(e) => setContent({...content, social: {...content.social, youtube: e.target.value}})} className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-10 outline-none text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <div className="w-2 h-6 bg-emerald-500 rounded-full" /> Aplicativos Mobile
                        </h2>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs font-bold text-zinc-500">Exibir Apps?</span>
                          <input type="checkbox" checked={content.apps.show} onChange={(e) => setContent({...content, apps: {...content.apps, show: e.target.checked}})} className="w-4 h-4 accent-emerald-600" />
                        </label>
                      </div>
                      
                      {content.apps.show && (
                        <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Google Play Store URL</label>
                            <input type="text" value={content.apps.playStore} onChange={(e) => setContent({...content, apps: {...content.apps, playStore: e.target.value}})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 h-10 outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Apple App Store URL</label>
                            <input type="text" value={content.apps.appStore} onChange={(e) => setContent({...content, apps: {...content.apps, appStore: e.target.value}})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 h-10 outline-none text-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE PREVIEW (DIREITA) */}
              <div className="lg:col-span-4 hidden lg:block">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sticky top-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center justify-center gap-2">
                    <MonitorPlay size={14} className="text-blue-500" /> Live Preview
                  </h3>
                  
                  {/* Container do Footer Renderizado Minitura */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-[#0A0B10] flex flex-col pt-6 pb-2 px-4 shadow-2xl relative">
                    
                    {/* Linha 1: Menus (4 colunas) */}
                    <div className="grid grid-cols-4 gap-2 mb-8">
                      {content.menus.map((col, i) => (
                        <div key={i}>
                          <h4 className="text-white text-[5px] font-black uppercase mb-3 leading-tight truncate">{col.title || "TÍTULO"}</h4>
                          <div className="flex flex-col gap-2">
                            {col.links.map((link) => (
                              <span key={link.id} className="text-zinc-400 text-[5px] whitespace-nowrap overflow-hidden text-ellipsis">{link.label}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Linha 2: Info + Pagamentos/Redes + Seguranca/Apps */}
                    <div className="grid grid-cols-3 gap-4 mb-8 border-t border-white/5 pt-6">
                      
                      {/* Coluna Esq: Logo e Endereço */}
                      <div className="col-span-1">
                        {content.info.logoUrl ? (
                          <img src={content.info.logoUrl} className="h-4 mb-3" alt="Logo" />
                        ) : (
                          <h3 className="text-white font-black text-[10px] mb-3">{content.info.companyName}</h3>
                        )}
                        <p className="text-zinc-400 text-[4px] leading-relaxed mb-3 pr-2">{content.info.description}</p>
                        <p className="text-zinc-500 text-[4px] leading-relaxed whitespace-pre-wrap">{content.info.cnpj}</p>
                      </div>

                      {/* Coluna Meio: Pagamento e Redes */}
                      <div className="col-span-1">
                        <h4 className="text-white text-[6px] font-bold mb-2">Formas de Pagamento</h4>
                        <div className="flex gap-1 mb-4">
                          <div className="border border-white/10 rounded px-1.5 py-0.5 text-white flex items-center gap-0.5"><CreditCard size={6} /><span className="text-[4px]">Crédito</span></div>
                          <div className="bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded text-[4px] font-bold">PIX</div>
                          <div className="border border-white/10 rounded px-1.5 py-0.5 text-white text-[4px]">Boleto</div>
                        </div>

                        <h4 className="text-white text-[6px] font-bold mb-2">Siga nossas Redes</h4>
                        <div className="flex gap-1.5 text-zinc-400">
                          {content.social.facebook && <Facebook size={8} />}
                          {content.social.instagram && <Instagram size={8} />}
                          {content.social.linkedin && <Linkedin size={8} />}
                          {content.social.youtube && <Youtube size={8} />}
                        </div>
                      </div>

                      {/* Coluna Dir: Segurança e Apps */}
                      <div className="col-span-1">
                        <h4 className="text-white text-[6px] font-bold mb-2">Site 100% Seguro</h4>
                        <div className="flex flex-col gap-1.5 mb-4">
                          <div className="flex items-start gap-1">
                            <ShieldCheck size={8} className="text-emerald-500" />
                            <div><div className="text-white text-[5px] font-bold leading-none">SAFE BROWSING</div><div className="text-zinc-500 text-[4px]">Site verificado</div></div>
                          </div>
                          <div className="flex items-start gap-1">
                            <ShieldCheck size={8} className="text-blue-500" />
                            <div><div className="text-white text-[5px] font-bold leading-none">SSL CERTIFICADO</div><div className="text-zinc-500 text-[4px]">Criptografia</div></div>
                          </div>
                        </div>

                        {content.apps.show && (
                          <>
                            <h4 className="text-white text-[6px] font-bold mb-2">Baixe o Aplicativo</h4>
                            <div className="flex gap-1">
                              <div className="border border-white/10 rounded p-1 flex items-center gap-1 text-white">
                                <Smartphone size={8} />
                                <div><div className="text-[3px] leading-none text-zinc-400">DISPONÍVEL NO</div><div className="text-[4px] font-bold leading-none">Google Play</div></div>
                              </div>
                              <div className="border border-white/10 rounded p-1 flex items-center gap-1 text-white">
                                <Smartphone size={8} />
                                <div><div className="text-[3px] leading-none text-zinc-400">BAIXAR NA</div><div className="text-[4px] font-bold leading-none">App Store</div></div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Linha 3: Disclaimer e Copyright (Rodapé do Rodapé) */}
                    <div className="border-t border-white/5 pt-4 text-center">
                      <p className="text-zinc-500 text-[4px] leading-relaxed max-w-[90%] mx-auto mb-4">{content.info.disclaimer}</p>
                      
                      {/* COPYRIGHT FIXO RAIZAN CORE */}
                      <p className="text-zinc-600 text-[5px] font-medium">
                        © {new Date().getFullYear()} Raizan Comércio e Tecnologia S.A. - Todos os direitos reservados.
                      </p>
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