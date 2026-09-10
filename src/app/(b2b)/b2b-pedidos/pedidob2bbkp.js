"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Search, ShoppingCart, CheckCircle2, AlertCircle, Package, Barcode, Loader2, DollarSign, Zap, ShoppingBag, X, FileText, QrCode, Building2, Truck, MapPin, CreditCard, CalendarDays, ChevronLeft, ChevronRight, Tag, Clock, ShieldCheck, RefreshCw, Trash2, Sparkles, Map, ArrowRight } from "lucide-react";
import { getApiUrl, getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

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
  return "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto"; 
};

// ==========================================
// COMPONENTE: MODAL DE CHECKOUT B2B
// ==========================================
function ModalCheckout({ isOpen, onClose, carrinho, onFinalizarPedido, onRemoverItem, rotasFrete, condicoesOmie, clienteMestre }) {
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

  // ==========================================
  // 🟢 LÓGICA DE FORMAS DE PAGAMENTO DO OMIE (ANTES DO EARLY RETURN!)
  // ==========================================
  let condicoesPermitidas = [];
  if (clienteMestre?.metadata_json) {
    try {
      const meta = typeof clienteMestre.metadata_json === 'string' ? JSON.parse(clienteMestre.metadata_json) : clienteMestre.metadata_json;
      condicoesPermitidas = meta.condicoes_permitidas || [];
    } catch(e) {}
  }

  let pagamentosFiltrados = condicoesPermitidas.length > 0 
    ? condicoesOmie.filter(opcao => condicoesPermitidas.includes(String(opcao.codigo).trim()))
    : condicoesOmie;

  if (pagamentosFiltrados.length === 0 && condicoesPermitidas.length > 0) {
    pagamentosFiltrados = condicoesPermitidas.map(cod => ({ codigo: cod, descricao: `Cód: ${cod}` }));
  }

  // ==========================================
  // 🟢 TODOS OS USE-EFFECTS AQUI NO TOPO!
  // ==========================================
  
  // 1. Pré-seleciona a primeira condição válida 
  useEffect(() => {
    if (!prazoBoleto && pagamentosFiltrados.length > 0) {
      setPrazoBoleto(pagamentosFiltrados[0].codigo);
    }
  }, [pagamentosFiltrados, prazoBoleto]);

  // 2. Reseta o modal ao abrir
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
            const resCli = await fetch(`${getHubUrl()}/api/hub/clientes`, { headers: { "x-tenant-id": userObj.tenant_id } });
            const dataCli = await resCli.json();
            if (dataCli.success) {
              const meuCadastro = dataCli.clientes.find(c => c.email === userObj.email);
              if (meuCadastro && meuCadastro.id_rota_frete) {
                const resRotas = await fetch(`${getHubUrl()}/api/hub/rotas-frete`, { headers: { "x-tenant-id": userObj.tenant_id } });
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

  // 3. Busca Métodos de Pagamento
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

  // 4. Timer do PIX
  useEffect(() => {
    let timer;
    if (step === 'sucesso_pix' && tempoExpiracao > 0) {
      timer = setInterval(() => setTempoExpiracao(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, tempoExpiracao]);

  // 5. Verificação automática do PIX
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

  // ==========================================
  // 🟢 AGORA SIM, AS TRAVAS (EARLY RETURNS)
  // ==========================================
  if (!isOpen) return null;

  // CÁLCULOS DO CARRINHO
  const itensComprados = Object.values(carrinho).map(p => {
    const precoOriginal = parseFloat(p.PDPRECO || 0);
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

  // 🟢 LÓGICA DE FRETE DINÂMICA (RAIZAN SELLER)
  let minCif = 0;
  if (clienteMestre && clienteMestre.id_rota_frete) {
    const rota = rotasFrete.find(r => String(r.id) === String(clienteMestre.id_rota_frete));
    if (rota) minCif = Number(rota.valor_minimo) || 0;
  }
  const isCif = minCif > 0 && subtotal >= minCif;
  const labelTransportadora = rotaCliente 
    ? (isCif ? "Frete CIF (Grátis)" : "Frete FOB (A Combinar)") 
    : "Transportadora Parceira";


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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-all" onClick={step === 'resumo' ? onClose : null}>
      <div className="bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200/50 dark:border-zinc-800/80 rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER GLASSMORPHISM */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {step === 'resumo' && <><ShoppingCart className="text-purple-600 dark:text-purple-400" /> Finalizar Pedido</>}
            {step === 'sucesso_pix' && <><Clock className="text-indigo-500 dark:text-indigo-400" /> Aguardando Pagamento</>}
            {step === 'concluido' && <><CheckCircle2 className="text-emerald-500 dark:text-emerald-400" /> Pedido Concluído</>}
          </h2>
          <button onClick={onClose} disabled={isProcessando} className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* TELA 3: SUCESSO ABSOLUTO */}
        {step === 'concluido' && (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 text-center animate-in zoom-in-90 duration-500">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">Obrigado pelo seu pedido!</h2>
            <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-lg">
              {metodoPagamento === 'pix' && `Recebemos o seu pagamento via PIX. Seu pedido #${pedidoFinalizadoId} já foi faturado e enviado para a nossa equipe logística.`}
              {metodoPagamento === 'cartao' && `Recebemos o seu pagamento via Cartão de Crédito. Seu pedido #${pedidoFinalizadoId} foi aprovado e enviado para a separação.`}
              {metodoPagamento !== 'pix' && metodoPagamento !== 'cartao' && `Seu pedido #${pedidoFinalizadoId} faturado via Boleto foi gerado com sucesso e enviado para análise da equipe logística.`}
            </p>
            <div className="flex w-full max-w-xl flex-col sm:flex-row gap-3 sm:gap-4">
              <button onClick={onClose} className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-transparent rounded-xl font-bold transition-all shadow-sm">
                Voltar ao Catálogo
              </button>
              <button onClick={() => { onClose(); window.location.href = "/b2b-historico"; }} className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all">
                Acompanhar no Histórico
              </button>
            </div>
          </div>
        )}

        {/* TELA 2: QR CODE PIX */}
        {step === 'sucesso_pix' && dadosPix && (
          <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center animate-in slide-in-from-right-8 overflow-y-auto custom-scrollbar">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 relative shadow-inner">
              <QrCode size={32} />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping"></div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Pague via PIX para liberar o envio</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-md">Abra o aplicativo do seu banco e escaneie o código abaixo.</p>
            
            <div className="bg-white/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl px-5 py-3 mb-6 flex flex-wrap items-center justify-center gap-3 shadow-sm backdrop-blur-md">
              <Clock size={20} className="text-indigo-500 dark:text-indigo-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">O código expira em:</span>
              <span className={`text-2xl font-mono font-black ${tempoExpiracao < 300 ? 'text-rose-500 dark:text-rose-400 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {formatarTempo(tempoExpiracao)}
              </span>
            </div>
            
           <div className="w-full max-w-[280px] bg-white p-4 rounded-3xl mb-6 shadow-xl shadow-indigo-500/10 border-4 border-indigo-50 dark:border-indigo-500/20 relative overflow-hidden flex items-center justify-center min-h-[220px]">
              {dadosPix.qr_code_base64 && dadosPix.qr_code_base64.length > 50 ? (
                <img src={`data:image/png;base64,${dadosPix.qr_code_base64}`} alt="QR Code PIX" className="w-56 h-56 relative z-10 object-contain" />
              ) : (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dadosPix.qr_code)}`} alt="QR Code PIX Gerado" className="w-56 h-56 relative z-10 object-contain" />
              )}
            </div>

            <div className="w-full max-w-md space-y-3 mb-6">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-left block">Pix Copia e Cola</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input type="text" readOnly value={dadosPix.qr_code} className="w-full sm:flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-4 py-3.5 rounded-xl text-sm outline-none font-mono truncate shadow-sm" />
                <button onClick={copiarPix} className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${copiado ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'}`}>
                  {copiado ? <CheckCircle2 size={18} /> : 'Copiar'}
                </button>
              </div>
            </div>

            <button 
              onClick={verificarPagamentoManual} 
              disabled={isVerificando}
              className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 mb-4 font-medium"
            >
              <RefreshCw size={16} className={isVerificando ? "animate-spin text-indigo-500" : ""} />
              {isVerificando ? "Verificando com o banco..." : "Já paguei, mas a tela não mudou"}
            </button>

            <div className="flex flex-col items-center gap-2 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 w-full max-w-md">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800/50 shadow-sm">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                <p>Pagamento 100% seguro pelo <b>Mercado Pago</b>.</p>
              </div>
            </div>

          </div>
        )}

        {/* TELA 1: RESUMO DO PEDIDO */}
        {step === 'resumo' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 sm:gap-8 animate-in slide-in-from-left-8">
            <div className="space-y-6">
              
              {/* FORMA DE PAGAMENTO */}
              <div className="bg-white/70 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-500" /> Forma de Pagamento
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={() => setMetodoPagamento('faturado')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${metodoPagamento === 'faturado' ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400 shadow-md shadow-purple-500/10' : 'bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <FileText size={24} className="mb-2" />
                    <span className="text-sm font-bold">Boleto ERP</span>
                  </button>

                  {metodosAtivos.mercadopago && (
                    <>
                      <button onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${metodoPagamento === 'pix' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-md shadow-indigo-500/10' : 'bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                        <QrCode size={24} className="mb-2" />
                        <span className="text-sm font-bold">PIX (MP)</span>
                      </button>
                      <button onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 shadow-md shadow-blue-500/10' : 'bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                        <CreditCard size={24} className="mb-2" />
                        <span className="text-sm font-bold">Cartão</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-2">
                  {metodoPagamento === 'faturado' && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                        <CalendarDays size={18} className="text-purple-500" />
                        Prazos liberados para o seu CNPJ:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pagamentosFiltrados.length > 0 ? (
                          pagamentosFiltrados.map((opcao) => (
                            <button
                              key={opcao.codigo}
                              onClick={() => setPrazoBoleto(opcao.codigo)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all ${prazoBoleto === opcao.codigo ? 'border-purple-500 bg-white dark:bg-purple-500/10 shadow-sm' : 'border-transparent bg-white dark:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${prazoBoleto === opcao.codigo ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                                  <CalendarDays size={20} />
                                </div>
                                <div>
                                  <p className={`font-bold ${prazoBoleto === opcao.codigo ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{opcao.descricao}</p>
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Cód: {opcao.codigo}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="col-span-2 p-5 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900/30">
                            <p className="text-zinc-500 text-sm font-medium">Nenhum prazo especial localizado no cadastro. <br/> (Sujeito à análise comercial).</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {metodoPagamento === 'pix' && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl text-indigo-700 dark:text-indigo-300 text-sm font-medium flex items-center gap-3 shadow-sm">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl"><QrCode size={20} /></div>
                      <p>O QR Code do Mercado Pago será gerado na próxima tela de forma instantânea e segura.</p>
                    </div>
                  )}

                  {metodoPagamento === 'cartao' && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4">
                      {mpKeyMissing ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                          <AlertCircle size={32} className="text-rose-500 mb-3" />
                          <p className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">Indisponível no Momento</p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">O gateway de pagamento não foi ativado para esta loja.</p>
                        </div>
                      ) : subtotal < 2 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-200 dark:border-amber-800/50">
                          <AlertCircle size={32} className="text-amber-500 mb-3" />
                          <p className="text-amber-900 dark:text-amber-100 font-bold text-lg">Valor Mínimo Não Atingido</p>
                          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">As operadoras exigem um pedido mínimo de <b>R$ 2,00</b>.</p>
                        </div>
                      ) : !isMpReady ? (
                        <div className="flex flex-col items-center justify-center p-10 text-zinc-500">
                          <Loader2 size={36} className="animate-spin mb-4 text-purple-500" />
                          <p className="font-bold text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Conectando ao cofre seguro...</p>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-[#121214] p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <Payment
                            initialization={{ amount: subtotal }}
                            customization={{ 
                              visual: { style: { theme: 'default' } }, 
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
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* MÉTODO DE ENVIO */}
              <div className="bg-white/70 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Map size={16} className="text-purple-500" /> Logística e Frete
                  </h3>
                  {rotaCliente && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-100 dark:bg-purple-500/20 dark:text-purple-400 px-2 py-1 rounded-md">
                      Região: {rotaCliente.nome}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${metodoEnvio === 'transportadora' ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-500 shadow-sm' : 'bg-white dark:bg-zinc-950 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm'}`}>
                    <input type="radio" name="envio" checked={metodoEnvio === 'transportadora'} onChange={() => setMetodoEnvio('transportadora')} className="hidden" />
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${metodoEnvio === 'transportadora' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                      <Truck size={24} />
                    </div>
                    <div>
                      <p className={`text-base font-bold ${metodoEnvio === 'transportadora' ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {labelTransportadora}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {minCif > 0 ? (isCif ? `Mínimo de R$ ${minCif} atingido!` : `Faltam R$ ${(minCif - subtotal).toFixed(2)} para Frete Grátis`) : "O valor final será calculado pela logística."}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${metodoEnvio === 'retirada' ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-500 shadow-sm' : 'bg-white dark:bg-zinc-950 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm'}`}>
                    <input type="radio" name="envio" checked={metodoEnvio === 'retirada'} onChange={() => setMetodoEnvio('retirada')} className="hidden" />
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${metodoEnvio === 'retirada' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className={`text-base font-bold ${metodoEnvio === 'retirada' ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}>Retirada no CD</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Isento de frete. Agendamento necessário após faturamento.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* BARRA LATERAL: RESUMO */}
            <div className="flex flex-col bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] overflow-hidden min-h-[300px] shadow-lg lg:sticky lg:top-6 h-max">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  Resumo do Carrinho
                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 text-xs px-2.5 py-1 rounded-full">{itensComprados.length} Itens</span>
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[40vh] bg-zinc-50/30 dark:bg-transparent">
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50 px-2">
                  {itensComprados.map(item => (
                    <li key={item.PDCODPRO} className="py-4 flex items-start justify-between gap-3 group">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">{item.PDNOME}</p>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                          {item.qtd}x {formatarMoeda(item.precoUsado)} 
                          {item.atingiuMinimo && <span className="text-emerald-500 font-bold ml-1 inline-flex items-center gap-0.5"><Zap size={10}/> Promo</span>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {formatarMoeda(item.totalItem)}
                        </div>
                        <button 
                          onClick={() => onRemoverItem(item.PDCODPRO)}
                          className="text-zinc-400 hover:text-rose-500 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                    <span>Subtotal Produtos</span><span>{formatarMoeda(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-sm font-medium pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
                    <span>Frete Estimado</span>
                    <span className={isCif && metodoEnvio === 'transportadora' ? "text-emerald-500 font-bold" : "italic"}>
                      {metodoEnvio === 'retirada' ? "Grátis (Retirada)" : (isCif ? "Grátis (CIF)" : "A calcular (FOB)")}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total a Pagar</span>
                  <span className="text-3xl font-black text-purple-600 dark:text-purple-400 leading-none">{formatarMoeda(subtotal)}</span>
                </div>
                
                {metodoPagamento !== 'cartao' && (
                  <button onClick={handleConfirmar} disabled={isProcessando} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2 mt-4 text-base active:scale-95">
                    {isProcessando ? <><Loader2 size={20} className="animate-spin" /> Processando...</> : <><CheckCircle2 size={20} /> Concluir Pedido</>}
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
      <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-purple-500/40 rounded-xl overflow-hidden h-10 shadow-sm">
        <button onClick={() => onQtdChange(id, Math.max(0, qtd - 1))} className="w-10 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium">-</button>
        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm w-8 text-center">{qtd}</span>
        <button onClick={() => onQtdChange(id, qtd + 1)} className="w-10 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium">+</button>
      </div>
    );
  }
  return (
    <button onClick={() => onQtdChange(id, 1)} className="w-full h-10 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-purple-600 text-zinc-600 hover:text-white dark:bg-zinc-800 dark:hover:bg-purple-600 dark:text-zinc-300 rounded-xl font-bold transition-all text-xs shadow-sm">
      Adicionar
    </button>
  );
}

// ==========================================
// TELA PRINCIPAL: CATÁLOGO B2B
// ==========================================
export default function CatalogoB2B() {
  const [carrinho, setCarrinho] = useState({});
  const [produtosDb, setProdutosDb] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20); 

  const [somenteOfertas, setSomenteOfertas] = useState(false);

  // 🟢 ESTADOS GLOBAIS DE CONTEXTO DO CLIENTE E OMIE
  const [clienteMestre, setClienteMestre] = useState(null);
  const [rotasFrete, setRotasFrete] = useState([]);
  const [condicoesOmie, setCondicoesOmie] = useState([]);

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

  // 🟢 BUSCA DOS DADOS E PRODUTOS DO HUB
  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);
      try {
        const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || (localStorage.getItem("raizan_user") ? JSON.parse(localStorage.getItem("raizan_user")).tenant_id : "28389424000109");
        const userEmail = localStorage.getItem("raizan_user") ? JSON.parse(localStorage.getItem("raizan_user")).email : null;
        const headers = { "x-tenant-id": tenantId };

        const [resProd, resCli, resRotas, resCond] = await Promise.all([
          fetch(`${getHubUrl()}/api/hub/produtos?limit=5000`, { headers }).catch(()=>null),
          fetch(`${getHubUrl()}/api/hub/clientes`, { headers }).catch(()=>null),
          fetch(`${getHubUrl()}/api/hub/rotas-frete`, { headers }).catch(()=>null),
          fetch(`${getHubUrl()}/api/hub/integracoes/omie/condicoes-pagamento`, { headers }).catch(()=>null)
        ]);
        
        if (resProd) {
          const dataProd = await resProd.json();
          if (dataProd.success) {
            const mapped = dataProd.produtos.map(p => ({
              id: p.id,
              PDCODPRO: p.sku || p.id,
              PDNOME: p.nome,
              PDCODBARRA: p.gtin,
              PDMARCA: p.marca,
              PDSALDO: p.estoque_inicial,
              PDPRECO: p.preco_venda,
              preco_promocional: p.preco_promocional,
              qtd_minima_promocao: p.qtd_minima_promocao,
              imagens_anexos: p.imagens_anexos,
              status: p.status
            })).filter(p => p.status !== 'inativo');
            setProdutosDb(mapped); 
          }
        }

        if (resCli && userEmail) {
          const dataCli = await resCli.json();
          if (dataCli.success) setClienteMestre(dataCli.clientes.find(c => c.email === userEmail));
        }

        if (resRotas) {
          const dataRotas = await resRotas.json();
          if (dataRotas.success) setRotasFrete(dataRotas.rotas);
        }

        if (resCond) {
          const dataCond = await resCond.json();
          if (dataCond.success) setCondicoesOmie(dataCond.condicoes);
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

  const produtosFiltrados = produtosDb.filter(p => {
    const termo = search.toLowerCase();
    const matchBusca = (p.PDNOME && p.PDNOME.toLowerCase().includes(termo)) || 
                       (p.PDCODPRO && String(p.PDCODPRO).toLowerCase().includes(termo)) || 
                       (p.PDCODBARRA && String(p.PDCODBARRA).toLowerCase().includes(termo));
    
    const temPromo = parseFloat(p.preco_promocional) > 0;
    const matchOferta = somenteOfertas ? temPromo : true;

    return matchBusca && matchOferta;
  });

  const totalPages = Math.ceil(produtosFiltrados.length / limit);
  const offset = (page - 1) * limit;
  const produtosPaginados = produtosFiltrados.slice(offset, offset + Number(limit));

  const handleQuantidade = (produto, qtd) => {
    setCarrinho(prev => {
      const novo = { ...prev };
      if (qtd === 0) {
        delete novo[produto.PDCODPRO];
      } else {
        novo[produto.PDCODPRO] = { ...produto, qtd };
      }
      localStorage.setItem("@raizan:carrinho", JSON.stringify(novo));
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
    const cabecalhosPadrao = getHeaders();
    
    const tenant_id = userLogado.tenant_id || cabecalhosPadrao["x-tenant-id"] || process.env.NEXT_PUBLIC_TENANT_ID; 

    if (!tenant_id) {
       toast.error("Erro de identificação da loja. Limpe o cache e faça login novamente.");
       return null;
    }

    const itensParaBackend = dadosDoPedido.itens.map(i => ({
      ...i,
      nome_produto: i.PDNOME,
      sku: i.PDCODPRO
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
      const cabecalhosComCracha = {
        ...cabecalhosPadrao,
        "Content-Type": "application/json", 
        "x-tenant-id": tenant_id
      };

      const response = await fetch(`${getHubUrl()}/api/hub/pedidos/criar`, {
        method: "POST",
        headers: cabecalhosComCracha,
        body: JSON.stringify(payloadCompleto)
      });
      const data = await response.json();

      if (!data.success) {
        toast.error("Erro ao gerar pedido: " + data.message, { id: toastId });
        return null;
      }

      if (dadosDoPedido.metodoPagamento === 'pix' || dadosDoPedido.metodoPagamento === 'cartao') {
        toast.loading("Conectando com o Mercado Pago...", { id: toastId });
        
        const payRes = await fetch(`${getHubUrl()}/api/hub/pagamentos/gerar`, {
          method: "POST",
          headers: cabecalhosComCracha, 
          body: JSON.stringify({
            pedidoId: data.pedidoId,
            valor: dadosDoPedido.subtotal,
            metodo: dadosDoPedido.metodoPagamento,
            dadosCartao: dadosDoPedido.dadosCartaoMp,
            cliente: payloadCompleto.cliente 
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
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 sm:p-5 lg:p-8 pb-36 relative">
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            
            {/* CABEÇALHO B2B */}
            <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/80 flex flex-col xl:flex-row gap-5 items-start xl:items-center justify-between shadow-sm transition-colors duration-300">
              <div className="w-full xl:w-auto">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
                  <Package className="text-purple-600 dark:text-purple-400" size={28} /> Catálogo B2B Raizan
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Faça a reposição do seu estoque com facilidade.</p>
              </div>

              <div className="flex w-full xl:w-auto items-stretch sm:items-center gap-3 flex-col sm:flex-row sm:flex-wrap xl:justify-end">
                
                <label className="w-full sm:w-auto flex items-center gap-2 cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700 px-5 py-3 rounded-xl transition-all shadow-sm">
                  <input 
                    type="checkbox" 
                    checked={somenteOfertas} 
                    onChange={(e) => { setSomenteOfertas(e.target.checked); setPage(1); }}
                    className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                  />
                  <Zap size={16} className={somenteOfertas ? "text-amber-500 fill-amber-500" : "text-zinc-400"} />
                  <span className={`text-sm font-bold ${somenteOfertas ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}>Ofertas Especiais</span>
                </label>

                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(e.target.value); setPage(1); }} 
                  className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-purple-500 cursor-pointer shadow-sm"
                >
                  <option value="20">20 itens / pág</option>
                  <option value="50">50 itens / pág</option>
                  <option value="100">100 itens / pág</option>
                </select>

                <form onSubmit={handleSearch} className="relative w-full sm:w-72 lg:w-96 shadow-sm">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Buscar por produto, SKU ou EAN..." 
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-purple-500 transition-all placeholder:text-zinc-400"
                  />
                </form>
              </div>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-[2rem] overflow-hidden relative min-h-[500px] flex flex-col shadow-lg shadow-zinc-200/20 dark:shadow-none transition-colors duration-300">
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={40} className="text-purple-600 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto flex-1 p-2">
                <table className="w-full min-w-[860px] text-sm text-left border-collapse">
                  <thead className="text-zinc-400 dark:text-zinc-500 font-bold border-b border-zinc-100 dark:border-zinc-800/60 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-4 w-24 text-center">Capa</th> 
                      <th className="px-5 py-4 w-[40%]">Descrição do Produto</th>
                      <th className="px-5 py-4 w-32">Marca</th>
                      <th className="px-5 py-4 text-center">Disponível</th>
                      <th className="px-5 py-4 text-right">Valor Unitário</th>
                      <th className="px-5 py-4 text-center w-40">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {produtosPaginados.length === 0 && !loading && (
                      <tr>
                        <td colSpan="6" className="px-5 py-20 text-center text-zinc-500">
                          <Package size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                          <p className="font-medium text-base">Nenhum produto atende à sua busca.</p>
                        </td>
                      </tr>
                    )}

                    {produtosPaginados.map((produto) => {
                      const qtdNoCarrinho = carrinho[produto.PDCODPRO]?.qtd || 0;
                      const imageUrl = obterCapa(produto);
                      const temEstoque = produto.PDSALDO > 0;
                      
                      const precoOriginal = parseFloat(produto.PDPRECO || 0);
                      const minExigido = parseInt(produto.qtd_minima_promocao) || 1;
                      const emPromocao = parseFloat(produto.preco_promocional) > 0;
                      const atingiuMinimo = emPromocao && qtdNoCarrinho >= minExigido;
                      
                      const precoExibicao = atingiuMinimo ? parseFloat(produto.preco_promocional) : precoOriginal;
                      const desconto = atingiuMinimo && precoOriginal > 0 ? Math.round(((precoOriginal - precoExibicao) / precoOriginal) * 100) : 0;

                      return (
                        <tr key={produto.PDCODPRO} className={`transition-colors group ${!temEstoque ? 'opacity-50 grayscale bg-zinc-50 dark:bg-zinc-900/20' : 'hover:bg-purple-50/50 dark:hover:bg-purple-500/5'}`}>
                          <td className="px-5 py-3">
                            <div className="relative w-16 h-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-purple-300 transition-all mx-auto">
                              {emPromocao && desconto > 0 && (
                                <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg shadow-sm z-10 flex items-center gap-0.5">
                                  -{desconto}%
                                </div>
                              )}
                              <img src={imageUrl} alt={produto.PDNOME} className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto"; }} />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug">{produto.PDNOME}</h3>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                              <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider">SKU: {produto.PDCODPRO}</span>
                              {produto.PDCODBARRA && <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><Barcode size={10}/> {produto.PDCODBARRA}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">{produto.PDMARCA || "-"}</td>
                          <td className="px-5 py-3 text-center">
                            {temEstoque ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                                {produto.PDSALDO} UN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-500/20">
                                Sem Estoque
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {emPromocao ? (
                              <div className="flex flex-col items-end">
                                {atingiuMinimo && <span className="text-zinc-400 line-through text-[10px] font-medium leading-none mb-1">{formatarMoeda(precoOriginal)}</span>}
                                <span className={`font-black tracking-tight ${atingiuMinimo ? 'text-purple-600 dark:text-purple-400 text-lg' : 'text-zinc-900 dark:text-zinc-100 text-base'}`}>
                                  {formatarMoeda(precoExibicao)}
                                </span>
                                {!atingiuMinimo ? (
                                   <span className="text-[9px] bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold border border-rose-200 dark:border-rose-500/20 mt-1 flex items-center gap-1 w-fit uppercase tracking-wider">
                                      <Tag size={10} /> a partir de {minExigido} un.
                                   </span>
                                ) : (
                                   <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-500/20 mt-1 flex items-center gap-1 w-fit uppercase tracking-wider">
                                      <Zap size={10} fill="currentColor" /> Oferta Aplicada
                                   </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">{formatarMoeda(precoOriginal)}</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {temEstoque ? (
                              <SeletorQuantidade id={produto.PDCODPRO} qtd={qtdNoCarrinho} onQtdChange={(id, qtd) => handleQuantidade(produto, qtd)} />
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block text-center">Indisponível</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* FOOTER DA TABELA */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-[#121214]/50 flex flex-col sm:flex-row items-center gap-4 justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  Página <span className="text-zinc-900 dark:text-zinc-100">{page}</span> de <span className="text-zinc-900 dark:text-zinc-100">{totalPages || 1}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 w-10 h-10 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-colors disabled:opacity-50 shadow-sm"><ChevronLeft size={18} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 w-10 h-10 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-colors disabled:opacity-50 shadow-sm"><ChevronRight size={18} /></button>
                </div>
              </div>

            </div>
            
            {Object.keys(carrinho).length > 0 && <div className="h-32 w-full shrink-0"></div>}

          </div>
        </main>

        {/* CARRINHO FLUTUANTE GLASSMORPHISM */}
        {Object.keys(carrinho).length > 0 && (
          <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-[280px] right-4 sm:right-6 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800/80 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center gap-4 justify-between animate-in slide-in-from-bottom-10 z-30 shadow-2xl shadow-purple-900/10 dark:shadow-none">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center shrink-0 border border-purple-500/50">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
                  {Object.values(carrinho).reduce((a, b) => a + b.qtd, 0)} Itens
                </p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">Pronto para envio</p>
              </div>
            </div>
            
            <button onClick={() => setIsCheckoutOpen(true)} className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-8 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base">
              Avançar e Pagar <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>

      <ModalCheckout 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        carrinho={carrinho} 
        onFinalizarPedido={handleFinalizarPedido} 
        onRemoverItem={(id) => handleQuantidade({ PDCODPRO: id }, 0)} 
        clienteMestre={clienteMestre}
        rotasFrete={rotasFrete}
        condicoesOmie={condicoesOmie}
      />
      
    </div>
  );
}