"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Package, Search, Plus, Edit, Trash2, Image as ImageIcon, Loader2, ChevronRight, ChevronLeft, Filter, Globe } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

export default function GestaoProdutosHub() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  // Estados para paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Simulando o carregamento enquanto não fazemos o backend
    setTimeout(() => {
      setProdutos([
        { id: 1, sku: "TEN-NIKE-01", nome: "Tênis Nike Air Max Pro", preco: 599.90, estoque: 45, status: 'ativo', canais: ['woo', 'shopee'] },
        { id: 2, sku: "CAM-SKT-02", nome: "Camiseta Skatista Black", preco: 89.90, estoque: 12, status: 'ativo', canais: ['woo'] },
        { id: 3, sku: "MOQ-OAK-05", nome: "Mochila Oakley Enduro", preco: 349.50, estoque: 0, status: 'inativo', canais: [] },
      ]);
      setLoading(false);
    }, 800);
  }, [page]);

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* CABEÇALHO DA TELA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                  <Package className="text-emerald-400" /> Catálogo Master (Hub)
                </h1>
                <p className="text-sm text-zinc-400 mt-1">Gerencie seus produtos e envie para o E-commerce, Shopee e PDV.</p>
              </div>
              
              <Link href="/admin/cadastros/produtos/novo">
                <button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
                  <Plus size={18} /> Novo Produto
                </button>
              </Link>
            </div>

            {/* BARRA DE BUSCA E FILTROS */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por Nome, SKU ou Código de Barras..." 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-zinc-700">
                <Filter size={18} /> Filtros
              </button>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="border border-zinc-800/60 bg-[#0c0c0e] rounded-2xl overflow-hidden relative shadow-xl min-h-[400px]">
              {loading && (
                <div className="absolute inset-0 z-10 bg-[#0c0c0e]/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                </div>
              )}

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-left">
                  <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800/60">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">Img</th>
                      <th className="px-6 py-4">Produto</th>
                      <th className="px-6 py-4 text-right">Preço</th>
                      <th className="px-6 py-4 text-center">Estoque</th>
                      <th className="px-6 py-4 text-center">Integrações</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {produtos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-zinc-500">
                          <Package size={48} className="mx-auto mb-4 opacity-20" />
                          <p>Nenhum produto cadastrado no seu Hub.</p>
                        </td>
                      </tr>
                    )}
                    
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="hover:bg-zinc-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                            <ImageIcon size={18} className="text-zinc-500" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-200">{produto.nome}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">SKU: {produto.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-zinc-300">
                          {formatarMoeda(produto.preco)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border ${produto.estoque > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {produto.estoque} un
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-zinc-500">
                            {produto.canais.length > 0 ? (
                              <Globe size={16} className="text-blue-400" title={`Conectado a ${produto.canais.length} canais`} />
                            ) : (
                              <span className="text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex w-2 h-2 rounded-full ${produto.status === 'ativo' ? 'bg-emerald-500' : 'bg-zinc-600'}`}></span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 rounded-lg transition-colors" title="Editar">
                              <Edit size={16} />
                            </button>
                            <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors" title="Excluir">
                              <Trash2 size={16} />
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