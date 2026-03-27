"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { RefreshCw, PackageX, Beaker, PackageCheck, Search, ChevronLeft, ChevronRight, CloudUpload, Loader2, ShoppingBag, ShoppingCart, Zap, Radar } from "lucide-react";
import toast from 'react-hot-toast';
import { getApiUrl } from "@/components/utils/api";

export default function Dashboard() {
  // 1. TODOS OS ESTADOS (Organizados no topo)
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
  const [tamanhoFila, setTamanhoFila] = useState(0); // ESTADO PARA A FILA FANTASMA

  // 2. FUNÇÕES DE CARREGAMENTO
  const carregarFila = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/fila`);
      const data = await res.json();
      if (data.fila !== undefined) setTamanhoFila(data.fila);
    } catch (e) { 
      console.error("Erro ao carregar fila."); 
    }
  };

  const carregarProdutos = async () => {
    const configSalva = localStorage.getItem("raizan_config_geral");
    if (!configSalva) return;

    setLoading(true);
    carregarFila(); // Atualiza a fila sempre que carrega os produtos

    try {
      const payload = { ...JSON.parse(configSalva), search, hideBlocked, hideSamples, page, limit: Number(limit) };
      const response = await fetch(`${getApiUrl()}/api/produtos`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setProdutos(data.produtos); 
        setTotalItems(data.total); 
        setTotalPages(data.totalPages);
        
        // Conta quantos produtos na lista possuem o canal 'woo' ativado
        const contagemSync = data.produtos.filter(p => p.canais && p.canais.includes('woo')).length;
        setTotalSincronizados(contagemSync);
      }
    } catch (error) { 
      console.error(error); 
    }
    setLoading(false);
  };

  // 3. EFEITOS (useEffect)
  // Mantém a fila sempre atualizada (de 30 em 30 segundos)
  useEffect(() => {
    const intervalo = setInterval(carregarFila, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Recarrega produtos quando muda página ou filtros
  useEffect(() => { 
    carregarProdutos(); 
  }, [page, limit, hideBlocked, hideSamples]);


  // 4. AÇÕES DOS BOTÕES
  const handleSearch = (e) => { 
    e.preventDefault(); 
    setPage(1); 
    carregarProdutos(); 
  };

  const handleSyncWoo = async (produto) => {
    const configSalva = localStorage.getItem("raizan_config_geral");
    if (!configSalva) return toast.error("Configure as chaves do WooCommerce!"); 
    const config = JSON.parse(configSalva);

    setSyncStatus(prev => ({ ...prev, [`${produto.PDCODPRO}_woo`]: 'loading' }));
    try {
      const response = await fetch(`${getApiUrl()}/api/woo/sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wooUrl: config.wooUrl, wooKey: config.wooKey, wooSecret: config.wooSecret, produto }),
      });
      const data = await response.json();
      if (data.success) {
        setSyncStatus(prev => ({ ...prev, [`${produto.PDCODPRO}_woo`]: 'idle' }));
        toast.success("Produto sincronizado com sucesso!"); 
        carregarProdutos(); 
      } else {
        setSyncStatus(prev => ({ ...prev, [`${produto.PDCODPRO}_woo`]: 'idle' }));
        toast.error("Erro: " + data.message); 
      }
    } catch (error) { 
      setSyncStatus(prev => ({ ...prev, [`${produto.PDCODPRO}_woo`]: 'idle' })); 
      toast.error("Falha ao comunicar com o servidor."); 
    }
  };

  const handleSyncBatch = async () => {
    const configSalva = localStorage.getItem("raizan_config_geral");
    if (!configSalva) return toast.error("Configure as chaves!");
    const config = JSON.parse(configSalva);

    setIsSyncingBatch(true);
    const toastId = toast.loading("Processando lote..."); 

    try {
      const response = await fetch(`${getApiUrl()}/api/woo/sync-batch`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wooUrl: config.wooUrl, wooKey: config.wooKey, wooSecret: config.wooSecret, produtos }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Sucesso! ${data.count} produtos enviados.`, { id: toastId }); 
        carregarProdutos(); 
      } else {
        toast.error("Erro no processamento.", { id: toastId });
      }
    } catch (error) { 
      toast.error("Erro de comunicação.", { id: toastId }); 
    }
    setIsSyncingBatch(false);
  };

  const handleMapearLoja = async () => {
    setIsMapping(true);
    const toastId = toast.loading("Escaneando WooCommerce..."); 

    try {
      const response = await fetch(`${getApiUrl()}/api/woo/mapear`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message, { id: toastId }); 
        carregarProdutos(); 
      } else { 
        toast.error("Erro: " + data.message, { id: toastId }); 
      }
    } catch (error) { 
      toast.error("Falha ao comunicar com o servidor.", { id: toastId }); 
    }
    setIsMapping(false);
  };

  const renderizarStatus = (status) => {
    if (status === 8) return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><PackageX size={12} /> Bloqueado</span>;
    if (status === 6) return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Beaker size={12} /> Amostra</span>;
    return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><PackageCheck size={12} /> Normal</span>;
  };

  // 5. RENDERIZAÇÃO DA TELA (JSX)
  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-200 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* AGORA OS CARDS ESTÃO VIVOS E COM A FILA! */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card title="Total no ERP" value={totalItems || "..."} />
              <Card title="Sincronizados (Na Tela)" value={totalSincronizados} />
              <Card title="Erros na API" value="0" />
              <Card title="Fila de Processo" value={tamanhoFila} />
            </div>

            <div className="border border-zinc-800/60 bg-zinc-900/40 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
              
              <div className="p-5 border-b border-zinc-800/60 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-zinc-900/50">
                <form onSubmit={handleSearch} className="flex flex-1 w-full max-w-md items-center gap-2">
                  <div className="relative w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type="text" placeholder="Buscar EAN, Código, Nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-purple-500" />
                  </div>
                  <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">Buscar</button>
                </form>

                <div className="flex flex-wrap items-center gap-5 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white transition-colors">
                    <input type="checkbox" checked={hideBlocked} onChange={(e) => { setHideBlocked(e.target.checked); setPage(1); }} className="rounded border-zinc-700 bg-zinc-950 text-purple-500" /> Ocultar Bloqueados
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white transition-colors">
                    <input type="checkbox" checked={hideSamples} onChange={(e) => { setHideSamples(e.target.checked); setPage(1); }} className="rounded border-zinc-700 bg-zinc-950 text-purple-500" /> Ocultar Amostras
                  </label>
                  <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
                  <select value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1); }} className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-purple-500 cursor-pointer">
                    <option value="20">20 por pág</option>
                    <option value="50">50 por pág</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-800/20 px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Controles do Sistema</span>
                
                <div className="flex gap-3">
                  <button onClick={handleMapearLoja} disabled={isMapping} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md active:scale-95 disabled:opacity-50">
                    {isMapping ? <><Loader2 size={16} className="animate-spin text-purple-400" /> Escaneando Woo...</> : <><Radar size={16} className="text-purple-400" /> Descobrir Produtos no Woo</>}
                  </button>

                  <button onClick={handleSyncBatch} disabled={isSyncingBatch || produtos.length === 0} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                    {isSyncingBatch ? <><Loader2 size={16} className="animate-spin" /> Processando Lote...</> : <><Zap size={16} className="text-emerald-100" /> Sincronizar Estoque/Preços</>}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto relative">
                {loading && <div className="absolute inset-0 z-10 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center"><RefreshCw size={24} className="text-purple-500 animate-spin" /></div>}
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-800/30 text-zinc-400 font-medium whitespace-nowrap">
                    <tr>
                      <th className="px-5 py-4">Código</th>
                      <th className="px-5 py-4 w-full">Produto</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Estoque</th>
                      <th className="px-5 py-4 text-right">Preço</th>
                      <th className="px-5 py-4 text-center">Canais</th>
                      <th className="px-5 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {produtos.map((prod) => {
                      const isBloqueado = prod.PDSTATUS === 8;
                      const canaisDesteProduto = prod.canais || [];

                      return (
                        <tr key={prod.PDCODPRO} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-3 text-zinc-400 font-mono">{prod.PDCODPRO}</td>
                          <td className="px-5 py-3 font-medium text-zinc-200">
                            <div className="line-clamp-1">{prod.PDNOME}</div>
                            <div className="text-xs text-zinc-500 font-mono mt-0.5">{prod.PDCODBARRA || 'SEM EAN'}</div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">{renderizarStatus(prod.PDSTATUS)}</td>
                          <td className="px-5 py-3 text-zinc-300 font-medium text-right">{prod.PDSALDO}</td>
                          <td className="px-5 py-3 text-zinc-300 font-medium text-emerald-400 text-right whitespace-nowrap">
                            {prod.PDPRECO !== null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.PDPRECO) : '--'}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {canaisDesteProduto.includes('woo') && (
                                <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400" title="No WooCommerce">
                                  <ShoppingCart size={12} />
                                </div>
                              )}
                              {canaisDesteProduto.length === 0 && <span className="text-zinc-600 text-xs">-</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleSyncWoo(prod)} disabled={isBloqueado || syncStatus[`${prod.PDCODPRO}_woo`] === 'loading'} title="Subir para WooCommerce" className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${isBloqueado ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-800 text-zinc-400 hover:bg-purple-600 hover:text-white shadow-sm'}`}>
                                {syncStatus[`${prod.PDCODPRO}_woo`] === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-zinc-800/60 bg-zinc-800/10 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  Mostrando pág <span className="text-zinc-300 font-medium">{page}</span> de <span className="text-zinc-300 font-medium">{totalPages || 1}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300"><ChevronLeft size={16} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300"><ChevronRight size={16} /></button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}