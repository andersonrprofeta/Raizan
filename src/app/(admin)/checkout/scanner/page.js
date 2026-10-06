"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScanBarcode, PackageCheck, ArrowLeft, Loader2, CheckCircle2, Package } from 'lucide-react';
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
  const inputRef = useRef(null);
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
              item.sku,
              item.ean,
              item.gtin,
              item.codigo_barras,
              item.barcode,
              item.product_id,
              item.codigo
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
                if (confInicial[ch]) {
                  confInicial[ch].qtdBipada = parsed[ch].qtdBipada;
                }
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

  useEffect(() => {
    carregarPedido();
  }, [pedidoId]);

  useEffect(() => {
    if (!loading && inputRef.current && !modalSairAberto && !modalDadosAberto) {
      inputRef.current.focus();
    }
  }, [loading, modalSairAberto, modalDadosAberto]);

  useEffect(() => {
    if (Object.keys(conferencia).length > 0) {
      const algumBipado = Object.values(conferencia).some(item => item.qtdBipada > 0);
      if (algumBipado) {
        localStorage.setItem(`@raizan:conferencia_${pedidoId}`, JSON.stringify(conferencia));
      }
    }
  }, [conferencia, pedidoId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const algumBipado = Object.values(conferencia).some(item => item.qtdBipada > 0);
      const todosBipados = Object.values(conferencia).every(item => item.qtdBipada === item.qtdPedida);
      
      if (algumBipado && !todosBipados) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [conferencia]);

  const processarBipagem = (e) => {
    e.preventDefault();
    if (!codigoBipado.trim()) return;

    const codigoLimpo = codigoBipado.trim().toLowerCase();
    
    const chaveEncontrada = Object.keys(conferencia).find(chave => 
      conferencia[chave]?.codigosValidos?.includes(codigoLimpo)
    );
    
    if (chaveEncontrada) {
      const item = conferencia[chaveEncontrada];
      
      if (item.qtdBipada < item.qtdPedida) {
        setConferencia(prev => ({
          ...prev,
          [chaveEncontrada]: { ...item, qtdBipada: item.qtdBipada + 1 }
        }));
        tocarSucesso();
      } else {
        tocarErro();
        toast.error("Quantidade máxima atingida para este item!", { style: { background: '#EF4444', color: '#fff', borderRadius: '10px' }});
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
        headers: { 
          ...getHeaders(), 
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          pedido_id: pedido.pedido_id,
          logistica: dadosLogisticos 
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Tudo certo! Movido para Faturar no Omie.", { id: loadingToast });
        localStorage.removeItem(`@raizan:conferencia_${pedidoId}`);
        setTimeout(() => {
          window.close(); 
        }, 1500);
      } else {
        toast.error(data.message || "Falha ao mover etapa no Omie.", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor.", { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9FB] dark:bg-zinc-950">
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

  const itensVisiveis = itensArray.filter(item => item.qtdBipada > 0);

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-zinc-950 flex flex-col font-sans" onClick={() => !modalSairAberto && !modalDadosAberto && inputRef.current?.focus()}>
      
      <ModalConfirmacaoSair 
        isOpen={modalSairAberto} 
        onConfirm={() => window.close()} 
        onCancel={() => {
          setModalSairAberto(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }} 
      />

      <ManipulaDados 
        isOpen={modalDadosAberto}
        onClose={() => {
          setModalDadosAberto(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        onConfirm={finalizarExpedicao}
        pedido={pedido}
      />

      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 px-6 py-4 flex flex-col gap-4 sticky top-0 z-30">
        
        {progressoRecuperado && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[9px] font-bold tracking-widest uppercase px-3 py-0.5 rounded-b-md shadow-sm">
            Recuperado
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight flex items-center gap-2">
              Pedido #{pedido.pedido_id}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              Cliente: <span className="text-zinc-700 dark:text-zinc-300">{pedido.billing?.first_name}</span>
            </p>
          </div>

          <form onSubmit={processarBipagem} className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ScanBarcode size={16} className={nenhumBipado ? "text-blue-500 animate-pulse" : "text-zinc-400 dark:text-zinc-500"} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={codigoBipado}
              onChange={(e) => setCodigoBipado(e.target.value)}
              placeholder="Aguardando leitor..."
              className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white text-sm rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-medium"
              autoFocus
              autoComplete="off"
              onBlur={() => {
                if (!modalSairAberto && !modalDadosAberto) setTimeout(() => inputRef.current?.focus(), 100);
              }}
            />
          </form>
        </div>

        <div className="w-full">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span>Progresso da Caixa</span>
            <span>{totalBipados} de {totalItens} volumes</span>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 w-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out rounded-full ${todosBipados ? 'bg-emerald-500' : 'bg-blue-500'}`} 
              style={{ width: `${progressoPercent}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">
        {nenhumBipado ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-60">
            <ScanBarcode size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">Contagem Cega Ativada</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Bipe um produto da caixa para revelar a linha.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {itensVisiveis.map((item) => {
              const finalizado = item.qtdBipada === item.qtdPedida;

              return (
                <div 
                  key={item.chave} 
                  className={`p-3.5 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
                    finalizado 
                      ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30' 
                      : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {item.imagem ? (
                      <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-zinc-300 dark:text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${finalizado ? 'text-emerald-800 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {item.nome}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-4 pl-2 border-l border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-baseline gap-0.5 w-12 justify-end">
                      <span className={`text-xl font-bold ${finalizado ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-white'}`}>
                        {item.qtdBipada}
                      </span>
                      <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">/{item.qtdPedida}</span>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${finalizado ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-100' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-500 scale-90'}`}>
                      <CheckCircle2 size={18} strokeWidth={finalizado ? 3 : 2} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-zinc-200/60 dark:border-zinc-800/60 p-4 sm:px-6 flex justify-between items-center sticky bottom-0 z-20">
        <button 
          onClick={handleSair} 
          className="px-4 py-2.5 font-medium text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div>
          {todosBipados ? (
            <button 
              onClick={() => setModalDadosAberto(true)} 
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <PackageCheck size={18} /> Finalizar Embalagem
            </button>
          ) : (
            <div className="px-6 py-2.5 rounded-xl font-medium text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center gap-2 cursor-not-allowed">
              <Loader2 size={14} className="animate-spin" /> Conclua 100% da bipagem para faturar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutScanner() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9FB] dark:bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-400 mb-3" size={32} />
      </div>
    }>
      <ScannerMesa />
    </Suspense>
  );
}