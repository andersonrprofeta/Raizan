"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  FolderTree, Plus, Trash2, Loader2, Search, 
  CornerDownRight, CheckCircle2, AlignLeft, Hash
} from "lucide-react";
import toast from 'react-hot-toast';

export default function CategoriasHub() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  // Controle do Modal de Nova Categoria
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState({
    nome: "",
    slug: "",
    categoria_pai_id: "",
    descricao: ""
  });

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/categorias");
      const data = await res.json();
      if (data.success) {
        setCategorias(data.categorias);
      }
    } catch (error) {
      toast.error("Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  };

  const salvarCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      toast.error("O nome da categoria é obrigatório!");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaCategoria,
          categoria_pai_id: novaCategoria.categoria_pai_id || null
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setModalAberto(false);
        setNovaCategoria({ nome: "", slug: "", categoria_pai_id: "", descricao: "" });
        carregarCategorias(); // Recarrega a lista
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Erro ao salvar categoria.");
    } finally {
      setSalvando(false);
    }
  };

  const deletarCategoria = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) return;

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/categorias/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setCategorias(categorias.filter(c => c.id !== id));
      } else {
        // Exibe o aviso se tiver subcategorias amarradas!
        toast.error(data.message); 
      }
    } catch (error) {
      toast.error("Erro ao excluir categoria.");
    }
  };

  // Organiza as categorias para mostrar Filhas debaixo das Pais
  const categoriasPrincipais = categorias.filter(c => !c.categoria_pai_id);
  const subcategorias = categorias.filter(c => c.categoria_pai_id);

  // Filtro de busca na tela
  const categoriasFiltradas = categoriasPrincipais.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300 gap-4">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 transition-colors">
                  <FolderTree size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">Árvore de Categorias</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Organize seus produtos por departamentos e seções.</p>
                </div>
              </div>
              
              <button 
                onClick={() => setModalAberto(true)}
                className="w-full sm:w-auto relative z-10 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-95"
              >
                <Plus size={18} /> Nova Categoria
              </button>
            </div>

            {/* ÁREA DE BUSCA */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm dark:shadow-none transition-colors">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar categoria principal..." 
                  value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-purple-500 transition-all placeholder:text-zinc-400 font-medium"
                />
              </div>
            </div>

            {/* LISTA DE CATEGORIAS */}
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md dark:shadow-2xl overflow-hidden transition-colors min-h-[300px] relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-[#0c0c0e]/60 backdrop-blur-sm z-10">
                  <Loader2 size={32} className="text-purple-600 animate-spin" />
                </div>
              ) : categorias.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                  <FolderTree size={48} className="mb-4 opacity-20" />
                  <p>Nenhuma categoria cadastrada ainda.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {categoriasFiltradas.map((catPai) => {
                    // Pega as filhas dessa categoria específica
                    const filhas = subcategorias.filter(sub => sub.categoria_pai_id === catPai.id);
                    
                    return (
                      <div key={catPai.id} className="group transition-colors">
                        {/* CATEGORIA PAI */}
                        <div className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                              <FolderTree size={18} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{catPai.nome}</p>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">ID: {catPai.id}</span>
                                <span>/{catPai.slug}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button onClick={() => deletarCategoria(catPai.id, catPai.nome)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* SUBCATEGORIAS (Abaixo da Pai) */}
                        {filhas.length > 0 && (
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-800/40">
                            {filhas.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between p-3 pl-14 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors group/sub">
                                <div className="flex items-center gap-3">
                                  <CornerDownRight size={16} className="text-zinc-300 dark:text-zinc-600" />
                                  <div>
                                    <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">{sub.nome}</p>
                                    <p className="text-[10px] text-zinc-400">/{sub.slug}</p>
                                  </div>
                                </div>
                                <button onClick={() => deletarCategoria(sub.id, sub.nome)} className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover/sub:opacity-100">
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

      {/* 🟢 MODAL DE NOVA CATEGORIA */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FolderTree className="text-purple-600" size={20} /> Nova Categoria
              </h3>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2"><AlignLeft size={14}/> Nome da Categoria</label>
                <input 
                  type="text" placeholder="Ex: Roupas, Tênis, Maquiagem..."
                  value={novaCategoria.nome}
                  onChange={(e) => setNovaCategoria({...novaCategoria, nome: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-purple-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2"><FolderTree size={14}/> É subcategoria de qual?</label>
                <select 
                  value={novaCategoria.categoria_pai_id}
                  onChange={(e) => setNovaCategoria({...novaCategoria, categoria_pai_id: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-purple-500 outline-none transition-all"
                >
                  <option value="">Nenhuma (Será uma Categoria Principal)</option>
                  {categoriasPrincipais.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">Selecione apenas se esta categoria pertencer a um departamento maior.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2"><Hash size={14}/> Slug (Opcional)</label>
                <input 
                  type="text" placeholder="ex: roupas-de-inverno"
                  value={novaCategoria.slug}
                  onChange={(e) => setNovaCategoria({...novaCategoria, slug: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-purple-500 outline-none transition-all"
                />
                <p className="text-[11px] text-zinc-500">Se deixar em branco, o sistema criará automaticamente baseado no nome.</p>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
              <button 
                onClick={() => setModalAberto(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarCategoria} disabled={salvando}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {salvando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Salvar Categoria
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}