"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Package, Search, Plus, Edit, Trash2, 
  Image as ImageIcon, Loader2, Filter, Globe,
  MoreHorizontal, PackageOpen, UploadCloud, 
  DollarSign, FileText, Settings, Printer, 
  TrendingDown, TrendingUp, ShoppingCart, Copy, Tag,
  Store, ShoppingBag, Layers, Box, X
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

export default function ListaProdutosHub() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(null); 

  const [modalDelete, setModalDelete] = useState({ open: false, produto: null, temVendas: false });
  const menuRef = useRef(null);

  const [modalFiltros, setModalFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "",
    tipo: "",
    estoque: "",
    marca: "",
    variacao: "",
    categoria: "" 
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

  const carregarProdutos = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/produtos");
      const data = await res.json();
      if (data.success) {
        setProdutos(data.produtos);
      } else {
        toast.error("Falha ao carregar o catálogo.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o Hub.");
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/categorias");
      const data = await res.json();
      if (data.success) setCategorias(data.categorias);
    } catch (error) {
      console.error("Erro ao puxar categorias");
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
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const inativarProduto = () => {
    const id = modalDelete.produto.id;
    setProdutos(produtos.map(p => p.id === id ? { ...p, status: 'inativo' } : p));
    toast.success("Produto Inativado com sucesso!");
    setModalDelete({ open: false, produto: null, temVendas: false });
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // 🟢 MOTOR DE FILTRAGEM INTELIGENTE E DEFINITIVO
  const produtosFiltrados = produtos.filter(p => {
    const termo = busca.toLowerCase();
    const matchBusca = 
      (p.nome && p.nome.toLowerCase().includes(termo)) || 
      (p.sku && p.sku.toLowerCase().includes(termo)) ||
      (p.gtin && p.gtin.toLowerCase().includes(termo)) ||
      (p.marca && p.marca.toLowerCase().includes(termo));

    const matchStatus = filtros.status ? p.status === filtros.status : true;
    
    // 🧠 Lógica Infalível para Tipos
    let matchTipo = true;
    if (filtros.tipo) {
      const tipoDb = (p.tipo_produto || "").toLowerCase().trim();
      const varString = typeof p.variacoes === 'string' ? p.variacoes : JSON.stringify(p.variacoes || []);
      const varLen = varString.length;
      
      const isKit = tipoDb === 'kit';
      const isVariavel = !isKit && (tipoDb === 'variavel' || varLen > 5);
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

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* CABEÇALHO */}
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

            {/* FILTROS E BUSCA GLOBAL */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none transition-colors">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por Nome, SKU, EAN ou Marca..." 
                  value={busca} 
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium"
                />
              </div>
              
              <button 
                onClick={() => setModalFiltros(true)}
                className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border shadow-sm dark:shadow-none ${qtdFiltrosAtivos > 0 ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30' : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'}`}
              >
                <Filter size={18} /> 
                {qtdFiltrosAtivos > 0 ? `Filtros Ativos (${qtdFiltrosAtivos})` : 'Filtros Avançados'}
              </button>
            </div>

            {/* TABELA */}
            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-md dark:shadow-2xl relative transition-colors min-h-[400px] flex flex-col pb-24">
              
              {loading ? (
                <div className="absolute inset-0 z-20 bg-white/60 dark:bg-[#0c0c0e]/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" />
                </div>
              ) : produtos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-purple-100 dark:bg-purple-500/10 rounded-full flex items-center justify-center mb-6 border border-purple-200 dark:border-purple-500/20 shadow-inner">
                    <PackageOpen size={48} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Seu Hub está vazio</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">Cadastre seu primeiro produto para começar a integrar com múltiplos canais de venda.</p>
                  <Link href="/cadastros/produtos/novo">
                    <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">
                      <Plus size={18} /> Cadastrar Meu Primeiro Produto
                    </button>
                  </Link>
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Search size={24} className="text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nenhum produto encontrado</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1 mb-4">Tente remover alguns filtros ou buscar por outro termo.</p>
                  <button onClick={limparFiltros} className="text-purple-600 font-bold hover:underline">Limpar filtros</button>
                </div>
              ) : (
                <div className="w-full overflow-visible"> 
                  <table className="w-full min-w-[1000px] text-sm text-left">
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
                      {produtosFiltrados.map((produto) => {
                        const capaUrl = obterCapa(produto.imagens_anexos);
                        const isMenuOpen = menuAberto === produto.id;
                        const temPromo = produto.preco_promocional && Number(produto.preco_promocional) > 0;
                        const isInativo = produto.status === 'inativo';
                        
                        // Lógica limpa para determinar se é Variação para exibir a tag visual
                        const varString = typeof produto.variacoes === 'string' ? produto.variacoes : JSON.stringify(produto.variacoes || []);
                        const isVar = produto.tipo_produto === 'variavel' || (produto.tipo_produto !== 'kit' && varString.length > 5);

                        return (
                          <tr 
                            key={produto.id} 
                            className={`hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors group ${isInativo ? 'opacity-50 grayscale bg-zinc-50 dark:bg-zinc-900/20' : ''}`}
                          >
                            
                            <td className="px-5 py-3">
                              <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:border-purple-300 dark:group-hover:border-purple-500/30 transition-all overflow-hidden shadow-sm">
                                {capaUrl ? (
                                  <img src={capaUrl} alt={produto.nome} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={18} className="text-zinc-400 dark:text-zinc-600 group-hover:text-purple-600 transition-colors" />
                                )}
                              </div>
                            </td>
                            
                            <td className="px-5 py-3 max-w-[280px]">
                              <div className="flex items-center gap-2 mb-1.5 w-full">
                                {/* 🟢 AQUI ESTÁ A MÁGICA DO TEXTO NÃO QUEBRAR LINHA! */}
                                <p 
                                  title={produto.nome} 
                                  className={`font-bold transition-colors text-sm truncate w-full ${isInativo ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-200 group-hover:text-purple-700 dark:group-hover:text-purple-300'}`}
                                >
                                  {produto.nome}
                                </p>
                                
                                {isVar && (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20 font-black uppercase tracking-wider shadow-sm">
                                    <Layers size={10} /> Variação
                                  </span>
                                )}
                                {produto.tipo_produto === 'kit' && (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-0.5 rounded border border-fuchsia-200 dark:border-fuchsia-500/20 font-black uppercase tracking-wider shadow-sm">
                                    <Box size={10} /> Kit
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-bold transition-colors">SKU: {produto.sku}</span>
                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-bold transition-colors">EAN: {produto.gtin || 'Não info.'}</span>
                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-bold transition-colors uppercase truncate max-w-[80px]">{produto.marca || 'Sem Marca'}</span>
                                <span className={`w-2 h-2 rounded-full shrink-0 ml-1 ${isInativo ? 'bg-zinc-400' : (produto.status === 'ativo' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-600')}`}></span>
                              </div>
                            </td>
                            
                            <td className="px-5 py-3 text-right">
                              {temPromo ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through mb-0.5">
                                    {formatarMoeda(produto.preco_venda)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                      <Tag size={10} /> Oferta
                                    </span>
                                    <p className={`font-black text-base lg:text-lg transition-colors ${isInativo ? 'text-zinc-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      {formatarMoeda(produto.preco_promocional)}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className={`font-black text-base lg:text-lg transition-colors ${isInativo ? 'text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                  {formatarMoeda(produto.preco_venda)}
                                </p>
                              )}
                            </td>
                            
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isInativo ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700' : (produto.estoque_inicial > 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20')}`}>
                                {produto.estoque_inicial} un
                              </span>
                            </td>
                            
                            <td className="px-5 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                 <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-center cursor-help" title="WooCommerce">
                                   <Globe size={12} className="text-blue-600 dark:text-blue-400" />
                                 </div>
                                 <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-center justify-center cursor-help" title="Shopee">
                                   <ShoppingBag size={12} className="text-orange-600 dark:text-orange-400" />
                                 </div>
                                 <div className="w-7 h-7 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-center justify-center cursor-help" title="Mercado Livre">
                                   <Store size={12} className="text-yellow-600 dark:text-yellow-400" />
                                 </div>
                                 <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center justify-center cursor-help" title="Raizan Commerce">
                                   <Package size={12} className="text-purple-600 dark:text-purple-400" />
                                 </div>
                              </div>
                            </td>
                            
                            <td className="px-5 py-3 text-right relative">
                              <div className="flex items-center justify-end gap-2">
                                
                                <Link href={`/cadastros/produtos/editar?id=${produto.id}`}>
                                  <button className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-500/20 text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 rounded-lg transition-all shadow-sm">
                                    <Edit size={16} />
                                  </button>
                                </Link>

                                <button 
                                  onClick={() => abrirModalDelete(produto)}
                                  className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg transition-all shadow-sm"
                                >
                                  <Trash2 size={16} />
                                </button>

                                <button 
                                  onClick={(e) => { e.stopPropagation(); setMenuAberto(isMenuOpen ? null : produto.id); }}
                                  className={`p-2 border rounded-lg transition-all shadow-sm ${isMenuOpen ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-500/30 dark:border-purple-500/50 dark:text-purple-300' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                >
                                  <MoreHorizontal size={16} />
                                </button>

                                {isMenuOpen && (
                                  <div ref={menuRef} className="absolute right-8 top-14 w-64 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 py-2 text-left animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                                    
                                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 mb-2">
                                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sincronização</p>
                                    </div>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors">
                                      <UploadCloud size={16} /> Enviar para o e-commerce
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors">
                                      <DollarSign size={16} /> Enviar preços
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors">
                                      <Package size={16} /> Enviar estoque
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors">
                                      <FileText size={16} /> Enviar dados fiscais
                                    </button>

                                    <div className="px-4 py-2 border-y border-zinc-100 dark:border-zinc-800/60 my-2">
                                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Gestão</p>
                                    </div>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
                                      <Settings size={16} /> Gerenciar estoque
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
                                      <Printer size={16} /> Imprimir etiquetas
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
                                      <TrendingDown size={16} /> Histórico de compras
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
                                      <TrendingUp size={16} /> Histórico de vendas
                                    </button>

                                    <div className="px-4 py-2 border-y border-zinc-100 dark:border-zinc-800/60 my-2">
                                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ações</p>
                                    </div>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
                                      <ShoppingCart size={16} /> Criar um pedido
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
                                      <Copy size={16} /> Clonar produto
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
                                      <Tag size={16} /> Editar tags
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* MODAL DE EXCLUSÃO */}
            {modalDelete.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                  {modalDelete.temVendas ? (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-500/20">
                        <TrendingUp size={32} className="text-amber-600 dark:text-amber-500" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Ação Bloqueada</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        O produto <b>{modalDelete.produto?.nome}</b> possui histórico de vendas e integrações ativas. Para não corromper relatórios fiscais, a exclusão é proibida.
                      </p>
                      <div className="flex gap-3 pt-4">
                        <button onClick={() => setModalDelete({ open: false, produto: null, temVendas: false })} className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors">
                          Cancelar
                        </button>
                        <button onClick={inativarProduto} className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all">
                          Inativar Produto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-500/20">
                        <Trash2 size={32} className="text-rose-600 dark:text-rose-500" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Excluir Produto?</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Tem certeza que deseja excluir <b>{modalDelete.produto?.nome}</b> permanentemente do Hub? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-3 pt-4">
                        <button onClick={() => setModalDelete({ open: false, produto: null, temVendas: false })} className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors">
                          Cancelar
                        </button>
                        <button onClick={confirmarExclusao} className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all">
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DRAWER LATERAL: FILTROS AVANÇADOS */}
            {modalFiltros && (
              <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalFiltros(false)} />
                
                <div className="w-full max-w-md bg-white dark:bg-[#121214] h-full shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800">
                  
                  <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800/60">
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Filter size={20} className="text-purple-600 dark:text-purple-500" />
                        Filtros Avançados
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Refine a busca no seu catálogo.</p>
                    </div>
                    <button onClick={() => setModalFiltros(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Status do Produto</label>
                      <select value={filtros.status} onChange={(e) => setFiltros({...filtros, status: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors">
                        <option value="">Todos os status</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Tipo de Produto</label>
                      <select value={filtros.tipo} onChange={(e) => setFiltros({...filtros, tipo: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors">
                        <option value="">Todos os tipos</option>
                        <option value="simples">Produto Simples</option>
                        <option value="variavel">Produto com Variação</option>
                        <option value="kit">Kit de Produtos</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Estoque</label>
                      <select value={filtros.estoque} onChange={(e) => setFiltros({...filtros, estoque: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors">
                        <option value="">Indiferente</option>
                        <option value="com_estoque">Com estoque positivo</option>
                        <option value="sem_estoque">Sem estoque (0 ou negativo)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Marca</label>
                      <input type="text" placeholder="Digite o nome da marca" value={filtros.marca} onChange={(e) => setFiltros({...filtros, marca: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cor / Tamanho / Atributo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Azul, M, 42..." 
                        value={filtros.variacao} 
                        onChange={(e) => setFiltros({...filtros, variacao: e.target.value})} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Categoria</label>
                      <select 
                        value={filtros.categoria} 
                        onChange={(e) => setFiltros({...filtros, categoria: e.target.value})} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="">Todas as categorias</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="p-6 border-t border-zinc-200 dark:border-zinc-800/60 flex gap-3 bg-zinc-50 dark:bg-[#0c0c0e]">
                    <button onClick={limparFiltros} className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors">
                      Limpar
                    </button>
                    <button onClick={() => setModalFiltros(false)} className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all">
                      Aplicar Filtros
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}