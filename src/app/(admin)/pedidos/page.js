"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Download, CheckCircle2, Store, ShoppingBag, Smartphone, Loader2, FileDown, ChevronLeft, ChevronRight, X, User, MapPin, FileText, Package, Phone, Mail, Calendar, Edit, Building2, Globe } from "lucide-react"; 
import Link from "next/link"; 
import toast from 'react-hot-toast';
import { getApiUrl, getHubUrl, getHeaders } from "@/components/utils/api";

// ==========================================
// FUNÇÕES DE ALTA PERFORMANCE (MAMÓRIA CACHEADA)
// Ao colocar fora do componente, o React não recria isso a cada clique!
// ==========================================
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const getMetaValue = (metaData, keys) => {
  if (!metaData) return "Não informado";
  const meta = metaData.find(m => keys.includes(m.key));
  return meta ? meta.value : "Não informado";
};

const parseEndereco = (pedido) => {
  if (pedido.billing) return pedido.billing;
  if (pedido.endereco_entrega) {
    try { return typeof pedido.endereco_entrega === 'string' ? JSON.parse(pedido.endereco_entrega) : pedido.endereco_entrega; } catch(e) {}
  }
  return {};
};

const renderStatus = (status) => {
  const s = status || 'pendente';
  const styles = {
    'processing': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    'completed': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    'on-hold': 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    'cancelled': 'bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border-rose-200 dark:border-red-500/20',
    'aguardando-pagamento': 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    'pendente': 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    'pago': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    'enviado': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    'entregue': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
  };
  const labels = {
    'processing': 'Processando', 'completed': 'Concluído', 'on-hold': 'Aguardando', 'cancelled': 'Cancelado',
    'aguardando-pagamento': 'Aguard. Pag.', 'pendente': 'Pendente', 'pago': 'Pago', 'enviado': 'Enviado', 'entregue': 'Entregue'
  };
  const style = styles[s] || 'bg-zinc-100 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-500/20';
  return <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>{labels[s] || s}</span>;
};

const getIcon = (iconType) => {
  if (iconType === 'oracle') return <img src="/oracle.svg" alt="Oracle" className="w-8 h-8 object-contain" />;
  if (iconType === 'woo') return <img src="/woocommerce.svg" alt="Woo" className="w-8 h-8 object-contain" />;
  if (iconType === 'raizan') return <img src="/raizancommerce.png" alt="Raizan" className="w-8 h-8 object-contain" />;
  if (iconType === 'shopee') return <ShoppingBag size={24} className="text-orange-500" />;
  if (iconType === 'meli') return <Store size={24} className="text-amber-500" />;
  return <Globe size={24} className="text-zinc-500" />;
};

const getCardClasses = (theme, isActive) => {
  if (!isActive) return "border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] hover:border-zinc-300 dark:hover:border-zinc-700 opacity-60 hover:opacity-100";
  switch (theme) {
    case "emerald": return "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20";
    case "purple": return "border-purple-500 bg-purple-50 dark:bg-purple-500/10 shadow-sm ring-1 ring-purple-500/20";
    case "blue": return "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm ring-1 ring-blue-500/20";
    case "orange": return "border-orange-500 bg-orange-50 dark:bg-orange-500/10 shadow-sm ring-1 ring-orange-500/20";
    case "yellow": return "border-amber-400 bg-amber-50 dark:bg-amber-400/10 shadow-sm ring-1 ring-amber-400/20";
    default: return "border-purple-500 bg-purple-50 dark:bg-purple-500/10 shadow-sm ring-1 ring-purple-500/20";
  }
};

const getCardTextClasses = (theme, isActive) => {
  if (!isActive) return "text-zinc-700 dark:text-zinc-300";
  switch (theme) {
    case "emerald": return "text-emerald-800 dark:text-emerald-400";
    case "purple": return "text-purple-800 dark:text-purple-400";
    case "blue": return "text-blue-800 dark:text-blue-400";
    case "orange": return "text-orange-800 dark:text-orange-400";
    case "yellow": return "text-amber-800 dark:text-amber-400";
    default: return "text-purple-800 dark:text-purple-400";
  }
};

const obterTenantSeguro = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userRaw = localStorage.getItem("@raizan:user");
    if (userRaw) {
      const userObj = JSON.parse(userRaw);
      if (userObj.tenant_id) return userObj.tenant_id;
      if (userObj.cnpj) return userObj.cnpj;
    }
  } catch(e) {}
  try {
    const configRaw = localStorage.getItem("raizan_config_geral");
    if (configRaw) {
      const configObj = JSON.parse(configRaw);
      if (configObj.tenantId) return configObj.tenantId;
    }
  } catch(e) {}
  const tenantLegado = localStorage.getItem("@raizan:tenant");
  if (tenantLegado && tenantLegado !== "localhost" && tenantLegado !== "-" && tenantLegado !== "127") return tenantLegado;
  if (process.env.NEXT_PUBLIC_TENANT_ID) return process.env.NEXT_PUBLIC_TENANT_ID;
  return null;
};

// ==========================================
// COMPONENTE DO MODAL (TELA FLUTUANTE)
// ==========================================
export function ModalDetalhesPedido({ pedido, onClose, activeTabObj, onUpdateStatus }) {
  if (!pedido) return null;

  const dataPedido = new Date(pedido.date_created || pedido.data_criacao || pedido.criado_em).toLocaleString('pt-BR');
  const cpfCnpj = getMetaValue(pedido.meta_data, ['_billing_cpf', '_billing_cnpj', 'billing_cpf', 'billing_cnpj']);
  const ie = getMetaValue(pedido.meta_data, ['_billing_ie', 'billing_ie']);
  const endereco = parseEndereco(pedido);

  const statusOpcoes = activeTabObj?.tipo === 'b2b' 
    ? [
        { value: 'aguardando-pagamento', label: 'Aguardando Pagamento' }, { value: 'pago', label: 'Pago / Aprovado' },
        { value: 'enviado', label: 'Enviado / Em Trânsito' }, { value: 'entregue', label: 'Pedido Entregue' }, { value: 'cancelado', label: 'Cancelado' }
      ]
    : [
        { value: 'pending', label: 'Pagamento Pendente' }, { value: 'processing', label: 'Processando / Pago' },
        { value: 'on-hold', label: 'Aguardando' }, { value: 'completed', label: 'Concluído / Entregue' },
        { value: 'cancelled', label: 'Cancelado' }, { value: 'pendente', label: 'Pendente' }
      ];

  const clienteNome = endereco.first_name ? `${endereco.first_name || ''} ${endereco.last_name || ''}` : `Cliente #${pedido.cliente_id || 'Varejo'}`;
  const clienteEmail = endereco.email || "Sem e-mail";
  const clientePhone = endereco.phone || "Não informado";
  const itensPedido = pedido.line_items || pedido.itens || [];
  const statusAtual = pedido.status || pedido.status_pedido || 'pendente';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Pedido #{pedido.id || pedido.pedido_id}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Status:</span>
              <select 
                value={statusAtual}
                onChange={(e) => onUpdateStatus(pedido.id || pedido.pedido_id, e.target.value)}
                className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-xs px-2 py-1 rounded-md outline-none focus:border-purple-500 font-medium"
              >
                {!statusOpcoes.find(o => o.value === statusAtual) && (
                  <option value={statusAtual}>{statusAtual}</option>
                )}
                {statusOpcoes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>

              {['aguardando-pagamento', 'pending', 'processing', 'on-hold', 'pago', 'pendente'].includes(statusAtual) && (
                  <Link href={`/editar-pedido?id=${pedido.id || pedido.pedido_id}`}>
                    <button className="bg-amber-100 dark:bg-amber-500/10 hover:bg-amber-200 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ml-2 shadow-sm dark:shadow-none">
                      <Edit size={14} /> Editar
                    </button>
                  </Link>
                )}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors mb-1">
              <X size={20} />
            </button>
            <p className="text-xs text-zinc-500 flex items-center gap-1"><Calendar size={12} /> {dataPedido}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><User size={16} className="text-purple-600" /> Informações do Cliente</h3>
                <div className="space-y-3 text-sm">
                  <p><span className="text-zinc-500">Razão/Nome:</span> <span className="font-medium text-zinc-900 dark:text-zinc-200">{clienteNome}</span></p>
                  <p><span className="text-zinc-500">CPF/CNPJ:</span> <span className="text-zinc-900 dark:text-zinc-200">{cpfCnpj}</span></p>
                  <p><span className="text-zinc-500">Inscrição Est.:</span> <span className="text-zinc-900 dark:text-zinc-200">{ie}</span></p>
                  <p className="flex items-center gap-2 mt-2"><Mail size={14} className="text-zinc-500" /> <span className="truncate text-zinc-900 dark:text-zinc-200">{clienteEmail}</span></p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-zinc-500" /> <span className="text-zinc-900 dark:text-zinc-200">{clientePhone}</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><MapPin size={16} className="text-blue-600" /> Cobrança / Entrega</h3>
                <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {endereco.first_name || endereco.address_1 ? (
                    <><p>{endereco.address_1}{endereco.address_2 ? `, ${endereco.address_2}` : ''}</p><p>{endereco.neighborhood || endereco.city} - {endereco.state}</p><p>CEP: {endereco.postcode}</p></>
                  ) : (<p>Endereço não disponível</p>)}
                </div>
              </div>
              {pedido.customer_note && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-orange-600 flex items-center gap-2 mb-2"><FileText size={16} /> Observação do Cliente</h3>
                  <p className="text-sm italic">{pedido.customer_note}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><Package size={16} className="text-emerald-600" /> Itens do Pedido</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-900/50">
                  <tr><th className="px-4 py-3 rounded-l-lg">Produto</th><th className="px-4 py-3 text-center">Qtd</th><th className="px-4 py-3 text-right">Preço Un.</th><th className="px-4 py-3 text-right rounded-r-lg">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                  {itensPedido.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/20 text-zinc-900 dark:text-zinc-200">
                      <td className="px-4 py-3 font-medium">{item.name || item.nome_produto} <br/><span className="text-xs text-zinc-500 font-normal">SKU: {item.sku || 'N/A'}</span></td>
                      <td className="px-4 py-3 text-center">{item.quantity || item.quantidade}</td>
                      <td className="px-4 py-3 text-right">{formatarMoeda(item.price || item.preco_unitario)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatarMoeda(item.total || item.preco_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-end space-y-2 text-sm text-zinc-900 dark:text-zinc-200">
              <div className="flex justify-between w-56"><span>Subtotal:</span><span>{formatarMoeda((pedido.total || pedido.valor_total) - (pedido.shipping_total || pedido.valor_frete || 0))}</span></div>
              <div className="flex justify-between w-56"><span>Frete:</span><span>{formatarMoeda(pedido.shipping_total || pedido.valor_frete || 0)}</span></div>
              <div className="flex justify-between w-56 text-lg font-bold mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800"><span>Total:</span><span className="text-emerald-600">{formatarMoeda(pedido.total || pedido.valor_total)}</span></div>
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
  const [integracoesInstaladas, setIntegracoesInstaladas] = useState([]); 
  const [activeTabObj, setActiveTabObj] = useState(null); 

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baixados, setBaixados] = useState({});
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchIntegracoes = async () => {
      try {
        const tenantId = obterTenantSeguro();
        if (!tenantId) return; 

        const customHeaders = getHeaders();
        customHeaders["x-tenant-id"] = tenantId;

        const res = await fetch(`${getHubUrl()}/api/hub/pedidos/integracoes-ativas`, {
          method: "GET", headers: customHeaders
        });
        const data = await res.json();
        
        if (data.success && data.ativas.length > 0) {
          setIntegracoesInstaladas(data.ativas);
          setActiveTabObj(data.ativas[0]); 
        }
      } catch (e) {}
    };
    fetchIntegracoes();

    const salvos = localStorage.getItem("raizan_pedidos_baixados");
    if (salvos) setBaixados(JSON.parse(salvos));
  }, []);

  const carregarPedidos = async () => {
    if (!activeTabObj) return;
    setLoading(true);
    try {
      const tenantId = obterTenantSeguro();
      if (!tenantId) throw new Error("Aguardando sessão...");

      const customHeaders = getHeaders();
      customHeaders["x-tenant-id"] = tenantId;

      const endpoint = activeTabObj.tipo === "b2b" 
        ? `${getHubUrl()}/api/hub/pedidos/b2b` 
        : `${getHubUrl()}/api/hub/pedidos/woo`; 

      const res = await fetch(endpoint, {
        method: "POST", 
        headers: customHeaders,
        // 🟢 A MÁGICA TÁ AQUI: Agora enviamos o integracao_id pro Back-end saber qual loja buscar!
        body: JSON.stringify({ 
          page, 
          limit: Number(limit), 
          plataforma: activeTabObj.tipo,
          integracao_id: activeTabObj.id 
        }) 
      });
      
      const data = await res.json();
      
      if (data.success && data.pedidos) {
        setPedidos(data.pedidos);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
      } else { 
        setPedidos([]); setTotalPages(1); setTotalItems(0);
      }
    } catch (error) { 
      setPedidos([]); setTotalPages(1); setTotalItems(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarPedidos();
  }, [activeTabObj, page, limit]);

  const atualizarStatus = async (pedidoId, novoStatus) => {
    const loadingToast = toast.loading("Atualizando status...");
    try {
      const tenantId = obterTenantSeguro();
      if (!tenantId) throw new Error("Sessão inválida");

      const customHeaders = getHeaders();
      customHeaders["x-tenant-id"] = tenantId;

      const endpoint = activeTabObj.tipo === 'b2b' 
        ? `${getHubUrl()}/api/hub/pedidos/mudar-status-b2b` 
        : `${getHubUrl()}/api/hub/pedidos/mudar-status-woo`;
      
      const res = await fetch(endpoint, {
        method: 'POST', headers: customHeaders,
        // 🟢 MÁGICA: Agora mandamos o ID da loja pro Back-end saber onde mudar o status!
        body: JSON.stringify({ 
          pedidoId, 
          novoStatus, 
          integracao_id: activeTabObj.id, 
          plataforma: activeTabObj.tipo 
        })
      });
      
      const data = await res.json();
      
      if(data.success) {
        toast.success("Status atualizado com sucesso!", { id: loadingToast });
        setPedidos(pedidos.map(p => {
          const pId = p.id || p.pedido_id;
          return pId === pedidoId ? { ...p, status: novoStatus, status_pedido: novoStatus } : p;
        }));
        if((pedidoSelecionado?.id || pedidoSelecionado?.pedido_id) === pedidoId) {
          setPedidoSelecionado({ ...pedidoSelecionado, status: novoStatus, status_pedido: novoStatus });
        }
      } else {
        toast.error(data.message || "Erro ao atualizar", { id: loadingToast });
      }
    } catch(error) {
      toast.error("Erro de conexão com o servidor", { id: loadingToast });
    }
  };

  const handleBaixarCSV = (pedido) => {
    let csvContent = 'SKU;Quantidade;"Preço Unitário"\n';
    const itensExportar = pedido.line_items || pedido.itens || [];
    
    itensExportar.forEach(item => {
      const sku = item.sku || "SEM_SKU";
      const precoRaw = item.price || item.preco_unitario || 0;
      const preco = parseFloat(precoRaw).toFixed(2).replace('.', ',');
      const qtd = item.quantity || item.quantidade || 1;
      csvContent += `${sku};${qtd};${preco}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const idReal = pedido.id || pedido.pedido_id;
    link.setAttribute("href", url);
    link.setAttribute("download", `pedido-${activeTabObj.id}-${idReal}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const novosBaixados = { ...baixados, [`${activeTabObj.id}_${idReal}`]: true };
    setBaixados(novosBaixados);
    localStorage.setItem("raizan_pedidos_baixados", JSON.stringify(novosBaixados));
    toast.success("Arquivo CSV exportado!");
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Gerenciador de Pedidos</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Gerencie status e exporte as vendas para o ERP.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Exibir:</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(e.target.value); setPage(1); }} 
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-purple-500 cursor-pointer shadow-sm dark:shadow-none transition-colors"
                >
                  <option value="10">10 por pág</option>
                  <option value="20">20 por pág</option>
                  <option value="50">50 por pág</option>
                  <option value="100">100 por pág</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {integracoesInstaladas.map(tab => {
                const isActive = activeTabObj?.id === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTabObj(tab); setPage(1); }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left w-full ${getCardClasses(tab.theme, isActive)}`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2 bg-white dark:bg-[#0c0c0e] shadow-sm border border-zinc-100 dark:border-zinc-800 shrink-0">
                      {getIcon(tab.iconType)}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden w-full">
                      <span className={`text-sm font-black truncate w-full ${getCardTextClasses(tab.theme, isActive)}`}>
                        {tab.label}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate w-full mt-0.5">
                        {tab.sub}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 rounded-2xl overflow-hidden backdrop-blur-sm relative flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
              
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={24} className="text-purple-600 dark:text-purple-500 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 font-medium transition-colors uppercase tracking-widest text-[11px]">
                    <tr>
                      <th className="px-5 py-4 w-20">ID</th>
                      <th className="px-5 py-4 w-full">Cliente</th>
                      <th className="px-5 py-4 whitespace-nowrap">Data</th>
                      <th className="px-5 py-4 text-right">Total</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4 text-center">Exportar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 transition-colors">
                    
                    {pedidos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="6" className="px-5 py-16 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                          Nenhum pedido processado nesta plataforma ainda.
                        </td>
                      </tr>
                    )}

                    {pedidos.map((pedido) => {
                      const idReal = pedido.id || pedido.pedido_id;
                      const foiBaixado = activeTabObj ? baixados[`${activeTabObj.id}_${idReal}`] : false;
                      
                      const endereco = parseEndereco(pedido);
                      const clienteNomeLista = endereco.first_name ? `${endereco.first_name || ''} ${endereco.last_name || ''}` : `Cliente #${pedido.cliente_id || 'Varejo'}`;
                      const dataFormatada = new Date(pedido.date_created || pedido.data_criacao || pedido.criado_em).toLocaleDateString('pt-BR');

                      return (
                        <tr 
                          key={idReal} 
                          onClick={() => setPedidoSelecionado(pedido)}
                          className="hover:bg-zinc-50 dark:bg-[#0c0c0e] dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-4 text-purple-600 dark:text-purple-400 font-mono font-bold">#{idReal}</td>
                          <td className="px-5 py-4 font-bold text-zinc-900 dark:text-zinc-200">
                            {clienteNomeLista}
                            {endereco.city && <div className="text-[11px] text-zinc-500 font-medium mt-0.5">{endereco.city} - {endereco.state}</div>}
                          </td>
                          <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            {dataFormatada}
                          </td>
                          <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-black text-right whitespace-nowrap">
                            {formatarMoeda(pedido.total || pedido.valor_total)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {renderStatus(pedido.status || pedido.status_pedido)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleBaixarCSV(pedido); }}
                                title={foiBaixado ? "Baixar Novamente" : "Baixar CSV do Pedido"}
                                className={`flex items-center justify-center p-2 rounded-xl transition-all ${
                                  foiBaixado 
                                    ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" 
                                    : "text-purple-500 hover:bg-purple-500/20"
                                }`}
                              >
                                {foiBaixado ? <CheckCircle2 size={18} /> : <FileDown size={18} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-800/10 flex items-center justify-between text-sm transition-colors">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Mostrando pág <span className="text-zinc-800 dark:text-zinc-300 font-bold">{page}</span> de <span className="text-zinc-800 dark:text-zinc-300 font-bold">{totalPages || 1}</span>
                  <span className="ml-2 hidden sm:inline">({totalItems} pedidos)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm dark:shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all"><ChevronLeft size={16} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm dark:shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all"><ChevronRight size={16} /></button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <ModalDetalhesPedido 
        pedido={pedidoSelecionado} 
        activeTabObj={activeTabObj}
        onUpdateStatus={atualizarStatus}
        onClose={() => setPedidoSelecionado(null)} 
      />

    </div>
  );
}