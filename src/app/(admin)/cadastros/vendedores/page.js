"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getHubUrl, getHeaders } from "@/components/utils/api"; 
import { 
  Users, RefreshCw, Search, Key, ShieldCheck, 
  Mail, X, Lock, UserCog, Ban, CheckCircle, AlertTriangle,
  LayoutGrid, List, ChevronRight, TrendingUp, Target, DollarSign, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// 🟢 IMPORTAÇÃO DOS SEUS NOVOS COMPONENTES PREMIUM AQUI!
import TabContaFlex from "@/components/vendedores/flex";
import TabComissoes from "@/components/vendedores/comissao";
import TabMetasCampanhas from "@/components/vendedores/metas";
import TabVisaoGeral from "@/components/vendedores/relatorio";

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [busca, setBusca] = useState("");
  
  const [viewMode, setViewMode] = useState("list"); 

  const [modalAberto, setModalAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");

  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [vendedorParaBloquear, setVendedorParaBloquear] = useState(null);

  // 🟢 NOVO ESTADO: CONTROLE DO PAINEL LATERAL DE DETALHES
  const [painelAberto, setPainelAberto] = useState(false);
  const [vendedorDetalhe, setVendedorDetalhe] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  const carregarVendedores = async () => {
    setLoading(true);
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      if (!tenant_id) return;

      const res = await fetch(`${getHubUrl()}/api/hub/vendedores?tenant_id=${tenant_id}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      
      if (data.success) {
        setVendedores(data.vendedores || []);
      }
    } catch (error) {
      toast.error("Erro ao carregar vendedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVendedores();
  }, []);

  const handleSincronizarERP = async () => {
    setSincronizando(true);
    const toastId = toast.loading("Verificando regras e sincronizando com ERP...");
    
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      const res = await fetch(`${getHubUrl()}/api/hub/vendedores/sync`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ tenant_id })
      });
      
      const data = await res.json();

      if (data.success) {
        toast.success(data.message, { id: toastId });
        carregarVendedores(); 
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (error) {
      toast.error("Falha ao conectar com o Servidor Mestre.", { id: toastId });
    } finally {
      setSincronizando(false);
    }
  };

  const handleSalvarSenha = async (e) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const toastId = toast.loading("Salvando credenciais no servidor...");
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/vendedores/${vendedorSelecionado.id}/senha`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ senha: novaSenha })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Senha atualizada para ${vendedorSelecionado.nome}!`, { id: toastId });
        setModalAberto(false);
        setNovaSenha("");
        carregarVendedores(); 
      } else {
        toast.error("Erro ao atualizar senha.", { id: toastId });
      }
    } catch (error) {
      toast.error("Erro de conexão.", { id: toastId });
    }
  };

  const abrirModalSenha = (vendedor, e) => {
    if(e) e.stopPropagation(); // Evita abrir o painel lateral
    setVendedorSelecionado(vendedor);
    setNovaSenha("");
    setModalAberto(true);
  };

  const abrirModalBloqueio = (vendedor, e) => {
    if(e) e.stopPropagation(); // Evita abrir o painel lateral
    setVendedorParaBloquear(vendedor);
    setModalBloqueioAberto(true);
  };

  // 🟢 NOVA FUNÇÃO: ABRIR O PAINEL DE DETALHES
  const abrirDetalhes = (vendedor) => {
    setVendedorDetalhe(vendedor);
    setAbaAtiva('resumo'); // Sempre abre na aba de resumo
    setPainelAberto(true);
  };

  const confirmarBloqueio = async () => {
    if (!vendedorParaBloquear) return;

    const acao = vendedorParaBloquear.status_app === "bloqueado" ? "ativo" : "bloqueado";
    const toastId = toast.loading(`Processando alteração de status...`);
    
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/vendedores/${vendedorParaBloquear.id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status_app: acao })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Acesso ${acao === "bloqueado" ? "bloqueado" : "liberado"} com sucesso!`, { id: toastId });
        setModalBloqueioAberto(false);
        setVendedorParaBloquear(null);
        carregarVendedores(); 
      } else {
        toast.error("Erro ao alterar status.", { id: toastId });
      }
    } catch (error) {
      toast.error("Falha na comunicação com o servidor.", { id: toastId });
    }
  };

  const vendedoresFiltrados = vendedores.filter(v => 
    v.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (v.email && v.email.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 font-sans selection:bg-purple-500/30 transition-colors duration-300">
      <Toaster position="top-right" />
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 p-5 md:p-6 rounded-2xl shadow-sm transition-colors"
            >
              <div>
                <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 transition-colors">
                  <UserCog className="text-purple-600 dark:text-purple-500" size={24} />
                  Força de Vendas
                </h1>
                <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">
                  Gerencie seus vendedores e os acessos ao aplicativo Mobile.
                </p>
              </div>

              <button 
                onClick={handleSincronizarERP}
                disabled={sincronizando}
                className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 hover:border-purple-500/50 shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={sincronizando ? "animate-spin text-purple-600 dark:text-purple-400" : "text-zinc-500 dark:text-zinc-400"} />
                {sincronizando ? "Sincronizando..." : "Sincronizar com ERP"}
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-zinc-400 dark:text-zinc-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar vendedor por nome ou e-mail..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-white py-3 pl-11 pr-4 rounded-xl text-sm outline-none focus:border-purple-500/50 dark:focus:bg-[#18181b] transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium"
                  />
                </div>

                <div className="flex bg-white dark:bg-[#121214] p-1 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm shrink-0">
                  <button 
                    onClick={() => setViewMode('grid')} 
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                    title="Exibir em Cards"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                    title="Exibir em Lista"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400">
                  <RefreshCw size={28} className="animate-spin mb-4 text-purple-600 dark:text-purple-500" />
                  <p className="font-bold tracking-wider uppercase text-xs">Buscando equipe...</p>
                </div>
              ) : vendedoresFiltrados.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 rounded-2xl transition-colors shadow-sm dark:shadow-none">
                  <Users size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4 transition-colors" />
                  <h3 className="text-lg font-black text-zinc-700 dark:text-zinc-300 transition-colors">Nenhum vendedor encontrado</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 font-medium transition-colors">Sincronize com o ERP ou verifique o filtro de busca.</p>
                </div>
              ) : (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {vendedoresFiltrados.map((vendedor) => (
                      <div 
                        key={vendedor.id} 
                        onClick={() => abrirDetalhes(vendedor)}
                        className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-4 hover:border-purple-500/50 dark:hover:border-purple-500/40 transition-all duration-300 shadow-sm flex flex-col h-full relative cursor-pointer group"
                      >
                        <div className="absolute top-3 right-3 flex gap-1">
                          {vendedor.status_app === "bloqueado" ? (
                            <span className="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-1.5 rounded-md" title="Bloqueado"><Ban size={14} /></span>
                          ) : vendedor.tem_senha ? (
                            <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-1.5 rounded-md" title="App Liberado"><ShieldCheck size={14} /></span>
                          ) : (
                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 p-1.5 rounded-md" title="Sem Acesso"><Lock size={14} /></span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-4 pr-8">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200 dark:border-zinc-700 group-hover:scale-105 transition-transform">
                            {vendedor.foto ? (
                              <img src={vendedor.foto} alt={vendedor.nome} className="w-full h-full object-cover" />
                            ) : (
                              <Users size={18} className="text-zinc-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{vendedor.nome}</h3>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Cod: {vendedor.codigo_erp}</p>
                          </div>
                        </div>

                        <div className="mb-4 flex-1">
                          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-[#0c0c0e]/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <Mail size={12} className="shrink-0 text-zinc-400" />
                            <span className="truncate">{vendedor.email || "Sem e-mail"}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button onClick={(e) => abrirModalSenha(vendedor, e)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${vendedor.tem_senha ? "bg-white dark:bg-[#121214] border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800" : "bg-purple-50 dark:bg-purple-600/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100"}`}>
                            <Key size={14} /> {vendedor.tem_senha ? "Senha" : "Criar Acesso"}
                          </button>
                          
                          {vendedor.tem_senha ? (
                            <button onClick={(e) => abrirModalBloqueio(vendedor, e)} title={vendedor.status_app === "bloqueado" ? "Desbloquear" : "Bloquear"} className={`w-9 shrink-0 flex items-center justify-center rounded-lg border transition-all ${vendedor.status_app === "bloqueado" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600"}`}>
                              {vendedor.status_app === "bloqueado" ? <CheckCircle size={14} /> : <Ban size={14} />}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {vendedoresFiltrados.map((vendedor) => (
                      <div 
                        key={vendedor.id} 
                        onClick={() => abrirDetalhes(vendedor)}
                        className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-white/5 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/50 transition-all shadow-sm cursor-pointer group"
                      >
                        
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center shrink-0 overflow-hidden border border-zinc-200 dark:border-zinc-700 hidden sm:flex group-hover:scale-105 transition-transform">
                            {vendedor.foto ? (
                              <img src={vendedor.foto} alt={vendedor.nome} className="w-full h-full object-cover" />
                            ) : (
                              <Users size={18} className="text-zinc-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {vendedor.nome}
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-normal">
                                {vendedor.codigo_erp}
                              </span>
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                              <Mail size={12} className="shrink-0" />
                              <span className="truncate">{vendedor.email || "Sem e-mail"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full">
                          <div className="flex gap-1.5">
                            {vendedor.status_app === "bloqueado" ? (
                              <span className="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1"><Ban size={12} /> <span className="hidden lg:inline">Bloqueado</span></span>
                            ) : vendedor.tem_senha ? (
                              <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1"><ShieldCheck size={12} /> <span className="hidden lg:inline">App Liberado</span></span>
                            ) : (
                              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1"><Lock size={12} /> <span className="hidden lg:inline">Sem Acesso</span></span>
                            )}
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={(e) => abrirModalSenha(vendedor, e)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${vendedor.tem_senha ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800" : "bg-purple-50 dark:bg-purple-600/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100"}`}>
                              <Key size={14} /> <span className="hidden md:inline">{vendedor.tem_senha ? "Senha" : "Criar Acesso"}</span>
                            </button>
                            
                            {vendedor.tem_senha ? (
                              <button onClick={(e) => abrirModalBloqueio(vendedor, e)} title={vendedor.status_app === "bloqueado" ? "Desbloquear" : "Bloquear"} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${vendedor.status_app === "bloqueado" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600"}`}>
                                {vendedor.status_app === "bloqueado" ? <CheckCircle size={14} /> : <Ban size={14} />}
                              </button>
                            ) : null}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )
              )}
            </motion.div>

          </div>
        </main>
        
        {/* ========================================================= */}
        {/* 🟢 O FLOATING DRAWER: PAINEL DE DETALHES PREMIUM 🟢 */}
        {/* ========================================================= */}
        <AnimatePresence>
          {painelAberto && vendedorDetalhe && (
            <>
              {/* Fundo Escuro Blur */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setPainelAberto(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
              />
              
              {/* O Painel Flutuante Arredondado */}
              <motion.div 
                initial={{ x: "120%" }} animate={{ x: 0 }} exit={{ x: "120%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-3 right-3 sm:top-4 sm:right-4 bottom-3 sm:bottom-4 h-[calc(100vh-24px)] sm:h-[calc(100vh-32px)] w-[calc(100%-24px)] sm:w-full max-w-2xl bg-white dark:bg-[#0c0c0e] shadow-2xl z-[100] border border-zinc-200 dark:border-zinc-800/80 rounded-3xl flex flex-col overflow-hidden"
              >
                {/* Cabeçalho do Painel */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#121214]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-zinc-300 dark:border-zinc-700">
                      {vendedorDetalhe.foto ? (
                        <img src={vendedorDetalhe.foto} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={24} className="text-zinc-400 m-auto mt-4" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white">{vendedorDetalhe.nome}</h2>
                      <p className="text-sm font-mono text-zinc-500">Cód: {vendedorDetalhe.codigo_erp}</p>
                    </div>
                  </div>
                  
                  <button onClick={() => setPainelAberto(false)} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Navegação de Abas (Tabs) */}
                <div className="flex px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto custom-scrollbar bg-white dark:bg-[#0c0c0e]">
                  <TabButton id="resumo" icon={TrendingUp} label="Visão Geral" active={abaAtiva} onClick={setAbaAtiva} />
                  <TabButton id="metas" icon={Target} label="Metas & Campanhas" active={abaAtiva} onClick={setAbaAtiva} />
                  <TabButton id="comissoes" icon={DollarSign} label="Comissões" active={abaAtiva} onClick={setAbaAtiva} />
                  <TabButton id="contaflex" icon={Wallet} label="Conta Flex" active={abaAtiva} onClick={setAbaAtiva} />
                </div>

                {/* Área de Conteúdo Scrollável */}
                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 dark:bg-[#09090b]/50">
                  {abaAtiva === 'resumo' && <TabVisaoGeral vendedor={vendedorDetalhe} />}
                  {abaAtiva === 'metas' && <TabMetasCampanhas vendedor={vendedorDetalhe} />}
                  {abaAtiva === 'comissoes' && <TabComissoes vendedor={vendedorDetalhe} />}
                  {abaAtiva === 'contaflex' && <TabContaFlex vendedor={vendedorDetalhe} />}
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>

      {/* OS MODAIS ANTIGOS CONTINUAM AQUI EMBAIXO INTACTOS */}
      {modalAberto && vendedorSelecionado && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-colors">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 transition-colors">
            
            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <div className="mb-6 pr-8">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-500/20 mb-4 transition-colors">
                <Key size={24} className="text-purple-600 dark:text-purple-400 transition-colors" />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white transition-colors">Credenciais do App</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">
                Defina a senha para <strong className="text-zinc-800 dark:text-zinc-200">{vendedorSelecionado.nome}</strong> acessar o aplicativo de força de vendas.
              </p>
            </div>

            <form onSubmit={handleSalvarSenha} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2 block transition-colors">Login (E-mail)</label>
                <div className="bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-zinc-800/80 text-zinc-500 p-3.5 rounded-xl text-sm font-medium cursor-not-allowed transition-colors">
                  {vendedorSelecionado.email || "E-mail precisa ser cadastrado no ERP!"}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2 block transition-colors">Nova Senha</label>
                <input
                  type="text"
                  placeholder="Mínimo 6 caracteres..."
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white p-3.5 rounded-xl text-sm outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={!vendedorSelecionado.email}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(124,58,237,0.3)] dark:shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {modalBloqueioAberto && vendedorParaBloquear && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-colors">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center flex flex-col items-center relative animate-in zoom-in-95 duration-200 transition-colors">
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
              vendedorParaBloquear.status_app === "bloqueado" 
                ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}>
              {vendedorParaBloquear.status_app === "bloqueado" ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
            </div>
            
            <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2 transition-colors">
              {vendedorParaBloquear.status_app === "bloqueado" ? "Liberar Acesso?" : "Bloquear Acesso?"}
            </h2>
            
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 transition-colors">
              Tem certeza que deseja {vendedorParaBloquear.status_app === "bloqueado" ? "desbloquear" : "bloquear"} o acesso de <strong className="text-zinc-800 dark:text-zinc-200">{vendedorParaBloquear.nome}</strong> ao App?
            </p>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setModalBloqueioAberto(false)} 
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarBloqueio} 
                className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors ${
                  vendedorParaBloquear.status_app === "bloqueado"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                    : "bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20"
                }`}
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// =========================================================================
// 🟢 COMPONENTES AUXILIARES DAS ABAS (NO FUTURO, JOGAR EM ARQUIVOS SEPARADOS)
// =========================================================================

const TabButton = ({ id, icon: Icon, label, active, onClick }) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
      active === id 
        ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500" 
        : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);