"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  ShoppingBag, Search, Eye, Clock, Package, 
  CheckCircle2, AlertCircle, Calendar, X, FileText, Loader2, ChevronLeft, ChevronRight, RefreshCw, Truck,
  CreditCard, QrCode, CalendarDays, ArrowRight, Zap, ShieldCheck
} from "lucide-react";
import { getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// ==========================================
// COMPONENTE: BADGE DE STATUS DINÂMICO (IOS STYLE)
// ==========================================
const StatusBadge = ({ status }) => {
  const statusMap = {
    'aguardando-pagamento': { cor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icone: Clock, label: 'Aguardando Pagamento' },
    'pago': { cor: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', icone: CheckCircle2, label: 'Pago / Aprovado' },
    'processing': { cor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icone: Package, label: 'Em Separação' },
    'enviado': { cor: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', icone: Truck, label: 'Enviado / Trânsito' },
    'entregue': { cor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icone: CheckCircle2, label: 'Entregue' },
    'completed': { cor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icone: CheckCircle2, label: 'Concluído' },
    'cancelled': { cor: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', icone: AlertCircle, label: 'Cancelado' },
    'cancelado': { cor: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', icone: AlertCircle, label: 'Cancelado' }
  };

  const config = statusMap[status?.toLowerCase()] || statusMap['aguardando-pagamento'];
  const Icon = config.icone;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.cor} ${config.border}`}>
      <Icon size={12} /> {config.label}
    </div>
  );
};

// ==========================================
// COMPONENTE: MODAL DE RETENTATIVA DE PAGAMENTO
// ==========================================
function ModalPagamentoRetentativa({ isOpen, onClose, pedido, user, onSucesso }) {
  const [metodoPagamento, setMetodoPagamento] = useState('pix');
  const [prazoBoleto, setPrazoBoleto] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);
  const [isMpReady, setIsMpReady] = useState(false);
  const [mpKeyMissing, setMpKeyMissing] = useState(false);
  const [step, setStep] = useState('resumo');
  const [dadosPix, setDadosPix] = useState(null);
  const [tempoExpiracao, setTempoExpiracao] = useState(1800);
  const [isVerificando, setIsVerificando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (isOpen && pedido) {
      setStep('resumo'); setDadosPix(null); setIsProcessando(false); setTempoExpiracao(1800);
      if (user?.prazos_liberados && user.prazos_liberados.length > 0) {
        setPrazoBoleto(user.prazos_liberados[0]);
      }
      
      const buscarChave = async () => {
        try {
          const res = await fetch(`${getHubUrl()}/api/hub/pagamentos/metodos-ativos`, { headers: getHeaders() });
          const data = await res.json();
          if (data.mercadopago && data.mpPublicKey) {
            initMercadoPago(data.mpPublicKey, { locale: 'pt-BR' });
            setIsMpReady(true); setMpKeyMissing(false);
          } else { setMpKeyMissing(true); }
        } catch (e) { setMpKeyMissing(true); }
      };
      buscarChave();
    }
  }, [isOpen, pedido, user]);

  useEffect(() => {
    let timer;
    if (step === 'sucesso_pix' && tempoExpiracao > 0) {
      timer = setInterval(() => setTempoExpiracao(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, tempoExpiracao]);

  useEffect(() => {
    let intervalo;
    if (step === 'sucesso_pix' && dadosPix?.pedidoId) {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`${getHubUrl()}/api/hub/pedidos/status/${dadosPix.pedidoId}`, { headers: getHeaders() });
          const data = await res.json();
          if (data.status === 'pago') { setStep('concluido'); onSucesso(); }
        } catch (e) {}
      }, 5000); 
    }
    return () => clearInterval(intervalo);
  }, [step, dadosPix]);

  if (!isOpen || !pedido) return null;

  const totalFormatado = Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const processarPagamento = async (dadosCartaoMp = null) => {
    if (!user?.telefone || !user?.endereco || !user?.endereco?.cep) {
      toast.error("⚠️ Cadastro Incompleto! Vá no menu 'Meu Perfil' e preencha seu Endereço e Telefone antes de pagar.", { duration: 6000 });
      return;
    }

    if (metodoPagamento === 'faturado') {
      toast.error("Este pedido já está aguardando análise de faturamento. Para pagar agora e liberar o pedido na hora, escolha PIX ou Cartão.", { duration: 6000 });
      return;
    }

    setIsProcessando(true);
    
    const payload = {
      pedidoId: pedido.id,
      valor: pedido.total,
      metodo: metodoPagamento,
      dadosCartao: dadosCartaoMp,
      cliente: { codigo: user.codigo, nome: user.nome, cnpj: user.cnpj, email: user.email, telefone: user.telefone }
    };

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/pagamentos/gerar`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.tipo === 'pix') {
          setDadosPix({ ...data, pedidoId: pedido.id });
          setStep('sucesso_pix');
        } else {
          toast.success("Pagamento aprovado!");
          onSucesso(); 
          onClose(); 
        }
      } else { 
        toast.error(data.message || "Erro ao processar o pagamento."); 
      }
    } catch (e) { toast.error(`Falha na requisição: ${e.message}`); }
    setIsProcessando(false);
  };

  const verificarPagamentoManual = async () => {
    setIsVerificando(true);
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/status/${dadosPix.pedidoId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'pago') { setStep('concluido'); onSucesso(); }
      else toast.error("Pagamento não identificado. Aguarde e tente novamente.", { duration: 4000 });
    } catch (e) { toast.error("Erro ao comunicar com a Nuvem."); }
    setTimeout(() => setIsVerificando(false), 1000); 
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(dadosPix.qr_code);
    setCopiado(true); toast.success("Código PIX copiado!");
    setTimeout(() => setCopiado(false), 3000);
  };

  const formatarTempo = (segundos) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm transition-all animate-in fade-in" onClick={step === 'resumo' ? onClose : null}>
      <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        
        {/* HEADER GLASSMORPHISM */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CreditCard className="text-purple-600 dark:text-purple-400" size={20} /> Realizar Pagamento
          </h2>
          <button onClick={onClose} disabled={isProcessando} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 transition-colors disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {step === 'sucesso_pix' && dadosPix ? (
            <div className="p-6 sm:p-10 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                <QrCode size={32} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Pague via PIX</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-xs">Abra o aplicativo do seu banco e escaneie o código abaixo.</p>
              
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 mb-6 flex items-center justify-center gap-3 shadow-sm">
                <Clock size={18} className="text-indigo-500" />
                <span className="text-sm font-medium text-zinc-500">Expira em:</span>
                <span className={`text-xl font-mono font-black ${tempoExpiracao < 300 ? 'text-rose-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {formatarTempo(tempoExpiracao)}
                </span>
              </div>
              
              <div className="w-full max-w-[240px] bg-white p-3 rounded-3xl mb-6 shadow-sm border border-zinc-200 dark:border-zinc-800 relative overflow-hidden flex items-center justify-center min-h-[220px]">
                {dadosPix.qr_code_base64 && dadosPix.qr_code_base64.length > 50 ? (
                  <img src={`data:image/png;base64,${dadosPix.qr_code_base64}`} alt="PIX" className="w-48 h-48 relative z-10 object-contain" />
                ) : (
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dadosPix.qr_code)}`} alt="PIX" className="w-48 h-48 relative z-10 object-contain" />
                )}
              </div>
              
              <div className="w-full max-w-sm space-y-2 mb-6">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left block ml-1">Pix Copia e Cola</label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input type="text" readOnly value={dadosPix.qr_code} className="w-full sm:flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-4 py-3 rounded-xl text-xs outline-none font-mono truncate shadow-inner" />
                  <button onClick={copiarPix} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${copiado ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900'}`}>
                    {copiado ? <CheckCircle2 size={16} /> : 'Copiar'}
                  </button>
                </div>
              </div>

              <button onClick={verificarPagamentoManual} disabled={isVerificando} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 mb-2 font-medium">
                <RefreshCw size={14} className={isVerificando ? "animate-spin text-indigo-500" : ""} />
                {isVerificando ? "Verificando com o banco..." : "Já paguei, mas a tela não mudou"}
              </button>
            </div>
          ) : step === 'concluido' ? (
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                <CheckCircle2 size={40} className="animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Pagamento Aprovado!</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">Obrigado! Seu pagamento foi processado com sucesso e o pedido já está sendo preparado.</p>
              <button onClick={onClose} className="w-full max-w-xs py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-md transition-all">
                Fechar
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-6 shadow-sm">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Total a pagar</span>
                <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 break-words">{totalFormatado}</span>
              </div>

              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 ml-1">Selecione a forma de pagamento</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setMetodoPagamento('pix')} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${metodoPagamento === 'pix' ? 'border-indigo-500 bg-white dark:bg-[#121214] shadow-sm' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metodoPagamento === 'pix' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}><QrCode size={18} /></div>
                  <div className="text-left"><p className={`text-sm font-bold leading-tight ${metodoPagamento === 'pix' ? 'text-indigo-700 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>PIX</p><p className="text-[10px] text-zinc-400 mt-0.5">À Vista</p></div>
                </button>
                <button onClick={() => setMetodoPagamento('cartao')} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${metodoPagamento === 'cartao' ? 'border-blue-500 bg-white dark:bg-[#121214] shadow-sm' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metodoPagamento === 'cartao' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}><CreditCard size={18} /></div>
                  <div className="text-left"><p className={`text-sm font-bold leading-tight ${metodoPagamento === 'cartao' ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Cartão</p><p className="text-[10px] text-zinc-400 mt-0.5">Crédito</p></div>
                </button>
              </div>

              {metodoPagamento === 'cartao' && (
                <div className="mt-4 mb-6">
                  {mpKeyMissing ? <p className="text-rose-500 text-sm text-center font-medium">O gateway de pagamento não está ativo.</p> : !isMpReady ? <div className="flex flex-col items-center p-6"><Loader2 size={24} className="animate-spin text-purple-500 mb-2"/><p className="text-xs text-zinc-500 uppercase">Conectando...</p></div> : (
                    <div className="bg-zinc-50 dark:bg-[#121214] p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <Payment
                        initialization={{ amount: Number(pedido.total) }}
                        customization={{ visual: { style: { theme: 'default' } }, paymentMethods: { creditCard: 'all', debitCard: 'all' } }}
                        onSubmit={async (param) => processarPagamento(param.formData)}
                      />
                    </div>
                  )}
                </div>
              )}

              {metodoPagamento !== 'cartao' && (
                <button onClick={() => processarPagamento(null)} disabled={isProcessando} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl text-sm font-bold shadow-[0_5px_15px_rgba(147,51,234,0.25)] transition-all flex justify-center items-center gap-2 active:scale-95">
                  {isProcessando ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {isProcessando ? 'Processando...' : 'Gerar Código de Pagamento'}
                </button>
              )}
            </div>
          )}
        </div>
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
  
  // 🟢 FUNÇÃO MÁGICA: Limpa e formata os números gigantes que o banco de dados enviou
  const formatarTextoHistorico = (texto) => {
    if (!texto) return "";
    return texto.replace(/R\$\s*(-?\d+(\.\d+)?)/g, (match, numeroStr) => {
      const valor = parseFloat(numeroStr);
      return isNaN(valor) ? match : formatarMoeda(valor);
    });
  };

  const dataAjustada = new Date(pedido.date_created).toLocaleString("pt-BR");
  
  const getMeta = (key) => { const meta = pedido.meta_data?.find(m => m.key === key); return meta ? meta.value : "Não informado"; };

  const metodoOrigem = pedido.payment_method || getMeta('metodo_pagamento');
  let metodoFormatado = metodoOrigem === 'faturado' ? 'Boleto ERP' : metodoOrigem === 'pix' ? 'PIX' : metodoOrigem === 'cartao' ? 'Cartão de Crédito' : metodoOrigem;
  if (!metodoFormatado) metodoFormatado = 'Não Informado';

  const envioOrigem = getMeta('metodo_envio');
  const envioFormatado = envioOrigem !== 'Não informado' ? envioOrigem : 'Transportadora Padrão';

  const historicoEdicoes = (pedido.meta_data || []).filter(m => m.key === 'historico_edicao');

  // 🟢 MATEMÁTICA FINANCEIRA DO RODAPÉ
  const subtotalItens = pedido.line_items?.reduce((acc, item) => {
    const precoItem = parseFloat(item.price || item.preco_unitario || 0);
    const qtdItem = parseInt(item.quantity || item.qtd || 1);
    return acc + (item.total ? parseFloat(item.total) : (precoItem * qtdItem));
  }, 0) || 0;

  const totalPedido = parseFloat(pedido.total || 0);
  const diferencaValores = totalPedido - subtotalItens; 

  const handleSolicitarDocs = async () => {
    const toastId = toast.loading("Enviando solicitação para a equipe...");
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/solicitar-documentos`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ pedidoId: pedido.id })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Solicitação enviada com sucesso!", { id: toastId });
        onClose(); 
      } else {
        toast.error(data.message || "Erro ao solicitar.", { id: toastId });
      }
    } catch (e) {
      toast.error("Erro de comunicação com o servidor.", { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER GLASSMORPHISM */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 break-words tracking-tight">
              <ShoppingBag className="text-purple-600 dark:text-purple-400" size={20} /> Pedido #{pedido.id}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1 font-medium"><Calendar size={12}/> {dataAjustada}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-widest">Status Atual</p>
              <StatusBadge status={pedido.status} />
            </div>
            <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[10px] text-zinc-400 font-bold mb-1 uppercase tracking-widest">Pagamento e Envio</p>
              <p className="text-sm text-zinc-800 dark:text-zinc-200 font-bold uppercase break-words">{metodoFormatado} {getMeta('prazo_boleto') !== 'Não informado' && <span className="text-purple-600 dark:text-purple-400 ml-1">({getMeta('prazo_boleto')})</span>}</p>
              <p className="text-[11px] text-zinc-500 mt-1.5 capitalize font-medium flex items-center gap-1"><Truck size={12} className="text-zinc-400" /> {envioFormatado}</p>
            </div>
          </div>

          {historicoEdicoes.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 shrink-0">
              <h3 className="text-xs font-black text-amber-700 dark:text-amber-500 flex items-center gap-2 mb-3 uppercase tracking-wider">
                <AlertCircle size={14} /> Avisos e Edições do Pedido
              </h3>
              <div className="space-y-3 divide-y divide-amber-200/50 dark:divide-amber-800/30">
                {historicoEdicoes.map((hist, index) => (
                  <div key={index} className="pt-3 first:pt-0">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      <span className="text-[10px] text-amber-600/80 dark:text-amber-500/80 font-black mr-2 uppercase tracking-widest">Atualização:</span> 
                      {/* 🟢 A MÁGICA DO REGEX CONTINUA AQUI */}
                      {formatarTextoHistorico(hist.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2 ml-1">
              Itens do Pedido ({pedido.line_items?.length})
            </h3>
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
              <div className="max-h-[35vh] overflow-y-auto custom-scrollbar p-1">
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50 px-3">
                  {pedido.line_items?.map((item, idx) => {
                    const precoItem = parseFloat(item.price || item.preco_unitario || 0);
                    const qtdItem = parseInt(item.quantity || item.qtd || 1);
                    const totalItem = item.total ? parseFloat(item.total) : (precoItem * qtdItem);

                    return (
                      <li key={item.id || item.sku || idx} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-xl px-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">{item.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-1 font-medium break-words">
                            SKU: {item.sku || 'N/A'} | <span className="text-zinc-700 dark:text-zinc-300 font-bold">{qtdItem}x</span> {formatarMoeda(precoItem)}
                          </p>
                        </div>
                        <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 whitespace-nowrap sm:mt-0.5">
                          {formatarMoeda(totalItem)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 RODAPÉ FINANCEIRO COMPLETO (CLEAN) */}
        <div className="p-5 sm:p-6 bg-zinc-50/80 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 shrink-0">
          
          <div className="flex flex-col gap-2 w-full sm:w-72 self-end text-xs font-medium">
            <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
              <span>Subtotal dos Itens:</span>
              <span className="text-zinc-900 dark:text-zinc-100">{formatarMoeda(subtotalItens)}</span>
            </div>
            
            {Math.abs(diferencaValores) > 0.01 && (
              <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                <span>{diferencaValores > 0 ? 'Frete / Acréscimos (+):' : 'Descontos Aplicados (-):'}</span>
                <span className={`${diferencaValores > 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-emerald-500'}`}>
                  {formatarMoeda(Math.abs(diferencaValores))}
                </span>
              </div>
            )}

            <div className="pt-3 pb-1 border-t border-zinc-200 dark:border-zinc-800/60 flex justify-between items-end gap-3 mt-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Final</span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">{formatarMoeda(totalPedido)}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 mt-2">
            {/* 🟢 BOTÃO DE PAGAR MAIS ELEGANTE */}
            {pedido.status === 'aguardando-pagamento' && (
              <button onClick={() => { onClose(); onPagarAgora(pedido); }} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl text-sm font-bold shadow-[0_5px_15px_rgba(147,51,234,0.25)] transition-all flex items-center justify-center gap-2 active:scale-95">
                <CreditCard size={18} /> Pagar Agora
              </button>
            )}

            {getMeta('link_xml_boleto') !== "Não informado" ? (
              <a href={getMeta('link_xml_boleto')} target="_blank" rel="noreferrer" className="w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 text-blue-600 dark:text-blue-400 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                <FileText size={18} /> Baixar XML / Boleto Anexado
              </a>
            ) : getMeta('solicitacao_documentos') === 'pendente' ? (
              <div className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                <Clock size={18} /> Documentos Solicitados (Em Análise)
              </div>
            ) : (pedido.status !== 'aguardando-pagamento' && pedido.status !== 'cancelled' && pedido.status !== 'cancelado') ? (
              <button onClick={handleSolicitarDocs} className="w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                <FileText size={18} className="text-zinc-400" /> Solicitar 2ª Via do Boleto ou XML
              </button>
            ) : null}
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
  const [pedidoParaPagar, setPedidoParaPagar] = useState(null); 

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
      
      const response = await fetch(`${getHubUrl()}/api/hub/pedidos/b2b`, { 
        method: "POST", 
        headers: getHeaders(), 
        body: JSON.stringify(payload) 
      });
      const data = await response.json();
      
      if (data.success) { 
        setPedidos(data.pedidos); 
        setTotalPages(data.totalPages); 
      } 
      else { toast.error("Erro ao carregar histórico."); }
    } catch (error) { toast.error("Erro de conexão."); }
    setLoading(false);
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!user) return <div className="h-screen bg-zinc-50 dark:bg-[#09090b] transition-colors duration-300"></div>;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          
          {/* EFEITO GLOW RAIZAN */}
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            
            <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden transition-colors duration-300">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
                    <FileText className="text-purple-600 dark:text-purple-400" size={28} /> Meus Pedidos
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Acompanhe o status das suas compras e acesse os comprovantes.</p>
                </div>
                <button onClick={carregarPedidos} disabled={loading} className="w-full sm:w-auto justify-center px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm group flex items-center gap-2 font-bold text-sm">
                  <RefreshCw size={16} className={loading ? "animate-spin text-purple-500" : "group-hover:rotate-180 transition-transform duration-500"} />
                  <span className="hidden sm:block">Atualizar</span>
                </button>
              </div>
            </div>

            <div className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-[2rem] overflow-hidden relative shadow-lg shadow-zinc-200/20 dark:shadow-none min-h-[400px] transition-colors duration-300">
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-600 animate-spin" />
                </div>
              )}

              <div className="w-full overflow-x-auto p-2">
                <table className="w-full min-w-[720px] text-xs sm:text-sm text-left border-collapse">
                  <thead className="text-zinc-400 dark:text-zinc-500 font-bold border-b border-zinc-100 dark:border-zinc-800/60 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-4">ID do Pedido</th>
                      <th className="px-5 py-4">Data da Compra</th>
                      <th className="px-5 py-4 text-right">Valor Total</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4 text-center w-32">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {pedidos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="5" className="px-5 py-20 text-center text-zinc-500">
                          <Package size={48} className="mx-auto mb-4 opacity-30" />
                          <p className="font-medium text-sm">Você ainda não realizou nenhum pedido no portal B2B.</p>
                        </td>
                      </tr>
                    )}
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors group cursor-pointer" onClick={() => setPedidoSelecionado(pedido)}>
                        <td className="px-5 py-4">
                          <span className="font-black text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-base">#{pedido.id}</span>
                        </td>
                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 font-medium">
                          {new Date(pedido.date_created).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-black text-zinc-900 dark:text-zinc-100 text-sm">{formatarMoeda(pedido.total)}</span>
                        </td>
                        <td className="px-5 py-4 text-center"><StatusBadge status={pedido.status} /></td>
                        <td className="px-5 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); setPedidoSelecionado(pedido); }} className="inline-flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-900 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-500/20 dark:hover:text-purple-400 text-zinc-500 rounded-xl transition-all shadow-sm">
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center gap-4 justify-between text-sm bg-zinc-50/50 dark:bg-[#121214]/50">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                    Pág. <span className="text-zinc-900 dark:text-zinc-100">{page}</span> / {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 transition-colors disabled:opacity-50 shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 transition-colors disabled:opacity-50 shadow-sm"><ChevronRight size={16} /></button>
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
        onPagarAgora={(p) => setPedidoParaPagar(p)} 
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