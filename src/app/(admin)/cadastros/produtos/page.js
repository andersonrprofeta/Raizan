"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MenuAcoesProduto from "@/components/produtos/MenuAcoesProduto";
import { 
  Package, Search, Plus, Edit, Trash2, 
  Image as ImageIcon, Loader2, Filter,
  MoreHorizontal, PackageOpen, Layers, Box, X,
  ChevronLeft, ChevronRight, TrendingUp, Barcode
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

export default function ListaProdutosHub() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(null); 

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const [modalDelete, setModalDelete] = useState({ open: false, produto: null, temVendas: false });
  const menuRef = useRef(null);

  const [modalFiltros, setModalFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "", tipo: "", estoque: "", marca: "", variacao: "", categoria: "" 
  });
  
  // Estados para o Modal de Sincronização (Mapeamento)
  const [modalEnvio, setModalEnvio] = useState({
    open: false,
    produto: null,
    categoriasWoo: [],
    categoriaSelecionada: "",
    loadingCategorias: false
  }); 

  useEffect(() => {
    carregarProdutos();
    carregarCategorias(); 

    const handleClickFora = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(null);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  useEffect(() => { setPaginaAtual(1); }, [busca, filtros]);

  const carregarProdutos = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/produtos");
      const data = await res.json();
      if (data.success) {
        setProdutos(data.produtos);
      } else {
        toast.error("Falha ao carregar o catálogo.");
      }
    } catch (error) { toast.error("Erro de conexão com o Hub."); } 
    finally { setLoading(false); }
  };

  const carregarCategorias = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/categorias");
      const data = await res.json();
      if (data.success) setCategorias(data.categorias);
    } catch (error) { console.error("Erro ao puxar categorias"); }
  };

  // ==========================================
  // 1. ABRIR MODAL DE MAPEAMENTO
  // ==========================================
  const prepararEnvioParaLoja = async (produto) => {
    setMenuAberto(null);
    setModalEnvio({ open: true, produto, categoriasWoo: [], categoriaSelecionada: "", loadingCategorias: true });

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/sincronizar/woocommerce/categorias");
      const data = await res.json();
      if (data.success) {
        setModalEnvio(prev => ({ ...prev, categoriasWoo: data.categorias, loadingCategorias: false }));
      } else {
        toast.error("Erro ao buscar categorias da loja.");
        setModalEnvio(prev => ({ ...prev, loadingCategorias: false }));
      }
    } catch (error) {
      toast.error("Falha na comunicação com a loja.");
      setModalEnvio(prev => ({ ...prev, loadingCategorias: false }));
    }
  };

  // ==========================================
  // 2. CONFIRMAR ENVIO (Com Categoria)
  // ==========================================
  const confirmarEnvioLoja = async () => {
    const { produto, categoriaSelecionada } = modalEnvio;
    
    if (!categoriaSelecionada) {
      toast.error("Selecione uma categoria para mapear!");
      return;
    }

    const toastId = toast.loading(`Sincronizando ${produto.nome}...`);
    
    try {
      const res = await fetch('https://api.raizan.com.br/api/hub/sincronizar/woocommerce', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          produto_id: produto.id,
          categoria_woo_id: categoriaSelecionada 
        }) 
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Enviado para a NUEV com sucesso!`, { id: toastId });
        setModalEnvio({ open: false, produto: null, categoriasWoo: [], categoriaSelecionada: "", loadingCategorias: false });
        
        // Acende o ícone do WooCommerce visualmente
        setProdutos(produtos.map(p => p.id === produto.id ? { ...p, canais_ativos: [...(p.canais_ativos || []), 'woocommerce'] } : p));
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (error) {
      toast.error(`Falha ao enviar.`, { id: toastId });
    }
  };

  const abrirModalDelete = (produto) => {
    const jaTeveVenda = produto.vendas_realizadas > 0; 
    setModalDelete({ open: true, produto, temVendas: jaTeveVenda });
  };

  const confirmarExclusao = async () => {
    const id = modalDelete.produto.id;
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/produtos/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setProdutos(produtos.filter(p => p.id !== id)); 
        setModalDelete({ open: false, produto: null, temVendas: false });
      } else { toast.error(data.message); }
    } catch (error) { toast.error("Erro ao excluir."); }
  };

  const inativarProduto = () => {
    const id = modalDelete.produto.id;
    setProdutos(produtos.map(p => p.id === id ? { ...p, status: 'inativo' } : p));
    toast.success("Produto Inativado com sucesso!");
    setModalDelete({ open: false, produto: null, temVendas: false });
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const produtosFiltrados = produtos.filter(p => {
    const termo = busca.toLowerCase();
    const matchBusca = 
      (p.nome && p.nome.toLowerCase().includes(termo)) || 
      (p.sku && p.sku.toLowerCase().includes(termo)) ||
      (p.gtin && p.gtin.toLowerCase().includes(termo)) ||
      (p.marca && p.marca.toLowerCase().includes(termo));

    const matchStatus = filtros.status ? p.status === filtros.status : true;
    
    let matchTipo = true;
    if (filtros.tipo) {
      const tipoDb = (p.tipo_produto || "").toLowerCase().trim();
      const varString = typeof p.variacoes === 'string' ? p.variacoes : JSON.stringify(p.variacoes || []);
      const isKit = tipoDb === 'kit';
      const isVariavel = !isKit && (tipoDb === 'variavel' || varString.length > 5);
      const isSimples = !isKit && !isVariavel;

      if (filtros.tipo === 'kit') matchTipo = isKit;
      else if (filtros.tipo === 'variavel') matchTipo = isVariavel;
      else if (filtros.tipo === 'simples') matchTipo = isSimples;
    }

    const matchMarca = filtros.marca ? (p.marca && p.marca.toLowerCase().includes(filtros.marca.toLowerCase())) : true;
    const matchCategoria = filtros.categoria ? p.categoria === filtros.categoria : true;

    let matchEstoque = true;
    if (filtros.estoque === 'com_estoque') matchEstoque = p.estoque_inicial > 0;
    if (filtros.estoque === 'sem_estoque') matchEstoque = p.estoque_inicial <= 0;

    let matchVariacao = true;
    if (filtros.variacao) {
      const termoVar = filtros.variacao.toLowerCase().trim();
      const strVar = typeof p.variacoes === 'string' ? p.variacoes.toLowerCase() : JSON.stringify(p.variacoes || "").toLowerCase();
      const strAttr = typeof p.atributos === 'string' ? p.atributos.toLowerCase() : JSON.stringify(p.atributos || "").toLowerCase();
      matchVariacao = strVar.includes(termoVar) || strAttr.includes(termoVar);
    }

    return matchBusca && matchStatus && matchTipo && matchMarca && matchCategoria && matchEstoque && matchVariacao;
  });

  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const produtosPaginados = produtosFiltrados.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);

  const limparFiltros = () => {
    setFiltros({ status: "", tipo: "", estoque: "", marca: "", variacao: "", categoria: "" });
    setBusca("");
    toast.success("Filtros limpos!");
  };

  const qtdFiltrosAtivos = Object.values(filtros).filter(val => val !== "").length;

  const obterCapa = (jsonImagens) => {
    if (!jsonImagens) return null;
    try {
      const imagens = typeof jsonImagens === 'string' ? JSON.parse(jsonImagens) : jsonImagens;
      return imagens.length > 0 ? imagens[0] : null;
    } catch(e) { return null; }
  };

  const renderCanalIcon = (canal) => {
    const iconClasses = "w-4 h-4 object-contain";
    const baseClasses = "w-7 h-7 rounded-full flex items-center justify-center border shadow-sm transition-transform hover:scale-110";

    switch (canal.toLowerCase()) {
      case 'woocommerce': return <div key={canal} className={`${baseClasses} bg-white border-blue-200`} title="WooCommerce"><img src="/woocommerce.svg" alt="WooCommerce" className={iconClasses} /></div>;
      case 'shopee': return <div key={canal} className={`${baseClasses} bg-white border-orange-200`} title="Shopee"><img src="/shopee.svg" alt="Shopee" className={iconClasses} /></div>;
      case 'mercadolivre': return <div key={canal} className={`${baseClasses} bg-white border-yellow-300`} title="Mercado Livre"><img src="/mercadolibre.svg" alt="Mercado Livre" className={iconClasses} /></div>;
      case 'amazon': return <div key={canal} className={`${baseClasses} bg-white border-zinc-300`} title="Amazon"><img src="/amazon.svg" alt="Amazon" className={iconClasses} /></div>;
      case 'magalu': return <div key={canal} className={`${baseClasses} bg-white border-blue-400`} title="Magalu"><img src="/magalu.svg" alt="Magalu" className={iconClasses} /></div>;
      case 'shopify': return <div key={canal} className={`${baseClasses} bg-white border-emerald-200`} title="Shopify"><img src="/shopify.svg" alt="Shopify" className={iconClasses} /></div>;
      case 'tiktok': return <div key={canal} className={`${baseClasses} bg-white border-zinc-300`} title="TikTok"><img src="/tiktok.svg" alt="TikTok" className={iconClasses} /></div>;
      case 'raizan': return <div key={canal} className={`${baseClasses} bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800`} title="Raizan Commerce"><Package size={14} className="text-purple-600 dark:text-purple-400" /></div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300 gap-4">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 transition-colors">
                  <Package size={28} className="text-purple-600 dark:text-purple-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate transition-colors">Catálogo Master (Hub)</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Gerencie sua base de produtos global na nuvem.</p>
                </div>
              </div>
              
              <Link href="/cadastros/produtos/novo" className="w-full sm:w-auto relative z-10">
                <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-95">
                  <Plus size={18} /> Novo Produto
                </button>
              </Link>
            </div>

            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none transition-colors">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar por Nome, SKU, EAN ou Marca..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>
              <button 
                onClick={() => setModalFiltros(true)}
                className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${qtdFiltrosAtivos > 0 ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700'}`}
              >
                <Filter size={18} /> {qtdFiltrosAtivos > 0 ? `Filtros Ativos (${qtdFiltrosAtivos})` : 'Filtros Avançados'}
              </button>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-md dark:shadow-2xl relative transition-colors flex flex-col z-10">
              
              {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="w-full overflow-visible relative min-h-[350px]"> 
                    <table className="w-full min-w-[1000px] text-sm text-left relative z-20">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                        <tr>
                          <th className="px-5 py-4 w-12 text-center uppercase tracking-wider text-xs">Capa</th>
                          <th className="px-5 py-4 uppercase tracking-wider text-xs">Produto & Detalhes</th>
                          <th className="px-5 py-4 text-right uppercase tracking-wider text-xs">Preço</th>
                          <th className="px-5 py-4 text-center uppercase tracking-wider text-xs">Estoque</th>
                          <th className="px-5 py-4 text-center uppercase tracking-wider text-xs">Canais</th>
                          <th className="px-5 py-4 text-right uppercase tracking-wider text-xs">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 transition-colors">
                        
                        {produtosPaginados.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-5 py-16 text-center text-zinc-500 dark:text-zinc-400">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <Search size={32} className="text-zinc-300 dark:text-zinc-700" />
                                <p className="font-medium text-base">Nenhum produto encontrado.</p>
                                <p className="text-sm opacity-70">Tente buscar por um termo diferente ou limpe os filtros.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          produtosPaginados.map((produto, index) => {
                            const capaUrl = obterCapa(produto.imagens_anexos);
                            const isMenuOpen = menuAberto === produto.id;
                            const isInativo = produto.status === 'inativo';
                            const menuParaCima = index >= produtosPaginados.length - 2 && produtosPaginados.length >= 3;
                            const varString = typeof produto.variacoes === 'string' ? produto.variacoes : JSON.stringify(produto.variacoes || []);
                            const isVar = produto.tipo_produto === 'variavel' || (produto.tipo_produto !== 'kit' && varString.length > 5);

                            let valorExibicao = produto.preco_venda;
                            const temPromo = produto.preco_promocional && Number(produto.preco_promocional) > 0;

                            const canaisAtivos = Array.isArray(produto.canais_ativos) ? produto.canais_ativos : []; 

                            return (
                              <tr key={produto.id} className={`hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors group ${isInativo ? 'opacity-50 grayscale bg-zinc-50 dark:bg-zinc-900/20' : ''} ${isMenuOpen ? 'relative z-50' : 'relative z-0'}`}>
                                
                                <td className="px-5 py-3">
                                  <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:border-purple-300 dark:group-hover:border-purple-500/30 overflow-hidden shadow-sm">
                                    {capaUrl ? <img src={capaUrl} alt={produto.nome} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-zinc-400 group-hover:text-purple-600" />}
                                  </div>
                                </td>
                                
                                <td className="px-5 py-3 max-w-[280px]">
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <div className="flex items-center gap-2 w-full">
                                      <p className="font-bold text-sm truncate w-full text-zinc-900 dark:text-zinc-100">{produto.nome}</p>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {/* Tags de Estrutura */}
                                      {isVar && <span className="shrink-0 flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase border border-indigo-200 dark:border-indigo-500/30"><Layers size={10} /> Variação</span>}
                                      {produto.tipo_produto === 'kit' && <span className="shrink-0 flex items-center gap-1 text-[10px] bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 px-2 py-0.5 rounded font-black uppercase border border-fuchsia-200 dark:border-fuchsia-500/30"><Box size={10} /> Kit</span>}
                                      
                                      {/* Código SKU */}
                                      <span className="flex items-center text-[10px] bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                        SKU: {produto.sku || "N/A"}
                                      </span>

                                      {/* Código EAN / GTIN */}
                                      {produto.gtin && (
                                        <span className="flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                                          <Barcode size={10} /> EAN: {produto.gtin}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="px-5 py-3 text-right">
                                  <p className="font-black text-base">{formatarMoeda(valorExibicao)}</p>
                                  {temPromo && <p className="text-[10px] text-zinc-400 line-through">{formatarMoeda(produto.preco_promocional)}</p>}
                                </td>
                                
                                <td className="px-5 py-3 text-center">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${produto.estoque_inicial > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                    {produto.estoque_inicial} un
                                  </span>
                                </td>
                                
                                <td className="px-5 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {canaisAtivos.length > 0 ? (
                                      canaisAtivos.map(canal => renderCanalIcon(canal))
                                    ) : (
                                      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic select-none">
                                        Não enviado
                                      </span>
                                    )}
                                  </div>
                                </td>
                                
                                <td className={`px-5 py-3 text-right ${isMenuOpen ? 'relative z-50' : 'relative z-0'}`}>
                                  <div className="flex items-center justify-end gap-2">
                                    
                                    <Link href={`/cadastros/produtos/editar?id=${produto.id}`}>
                                      <button className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-purple-50 dark:hover:bg-purple-500/10 text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg shadow-sm transition-colors">
                                        <Edit size={16} />
                                      </button>
                                    </Link>

                                    <button onClick={() => abrirModalDelete(produto)} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg shadow-sm transition-colors">
                                      <Trash2 size={16} />
                                    </button>

                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setMenuAberto(isMenuOpen ? null : produto.id); }}
                                      className={`p-2 border rounded-lg shadow-sm transition-colors ${isMenuOpen ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-500/20 dark:border-purple-500/50 dark:text-purple-400' : 'bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400'}`}
                                    >
                                      <MoreHorizontal size={16} />
                                    </button>

                                    {isMenuOpen && (
                                      <MenuAcoesProduto 
                                        menuRef={menuRef} 
                                        menuParaCima={menuParaCima} 
                                        produto={produto}
                                        onEnviarParaLoja={prepararEnvioParaLoja}
                                      />
                                    )}
                                  </div>
                                </td>

                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ==========================================
                      PAGINAÇÃO VIVA E FUNCIONAL
                  ========================================== */}
                  {totalPaginas > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800/60 mt-auto relative z-0 bg-zinc-50/50 dark:bg-[#0c0c0e]/50 rounded-b-2xl">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium text-center sm:text-left">
                        Mostrando <span className="font-bold text-zinc-900 dark:text-zinc-100">{indicePrimeiroItem + 1}</span> a <span className="font-bold text-zinc-900 dark:text-zinc-100">{Math.min(indiceUltimoItem, produtosFiltrados.length)}</span> de <span className="font-bold text-zinc-900 dark:text-zinc-100">{produtosFiltrados.length}</span> produtos
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                          disabled={paginaAtual === 1}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 px-3">
                          Página {paginaAtual} de {totalPaginas}
                        </span>
                        
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                          disabled={paginaAtual === totalPaginas}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* MODAL DE MAPEAMENTO E ENVIO (Estilo Olist) */}
            {modalEnvio.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  
                  {/* Cabeçalho do Modal */}
                  <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0c0c0e]">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Enviar para o e-commerce</h2>
                      <p className="text-sm text-zinc-500 mt-1">Mapeie as informações antes de sincronizar.</p>
                    </div>
                    <button onClick={() => setModalEnvio({ ...modalEnvio, open: false })} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Corpo do Modal */}
                  <div className="p-6 space-y-6">
                    {/* Info do Produto Pai */}
                    <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                      <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm border border-purple-100 dark:border-purple-800/30">
                        <PackageOpen size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Produto Selecionado</p>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{modalEnvio.produto?.nome}</h3>
                        <p className="text-sm text-zinc-500">SKU: {modalEnvio.produto?.sku || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Seção de Mapeamento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      
                      {/* Categoria Raizan */}
                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria no ERP (Raizan)</label>
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 font-medium">
                          {modalEnvio.produto?.categoria || "Sem Categoria"}
                        </div>
                        
                        {/* Seta ligando os dois */}
                        <div className="hidden md:flex absolute -right-4 top-1/2 translate-x-1/2 items-center justify-center w-8 h-8 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-full z-10 shadow-sm">
                          <ChevronRight size={16} className="text-zinc-400" />
                        </div>
                      </div>

                      {/* Categoria WooCommerce */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                          <img src="/woocommerce.svg" alt="Woo" className="w-4 h-4 object-contain" /> 
                          Categoria na Loja
                        </label>
                        
                        {modalEnvio.loadingCategorias ? (
                          <div className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 text-sm text-zinc-500">
                            <Loader2 size={16} className="animate-spin" /> Buscando categorias...
                          </div>
                        ) : (
                          <select 
                            value={modalEnvio.categoriaSelecionada} 
                            onChange={(e) => setModalEnvio({...modalEnvio, categoriaSelecionada: e.target.value})}
                            className="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer shadow-sm"
                          >
                            <option value="" disabled>Selecione a categoria correspondente</option>
                            {modalEnvio.categoriasWoo.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.nome}</option>
                            ))}
                          </select>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Rodapé do Modal */}
                  <div className="p-6 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0c0c0e] flex justify-end gap-3">
                    <button 
                      onClick={() => setModalEnvio({ ...modalEnvio, open: false })}
                      className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={confirmarEnvioLoja}
                      disabled={!modalEnvio.categoriaSelecionada || modalEnvio.loadingCategorias}
                      className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <img src="/woocommerce.svg" alt="Woo" className="w-4 h-4 object-contain brightness-0 invert" />
                      Sincronizar Produto
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* ==========================================
                MODAL DE FILTROS AVANÇADOS
            ========================================== */}
            {modalFiltros && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0c0c0e]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
                        <Filter size={20} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Filtros Avançados</h2>
                        <p className="text-sm text-zinc-500 mt-0.5">Refine a busca do seu catálogo.</p>
                      </div>
                    </div>
                    <button onClick={() => setModalFiltros(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Corpo do Modal */}
                  <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Status */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status do Produto</label>
                        <select 
                          value={filtros.status} onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">Todos os Status</option>
                          <option value="ativo">🟢 Ativos</option>
                          <option value="inativo">🔴 Inativos</option>
                        </select>
                      </div>

                      {/* Tipo de Produto */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estrutura</label>
                        <select 
                          value={filtros.tipo} onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">Qualquer Estrutura</option>
                          <option value="simples">📦 Produto Simples</option>
                          <option value="variavel">🎨 Produto com Variação</option>
                          <option value="kit">🎁 Kit / Combo</option>
                        </select>
                      </div>

                      {/* Situação do Estoque */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estoque Atual</label>
                        <select 
                          value={filtros.estoque} onChange={(e) => setFiltros({...filtros, estoque: e.target.value})}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">Ignorar Estoque</option>
                          <option value="com_estoque">✅ Com Estoque (Positivo)</option>
                          <option value="sem_estoque">⚠️ Sem Estoque (Zerado/Negativo)</option>
                        </select>
                      </div>

                      {/* Categoria */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</label>
                        <select 
                          value={filtros.categoria} onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">Todas as Categorias</option>
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                          ))}
                        </select>
                      </div>

                      {/* Marca */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Marca</label>
                        <input 
                          type="text" placeholder="Ex: NUEV, Payot..."
                          value={filtros.marca} onChange={(e) => setFiltros({...filtros, marca: e.target.value})}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      {/* Buscar na Variação */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Termo de Variação</label>
                        <input 
                          type="text" placeholder="Ex: Preto, G, 110v..."
                          value={filtros.variacao} onChange={(e) => setFiltros({...filtros, variacao: e.target.value})}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Rodapé do Modal */}
                  <div className="p-6 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0c0c0e] flex items-center justify-between gap-3">
                    <button 
                      onClick={limparFiltros}
                      className="px-6 py-2.5 text-rose-500 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors text-sm"
                    >
                      Limpar Filtros
                    </button>
                    
                    <button 
                      onClick={() => setModalFiltros(false)}
                      className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-bold transition-colors shadow-sm text-sm"
                    >
                      Ver Resultados
                    </button>
                  </div>

                </div>
              </div>
            )}

            
        </main>
      </div>
    </div>
  );
}