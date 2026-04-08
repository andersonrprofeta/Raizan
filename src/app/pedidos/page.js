"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Download, CheckCircle2, Store, ShoppingBag, Smartphone, Monitor, Loader2, FileDown, ChevronLeft, ChevronRight, X, User, MapPin, FileText, Package, Phone, Mail, Calendar, Building2 } from "lucide-react";
import toast from 'react-hot-toast';
import { getApiUrl } from "@/components/utils/api";

// ==========================================
// COMPONENTES AUXILIARES DO MODAL
// ==========================================
const getMetaValue = (metaData, keys) => {
  if (!metaData) return "Não informado";
  const meta = metaData.find(m => keys.includes(m.key));
  return meta ? meta.value : "Não informado";
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

export function ModalDetalhesPedido({ pedido, onClose, activeTab, onUpdateStatus }) {
  if (!pedido) return null;

  const dataPedido = new Date(pedido.date_created).toLocaleString('pt-BR');
  const cpfCnpj = getMetaValue(pedido.meta_data, ['_billing_cpf', '_billing_cnpj', 'billing_cpf', 'billing_cnpj']);
  const ie = getMetaValue(pedido.meta_data, ['_billing_ie', 'billing_ie']);

  // 🟢 OPÇÕES DE STATUS BASEADO NA PLATAFORMA
  const statusOpcoes = activeTab === 'b2b' 
    ? [
        { value: 'aguardando-pagamento', label: 'Aguardando Pagamento' },
        { value: 'pago', label: 'Pago / Aprovado' },
        { value: 'enviado', label: 'Enviado / Em Trânsito' },
        { value: 'entregue', label: 'Pedido Entregue' },
        { value: 'cancelado', label: 'Cancelado' }
      ]
    : [
        { value: 'pending', label: 'Pagamento Pendente' },
        { value: 'processing', label: 'Processando / Pago' },
        { value: 'on-hold', label: 'Aguardando' },
        { value: 'completed', label: 'Concluído / Entregue' },
        { value: 'cancelled', label: 'Cancelado' }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho com o Seletor de Status Mágico */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              Pedido #{pedido.id}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Status:</span>
              <select 
                value={pedido.status}
                onChange={(e) => onUpdateStatus(pedido.id, e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs px-2 py-1 rounded-md outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer font-medium"
              >
                {!statusOpcoes.find(o => o.value === pedido.status) && (
                  <option value={pedido.status}>{pedido.status}</option>
                )}
                {statusOpcoes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors mb-1">
              <X size={20} />
            </button>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar size={12} /> {dataPedido}
            </p>
          </div>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Coluna Esquerda: Dados do Cliente */}
            <div className="space-y-6">
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                  <User size={16} className="text-purple-400" /> Informações do Cliente
                </h3>
                <div className="space-y-3 text-sm">
                  <p><span className="text-zinc-500">Razão/Nome:</span> <span className="text-zinc-200 font-medium">{pedido.billing.first_name} {pedido.billing.last_name}</span></p>
                  <p><span className="text-zinc-500">CPF/CNPJ:</span> <span className="text-zinc-200">{cpfCnpj}</span></p>
                  <p><span className="text-zinc-500">Inscrição Est.:</span> <span className="text-zinc-200">{ie}</span></p>
                  <p className="flex items-center gap-2 mt-2"><Mail size={14} className="text-zinc-500" /> <span className="text-zinc-200 truncate">{pedido.billing.email}</span></p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-zinc-500" /> <span className="text-zinc-200">{pedido.billing.phone || "Não informado"}</span></p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Endereço e Notas */}
            <div className="space-y-6">
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                  <MapPin size={16} className="text-blue-400" /> Cobrança / Entrega
                </h3>
                <div className="space-y-1 text-sm text-zinc-300">
                  <p>{pedido.billing.address_1}{pedido.billing.address_2 ? `, ${pedido.billing.address_2}` : ''}</p>
                  <p>{pedido.billing.neighborhood || pedido.billing.city} - {pedido.billing.state}</p>
                  <p>CEP: {pedido.billing.postcode}</p>
                </div>
              </div>

              {pedido.customer_note && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-2 mb-2">
                    <FileText size={16} /> Observação do Cliente
                  </h3>
                  <p className="text-sm text-zinc-300 italic">{pedido.customer_note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Produtos do Pedido */}
          <div className="mt-6 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
              <Package size={16} className="text-emerald-400" /> Itens do Pedido
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Produto</th>
                    <th className="px-4 py-3 text-center">Qtd</th>
                    <th className="px-4 py-3 text-right">Preço Un.</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {pedido.line_items?.map((item) => (
                    <tr key={item.id || item.sku} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-200">{item.name} <br/><span className="text-xs text-zinc-500 font-normal">SKU: {item.sku || 'N/A'}</span></td>
                      <td className="px-4 py-3 text-center text-zinc-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{formatarMoeda(item.price)}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{formatarMoeda(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totais do Pedido */}
            <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col items-end space-y-2 text-sm">
              <div className="flex justify-between w-56 text-zinc-400">
                <span>Subtotal:</span>
                <span>{formatarMoeda(pedido.total - (pedido.shipping_total || 0))}</span>
              </div>
              <div className="flex justify-between w-56 text-zinc-400">
                <span>Frete:</span>
                <span>{formatarMoeda(pedido.shipping_total || 0)}</span>
              </div>
              <div className="flex justify-between w-56 text-lg font-bold text-zinc-100 mt-2 pt-2 border-t border-zinc-800">
                <span>Total:</span>
                <span className="text-emerald-400">{formatarMoeda(pedido.total)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// TELA PRINCIPAL DE PEDIDOS
// ==========================================
export default function Pedidos() {
  const [activeTab, setActiveTab] = useState("b2b"); 
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baixados, setBaixados] = useState({});
  
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  
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
      const res = await fetch(`${getApiUrl()}/api/woo/pedidos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, limit: Number(limit) })
      });
      const data = await res.json();
      if (data.success) {
        setPedidos(data.pedidos);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (error) { console.error("Erro ao buscar pedidos do Woo:", error); }
    setLoading(false);
  };

  const carregarPedidosB2B = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/b2b/pedidos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, limit: Number(limit) })
      });
      const data = await res.json();
      if (data.success) {
        setPedidos(data.pedidos);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      } else { setPedidos([]); }
    } catch (error) { setPedidos([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "woo") carregarPedidosWoo();
    else if (activeTab === "b2b") carregarPedidosB2B();
    else { setPedidos([]); setTotalPages(1); setTotalItems(0); }
  }, [activeTab, page, limit]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  // 🟢 NOVA FUNÇÃO: ATUALIZAR STATUS NO SERVIDOR
  const atualizarStatus = async (pedidoId, novoStatus) => {
    const loadingToast = toast.loading("Atualizando status...");
    try {
      const endpoint = activeTab === 'b2b' 
        ? `${getApiUrl()}/api/b2b/mudar-status-pedido` 
        : `${getApiUrl()}/api/woo/mudar-status-pedido`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, novoStatus })
      });
      
      const data = await res.json();
      
      if(data.success) {
        toast.success("Status atualizado com sucesso!", { id: loadingToast });
        
        // Atualiza a lista por trás sem precisar recarregar a tela
        setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
        
        // Atualiza a janela modal ao vivo
        if(pedidoSelecionado?.id === pedidoId) {
          setPedidoSelecionado({ ...pedidoSelecionado, status: novoStatus });
        }
      } else {
        toast.error(data.message || "Erro ao atualizar", { id: loadingToast });
      }
    } catch(error) {
      toast.error("Erro de conexão com o servidor", { id: loadingToast });
    }
  };

  // 🟢 CSV CORRIGIDO E PADRONIZADO
  const handleBaixarCSV = (pedido) => {
    // Cabeçalho com \n e não \\n para quebrar a linha de verdade
    let csvContent = 'SKU;Quantidade;"Preço Unitário"\n';
    
    pedido.line_items.forEach(item => {
      const sku = item.sku || "SEM_SKU";
      
      // Força o preço a ter 2 casas decimais, troca ponto por vírgula e remove aspas.
      const preco = parseFloat(item.price || 0).toFixed(2).replace('.', ',');
      
      csvContent += `${sku};${item.quantity};${preco}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pedido-${activeTab}-${pedido.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const novosBaixados = { ...baixados, [`${activeTab}_${pedido.id}`]: true };
    setBaixados(novosBaixados);
    localStorage.setItem("raizan_pedidos_baixados", JSON.stringify(novosBaixados));
    toast.success("Arquivo CSV exportado!");
  };

  const renderStatus = (status) => {
    const styles = {
      'processing': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'on-hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
      'aguardando-pagamento': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'pago': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'enviado': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'entregue': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
    const labels = {
      'processing': 'Processando', 'completed': 'Concluído', 'on-hold': 'Aguardando', 'cancelled': 'Cancelado',
      'aguardando-pagamento': 'Aguard. Pag.', 'pago': 'Pago', 'enviado': 'Enviado', 'entregue': 'Entregue'
    };
    const style = styles[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    return <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>{labels[status] || status}</span>;
  };

  const tabs = [
    { id: "b2b", label: "Portal B2B (Lojistas)", icon: <Building2 size={16} />, theme: "emerald" },
    { id: "woo", label: "Site Próprio (Woo)", icon: <Monitor size={16} />, theme: "purple" },
    { id: "shopee", label: "Shopee", icon: <ShoppingBag size={16} />, theme: "orange" },
    { id: "meli", label: "Mercado Livre", icon: <Store size={16} />, theme: "yellow" },
    { id: "magalu", label: "Magalu", icon: <Smartphone size={16} />, theme: "blue" },
    { id: "tiktok", label: "Tik-tok Shop", icon: <Smartphone size={16} />, theme: "red" }, // 🟢 TIKTOK CORRIGIDO
  ];

  const getTabClasses = (theme, isActive) => {
    if (!isActive) return "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30";
    switch (theme) {
      case "emerald": return "border-emerald-500 text-emerald-400 bg-emerald-500/10";
      case "orange": return "border-orange-500 text-orange-400 bg-orange-500/10";
      case "yellow": return "border-amber-400 text-amber-300 bg-amber-400/10"; 
      case "blue": return "border-blue-500 text-blue-400 bg-blue-500/10";
      case "red": return "border-rose-500 text-rose-400 bg-rose-500/10"; // 🟢 COR DO TIKTOK
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
                <p className="text-sm text-zinc-400 mt-1">Gerencie status e exporte as vendas para o ERP.</p>
              </div>
              
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
                      const foiBaixado = baixados[`${activeTab}_${pedido.id}`];

                      return (
                        <tr 
                          key={pedido.id} 
                          onClick={() => setPedidoSelecionado(pedido)}
                          className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-4 text-zinc-300 font-mono font-medium">#{pedido.id}</td>
                          <td className="px-5 py-4 font-medium text-zinc-200">
                            {pedido.billing.first_name} {pedido.billing.last_name}
                            <div className="text-xs text-zinc-500 font-normal mt-0.5">{pedido.billing.city} - {pedido.billing.state}</div>
                          </td>
                          <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                            {new Date(pedido.date_created).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </td>
                          <td className="px-5 py-4 text-zinc-200 font-medium text-right whitespace-nowrap">
                            {formatarMoeda(pedido.total)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {renderStatus(pedido.status)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleBaixarCSV(pedido); }}
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

      <ModalDetalhesPedido 
        pedido={pedidoSelecionado} 
        activeTab={activeTab}
        onUpdateStatus={atualizarStatus}
        onClose={() => setPedidoSelecionado(null)} 
      />

    </div>
  );
}