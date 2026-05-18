"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";

// 🟢 SEUS COMPONENTES ORGANIZADOS AQUI!
import TabsLojas from "@/components/pedidos/TabsLojas";
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
      const endpoint = activeTabObj.tipo === "b2b" ? `${getHubUrl()}/api/hub/pedidos/b2b` : `${getHubUrl()}/api/hub/pedidos/woo`; 

      const res = await fetch(endpoint, {
        method: "POST", 
        headers: { ...getHeaders(), "x-tenant-id": tenantId },
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
      const endpoint = activeTabObj.tipo === 'b2b' ? `${getHubUrl()}/api/hub/pedidos/mudar-status-b2b` : `${getHubUrl()}/api/hub/pedidos/mudar-status-woo`;
      
      const res = await fetch(endpoint, {
        method: 'POST', headers: { ...getHeaders(), "x-tenant-id": tenantId },
        body: JSON.stringify({ pedidoId, novoStatus, integracao_id: activeTabObj.id, plataforma: activeTabObj.tipo })
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
                <select value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1); }} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-purple-500 cursor-pointer shadow-sm dark:shadow-none transition-colors">
                  <option value="10">10 por pág</option>
                  <option value="20">20 por pág</option>
                  <option value="50">50 por pág</option>
                  <option value="100">100 por pág</option>
                </select>
              </div>
            </div>

            <TabsLojas 
              integracoesInstaladas={integracoesInstaladas} 
              activeTab={activeTabObj?.id} 
              onTabChange={(tab) => { setActiveTabObj(tab); setPage(1); }} 
            />

            <TabelaPedidos 
              pedidos={pedidos} 
              loading={loading} 
              page={page} 
              totalPages={totalPages} 
              totalItems={totalItems} 
              onPageChange={setPage} 
              onRowClick={setPedidoSelecionado} 
              baixados={baixados} 
              onDownload={handleBaixarCSV} 
              activeTab={activeTabObj?.id} 
            />
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