"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Tag, Plus, Trash2, Search, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function MarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");

  const fetchMarcas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/marcas`);
      const data = await res.json();
      if (data.success) {
        setMarcas(data.marcas);
      } else {
        toast.error("Erro ao carregar marcas.");
      }
    } catch (error) {
      console.error("Erro ao buscar marcas:", error);
      toast.error("Falha na comunicação com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const gerarSlug = (texto) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleNomeChange = (e) => {
    const novoNome = e.target.value;
    setNome(novoNome);
    if (!slug || slug === gerarSlug(nome)) {
      setSlug(gerarSlug(novoNome));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("O nome da marca é obrigatório!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/marcas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          slug: slug.trim() || gerarSlug(nome),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Marca cadastrada com sucesso!");
        setNome("");
        setSlug("");
        fetchMarcas();
      } else {
        toast.error(data.message || "Erro ao cadastrar marca.");
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast.error("Falha ao salvar a marca.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, nomeMarca) => {
    if (!window.confirm(`Tem certeza que deseja excluir a marca "${nomeMarca}"?`)) {
      return;
    }

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/marcas/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Marca excluída!");
        setMarcas((prev) => prev.filter((m) => m.id !== id));
      } else {
        toast.error(data.message || "Erro ao excluir.");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Falha ao tentar excluir a marca.");
    }
  };

  const marcasFiltradas = marcas.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      
      {/* OS COMPONENTES QUE ESTAVAM FALTANDO! */}
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            {/* HEADER DA PÁGINA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 rounded-xl border border-purple-200 dark:border-purple-500/20">
                    <Tag className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                  Gestão de Marcas
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                  Cadastre as marcas dos produtos vendidos no seu e-commerce. Manter este cadastro organizado facilita a filtragem para seus clientes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* FORMULÁRIO DE CADASTRO */}
              <div className="lg:col-span-1 space-y-6">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-5 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                    Nova Marca
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nome Oficial</label>
                      <input
                        type="text"
                        placeholder="Ex: Nike, NUEV, Apple"
                        value={nome}
                        onChange={handleNomeChange}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-400 shadow-sm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Slug (URL)</label>
                      </div>
                      <input
                        type="text"
                        placeholder="ex-nome-da-marca"
                        value={slug}
                        onChange={(e) => setSlug(gerarSlug(e.target.value))}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-400 shadow-sm"
                      />
                      <p className="text-[11px] text-zinc-500 flex items-start gap-1 mt-1">
                        <Info size={12} className="shrink-0 mt-0.5" /> 
                        Gerado automaticamente. Usado na URL amigável do site.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(147,51,234,0.25)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <><Plus size={18} /> Salvar Marca</>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* LISTAGEM DE MARCAS */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-sm min-h-[400px] flex flex-col">
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="text"
                        placeholder="Buscar marcas cadastradas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                    <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shrink-0">
                      {marcasFiltradas.length} {marcasFiltradas.length === 1 ? 'marca' : 'marcas'}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-200 dark:border-zinc-800/50"></div>
                        ))}
                      </div>
                    ) : marcasFiltradas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                          <Tag className="text-zinc-400 dark:text-zinc-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">Nenhuma marca encontrada</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-sm">
                          {searchTerm ? "Tente buscar com outro termo." : "Você ainda não possui nenhuma marca cadastrada. Use o formulário ao lado para adicionar a primeira."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {marcasFiltradas.map((marca) => (
                          <div 
                            key={marca.id} 
                            className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 hover:border-purple-300 dark:hover:border-purple-500/50 rounded-xl transition-all group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                                <span className="font-black text-purple-600 dark:text-purple-400">{marca.nome.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{marca.nome}</h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-0.5">/{marca.slug}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDelete(marca.id, marca.nome)}
                              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                              title="Excluir marca"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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