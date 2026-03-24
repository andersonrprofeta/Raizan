"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Download, CheckCircle2, Store, ShoppingBag, Smartphone, Monitor, Loader2, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import toast from 'react-hot-toast';
import { getApiUrl } from "@/components/utils/api";

export default function Pedidos() {
  const [activeTab, setActiveTab] = useState("woo");
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baixados, setBaixados] = useState({});
  
  // ESTADOS DE PAGINAÇÃO
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const salvos = localStorage.getItem("raizan_pedidos_baixados");
    if (salvos) setBaixados(JSON.parse(salvos));
  }, []);

  const carregarPedidosWoo = async () => {
    setLoading(true);
    try {
      // CORREÇÃO AQUI: Uso das crases (`) envolvendo a URL inteira
      const res = await fetch(`${getApiUrl()}/api/woo/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, limit: Number(limit) })
      });
      const data = await res.json();
      if (data.success) {
        setPedidos(data.pedidos);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
    setLoading(false);
  };

  // Recarrega sempre que mudar a aba, a página ou o limite
  useEffect(() => {
    if (activeTab === "woo") {
      carregarPedidosWoo();
    } else {
      setPedidos([]); 
      setTotalPages(1);
      setTotalItems(0);
    }
  }, [activeTab, page, limit]);

  // Se trocar de aba, volta para a página 1
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleBaixarCSV = (pedido) => {
    let csvContent = 'SKU;Quantidade;"Preço Unitário"\n';
    pedido.line_items.forEach(item => {
      const sku = item.sku || "SEM_SKU";
      const preco = item.price.toString().replace('.', ',');
      csvContent += `${sku};${item.quantity};"${preco}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pedido-${pedido.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const novosBaixados = { ...baixados, [pedido.id]: true };
    setBaixados(novosBaixados);
    localStorage.setItem("raizan_pedidos_baixados", JSON.stringify(novosBaixados));
  };

  const renderStatus = (status) => {
    const styles = {
      'processing': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'on-hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    const labels = {
      'processing': 'Processando', 'completed': 'Concluído', 'on-hold': 'Aguardando', 'cancelled': 'Cancelado'
    };
    const style = styles[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    return <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>{labels[status] || status}</span>;
  };

  // AS CORES DINÂMICAS PARA AS ABAS
  const tabs = [
    { id: "woo", label: "Site Próprio", icon: <Monitor size={16} />, theme: "purple" },
    { id: "shopee", label: "Shopee", icon: <ShoppingBag size={16} />, theme: "orange" },
    { id: "meli", label: "Mercado Livre", icon: <Store size={16} />, theme: "yellow" },
    { id: "magalu", label: "Magalu", icon: <Smartphone size={16} />, theme: "blue" },
  ];

  const getTabClasses = (theme, isActive) => {
    if (!isActive) return "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30";
    switch (theme) {
      case "orange": return "border-orange-500 text-orange-400 bg-orange-500/10";
      case "yellow": return "border-amber-400 text-amber-300 bg-amber-400/10"; 
      case "blue": return "border-blue-500 text-blue-400 bg-blue-500/10";
      case "purple": default: return "border-purple-500 text-purple-400 bg-purple-500/10";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-200 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Gerenciador de Pedidos</h1>
                <p className="text-sm text-zinc-400 mt-1">Exporte as vendas dos marketplaces para o seu ERP.</p>
              </div>
              
              {/* CONTROLE DE PAGINAÇÃO SUPERIOR */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">Exibir:</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(e.target.value); setPage(1); }} 
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="10">10 por pág</option>
                  <option value="20">20 por pág</option>
                  <option value="50">50 por pág</option>
                  <option value="100">100 por pág</option>
                </select>
              </div>
            </div>

            {/* ABAS DOS MARKETPLACES (Agora coloridas!) */}
            <div className="flex gap-2 border-b border-zinc-800/60 pb-px overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap rounded-t-xl ${getTabClasses(tab.theme, activeTab === tab.id)}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* TABELA DE PEDIDOS */}
            <div className="border border-zinc-800/60 bg-zinc-900/40 rounded-2xl overflow-hidden backdrop-blur-sm relative flex flex-col">
              
              {loading && (
                <div className="absolute inset-0 z-10 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={24} className="text-purple-500 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-800/30 text-zinc-400 font-medium">
                    <tr>
                      <th className="px-5 py-4 w-20">ID</th>
                      <th className="px-5 py-4 w-full">Cliente</th>
                      <th className="px-5 py-4 whitespace-nowrap">Data</th>
                      <th className="px-5 py-4 text-right">Total</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    
                    {pedidos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="6" className="px-5 py-12 text-center text-zinc-500">
                          Nenhum pedido encontrado nesta plataforma.
                        </td>
                      </tr>
                    )}

                    {pedidos.map((pedido) => {
                      const foiBaixado = baixados[pedido.id];

                      return (
                        <tr key={pedido.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-4 text-zinc-300 font-mono font-medium">#{pedido.id}</td>
                          <td className="px-5 py-4 font-medium text-zinc-200">
                            {pedido.billing.first_name} {pedido.billing.last_name}
                            <div className="text-xs text-zinc-500 font-normal mt-0.5">{pedido.billing.city} - {pedido.billing.state}</div>
                          </td>
                          <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                            {new Date(pedido.date_created).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </td>
                          <td className="px-5 py-4 text-zinc-200 font-medium text-right whitespace-nowrap">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {renderStatus(pedido.status)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => handleBaixarCSV(pedido)}
                                title={foiBaixado ? "Baixar Novamente" : "Baixar CSV do Pedido"}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 ${
                                  foiBaixado 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                                }`}
                              >
                                {foiBaixado ? <CheckCircle2 size={16} /> : <FileDown size={16} />}
                                {foiBaixado ? "Baixado" : "Exportar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RODAPÉ DA PAGINAÇÃO */}
              <div className="p-4 border-t border-zinc-800/60 bg-zinc-800/10 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  Mostrando pág <span className="text-zinc-300 font-medium">{page}</span> de <span className="text-zinc-300 font-medium">{totalPages || 1}</span>
                  <span className="ml-2 hidden sm:inline">({totalItems} pedidos no total)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-all"><ChevronLeft size={16} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-all"><ChevronRight size={16} /></button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}