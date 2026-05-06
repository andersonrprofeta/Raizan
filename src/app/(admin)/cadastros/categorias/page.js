"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  FolderTree, Plus, Trash2, Loader2, Search, 
  CornerDownRight, CheckCircle2, AlignLeft, Hash,
  ChevronRight, ChevronDown, AlertTriangle
} from "lucide-react";
import toast from 'react-hot-toast';

export default function CategoriasHub() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState({});
  
  // Estados para Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [catParaExcluir, setCatParaExcluir] = useState(null); // 🔥 Controla o modal de exclusão moderno
  const [salvando, setSalvando] = useState(false);

  const [novaCategoria, setNovaCategoria] = useState({
    nome: "", slug: "", categoria_pai_id: "", descricao: ""
  });

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    const tenantId = pegarCnpjLogado();
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/categorias", {
        headers: { "x-tenant-id": tenantId }
      });
      const data = await res.json();
      if (data.success) setCategorias(data.categorias);
    } catch (error) {
      toast.error("Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  };

  const salvarCategoria = async () => {
    if (!novaCategoria.nome.trim()) return toast.error("Nome é obrigatório!");
    const tenantId = pegarCnpjLogado();

    setSalvando(true);
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ ...novaCategoria, categoria_pai_id: novaCategoria.categoria_pai_id || null })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setModalAberto(false);
        setNovaCategoria({ nome: "", slug: "", categoria_pai_id: "", descricao: "" });
        carregarCategorias();
      } else toast.error(data.message);
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally { setSalvando(false); }
  };

  // 🔥 Função de Exclusão Refatorada (Sem Alerta do Windows)
  const confirmarExclusao = async () => {
    if (!catParaExcluir) return;
    const tenantId = pegarCnpjLogado();

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/categorias/${catParaExcluir.id}`, {
        method: "DELETE",
        headers: { "x-tenant-id": tenantId }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setCategorias(categorias.filter(c => c.id !== catParaExcluir.id));
      } else toast.error(data.message);
    } catch (error) { toast.error("Erro ao excluir."); }
    finally { setCatParaExcluir(null); }
  };

  const toggleCategoria = (id) => {
    setAbertas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categoriasPrincipais = categorias.filter(c => !c.categoria_pai_id);
  const subcategorias = categorias.filter(c => c.categoria_pai_id);
  const categoriasFiltradas = categoriasPrincipais.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <FolderTree size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight">Categorias</h1>
                  <p className="text-xs text-zinc-500">Gestão de departamentos • {pegarCnpjLogado()}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalAberto(true)}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-purple-500/10"
              >
                <Plus size={18} /> Nova Categoria
              </button>
            </div>

            {/* BUSCA */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-500 transition-colors" size={18} />
              <input 
                type="text" placeholder="Filtrar categorias principais..." 
                value={busca} onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 px-11 py-3.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
              />
            </div>

            {/* LISTA */}
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 size={32} className="text-purple-600 animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {categoriasFiltradas.map((catPai) => {
                      const filhas = subcategorias.filter(sub => sub.categoria_pai_id === catPai.id);
                      const isAberta = abertas[catPai.id];
                      
                      return (
                        <div key={catPai.id}>
                          <div className={`flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group cursor-pointer`}
                               onClick={() => toggleCategoria(catPai.id)}>
                            <div className="flex items-center gap-3">
                              <div className="text-zinc-400">
                                {filhas.length > 0 ? (isAberta ? <ChevronDown size={20} /> : <ChevronRight size={20} />) : <div className="w-5" />}
                              </div>
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${isAberta ? 'bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:border-purple-500/30 text-purple-600' : 'bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-500'}`}>
                                <FolderTree size={16} />
                              </div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100">{catPai.nome}</p>
                            </div>
                            
                            <button onClick={(e) => { e.stopPropagation(); setCatParaExcluir(catPai); }} 
                                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {isAberta && filhas.length > 0 && (
                            <div className="bg-zinc-50/30 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800/40 animate-in slide-in-from-top-2">
                              {filhas.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between p-3 pl-16 hover:bg-white dark:hover:bg-zinc-800/40 transition-colors group/sub">
                                  <div className="flex items-center gap-3">
                                    <CornerDownRight size={16} className="text-zinc-300 dark:text-zinc-600" />
                                    <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">{sub.nome}</p>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); setCatParaExcluir(sub); }} 
                                          className="p-1.5 text-zinc-400 hover:text-rose-500 opacity-0 group-hover/sub:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>

      {/* 🔥 MODAL DE EXCLUSÃO PREMIUM (Substitui o alerta do navegador) */}
      {catParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in" onClick={() => setCatParaExcluir(null)}>
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5 border border-red-100 dark:border-red-500/20">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Excluir Categoria</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8">
              Tem certeza que deseja remover <b className="text-zinc-700 dark:text-zinc-300">{catParaExcluir.nome}</b>? Isso pode afetar os produtos vinculados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCatParaExcluir(null)} className="flex-1 px-5 py-2.5 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
              <button onClick={confirmarExclusao} className="flex-1 px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-500/20 transition-all active:scale-95">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA CATEGORIA */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-black text-xl mb-6">Nova Categoria</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-500">Nome</label>
                <input type="text" value={novaCategoria.nome} onChange={(e) => setNovaCategoria({...novaCategoria, nome: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-purple-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-500">Categoria Pai</label>
                <select value={novaCategoria.categoria_pai_id} onChange={(e) => setNovaCategoria({...novaCategoria, categoria_pai_id: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-purple-500 transition-all">
                  <option value="">Nenhuma (Principal)</option>
                  {categoriasPrincipais.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setModalAberto(false)} className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancelar</button>
              <button onClick={salvarCategoria} disabled={salvando} className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                {salvando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}