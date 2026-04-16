"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
// 🟢 Removido o import do Card genérico. Vamos usar cards ultra-vibrantes inline!
import { RefreshCw, PackageX, Beaker, PackageCheck, Search, ChevronLeft, ChevronRight, CloudUpload, Loader2, ShoppingBag, ShoppingCart, Zap, Radar, Image as ImageIcon, Barcode, DollarSign, Database, AlertTriangle, Layers } from "lucide-react";
import toast from 'react-hot-toast';
import { getApiUrl, getHeaders } from "@/components/utils/api";

const BASE_URL_IMAGENS = "https://portalseller.com.br/img_pro/";

const getProductImageUrl = (ean) => {
  if (ean && ean.trim() !== "") return `${BASE_URL_IMAGENS}${ean}.webp`;
  return "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto";
};

export default function Dashboard() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [hideBlocked, setHideBlocked] = useState(false);
  const [hideSamples, setHideSamples] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [syncStatus, setSyncStatus] = useState({});
  const [isSyncingBatch, setIsSyncingBatch] = useState(false);
  const [isMapping, setIsMapping] = useState(false); 
  const [totalSincronizados, setTotalSincronizados] = useState(0);
  const [tamanhoFila, setTamanhoFila] = useState(0); 
  const [tabelaAtiva, setTabelaAtiva] = useState("PDPRECO");

  const carregarFila = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/fila`, { headers: getHeaders() });
      const data = await res.json();
      if (data.fila !== undefined) setTamanhoFila(data.fila);
    } catch (e) { console.error("Erro ao carregar fila."); }
  };

  const carregarProdutos = async () => {
    setLoading(true);
    carregarFila(); 

    try {
      const payload = { search, hideBlocked, hideSamples, page, limit: Number(limit) };
      const response = await fetch(`${getApiUrl()}/api/produtos`, {
        method: "POST", 
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (data.success) {
        setProdutos(data.produtos); 
        setTotalItems(data.total); 
        setTotalPages(data.totalPages);
        if (data.tabelaPrecoBase) setTabelaAtiva(data.tabelaPrecoBase); 
        
        const contagemSync = data.produtos.filter(p => p.canais && p.canais.includes('woo')).length;
        setTotalSincronizados(contagemSync);
      } else {
        toast.error(data.message || "Configure o banco de dados primeiro!");
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => {
    const intervalo = setInterval(carregarFila, 30000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => { carregarProdutos(); }, [page, limit, hideBlocked, hideSamples]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); carregarProdutos(); };

  const handleSyncWoo = async (produto) => {
    const produtoCorrigido = { ...produto, PDPRECO: produto[tabelaAtiva] !== undefined ? produto[tabelaAtiva] : produto.PDPRECO };
    setSyncStatus(prev => ({ ...prev, [`${produto.PDCODPRO}_woo`]: 'loading' }));
    
    try {
      const response = await fetch(`${getApiUrl()}/api/woo/sync`, {
        method: "POST", 
        headers: getHeaders(),
        body: JSON.stringify({ produto: produtoCorrigido }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Sincronizado com sucesso!"); carregarProdutos(); 
      } else { toast.error("Erro: " + data.message); }
    } catch (error) { toast.error("Falha na comunicação."); }
    finally { setSyncStatus(prev => ({ ...prev, [`${produto.PDCODPRO}_woo`]: 'idle' })); }
  };

  const handleSyncBatch = async () => {
    setIsSyncingBatch(true);
    const toastId = toast.loading("Processando lote..."); 
    const produtosCorrigidos = produtos.map(p => ({ ...p, PDPRECO: p[tabelaAtiva] !== undefined ? p[tabelaAtiva] : p.PDPRECO }));

    try {
      const response = await fetch(`${getApiUrl()}/api/woo/sync-batch`, {
        method: "POST", 
        headers: getHeaders(),
        body: JSON.stringify({ produtos: produtosCorrigidos }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Sucesso! ${data.count} enviados.`, { id: toastId }); carregarProdutos(); 
      } else { toast.error("Erro no processamento.", { id: toastId }); }
    } catch (error) { toast.error("Erro de comunicação.", { id: toastId }); }
    setIsSyncingBatch(false);
  };

  const handleMapearLoja = async () => {
    setIsMapping(true);
    const toastId = toast.loading("Escaneando WooCommerce..."); 

    try {
      const response = await fetch(`${getApiUrl()}/api/woo/mapear`, { method: "POST", headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message, { id: toastId }); carregarProdutos(); 
      } else { toast.error("Erro: " + data.message, { id: toastId }); }
    } catch (error) { toast.error("Falha na comunicação.", { id: toastId }); }
    setIsMapping(false);
  };

  // 🟢 BADGES VIBRANTES (Modo Claro e Escuro)
  const renderizarStatus = (status) => {
    if (status === 8) return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-rose-500/15 dark:bg-red-500/10 text-rose-600 dark:text-red-400 border border-rose-500/30 dark:border-red-500/20"><PackageX size={12} /> Bloqueado</span>;
    if (status === 6) return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/20"><Beaker size={12} /> Amostra</span>;
    return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/20"><PackageCheck size={12} /> Normal</span>;
  };

  const getEstiloTabelaPreco = (tabela) => {
    switch(tabela) {
      case 'PDPRECO2': return { nome: 'Hospitais', cor: 'text-amber-600 dark:text-amber-400', icone: <DollarSign size={14} className="text-amber-500 dark:text-amber-400 mr-1 inline" /> };
      case 'PDPRECO3': return { nome: 'Consumidor', cor: 'text-purple-600 dark:text-purple-400', icone: <Zap size={14} className="text-purple-500 dark:text-purple-400 mr-1 inline" /> };
      default: return { nome: 'Atacado', cor: 'text-emerald-600 dark:text-emerald-400', icone: <ShoppingBag size={14} className="text-emerald-500 dark:text-emerald-400 mr-1 inline" /> };
    }
  };

  const infoTabela = getEstiloTabelaPreco(tabelaAtiva);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            
            {/* 🟢 CARDS VIBRANTES (Estilo Sou Básica) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Total no ERP (Roxo Neon) */}
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-6 text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.5)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                     <Database size={24} className="text-white" />
                  </div>
                  <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase mb-1">Total no ERP</h3>
                  <p className="text-4xl font-black tracking-tight">{totalItems || "..."}</p>
                </div>
              </div>

              {/* Card 2: Sincronizados (Rosa Choque) */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.5)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                     <CloudUpload size={24} className="text-white" />
                  </div>
                  <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase mb-1">Sincronizados (Tela)</h3>
                  <p className="text-4xl font-black tracking-tight">{totalSincronizados}</p>
                </div>
              </div>

              {/* Card 3: Erros na API (Esmeralda Vibrante) */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                     <AlertTriangle size={24} className="text-white" />
                  </div>
                  <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase mb-1">Erros na API</h3>
                  <p className="text-4xl font-black tracking-tight">0</p>
                </div>
              </div>

              {/* Card 4: Fila (Azul Oceano) */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                     <Layers size={24} className="text-white" />
                  </div>
                  <h3 className="text-white/80 text-xs font-bold tracking-wider uppercase mb-1">Fila de Processo</h3>
                  <p className="text-4xl font-black tracking-tight">{tamanhoFila}</p>
                </div>
              </div>

            </div>

            {/* CONTAINER PRINCIPAL DA TABELA */}
            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col shadow-xl shadow-zinc-200/50 dark:shadow-none relative transition-colors duration-300">
              
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/60 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-zinc-900/50 relative z-10 transition-colors">
                <form onSubmit={handleSearch} className="flex flex-1 w-full max-w-md items-center gap-2">
                  <div className="relative w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                    <input type="text" placeholder="Buscar EAN, Código, Nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <button type="submit" className="bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md">Buscar</button>
                </form>

                <div className="flex flex-wrap items-center gap-5 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">
                    <input type="checkbox" checked={hideBlocked} onChange={(e) => { setHideBlocked(e.target.checked); setPage(1); }} className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-purple-600 focus:ring-purple-500 transition-colors cursor-pointer" /> Ocultar Bloqueados
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">
                    <input type="checkbox" checked={hideSamples} onChange={(e) => { setHideSamples(e.target.checked); setPage(1); }} className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-purple-600 focus:ring-purple-500 transition-colors cursor-pointer" /> Ocultar Amostras
                  </label>
                  <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
                  <select value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1); }} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 px-3 py-2 rounded-xl text-sm outline-none focus:border-purple-500 cursor-pointer transition-colors font-medium">
                    <option value="20">20 por pág</option>
                    <option value="50">50 por pág</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-50/80 dark:bg-zinc-800/20 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 transition-colors">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold tracking-wider uppercase flex items-center gap-2">
                   <Radar size={14} /> Controles do Sistema
                </span>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={handleMapearLoja} disabled={isMapping} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-transparent px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50">
                    {isMapping ? <><Loader2 size={16} className="animate-spin text-purple-600 dark:text-purple-400" /> Escaneando...</> : <><Radar size={16} className="text-purple-600 dark:text-purple-400" /> Descobrir Produtos</>}
                  </button>

                  <button onClick={handleSyncBatch} disabled={isSyncingBatch || produtos.length === 0} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                    {isSyncingBatch ? <><Loader2 size={16} className="animate-spin" /> Processando...</> : <><Zap size={16} className="text-emerald-50" /> Sync Lote</>}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto relative z-10">
                {loading && <div className="absolute inset-0 z-20 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center"><RefreshCw size={32} className="text-purple-600 dark:text-purple-500 animate-spin" /></div>}
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 font-bold whitespace-nowrap border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                    <tr>
                      <th className="px-6 py-5 w-12 text-center"><ImageIcon size={16} className="mx-auto text-zinc-400 dark:text-zinc-500" /></th>
                      <th className="px-6 py-5 uppercase tracking-wider text-xs">Código</th>
                      <th className="px-6 py-5 w-full uppercase tracking-wider text-xs">Produto</th>
                      <th className="px-6 py-5 uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-5 text-right uppercase tracking-wider text-xs">Estoque</th>
                      <th className={`px-6 py-5 text-right tracking-wider text-xs uppercase transition-colors ${infoTabela.cor}`}>
                         {infoTabela.nome}
                      </th>
                      <th className="px-6 py-5 text-center uppercase tracking-wider text-xs">Canais</th>
                      <th className="px-6 py-5 text-center uppercase tracking-wider text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 transition-colors">
                    {produtos.map((prod) => {
                      const isBloqueado = prod.PDSTATUS === 8;
                      const canaisDesteProduto = prod.canais || [];
                      const imageUrl = getProductImageUrl(prod.PDCODBARRA);
                      const precoExibicao = prod[tabelaAtiva] !== undefined ? prod[tabelaAtiva] : prod.PDPRECO;

                      return (
                        <tr key={prod.PDCODPRO} className="hover:bg-purple-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                          
                          <td className="px-6 py-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-purple-300 dark:group-hover:border-purple-500/50 transition-colors shadow-sm dark:shadow-none">
                              <img 
                                src={imageUrl} 
                                alt={prod.PDNOME} 
                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                                onError={(e) => { e.target.src = "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto"; }}
                              />
                            </div>
                          </td>

                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono font-medium transition-colors">{prod.PDCODPRO}</td>

                          <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-200 transition-colors">
                            <div className="line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">{prod.PDNOME}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-500 font-mono mt-1.5 flex items-center gap-1.5 transition-colors font-medium">
                               <Barcode size={14} className="text-zinc-400 dark:text-zinc-600" />
                               {prod.PDCODBARRA || 'SEM EAN'}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">{renderizarStatus(prod.PDSTATUS)}</td>
                          <td className="px-6 py-4 text-zinc-800 dark:text-zinc-300 font-black text-right text-base transition-colors">{prod.PDSALDO}</td>
                          
                          <td className={`px-6 py-4 font-black text-right whitespace-nowrap text-base transition-colors ${infoTabela.cor}`}>
                            {precoExibicao !== null && precoExibicao !== undefined ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoExibicao) : '--'}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {canaisDesteProduto.includes('woo') && (
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-600/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 transition-colors shadow-sm dark:shadow-none" title="No WooCommerce">
                                  <ShoppingCart size={14} />
                                </div>
                              )}
                              {canaisDesteProduto.length === 0 && <span className="text-zinc-300 dark:text-zinc-600 text-sm font-bold">-</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleSyncWoo(prod)} disabled={isBloqueado || syncStatus[`${prod.PDCODPRO}_woo`] === 'loading'} title="Subir para WooCommerce" className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${isBloqueado ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-transparent' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-transparent hover:bg-purple-600 hover:border-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-purple-500/20 active:scale-95'}`}>
                                {syncStatus[`${prod.PDCODPRO}_woo`] === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-sm relative z-10 transition-colors">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Mostrando pág <span className="text-zinc-800 dark:text-zinc-300 font-bold transition-colors">{page}</span> de <span className="text-zinc-800 dark:text-zinc-300 font-bold transition-colors">{totalPages || 1}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm dark:shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all font-bold"><ChevronLeft size={18} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm dark:shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all font-bold"><ChevronRight size={18} /></button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}