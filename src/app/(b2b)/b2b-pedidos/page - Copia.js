"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Search, ShoppingCart, CheckCircle2, AlertCircle, Package, Barcode, Loader2, DollarSign, Zap, ShoppingBag, X, FileText, QrCode, Building2, Truck, MapPin, CreditCard, CalendarDays } from "lucide-react";
import { getApiUrl } from "@/components/utils/api";
import toast from 'react-hot-toast';

// ==========================================
// CONFIGURAÇÕES DO MOTOR DE IMAGENS 
// ==========================================
const BASE_URL_IMAGENS = "https://portalseller.com.br/img_pro/";

const getProductImageUrl = (ean) => {
  if (ean && ean.trim() !== "") {
    return `${BASE_URL_IMAGENS}${ean}.webp`;
  }
  return "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto";
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// ==========================================
// COMPONENTE: MODAL DE CHECKOUT B2B
// ==========================================
function ModalCheckout({ isOpen, onClose, carrinho, produtos, tabelaAtiva, onFinalizarPedido }) {
  const [metodoPagamento, setMetodoPagamento] = useState('faturado');
  const [prazoBoleto, setPrazoBoleto] = useState('30'); 
  const [metodoEnvio, setMetodoEnvio] = useState('transportadora');
  const [isProcessando, setIsProcessando] = useState(false);

  if (!isOpen) return null;

  const itensComprados = Object.values(carrinho).map(p => {
  const preco = p[tabelaAtiva] !== undefined ? p[tabelaAtiva] : p.PDPRECO;

  return {
    ...p,
    precoUsado: preco,
    totalItem: preco * p.qtd
  };
});

  const subtotal = itensComprados.reduce((acc, item) => acc + item.totalItem, 0);

  const handleConfirmar = () => {
    setIsProcessando(true);
    setTimeout(() => {
      setIsProcessando(false);
      onFinalizarPedido({ 
        itens: itensComprados, 
        subtotal, 
        metodoPagamento, 
        prazoBoleto: metodoPagamento === 'faturado' ? prazoBoleto : null,
        metodoEnvio 
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm transition-all" onClick={onClose}>
      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* CABEÇALHO DO MODAL - VERDE */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <h2 className="text-base sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="text-emerald-400" /> Finalizar Pedido
          </h2>
          <button onClick={onClose} disabled={isProcessando} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
          
          <div className="space-y-6">
            
            {/* Bloco: Pagamento */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-2">Forma de Pagamento</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setMetodoPagamento('faturado')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'faturado' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                  <FileText size={20} className="mb-1.5" />
                  <span className="text-xs font-semibold">Boleto</span>
                </button>
                <button onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'pix' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                  <QrCode size={20} className="mb-1.5" />
                  <span className="text-xs font-semibold">PIX (API)</span>
                </button>
                <button onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${metodoPagamento === 'cartao' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                  <CreditCard size={20} className="mb-1.5" />
                  <span className="text-xs font-semibold">Cartão</span>
                </button>
              </div>

              <div className="pt-2">
                {metodoPagamento === 'faturado' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs text-zinc-500 font-medium mb-2 block">Prazos liberados para seu CNPJ:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      
                      {['30', '30/60', '30/60/90', '30/60/90/120'].map(prazo => (
                        <button 
                          key={prazo}
                          onClick={() => setPrazoBoleto(prazo)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${prazoBoleto === prazo ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}
                        >
                          <CalendarDays size={16} className={prazoBoleto === prazo ? 'text-black' : 'text-zinc-500'} />
                          {prazo} Dias
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {metodoPagamento === 'pix' && (
                  <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400 text-sm flex items-start gap-2">
                    <QrCode size={18} className="shrink-0 mt-0.5" />
                    <p>O QR Code do Mercado Pago será gerado na próxima tela após a confirmação do pedido.</p>
                  </div>
                )}

                {metodoPagamento === 'cartao' && (
                  <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm flex items-start gap-2">
                    <CreditCard size={18} className="shrink-0 mt-0.5" />
                    <p>Um link de pagamento seguro será enviado para o e-mail e WhatsApp cadastrados.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco: Envio */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-2">Método de Envio</h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${metodoEnvio === 'transportadora' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                  <input type="radio" name="envio" checked={metodoEnvio === 'transportadora'} onChange={() => setMetodoEnvio('transportadora')} className="hidden" />
                  <div className={`p-2 rounded-lg ${metodoEnvio === 'transportadora' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}><Truck size={18} /></div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${metodoEnvio === 'transportadora' ? 'text-emerald-400' : 'text-zinc-300'}`}>Transportadora Parceira</p>
                    <p className="text-xs text-zinc-500">Frete FOB (A ser calculado pela logística)</p>
                  </div>
                </label>
                
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${metodoEnvio === 'retirada' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                  <input type="radio" name="envio" checked={metodoEnvio === 'retirada'} onChange={() => setMetodoEnvio('retirada')} className="hidden" />
                  <div className={`p-2 rounded-lg ${metodoEnvio === 'retirada' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}><MapPin size={18} /></div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${metodoEnvio === 'retirada' ? 'text-emerald-400' : 'text-zinc-300'}`}>Retirada no CD Rafany</p>
                    <p className="text-xs text-zinc-500">Isento de frete. Agendamento necessário.</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          <div className="flex flex-col bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden">
            <h3 className="text-sm font-bold text-zinc-100 p-4 border-b border-zinc-800 bg-zinc-900/80">
              Resumo dos Itens ({itensComprados.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <ul className="divide-y divide-zinc-800/50 px-2">
                {itensComprados.map(item => (
                  <li key={item.PDCODPRO} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-200 line-clamp-1">{item.PDNOME}</p>
                      <p className="text-xs text-zinc-500">SKU: {item.PDCODPRO} | {item.qtd}x {formatarMoeda(item.precoUsado)}</p>
                    </div>
                    <div className="text-sm font-bold text-zinc-100 whitespace-nowrap">
                      {formatarMoeda(item.totalItem)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 border-t border-zinc-800 bg-zinc-900/80 space-y-4">
              <div className="flex justify-between items-center text-zinc-400 text-sm">
                <span>Subtotal Itens:</span>
                <span>{formatarMoeda(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 text-sm pb-4 border-b border-zinc-800/60">
                <span>Estimativa de Frete:</span>
                <span className="italic">A calcular</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-zinc-100">Total Previsto:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 whitespace-nowrap">{formatarMoeda(subtotal)}</span>
              </div>
              
              <button 
                onClick={handleConfirmar}
                disabled={isProcessando}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isProcessando ? <><Loader2 size={18} className="animate-spin" /> Gerando Pedido na Rafany...</> : 'Confirmar e Enviar Pedido'}
              </button>
            </div>
          </div>

        </div>
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
      <div className="flex items-center justify-between bg-zinc-950 border border-emerald-500/30 rounded-lg overflow-hidden h-9">
        <button onClick={() => onQtdChange(id, Math.max(0, qtd - 1))} className="w-8 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">-</button>
        <span className="font-bold text-emerald-400 text-sm w-6 text-center">{qtd}</span>
        <button onClick={() => onQtdChange(id, qtd + 1)} className="w-8 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">+</button>
      </div>
    );
  }
  return (
    <button 
      onClick={() => onQtdChange(id, 1)}
      className="w-full h-9 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all text-xs"
    >
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

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      // O Lojista só manda os filtros! Segurança máxima.
      const payload = { search, hideBlocked: true, hideSamples: true, page: 1, limit: 50 };
      
      const response = await fetch(`${getApiUrl()}/api/produtos`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (data.success) {
        const produtosFiltrados = data.produtos.filter(p => p.PDSTATUS !== 6 && p.PDSTATUS !== 8);
        setProdutos(produtosFiltrados); 
        // Pega a tabela de preço oficial que o motor informou
        if (data.tabelaPrecoBase) setTabelaAtiva(data.tabelaPrecoBase);
      } else {
        toast.error(data.message || "Erro ao conectar com o banco de dados.");
      }
    } catch (error) { 
      console.error(error);
      toast.error("Erro ao carregar catálogo.");
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarProdutos();
  }, []); 

  const handleSearch = (e) => {
    e.preventDefault();
    carregarProdutos();
  };

  const handleQuantidade = (produto, qtd) => {
  setCarrinho(prev => {
    const novo = { ...prev };

    if (qtd === 0) {
      delete novo[produto.PDCODPRO];
    } else {
      novo[produto.PDCODPRO] = {
        ...produto,
        qtd
      };
    }

    return novo;
  });
};

  const handleFinalizarPedido = async (dadosDoPedido) => {
    // 1. LÊ DIRETO DO COFRE NA HORA DO CLIQUE (À prova de falhas)
    const savedUser = localStorage.getItem("raizan_user");
    if (!savedUser) {
      toast.error("Sessão expirada. Faça login novamente.");
      window.location.href = "/login-b2b";
      return;
    }

    const userLogado = JSON.parse(savedUser);

    // 2. MONTA O PACOTE COM O E-MAIL GARANTIDO
    const payloadCompleto = {
      ...dadosDoPedido, 
      cliente: {
        codigo: userLogado.codigo,
        razao: userLogado.nome,
        cnpj: userLogado.cnpj,
        email: userLogado.email, // Agora o e-mail vai preenchido com 100% de certeza!
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
        toast.success(`Pedido #${data.pedidoId} gerado com sucesso!`, { id: toastId });
        setIsCheckoutOpen(false);
        setCarrinho({}); 
      } else {
        toast.error("Erro ao gerar pedido: " + data.message, { id: toastId });
      }
    } catch (error) {
      toast.error("Erro de comunicação com o servidor.", { id: toastId });
    }
  };

  const getEstiloTabelaPreco = (tabela) => {
    switch(tabela) {
      case 'PDPRECO2': return { cor: 'text-amber-400' };
      case 'PDPRECO3': return { cor: 'text-teal-400' };
      default: return { cor: 'text-emerald-400' };
    }
  };
  const infoTabela = getEstiloTabelaPreco(tabelaAtiva);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 lg:p-8 pb-36 lg:pb-32">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="bg-zinc-900/40 p-4 sm:p-6 rounded-2xl border border-zinc-800/60 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-zinc-100 flex items-center gap-2 sm:gap-3">
                  <Package className="text-emerald-400" /> Catálogo B2B Rafany
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">Reponha o estoque da sua loja com a Rafany Distribuidora.</p>
              </div>

              <form onSubmit={handleSearch} className="relative w-full lg:w-96">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, EAN ou código..." 
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 pl-10 pr-4 py-2.5 rounded-xl text-sm md:text-base outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600"
                />
              </form>
            </div>

            <div className="border border-zinc-800/60 bg-[#0c0c0e] rounded-2xl overflow-hidden relative min-h-[400px]">
              {loading && (
                <div className="absolute inset-0 z-10 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs sm:text-sm text-left">
                  <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800/60">
                    <tr>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 w-16">Imagem</th> 
                      <th className="px-3 sm:px-5 py-3 sm:py-4 w-[40%]">Produto</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 w-32">Marca</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 text-center">Estoque</th>
                      <th className={`px-3 sm:px-5 py-3 sm:py-4 text-right font-bold ${infoTabela.cor}`}>Preço Unitário</th>
                      <th className="px-3 sm:px-5 py-3 sm:py-4 text-center w-40 rounded-r-2xl">Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    
                    {produtos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="6" className="px-3 sm:px-5 py-12 text-center text-zinc-500">
                          Nenhum produto encontrado. Verifique sua busca.
                        </td>
                      </tr>
                    )}

                    {produtos.map((produto) => {
                      const qtdNoCarrinho = carrinho[produto.PDCODPRO]?.qtd || 0;
                      const imageUrl = getProductImageUrl(produto.PDCODBARRA);
                      const precoExibicao = produto[tabelaAtiva] !== undefined ? produto[tabelaAtiva] : produto.PDPRECO;
                      const temEstoque = produto.PDSALDO > 0;

                      return (
                        <tr key={produto.PDCODPRO} className={`transition-colors group ${!temEstoque ? 'opacity-50 grayscale' : 'hover:bg-zinc-800/20'}`}>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-emerald-500/50 transition-all">
                              <img 
                                src={imageUrl} 
                                alt={produto.PDNOME} 
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.src = "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto"; }}
                              />
                            </div>
                          </td>

                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-2 text-xs sm:text-sm md:text-base">{produto.PDNOME}</h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] sm:text-xs text-zinc-500 font-mono">
                              <Barcode size={13} className="text-zinc-600" />
                              {produto.PDCODBARRA || "SEM EAN"}
                              <span className="text-zinc-700 mx-1">|</span>
                              <span className="text-zinc-400">SKU: {produto.PDCODPRO}</span>
                            </div>
                          </td>

                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-zinc-400">{produto.PDMARCA || "-"}</td>

                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                            {temEstoque ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                                <CheckCircle2 size={13}/> Disp: {produto.PDSALDO}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20">
                                <AlertCircle size={13}/> Sem Estoque
                              </div>
                            )}
                          </td>

                          <td className={`px-3 sm:px-5 py-3 sm:py-4 text-right text-sm sm:text-base font-bold whitespace-nowrap ${infoTabela.cor}`}>
                            {formatarMoeda(precoExibicao)}
                          </td>

                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            {temEstoque ? (
                              <SeletorQuantidade 
                                id={produto.PDCODPRO} 
                                qtd={qtdNoCarrinho} 
                                onQtdChange={(id, qtd) => handleQuantidade(produto, qtd)} 
                              />
                            ) : (
                              <span className="text-xs text-zinc-600 font-medium block text-center">Indisponível</span>
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

        {/* BARRA INFERIOR DO CARRINHO */}
        {Object.keys(carrinho).length > 0 && (
          <div className="fixed bottom-0 left-0 md:left-[260px] right-0 bg-[#0c0c0e]/90 backdrop-blur-md border-t border-emerald-500/30 p-3 sm:p-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between animate-in slide-in-from-bottom-10 z-30 shadow-2xl shadow-emerald-950/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2.5 rounded-2xl shadow-lg">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-zinc-100 leading-tight">
                  {Object.values(carrinho).reduce((a, b) => a + b.qtd, 0)} Itens no Pedido
                </p>
                <p className="text-xs sm:text-sm text-zinc-400">Revise os itens e feche a cotação.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 sm:px-8 py-3 rounded-xl font-bold text-sm sm:text-base shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2"
            >
              Avançar para Checkout
            </button>
          </div>
        )}

      </div>

      <ModalCheckout 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        carrinho={carrinho}
        produtos={produtos}
        tabelaAtiva={tabelaAtiva}
        onFinalizarPedido={handleFinalizarPedido}
      />

    </div>
  );
}