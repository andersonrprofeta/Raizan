"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  FileText, Search, Download, Clock, AlertCircle, FileCheck, RefreshCw, Loader2
} from "lucide-react";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

export default function CofreXMLB2B() {
  const [user, setUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null); // Controle de loading por botão

  useEffect(() => {
    const savedUser = localStorage.getItem("raizan_user");
    if (savedUser) { setUser(JSON.parse(savedUser)); } 
    else { window.location.href = "/login-b2b"; }
  }, []);

  useEffect(() => { if (user) carregarDocumentos(); }, [user]);

  const carregarDocumentos = async () => {
    setLoading(true);
    try {
      // Puxamos os pedidos normais
      const payload = { page: 1, limit: 50, clienteEmail: user.email };
      const response = await fetch(`${getApiUrl()}/api/b2b/pedidos`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      const data = await response.json();
      
      if (data.success) { 
        // 🟢 FILTRO MÁGICO DO COFRE: Só mostra pedidos que já foram pagos/enviados/concluídos
        const pedidosElegiveis = data.pedidos.filter(p => 
          p.status !== 'aguardando-pagamento' && 
          p.status !== 'cancelled' && 
          p.status !== 'cancelado'
        );
        setPedidos(pedidosElegiveis); 
      } 
      else { toast.error("Erro ao carregar documentos."); }
    } catch (error) { toast.error("Erro de conexão."); }
    setLoading(false);
  };

  const solicitarDocumento = async (pedidoId) => {
    setProcessandoId(pedidoId);
    try {
      const res = await fetch(`${getApiUrl()}/api/b2b/solicitar-documentos`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Solicitação enviada! A equipe vai anexar os arquivos em breve.");
        carregarDocumentos(); // Recarrega a lista para o botão ficar amarelo
      } else {
        toast.error(data.message || "Erro ao solicitar.");
      }
    } catch (e) {
      toast.error("Erro de comunicação com o servidor.");
    }
    setProcessandoId(null);
  };

  const getMeta = (pedido, key) => { 
    const meta = pedido.meta_data?.find(m => m.key === key); 
    return meta ? meta.value : "Não informado"; 
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!user) return <div className="h-screen bg-zinc-50 dark:bg-[#09090b] transition-colors duration-300"></div>;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden overflow-x-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            
            {/* CABEÇALHO DA PÁGINA */}
            <div className="bg-white dark:bg-[#0c0c0e] p-4 sm:p-6 lg:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden transition-colors duration-300">
              <div className="absolute right-0 top-0 w-44 h-44 sm:w-64 sm:h-64 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20 shrink-0">
                    <FileText size={24} className="text-blue-600 dark:text-blue-400 sm:w-7 sm:h-7" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100 break-words">Cofre de XML e Boletos</h1>
                    <p className="text-xs sm:text-sm lg:text-base text-zinc-500 dark:text-zinc-400 mt-1 break-words">Baixe a 2ª via dos seus boletos e as Notas Fiscais das suas compras.</p>
                  </div>
                </div>
                <button onClick={carregarDocumentos} disabled={loading} className="w-full sm:w-auto inline-flex items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm group shrink-0">
                  <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : "group-hover:rotate-180 transition-transform duration-500"} />
                </button>
              </div>
            </div>

            {/* LISTA DE DOCUMENTOS */}
            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl overflow-hidden relative shadow-md dark:shadow-xl min-h-[320px] sm:min-h-[400px] transition-colors duration-300">
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/60 dark:bg-[#0c0c0e]/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                </div>
              )}

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs sm:text-sm md:text-base text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800/60 whitespace-nowrap">
                    <tr>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Fatura / Pedido</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Data</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Valor</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Status do Documento</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                    {pedidos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="5" className="px-4 sm:px-6 py-12 sm:py-16 text-center text-zinc-500 dark:text-zinc-500">
                          <FileText size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="text-sm sm:text-base">Nenhum documento disponível no momento.</p>
                          <p className="text-xs mt-1">Apenas pedidos faturados ou enviados aparecem aqui.</p>
                        </td>
                      </tr>
                    )}
                    
                    {pedidos.map((pedido) => {
                      const linkDoc = getMeta(pedido, 'link_xml_boleto');
                      const solicitacao = getMeta(pedido, 'solicitacao_documentos');
                      const nfeNumero = getMeta(pedido, 'nfe_numero');

                      return (
                        <tr key={pedido.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 dark:text-zinc-200 whitespace-nowrap">Pedido #{pedido.id}</span>
                              {nfeNumero !== "Não informado" && (
                                <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 font-mono whitespace-nowrap">NF: {nfeNumero}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                            {new Date(pedido.date_created).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-bold text-zinc-800 dark:text-zinc-300 whitespace-nowrap">
                            {formatarMoeda(pedido.total)}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            {linkDoc !== "Não informado" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                                <FileCheck size={14} /> Disponível para Download
                              </span>
                            ) : solicitacao === 'pendente' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                                <Clock size={14} /> Em Processamento
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                                <AlertCircle size={14} /> Não Solicitado
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left sm:text-right">
                            
                            {/* BOTÕES DE AÇÃO INTELIGENTES */}
                            {linkDoc !== "Não informado" ? (
                              <a href={linkDoc} target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow-md dark:shadow-[0_0_15px_rgba(37,99,235,0.2)] whitespace-nowrap">
                                <Download size={14} /> Baixar Arquivos
                              </a>
                            ) : solicitacao === 'pendente' ? (
                              <button disabled className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-lg text-[11px] sm:text-xs font-bold cursor-not-allowed whitespace-nowrap">
                                <Clock size={14} /> Aguarde...
                              </button>
                            ) : (
                              <button 
                                onClick={() => solicitarDocumento(pedido.id)} 
                                disabled={processandoId === pedido.id}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap"
                              >
                                {processandoId === pedido.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} 
                                Solicitar 2ª Via / XML
                              </button>
                            )}

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