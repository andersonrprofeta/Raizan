"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; // 🟢 ADD: Roteador do Next.js
import { 
  PackageSearch, Loader2, ScanBarcode, ArrowRight, PackageCheck, 
  Box, User, MoreVertical, Printer, MonitorPlay, 
  LayoutGrid, List, AlertTriangle, Store, Smartphone, Globe, ShoppingCart,
  Home // 🟢 ADD: Ícone da casinha
} from 'lucide-react';
import { getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';
import ListaSeparacao from "@/components/checkout/ListaSeparacao";

export default function CheckoutConferencia() {
  const router = useRouter(); // 🟢 ADD: Instanciando o roteador
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState(null);
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState(null);
  
  const [viewMode, setViewMode] = useState('grid'); 
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [modoTV, setModoTV] = useState(false);
  const pedidosIdsRef = useRef([]); 

  const tocarSomNovaSenha = () => {
    try {
      const audio = new Audio('/notificacao.mp3'); 
      audio.play().catch(e => console.log("Áudio bloqueado. O usuário precisa clicar no 'Modo TV' primeiro."));
    } catch (e) {}
  };

  const ativarModoTV = () => {
    setModoTV(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log("Erro ao tentar tela cheia:", err);
      });
    }
    toast.success("Modo TV Ativado! Sistema operando em tempo real.", { icon: '📺' });
  };

  const abrirConferencia = (pedidoId) => {
    const url = `scanner?id=${pedidoId}`; 
    const nomeJanela = `conferencia_${pedidoId}`;
    const configs = 'width=1200,height=800,left=100,top=100,resizable=yes,scrollbars=yes';
    window.open(url, nomeJanela, configs);
  };

  const carregarFilaConferencia = async (silencioso = false) => {
    if (!silencioso) setLoading(true); 
    if (silencioso) setIsAutoRefreshing(true); 

    try {
      const tenantId = localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID;
      
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/omie`, {
        method: 'POST',
        headers: { ...getHeaders(), 'x-tenant-id': tenantId },
        body: JSON.stringify({ page: 1, limit: 100 })
      });
      const data = await res.json();
      
      if (data.success) {
        const fila = data.pedidos.filter(p => {
          const s = String(p.status_pedido || p.status || '').toLowerCase().trim();
          return s === '20' || s === 'processando' || s === 'separacao';
        });

        const novosIds = fila.map(p => p.id);
        const idsAntigos = pedidosIdsRef.current;

        if (silencioso && novosIds.length > 0) {
          const temPedidoNovo = novosIds.some(id => !idsAntigos.includes(id));
          if (temPedidoNovo) {
            tocarSomNovaSenha();
            toast.success("Novo pedido na esteira!", { icon: '🔔', duration: 5000, style: { fontSize: '18px', fontWeight: 'bold' } });
          }
        }

        pedidosIdsRef.current = novosIds;
        setPedidos(fila);
      }
    } catch (error) {
      if (!silencioso) toast.error("Erro ao carregar fila de separação.");
    }
    
    setLoading(false);
    if (silencioso) setTimeout(() => setIsAutoRefreshing(false), 1000); 
  };

  useEffect(() => {
    carregarFilaConferencia(false); 
    const radar = setInterval(() => {
      carregarFilaConferencia(true); 
    }, 10000); 
    return () => clearInterval(radar); 
  }, []);

  const pedidosFiltrados = pedidos.filter(p => 
    String(p.id).includes(busca) || 
    String(p.pedido_id).includes(busca) || 
    (p.billing?.first_name || '').toLowerCase().includes(busca.toLowerCase())
  );

  const verificarUrgency = (pedido) => {
    const metodo = String(pedido.payment_method_title || pedido.metodo_pagamento || '').toLowerCase().trim();
    return ['000', 'pix', 'dinheiro', 'à vista', 'a vista'].some(termo => metodo.includes(termo));
  };

  const getCanalVenda = (pedido) => {
    const origem = String(pedido.origem || pedido.plataforma || 'omie').toLowerCase();
    
    if (origem.includes('woo')) {
      return { label: 'WooCommerce', cor: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300', Icon: ShoppingCart };
    }
    if (origem.includes('seller') || origem.includes('app')) {
      return { label: 'Raizan Seller', cor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300', Icon: Smartphone };
    }
    if (origem.includes('b2b') || origem.includes('portal')) {
      return { label: 'Portal B2B', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300', Icon: Globe };
    }
    return { label: 'Omie / ERP', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300', Icon: Store };
  };

  return (
    <div className={`p-6 mx-auto min-h-screen ${modoTV ? 'max-w-full bg-zinc-50 dark:bg-zinc-950' : 'max-w-7xl relative'}`}>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <ScanBarcode className="text-purple-600" size={32} />
            Estação de Checkout
          </h1>
          <p className="text-zinc-500 mt-1">Fila de pedidos aguardando separação e bipagem.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              title="Visualização em Cards"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              title="Visualização em Lista"
            >
              <List size={18} />
            </button>
          </div>

          {!modoTV && (
            <button 
              onClick={ativarModoTV}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              <MonitorPlay size={20} />
              Iniciar Modo TV
            </button>
          )}

          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 pr-6 rounded-xl shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <PackageSearch className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Na Fila</p>
                <span className="flex h-2 w-2 relative" title="Radar Automático Ativado">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAutoRefreshing ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoRefreshing ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                </span>
              </div>
              <p className="text-lg font-black text-zinc-900 dark:text-white leading-none">{pedidos.length} Pedidos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <ScanBarcode size={22} className="text-zinc-400 group-focus-within:text-purple-500 transition-colors" />
        </div>
        <input 
          type="text" 
          autoFocus
          placeholder="Biper o código de barras ou digite o Nº do pedido..." 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-lg rounded-2xl pl-14 pr-4 py-4 focus:outline-none focus:border-purple-500 transition-colors shadow-sm font-medium"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
          <p className="text-zinc-500 font-medium">Buscando pedidos na esteira...</p>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
          <PackageCheck className="text-zinc-400 mb-4" size={60} strokeWidth={1} />
          <p className="text-xl font-bold text-zinc-700 dark:text-zinc-300">Fila Limpa!</p>
          <p className="text-zinc-500">Nenhum pedido aguardando separação no momento.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "flex flex-col gap-3"}>
          {pedidosFiltrados.map((pedido) => {
            const isUrgente = verificarUrgency(pedido);
            const canal = getCanalVenda(pedido);

            return (
              <div 
                key={pedido.id} 
                onClick={() => abrirConferencia(pedido.pedido_id)}
                className={`group cursor-pointer relative overflow-hidden transition-all flex flex-col justify-between 
                  ${viewMode === 'grid' 
                    ? 'rounded-2xl p-5 border-2 hover:shadow-lg ' 
                    : 'rounded-xl p-4 border flex-row items-center hover:shadow-md '} 
                  ${isUrgente 
                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 hover:border-red-400' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-500'}`}
              >
                {isUrgente && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 animate-pulse"></div>
                )}

                <div className={`${viewMode === 'list' ? 'flex items-center w-full justify-between gap-6 pl-3' : 'pl-1'}`}>
                  
                  <div className={`${viewMode === 'list' ? 'flex items-center gap-6 min-w-[200px]' : 'mb-5'}`}>
                    <div>
                      <div className="flex gap-2 mb-2 items-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase ${isUrgente ? 'bg-red-500 text-white' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
                          {isUrgente ? <AlertTriangle size={12} /> : <PackageSearch size={12} />}
                          {isUrgente ? 'Urgente!' : 'Separação'}
                        </span>
                        
                        {viewMode === 'grid' && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${canal.cor}`}>
                            <canal.Icon size={10} /> {canal.label}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-black text-2xl tracking-tight ${isUrgente ? 'text-red-700 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                        #{pedido.pedido_id}
                      </h3>
                    </div>

                    {viewMode === 'list' && (
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase ${canal.cor}`}>
                         <canal.Icon size={12} /> {canal.label}
                       </span>
                    )}
                  </div>
                  
                  <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1 flex items-center justify-between space-y-0 px-6 border-x border-zinc-200 dark:border-zinc-800' : ''}`}>
                    <div className="flex items-start gap-2.5">
                      <User size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                      
                      <div className="flex flex-col">
                        <p className={`text-sm font-medium line-clamp-2 leading-tight ${isUrgente ? 'text-red-900 dark:text-red-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {pedido.billing?.first_name || 'Cliente não informado'}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 uppercase">
                          Vend: {pedido.vendedor_nome || 'Televendas'}
                        </p>
                      </div>
                      
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <Box size={16} className="text-zinc-400 shrink-0" />
                      <p className={`text-sm font-medium ${isUrgente ? 'text-red-900 dark:text-red-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {pedido.line_items?.length || 0} produto{(pedido.line_items?.length !== 1) && 's'}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'absolute top-5 right-5' : ''}`}>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isUrgente ? 'bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200' : 'bg-zinc-50 dark:bg-zinc-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-500/20'}`}>
                      <ArrowRight size={16} className={`${isUrgente ? 'text-red-600' : 'text-zinc-400 group-hover:text-purple-600'} transition-colors`} />
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(menuAberto === pedido.id ? null : pedido.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors relative"
                    >
                      <MoreVertical size={18} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                      
                      {menuAberto === pedido.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={(e) => { e.stopPropagation(); setMenuAberto(null); }}
                          />
                          <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setMenuAberto(null); 
                                  setPedidoParaImprimir(pedido);
                                }} 
                                className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 flex items-center gap-3 transition-colors font-medium"
                              >
                                <Printer size={16} className="text-zinc-400" />
                                Imprimir Separação
                            </div>
                          </div>
                        </>
                      )}
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🟢 O BOTÃO DISCRETO PARA SAIR/VOLTAR */}
      {!modoTV && (
        <button 
          onClick={() => router.push('/')} // Troque '/' pela rota real do seu painel/dashboard se for diferente (ex: '/dashboard')
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-zinc-800/90 hover:bg-zinc-950 text-zinc-300 hover:text-white px-5 py-2.5 rounded-full shadow-xl backdrop-blur-md transition-all z-50 text-sm font-medium border border-zinc-700/50 group"
        >
          <Home size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao Painel
        </button>
      )}

      {pedidoParaImprimir && (
        <ListaSeparacao 
          pedido={pedidoParaImprimir} 
          onFechar={() => setPedidoParaImprimir(null)} 
        />
      )}
      
    </div>
  );
}