"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScanBarcode, PackageCheck, ArrowLeft, Loader2, CheckCircle2, Package, Search, ClipboardList, OctagonAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";
import ModalConfirmacaoSair from "@/components/checkout/ModalConfirmacaoSair";
import ManipulaDados from "@/components/checkout/ManipulaDados";
import { montarSeparacao } from "@/components/checkout/ListaSeparacao";
import { VIDRO, BOTAO_ROXO, BOTAO_VERDE, BOTAO_VIDRO, LuzesDeFundo } from "@/components/checkout/estilos";

const codigosDoItem = (item) => [
  item.sku, item.ean, item.gtin, item.codigo_barras, item.barcode, item.product_id, item.codigo
].filter(val => val !== null && val !== undefined && String(val).trim() !== '')
 .map(val => String(val).trim().toLowerCase());

// A conferência usa a mesma conta da lista de separação: só entra o que foi atendido
const montarConferencia = (ped) => {
  const conferencia = {};
  montarSeparacao(ped).itensParaSeparar.forEach((item, index) => {
    const chave = String(item.id || item.product_id || item.sku || `item_${index}`);
    conferencia[chave] = {
      chave: chave,
      nome: item.name,
      qtdPedida: item.qtdSeparar,
      qtdBipada: 0,
      imagem: item.image_url || item.imagem_url || item.foto_url || item.produto_imagem || item.imagem || null,
      codigosValidos: codigosDoItem(item)
    };
  });
  return conferencia;
};

// O leitor manda Enter no fim de cada bipe: com foco no botão, o próximo bipe confirmaria o aviso sozinho.
// Por isso o botão não recebe foco e ignora o teclado, só libera com o clique de quem leu.
function AvisoBloqueio({ aviso, onConfirmar }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md">
      <div role="alertdialog" aria-modal="true" className={`${VIDRO} !bg-white/95 dark:!bg-[#121214]/95 w-full max-w-md p-7 text-center ring-2 ring-rose-500/50`}>
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center mb-5">
          <OctagonAlert size={32} className="text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-[22px] leading-tight font-bold tracking-tight">{aviso.titulo}</h2>
        {aviso.produto && <p className="mt-3 text-lg font-semibold text-rose-600 dark:text-rose-400">{aviso.produto}</p>}
        {aviso.codigo && <p className="mt-1 text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400">Código: {aviso.codigo}</p>}
        <p className="mt-3 text-[15px] text-zinc-600 dark:text-zinc-300">{aviso.mensagem}</p>
        <button
          type="button"
          tabIndex={-1}
          onKeyDown={(e) => e.preventDefault()}
          onClick={onConfirmar}
          className={`${BOTAO_ROXO} w-full h-12 mt-6 text-[15px]`}
        >
          Entendi, continuar contagem
        </button>
      </div>
    </div>
  );
}

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
  const [conferindoPedido, setConferindoPedido] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [ordemBipagem, setOrdemBipagem] = useState([]);
  const [ultimoBipe, setUltimoBipe] = useState(null);
  const catalogoRef = useRef(null);

  const tocarSucesso = () => new Audio('/sucesso.mp3').play().catch(()=>{});
  const tocarErro = () => new Audio('/erro.mp3').play().catch(()=>{});

  // Trava a contagem até alguém confirmar
  const bloquearContagem = (dados) => {
    tocarErro();
    setCodigoBipado('');
    setQuantidadeManual(1);
    setAviso(dados);
  };

  const liberarContagem = () => {
    setAviso(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const buscarNomeDoProduto = async (codigo) => {
    const noPedido = pedido.line_items.find(item => codigosDoItem(item).includes(codigo));
    if (noPedido) return noPedido.name;

    if (!catalogoRef.current) {
      const tenantId = localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID;
      const res = await fetch(`${getHubUrl()}/api/hub/produtos/app`, { headers: { ...getHeaders(), 'x-tenant-id': tenantId } });
      const data = await res.json();
      if (data.success) catalogoRef.current = data.produtos;
    }
    return catalogoRef.current?.find(p => codigosDoItem(p).includes(codigo))?.nome || null;
  };

  const avisarProdutoForaDoPedido = (codigo) => {
    bloquearContagem({
      titulo: 'Produto não consta no pedido',
      codigo,
      mensagem: 'Retire este produto da caixa antes de continuar.'
    });
    buscarNomeDoProduto(codigo)
      .then(nome => { if (nome) setAviso(atual => atual?.codigo === codigo ? { ...atual, produto: nome } : atual); })
      .catch(() => {});
  };

  const buscarPedido = async () => {
    const tenantId = localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID;

    const res = await fetch(`${getHubUrl()}/api/hub/pedidos/omie`, {
      method: 'POST',
      headers: { ...getHeaders(), 'x-tenant-id': tenantId },
      body: JSON.stringify({ page: 1, limit: 100 })
    });
    const data = await res.json();

    if (!data.success || !data.pedidos) return null;
    return data.pedidos.find(p => String(p.pedido_id) === String(pedidoId) || String(p.id) === String(pedidoId)) || null;
  };

  const carregarPedido = async () => {
    if (!pedidoId) return;
    setLoading(true);
    try {
      const ped = await buscarPedido();

      if (ped) {
        setPedido(ped);
        const confInicial = montarConferencia(ped);

        const cacheKey = `@raizan:conferencia_${pedidoId}`;
        const savedProgress = localStorage.getItem(cacheKey);

        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            Object.keys(parsed).forEach(ch => {
              if (confInicial[ch]) confInicial[ch].qtdBipada = Math.min(parsed[ch].qtdBipada, confInicial[ch].qtdPedida);
            });
            setProgressoRecuperado(true);
            toast.success("Progresso recuperado.");
          } catch(e) {
            localStorage.removeItem(cacheKey);
          }
        }

        setConferencia(confInicial);
      } else {
        toast.error(`Pedido #${pedidoId} não encontrado.`);
      }
    } catch (error) {
      toast.error("Erro ao carregar o pedido.");
    }
    setLoading(false);
  };

  useEffect(() => { carregarPedido(); }, [pedidoId]);

  useEffect(() => {
    if (!loading && inputRef.current && !modalSairAberto && !modalDadosAberto && !modalAuditoriaAberto && !aviso) {
      inputRef.current.focus();
    }
  }, [loading, modalSairAberto, modalDadosAberto, modalAuditoriaAberto, aviso]);

  useEffect(() => {
    if (Object.keys(conferencia).length > 0) {
      const algumBipado = Object.values(conferencia).some(item => item.qtdBipada > 0);
      if (algumBipado) {
        localStorage.setItem(`@raizan:conferencia_${pedidoId}`, JSON.stringify(conferencia));
      }
    }
  }, [conferencia, pedidoId]);

  // Leva a tela até o produto bipado, esteja ele onde estiver na lista
  useEffect(() => {
    if (!ultimoBipe || !listaRef.current) return;
    const linha = listaRef.current.querySelector(`[data-chave="${CSS.escape(ultimoBipe.chave)}"]`);
    linha?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [ultimoBipe]);

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
    if (!codigoBipado.trim() || modalAuditoriaAberto || aviso) return;

    const itens = Object.values(conferencia);
    const contagemConcluida = itens.length > 0 && itens.every(item => item.qtdBipada === item.qtdPedida);

    if (contagemConcluida) {
      bloquearContagem({
        titulo: 'Contagem concluída',
        mensagem: 'Todos os produtos já foram conferidos. Finalize a embalagem, sem colocar mais nada na caixa.'
      });
      return;
    }

    const codigoLimpo = codigoBipado.trim().toLowerCase();
    const chaveEncontrada = Object.keys(conferencia).find(chave =>
      conferencia[chave]?.codigosValidos?.includes(codigoLimpo)
    );

    if (!chaveEncontrada) {
      avisarProdutoForaDoPedido(codigoLimpo);
      return;
    }

    const item = conferencia[chaveEncontrada];
    const faltam = item.qtdPedida - item.qtdBipada;
    const qtdAdicionar = Math.max(1, Math.floor(Number(quantidadeManual)) || 1);

    if (faltam === 0) {
      bloquearContagem({
        titulo: 'Produto já concluído',
        produto: item.nome,
        mensagem: `Este produto já tem ${item.qtdPedida} de ${item.qtdPedida} unidades bipadas. Retire a unidade extra da caixa.`
      });
      return;
    }

    if (qtdAdicionar > faltam) {
      bloquearContagem({
        titulo: 'Quantidade acima do pedido',
        produto: item.nome,
        mensagem: `Você tentou bipar ${qtdAdicionar}, mas faltam apenas ${faltam}. Confira as unidades e bipe novamente.`
      });
      return;
    }

    setConferencia(prev => ({
      ...prev,
      [chaveEncontrada]: { ...item, qtdBipada: item.qtdBipada + qtdAdicionar }
    }));
    setOrdemBipagem(prev => prev.includes(chaveEncontrada) ? prev : [...prev, chaveEncontrada]);
    setUltimoBipe({ chave: chaveEncontrada, quando: Date.now() });
    tocarSucesso();
    setQuantidadeManual(1);
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

  // O corte pode chegar pelo webhook com a caixa já pronta: confere de novo antes de fechar
  const abrirFinalizacao = async () => {
    setConferindoPedido(true);
    try {
      const atual = await buscarPedido();
      if (!atual) {
        toast.error("Não foi possível confirmar o pedido. Tente novamente.");
        return;
      }

      const atualizada = montarConferencia(atual);
      const chaves = new Set([...Object.keys(atualizada), ...Object.keys(conferencia)]);
      const mudou = [...chaves].some(ch => atualizada[ch]?.qtdPedida !== conferencia[ch]?.qtdPedida);

      setPedido(atual);
      if (!mudou) {
        setModalDadosAberto(true);
        return;
      }

      Object.keys(atualizada).forEach(ch => {
        if (conferencia[ch]) atualizada[ch].qtdBipada = Math.min(conferencia[ch].qtdBipada, atualizada[ch].qtdPedida);
      });
      setConferencia(atualizada);
      bloquearContagem({
        titulo: 'Pedido alterado no ERP',
        mensagem: 'As quantidades deste pedido mudaram. Confira a caixa novamente antes de finalizar.'
      });
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setConferindoPedido(false);
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
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !modalSairAberto && !modalDadosAberto && !modalAuditoriaAberto && !aviso) {
      inputRef.current?.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f5f5f7] dark:bg-[#000000]">
        <Loader2 className="animate-spin text-purple-600 mb-3" size={32} />
        <p className="text-zinc-500 font-medium text-sm">Carregando itens...</p>
      </div>
    );
  }

  if (!pedido) return <div className="flex items-center justify-center h-screen bg-[#f5f5f7] dark:bg-[#000000] text-zinc-500 dark:text-zinc-400">Erro ao carregar a mesa.</div>;

  const itensArray = Object.values(conferencia);
  const totalItens = itensArray.reduce((acc, item) => acc + item.qtdPedida, 0);
  const totalBipados = itensArray.reduce((acc, item) => acc + item.qtdBipada, 0);
  const progressoPercent = totalItens > 0 ? (totalBipados / totalItens) * 100 : 0;

  const pedidoSemItens = totalItens === 0;
  const todosBipados = !pedidoSemItens && totalBipados === totalItens;
  const nenhumBipado = totalBipados === 0;

  // A lista principal SEMPRE esconde itens zerados para manter a contagem cega blindada
  // Cada produto entra no fim da lista na ordem em que foi bipado pela primeira vez
  const itensVisiveis = itensArray
    .filter(item => item.qtdBipada > 0)
    .sort((a, b) => ordemBipagem.indexOf(a.chave) - ordemBipagem.indexOf(b.chave));
  const itensFaltantes = itensArray.filter(item => item.qtdBipada < item.qtdPedida);

  return (
    <div className="relative h-screen bg-[#f5f5f7] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased overflow-hidden" onClick={handleFundoClick}>
      <LuzesDeFundo />

      {aviso && <AvisoBloqueio aviso={aviso} onConfirmar={liberarContagem} />}

      <ModalConfirmacaoSair isOpen={modalSairAberto} onConfirm={() => window.close()} onCancel={() => { setModalSairAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }} />
      <ManipulaDados isOpen={modalDadosAberto} onClose={() => { setModalDadosAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }} onConfirm={finalizarExpedicao} pedido={pedido} />

      {/* 🟢 MODAL DE AUDITORIA */}
      {modalAuditoriaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-md">
          <div className={`${VIDRO} !bg-white/95 dark:!bg-[#121214]/95 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden`}>

            <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.07] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Auditoria de faltantes</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{itensFaltantes.length} {itensFaltantes.length === 1 ? 'produto pendente' : 'produtos pendentes'} nesta caixa</p>
                </div>
              </div>
              <button onClick={() => { setModalAuditoriaAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }} className="w-10 h-10 rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] dark:hover:bg-white/[0.13] flex items-center justify-center text-zinc-500 transition-all duration-300 active:scale-90">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {itensFaltantes.map((item) => (
                <div key={item.chave} className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                    {item.imagem ? <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" /> : <Package size={20} className="text-zinc-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.nome}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono uppercase">{item.codigosValidos[0] || 'Sem código'}</p>
                  </div>
                  <div className="text-right pr-1">
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Falta bipar</p>
                    <p className="text-2xl font-bold tabular-nums">{item.qtdPedida - item.qtdBipada}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.07] flex justify-end">
              <button
                onClick={() => { setModalAuditoriaAberto(false); setTimeout(() => inputRef.current?.focus(), 100); }}
                className={`${BOTAO_ROXO} h-11 px-6 text-sm`}
              >
                <ScanBarcode size={18} /> Voltar para a contagem
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CABEÇALHO FIXO NATIVO */}
      <div className="relative shrink-0 z-30 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-[28px] leading-tight font-bold tracking-tight tabular-nums flex items-center gap-2.5">
                Pedido #{pedido.pedido_id}
                {progressoRecuperado && (
                  <span className="h-6 px-2.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[11px] font-semibold inline-flex items-center">Recuperado</span>
                )}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{pedido.billing?.first_name}</p>
            </div>

            <form onSubmit={processarBipagem} onClick={(e) => e.stopPropagation()} className="flex w-full md:w-auto gap-2">
              <div className={`${VIDRO} !rounded-full h-12 w-[92px] flex items-center pl-4 pr-2 gap-1 focus-within:ring-2 focus-within:ring-purple-500/40 transition-shadow duration-300`}>
                <span className="text-[11px] font-semibold text-zinc-400">Qtd</span>
                <input
                  type="number"
                  min="1"
                  aria-label="Quantidade"
                  value={quantidadeManual}
                  onChange={(e) => setQuantidadeManual(e.target.value)}
                  disabled={modalAuditoriaAberto || !!aviso || todosBipados}
                  className="w-full min-w-0 bg-transparent text-base font-bold text-center tabular-nums outline-none disabled:opacity-50"
                />
              </div>

              <div className={`${VIDRO} !rounded-full h-12 flex-1 md:w-80 flex items-center px-4 gap-2.5 focus-within:ring-2 focus-within:ring-purple-500/40 transition-shadow duration-300`}>
                <ScanBarcode size={20} className={`shrink-0 ${nenhumBipado && !modalAuditoriaAberto ? 'text-purple-500 animate-pulse' : 'text-zinc-400'}`} />
                <input
                  ref={inputRef}
                  type="text"
                  value={codigoBipado}
                  onChange={(e) => setCodigoBipado(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') processarBipagem(e); }}
                  disabled={modalAuditoriaAberto || !!aviso}
                  placeholder={modalAuditoriaAberto ? "Auditoria em andamento..." : todosBipados ? "Contagem concluída" : "Aguardando leitor..."}
                  className="w-full min-w-0 bg-transparent text-base font-mono font-semibold uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:font-medium placeholder:text-zinc-400 disabled:opacity-50"
                  autoFocus
                  autoComplete="off"
                  onBlur={() => { if (!modalSairAberto && !modalDadosAberto && !modalAuditoriaAberto && !aviso) setTimeout(() => inputRef.current?.focus(), 100); }}
                />
              </div>
              <button type="submit" className="hidden">Bipar</button>
            </form>
          </div>

          <div className={`${VIDRO} !rounded-3xl px-5 py-4`}>
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="text-sm font-semibold">Progresso da caixa</span>
              <span className={`text-sm font-bold tabular-nums ${todosBipados ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>{totalBipados} de {totalItens} un</span>
            </div>
            <div className="bg-black/[0.06] dark:bg-white/[0.08] rounded-full h-2 w-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ease-out rounded-full ${todosBipados ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                style={{ width: `${progressoPercent}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* MIOLO ROLÁVEL NATIVO */}
      <div ref={listaRef} className="relative flex-1 overflow-y-auto px-4 sm:px-6 py-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full">
          {pedidoSemItens ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center mb-6">
                <Package size={38} className="text-zinc-400" strokeWidth={1.6} />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1.5">Nada para separar</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">Este pedido não tem itens para conferir.</p>
            </div>
          ) : nenhumBipado ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                <ScanBarcode size={38} className="text-purple-600 dark:text-purple-400" strokeWidth={1.6} />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1.5">Contagem cega ativada</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                Inicie a bipagem ou altere a quantidade manual acima. A lista será revelada gradualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {itensVisiveis.map((item) => {
                const finalizado = item.qtdBipada === item.qtdPedida;
                const perctItem = (item.qtdBipada / item.qtdPedida) * 100;

                return (
                  <div key={item.chave} data-chave={item.chave} className={`${VIDRO} !rounded-3xl p-3.5 flex items-center gap-4 overflow-hidden scroll-my-4 transition-shadow duration-300 ${ultimoBipe?.chave === item.chave ? 'ring-2 ring-purple-500/60' : finalizado ? 'ring-1 ring-emerald-500/30' : ''}`}>
                    <div className="w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                      {item.imagem ? (
                        <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={22} className="text-zinc-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] truncate">{item.nome}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono uppercase">{item.codigosValidos[0] || 'Sem código'}</p>
                    </div>

                    <div className="flex items-baseline gap-0.5 tabular-nums">
                      <span className={`text-[28px] font-bold tracking-tight ${finalizado ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{item.qtdBipada}</span>
                      <span className="text-sm font-semibold text-zinc-400">/{item.qtdPedida}</span>
                    </div>

                    <CheckCircle2 size={26} strokeWidth={2} className={`shrink-0 transition-all duration-300 ${finalizado ? 'text-emerald-500 scale-110' : 'text-zinc-300 dark:text-zinc-700'}`} />

                    <div className="absolute inset-x-0 bottom-0 h-1 bg-black/[0.06] dark:bg-white/[0.08]">
                      <div className={`h-full transition-all duration-500 ${finalizado ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${perctItem}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RODAPÉ FIXO NATIVO */}
      <div className="relative shrink-0 z-40 px-4 sm:px-6 pb-4 sm:pb-5 pt-1">
        <div className={`${VIDRO} !rounded-full max-w-4xl mx-auto w-full p-2 flex justify-between items-center`}>
          <button onClick={handleSair} className={`${BOTAO_VIDRO} h-11 px-5 text-sm`}>
            <ArrowLeft size={18} /> Sair
          </button>

          {todosBipados ? (
            <button onClick={abrirFinalizacao} disabled={conferindoPedido} className={`${BOTAO_VERDE} h-11 px-6 text-sm disabled:opacity-70`}>
              {conferindoPedido ? <Loader2 size={18} className="animate-spin" /> : <PackageCheck size={18} />}
              {conferindoPedido ? 'Conferindo pedido...' : 'Finalizar embalagem'}
            </button>
          ) : !pedidoSemItens && (
            <button onClick={() => { setModalAuditoriaAberto(true); inputRef.current?.blur(); }} className={`${BOTAO_VIDRO} h-11 px-5 text-sm`}>
              <Search size={18} /> Auditar faltantes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutScanner() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f7] dark:bg-[#000000]"><Loader2 className="animate-spin text-purple-600" size={32} /></div>}>
      <ScannerMesa />
    </Suspense>
  );
}