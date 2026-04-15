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
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* CABEÇALHO COM BOTÃO NOVO (ROXO NEON) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                  <Package className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> 
                  Catálogo Master (Hub)
                </h1>
                <p className="text-sm text-zinc-500 mt-1">Gerencie sua base de produtos global na nuvem.</p>
              </div>
              
              <Link href="/cadastros/produtos/novo">
                <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all">
                  <Plus size={18} /> Novo Produto
                </button>
              </Link>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por Nome ou SKU..." 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                />
              </div>
              <button className="bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-zinc-700">
                <Filter size={18} /> Filtros Avançados
              </button>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="border border-zinc-800/60 bg-[#0c0c0e] rounded-2xl overflow-hidden shadow-2xl relative">
              {loading && (
                <div className="absolute inset-0 z-10 bg-[#0c0c0e]/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-500 animate-spin" />
                </div>
              )}

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800/60">
                    <tr>
                      <th className="px-6 py-4 w-12">Imagem</th>
                      <th className="px-6 py-4">Informações do Produto</th>
                      <th className="px-6 py-4 text-right">Preço de Venda</th>
                      <th className="px-6 py-4 text-center">Estoque</th>
                      <th className="px-6 py-4 text-center">Integrações</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="hover:bg-purple-500/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800 group-hover:border-purple-500/30 transition-all">
                            <ImageIcon size={20} className="text-zinc-600 group-hover:text-purple-400" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">{produto.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 uppercase">SKU: {produto.sku}</span>
                            <span className={`w-2 h-2 rounded-full ${produto.status === 'ativo' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`}></span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-black text-zinc-100">{formatarMoeda(produto.preco)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold border ${produto.estoque > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {produto.estoque} em estoque
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             {/* Aqui simulamos os ícones dos canais onde o produto está postado */}
                             <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-purple-500 transition-all cursor-help" title="WooCommerce">
                               <Globe size={14} className="text-blue-400" />
                             </div>
                             {produto.canais.includes('shopee') && (
                               <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-orange-500 transition-all cursor-help" title="Shopee">
                                 <Package size={14} className="text-orange-500" />
                               </div>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 hover:bg-purple-500/20 text-zinc-500 hover:text-purple-400 rounded-lg transition-all">
                              <Edit size={18} />
                            </button>
                            <button className="p-2 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-lg transition-all">
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