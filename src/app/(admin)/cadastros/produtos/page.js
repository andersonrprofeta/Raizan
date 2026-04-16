"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Package, Search, Plus, Edit, Trash2, 
  Image as ImageIcon, Loader2, Filter, Globe,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

export default function ListaProdutosHub() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    // Simulando busca de dados do seu banco na nuvem
    setTimeout(() => {
      setProdutos([
        { id: 1, sku: "TEN-NIKE-01", nome: "Tênis Nike Air Max Pro", preco: 599.90, estoque: 45, status: 'ativo', canais: ['woo', 'shopee'] },
        { id: 2, sku: "CAM-SKT-02", nome: "Camiseta Skatista Black", preco: 89.90, estoque: 12, status: 'ativo', canais: ['woo'] },
        { id: 3, sku: "MOQ-OAK-05", nome: "Mochila Oakley Enduro", preco: 349.50, estoque: 0, status: 'inativo', canais: [] },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* CABEÇALHO PADRÃO PREMIUM (INSPIRADO NA REFERÊNCIA) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300 gap-4">
              
              {/* Efeito Glow Opcional no background */}
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 transition-colors">
                  <Package size={28} className="text-purple-600 dark:text-purple-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate transition-colors">Catálogo Master (Hub)</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Gerencie sua base de produtos global na nuvem.</p>
                </div>
              </div>
              
              <Link href="/cadastros/produtos/novo" className="w-full sm:w-auto relative z-10">
                <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-95">
                  <Plus size={18} /> Novo Produto
                </button>
              </Link>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none transition-colors">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por Nome ou SKU..." 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium"
                />
              </div>
              <button className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-zinc-200 dark:border-zinc-700 shadow-sm dark:shadow-none">
                <Filter size={18} /> Filtros Avançados
              </button>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl overflow-hidden shadow-md dark:shadow-2xl relative transition-colors">
              {loading && (
                <div className="absolute inset-0 z-20 bg-white/60 dark:bg-[#0c0c0e]/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" />
                </div>
              )}

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center uppercase tracking-wider text-xs">Imagem</th>
                      <th className="px-6 py-4 uppercase tracking-wider text-xs">Informações do Produto</th>
                      <th className="px-6 py-4 text-right uppercase tracking-wider text-xs">Preço de Venda</th>
                      <th className="px-6 py-4 text-center uppercase tracking-wider text-xs">Estoque</th>
                      <th className="px-6 py-4 text-center uppercase tracking-wider text-xs">Integrações</th>
                      <th className="px-6 py-4 text-center uppercase tracking-wider text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 transition-colors">
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors group">
                        
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:border-purple-300 dark:group-hover:border-purple-500/30 transition-all shadow-sm dark:shadow-none">
                            <ImageIcon size={20} className="text-zinc-400 dark:text-zinc-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-900 dark:text-zinc-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors text-base">{produto.nome}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 uppercase font-bold transition-colors">SKU: {produto.sku}</span>
                            <span className={`w-2 h-2 rounded-full ${produto.status === 'ativo' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-600'}`}></span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <p className="font-black text-lg text-zinc-900 dark:text-zinc-100 transition-colors">{formatarMoeda(produto.preco)}</p>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border transition-colors ${produto.estoque > 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                            {produto.estoque} em estoque
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             {/* Simulando ícones dos canais com versão clara e escura ajustada */}
                             <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:border-blue-400 dark:hover:border-purple-500 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all cursor-help shadow-sm dark:shadow-none" title="WooCommerce">
                               <Globe size={14} className="text-blue-600 dark:text-blue-400" />
                             </div>
                             {produto.canais.includes('shopee') && (
                               <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 transition-all cursor-help shadow-sm dark:shadow-none" title="Shopee">
                                 <Package size={14} className="text-orange-600 dark:text-orange-500" />
                               </div>
                             )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 bg-white dark:bg-transparent border border-zinc-200 dark:border-transparent hover:bg-purple-100 dark:hover:bg-purple-500/20 text-zinc-400 dark:text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all shadow-sm dark:shadow-none hover:shadow-md">
                              <Edit size={18} />
                            </button>
                            <button className="p-2 bg-white dark:bg-transparent border border-zinc-200 dark:border-transparent hover:bg-rose-100 dark:hover:bg-rose-500/20 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all shadow-sm dark:shadow-none hover:shadow-md">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}