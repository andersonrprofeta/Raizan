"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
// 🟢 1. LIXEIRA IMPORTADA AQUI (Trash2)
import { Search, ShoppingCart, CheckCircle2, AlertCircle, Package, Barcode, Loader2, DollarSign, Zap, ShoppingBag, X, FileText, QrCode, Building2, Truck, MapPin, CreditCard, CalendarDays, ChevronLeft, ChevronRight, Tag, Clock, ShieldCheck, RefreshCw, Trash2 } from "lucide-react";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// ==========================================
// CONFIGURAÇÕES DO MOTOR DE IMAGENS 
// ==========================================
const BASE_URL_IMAGENS = "https://portalseller.com.br/img_pro/";

const getProductImageUrl = (ean) => {
  if (ean && ean.trim() !== "") return `${BASE_URL_IMAGENS}${ean}.webp`;
  return "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto";
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// ==========================================
// COMPONENTE: MODAL DE CHECKOUT B2B
// ==========================================
// 🟢 2. ADICIONEI "onRemoverItem" AQUI NAS PROPS
function ModalCheckout({ isOpen, onClose, carrinho, produtos, tabelaAtiva, onFinalizarPedido, onRemoverItem }) {
  const [metodoPagamento, setMetodoPagamento] = useState('faturado');
  const [prazoBoleto, setPrazoBoleto] = useState('30'); 
  const [metodoEnvio, setMetodoEnvio] = useState('transportadora');
  const [isProcessando, setIsProcessando] = useState(false);

  // 🟢 1. ADICIONE ESSA LINHA AQUI! (Estado do usuário)
  const [user, setUser] = useState(null);
  
  // 🟢 ESTADOS DA TELA E PIX
  const [step, setStep] = useState('resumo'); // 'resumo', 'sucesso_pix', ou 'concluido'
  const [dadosPix, setDadosPix] = useState(null);
  const [copiado, setCopiado] = useState(false);
  //alteração nova do anderson
  const [pedidoFinalizadoId, setPedidoFinalizadoId] = useState(null);
  
  // 🟢 NOVOS ESTADOS: Cronômetro e Verificação Manual
  const [tempoExpiracao, setTempoExpiracao] = useState(1800); // 30 minutos em segundos
  const [isVerificando, setIsVerificando] = useState(false);

  // Zera as coisas quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setStep('resumo'); setDadosPix(null); setCopiado(false); setIsProcessando(false); setTempoExpiracao(1800);
      setPedidoFinalizadoId(null); //remover se nao der certo kkkkkkkk
    }
    // 🟢 2. ADICIONE ESTE BLOCO AQUI! (Ele lê a memória do navegador)
    const savedUser = localStorage.getItem("raizan_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [isOpen]);

  //MARCAÇÃO PARA NÃO FAZER ERRADO
  // 🟢 ESTADOS DE SEGURANÇA DO MERCADO PAGO
  const [isMpReady, setIsMpReady] = useState(false);
  const [mpKeyMissing, setMpKeyMissing] = useState(false);

  // 🟢 INICIALIZAÇÃO BLINDADA DO MERCADO PAGO (BUSCANDO DIRETO DO MOTOR)
  useEffect(() => {
    if (isOpen) {
      const buscarChave = async () => {
        try {
          // 1. O Front-end bate na porta do motor e pede o status/chaves
          const res = await fetch(`${getApiUrl()}/api/config/status`, { headers: getHeaders() });
          const data = await res.json();
          
          // 2. Se o motor devolver a chave azul, a gente liga o Mercado Pago!
          if (data.mpPublicKey && data.mpPublicKey.trim() !== "") {
            initMercadoPago(data.mpPublicKey, { locale: 'pt-BR' });
            setIsMpReady(true);
            setMpKeyMissing(false);
          } else {
            setMpKeyMissing(true); // O motor não tem a chave
          }
        } catch (e) {
          console.log("Erro ao buscar a chave do MP", e);
          setMpKeyMissing(true);
        }
      };
      
      buscarChave();
    }
  }, [isOpen]);
  //FIM DA MARCAÇÃO



  // 🟢 EFEITO DO CRONÔMETRO (Desce 1 segundo a cada segundo)
  useEffect(() => {
    let timer;
    if (step === 'sucesso_pix' && tempoExpiracao > 0) {
      timer = setInterval(() => setTempoExpiracao(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, tempoExpiracao]);

  // Formata os segundos para "MM:SS"
  const formatarTempo = (segundos) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // O RADAR AUTOMÁTICO DO PIX (Mantemos ele aqui pro futuro)
  useEffect(() => {
    let intervalo;
    if (step === 'sucesso_pix' && dadosPix?.pedidoId) {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`${getApiUrl()}/api/b2b/status-pedido/${dadosPix.pedidoId}`, { headers: getHeaders() });
          const data = await res.json();
          if (data.status === 'pago') setStep('concluido');
        } catch (e) { console.log("Radar falhou", e); }
      }, 5000); 
    }
    return () => clearInterval(intervalo);
  }, [step, dadosPix]);

  // 🟢 FUNÇÃO DE VERIFICAÇÃO MANUAL DO PIX
  const verificarPagamentoManual = async () => {
    setIsVerificando(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/b2b/status-pedido/${dadosPix.pedidoId}`, { headers: getHeaders() });
      const data = await res.json();
      
      if (data.status === 'pago') {
        setStep('concluido');
      } else {
        toast.error("Pagamento não identificado. Se você já pagou, aguarde alguns segundos e tente novamente.", { duration: 4000 });
      }
    } catch (e) { 
      toast.error("Erro ao comunicar com o servidor.");
    }
    setTimeout(() => setIsVerificando(false), 1000); // Dá um tempinho visual na bolinha girando
  };

  if (!isOpen) return null;

  const itensComprados = Object.values(carrinho).map(p => {
    const precoOriginal = p[tabelaAtiva] !== undefined ? parseFloat(p[tabelaAtiva]) : parseFloat(p.PDPRECO);
    
    // 🟢 MATEMÁTICA CORRIGIDA NO CHECKOUT: Só aplica desconto se a quantidade bater a meta!
    const minExigido = p.qtd_minima_promocao || 1;
    const atingiuMinimo = p.em_promocao && p.qtd >= minExigido;
    const precoFinal = atingiuMinimo ? parseFloat(p.preco_promocional) : precoOriginal;
    
    // Guardamos a flag "atingiuMinimo" para poder pintar de verde lá embaixo
    return { ...p, precoUsado: precoFinal, totalItem: precoFinal * p.qtd, atingiuMinimo };
  });

  // 🟢 FECHA O MODAL AUTOMATICAMENTE SE O USUÁRIO REMOVER O ÚLTIMO ITEM
  if (itensComprados.length === 0 && step === 'resumo') {
    onClose();
    return null;
  }

  const subtotal = itensComprados.reduce((acc, item) => acc + item.totalItem, 0);

  const handleConfirmar = async () => {
    setIsProcessando(true);
    const resultado = await onFinalizarPedido({ 
      itens: itensComprados, subtotal, metodoPagamento, 
      prazoBoleto: metodoPagamento === 'faturado' ? prazoBoleto : null, metodoEnvio 
    });
    setIsProcessando(false);

    if (resultado && resultado.pagamento?.tipo === 'pix') {
      setDadosPix({ ...resultado.pagamento, pedidoId: resultado.pedidoId });
      setPedidoFinalizadoId(resultado.pedidoId); // 🟢 SALVA O ID AQUI
      setTempoExpiracao(1800); //aguarda 30 minutos
      setStep('sucesso_pix');
    } else if (resultado) {
      setPedidoFinalizadoId(resultado.pedidoId); // 🟢 SALVA O ID AQUI
      setStep('concluido'); // 🟢 AGORA O BOLETO TAMBÉM MOSTRA A TELA DE SUCESSO!
    }
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(dadosPix.qr_code);
    setCopiado(true); toast.success("Código PIX copiado!");
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-900/60 dark:bg-black/70 backdrop-blur-sm transition-all" onClick={step === 'resumo' ? onClose : null}>
      <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
          <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {step === 'resumo' && <><ShoppingCart className="text-emerald-500 dark:text-emerald-400" /> Finalizar Pedido</>}
            {step === 'sucesso_pix' && <><Clock className="text-teal-500 dark:text-teal-400" /> Aguardando Pagamento</>}
            {step === 'concluido' && <><CheckCircle2 className="text-emerald-500 dark:text-emerald-400" /> Pedido Concluído</>}
          </h2>
          <button onClick={onClose} disabled={isProcessando} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* TELA 3: SUCESSO ABSOLUTO (PAGO!) */}
        {step === 'concluido' && (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 text-center animate-in zoom-in-90 duration-500">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">Obrigado pelo seu pedido!</h2>
            <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-lg">
              {metodoPagamento === 'pix' && `Recebemos o seu pagamento via PIX. Seu pedido #${pedidoFinalizadoId} já foi faturado e enviado para a nossa equipe logística.`}
              {metodoPagamento === 'cartao' && `Recebemos o seu pagamento via Cartão de Crédito. Seu pedido #${pedidoFinalizadoId} foi aprovado e enviado para a separação.`}
              {metodoPagamento === 'faturado' && `Seu pedido #${pedidoFinalizadoId} faturado via Boleto foi gerado com sucesso e enviado para análise da equipe logística.`}
            </p>
            <div className="flex w-full max-w-xl flex-col sm:flex-row gap-3 sm:gap-4">
              <button onClick={onClose} className="w-full sm:w-auto px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-transparent rounded-xl font-bold transition-all">
                Voltar ao Catálogo
              </button>
              <button onClick={() => { onClose(); window.location.href = "/b2b-historico"; }} className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                Acompanhar no Histórico
              </button>
            </div>
          </div>
        )}

        {/* 🟢 TELA 2: QR CODE PIX (REFORMULADA COM SEGURANÇA E CRONÔMETRO) */}
        {step === 'sucesso_pix' && dadosPix && (
          <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center animate-in slide-in-from-right-8 overflow-y-auto custom-scrollbar">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mb-4 relative">
              <QrCode size={24} />
              <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-ping"></div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Pague via PIX para liberar o envio</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-md">Abra o aplicativo do seu banco e escaneie o código abaixo.</p>
            
            {/* 🟢 CRONÔMETRO */}
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 sm:px-4 py-2.5 mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 shadow-inner">
              <Clock size={18} className="text-teal-500 dark:text-teal-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">O código expira em:</span>
              <span className={`text-xl font-mono font-black ${tempoExpiracao < 300 ? 'text-rose-500 dark:text-rose-400 animate-pulse' : 'text-teal-600 dark:text-teal-400'}`}>
                {formatarTempo(tempoExpiracao)}
              </span>
            </div>
            
           {/* 🟢 CAIXA DO QR CODE BLINDADA */}
           <div className="w-full max-w-[260px] bg-white p-3 rounded-2xl mb-6 shadow-[0_0_30px_rgba(20,184,166,0.15)] border-4 border-teal-500/20 relative overflow-hidden group flex items-center justify-center min-h-[200px]">
              {dadosPix.qr_code_base64 && dadosPix.qr_code_base64.length > 50 ? (
                <img src={`data:image/png;base64,${dadosPix.qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48 relative z-10 object-contain" />
              ) : (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dadosPix.qr_code)}`} alt="QR Code PIX Gerado" className="w-48 h-48 relative z-10 object-contain" />
              )}
            </div>

            <div className="w-full max-w-md space-y-3 mb-6">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-left block">Pix Copia e Cola</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input type="text" readOnly value={dadosPix.qr_code} className="w-full sm:flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-4 py-3 rounded-xl text-sm outline-none font-mono truncate" />
                <button onClick={copiarPix} className={`w-full sm:w-auto px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${copiado ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}>
                  {copiado ? <CheckCircle2 size={18} /> : 'Copiar'}
                </button>
              </div>
            </div>

            {/* 🟢 BOTÃO DE CHECAGEM MANUAL */}
            <button 
              onClick={verificarPagamentoManual} 
              disabled={isVerificando}
              className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors disabled:opacity-50 px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 mb-6"
            >
              <RefreshCw size={16} className={isVerificando ? "animate-spin text-teal-500 dark:text-teal-400" : ""} />
              {isVerificando ? "Verificando com o banco..." : "Já paguei, mas a tela não mudou"}
            </button>

            {/* 🟢 RODAPÉ DE SEGURANÇA */}
            <div className="flex flex-col items-center gap-1.5 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 w-full max-w-md">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <p>Pagamento 100% seguro pelo <b>Mercado Pago</b>.</p>
              </div>
              <p className="text-[11px] text-zinc-500 text-center">
                Ambiente criptografado. Seu pedido será liberado automaticamente após a aprovação da instituição financeira.
              </p>
            </div>

          </div>
        )}

        {/* TELA 1: RESUMO DO PEDIDO */}
        {step === 'resumo' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 animate-in slide-in-from-left-8">
            <div className="space-y-6">
              
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">Forma de Pagamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={() => setMetodoPagamento('faturado')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'faturado' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <FileText size={20} className="mb-1.5" />
                    <span className="text-xs font-semibold">Boleto</span>
                  </button>
                  <button onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'pix' ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <QrCode size={20} className="mb-1.5" />
                    <span className="text-xs font-semibold">PIX (API)</span>
                  </button>
                  <button onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'cartao' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <CreditCard size={20} className="mb-1.5" />
                    <span className="text-xs font-semibold">Cartão</span>
                  </button>
                </div>

                <div className="pt-2">
                  {/* 🟢 SELEÇÃO DINÂMICA DE PRAZOS (VEM DO ERP) */}
                        {metodoPagamento === 'faturado' && (
                          <div className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-3 bg-white dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3 flex items-center gap-2">
                              <CalendarDays size={16} className="text-emerald-500" />
                              Selecione um prazo de faturamento disponível para o seu CNPJ:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {user?.prazos_liberados && user.prazos_liberados.length > 0 ? (
                                user.prazos_liberados.map((prazo, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setPrazoBoleto(prazo)}
                                    className={`p-4 rounded-xl border text-left transition-all ${prazoBoleto === prazo ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/50' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${prazoBoleto === prazo ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                        <CalendarDays size={20} />
                                      </div>
                                      <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{prazo}</p>
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Aprovado ERP</p>
                                      </div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="col-span-2 p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                                  <p className="text-zinc-500 text-sm">Nenhum prazo de faturamento especial localizado no seu cadastro.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                  {metodoPagamento === 'pix' && (
                    <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-lg text-teal-600 dark:text-teal-400 text-sm flex items-start gap-2">
                      <QrCode size={18} className="shrink-0 mt-0.5" />
                      <p>O QR Code do Mercado Pago será gerado na próxima tela após a confirmação do pedido.</p>
                    </div>
                  )}

                            {/* 🟢 O FORMULÁRIO DE CARTÃO DO MERCADO PAGO BLINDADO */}
                            {metodoPagamento === 'cartao' && (
                              <div className="animate-in fade-in slide-in-from-top-2 mt-4">
                                
                                {mpKeyMissing ? (
                                  <div className="flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <AlertCircle size={32} className="text-rose-500 mb-3" />
                                    <p className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">Chave Pública Ausente</p>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Vá no painel de Configurações e adicione a <b>Public Key</b> do Mercado Pago.</p>
                                  </div>
                                ) : subtotal < 2 ? (
                                  <div className="flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <AlertCircle size={32} className="text-amber-500 mb-3" />
                                    <p className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">Valor Mínimo Não Atingido</p>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">As operadoras exigem um pedido mínimo de <b>R$ 2,00</b>.</p>
                                  </div>
                                ) : !isMpReady ? (
                                  <div className="flex flex-col items-center justify-center p-8 text-zinc-500">
                                    <Loader2 size={32} className="animate-spin mb-3 text-emerald-500" />
                                    <p className="font-medium text-sm text-zinc-500 dark:text-zinc-400">Conectando ao cofre seguro...</p>
                                  </div>
                                ) : (
                                  <Payment
                                    initialization={{ amount: subtotal }}
                                    customization={{ 
                                      visual: { style: { theme: 'default' } }, // O MP vai se adaptar razoavelmente.
                                      paymentMethods: { creditCard: 'all', debitCard: 'all' } 
                                    }}
                                    onSubmit={async (param) => {
                                      setIsProcessando(true);
                                      
                                      const resultado = await onFinalizarPedido({ 
                                        itens: itensComprados, 
                                        subtotal, 
                                        metodoPagamento: 'cartao', 
                                        prazoBoleto: null, 
                                        metodoEnvio,
                                        dadosCartaoMp: param.formData 
                                      });
                                      
                                      setIsProcessando(false);
                                      if (resultado) setStep('concluido');
                                    }}
                                  />
                                )}
                              </div>
                            )}
                    </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">Método de Envio</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${metodoEnvio === 'transportadora' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <input type="radio" name="envio" checked={metodoEnvio === 'transportadora'} onChange={() => setMetodoEnvio('transportadora')} className="hidden" />
                    <div className={`p-2 rounded-lg ${metodoEnvio === 'transportadora' ? 'bg-emerald-500 text-white dark:text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}><Truck size={18} /></div>
                    <div>
                      <p className={`text-sm font-bold ${metodoEnvio === 'transportadora' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Transportadora Parceira</p>
                      <p className="text-xs text-zinc-500">Frete FOB (A ser calculado pela logística)</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${metodoEnvio === 'retirada' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <input type="radio" name="envio" checked={metodoEnvio === 'retirada'} onChange={() => setMetodoEnvio('retirada')} className="hidden" />
                    <div className={`p-2 rounded-lg ${metodoEnvio === 'retirada' ? 'bg-emerald-500 text-white dark:text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}><MapPin size={18} /></div>
                    <div>
                      <p className={`text-sm font-bold ${metodoEnvio === 'retirada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Retirada no CD Rafany</p>
                      <p className="text-xs text-zinc-500">Isento de frete. Agendamento necessário.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden min-h-[300px] shadow-sm dark:shadow-none">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                Resumo dos Itens ({itensComprados.length})
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800/50 px-2">
                  {itensComprados.map(item => (
                    // 🟢 3. ADICIONEI O BOTÃO DE REMOVER AQUI EMBAIXO
                    <li key={item.PDCODPRO} className="py-3 flex items-start justify-between gap-3 sm:gap-4 group">
                      <div className="flex-1">
                        <p className="text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 break-words">{item.PDNOME}</p>
                        <p className="text-xs text-zinc-500">
                          SKU: {item.PDCODPRO} | {item.qtd}x {formatarMoeda(item.precoUsado)} 
                          {/* 🟢 Só mostra o texto de Oferta se ele realmente bateu a quantidade mínima */}
                          {item.atingiuMinimo && <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">(Oferta Aplicada)</span>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {formatarMoeda(item.totalItem)}
                        </div>
                        <button 
                          onClick={() => onRemoverItem(item.PDCODPRO)}
                          className="text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                          title="Remover do carrinho"
                        >
                          <Trash2 size={14} /> <span className="hidden sm:inline">Remover</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 space-y-4">
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400 text-sm">
                  <span>Subtotal Itens:</span><span className="text-zinc-900 dark:text-zinc-100">{formatarMoeda(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400 text-sm pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
                  <span>Estimativa de Frete:</span><span className="italic">A calcular</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">Total Previsto:</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatarMoeda(subtotal)}</span>
                </div>
                  {/* Só mostra o botão verde se NÃO for cartão */}
                  {metodoPagamento !== 'cartao' && (
                      <button onClick={handleConfirmar} disabled={isProcessando} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 mt-4">
                        {isProcessando ? <><Loader2 size={18} className="animate-spin" /> Gerando Pedido...</> : 'Confirmar e Enviar Pedido'}
                      </button>
                    )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE AUXILIAR DO SELECTOR DE QTD
// ==========================================
function SeletorQuantidade({ id, qtd, onQtdChange }) {
  if (qtd > 0) {
    return (
      <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-emerald-500/30 rounded-lg overflow-hidden h-9 shadow-sm dark:shadow-none">
        <button onClick={() => onQtdChange(id, Math.max(0, qtd - 1))} className="w-8 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">-</button>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm w-6 text-center">{qtd}</span>
        <button onClick={() => onQtdChange(id, qtd + 1)} className="w-8 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">+</button>
      </div>
    );
  }
  return (
    <button onClick={() => onQtdChange(id, 1)} className="w-full h-9 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all text-xs shadow-sm dark:shadow-none">
      Adicionar
    </button>
  );
}

// ==========================================
// TELA PRINCIPAL: CATÁLOGO B2B
// ==========================================
export default function CatalogoB2B() {
  const [carrinho, setCarrinho] = useState({});
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tabelaAtiva, setTabelaAtiva] = useState("PDPRECO");
  
  // ESTADOS DA PAGINAÇÃO
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20); 
  const [totalPages, setTotalPages] = useState(1);

  // ESTADOS DAS OFERTAS
  const [somenteOfertas, setSomenteOfertas] = useState(false);
  const [listaOfertas, setListaOfertas] = useState([]);

  useEffect(() => {
    const carregarCarrinhoEListners = () => {
      const carrinhoSalvo = localStorage.getItem("@raizan:carrinho");
      if (carrinhoSalvo) {
        try { setCarrinho(JSON.parse(carrinhoSalvo)); } catch(e) { }
      }
    };
    
    carregarCarrinhoEListners();

    // 🟢 ESCUTA MUDANÇAS NO CARRINHO FEITAS PELA HEADER
    const syncCarrinho = () => {
      const c = localStorage.getItem("@raizan:carrinho");
      if(c) try { setCarrinho(JSON.parse(c)); } catch(e) {}
    };
    window.addEventListener('storage', syncCarrinho);

    // 🟢 Busca as promoções na NUVEM assim que a página carrega!
    carregarListaOfertasGlobais();

    return () => window.removeEventListener('storage', syncCarrinho);
  }, []);

  const carregarListaOfertasGlobais = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/promocoes`, { headers: getHeaders() });
      const data = await res.json();
      if(data.success) {
        const hoje = new Date();
        const ofertasAtivas = data.promocoes.filter(promo => {
          const inicio = new Date(promo.data_inicio);
          const fim = new Date(promo.data_fim);
          fim.setHours(23, 59, 59);
          return promo.ativo && hoje >= inicio && hoje <= fim;
        });
        setListaOfertas(ofertasAtivas);
      }
    } catch(e) { console.error("Erro ao buscar ofertas do modal"); }
  };

  // 🟢 MÁGICA DA PAGINAÇÃO: O Hook escuta a mudança do Checkbox "somenteOfertas"
  useEffect(() => {
    carregarProdutos();
  }, [page, limit, somenteOfertas]); 

  const carregarProdutos = async () => {
    // Se marcou o filtro de ofertas, mas não tem oferta cadastrada/ativa, não precisa nem chamar a API
    if (somenteOfertas && listaOfertas.length === 0) {
      setProdutos([]);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        search, 
        hideBlocked: true, 
        hideSamples: true, 
        page, 
        limit: Number(limit),
        // 🟢 INJEÇÃO DOS SKUS: Se o checkbox tá marcado, manda a lista. Se não, manda vazio.
        skusFiltro: somenteOfertas ? listaOfertas.map(o => o.sku) : []
      };
      
      const response = await fetch(`${getApiUrl()}/api/produtos`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (data.success) {
        const produtosFiltrados = data.produtos.filter(p => p.PDSTATUS !== 6 && p.PDSTATUS !== 8);
        setProdutos(produtosFiltrados); 
        
        if (data.totalPages) setTotalPages(data.totalPages);
        if (data.tabelaPrecoBase) setTabelaAtiva(data.tabelaPrecoBase);
      } else {
        toast.error(data.message || "Erro ao conectar com o banco de dados.");
      }
    } catch (error) { 
      toast.error("Erro ao carregar catálogo.");
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    carregarProdutos();
  };

  // Carimba a promoção nos produtos listados na tela para desenhar o desconto visualmente
  const produtosComPromocaoCarimbada = produtos.map(p => {
    const oferta = listaOfertas.find(o => o.sku === p.PDCODPRO.toString());
    if (oferta) {
      return { 
        ...p, 
        em_promocao: true, 
        preco_promocional: oferta.preco_promocional,
        qtd_minima_promocao: oferta.qtd_minima || 1 // 🟢 CARIMBANDO A QTD MÍNIMA AQUI!
      };
    }
    return { ...p, em_promocao: false };
  });

  const handleQuantidade = (produto, qtd) => {
    setCarrinho(prev => {
      const novo = { ...prev };
      if (qtd === 0) {
        delete novo[produto.PDCODPRO];
      } else {
        novo[produto.PDCODPRO] = { ...produto, qtd };
      }
      localStorage.setItem("@raizan:carrinho", JSON.stringify(novo));
      
      // 🟢 Avisa a Header que a quantidade no catálogo mudou!
      window.dispatchEvent(new Event('storage'));
      return novo;
    });
  };

const handleFinalizarPedido = async (dadosDoPedido) => {
    const savedUser = localStorage.getItem("raizan_user");
    if (!savedUser) {
      toast.error("Sessão expirada. Faça login novamente.");
      window.location.href = "/login-b2b";
      return null;
    }

    const userLogado = JSON.parse(savedUser);
    const payloadCompleto = {
      ...dadosDoPedido, 
      cliente: {
        codigo: userLogado.codigo,
        razao: userLogado.nome,
        cnpj: userLogado.cnpj,
        email: userLogado.email, 
        telefone: userLogado.telefone
      }
    };

    const toastId = toast.loading("Gerando pedido na Rafany..."); 
    
    try {
      const response = await fetch(`${getApiUrl()}/api/b2b/criar-pedido`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCompleto)
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Pedido #${data.pedidoId} gerado!`, { id: toastId });
        
        // Limpa o carrinho silenciosamente
        setCarrinho({}); 
        localStorage.removeItem("@raizan:carrinho"); 
        window.dispatchEvent(new Event('storage'));

        // Retorna os dados para o Modal saber o que desenhar na tela (O QR Code)
        return data; 
      } else {
        toast.error("Erro ao gerar pedido: " + data.message, { id: toastId });
        return null;
      }
    } catch (error) {
      toast.error("Erro de comunicação com o servidor.", { id: toastId });
      return null;
    }
  };

  const getEstiloTabelaPreco = (tabela) => {
    switch(tabela) {
      case 'PDPRECO2': return { cor: 'text-amber-600 dark:text-amber-400' };
      case 'PDPRECO3': return { cor: 'text-teal-600 dark:text-teal-400' };
      default: return { cor: 'text-emerald-600 dark:text-emerald-400' };
    }
  };
  const infoTabela = getEstiloTabelaPreco(tabelaAtiva);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 sm:p-5 lg:p-8 pb-36">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="bg-white dark:bg-zinc-900/40 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between shadow-sm dark:shadow-none transition-colors duration-300">
              <div className="w-full xl:w-auto">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                  <Package className="text-emerald-600 dark:text-emerald-400" /> Catálogo B2B Rafany
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Reponha o estoque da sua loja com a Rafany Distribuidora.</p>
              </div>

              <div className="flex w-full xl:w-auto items-stretch sm:items-center gap-3 flex-col sm:flex-row sm:flex-wrap xl:justify-end">
                
                <label className="w-full sm:w-auto flex items-center gap-2 cursor-pointer bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 px-4 py-2.5 rounded-xl transition-colors text-sm text-zinc-700 dark:text-zinc-300">
                  <input 
                    type="checkbox" 
                    checked={somenteOfertas} 
                    onChange={(e) => {
                      setSomenteOfertas(e.target.checked);
                      setPage(1); // 🟢 Importante: volta para a página 1 ao ativar o filtro!
                    }}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-rose-500 focus:ring-rose-500 bg-white dark:bg-zinc-950 cursor-pointer"
                  />
                  <Tag size={16} className={somenteOfertas ? "text-rose-500 dark:text-rose-400" : "text-zinc-400 dark:text-zinc-500"} />
                  <span className={somenteOfertas ? "font-bold text-rose-500 dark:text-rose-400" : ""}>Apenas Ofertas</span>
                </label>

                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(e.target.value); setPage(1); }} 
                  className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="20">20 por pág</option>
                  <option value="50">50 por pág</option>
                  <option value="100">100 por pág</option>
                </select>

                <form onSubmit={handleSearch} className="relative w-full sm:w-72 lg:w-96">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, EAN ou código..." 
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </form>
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl overflow-hidden relative min-h-[400px] flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto flex-1">
                <table className="w-full min-w-[860px] text-xs sm:text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800/60">
                    <tr>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 w-20 text-center">Imagem</th> 
                      <th className="px-3 sm:px-5 py-3 sm:py-4 w-[40%]">Produto</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 w-32">Marca</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 text-center">Estoque</th>
                      <th className={`px-3 sm:px-5 py-3 sm:py-4 text-right font-bold ${infoTabela.cor}`}>Preço Unitário</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 text-center w-40 rounded-tr-2xl">Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                    {produtosComPromocaoCarimbada.length === 0 && !loading && (
                      <tr>
                        <td colSpan="6" className="px-5 py-12 text-center text-zinc-500 dark:text-zinc-500">
                          Nenhum produto encontrado. Verifique sua busca ou remova os filtros.
                        </td>
                      </tr>
                    )}

                    {produtosComPromocaoCarimbada.map((produto) => {
                      const qtdNoCarrinho = carrinho[produto.PDCODPRO]?.qtd || 0;
                      const imageUrl = getProductImageUrl(produto.PDCODBARRA);
                      const temEstoque = produto.PDSALDO > 0;
                      
                      // 🟢 NOVA LÓGICA DE PREÇO COM QUANTIDADE MÍNIMA
                      const precoOriginal = produto[tabelaAtiva] !== undefined ? parseFloat(produto[tabelaAtiva]) : parseFloat(produto.PDPRECO);
                      const minExigido = produto.qtd_minima_promocao || 1;
                      const atingiuMinimo = produto.em_promocao && qtdNoCarrinho >= minExigido;
                      const precoExibicao = atingiuMinimo ? parseFloat(produto.preco_promocional) : precoOriginal;
                      const desconto = atingiuMinimo && precoOriginal > 0 ? Math.round(((precoOriginal - precoExibicao) / precoOriginal) * 100) : 0;

                      return (
                        <tr key={produto.PDCODPRO} className={`transition-colors group ${!temEstoque ? 'opacity-50 grayscale' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}`}>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            
                            <div className="relative w-[72px] h-[72px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-emerald-500/50 transition-all mx-auto">
                              {produto.em_promocao && desconto > 0 && (
                                <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-bl-lg shadow-md z-10 flex items-center gap-0.5 animate-pulse">
                                  <Zap size={10} fill="currentColor" />-{desconto}%
                                </div>
                              )}
                              <img src={imageUrl} alt={produto.PDNOME} className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto"; }} />
                            </div>

                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 break-words">{produto.PDNOME}</h3>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-500 font-mono">
                              <Barcode size={13} className="text-zinc-400 dark:text-zinc-600" /> {produto.PDCODBARRA || "SEM EAN"} <span className="text-zinc-300 dark:text-zinc-700 mx-1">|</span> <span className="text-zinc-500 dark:text-zinc-400">SKU: {produto.PDCODPRO}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-zinc-600 dark:text-zinc-400">{produto.PDMARCA || "-"}</td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                            {temEstoque ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
                                <CheckCircle2 size={13}/> Disp: {produto.PDSALDO}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-500/20">
                                <AlertCircle size={13}/> Sem Estoque
                              </div>
                            )}
                          </td>
                          <td className={`px-3 sm:px-5 py-3 sm:py-4 text-right text-sm sm:text-base whitespace-nowrap ${infoTabela.cor}`}>
                            {produto.em_promocao ? (
                              <div className="flex flex-col items-end">
                                {/* O preço original riscado só aparece se o desconto ativar */}
                                {atingiuMinimo && <span className="text-zinc-500 dark:text-zinc-500 line-through text-[11px] font-medium leading-none mb-0.5">{formatarMoeda(precoOriginal)}</span>}
                                
                                <span className={`font-bold ${atingiuMinimo ? 'text-emerald-600 dark:text-emerald-400 text-base sm:text-lg' : ''}`}>
                                  {formatarMoeda(precoExibicao)}
                                </span>

                                {/* 🟢 AVISO VISUAL DE QUANTIDADE */}
                                {!atingiuMinimo ? (
                                   <span className="text-[9px] bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20 mt-1 flex items-center gap-1 w-fit">
                                      <Tag size={10} /> Oferta a partir de {minExigido} un.
                                   </span>
                                ) : (
                                   <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 mt-1 flex items-center gap-1 w-fit">
                                      <Zap size={10} /> Oferta Aplicada!
                                   </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-bold">{formatarMoeda(precoOriginal)}</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            {temEstoque ? (
                              <SeletorQuantidade id={produto.PDCODPRO} qtd={qtdNoCarrinho} onQtdChange={(id, qtd) => handleQuantidade(produto, qtd)} />
                            ) : (
                              <span className="text-xs text-zinc-500 dark:text-zinc-600 font-medium block text-center">Indisponível</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                  Mostrando página <span className="text-zinc-900 dark:text-zinc-300 font-medium">{page}</span> de <span className="text-zinc-900 dark:text-zinc-300 font-medium">{totalPages || 1}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors disabled:opacity-50"><ChevronLeft size={16} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors disabled:opacity-50"><ChevronRight size={16} /></button>
                </div>
              </div>

            </div>
            
            {/* 🟢 4. O ESPAÇADOR FANTASMA AQUI! */}
            {Object.keys(carrinho).length > 0 && <div className="h-28 w-full shrink-0"></div>}

          </div>
        </main>

        {Object.keys(carrinho).length > 0 && (
          <div className="fixed bottom-0 left-0 md:left-[260px] right-0 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-md border-t border-emerald-500/30 p-3 sm:p-4 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between animate-in slide-in-from-bottom-10 z-30 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2.5 rounded-2xl shadow-lg">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {Object.values(carrinho).reduce((a, b) => a + b.qtd, 0)} Itens no Pedido
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Revise os itens e feche a cotação.</p>
              </div>
            </div>
            
            <button onClick={() => setIsCheckoutOpen(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 sm:px-8 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2">
              Avançar para Checkout
            </button>
          </div>
        )}

      </div>

      {/* 🟢 3. PASSANDO A FUNÇÃO DE REMOVER PARA O MODAL */}
      <ModalCheckout 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        carrinho={carrinho} 
        produtos={produtos} 
        tabelaAtiva={tabelaAtiva} 
        onFinalizarPedido={handleFinalizarPedido} 
        onRemoverItem={(id) => handleQuantidade({ PDCODPRO: id }, 0)} 
      />
      
    </div>
  );
}