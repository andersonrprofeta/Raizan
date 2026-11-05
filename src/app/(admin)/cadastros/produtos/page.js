"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MenuAcoesProduto from "@/components/produtos/MenuAcoesProduto";
import ModalEnvios from "@/components/produtos/ModalEnvios"; // 🟢 OLHA ELE AQUI!
import { 
  Package, Search, Plus, Edit, Trash2, 
  Image as ImageIcon, Loader2, Filter,
  MoreHorizontal, Box, Layers, X,
  ChevronLeft, ChevronRight, Barcode, AlertTriangle, CloudSync, LayoutTemplate, Ban
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================

// Superfície de vidro. ATENÇÃO: sem overflow-hidden aqui, para o menu "..." poder sair do card.
const CARD =
  "relative rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] " +
  "bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] " +
  "transition-colors duration-300";

// Painel de vidro dos modais
const PAINEL =
  "bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] " +
  "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_90px_-20px_rgba(0,0,0,0.9)]";

// Botão de ícone redondo (ações da tabela)
const ICON_BTN =
  "w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] " +
  "border border-black/[0.04] dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 " +
  "transition-all duration-300 active:scale-90";

// Setas da paginação
const PAG_SETA =
  "w-9 h-9 flex items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.08] " +
  "bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.08] " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-white/[0.04] " +
  "transition-all duration-300 active:scale-90";

// Pílulas pequenas (Variação, Kit, SKU, EAN, Oferta)
const PILULA = "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap";

// Campos dos modais (fundo sólido no escuro para a lista do <select> ficar legível)
const CAMPO_MODAL =
  "w-full h-12 px-4 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl outline-none " +
  "focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15 text-sm font-medium text-zinc-900 dark:text-zinc-100 " +
  "transition-all dark:[color-scheme:dark]";

const ROTULO_MODAL = "text-xs font-semibold text-zinc-500 dark:text-zinc-400";

export default function ListaProdutosHub() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(null); 

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10); 

  const [modalDelete, setModalDelete] = useState({ open: false, produto: null, temVendas: false });
  const menuRef = useRef(null);

  const [modalFiltros, setModalFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "", tipo: "", estoque: "", marca: "", variacao: "", categoria: "" 
  });
  
  // 🟢 ESTADO DO NOVO MODAL (MUITO MAIS LIMPO!)
  const [modalEnvio, setModalEnvio] = useState({ open: false, produto: null }); 

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

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

  useEffect(() => { setPaginaAtual(1); }, [busca, filtros, itensPorPagina]);

  const carregarProdutos = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) return toast.error("Erro de sessão.");

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/produtos?limit=5000", { headers: { "x-tenant-id": tenantId } });
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
    const tenantId = pegarCnpjLogado();
    if (!tenantId) return;

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/categorias", { headers: { "x-tenant-id": tenantId } });
      const data = await res.json();
      if (data.success) setCategorias(data.categorias);
    } catch (error) { console.error("Erro ao puxar categorias"); }
  };

  // 🟢 Apenas seta o estado e abre o modal isolado!
  const prepararEnvioParaLoja = (produto) => {
    setMenuAberto(null);
    setModalEnvio({ open: true, produto });
  };

  // 🟢 O BOTÃO AGORA É REAL E FALA COM O BANCO!
  const enviarParaForcaDeVendas = async (produto) => {
    setMenuAberto(null);
    const tenantId = pegarCnpjLogado();
    const toastId = toast.loading(`Enviando ${produto.nome} para o App dos vendedores...`);
    
    try {
      // ⚠️ ATENÇÃO: Ajuste a URL se a sua rota no backend ficou diferente!
      const res = await fetch('https://api.raizan.com.br/api/hub/produtos/forca-vendas', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ produto_id: produto.id })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Catálogo do App atualizado!`, { id: toastId });
        // Atualiza a tabela na hora com o ícone roxo da maletinha!
        setProdutos(produtos.map(p => 
          p.id === produto.id && !(p.canais_ativos || []).includes('raizan') 
            ? { ...p, canais_ativos: [...(p.canais_ativos || []), 'raizan'] } 
            : p
        ));
      } else {
        toast.error(data.message || "Erro ao ativar no App", { id: toastId });
      }
    } catch (error) {
      toast.error("Falha na comunicação com o servidor.", { id: toastId });
    }
  };

  const abrirModalDelete = (produto) => {
    const jaTeveVenda = produto.vendas_realizadas > 0; 
    setModalDelete({ open: true, produto, temVendas: jaTeveVenda });
  };

  const confirmarExclusao = async () => {
    const id = modalDelete.produto.id;
    const tenantId = pegarCnpjLogado();

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/produtos/${id}`, { method: "DELETE", headers: { "x-tenant-id": tenantId } });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setProdutos(produtos.filter(p => p.id !== id)); 
        setModalDelete({ open: false, produto: null, temVendas: false });
      } else { toast.error(data.message); }
    } catch (error) { toast.error("Erro ao excluir."); }
  };

  const bloquearProduto = async () => {
    const id = modalDelete.produto.id;
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/produtos/${id}/bloqueio`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-tenant-id": pegarCnpjLogado() },
        body: JSON.stringify({ geral: true, motivo: "Bloqueado na lista de produtos" })
      });
      const data = await res.json();
      if (!data.success) return toast.error(data.message);
      setProdutos(produtos.map(p => p.id === id ? { ...p, bloqueado: true } : p));
      toast.success("Produto bloqueado para venda.");
      setModalDelete({ open: false, produto: null, temVendas: false });
    } catch (error) { toast.error("Erro ao bloquear o produto."); }
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const produtosFiltrados = produtos.filter(p => {
    const termo = busca.toLowerCase();
    const matchBusca = (p.nome && p.nome.toLowerCase().includes(termo)) || (p.sku && p.sku.toLowerCase().includes(termo)) || (p.gtin && p.gtin.toLowerCase().includes(termo)) || (p.marca && p.marca.toLowerCase().includes(termo));
    const matchStatus = filtros.status === 'bloqueado' ? p.bloqueado : (filtros.status ? p.status === filtros.status : true);
    
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

  const obterCapa = (produto) => {
    if (produto && produto.imagens_anexos) {
      try {
        const imagens = typeof produto.imagens_anexos === 'string' ? JSON.parse(produto.imagens_anexos) : produto.imagens_anexos;
        if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) {
          return imagens[0];
        }
      } catch(e) {}
    }
    return null; 
  };

  const renderCanalIcon = (canal) => {
    const iconClasses = "w-4 h-4 object-contain";
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center border shadow-sm transition-transform duration-300 hover:scale-110";

    switch (canal.toLowerCase()) {
      case 'woocommerce': return <div key={canal} className={`${baseClasses} bg-white border-blue-200`} title="WooCommerce"><img src="/woocommerce.svg" alt="WooCommerce" className={iconClasses} /></div>;
      case 'shopee': return <div key={canal} className={`${baseClasses} bg-white border-orange-200`} title="Shopee"><img src="/shopee.svg" alt="Shopee" className={iconClasses} /></div>;
      case 'mercadolivre': return <div key={canal} className={`${baseClasses} bg-white border-yellow-300`} title="Mercado Livre"><img src="/mercadolibre.svg" alt="Mercado Livre" className={iconClasses} /></div>;
      case 'amazon': return <div key={canal} className={`${baseClasses} bg-white border-zinc-300`} title="Amazon"><img src="/amazon.svg" alt="Amazon" className={iconClasses} /></div>;
      case 'magalu': return <div key={canal} className={`${baseClasses} bg-white border-blue-400`} title="Magalu"><img src="/magalu.svg" alt="Magalu" className={iconClasses} /></div>;
      case 'shopify': return <div key={canal} className={`${baseClasses} bg-white border-emerald-200`} title="Shopify"><img src="/shopify.svg" alt="Shopify" className={iconClasses} /></div>;
      case 'tiktok': return <div key={canal} className={`${baseClasses} bg-white border-zinc-300`} title="TikTok"><img src="/tiktok.svg" alt="TikTok" className={iconClasses} /></div>;
      
      // 🟢 O SEU APP FORÇA DE VENDAS
      case 'raizan': return <div key={canal} className={`${baseClasses} bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800`} title="Força de Vendas (Raizan Seller)"><Package size={14} className="text-purple-600 dark:text-purple-400" /></div>;
      
      // 🟢 O NOVO ÍCONE DO PORTAL B2B
      case 'b2b': return <div key={canal} className={`${baseClasses} bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800`} title="Portal B2B"><LayoutTemplate size={14} className="text-sky-600 dark:text-sky-400" /></div>;
      
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">

        {/* Luzes suaves atrás do vidro */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
        </div>

        <Header />
        
        {/* ⚠️ Sem z-index no <main>: um z-index aqui cria um "andar" de empilhamento e prende os modais (fixed) atrás do Header e da Sidebar */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Título */}
            <div className={`${CARD} overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 gap-4`}>
              <div className="absolute -left-10 -top-10 w-44 h-44 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-400 to-purple-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-8px_rgba(124,58,237,0.6)] rounded-[16px] sm:rounded-[18px]">
                  <Package size={26} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-[28px] leading-tight font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">Catálogo Master (Hub)</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gerencie sua base de produtos global na nuvem.</p>
                </div>
              </div>
              
              <Link href="/cadastros/produtos/novo" className="w-full sm:w-auto relative z-10">
                <button className="w-full sm:w-auto h-11 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white px-6 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(147,51,234,0.6)] transition-all active:scale-95">
                  <Plus size={18} /> Novo Produto
                </button>
              </Link>
            </div>

            {/* Busca + filtros */}
            <div className={`${CARD} p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4`}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar por Nome, SKU, EAN ou Marca..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-black/[0.04] dark:bg-white/[0.05] border border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/[0.07] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 pl-11 pr-4 h-11 rounded-full text-sm outline-none focus:ring-4 focus:ring-purple-500/15 font-medium transition-all"
                />
              </div>
              <button 
                onClick={() => setModalFiltros(true)}
                className={`px-6 h-11 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all border active:scale-95 ${qtdFiltrosAtivos > 0 ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30' : 'bg-black/[0.04] dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.1]'}`}
              >
                <Filter size={17} /> {qtdFiltrosAtivos > 0 ? `Filtros Ativos (${qtdFiltrosAtivos})` : 'Filtros Avançados'}
              </button>
            </div>

            {/* Tabela (sem overflow-hidden: o menu "..." precisa poder sair do card) */}
            <div className={`${CARD} flex flex-col z-10`}>
              
              {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="w-full overflow-visible relative min-h-[350px]"> 
                    <table className="w-full min-w-[1000px] text-sm text-left relative z-20">
                      <thead className="text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.07]">
                        <tr>
                          <th className="px-5 py-4 w-12 text-center text-xs font-semibold">Capa</th>
                          <th className="px-5 py-4 text-xs font-semibold">Produto & Detalhes</th>
                          <th className="px-5 py-4 text-right text-xs font-semibold">Preço</th>
                          <th className="px-5 py-4 text-center text-xs font-semibold">Estoque</th>
                          <th className="px-5 py-4 text-center text-xs font-semibold">Canais</th>
                          <th className="px-5 py-4 text-right text-xs font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                        
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
                            const capaUrl = obterCapa(produto);
                            const isMenuOpen = menuAberto === produto.id;
                            const isInativo = produto.status === 'inativo';
                            const menuParaCima = index >= produtosPaginados.length - 2 && produtosPaginados.length >= 3;
                            const varString = typeof produto.variacoes === 'string' ? produto.variacoes : JSON.stringify(produto.variacoes || []);
                            const isVar = produto.tipo_produto === 'variavel' || (produto.tipo_produto !== 'kit' && varString.length > 5);

                            const temPromo = produto.preco_promocional && Number(produto.preco_promocional) > 0;
                            const valorExibicao = temPromo ? produto.preco_promocional : produto.preco_venda;
                            const valorAntigo = temPromo ? produto.preco_venda : null;

                            const canaisAtivos = Array.isArray(produto.canais_ativos) ? produto.canais_ativos : []; 

                            return (
                              <tr key={produto.id} className={`hover:bg-purple-500/[0.04] dark:hover:bg-white/[0.03] transition-colors group ${isInativo ? 'opacity-50 grayscale bg-black/[0.02] dark:bg-white/[0.02]' : ''} ${isMenuOpen ? 'relative z-50' : 'relative z-0'}`}>
                                
                                <td className="px-5 py-3">
                                  <div className="w-12 h-12 bg-black/[0.03] dark:bg-white/[0.05] rounded-[14px] flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08] group-hover:border-purple-300 dark:group-hover:border-purple-500/30 overflow-hidden shadow-sm transition-colors">
                                    {capaUrl ? <img src={capaUrl} alt={produto.nome} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-zinc-400 group-hover:text-purple-600" />}
                                  </div>
                                </td>
                                
                                <td className="px-5 py-3 max-w-[280px]">
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <div className="flex items-center gap-2 w-full">
                                      <p className="font-semibold tracking-tight text-sm truncate w-full text-zinc-900 dark:text-zinc-100">{produto.nome}</p>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {produto.bloqueado && <span className={`${PILULA} bg-rose-600 text-white border-rose-600`}><Ban size={11} /> BLOQUEADO</span>}
                                      {isVar && <span className={`${PILULA} bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20`}><Layers size={11} /> Variação</span>}
                                      {produto.tipo_produto === 'kit' && <span className={`${PILULA} bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20`}><Box size={11} /> Kit</span>}
                                      
                                      <span className={`${PILULA} bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.08]`}>
                                        SKU: {produto.sku || "N/A"}
                                      </span>

                                      {produto.gtin && (
                                        <span className={`${PILULA} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20`}>
                                          <Barcode size={11} /> EAN: {produto.gtin}
                                        </span>
                                      )}

                                      {temPromo && (
                                        <span className={`${PILULA} bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20`}>
                                          🔥 Oferta
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="px-5 py-3 text-right">
                                  <p className="font-bold tracking-tight tabular-nums text-base text-zinc-900 dark:text-zinc-50">{formatarMoeda(valorExibicao)}</p>
                                  {temPromo && <p className="text-[11px] text-zinc-400 line-through font-medium tabular-nums">{formatarMoeda(valorAntigo)}</p>}
                                </td>
                                
                                <td className="px-5 py-3 text-center">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold tabular-nums border ${produto.estoque_inicial > 0 ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400'}`}>
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
                                      <button className={`${ICON_BTN} hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400`} title="Editar">
                                        <Edit size={16} />
                                      </button>
                                    </Link>

                                    <button onClick={() => enviarParaForcaDeVendas(produto)} title="Sincronizar Força de Vendas" className={`${ICON_BTN} hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400`}>
                                      <CloudSync size={16} />
                                    </button>

                                    <button onClick={() => abrirModalDelete(produto)} title="Excluir" className={`${ICON_BTN} hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400`}>
                                      <Trash2 size={16} />
                                    </button>

                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setMenuAberto(isMenuOpen ? null : produto.id); }}
                                      className={`${ICON_BTN} ${isMenuOpen ? '!bg-purple-500/15 !border-purple-500/40 !text-purple-700 dark:!text-purple-300' : 'hover:bg-black/[0.07] dark:hover:bg-white/[0.1]'}`}
                                    >
                                      <MoreHorizontal size={16} />
                                    </button>

                                    {isMenuOpen && (
                                      <MenuAcoesProduto 
                                        menuRef={menuRef} 
                                        menuParaCima={menuParaCima} 
                                        produto={produto}
                                        onEnviarParaLoja={prepararEnvioParaLoja}
                                        onEnviarForcaVendas={enviarParaForcaDeVendas}
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

                  {totalPaginas > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.07] mt-auto relative z-0 rounded-b-[28px]">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
                        Mostrando <span className="font-semibold text-zinc-900 dark:text-zinc-100">{indicePrimeiroItem + 1}</span> a <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Math.min(indiceUltimoItem, produtosFiltrados.length)}</span> de <span className="font-semibold text-zinc-900 dark:text-zinc-100">{produtosFiltrados.length}</span> produtos
                      </p>
                      
                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Exibir:</span>
                          <select 
                            value={itensPorPagina} 
                            onChange={(e) => {
                              setItensPorPagina(Number(e.target.value));
                              setPaginaAtual(1); 
                            }}
                            className="bg-white dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-full h-9 px-3 outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15 cursor-pointer dark:[color-scheme:dark]"
                          >
                            <option value={10}>10 linhas</option>
                            <option value={20}>20 linhas</option>
                            <option value={50}>50 linhas</option>
                            <option value={100}>100 linhas</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaAtual === 1}
                            className={PAG_SETA}
                            aria-label="Página anterior"
                          >
                            <ChevronLeft size={17} />
                          </button>
                          
                          <span className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300 px-1 whitespace-nowrap">
                            Página {paginaAtual} de {totalPaginas || 1}
                          </span>
                          
                          <button 
                            onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
                            className={PAG_SETA}
                            aria-label="Próxima página"
                          >
                            <ChevronRight size={17} />
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 🟢 O SEU COMPONENTE NOVO É CHAMADO AQUI! */}
            <ModalEnvios 
              isOpen={modalEnvio.open}
              produto={modalEnvio.produto}
              onClose={() => setModalEnvio({ open: false, produto: null })}
              onSuccess={(produtoId) => {
                setProdutos(produtos.map(p => 
                  p.id === produtoId ? { ...p, canais_ativos: [...(p.canais_ativos || []), 'woocommerce'] } : p
                ));
              }}
            />

          </div>

          {/* ==========================================
              MODAL DE FILTROS AVANÇADOS
          ========================================== */}
            {modalFiltros && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                <div className={`${PAINEL} rounded-[32px] w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>
                  
                  <div className="flex items-center justify-between p-6 border-b border-black/[0.06] dark:border-white/[0.07]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-violet-400 to-purple-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-8px_rgba(124,58,237,0.6)]">
                        <Filter size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Filtros Avançados</h2>
                        <p className="text-sm text-zinc-500 mt-0.5">Refine a busca do seu catálogo.</p>
                      </div>
                    </div>
                    <button onClick={() => setModalFiltros(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.09] dark:hover:bg-white/[0.14] transition-all active:scale-90">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-2">
                        <label className={ROTULO_MODAL}>Status do Produto</label>
                        <select 
                          value={filtros.status} onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                          className={CAMPO_MODAL}
                        >
                          <option value="">Todos os Status</option>
                          <option value="ativo">🟢 Ativos</option>
                          <option value="inativo">🔴 Inativos</option>
                          <option value="bloqueado">⛔ Bloqueados para venda</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={ROTULO_MODAL}>Estrutura</label>
                        <select 
                          value={filtros.tipo} onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                          className={CAMPO_MODAL}
                        >
                          <option value="">Qualquer Estrutura</option>
                          <option value="simples">📦 Produto Simples</option>
                          <option value="variavel">🎨 Produto com Variação</option>
                          <option value="kit">🎁 Kit / Combo</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={ROTULO_MODAL}>Estoque Atual</label>
                        <select 
                          value={filtros.estoque} onChange={(e) => setFiltros({...filtros, estoque: e.target.value})}
                          className={CAMPO_MODAL}
                        >
                          <option value="">Ignorar Estoque</option>
                          <option value="com_estoque">✅ Com Estoque (Positivo)</option>
                          <option value="sem_estoque">⚠️ Sem Estoque (Zerado/Negativo)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={ROTULO_MODAL}>Categoria</label>
                        <select 
                          value={filtros.categoria} onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                          className={CAMPO_MODAL}
                        >
                          <option value="">Todas as Categorias</option>
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={ROTULO_MODAL}>Marca</label>
                        <input 
                          type="text" placeholder="Ex: NUEV, Payot..."
                          value={filtros.marca} onChange={(e) => setFiltros({...filtros, marca: e.target.value})}
                          className={`${CAMPO_MODAL} placeholder:text-zinc-400`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={ROTULO_MODAL}>Termo de Variação</label>
                        <input 
                          type="text" placeholder="Ex: Preto, G, 110v..."
                          value={filtros.variacao} onChange={(e) => setFiltros({...filtros, variacao: e.target.value})}
                          className={`${CAMPO_MODAL} placeholder:text-zinc-400`}
                        />
                      </div>

                    </div>
                  </div>

                  <div className="p-6 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
                    <button 
                      onClick={limparFiltros}
                      className="px-6 h-11 text-rose-500 dark:text-rose-400 font-semibold hover:bg-rose-500/10 rounded-full transition-all text-sm active:scale-95"
                    >
                      Limpar Filtros
                    </button>
                    
                    <button 
                      onClick={() => setModalFiltros(false)}
                      className="px-8 h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-full font-semibold transition-all shadow-sm text-sm active:scale-95"
                    >
                      Ver Resultados
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ==========================================
                MODAL DE EXCLUSÃO DE PRODUTO
            ========================================== */}
            {modalDelete.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                <div className={`${PAINEL} rounded-[32px] w-full max-w-md p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200`}>
                  
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative w-20 h-20 mb-6 rounded-[24px] flex items-center justify-center bg-gradient-to-br from-rose-400 to-red-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_16px_34px_-10px_rgba(239,68,68,0.7)]">
                    {modalDelete.temVendas ? <AlertTriangle size={34} strokeWidth={2.2} /> : <Trash2 size={34} strokeWidth={2.2} />}
                  </div>
                  
                  <h2 className="relative text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">Excluir Produto?</h2>
                  <p className="relative text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed px-2">
                    Tem certeza que deseja apagar o produto <strong className="font-semibold text-zinc-800 dark:text-zinc-200">"{modalDelete.produto?.nome}"</strong>? <br />
                    
                    {modalDelete.temVendas 
                      ? <span className="text-orange-600 dark:text-orange-400 font-medium mt-2 block">Cuidado: Este produto já possui vendas. Recomendamos bloqueá-lo para venda para não perder o histórico financeiro.</span> 
                      : <span className="mt-2 block">Esta ação é irreversível e o apagará completamente do seu Hub.</span>}
                  </p>
                  
                  <div className="relative flex gap-3 w-full justify-center">
                    <button 
                      onClick={() => setModalDelete({ open: false, produto: null, temVendas: false })} 
                      className="flex-1 h-12 bg-black/[0.05] hover:bg-black/[0.08] text-zinc-700 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] dark:text-zinc-200 rounded-full font-semibold transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    
                    {modalDelete.temVendas ? (
                      <button 
                        onClick={bloquearProduto} 
                        className="flex-1 h-12 bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-500 text-white rounded-full font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(249,115,22,0.6)] active:scale-95"
                      >
                        Bloquear para venda
                      </button>
                    ) : (
                      <button 
                        onClick={confirmarExclusao} 
                        className="flex-1 h-12 bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-600 text-white rounded-full font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(239,68,68,0.6)] active:scale-95"
                      >
                        Sim, Excluir
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}

        </main>
      </div>
    </div>
  );
}