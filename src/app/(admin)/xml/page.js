"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { FileText, Search, Clock, CheckCircle2, Link as LinkIcon, Save, Loader2, AlertCircle } from "lucide-react";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

export default function GestaoXMLAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linksTemp, setLinksTemp] = useState({}); 
  const [salvandoId, setSalvandoId] = useState(null);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    setLoading(true);
    try {
      // Puxa TODOS os pedidos (sem filtrar por email, pois somos Admin)
      const res = await fetch(`${getApiUrl()}/api/b2b/pedidos`, { 
        method: "POST", 
        headers: { ...getHeaders(), "Content-Type": "application/json" }, 
        body: JSON.stringify({ page: 1, limit: 100 }) // Traz os últimos 100
      });
      const data = await res.json();
      
      if (data.success) {
        // Ordenação Inteligente: Joga quem pediu documento pro TOPO da lista
        const pedidosOrdenados = data.pedidos.sort((a, b) => {
          const pediouA = getMeta(a, 'solicitacao_documentos') === 'pendente';
          const pediouB = getMeta(b, 'solicitacao_documentos') === 'pendente';
          if (pediouA && !pediouB) return -1;
          if (!pediouA && pediouB) return 1;
          return new Date(b.date_created) - new Date(a.date_created);
        });
        
        setPedidos(pedidosOrdenados);
        
        // Preenche os inputs com os links que já existem no banco
        const linksIniciais = {};
        pedidosOrdenados.forEach(p => {
          const linkSalvo = getMeta(p, 'link_xml_boleto');
          if (linkSalvo !== "Não informado") linksIniciais[p.id] = linkSalvo;
        });
        setLinksTemp(linksIniciais);
      }
    } catch (error) { toast.error("Erro de conexão."); }
    setLoading(false);
  };

  const handleSalvarLink = async (pedidoId) => {
    const link = linksTemp[pedidoId];
    if (!link || link.trim() === "") return toast.error("Digite ou cole um link válido!");

    setSalvandoId(pedidoId);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/anexar-documento`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, link })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Link anexado com sucesso!");
        carregarPedidos(); // Atualiza a tela pra tirar a cor amarela
      } else {
        toast.error(data.message || "Erro ao salvar.");
      }
    } catch (e) { toast.error("Erro de comunicação."); }
    setSalvandoId(null);
  };

  const getMeta = (pedido, key) => { 
    const meta = pedido.meta_data?.find(m => m.key === key); 
    return meta ? meta.value : "Não informado"; 
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors duration-300">
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-600/5 dark:bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
                  <FileText size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">Central de XML e Boletos</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Anexe os links dos documentos faturados para liberar no painel B2B dos clientes.</p>
                </div>
              </div>
            </div>

            {/* LISTAGEM DE PEDIDOS */}
            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl overflow-hidden relative shadow-md dark:shadow-xl min-h-[400px] transition-colors duration-300">
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/60 dark:bg-[#0c0c0e]/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800/60">
                    <tr>
                      <th className="px-6 py-4">Pedido / Cliente</th>
                      <th className="px-6 py-4">Status / Valor</th>
                      <th className="px-6 py-4">Link do Drive / ERP (PDF ou XML)</th>
                      <th className="px-6 py-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                    {pedidos.map((pedido) => {
                      const solicitou = getMeta(pedido, 'solicitacao_documentos') === 'pendente';
                      const temLink = getMeta(pedido, 'link_xml_boleto') !== "Não informado";
                      const clienteNome = pedido.billing?.first_name || "Cliente Desconhecido";

                      return (
                        <tr key={pedido.id} className={`transition-colors group ${solicitou ? "bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/20"}`}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 dark:text-zinc-200">#{pedido.id}</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">{clienteNome}</span>
                              {solicitou && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                  <AlertCircle size={12}/> Aguardando Anexo!
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-800 dark:text-zinc-300">{formatarMoeda(pedido.total)}</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{pedido.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 w-1/2">
                            <div className="relative">
                              <LinkIcon size={16} className="absolute left-3 top-3 text-zinc-400 dark:text-zinc-500" />
                              <input 
                                type="text" 
                                value={linksTemp[pedido.id] || ""}
                                onChange={(e) => setLinksTemp({...linksTemp, [pedido.id]: e.target.value})}
                                placeholder="Cole o link do Google Drive, Dropbox ou ERP..."
                                className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${solicitou ? 'border-amber-300 dark:border-amber-500/50' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl py-2.5 pl-10 pr-4 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 text-xs transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500`}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleSalvarLink(pedido.id)}
                              disabled={salvandoId === pedido.id}
                              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-xl text-xs font-bold transition-all shadow-md ${
                                temLink && !solicitou 
                                ? "bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white" 
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                              } disabled:opacity-50 whitespace-nowrap`}
                            >
                              {salvandoId === pedido.id ? <Loader2 size={16} className="animate-spin" /> : temLink && !solicitou ? <><CheckCircle2 size={16} /> Atualizar</> : <><Save size={16} /> Salvar Link</>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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