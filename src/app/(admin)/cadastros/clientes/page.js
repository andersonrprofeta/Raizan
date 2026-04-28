"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Users, Search, Plus, Edit, Trash2, 
  Mail, Phone, MapPin, Building2, User as UserIcon,
  Loader2, Filter, ArrowUpRight, MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

export default function ListaClientesHub() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/clientes");
      const data = await res.json();
      if (data.success) {
        setClientes(data.clientes);
      } else {
        toast.error("Falha ao carregar clientes.");
      }
    } catch (error) { 
      toast.error("Erro de conexão com o Hub."); 
    } finally { 
      setLoading(false); 
    }
  };

  const confirmarExclusao = async (id, nome) => {
    if(confirm(`Tem certeza que deseja excluir o cliente ${nome}?`)) {
      try {
        const res = await fetch(`https://api.raizan.com.br/api/hub/clientes/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          toast.success("Cliente removido!");
          setClientes(clientes.filter(c => c.id !== id));
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error("Erro ao excluir cliente.");
      }
    }
  };

  // Filtro de busca simples por Nome, Email ou CPF
  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    return (
      (c.nome && c.nome.toLowerCase().includes(termo)) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(termo))
    );
  });

  // Renderiza a Badge de Origem bonitinha
  const renderOrigem = (origem) => {
    const text = (origem || "manual").toLowerCase();
    if (text.includes("woo")) return <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">WooCommerce</span>;
    if (text.includes("raizan") || text.includes("site")) return <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-purple-200 dark:border-purple-500/20">Raizan Commerce</span>;
    return <span className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">Manual / PDV</span>;
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300 gap-4">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-emerald-100 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 transition-colors">
                  <Users size={28} className="text-emerald-600 dark:text-emerald-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate transition-colors">Base de Clientes</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Gerencie sua carteira de clientes integrada (CRM).</p>
                </div>
              </div>
              
              <Link href="/cadastros/clientes/novo" className="w-full sm:w-auto relative z-10">
                <button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95">
                  <Plus size={18} /> Novo Cliente
                </button>
              </Link>
            </div>

            {/* Busca */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none transition-colors">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar cliente por Nome, Email ou CPF/CNPJ..." 
                  value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Tabela de Clientes */}
            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-md dark:shadow-2xl relative transition-colors flex flex-col z-10">
              
              {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <Loader2 size={32} className="text-emerald-600 dark:text-emerald-500 animate-spin" />
                </div>
              ) : (
                <div className="w-full overflow-x-auto relative min-h-[350px]"> 
                  <table className="w-full min-w-[1000px] text-sm text-left relative z-20">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                      <tr>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs">Cliente</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs">Contato</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs">Documento</th>
                        <th className="px-6 py-4 text-center uppercase tracking-wider text-xs">Origem</th>
                        <th className="px-6 py-4 text-right uppercase tracking-wider text-xs">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 transition-colors">
                      
                      {clientesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-16 text-center text-zinc-500 dark:text-zinc-400">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Users size={32} className="text-zinc-300 dark:text-zinc-700" />
                              <p className="font-medium text-base">Nenhum cliente encontrado.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        clientesFiltrados.map((cliente) => (
                          <tr key={cliente.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors group">
                            
                            {/* Nome e Tipo */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black border border-emerald-200 dark:border-emerald-800/50">
                                  {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : <UserIcon size={18} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{cliente.nome}</span>
                                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                                    {cliente.tipo_pessoa === 'juridica' ? <><Building2 size={10}/> Pessoa Jurídica</> : <><UserIcon size={10}/> Pessoa Física</>}
                                  </span>
                                </div>
                              </div>
                            </td>
                            
                            {/* Contatos */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5 text-sm">
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                  <Mail size={14} className="text-zinc-400" /> {cliente.email || 'Não informado'}
                                </div>
                                {cliente.telefone && (
                                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                    <Phone size={14} className="text-zinc-400" /> {cliente.telefone}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Documento */}
                            <td className="px-6 py-4">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs border border-zinc-200 dark:border-zinc-700">
                                {cliente.cpf_cnpj || 'N/A'}
                              </span>
                            </td>
                            
                            {/* Origem */}
                            <td className="px-6 py-4 text-center">
                              {renderOrigem(cliente.origem)}
                            </td>
                            
                            {/* Ações */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/cadastros/clientes/editar?id=${cliente.id}`}>
                                  <button className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-600 rounded-lg shadow-sm transition-colors">
                                    <Edit size={16} />
                                  </button>
                                </Link>
                                <button 
                                  onClick={() => confirmarExclusao(cliente.id, cliente.nome)} 
                                  className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 rounded-lg shadow-sm transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}