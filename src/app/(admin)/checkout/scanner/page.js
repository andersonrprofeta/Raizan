"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScanBarcode, PackageCheck, ArrowLeft, Loader2, CheckCircle2, Package, Search, AlertCircle, ClipboardList, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";
import ModalConfirmacaoSair from "@/components/checkout/ModalConfirmacaoSair";
import ManipulaDados from "@/components/checkout/ManipulaDados";

function ScannerMesa() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('id'); 

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [codigoBipado, setCodigoBipado] = useState('');
  const [quantidadeManual, setQuantidadeManual] = useState(1);
  const [modalAuditoriaAberto, setModalAuditoriaAberto] = useState(false);
  
  const inputRef = useRef(null);
  const listaRef = useRef(null); 

  const [conferencia, setConferencia] = useState({});
  const [progressoRecuperado, setProgressoRecuperado] = useState(false);
  
  const [modalSairAberto, setModalSairAberto] = useState(false);
  const [modalDadosAberto, setModalDadosAberto] = useState(false);

  const tocarSucesso = () => new Audio('/sucesso.mp3').play().catch(()=>{});
  const tocarErro = () => new Audio('/erro.mp3').play().catch(()=>{});

  const carregarPedido = async () => {
    if (!pedidoId) return;
    setLoading(true);
    try {
      const tenantId = localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID;
      
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/omie`, {
        method: 'POST',
        headers: { ...getHeaders(), 'x-tenant-id': tenantId },
        body: JSON.stringify({ page: 1, limit: 100 }) 
      });
      const data = await res.json();
      
      if (data.success && data.pedidos) {
        const ped = data.pedidos.find(p => String(p.pedido_id) === String(pedidoId) || String(p.id) === String(pedidoId));
        
        if (ped) {
          setPedido(ped);
          
          const confInicial = {};
          ped.line_items.forEach((item, index) => {
            const chave = String(item.id || item.product_id || item.sku || `item_${index}`); 
            
            const codigosPermitidos = [
              item.sku, item.ean, item.gtin, item.codigo_barras, item.barcode, item.product_id, item.codigo
            ].filter(val => val !== null && val !== undefined && String(val).trim() !== '')
             .map(val => String(val).trim().toLowerCase()); 

            confInicial[chave] = {
              chave: chave,
              nome: item.name,
              qtdPedida: item.quantity,
              qtdBipada: 0,
              imagem: item.image_url || item.imagem_url || item.foto_url || item.produto_imagem || item.imagem || null,
              codigosValidos: codigosPermitidos 
            };
          });

          const cacheKey = `@raizan:conferencia_${pedidoId}`;
          const savedProgress = localStorage.getItem(cacheKey);
          
          if (savedProgress) {
            try {
              const parsed = JSON.parse(savedProgress);
              Object.keys(parsed).forEach(ch => {
                if (confInicial[ch]) confInicial[ch].qtdBipada = parsed[ch].qtdBipada;
              });
              setProgressoRecuperado(true);
              toast.success("Progresso recuperado.", { icon: '💾', style: { borderRadius: '12px', fontSize: '14px' } });
            } catch(e) {
              localStorage.removeItem(cacheKey);
            }
          }

          setConferencia(confInicial);
        } else {
          toast.error(`Pedido #${pedidoId} não encontrado.`);
        }
      }
    } catch (error) {
      toast.error("Erro ao carregar o pedido.");
    }
    setLoading(false);
  };

  useEffect(() => { carregarPedido(); }, [pedidoId]);

  useEffect(() => {
    if (!loading && inputRef.current && !modalSairAberto && !modalDadosAberto && !modalAuditoriaAberto) {
      inputRef.current.focus();
    }
  }, [loading, modalSairAberto, modalDadosAberto, modalAuditoriaAberto]);

  useEffect(() => {
    if (Object.keys(conferencia).length > 0) {
      const algumBipado = Object.values(conferencia).some(item => item.qtdBipada > 0);
      if (algumBipado) {
        localStorage.setItem(`@raizan:conferencia_${pedidoId}`, JSON.stringify(conferencia));
      }
    }
  }, [conferencia, pedidoId]);

  useEffect(() => {
    if (listaRef.current && !modalAuditoriaAberto) {
      listaRef.current.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [conferencia, modalAuditoriaAberto]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const algumBipado = Object.values(conferencia).some(item => item.qtdBipada > 0);
      const todosBipados = Object.values(conferencia).every(item => item.qtdBipada === item.qtdPedida);
      if (algumBipado && !todosBipados) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [conferencia]);

  const processarBipagem = (e) => {
    if (e) e.preventDefault(); 
    if (!codigoBipado.trim() || modalAuditoriaAberto) return;

    const codigoLimpo = codigoBipado.trim().toLowerCase();
    const chaveEncontrada = Object.keys(conferencia).find(chave => 
      conferencia[chave]?.codigosValidos?.includes(codigoLimpo)
    );
    
    if (chaveEncontrada) {
      const item = conferencia[chaveEncontrada];
      const qtdAdicionar = Number(quantidadeManual) || 1;
      const novaQuantidade = item.qtdBipada + qtdAdicionar;

      if (novaQuantidade <= item.qtdPedida) {
        setConferencia(prev => ({
          ...prev,
          [chaveEncontrada]: { ...item, qtdBipada: novaQuantidade }
        }));
        tocarSucesso();
        setQuantidadeManual(1); 
      } else {
        tocarErro();
        toast.error(`Quantidade excedida! Faltam apenas ${item.qtdPedida - item.qtdBipada}.`, { style: { background: '#EF4444', color: '#fff', borderRadius: '10px' }});
      }
    } else {
      tocarErro();
      toast.error("CÓDIGO INVÁLIDO OU NÃO PERTENCE AO PEDIDO!", { style: { background: '#EF4444', color: '#fff', padding: '12px', fontWeight: 'bold', borderRadius: '10px' }});
    }

    setCodigoBipado('');
    inputRef.current.focus();
  };

  const handleSair = () => {
    const nenhumBipado = Object.values(conferencia).every(item => item.qtdBipada === 0);
    const todosBipados = Object.values(conferencia).every(item => item.qtdBipada === item.qtdPedida);

    if (!nenhumBipado && !todosBipados) {
      setModalSairAberto(true);
    } else {
      window.close(); 
    }
  };

  const finalizarExpedicao = async (dadosLogisticos) => {
    setModalDadosAberto(false); 
    const tenantId = localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID;
    const loadingToast = toast.loading("Enviando para o Omie...");
    
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/finalizar-conferencia`, {
        method: 'POST',
        headers: { ...getHeaders(), 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido_id: pedido.pedido_id, logistica: dadosLogisticos })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Tudo certo! Movido para Faturar no Omie.", { id: loadingToast });
        localStorage.removeItem(`@raizan:conferencia_${pedidoId}`);
        setTimeout(() => window.close(), 1500);
      } else {
        toast.error(data.message || "Falha ao mover etapa no Omie.", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor.", { id: loadingToast });
    }
  };

  const handleFundoClick = (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !modalSairAberto && !modalDadosAberto && !modalAuditoriaAberto) {
      inputRef.current?.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F9F9FB] dark:bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-400 mb-3" size={32} />
        <p className="text-zinc-400 font-medium text-sm">Carregando Itens...</p>
      </div>
    );
  }

  if (!pedido) return <div className="p-10 text-zinc-500 dark:text-zinc-400">Erro ao carregar a mesa.</div>;

  const itensArray = Object.values(conferencia);
  const totalItens = itensArray.reduce((acc, item) => acc + item.qtdPedida, 0);
  const totalBipados = itensArray.reduce((acc, item) => acc + item.qtdBipada, 0);
  const progressoPercent = (totalBipados / totalItens) * 100;

  const todosBipados = totalBipados === totalItens;
  const nenhumBipado = totalBipados === 0;

  // A lista principal SEMPRE esconde itens zerados para manter a contagem cega blindada
  const itensVisiveis = itensArray.filter(item => item.qtdBipada > 0);
  const itensFaltantes = itensArray.filter(item => item.qtdBipada < item.qtdPedida);

  return (
    <div className="h-screen bg-[#F9F9FB] dark:bg-zinc-950 flex flex-col font-sans overflow-hidden" onClick={handleFundoClick}>
      
      <ModalConfirmacaoSair isOpen={modalSairAberto} onConfirm={() => window.close()} onCancel={() => { setModalSairAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }} />
      <ManipulaDados isOpen={modalDadosAberto} onClose={() => { setModalDadosAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }} onConfirm={finalizarExpedicao} pedido={pedido} />

      {/* 🟢 MODAL DE AUDITORIA GLASSMORPHISM */}
      {modalAuditoriaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md transition-all">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl border border-white/40 dark:border-zinc-700/50 flex flex-col overflow-hidden ring-1 ring-black/5">
            
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-800 dark:text-white tracking-tight">Auditoria de Faltantes</h2>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Existem {itensFaltantes.length} tipos de itens pendentes nesta caixa</p>
                </div>
              </div>
              <button onClick={() => { setModalAuditoriaAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }} className="w-10 h-10 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-white/30 dark:bg-black/20">
              {itensFaltantes.map((item) => (
                <div key={item.chave} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {item.imagem ? <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" /> : <Package size={20} className="text-zinc-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-800 dark:text-white truncate">{item.nome}</p>
                    <span className="inline-block mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      Cod: {item.codigosValidos[0] || 'N/I'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase mb-0.5">Falta bipar</p>
                    <p className="text-2xl font-black text-zinc-800 dark:text-white">{item.qtdPedida - item.qtdBipada}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-zinc-50/80 dark:bg-zinc-900/80 border-t border-zinc-200/50 dark:border-zinc-800/50 flex justify-end backdrop-blur-md">
              <button 
                onClick={() => { setModalAuditoriaAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-8 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md flex items-center gap-2"
              >
                <ScanBarcode size={18} /> Voltar para a Contagem
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* CABEÇALHO FIXO NATIVO */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 px-6 py-4 flex flex-col gap-5 shrink-0 z-30 shadow-sm">
        
        {progressoRecuperado && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[9px] font-bold tracking-widest uppercase px-3 py-0.5 rounded-b-md shadow-sm">Recuperado</div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight flex items-center gap-2">
              Pedido #{pedido.pedido_id}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              Cliente: <span className="text-zinc-800 dark:text-zinc-200">{pedido.billing?.first_name}</span>
            </p>
          </div>

          <form onSubmit={processarBipagem} onClick={(e) => e.stopPropagation()} className="flex w-full md:w-auto gap-2">
            <div className="w-20 relative group">
              <span className="absolute -top-2 left-2 bg-white dark:bg-zinc-900 text-[9px] font-bold px-1 text-zinc-500 group-focus-within:text-blue-500 transition-colors">QTD</span>
              <input
                type="number"
                min="1"
                value={quantidadeManual}
                onChange={(e) => setQuantidadeManual(e.target.value)}
                disabled={modalAuditoriaAberto}
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white text-lg rounded-xl px-2 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-bold text-center disabled:opacity-50"
              />
            </div>
            
            <div className="relative flex-1 md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ScanBarcode size={20} className={nenhumBipado && !modalAuditoriaAberto ? "text-blue-500 animate-pulse" : "text-zinc-400"} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={codigoBipado}
                onChange={(e) => setCodigoBipado(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') processarBipagem(e); }}
                disabled={modalAuditoriaAberto}
                placeholder={modalAuditoriaAberto ? "Auditoria em andamento..." : "Aguardando leitor..."}
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white text-base rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono font-bold uppercase tracking-wider shadow-inner disabled:opacity-50"
                autoFocus
                autoComplete="off"
                onBlur={() => { if (!modalSairAberto && !modalDadosAberto && !modalAuditoriaAberto) setTimeout(() => inputRef.current?.focus(), 100); }}
              />
            </div>
            <button type="submit" className="hidden">Bipar</button>
          </form>
        </div>

        <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            <span>Progresso da Caixa</span>
            <span className={todosBipados ? 'text-emerald-600' : 'text-blue-600'}>{totalBipados} / {totalItens} volumes</span>
          </div>
          <div className="bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 w-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-full ${todosBipados ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
              style={{ width: `${progressoPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* MIOLO ROLÁVEL NATIVO */}
      <div ref={listaRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar pb-8">
        <div className="max-w-4xl mx-auto w-full">
          {nenhumBipado ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-80">
              <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-blue-100 dark:border-blue-500/20">
                <ScanBarcode size={40} className="text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">Contagem Cega Ativada</h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-center max-w-sm">
                Inicie a bipagem ou altere a quantidade manual acima. A lista será revelada gradualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {itensVisiveis.map((item) => {
                const finalizado = item.qtdBipada === item.qtdPedida;
                const perctItem = (item.qtdBipada / item.qtdPedida) * 100;

                return (
                  <div 
                    key={item.chave} 
                    className={`p-4 rounded-2xl border-2 flex items-center gap-5 transition-all duration-300 relative overflow-hidden ${
                      finalizado 
                        ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' 
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-md hover:border-blue-300'
                    }`}
                  >
                    {!finalizado && (
                       <div className="absolute top-0 left-0 h-full bg-blue-50 dark:bg-blue-900/10 transition-all duration-500 -z-0" style={{ width: `${perctItem}%` }} />
                    )}

                    <div className="relative z-10 w-16 h-16 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {item.imagem ? (
                        <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="text-zinc-300 dark:text-zinc-600" />
                      )}
                    </div>

                    <div className="relative z-10 flex-1 min-w-0 py-1">
                      <p className={`font-bold text-base truncate ${finalizado ? 'text-emerald-800 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                        {item.nome}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          Cod: {item.codigosValidos[0] || 'N/I'}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 text-right flex items-center gap-5 pl-4 border-l border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-baseline gap-1 w-16 justify-end">
                        <span className={`text-3xl font-black ${finalizado ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-white'}`}>
                          {item.qtdBipada}
                        </span>
                        <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500">/{item.qtdPedida}</span>
                      </div>

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${finalizado ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-110' : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 scale-95'}`}>
                        <CheckCircle2 size={22} strokeWidth={finalizado ? 3 : 2} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RODAPÉ FIXO NATIVO */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800/60 p-4 sm:px-6 flex justify-between items-center shrink-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleSair} 
          className="px-5 py-3 font-bold text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2 active:scale-95"
        >
          <ArrowLeft size={18} /> Sair
        </button>

        <div>
          {todosBipados ? (
            <button 
              onClick={() => setModalDadosAberto(true)} 
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <PackageCheck size={20} /> FINALIZAR EMBALAGEM
            </button>
          ) : (
            <button 
              onClick={() => { setModalAuditoriaAberto(true); inputRef.current?.blur(); }}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Search size={18} /> Auditar Faltantes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutScanner() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9FB] dark:bg-zinc-950"><Loader2 className="animate-spin text-zinc-400 mb-3" size={32} /></div>}>
      <ScannerMesa />
    </Suspense>
  );
}