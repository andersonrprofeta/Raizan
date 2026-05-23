"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, Save, Plus, Minus, Trash2, Package, Loader2, AlertTriangle, MessageSquare, Search, X, Truck, Percent, Receipt, Database, Cloud } from "lucide-react";
import Link from "next/link";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

function EditarPedidoConteudo() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); 

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [itens, setItens] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [gerarCredito, setGerarCredito] = useState(true);

  // 🟢 ESTADOS FINANCEIROS
  const [frete, setFrete] = useState(0);
  const [desconto, setDesconto] = useState(0);

  // 🟢 ESTADOS DO MODAL DE BUSCA PREMIUM
  const [modalBusca, setModalBusca] = useState(false);
  const [catalogo, setCatalogo] = useState([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [fonteBusca, setFonteBusca] = useState("oracle"); // 'oracle' ou 'hub'

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

  useEffect(() => {
    if (id) carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      toast.error("Sessão expirada.");
      return;
    }

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/pedidos/${id}`, { 
        headers: { ...getHeaders(), "x-tenant-id": tenantId } 
      });
      const data = await res.json();
      if (data.success) {
        setPedido(data.pedido);
        setItens(data.pedido.line_items || []);
        setFrete(parseFloat(data.pedido.valor_frete) || 0);
        setDesconto(parseFloat(data.pedido.desconto) || 0);
      } else {
        toast.error(data.message || "Pedido não encontrado.");
      }
    } catch (e) {
      toast.error("Erro ao carregar detalhes do pedido.");
    } finally {
      setLoading(false);
    }
  };

  const buscarProdutos = async (e) => {
    e.preventDefault(); 
    if (termoBusca.length < 2) {
      setCatalogo([]);
      return;
    }
    
    setCarregandoBusca(true);
    const tenantId = pegarCnpjLogado();
    
    try {
      if (fonteBusca === "oracle") {
        const payload = { search: termoBusca, hideBlocked: true, hideSamples: true, page: 1, limit: 30 };
        const res = await fetch(`${getApiUrl()}/api/produtos`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success && data.produtos) {
          const produtosNormalizados = data.produtos.map(p => ({
            id: String(p.PDCODPRO),
            nome: p.PDNOME,
            preco: parseFloat(p.PDPRECO || 0),
            sku: String(p.PDCODPRO),
            origem: "Oracle ERP"
          }));
          setCatalogo(produtosNormalizados);
        } else {
          setCatalogo([]);
        }

      } else {
        const res = await fetch(`https://api.raizan.com.br/api/hub/produtos?busca=${termoBusca}`, { 
          headers: { "x-tenant-id": tenantId } 
        });
        const data = await res.json();
        
        if (data.success) {
          const termoLower = termoBusca.toLowerCase();
          const filtrados = data.produtos.filter(p => 
            p.nome?.toLowerCase().includes(termoLower) || 
            p.sku?.toLowerCase().includes(termoLower)
          );
          
          const produtosNormalizados = filtrados.map(p => ({
            id: String(p.id),
            nome: p.nome,
            preco: parseFloat(p.preco_venda || 0),
            sku: p.sku || "N/A",
            origem: "Nuvem Raizan"
          }));
          setCatalogo(produtosNormalizados);
        } else {
          setCatalogo([]);
        }
      }

    } catch (e) { 
      toast.error(`Erro ao buscar no ${fonteBusca === 'oracle' ? 'Oracle' : 'Hub'}.`); 
    } finally {
      setCarregandoBusca(false);
    }
  };

  const adicionarItemAoPedido = (prod) => {
    const novoItem = {
      id: prod.id,
      name: prod.nome,
      quantity: 1,
      price: prod.preco,
      sku: prod.sku
    };
    
    setItens([...itens, novoItem]);
    setModalBusca(false);
    setCatalogo([]);
    setTermoBusca("");
    toast.success("Produto adicionado ao pedido!", { icon: '📦' });
  };

  const handleQtdChange = (index, novaQtd) => {
    const novosItens = [...itens];
    novosItens[index].quantity = Math.max(0, novaQtd); 
    setItens(novosItens);
  };

  // 🟢 FUNÇÃO MÁGICA: Remove o item do Array e a matemática já faz o resto!
  const removerItem = (indexParaRemover) => {
    setItens(itens.filter((_, index) => index !== indexParaRemover));
    toast.success("Item removido!", { icon: '🗑️' });
  };

  const subtotalItens = itens.reduce((acc, item) => acc + (parseFloat(item.price || 0) * (item.quantity || 0)), 0);
  const totalOriginal = parseFloat(pedido?.total || pedido?.subtotal || 0);
  const novoTotal = Math.max(0, subtotalItens + parseFloat(frete || 0) - parseFloat(desconto || 0));
  const diferenca = totalOriginal - novoTotal;

  const salvarAlteracoes = async () => {
    const tenantId = pegarCnpjLogado();
    if (diferenca !== 0 && motivo.trim() === "") {
      toast.error("Por favor, informe o motivo da edição.");
      return;
    }

    setSalvando(true);
    const pedidoJaPago = ['pago', 'processing', 'completed'].includes(pedido?.status);

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/pedidos/editar`, {
        method: 'POST',
        headers: { ...getHeaders(), "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          pedidoId: id,
          novosItens: itens,
          novoSubtotal: novoTotal, 
          valorFrete: frete,
          valorDesconto: desconto,
          motivo: motivo, 
          gerarCredito: pedidoJaPago && diferenca > 0 ? gerarCredito : false,
          valorCredito: diferenca
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pedido atualizado com os novos valores!");
        window.location.href = "/pedidos"; 
      } else {
        toast.error(data.message || "Falha ao salvar edições.");
      }
    } catch (e) {
      toast.error("Falha ao salvar edições.");
    } finally {
      setSalvando(false);
    }
  };

  const formatMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  if (loading) return <div className="h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center transition-colors duration-300"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* CABEÇALHO REFINADO */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-zinc-900/40 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 gap-4 shadow-sm dark:shadow-none transition-colors">
              <div>
                <Link href="/pedidos" className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-2 text-sm mb-1.5 transition-all w-fit">
                  <ArrowLeft size={16} /> Voltar para Gestão
                </Link>
                <h1 className="text-xl sm:text-2xl font-black flex items-center gap-3 text-zinc-900 dark:text-zinc-100 transition-colors tracking-tight">
                  <Receipt className="text-emerald-500" /> Ajustar Pedido #{id}
                </h1>
              </div>

              {/* BOTÕES */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button 
                  onClick={() => setModalBusca(true)}
                  className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Search size={16} /> Inserir Produto
                </button>
                <button 
                  onClick={salvarAlteracoes}
                  disabled={salvando}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Pedido
                </button>
              </div>
            </div>

            {/* ALERTA INTELIGENTE E CAMPO DE MOTIVO */}
            {diferenca > 0 && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-xl flex flex-col gap-4 transition-colors animate-in fade-in">
                <div className="flex items-start gap-4 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={24} className="shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-base mb-1">
                      Ajuste de Valor: {formatMoeda(diferenca)} a menos
                    </h4>
                    {['pago', 'processing', 'completed'].includes(pedido?.status) ? (
                       <p className="text-sm text-amber-700 dark:text-amber-500/80 transition-colors">O cliente <b>já realizou o pagamento</b>. Escolha como tratar a diferença financeira:</p>
                    ) : (
                       <p className="text-sm text-emerald-700 dark:text-emerald-500 font-medium transition-colors">O cliente <b>ainda não pagou</b>. O valor da cobrança será atualizado automaticamente.</p>
                    )}
                  </div>
                </div>

                {['pago', 'processing', 'completed'].includes(pedido?.status) && (
                   <label className="flex items-center gap-3 bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-amber-300 dark:border-amber-500/20 cursor-pointer w-fit transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/80 shadow-sm dark:shadow-none">
                     <input type="checkbox" checked={gerarCredito} onChange={(e) => setGerarCredito(e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 bg-zinc-100 cursor-pointer" />
                     <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 transition-colors">
                       Gerar {formatMoeda(diferenca)} em créditos na Carteira do Lojista
                     </span>
                   </label>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm dark:shadow-none transition-colors">
              <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3 transition-colors">
                 <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                 Motivo da Edição <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Furo de estoque. Frete orçado via transportadora XYZ. Combinado via WhatsApp."
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-20 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
            </div>

            {/* TABELA DE PRODUTOS E FINANCEIRO */}
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md dark:shadow-xl transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
                    <tr>
                      <th className="px-6 py-4">Produto</th>
                      <th className="px-6 py-4 text-center">Preço Unit.</th>
                      <th className="px-6 py-4 text-center">Qtd Atual</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 transition-colors">
                    {itens.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                          Todos os itens foram removidos. Adicione novos produtos ou cancele o pedido.
                        </td>
                      </tr>
                    )}
                    {itens.map((item, index) => {
                      const preco = parseFloat(item.price || 0);
                      const quantidade = item.quantity || 0;

                      return (
                      <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors group">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200 transition-colors">{item.name}</td>
                        <td className="px-6 py-4 text-center text-zinc-500 dark:text-zinc-400 transition-colors">{formatMoeda(preco)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleQtdChange(index, quantidade - 1)} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors"><Minus size={14}/></button>
                            <span className="w-8 text-center font-bold text-emerald-600 dark:text-emerald-400">{quantidade}</span>
                            <button onClick={() => handleQtdChange(index, quantidade + 1)} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors"><Plus size={14}/></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 transition-colors">
                              {formatMoeda(preco * quantidade)}
                            </span>
                            {/* 🟢 BOTÃO DE REMOVER LINDÃO AQUI */}
                            <button 
                              onClick={() => removerItem(index)} 
                              className="text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={12} /> Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RODAPÉ COM FRETE E DESCONTO */}
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-end gap-3 transition-colors">
                 
                 <div className="w-full sm:w-72 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-zinc-500 dark:text-zinc-400">Subtotal dos Itens:</span>
                     <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatMoeda(subtotalItens)}</span>
                   </div>

                   <div className="flex justify-between items-center text-sm gap-4">
                     <label className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Truck size={14}/> Frete Orçado:</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-sm">R$</span>
                        <input 
                          type="number" step="0.01" min="0" value={frete} onChange={(e) => setFrete(e.target.value)}
                          className="w-28 text-right bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 font-medium"
                        />
                     </div>
                   </div>

                   <div className="flex justify-between items-center text-sm gap-4">
                     <label className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Percent size={14}/> Desconto (-):</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-sm">R$</span>
                        <input 
                          type="number" step="0.01" min="0" value={desconto} onChange={(e) => setDesconto(e.target.value)}
                          className="w-28 text-right bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 outline-none focus:border-rose-500 text-rose-500 font-medium"
                        />
                     </div>
                   </div>

                   <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-end">
                     <div className="flex flex-col">
                       <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Total Final</span>
                       <span className="text-xs text-zinc-400 line-through">Era {formatMoeda(totalOriginal)}</span>
                     </div>
                     <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                       {formatMoeda(novoTotal)}
                     </span>
                   </div>
                 </div>

              </div>
            </div>

          </div>

          {/* 🟢 MODAL DE BUSCA LIGADO AO ORACLE LOCAL & HUB */}
          {modalBusca && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setModalBusca(false)}>
              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0c0c0e]">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Adicionar Produto</h2>
                    <p className="text-sm text-zinc-500 mt-1">Busque nos catálogos para incluir no pedido.</p>
                  </div>
                  <button onClick={() => setModalBusca(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4">
                  
                  {/* 🟢 O TOGGLE DE SELEÇÃO DE FONTE DE DADOS */}
                  <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl mb-4 shadow-inner border border-zinc-200 dark:border-zinc-800">
                    <button 
                      onClick={() => { setFonteBusca('oracle'); setCatalogo([]); setTermoBusca(''); }}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${fonteBusca === 'oracle' ? 'bg-white dark:bg-[#18181b] shadow-sm text-red-600 dark:text-red-400 border border-zinc-200 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      <Database size={16} /> Banco Local (Oracle)
                    </button>
                    <button 
                      onClick={() => { setFonteBusca('hub'); setCatalogo([]); setTermoBusca(''); }}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${fonteBusca === 'hub' ? 'bg-white dark:bg-[#18181b] shadow-sm text-purple-600 dark:text-purple-400 border border-zinc-200 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      <Cloud size={16} /> Nuvem Raizan (Web)
                    </button>
                  </div>

                  <form onSubmit={buscarProdutos} className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="text" 
                      autoFocus 
                      value={termoBusca}
                      placeholder={`Digite o Nome ou Código no ${fonteBusca === 'oracle' ? 'Oracle' : 'Hub'} e aperte Enter...`} 
                      onChange={(e) => setTermoBusca(e.target.value)} 
                      className={`w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-11 py-3.5 outline-none focus:ring-1 transition-colors text-sm font-medium text-zinc-900 dark:text-zinc-100 ${fonteBusca === 'oracle' ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-purple-500 focus:ring-purple-500'}`} 
                    />
                    <button type="submit" className={`absolute right-2 top-1/2 -translate-y-1/2 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-md ${fonteBusca === 'oracle' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'}`}>
                      Buscar
                    </button>
                  </form>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    {carregandoBusca ? (
                      <div className="p-10 flex flex-col items-center justify-center gap-3">
                        <Loader2 className={`animate-spin ${fonteBusca === 'oracle' ? 'text-red-500' : 'text-purple-500'}`} size={28} />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Consultando {fonteBusca === 'oracle' ? 'ERP Local' : 'Nuvem'}...</span>
                      </div>
                    ) : catalogo.length === 0 && termoBusca.length > 2 ? (
                      <div className="p-10 text-center text-sm text-zinc-500 font-medium">Nenhum produto encontrado. Verifique o código.</div>
                    ) : (
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {catalogo.map(prod => (
                          <div key={prod.id} onClick={() => adicionarItemAoPedido(prod)} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900`}>
                                <Package size={16} className={`text-zinc-400 transition-colors ${fonteBusca === 'oracle' ? 'group-hover:text-red-500' : 'group-hover:text-purple-500'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{prod.nome}</p>
                                <p className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5 flex items-center gap-1.5">
                                  <span>CÓD: {prod.sku || 'N/A'}</span>
                                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                  <span className={fonteBusca === 'oracle' ? 'text-red-600/70 dark:text-red-400/70' : 'text-purple-600/70 dark:text-purple-400/70'}>{prod.origem}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pl-4 shrink-0">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatMoeda(prod.preco)}</span>
                              <button className={`p-2 rounded-lg text-white transition-all shadow-sm ${fonteBusca === 'oracle' ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'}`}>
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function EditarPedidoB2B() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
      <EditarPedidoConteudo />
    </Suspense>
  );
}