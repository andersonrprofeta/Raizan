"use client";

import { useState, useEffect, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  ArrowLeft, User as UserIcon, Mail, Phone, MapPin, 
  Building2, CreditCard, ShoppingBag, DollarSign, 
  TrendingUp, Package, ExternalLink, Loader2, Store, 
  Globe, MonitorSmartphone, ChevronLeft, ChevronRight, X,
  Database, Briefcase, ShieldAlert, BadgeCheck, FileText,
  CalendarClock, AlertOctagon, Receipt, DownloadCloud
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from 'react-hot-toast';

function DashboardCliente() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idCliente = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  
  // 🟢 ESTADO NOVO: Prazos do Omie para traduzir o código no nome bonito
  const [condicoesOmie, setCondicoesOmie] = useState([]);

  const [dados, setDados] = useState({
    cliente: null,
    kpis: { total_gasto: 0, ticket_medio: 0, total_pedidos: 0 },
    pedidos: []
  });

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5; 
  const [modalPedido, setModalPedido] = useState({ open: false, pedido: null });

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        return JSON.parse(storedUser).tenant_id;
      }
    }
    return "";
  };

  useEffect(() => {
    if (idCliente) carregarDashboard();
    else { toast.error("ID não encontrado"); router.push('/cadastros/clientes'); }
  }, [idCliente]);

  const carregarDashboard = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      toast.error("Sessão expirada. Faça login novamente.");
      return router.push('/login');
    }

    try {
      // 🟢 1. Busca os Prazos soltos (Igualzinho ao Editar, sem travar a tela principal)
      fetch(`https://api.raizan.com.br/api/hub/integracoes/omie/condicoes-pagamento`, {
        headers: { "x-tenant-id": tenantId }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setCondicoesOmie(data.condicoes || []);
      }).catch(() => {});

      // 🟢 2. Busca os dados reais do Dashboard
      const res = await fetch(`https://api.raizan.com.br/api/hub/clientes/${idCliente}/dashboard`, {
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId }
      });
      const data = await res.json();
      
      if (data.success) setDados(data);
      else { toast.error("Cliente não encontrado."); router.push('/cadastros/clientes'); }
    } catch (error) {
      toast.error("Erro ao carregar a Visão 360º.");
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatarData = (dataStr) => new Date(dataStr).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

  const calcularDiasSemCompra = () => {
    if (!dados.pedidos || dados.pedidos.length === 0) return "Sem histórico";
    
    const statusValidos = ['entregue', 'completed', 'faturado', 'enviado', 'pago', 'aprovado'];
    const pedidosValidos = dados.pedidos.filter(p => statusValidos.includes((p.status_pedido || p.status || '').toLowerCase()));

    if (pedidosValidos.length === 0) return "Nenhuma compra faturada";

    const ultimoPedido = new Date(pedidosValidos[0].created_at);
    const hoje = new Date();
    
    const diffTempo = Math.abs(hoje - ultimoPedido);
    const diffDias = Math.floor(diffTempo / (1000 * 60 * 60 * 24)); 
    
    if (diffDias === 0) return "Comprou hoje!";
    if (diffDias === 1) return "1 dia";
    return `${diffDias} dias`;
  };

  const getCanalFavorito = () => {
    if (!dados.pedidos || dados.pedidos.length === 0) return { nome: "Nenhum", icon: <Store size={14} /> };
    
    const contagem = {};
    let maxCount = 0;
    let favorito = "";
    
    dados.pedidos.forEach(p => {
      const origem = (p.origem || 'manual').toLowerCase();
      contagem[origem] = (contagem[origem] || 0) + 1;
      if (contagem[origem] > maxCount) {
        maxCount = contagem[origem];
        favorito = origem;
      }
    });

    if (favorito.includes('omie')) return { nome: "Omie ERP", icon: <Database size={14} className="text-emerald-500" /> };
    if (favorito.includes('woo')) return { nome: "WooCommerce", icon: <Globe size={14} className="text-purple-500" /> };
    if (favorito.includes('b2b')) return { nome: "Portal B2B", icon: <MonitorSmartphone size={14} className="text-blue-500" /> };
    if (favorito.includes('raizan') || favorito.includes('seller') || favorito.includes('forca')) return { nome: "Raizan Seller", icon: <Briefcase size={14} className="text-orange-500" /> };
    
    return { nome: "Manual / PDV", icon: <Store size={14} className="text-zinc-500" /> };
  };

  const renderStatusPedido = (status) => {
    switch(status?.toLowerCase()) {
      case 'entregue': 
      case 'completed': 
      case 'faturado': 
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">Entregue</span>;
      case 'enviado': 
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">Enviado</span>;
      case 'cancelado': 
      case 'cancelled': 
      case 'refunded':
      case 'falhou':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-500/20">Cancelado</span>;
      default: 
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">Pendente</span>;
    }
  };

  const renderBadgeOrigem = (origem) => {
    const nome = (origem || "").toLowerCase();
    
    if (nome.includes('omie')) {
      return (
        <span className="flex items-center gap-1 w-fit bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-1.5">
          <Database size={10} /> Omie ERP
        </span>
      );
    }
    if (nome.includes('woo')) {
      return (
        <span className="flex items-center gap-1 w-fit bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-1.5">
          <Globe size={10} /> WooCommerce
        </span>
      );
    }
    if (nome.includes('b2b')) {
      return (
        <span className="flex items-center gap-1 w-fit bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-1.5">
          <MonitorSmartphone size={10} /> Portal B2B
        </span>
      );
    }
    if (nome.includes('raizan') || nome.includes('seller') || nome.includes('forca')) {
      return (
        <span className="flex items-center gap-1 w-fit bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-1.5">
          <Briefcase size={10} /> Raizan Seller
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 w-fit bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-1.5">
        <Store size={10} /> Manual
      </span>
    );
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={40} className="text-indigo-500 animate-spin" /></div>;
  }

  if (!dados.cliente) return null; 

  const { cliente, kpis, pedidos } = dados;
  const canalFavorito = getCanalFavorito();
  
  const documentoLimpo = cliente.cpf_cnpj ? String(cliente.cpf_cnpj).replace(/\D/g, '') : '';
  const isPJ = cliente.tipo_pessoa === 'juridica' || documentoLimpo.length > 11;
  
  let endereco = {};
  let metadata = {};
  try { endereco = typeof cliente.endereco_json === 'string' ? JSON.parse(cliente.endereco_json) : (cliente.endereco_json || {}); } catch(e){}
  try { metadata = typeof cliente.metadata_json === 'string' ? JSON.parse(cliente.metadata_json) : (cliente.metadata_json || {}); } catch(e){}

  const totalPaginas = Math.ceil(pedidos.length / itensPorPagina);
  const indexUltimoPedido = paginaAtual * itensPorPagina;
  const indexPrimeiroPedido = indexUltimoPedido - itensPorPagina;
  const pedidosPaginados = pedidos.slice(indexPrimeiroPedido, indexUltimoPedido);

  const tituloErp = cliente.origem?.includes('omie') ? "Financeiro e CRM (Omie)" : "Financeiro e CRM (ERP)";

  const valorEmAberto = metadata.valor_em_aberto || metadata.total_a_vencer || 0; 
  const limiteDeCredito = metadata.limite_credito || 0;
  
  // 🟢 Pega os códigos permitidos
  const condicoesPermitidas = metadata.condicoes_permitidas || [];

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cadastros/clientes">
              <button className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm text-zinc-500">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Visão 360º do Cliente</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Métricas e histórico completo.</p>
            </div>
          </div>
          
          <Link href={`/cadastros/clientes/editar?id=${cliente.id}`}>
            <button className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-bold transition-colors shadow-sm text-sm">
              Editar Registo
            </button>
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden md:col-span-2">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="font-bold text-indigo-50 uppercase tracking-wider text-xs">Total Gasto (LTV)</p>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <DollarSign size={20} className="text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-black relative z-10 tracking-tight">{formatarMoeda(kpis.total_gasto)}</h3>
          </div>

          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Total de Pedidos</p>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 relative z-10">{kpis.total_pedidos}</h3>
          </div>

          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Ticket Médio</p>
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 relative z-10">{formatarMoeda(kpis.ticket_medio)}</h3>
          </div>
        </div>

        {/* Layout de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="lg:col-span-1 space-y-6">
            
            {/* Bloco 1: Informações de Contato */}
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-3xl font-black border-4 border-white dark:border-[#0c0c0e] shadow-lg mb-4">
                  {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : <UserIcon size={32} />}
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{cliente.nome}</h2>
                
                {/* 🟢 EXIBE O NOME FANTASIA SE EXISTIR */}
                {metadata.nome_fantasia && (
                  <p className="text-sm font-medium text-zinc-500 mt-1">Fantasia: {metadata.nome_fantasia}</p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <p className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    {isPJ ? <><Building2 size={12}/> PJ</> : <><UserIcon size={12}/> PF</>}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full flex items-center gap-1">
                    {canalFavorito.icon} {canalFavorito.nome}
                  </p>
                </div>
              </div>

              <div className="pt-6 space-y-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 mb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                    <CalendarClock size={16} /> Última Compra
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/50 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-1 rounded-md">
                    {calcularDiasSemCompra()}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <Mail size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">E-mail</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{cliente.email || "Não informado"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <Phone size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Telefone</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cliente.telefone || "Não informado"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <CreditCard size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{isPJ ? 'CNPJ' : 'CPF'}</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cliente.cpf_cnpj || "Não informado"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <MapPin size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Endereço Principal</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      {endereco.logradouro ? `${endereco.logradouro}, ${endereco.numero || 'S/N'} - ${endereco.bairro}` : "Nenhum endereço registado."}
                      <br/>
                      {endereco.cidade && <span className="text-zinc-500 text-xs">{endereco.cidade} / {endereco.uf}</span>}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* 🟢 Bloco 2: O FAROL FINANCEIRO (AGORA COM OS TÍTULOS CUSPINDO NA CARA) */}
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <Briefcase size={16} className="text-zinc-400" /> {tituloErp}
              </h3>
              
              <div className="space-y-4">
                
                {/* Status no ERP */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {metadata.bloqueado ? <ShieldAlert size={16} className="text-rose-500" /> : <BadgeCheck size={16} className="text-emerald-500" />}
                    Situação de Faturamento
                  </div>
                  {metadata.bloqueado ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-1 rounded-md">Bloqueado</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-md">Ativo</span>
                  )}
                </div>

                {/* Títulos em Aberto (Sempre Visível) */}
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-400">
                      <AlertOctagon size={16} className="text-rose-500" />
                      Boletos a Vencer / Atraso
                    </div>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {formatarMoeda(valorEmAberto)}
                    </span>
                  </div>

                  {/* 🟢 AQUI ENTRA A LISTA DE TÍTULOS CUSPINDO NA CARA */}
                  {metadata.titulos_em_aberto && metadata.titulos_em_aberto.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {metadata.titulos_em_aberto.map((titulo, idx) => (
                        <div key={idx} className="flex flex-col p-2.5 bg-rose-100/50 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 pr-2 leading-tight">
                              🚨 {titulo.situacao}
                            </span>
                            <span className="text-xs font-black text-rose-700 dark:text-rose-400 shrink-0">
                              {formatarMoeda(titulo.valor)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium uppercase tracking-wider">
                            <span>Venc: {titulo.vencimento}</span>
                            {titulo.dias_atraso > 0 && (
                              <span className="bg-rose-200 dark:bg-rose-800 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-200 font-bold">
                                {titulo.dias_atraso} dias de atraso
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {valorEmAberto > 0 && (
                    <button 
                      onClick={() => toast.success("Integração com o Portal B2B em breve!")}
                      className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-white dark:bg-rose-950 border border-rose-200 dark:border-rose-800/50 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                    >
                      <Receipt size={14} /> 2ª Via / Notas Fiscais no Portal
                    </button>
                  )}
                </div>

                {/* Limite de Crédito (Sempre Visível) */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <DollarSign size={16} className="text-emerald-500" />
                    Limite de Crédito
                  </div>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {formatarMoeda(limiteDeCredito)}
                  </span>
                </div>

                {/* Vendedor Responsável */}
                <div className="flex items-start gap-3 mt-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <UserIcon size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vendedor Responsável</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {cliente.nome_vendedor || "Não atribuído"}
                      {cliente.codigo_vendedor && <span className="text-xs text-zinc-500 font-normal ml-1">(Cód: {cliente.codigo_vendedor})</span>}
                    </p>
                  </div>
                </div>

                {/* 🟢 CONDIÇÕES DE PAGAMENTO (PADRÃO E LIBERADOS PRO APP) */}
                <div className="flex items-start gap-3 mt-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                    <CreditCard size={14} className="text-indigo-500" />
                  </div>
                  <div className="pt-0.5">
                    {metadata.condicao_pagamento_padrao && (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Condição Padrão</p>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{metadata.condicao_pagamento_padrao}</p>
                      </div>
                    )}
                    
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Prazos Liberados (App Seller)</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {condicoesOmie.length === 0 ? (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Traduzindo códigos...</span>
                      ) : condicoesPermitidas.length === 0 ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">
                          🟢 Todos os prazos liberados
                        </span>
                      ) : (
                        condicoesPermitidas.map(codigo => {
                          const cond = condicoesOmie.find(c => String(c.codigo) === String(codigo));
                          return (
                            <span key={codigo} className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-500/30">
                              {cond ? cond.descricao : `Cód: ${codigo}`}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 🟢 NOVO BLOCO: OBSERVAÇÕES DO CLIENTE */}
            {metadata.observacoes && (
              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={16} /> Observações do Cliente
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-400 leading-relaxed whitespace-pre-wrap">
                  {metadata.observacoes}
                </p>
              </div>
            )}

          </div>

          {/* Coluna 2: Histórico de Pedidos Paginado */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <Package size={20} className="text-indigo-500" /> Histórico de Encomendas
                </h2>
                <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full">
                  {pedidos.length} Registos
                </span>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800/60">
                    <tr>
                      <th className="px-6 py-4 uppercase tracking-wider text-xs">Pedido / Canal</th>
                      <th className="px-6 py-4 uppercase tracking-wider text-xs">Data</th>
                      <th className="px-6 py-4 uppercase tracking-wider text-xs">Volumes</th>
                      <th className="px-6 py-4 text-center uppercase tracking-wider text-xs">Estado</th>
                      <th className="px-6 py-4 text-right uppercase tracking-wider text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {pedidos.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-zinc-500">
                          <ShoppingBag size={40} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                          <p className="font-medium text-base text-zinc-600 dark:text-zinc-400">Nenhuma compra registrada.</p>
                        </td>
                      </tr>
                    ) : (
                      pedidosPaginados.map((pedido) => {
                        const totalItens = pedido.itens ? pedido.itens.reduce((acc, item) => acc + (item.quantidade || 1), 0) : 0;

                        return (
                          <tr 
                            key={pedido.id} 
                            onClick={() => setModalPedido({ open: true, pedido })}
                            className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <span className="font-black text-indigo-600 dark:text-indigo-400 block text-base leading-none">
                                #{pedido.codigo_externo || pedido.id}
                              </span>
                              {renderBadgeOrigem(pedido.origem)}
                            </td>

                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                              {formatarData(pedido.created_at).split(' ')[0]} <br/>
                              <span className="text-xs opacity-60">{formatarData(pedido.created_at).split(' ')[1]}</span>
                            </td>
                            
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <Package size={14} className="text-zinc-400" /> {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-center">
                              {renderStatusPedido(pedido.status_pedido || pedido.status)}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">{formatarMoeda(pedido.valor_total || pedido.total)}</span>
                                <ExternalLink size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controles de Paginação */}
              {totalPaginas > 1 && (
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/10">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Página <strong className="text-zinc-900 dark:text-zinc-100">{paginaAtual}</strong> de <strong className="text-zinc-900 dark:text-zinc-100">{totalPaginas}</strong>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                      disabled={paginaAtual === 1}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <button 
                      onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                      disabled={paginaAtual === totalPaginas}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 🟢 MODAL DE DETALHES DO PEDIDO (GLASSMORPHISM) */}
      {modalPedido.open && modalPedido.pedido && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
            
            {/* Header do Modal */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                    Pedido #{modalPedido.pedido.codigo_externo || modalPedido.pedido.id}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {formatarData(modalPedido.pedido.created_at)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                    {renderStatusPedido(modalPedido.pedido.status_pedido || modalPedido.pedido.status)}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setModalPedido({ open: false, pedido: null })}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body do Modal (Lista de Produtos) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#0c0c0e]">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Itens da Encomenda</h3>
              
              {!modalPedido.pedido.itens || modalPedido.pedido.itens.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 italic text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  Detalhes dos itens não sincronizados.
                </div>
              ) : (
                <div className="space-y-3">
                  {modalPedido.pedido.itens.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-black text-zinc-500 dark:text-zinc-400 text-xs">
                        {item.quantidade}x
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{item.nome_produto}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Cód: {item.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Valor Total</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {formatarMoeda(modalPedido.pedido.valor_total || modalPedido.pedido.total)}
              </span>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}

export default function DetalhesCliente() {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 size={40} className="text-indigo-500 animate-spin" /></div>}>
          <DashboardCliente />
        </Suspense>
      </div>
    </div>
  );
}