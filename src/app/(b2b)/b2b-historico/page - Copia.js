"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  ShoppingBag, Search, Eye, Clock, Package, 
  CheckCircle2, AlertCircle, Calendar, X, FileText, Loader2, ChevronLeft, ChevronRight, RefreshCw, Truck,
  CreditCard, QrCode, CalendarDays // 🟢 Ícones Novos para o Modal de Pagamento
} from "lucide-react";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'; // 🟢 Mercado Pago importado aqui!

// ==========================================
// COMPONENTE: BADGE DE STATUS DINÂMICO
// ==========================================
const StatusBadge = ({ status }) => {
  const statusMap = {
    'aguardando-pagamento': { cor: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icone: Clock, label: 'Aguardando Pagamento' },
    'pago': { cor: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icone: CheckCircle2, label: 'Pago / Aprovado' },
    'processing': { cor: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icone: Package, label: 'Em Separação' },
    'enviado': { cor: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icone: Truck, label: 'Enviado / Em Trânsito' },
    'entregue': { cor: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icone: CheckCircle2, label: 'Entregue' },
    'completed': { cor: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icone: CheckCircle2, label: 'Concluído' },
    'cancelled': { cor: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icone: AlertCircle, label: 'Cancelado' },
    'cancelado': { cor: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icone: AlertCircle, label: 'Cancelado' }
  };

  const config = statusMap[status] || statusMap['aguardando-pagamento'];
  const Icon = config.icone;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.cor} ${config.border}`}>
      <Icon size={14} /> {config.label}
    </div>
  );
};

// ==========================================
// 🟢 NOVO COMPONENTE: MODAL DE RETENTATIVA DE PAGAMENTO
// ==========================================
function ModalPagamentoRetentativa({ isOpen, onClose, pedido, user, onSucesso }) {
  const [metodoPagamento, setMetodoPagamento] = useState('pix');
  const [prazoBoleto, setPrazoBoleto] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);
  const [isMpReady, setIsMpReady] = useState(false);
  const [mpKeyMissing, setMpKeyMissing] = useState(false);
  const [step, setStep] = useState('resumo');
  const [dadosPix, setDadosPix] = useState(null);

  useEffect(() => {
    if (isOpen && pedido) {
      setStep('resumo'); setDadosPix(null); setIsProcessando(false);
      if (user?.prazos_liberados && user.prazos_liberados.length > 0) {
        setPrazoBoleto(user.prazos_liberados[0]);
      }
      
      const buscarChave = async () => {
        try {
          const res = await fetch(`${getApiUrl()}/api/config/status`, { headers: getHeaders() });
          const data = await res.json();
          if (data.mpPublicKey && data.mpPublicKey.trim() !== "") {
            initMercadoPago(data.mpPublicKey, { locale: 'pt-BR' });
            setIsMpReady(true); setMpKeyMissing(false);
          } else { setMpKeyMissing(true); }
        } catch (e) { setMpKeyMissing(true); }
      };
      buscarChave();
    }
  }, [isOpen, pedido, user]);

  if (!isOpen || !pedido) return null;

  const totalFormatado = Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const processarPagamento = async (dadosCartaoMp = null) => {
    setIsProcessando(true);
    const payload = {
      pedidoId: pedido.id,
      metodoPagamento,
      prazoBoleto: metodoPagamento === 'faturado' ? prazoBoleto : null,
      dadosCartaoMp
    };

    try {
      // 🟢 1. REQUISIÇÃO LIMPA (Igual a que você usa no checkout normal)
      const res = await fetch(`${getApiUrl()}/api/b2b/pagar-pedido`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload)
      });
      
      // 🟢 2. O DETETIVE: Verifica se o servidor devolveu HTML de erro (Crash) ao invés de JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         const textoErro = await res.text();
         console.error("❌ O Motor não devolveu JSON! Erro bruto do servidor:", textoErro);
         toast.error("Falha no servidor. Verifique o console (F12).");
         setIsProcessando(false);
         return;
      }

      // Se passou da barreira, é porque o servidor mandou a resposta certa
      const data = await res.json();
      
      if (data.success) {
        if (data.pagamento?.tipo === 'pix') {
          setDadosPix(data.pagamento);
          setStep('sucesso_pix');
        } else {
          toast.success("Pagamento aprovado!");
          onSucesso(); // Recarrega a tabela de pedidos
          onClose(); // Fecha tudo
        }
      } else { 
        toast.error(data.message || "Erro ao processar o pagamento."); 
      }

    } catch (e) { 
      // 🟢 3. Se a internet cair ou o CORS bloquear, o erro real aparece aqui!
      console.error("❌ Erro fatal de comunicação:", e);
      toast.error(`Falha na requisição: ${e.message}`); 
    }
    setIsProcessando(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all">
      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <CreditCard className="text-emerald-400" /> Realizar Pagamento
          </h2>
          <button onClick={onClose} disabled={isProcessando} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>

        {step === 'sucesso_pix' && dadosPix ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Escaneie o QR Code</h2>
            <div className="bg-white p-3 rounded-2xl mb-6 shadow-lg border-4 border-teal-500/20">
              <img src={`data:image/png;base64,${dadosPix.qr_code_base64}`} alt="PIX" className="w-48 h-48" />
            </div>
            <input type="text" readOnly value={dadosPix.qr_code} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-400 px-4 py-3 rounded-xl text-xs outline-none font-mono truncate mb-4" />
            <button onClick={() => { toast.success("Código copiado!"); navigator.clipboard.writeText(dadosPix.qr_code); }} className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all w-full">
              Copiar Código Pix
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-6">
              <span className="text-zinc-400 font-medium">Total a pagar:</span>
              <span className="text-2xl font-black text-emerald-400">{totalFormatado}</span>
            </div>

            <h3 className="text-sm font-bold text-zinc-100 mb-3 border-b border-zinc-800 pb-2">Selecione a forma de pagamento</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'pix' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                <QrCode size={20} className="mb-1.5" /> <span className="text-xs font-semibold">PIX</span>
              </button>
              <button onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'cartao' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                <CreditCard size={20} className="mb-1.5" /> <span className="text-xs font-semibold">Cartão</span>
              </button>
              <button onClick={() => setMetodoPagamento('faturado')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'faturado' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                <FileText size={20} className="mb-1.5" /> <span className="text-xs font-semibold">Boleto</span>
              </button>
            </div>

            {metodoPagamento === 'faturado' && user?.prazos_liberados && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {user.prazos_liberados.map(prazo => (
                  <button key={prazo} onClick={() => setPrazoBoleto(prazo)} className={`p-3 rounded-xl border text-left transition-all ${prazoBoleto === prazo ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50' : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'}`}>
                    <p className="font-bold text-zinc-100">{prazo}</p>
                    <p className="text-[10px] text-emerald-500 uppercase tracking-wider">Aprovado ERP</p>
                  </button>
                ))}
              </div>
            )}

            {metodoPagamento === 'cartao' && (
              <div className="mt-4 mb-6">
                {mpKeyMissing ? <p className="text-rose-500 text-sm text-center">Chave do Mercado Pago ausente.</p> : !isMpReady ? <p className="text-zinc-500 text-sm text-center animate-pulse">Carregando cofre...</p> : (
                  <Payment
                    initialization={{ amount: Number(pedido.total) }}
                    customization={{ visual: { style: { theme: 'dark' } }, paymentMethods: { creditCard: 'all', debitCard: 'all' } }}
                    onSubmit={async (param) => processarPagamento(param.formData)}
                  />
                )}
              </div>
            )}

            {metodoPagamento !== 'cartao' && (
              <button onClick={() => processarPagamento(null)} disabled={isProcessando} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2">
                {isProcessando ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar e Pagar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: MODAL DE DETALHES DO PEDIDO
// ==========================================
function ModalDetalhes({ pedido, onClose, onPagarAgora }) {
  if (!pedido) return null;

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataAjustada = new Date(pedido.date_created).toLocaleString("pt-BR");
  const getMeta = (key) => { const meta = pedido.meta_data?.find(m => m.key === key); return meta ? meta.value : "Não informado"; };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose}>
      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <ShoppingBag className="text-emerald-400" /> Pedido #{pedido.id}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1"><Calendar size={12}/> {dataAjustada}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Status Atual</p>
              <StatusBadge status={pedido.status} />
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Pagamento e Envio</p>
              <p className="text-sm text-zinc-200 font-bold uppercase">{getMeta('metodo_pagamento')} <span className="text-zinc-500 font-normal normal-case">({getMeta('prazo_boleto')})</span></p>
              <p className="text-xs text-zinc-400 mt-1 capitalize"><span className="text-zinc-500">Envio:</span> {getMeta('metodo_envio')}</p>
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2 shrink-0">
              <Package size={16} className="text-emerald-500" /> Itens do Pedido ({pedido.line_items?.length})
            </h3>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
              <div className="max-h-[40vh] overflow-y-auto custom-scrollbar">
                <ul className="divide-y divide-zinc-800/50">
                  {pedido.line_items?.map(item => (
                    <li key={item.id} className="p-3 flex items-start justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">SKU: {item.sku} | Qtd: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-bold text-zinc-100 whitespace-nowrap mt-1">{formatarMoeda(item.total)}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex justify-between items-center shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.2)]">
                <span className="text-sm font-medium text-zinc-400">Total do Pedido:</span>
                <span className="text-xl font-bold text-emerald-400">{formatarMoeda(pedido.total)}</span>
              </div>
              
              {/* 🟢 AQUI ESTÁ O BOTÃO MAGNÍFICO DE PAGAR AGORA */}
              {pedido.status === 'aguardando-pagamento' && (
                <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
                  <button onClick={() => { onClose(); onPagarAgora(pedido); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2">
                    <CreditCard size={18} /> Pagar Agora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TELA PRINCIPAL
// ==========================================
export default function HistoricoPedidosB2B() {
  const [user, setUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [pedidoParaPagar, setPedidoParaPagar] = useState(null); // 🟢 Controle do modal de pagamento

  useEffect(() => {
    const savedUser = localStorage.getItem("raizan_user");
    if (savedUser) { setUser(JSON.parse(savedUser)); } 
    else { window.location.href = "/login-b2b"; }
  }, []);

  useEffect(() => { if (user) carregarPedidos(); }, [user, page]);

  const carregarPedidos = async () => {
    setLoading(true);
    try {
      const payload = { page, limit: 15, clienteEmail: user.email };
      const response = await fetch(`${getApiUrl()}/api/b2b/pedidos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (data.success) { setPedidos(data.pedidos); setTotalPages(data.totalPages); } 
      else { toast.error("Erro ao carregar histórico."); }
    } catch (error) { toast.error("Erro de conexão."); }
    setLoading(false);
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!user) return <div className="h-screen bg-[#09090b]"></div>;

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-800/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between w-full">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                    <FileText className="text-emerald-400" /> Meus Pedidos
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1">Acompanhe o status das suas compras e acesse os comprovantes.</p>
                </div>
                <button onClick={carregarPedidos} disabled={loading} className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-zinc-400 hover:text-emerald-400 transition-all shadow-sm group flex items-center gap-2">
                  <RefreshCw size={18} className={loading ? "animate-spin text-emerald-500" : "group-hover:rotate-180 transition-transform duration-500"} />
                  <span className="text-sm font-medium hidden sm:block">Atualizar</span>
                </button>
              </div>
            </div>

            <div className="border border-zinc-800/60 bg-[#0c0c0e] rounded-2xl overflow-hidden relative shadow-xl min-h-[400px]">
              {loading && (
                <div className="absolute inset-0 z-10 bg-[#0c0c0e]/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800/60">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-2xl">ID do Pedido</th>
                      <th className="px-6 py-4">Data da Compra</th>
                      <th className="px-6 py-4">Valor Total</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center rounded-tr-2xl">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {pedidos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                          <Package size={48} className="mx-auto mb-4 opacity-20" />
                          <p>Você ainda não realizou nenhum pedido no portal B2B.</p>
                        </td>
                      </tr>
                    )}
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-zinc-800/20 transition-colors group">
                        <td className="px-6 py-4"><span className="font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">#{pedido.id}</span></td>
                        <td className="px-6 py-4 text-zinc-400">{new Date(pedido.date_created).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 font-bold text-zinc-100">{formatarMoeda(pedido.total)}</td>
                        <td className="px-6 py-4"><StatusBadge status={pedido.status} /></td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setPedidoSelecionado(pedido)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all">
                            <Eye size={14} /> Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Página <span className="text-zinc-300 font-bold">{page}</span> de {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      <ModalDetalhes 
        pedido={pedidoSelecionado} 
        onClose={() => setPedidoSelecionado(null)} 
        onPagarAgora={(p) => setPedidoParaPagar(p)} // 🟢 Ativa o Modal de Pagamento
      />

      <ModalPagamentoRetentativa
        isOpen={!!pedidoParaPagar}
        onClose={() => setPedidoParaPagar(null)}
        pedido={pedidoParaPagar}
        user={user}
        onSucesso={carregarPedidos}
      />
    </div>
  );
}