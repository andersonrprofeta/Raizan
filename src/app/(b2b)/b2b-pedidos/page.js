"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
// 🟢 ERRO DO MAP CORRIGIDO (Map as MapIcon)
import { Search, ShoppingCart, CheckCircle2, AlertCircle, Package, Barcode, Loader2, Zap, X, FileText, QrCode, Building2, Truck, MapPin, CreditCard, CalendarDays, ChevronLeft, ChevronRight, Tag, Clock, ShieldCheck, RefreshCw, Trash2, ArrowRight, Map as MapIcon } from "lucide-react";
import { getApiUrl, getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';
import FiltroMarcas from "@/components/b2b/FiltroMarcas";
import { marcaBonificada } from "@/components/utils/marcaBonificada";
import { fatorDoLojista, guardarAcrescimo } from "@/components/utils/acrescimoPortal";
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Fica no próprio arquivo: a imagem de reserva não pode depender de um site de fora
const FOTO_AUSENTE = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f4f4f5"/><text x="50" y="54" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#a1a1aa">Sem foto</text></svg>');

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// 🟢 NOVO MOTOR DE IMAGENS DO HUB RAIZAN
const obterCapa = (produto) => {
  if (produto && produto.imagens_anexos) {
    try {
      const imagens = typeof produto.imagens_anexos === 'string' ? JSON.parse(produto.imagens_anexos) : produto.imagens_anexos;
      if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) {
        return imagens[0];
      }
    } catch(e) {}
  }
  return FOTO_AUSENTE; 
};

// ==========================================
// COMPONENTE: MODAL DE CHECKOUT B2B
// ==========================================
function ModalCheckout({ isOpen, onClose, carrinho, onFinalizarPedido, onRemoverItem, rotasFrete, condicoesOmie, clienteMestre, prazosGerais }) {
  const [metodoPagamento, setMetodoPagamento] = useState('faturado');
  const [prazoBoleto, setPrazoBoleto] = useState(''); 
  const [metodoEnvio, setMetodoEnvio] = useState('transportadora');
  const [isProcessando, setIsProcessando] = useState(false);

  const [user, setUser] = useState(null);
  const [rotaCliente, setRotaCliente] = useState(null);
  
  const [step, setStep] = useState('resumo'); 
  const [dadosPix, setDadosPix] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [pedidoFinalizadoId, setPedidoFinalizadoId] = useState(null);
  
  const [tempoExpiracao, setTempoExpiracao] = useState(1800); 
  const [isVerificando, setIsVerificando] = useState(false);

  const [metodosAtivos, setMetodosAtivos] = useState({ faturado: true, mercadopago: false });
  const [isMpReady, setIsMpReady] = useState(false);
  const [mpKeyMissing, setMpKeyMissing] = useState(false);

  let condicoesPermitidas = [];
  if (clienteMestre?.metadata_json) {
    try {
      const meta = typeof clienteMestre.metadata_json === 'string' ? JSON.parse(clienteMestre.metadata_json) : clienteMestre.metadata_json;
      condicoesPermitidas = meta.condicoes_permitidas || [];
    } catch(e) {}
  }
  // Prazo geral vale para todos, e o do cadastro é um extra só deste cliente
  condicoesPermitidas = [...new Set([...prazosGerais, ...condicoesPermitidas].map((codigo) => String(codigo).trim()))];

  let pagamentosFiltrados = condicoesPermitidas.length > 0 
    ? condicoesOmie.filter(opcao => condicoesPermitidas.includes(String(opcao.codigo).trim()))
    : condicoesOmie;

  if (pagamentosFiltrados.length === 0 && condicoesPermitidas.length > 0) {
    pagamentosFiltrados = condicoesPermitidas.map(cod => ({ codigo: cod, descricao: `Cód: ${cod}` }));
  }

  useEffect(() => {
    if (!prazoBoleto && pagamentosFiltrados.length > 0) {
      setPrazoBoleto(pagamentosFiltrados[0].codigo);
    }
  }, [pagamentosFiltrados, prazoBoleto]);

  useEffect(() => {
    if (isOpen) {
      setStep('resumo'); setDadosPix(null); setCopiado(false); setIsProcessando(false); setTempoExpiracao(1800);
      setPedidoFinalizadoId(null); 
      
      const savedUser = localStorage.getItem("raizan_user");
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        setUser(userObj);
        if (userObj.prazos_liberados && userObj.prazos_liberados.length > 0) {
          setPrazoBoleto(userObj.prazos_liberados[0]); 
        }

        const buscarRota = async () => {
          try {
            const resCli = await fetch(`${getHubUrl()}/api/hub/clientes`, { headers: getHeaders() });
            const dataCli = await resCli.json();
            if (dataCli.success) {
              const meuCadastro = dataCli.clientes.find(c => c.email === userObj.email);
              if (meuCadastro && meuCadastro.id_rota_frete) {
                const resRotas = await fetch(`${getHubUrl()}/api/hub/rotas-frete`, { headers: getHeaders() });
                const dataRotas = await resRotas.json();
                if (dataRotas.success) {
                  const minhaRota = dataRotas.rotas.find(r => String(r.id) === String(meuCadastro.id_rota_frete));
                  setRotaCliente(minhaRota);
                }
              }
            }
          } catch(e) {}
        };
        buscarRota();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const buscarMetodos = async () => {
        try {
          const res = await fetch(`${getHubUrl()}/api/hub/pagamentos/metodos-ativos`, { headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            setMetodosAtivos({ faturado: data.faturado, mercadopago: data.mercadopago });
            if (data.mercadopago && data.mpPublicKey) {
              initMercadoPago(data.mpPublicKey, { locale: 'pt-BR' });
              setIsMpReady(true);
              setMpKeyMissing(false);
            } else {
              setMpKeyMissing(true);
              setMetodoPagamento('faturado'); 
            }
          }
        } catch (e) {
          setMpKeyMissing(true);
          setMetodoPagamento('faturado');
        }
      };
      buscarMetodos();
    }
  }, [isOpen]);

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
          if (data.status === 'pago') setStep('concluido');
        } catch (e) {}
      }, 5000); 
    }
    return () => clearInterval(intervalo);
  }, [step, dadosPix]);

  if (!isOpen) return null;

  const formatarTempo = (segundos) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const itensComprados = Object.values(carrinho).map(p => {
    const precoOriginal = parseFloat(p.preco_venda || 0);
    const minExigido = parseInt(p.qtd_minima_promocao) || 1;
    const temPromo = parseFloat(p.preco_promocional) > 0;
    const atingiuMinimo = temPromo && p.qtd >= minExigido;
    const precoFinal = atingiuMinimo ? parseFloat(p.preco_promocional) : precoOriginal;
    
    return { ...p, precoUsado: precoFinal, totalItem: precoFinal * (p.qtd || 0), atingiuMinimo };
  });

  if (itensComprados.length === 0 && step === 'resumo') {
    onClose();
    return null;
  }

  const subtotal = itensComprados.reduce((acc, item) => acc + item.totalItem, 0);

  let minCif = 0;
  if (clienteMestre && clienteMestre.id_rota_frete) {
    const rota = rotasFrete.find(r => String(r.id) === String(clienteMestre.id_rota_frete));
    if (rota) minCif = Number(rota.valor_minimo) || 0;
  }
  const isCif = minCif > 0 && subtotal >= minCif;
  const labelTransportadora = rotaCliente ? (isCif ? "Frete CIF (Grátis)" : "Frete FOB (A Combinar)") : "Transportadora Parceira";

  const verificarPagamentoManual = async () => {
    setIsVerificando(true);
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/status/${dadosPix.pedidoId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'pago') setStep('concluido');
      else toast.error("Pagamento não identificado. Aguarde alguns segundos e tente novamente.", { duration: 4000 });
    } catch (e) { toast.error("Erro ao comunicar com a Nuvem."); }
    setTimeout(() => setIsVerificando(false), 1000); 
  };

  const handleConfirmar = async () => {
    setIsProcessando(true);
    const resultado = await onFinalizarPedido({ 
      itens: itensComprados, 
      subtotal, 
      metodoPagamento: metodoPagamento === 'faturado' ? prazoBoleto : metodoPagamento, 
      prazoBoleto: null, 
      metodoEnvio 
    });
    setIsProcessando(false);

    if (resultado && resultado.pagamento?.tipo === 'pix') {
      setDadosPix({ ...resultado.pagamento, pedidoId: resultado.pedidoId });
      setPedidoFinalizadoId(resultado.pedidoId);
      setTempoExpiracao(1800); 
      setStep('sucesso_pix');
    } else if (resultado) {
      setPedidoFinalizadoId(resultado.pedidoId); 
      setStep('concluido'); 
    }
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(dadosPix.qr_code);
    setCopiado(true); toast.success("Código PIX copiado!");
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={step === 'resumo' ? onClose : null}>
      <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200/50 dark:border-zinc-800/80 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.07]/80 bg-zinc-50/50 dark:bg-[#121214]">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
            {step === 'resumo' && <><ShoppingCart className="text-purple-600 dark:text-purple-400" size={20} /> Finalizar Pedido</>}
            {step === 'sucesso_pix' && <><Clock className="text-indigo-500 dark:text-indigo-400" size={20} /> Aguardando Pagamento</>}
            {step === 'concluido' && <><CheckCircle2 className="text-emerald-500 dark:text-emerald-400" size={20} /> Pedido Concluído</>}
          </h2>
          <button onClick={onClose} disabled={isProcessando} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 transition-colors disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {step === 'concluido' && (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 text-center animate-in zoom-in-90 duration-500">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 size={40} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Pedido Realizado!</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm leading-relaxed">
              {metodoPagamento === 'pix' && `Recebemos o seu pagamento via PIX. Seu pedido #${pedidoFinalizadoId} já foi faturado e enviado para a nossa equipe logística.`}
              {metodoPagamento === 'cartao' && `Recebemos o seu pagamento via Cartão de Crédito. Seu pedido #${pedidoFinalizadoId} foi aprovado e enviado para a separação.`}
              {metodoPagamento !== 'pix' && metodoPagamento !== 'cartao' && `Seu pedido #${pedidoFinalizadoId} faturado via Boleto foi gerado com sucesso e enviado para análise da equipe logística.`}
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <button onClick={() => { onClose(); window.location.href = "/b2b-historico"; }} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 transition-all">
                Acompanhar no Histórico
              </button>
              <button onClick={onClose} className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all">
                Voltar ao Catálogo
              </button>
            </div>
          </div>
        )}

        {step === 'sucesso_pix' && dadosPix && (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in slide-in-from-right-8 overflow-y-auto custom-scrollbar">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
              <QrCode size={32} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Pague via PIX</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-xs">Abra o aplicativo do seu banco e escaneie o código abaixo.</p>
            
            <div className="bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl px-5 py-3 mb-6 flex items-center justify-center gap-3 shadow-sm">
              <Clock size={18} className="text-indigo-500" />
              <span className="text-sm font-medium text-zinc-500">Expira em:</span>
              <span className={`text-xl font-mono font-bold ${tempoExpiracao < 300 ? 'text-rose-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {formatarTempo(tempoExpiracao)}
              </span>
            </div>
            
           <div className="w-full max-w-[240px] bg-white p-3 rounded-[28px] mb-6 shadow-sm border border-black/[0.06] dark:border-white/[0.07] relative overflow-hidden flex items-center justify-center min-h-[220px]">
              {dadosPix.qr_code_base64 && dadosPix.qr_code_base64.length > 50 ? (
                <img src={`data:image/png;base64,${dadosPix.qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48 relative z-10 object-contain" />
              ) : (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dadosPix.qr_code)}`} alt="QR Code PIX Gerado" className="w-48 h-48 relative z-10 object-contain" />
              )}
            </div>

            <div className="w-full max-w-sm space-y-2 mb-6">
              <label className="text-[11px] font-bold text-zinc-400 text-left block ml-1">Pix Copia e Cola</label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input type="text" readOnly value={dadosPix.qr_code} className="w-full sm:flex-1 bg-zinc-50 dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.07] text-zinc-600 dark:text-zinc-400 px-4 py-3 rounded-xl text-xs outline-none font-mono truncate shadow-inner" />
                <button onClick={copiarPix} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${copiado ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900'}`}>
                  {copiado ? <CheckCircle2 size={16} /> : 'Copiar'}
                </button>
              </div>
            </div>

            <button onClick={verificarPagamentoManual} disabled={isVerificando} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 mb-4 font-medium">
              <RefreshCw size={14} className={isVerificando ? "animate-spin text-indigo-500" : ""} />
              {isVerificando ? "Verificando com o banco..." : "Já paguei, mas a tela não mudou"}
            </button>
          </div>
        )}

        {step === 'resumo' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 animate-in slide-in-from-left-8">
            <div className="space-y-6">
              
              <div className="bg-white dark:bg-[#121214] border border-black/[0.06] dark:border-white/[0.07] rounded-[28px] p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-500" /> Forma de Pagamento
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={() => setMetodoPagamento('faturado')} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${metodoPagamento === 'faturado' ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400' : 'bg-white dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <FileText size={20} className="mb-1.5" />
                    <span className="text-xs font-bold">Boleto ERP</span>
                  </button>

                  {metodosAtivos.mercadopago && (
                    <>
                      <button onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${metodoPagamento === 'pix' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                        <QrCode size={20} className="mb-1.5" />
                        <span className="text-xs font-bold">PIX (MP)</span>
                      </button>
                      <button onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${metodoPagamento === 'cartao' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                        <CreditCard size={20} className="mb-1.5" />
                        <span className="text-xs font-bold">Cartão</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-2">
                  {metodoPagamento === 'faturado' && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.07]/80">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                        <CalendarDays size={14} className="text-purple-500" />
                        Prazos liberados para o seu CNPJ:
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {pagamentosFiltrados.length > 0 ? (
                          pagamentosFiltrados.map((opcao) => (
                            <button
                              key={opcao.codigo}
                              onClick={() => setPrazoBoleto(opcao.codigo)}
                              className={`p-2.5 rounded-xl border text-left transition-all ${prazoBoleto === opcao.codigo ? 'border-purple-500 bg-white dark:bg-[#121214] shadow-sm' : 'border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${prazoBoleto === opcao.codigo ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                  <CalendarDays size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-bold line-clamp-2 leading-tight ${prazoBoleto === opcao.codigo ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {opcao.descricao}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="col-span-3 p-4 text-center border border-dashed border-black/[0.06] dark:border-white/[0.07] rounded-xl bg-white dark:bg-zinc-900/30">
                            <p className="text-zinc-500 text-xs font-medium">Nenhum prazo de faturamento especial localizado no seu cadastro.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {metodoPagamento === 'pix' && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs font-medium flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg"><QrCode size={16} /></div>
                      <p>O QR Code do Mercado Pago será gerado na próxima tela de forma segura.</p>
                    </div>
                  )}

                  {metodoPagamento === 'cartao' && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      {mpKeyMissing ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-black/[0.06] dark:border-white/[0.07]">
                          <AlertCircle size={24} className="text-rose-500 mb-2" />
                          <p className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">Indisponível no Momento</p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">O gateway de pagamento não foi ativado.</p>
                        </div>
                      ) : subtotal < 2 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                          <AlertCircle size={24} className="text-amber-500 mb-2" />
                          <p className="text-amber-900 dark:text-amber-100 font-bold text-sm">Valor Mínimo Não Atingido</p>
                          <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">As operadoras exigem um pedido mínimo de R$ 2,00.</p>
                        </div>
                      ) : !isMpReady ? (
                        <div className="flex flex-col items-center justify-center p-6 text-zinc-500">
                          <Loader2 size={24} className="animate-spin mb-2 text-purple-500" />
                          <p className="font-bold text-xs">Conectando...</p>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] shadow-sm">
                          <Payment
                            initialization={{ amount: subtotal }}
                            customization={{ visual: { style: { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default', customVariables: { baseColor: '#9333ea', borderRadiusMedium: '14px' } } }, paymentMethods: { creditCard: 'all', debitCard: 'all' } }}
                            onSubmit={async (param) => {
                              setIsProcessando(true);
                              const resultado = await onFinalizarPedido({ itens: itensComprados, subtotal, metodoPagamento: 'cartao', prazoBoleto: null, metodoEnvio, dadosCartaoMp: param.formData });
                              setIsProcessando(false);
                              if (resultado) setStep('concluido');
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-black/[0.06] dark:border-white/[0.07] rounded-[28px] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <MapIcon size={16} className="text-purple-500" /> Logística e Frete
                  </h3>
                  {rotaCliente && (
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400 px-2 py-1 rounded">
                      Região: {rotaCliente.nome}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    metodoEnvio === 'transportadora' 
                      ? (isCif ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-purple-500 bg-purple-50/50 dark:bg-purple-500/10') 
                      : 'border-zinc-200 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}>
                    <input type="radio" name="envio" checked={metodoEnvio === 'transportadora'} onChange={() => setMetodoEnvio('transportadora')} className="hidden" />
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                      metodoEnvio === 'transportadora' 
                        ? (isCif ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white') 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}>
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-tight ${metodoEnvio === 'transportadora' ? (isCif ? 'text-emerald-700 dark:text-emerald-400' : 'text-purple-700 dark:text-purple-400') : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {labelTransportadora}
                      </p>
                      <p className={`text-[11px] mt-0.5 font-medium ${isCif ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {minCif > 0 ? (isCif ? `Mínimo de R$ ${minCif} atingido (Frete Grátis)` : `Faltam R$ ${(minCif - subtotal).toFixed(2)} para Frete Grátis`) : "O valor final será calculado pela logística."}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    metodoEnvio === 'retirada' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-500/10' : 'border-zinc-200 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}>
                    <input type="radio" name="envio" checked={metodoEnvio === 'retirada'} onChange={() => setMetodoEnvio('retirada')} className="hidden" />
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${metodoEnvio === 'retirada' ? 'bg-purple-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-tight ${metodoEnvio === 'retirada' ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Retirada no CD</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Isento de frete. Agendamento necessário após faturamento.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-white dark:bg-[#121214] border border-black/[0.06] dark:border-white/[0.07] rounded-[28px] overflow-hidden shadow-sm h-max lg:sticky lg:top-6">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#121214]">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  Resumo do Carrinho
                  <span className="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 text-[11px] font-bold px-2 py-0.5 rounded-full">{itensComprados.length} Itens</span>
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 max-h-[35vh]">
                <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/40 px-4">
                  {itensComprados.map(item => (
                    <li key={item.sku} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{item.nome}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                          {item.qtd}x {formatarMoeda(item.precoUsado)} 
                          {item.atingiuMinimo && <span className="text-emerald-500 font-bold ml-1 inline-flex items-center gap-0.5"><Zap size={8}/> Promo</span>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatarMoeda(item.totalItem)}</div>
                        <button onClick={() => onRemoverItem(item.sku)} className="text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                <div className="flex justify-between items-center text-zinc-500 text-xs">
                  <span>Subtotal Produtos</span><span className="font-medium">{formatarMoeda(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 text-xs pb-3 border-b border-black/[0.06] dark:border-white/[0.07]">
                  <span>Frete Estimado</span>
                  <span className={`font-medium ${isCif && metodoEnvio === 'transportadora' ? 'text-emerald-500' : 'italic'}`}>
                    {metodoEnvio === 'retirada' ? "Grátis (Retirada)" : (isCif ? "Grátis (CIF)" : "A calcular (FOB)")}
                  </span>
                </div>

                <div className="flex justify-between items-end pt-1 mb-4">
                  <span className="text-[11px] font-bold text-zinc-400">Total a Pagar</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 leading-none">{formatarMoeda(subtotal)}</span>
                </div>
                
                {metodoPagamento !== 'cartao' && (
                  <button onClick={handleConfirmar} disabled={isProcessando} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl text-sm font-bold shadow-[0_5px_15px_rgba(147,51,234,0.25)] transition-all flex items-center justify-center gap-2 active:scale-95">
                    {isProcessando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {isProcessando ? 'Processando...' : 'Concluir Pedido'}
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

function SeletorQuantidade({ id, qtd, onQtdChange }) {
  if (qtd > 0) {
    return (
      <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.07] rounded-lg overflow-hidden h-8 w-24">
        <button onClick={() => onQtdChange(id, Math.max(0, qtd - 1))} className="w-8 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">-</button>
        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{qtd}</span>
        <button onClick={() => onQtdChange(id, qtd + 1)} className="w-8 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">+</button>
      </div>
    );
  }
  return (
    <button onClick={() => onQtdChange(id, 1)} className="w-24 h-8 flex items-center justify-center bg-zinc-100 hover:bg-purple-50 text-zinc-600 hover:text-purple-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-purple-500/20 dark:hover:text-purple-400 rounded-lg font-bold transition-all text-[11px]">
      Adicionar
    </button>
  );
}

export default function CatalogoB2B() {
  const [carrinho, setCarrinho] = useState({});
  const [produtosDb, setProdutosDb] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20); 

  const [somenteOfertas, setSomenteOfertas] = useState(false);
  const [marcaSelecionada, setMarcaSelecionada] = useState(""); // 🟢 NOVO ESTADO

  const [clienteMestre, setClienteMestre] = useState(null);
  const [rotasFrete, setRotasFrete] = useState([]);
  const [condicoesOmie, setCondicoesOmie] = useState([]);
  const [prazosGerais, setPrazosGerais] = useState([]);
  const [prefixoBonificados, setPrefixoBonificados] = useState('');

  useEffect(() => {
    const carregarCarrinhoEListners = () => {
      const carrinhoSalvo = localStorage.getItem("@raizan:carrinho");
      if (carrinhoSalvo) {
        try { setCarrinho(JSON.parse(carrinhoSalvo)); } catch(e) { }
      }
    };
    carregarCarrinhoEListners();

    const syncCarrinho = () => {
      const c = localStorage.getItem("@raizan:carrinho");
      if(c) try { setCarrinho(JSON.parse(c)); } catch(e) {}
    };
    window.addEventListener('storage', syncCarrinho);

    return () => window.removeEventListener('storage', syncCarrinho);
  }, []);

  // 🟢 BUSCA DOS DADOS E PRODUTOS DO HUB (BLINDADA CONTRA ERROS E COM NOMES LIMPOS)
  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);
      try {
        
        // 🟢 ZERO DADOS CHUMBADOS! Busca a identidade real gerada no Login B2B
        const userSalvo = localStorage.getItem("raizan_user");
        const userObj = userSalvo ? JSON.parse(userSalvo) : null;
        
        const tenantId = localStorage.getItem("@raizan:b2b_tenant_id") || 
                         userObj?.tenant_id;

        if (!tenantId) {
          console.error("🚨 ERRO CRÍTICO: Identidade (Tenant ID) não encontrada no navegador.");
          toast.error("Erro de identificação da loja. Faça login novamente.");
          setLoading(false);
          return;
        }

        const userEmail = userObj?.email || null;
        const headers = { ...getHeaders(), "x-tenant-id": tenantId };

        const safeFetch = async (url) => {
          try {
            console.log(`[🚀 Disparando] Buscando dados de: ${url}`);
            const res = await fetch(url, { headers });
            if (!res.ok) return null; 
            return await res.json();
          } catch (e) {
            return null; 
          }
        };

        const [dataProd, dataCli, dataRotas, dataCond, dataRegras] = await Promise.all([
          safeFetch(`${getHubUrl()}/api/hub/produtos?limit=5000&para_venda=1`),
          safeFetch(`${getHubUrl()}/api/hub/clientes`),
          safeFetch(`${getHubUrl()}/api/hub/rotas-frete`),
          safeFetch(`${getHubUrl()}/api/hub/integracoes/omie/condicoes-pagamento`),
          safeFetch(`${getHubUrl()}/api/hub/parametros/app`)
        ]);
        
        if (dataProd && dataProd.success) {

          // 🟢 ESPIÃO: Para provar que o CNPJ correto foi puxado dinamicamente
          console.log("🕵️‍♂️ CNPJ (Tenant) Enviado:", tenantId);
          console.log("📦 Produtos crus que chegaram:", dataProd.produtos);


        if (dataProd.acrescimo_cpf !== undefined) guardarAcrescimo(dataProd.acrescimo_cpf);
        const fatorAcrescimo = fatorDoLojista(userObj);

          const mapped = dataProd.produtos.map(p => ({
            id: p.id,
            sku: p.sku || p.id,
            nome: p.nome,
            gtin: p.gtin,
            marca: p.marca,
            estoque_inicial: p.estoque_inicial,
            
            preco_venda: parseFloat(p.preco_venda || 0) * fatorAcrescimo,
            preco_promocional: parseFloat(p.preco_promocional) > 0 ? (parseFloat(p.preco_promocional) * fatorAcrescimo) : null,
            
            qtd_minima_promocao: p.qtd_minima_promocao,
            imagens_anexos: p.imagens_anexos,
            status: p.status
        })).filter(p => p.status !== 'inativo');
        
        setProdutosDb(mapped); 
        atualizarPrecosDoCarrinho(mapped);
        }

        if (dataCli && dataCli.success && userEmail) {
          setClienteMestre(dataCli.clientes.find(c => c.email === userEmail));
        }

        if (dataRotas && dataRotas.success) {
          setRotasFrete(dataRotas.rotas);
        }

        if (dataRegras?.success) {
          setPrazosGerais(dataRegras.regras.prazos_gerais || []);
          setPrefixoBonificados(dataRegras.regras.provadores?.prefixo || '');
        }

        if (dataCond && dataCond.success) {
          setCondicoesOmie(dataCond.condicoes);
        }

      } catch (error) { 
        toast.error("Erro ao carregar catálogo.");
      }
      setLoading(false);
    };

    carregarTudo();
  }, []); 

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  // 🟢 AS MARCAS VOLTARAM! EXTRAI AS MARCAS ÚNICAS (Ignorando nulos e as bonificadas da empresa)
  const marcasUnicas = Array.from(new Set(produtosDb.map(p => p.marca?.trim()).filter(Boolean)))
    .filter(marca => !marcaBonificada(marca, prefixoBonificados))
    .sort();

  // 🟢 FILTRAGEM LOCAL ATUALIZADA COM MARCA
  const produtosFiltrados = produtosDb.filter(p => {
    const termo = search.toLowerCase();
    const matchBusca = (p.nome && p.nome.toLowerCase().includes(termo)) || 
                       (p.sku && String(p.sku).toLowerCase().includes(termo)) || 
                       (p.gtin && String(p.gtin).toLowerCase().includes(termo));
    
    const temPromo = parseFloat(p.preco_promocional) > 0;
    const matchOferta = somenteOfertas ? temPromo : true;

    // Se tiver marca selecionada, filtra por ela
    const matchMarca = marcaSelecionada === "" || p.marca?.trim() === marcaSelecionada;

    return matchBusca && matchOferta && matchMarca;
  });

  const filtroAtivo = Boolean(search || somenteOfertas || marcaSelecionada);
  const limparFiltros = () => {
    setSearch("");
    setSomenteOfertas(false);
    setMarcaSelecionada("");
    setPage(1);
  };

  const totalPages = Math.ceil(produtosFiltrados.length / limit);
  const offset = (page - 1) * limit;
  const produtosPaginados = produtosFiltrados.slice(offset, offset + Number(limit));

  // 🟢 CORREÇÃO DO ERRO DO REACT (MICRO-ATRASO NO AVISO PARA NÃO CHOCAR COM A TELA)
  const handleQuantidade = (produto, qtd) => {
    const novoCarrinho = { ...carrinho };
    
    if (qtd === 0) {
      delete novoCarrinho[produto.sku];
    } else {
      novoCarrinho[produto.sku] = { ...produto, qtd };
    }
    
    setCarrinho(novoCarrinho);
    localStorage.setItem("@raizan:carrinho", JSON.stringify(novoCarrinho));
    
    // O pulo do gato: avisa as outras telas 1 milissegundo DEPOIS de desenhar esta, evitando o Erro Vermelho
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 0);
  };

  // O carrinho fica guardado no navegador: sem isto, ele seguiria com o preço de quando o item entrou
  const atualizarPrecosDoCarrinho = (catalogo) => {
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem("@raizan:carrinho")) || {}; } catch (e) { return; }

    const produtos = new Map(catalogo.map((p) => [String(p.sku), p]));
    const atualizado = Object.fromEntries(Object.entries(salvo).map(([sku, item]) => {
      const produto = produtos.get(String(sku));
      if (!produto || item.em_promocao) return [sku, item];
      const { preco_venda, preco_promocional, qtd_minima_promocao } = produto;
      return [sku, { ...item, preco_venda, preco_promocional, qtd_minima_promocao }];
    }));

    setCarrinho(atualizado);
    localStorage.setItem("@raizan:carrinho", JSON.stringify(atualizado));
  };

  const handleFinalizarPedido = async (dadosDoPedido) => {
    const savedUser = localStorage.getItem("raizan_user");
    if (!savedUser) {
      toast.error("Sessão expirada. Faça login novamente.");
      window.location.href = "/login-b2b";
      return null;
    }

    const userLogado = JSON.parse(savedUser);
    const cabecalhosPadrao = getHeaders();
    const tenant_id = userLogado.tenant_id || cabecalhosPadrao["x-tenant-id"]; 

    // 🟢 ITENS ENVIADOS COM NOMENCLATURA LIMPA
    const itensParaBackend = dadosDoPedido.itens.map(i => ({
      ...i, nome_produto: i.nome, sku: i.sku
    }));

    const payloadCompleto = {
      ...dadosDoPedido, 
      itens: itensParaBackend,
      tenant_id: tenant_id,
      cliente: {
        codigo: userLogado.codigo,
        nome: userLogado.nome, 
        cnpj: userLogado.cnpj,
        email: userLogado.email, 
        telefone: userLogado.telefone
      }
    };

    const toastId = toast.loading("Gerando pedido na distribuidora..."); 
    
    try {
      const cabecalhosComCracha = { ...cabecalhosPadrao, "Content-Type": "application/json", "x-tenant-id": tenant_id };
      const response = await fetch(`${getHubUrl()}/api/hub/pedidos/criar`, {
        method: "POST", headers: cabecalhosComCracha, body: JSON.stringify(payloadCompleto)
      });
      const data = await response.json();

      if (!data.success) {
        toast.error("Erro ao gerar pedido: " + data.message, { id: toastId });
        return null;
      }

      if (dadosDoPedido.metodoPagamento === 'pix' || dadosDoPedido.metodoPagamento === 'cartao') {
        toast.loading("Conectando com o Mercado Pago...", { id: toastId });
        
        const payRes = await fetch(`${getHubUrl()}/api/hub/pagamentos/gerar`, {
          method: "POST", headers: cabecalhosComCracha, 
          body: JSON.stringify({
            pedidoId: data.pedidoId, valor: dadosDoPedido.subtotal, metodo: dadosDoPedido.metodoPagamento,
            dadosCartao: dadosDoPedido.dadosCartaoMp, cliente: payloadCompleto.cliente 
          })
        });
        
        const payData = await payRes.json();

        if (payData.success) {
          toast.success(`Pedido #${data.pedidoId} aguardando pagamento!`, { id: toastId });
          setCarrinho({}); localStorage.removeItem("@raizan:carrinho"); window.dispatchEvent(new Event('storage'));
          return { pedidoId: data.pedidoId, pagamento: payData };
        } else {
          toast.error("Pedido gerado, mas o pagamento falhou: " + payData.message, { id: toastId });
          return null; 
        }
      }

      toast.success(`Pedido #${data.pedidoId} gerado!`, { id: toastId });
      setCarrinho({}); localStorage.removeItem("@raizan:carrinho"); window.dispatchEvent(new Event('storage'));
      return data; 

    } catch (error) {
      toast.error("Erro de comunicação com o servidor.", { id: toastId });
      return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-black text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 lg:p-8 pb-32">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* CABEÇALHO B2B COM FILTRO DE MARCAS */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white/70 p-5 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.07] dark:bg-[#121214]/70 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="shrink-0">
                  <h1 className="flex items-center gap-3 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                    <Package className="text-purple-600 dark:text-purple-400" size={24} /> Catálogo de produtos
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Faça a reposição do seu estoque com facilidade.</p>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center xl:justify-end">
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      aria-pressed={somenteOfertas}
                      onClick={() => { setSomenteOfertas(!somenteOfertas); setPage(1); }}
                      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all active:scale-95 sm:flex-none ${somenteOfertas ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300" : "border-black/[0.06] bg-white text-zinc-600 hover:text-zinc-900 dark:border-white/[0.07] dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:text-white"}`}
                    >
                      <Zap size={15} className={somenteOfertas ? "fill-amber-500 text-amber-500" : ""} /> Ofertas
                    </button>

                    <select value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1); }} aria-label="Itens por página" className="h-11 flex-1 cursor-pointer rounded-full border border-black/[0.06] bg-white px-4 text-sm font-semibold text-zinc-700 outline-none transition-colors focus:border-purple-500 dark:border-white/[0.07] dark:bg-[#1a1a1d] dark:text-zinc-300 dark:[color-scheme:dark] sm:flex-none">
                      <option value="20">20 itens</option>
                      <option value="50">50 itens</option>
                      <option value="100">100 itens</option>
                    </select>
                  </div>

                  <form onSubmit={handleSearch} className="relative w-full sm:w-72 lg:w-80">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por produto, SKU ou EAN" aria-label="Buscar produto" className="h-11 w-full rounded-full border border-black/[0.06] bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-white/[0.07] dark:bg-white/[0.06] dark:text-zinc-100" />
                  </form>
                </div>
              </div>

              {marcasUnicas.length > 0 && (
                <FiltroMarcas marcas={marcasUnicas} selecionada={marcaSelecionada} onChange={(marca) => { setMarcaSelecionada(marca); setPage(1); }} />
              )}
            </div>

            <div className="relative flex min-h-[400px] flex-col overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-sm transition-colors duration-300 dark:border-white/[0.07] dark:bg-[#121214]">
              {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-[#121214]/50"><Loader2 size={32} className="animate-spin text-purple-600" /></div>}

              <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-3.5 text-sm dark:border-white/[0.06]">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {produtosFiltrados.length.toLocaleString("pt-BR")} {produtosFiltrados.length === 1 ? "produto" : "produtos"}
                </span>
                {filtroAtivo && (
                  <button type="button" onClick={limparFiltros} className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400">Limpar filtros</button>
                )}
              </div>

              <div className="flex-1 divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {produtosPaginados.length === 0 && !loading && (
                  <div className="px-5 py-20 text-center text-zinc-500">
                    <Package size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-medium">Nenhum produto encontrado.</p>
                    {filtroAtivo && <button type="button" onClick={limparFiltros} className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400">Limpar filtros</button>}
                  </div>
                )}

                {produtosPaginados.map((produto) => {
                  const qtdNoCarrinho = carrinho[produto.sku]?.qtd || 0;
                  const imageUrl = obterCapa(produto);
                  const temEstoque = produto.estoque_inicial > 0;
                  const precoOriginal = parseFloat(produto.preco_venda || 0);
                  const minExigido = parseInt(produto.qtd_minima_promocao) || 1;
                  const emPromocao = parseFloat(produto.preco_promocional) > 0;
                  const atingiuMinimo = emPromocao && qtdNoCarrinho >= minExigido;
                  const precoExibicao = atingiuMinimo ? parseFloat(produto.preco_promocional) : precoOriginal;
                  const desconto = atingiuMinimo && precoOriginal > 0 ? Math.round(((precoOriginal - precoExibicao) / precoOriginal) * 100) : 0;

                  return (
                    <article key={produto.sku} className={`grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 transition-colors lg:grid-cols-[64px_minmax(0,1fr)_128px_190px_120px] lg:px-5 ${temEstoque ? "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" : "bg-black/[0.02] opacity-60 grayscale dark:bg-white/[0.02]"}`}>
                      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.07]">
                        {emPromocao && desconto > 0 && (
                          <div className="absolute right-0 top-0 z-10 flex items-center gap-0.5 rounded-bl-lg bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            <Zap size={8} fill="currentColor" />-{desconto}%
                          </div>
                        )}
                        <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1" onError={(e) => { e.target.onerror = null; e.target.src = FOTO_AUSENTE; }} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{produto.nome}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="font-semibold">{produto.marca || "Sem marca"}</span>
                          <span>SKU {produto.sku}</span>
                          {produto.gtin && <span className="flex items-center gap-1"><Barcode size={11} aria-hidden /> {produto.gtin}</span>}
                        </div>
                      </div>

                      <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 lg:contents">
                        <div className="lg:text-center">
                          {temEstoque ? (
                            <span className="inline-flex h-7 items-center whitespace-nowrap rounded-full bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{produto.estoque_inicial} em estoque</span>
                          ) : (
                            <span className="inline-flex h-7 items-center whitespace-nowrap rounded-full bg-zinc-500/10 px-3 text-xs font-semibold text-zinc-500">Sem estoque</span>
                          )}
                        </div>

                        <div className="text-right">
                          {emPromocao ? (
                            <div className="flex flex-col items-end">
                              {atingiuMinimo && <span className="mb-0.5 text-[11px] font-medium leading-none text-zinc-400 line-through">{formatarMoeda(precoOriginal)}</span>}
                              <span className={`font-bold tracking-tight ${atingiuMinimo ? "text-base text-purple-600 dark:text-purple-400" : "text-sm text-zinc-900 dark:text-zinc-100"}`}>{formatarMoeda(precoExibicao)}</span>
                              {!atingiuMinimo ? (
                                <span className="mt-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                                  <Tag size={11} /> {formatarMoeda(parseFloat(produto.preco_promocional))} a partir de {minExigido} un
                                </span>
                              ) : (
                                <span className="mt-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  <Zap size={11} fill="currentColor" /> Promoção aplicada
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{formatarMoeda(precoOriginal)}</span>
                          )}
                        </div>

                        <div className="col-span-2 flex justify-end lg:col-span-1">
                          {temEstoque ? (
                            <SeletorQuantidade id={produto.sku} qtd={qtdNoCarrinho} onQtdChange={(id, qtd) => handleQuantidade(produto, qtd)} />
                          ) : (
                            <span className="text-xs font-semibold text-zinc-400">Esgotado</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.05] p-4 text-sm dark:border-white/[0.06]">
                <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                  Página <span className="font-semibold text-zinc-900 dark:text-zinc-100">{page}</span> de {totalPages || 1}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-zinc-600 transition-colors hover:bg-black/[0.08] disabled:opacity-40 dark:bg-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.12]"><ChevronLeft size={16} /></button>
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} aria-label="Próxima página" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-zinc-600 transition-colors hover:bg-black/[0.08] disabled:opacity-40 dark:bg-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.12]"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>

            {Object.keys(carrinho).length > 0 && <div className="h-32 w-full shrink-0"></div>}

          </div>
        </main>

        {Object.keys(carrinho).length > 0 && (
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[90%] max-w-lg bg-[#0d0514]/80 backdrop-blur-xl border border-purple-500/30 p-1.5 sm:p-2 rounded-full flex items-center justify-between animate-in slide-in-from-bottom-10 z-30 shadow-[0_10px_40px_rgba(109,40,217,0.25)]">
            
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner">
                <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs sm:text-sm leading-tight">
                  {Object.values(carrinho).reduce((a, b) => a + b.qtd, 0)} Itens
                </span>
                <span className="text-purple-300/70 text-[11px] sm:text-[11px] font-bold leading-tight">
                  Pronto p/ envio
                </span>
              </div>
            </div>
            
            <button onClick={() => setIsCheckoutOpen(true)} className="bg-white text-[#0d0514] px-4 sm:px-6 h-9 sm:h-10 rounded-full font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 text-[11px] sm:text-xs hover:bg-zinc-200">
              Avançar <ArrowRight size={14} className="hidden sm:block" />
            </button>

          </div>
        )}

      </div>

      <ModalCheckout 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        carrinho={carrinho} 
        onFinalizarPedido={handleFinalizarPedido} 
        onRemoverItem={(id) => handleQuantidade({ sku: id }, 0)} 
        clienteMestre={clienteMestre}
        rotasFrete={rotasFrete}
        condicoesOmie={condicoesOmie}
        prazosGerais={prazosGerais}
      />
      
    </div>
  );
}