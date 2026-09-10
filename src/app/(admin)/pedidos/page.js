"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";
import { ShoppingBag, Store, LayoutTemplate, Box, Layers, Search } from "lucide-react";

import TabelaPedidos from "@/components/pedidos/TabelaPedidos";
import ModalDetalhes from "@/components/pedidos/ModalDetalhes";

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
  return localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID || null;
};

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

        const res = await fetch(`${getHubUrl()}/api/hub/pedidos/integracoes-ativas`, {
          method: "GET", headers: { ...getHeaders(), "x-tenant-id": tenantId }
        });
        const data = await res.json();
        
        if (data.success && data.ativas.length > 0) {
          
          // ✝️💦 O EXORCISMO DEFINITIVO (Agora permite várias lojas iguais!)
          const canaisLimpados = data.ativas.filter(int => {
            // 1. Se não tem ID (null ou undefined), é o fantasma do Backend. VAZA!
            if (int.id === null || int.id === undefined) return false;
            
            // 2. Integrações do banco têm ID numérico (ex: 39, 46). Se tiver letras no ID, VAZA!
            if (isNaN(Number(int.id))) return false;
            
            // 3. Se por acaso a plataforma se chamar Oracle ou Motor Local, VAZA TAMBÉM!
            const plat = String(int.plataforma || int.tipo || '').toLowerCase();
            if (plat.includes('oracle') || plat.includes('motor')) return false;

            return true; // Só passa quem é real e tá salvo bonitinho no MySQL!
          });

          // 🧹 FILTRO ANTI-DUPLICATAS CORRIGIDO (Filtra pelo ID real do banco!)
          const integracoesUnicas = canaisLimpados.filter((integracao, index, self) =>
            index === self.findIndex((t) => (
              t.id === integracao.id // 🟢 AQUI A MÁGICA: Permite 10 WooCommerce, desde que cada um tenha seu próprio ID!
            ))
          );

          setIntegracoesInstaladas(integracoesUnicas);
          
          if (integracoesUnicas.length > 0) {
            setActiveTabObj(integracoesUnicas[0]); 
          }
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
      const plataformaReal = (activeTabObj.plataforma || activeTabObj.tipo || "").toLowerCase();
      
      // 🟢 ROTEAMENTO LIMPO E BLINDADO
      let endpoint = `${getHubUrl()}/api/hub/pedidos/woo`; 
      if (plataformaReal.includes("b2b") || plataformaReal.includes("portal")) {
        endpoint = `${getHubUrl()}/api/hub/pedidos/b2b`;
      } else if (plataformaReal.includes("omie")) {
        endpoint = `${getHubUrl()}/api/hub/pedidos/omie`;
      }

      const res = await fetch(endpoint, {
        method: "POST", 
        headers: { ...getHeaders(), "x-tenant-id": tenantId },
        body: JSON.stringify({ 
          page, 
          limit: Number(limit), 
          plataforma: plataformaReal,
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
      const plataformaReal = (activeTabObj.plataforma || activeTabObj.tipo || "").toLowerCase();
      
      let endpoint = `${getHubUrl()}/api/hub/pedidos/mudar-status-woo`;
      if (plataformaReal.includes('b2b')) endpoint = `${getHubUrl()}/api/hub/pedidos/mudar-status-b2b`;
      if (plataformaReal.includes('omie')) endpoint = `${getHubUrl()}/api/hub/pedidos/mudar-status-omie`;
      
      const res = await fetch(endpoint, {
        method: 'POST', headers: { ...getHeaders(), "x-tenant-id": tenantId },
        body: JSON.stringify({ pedidoId, novoStatus, integracao_id: activeTabObj.id, plataforma: plataformaReal })
      });
      
      const data = await res.json();
      
      if(data.success) {
        toast.success("Status atualizado com sucesso!", { id: loadingToast });
        carregarPedidos(); 
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

  const handleSincronizarOmie = async (pedido) => {
    const idReal = pedido.id || pedido.pedido_id;
    const loadingToast = toast.loading("Enviando pedido para o Omie...");
    
    try {
      const tenantId = obterTenantSeguro();
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/enviar-omie`, {
        method: 'POST',
        headers: { ...getHeaders(), "x-tenant-id": tenantId },
        body: JSON.stringify({ pedido_id: idReal, integracao_id: activeTabObj.id })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Sucesso! Pedido Omie: ${data.numero_omie}`, { id: loadingToast });
        carregarPedidos(); 
      } else {
        toast.error(data.message || "Falha ao enviar.", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Erro de comunicação.", { id: loadingToast });
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

  const handleAcaoPrimaria = (pedido) => {
    const textoChave = String(activeTabObj?.plataforma || activeTabObj?.tipo || '').toLowerCase();
    if (textoChave.includes('omie')) {
      handleSincronizarOmie(pedido);
    } else {
      handleBaixarCSV(pedido);
    }
  };

  // 🍎 Ícone dinâmico elegante para as abas
  const renderIconTab = (plataforma) => {
    const plat = String(plataforma).toLowerCase();
    if (plat.includes('woo')) return <Store size={14} />;
    if (plat.includes('b2b') || plat.includes('portal')) return <LayoutTemplate size={14} />;
    if (plat.includes('omie')) return <Box size={14} />;
    return <ShoppingBag size={14} />;
  };

  // 🍎 MAPEADOR INTELIGENTE DE NOMES
  const obterNomeAba = (tab) => {
    // 1. Prioriza o nome cadastrado no painel ou o label enviado pelo backend!
    const nomeSalvo = tab.nome_integracao || tab.label || "";
    if (nomeSalvo.trim() !== "" && nomeSalvo !== "Integração") {
      return nomeSalvo;
    }
    
    // 2. Fallback de segurança se o backend e o banco mandarem vazio
    const p = String(tab.plataforma || tab.tipo || '').toLowerCase();
    if (p.includes('woo')) return 'WooCommerce';
    if (p.includes('omie')) return 'Omie ERP';
    if (p.includes('b2b') || p.includes('portal')) return 'Portal B2B';
    if (p.includes('oracle') || p.includes('motor')) return 'Oracle';
    if (p.includes('tiny')) return 'Tiny ERP';
    if (p.includes('olist')) return 'Olist';
    if (p.includes('shopee')) return 'Shopee';
    if (p.includes('mercado') || p.includes('meli')) return 'Mercado Livre';
    
    return "Loja";
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* 🍎 HEADER APPLE STYLE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Pedidos</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Gestão unificada de vendas e sincronização.</p>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 px-2 uppercase tracking-wider hidden sm:block">Exibir</span>
                <select value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1); }} className="bg-transparent text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-xl text-sm font-bold outline-none cursor-pointer">
                  <option value="10">10 itens</option>
                  <option value="20">20 itens</option>
                  <option value="50">50 itens</option>
                </select>
              </div>
            </div>

            {/* 🍎 ABAS ESTILO iOS */}
            {integracoesInstaladas.length > 0 ? (
              <div className="relative w-full">
                <div className="flex items-center gap-2 p-1.5 bg-zinc-200/50 dark:bg-zinc-900/80 rounded-2xl overflow-x-auto no-scrollbar w-max max-w-full shadow-inner border border-zinc-200/50 dark:border-white/5">
                  {integracoesInstaladas.map(tab => {
                    const isActive = activeTabObj?.id === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTabObj(tab); setPage(1); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap outline-none select-none
                          ${isActive 
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                          }`}
                      >
                        <span className={isActive ? 'text-purple-600 dark:text-purple-400' : 'opacity-70'}>
                          {renderIconTab(tab.plataforma || tab.tipo)}
                        </span>
                        {/* 🟢 O NOME REAL DOS WOOCOMMERCES AQUI! */}
                        {obterNomeAba(tab)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">Nenhum canal ativo</h3>
                  <p className="text-sm text-zinc-500">Conecte uma loja ou ERP no menu de integrações para receber pedidos.</p>
                </div>
              </div>
            )}

            {/* 🍎 CONTAINER DA TABELA */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] shadow-sm overflow-hidden transition-colors duration-300">
              <TabelaPedidos 
                pedidos={pedidos} 
                loading={loading} 
                page={page} 
                totalPages={totalPages} 
                totalItems={totalItems} 
                onPageChange={setPage} 
                onRowClick={setPedidoSelecionado} 
                baixados={baixados} 
                onDownload={handleAcaoPrimaria} 
                activeTab={activeTabObj?.id} 
                plataformaAtiva={activeTabObj?.tipo || activeTabObj?.iconType} 
              />
            </div>

          </div>
        </main>
      </div>

      <ModalDetalhes 
        pedido={pedidoSelecionado} 
        activeTabObj={activeTabObj} 
        onUpdateStatus={atualizarStatus} 
        onClose={() => setPedidoSelecionado(null)} 
      />
    </div>
  );
}