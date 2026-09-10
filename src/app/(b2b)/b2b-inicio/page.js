"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  CreditCard, ShoppingBag, Calendar, Store, 
  ArrowRight, Package, Receipt, FileText,
  Zap, Tag, X, ShoppingCart, AlertCircle, Sparkles, ShieldCheck 
} from "lucide-react";
import Link from "next/link";
import { getApiUrl, getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast'; 

// ==========================================
// FUNÇÃO DE IDENTIDADE SEGURA
// ==========================================
const obterTenantSeguro = () => {
  if (process.env.NEXT_PUBLIC_TENANT_ID) return process.env.NEXT_PUBLIC_TENANT_ID;
  if (typeof window !== 'undefined') {
    try {
      const userRaw = localStorage.getItem("@raizan:user");
      if (userRaw) {
        const userObj = JSON.parse(userRaw);
        if (userObj.tenant_id) return userObj.tenant_id;
        if (userObj.cnpj) return userObj.cnpj;
      }
      const configRaw = localStorage.getItem("raizan_config_geral");
      if (configRaw) {
        const configObj = JSON.parse(configRaw);
        if (configObj.tenantId) return configObj.tenantId;
      }
    } catch(e) {}
  }
  return null; 
};

// ==========================================
// FUNÇÃO GLOBAL DE MOEDA
// ==========================================
const formatarMoedaGlobal = (valor) => {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// ==========================================
// COMPONENTE: MODAL DE OFERTAS (VISUAL RAIZAN)
// ==========================================
function ModalOfertasDoDia({ isOpen, onClose, ofertas, onComprar }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#121214] border-t sm:border border-purple-200 dark:border-purple-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.15)] w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 opacity-20"><Tag size={120} /></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="fill-white text-white" size={24} /> Ofertas Exclusivas
              </h2>
              <p className="text-purple-100 text-xs sm:text-sm mt-1">Aproveite os descontos especiais para o seu cadastro hoje!</p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-md"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 bg-zinc-50/50 dark:bg-transparent">
          {ofertas.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 font-medium">Nenhuma oferta relâmpago ativa no momento.</div>
          ) : (
            ofertas.map(promo => (
              <div key={promo.sku} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-500/50 transition-all group gap-4 shadow-sm dark:shadow-none">
                <div className="flex-1 w-full">
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-500/20 inline-block mb-2">
                    SKU {promo.sku}
                  </span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 leading-snug text-sm sm:text-base">{promo.nome_produto}</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mt-2">{formatarMoedaGlobal(promo.preco_promocional)}</p>
                </div>
                
                <button 
                  onClick={() => {
                    onComprar({
                      id: promo.sku,
                      sku: promo.sku,
                      nome: promo.nome_produto,
                      preco_venda: promo.preco_promocional, 
                      em_promocao: true,
                      preco_promocional: promo.preco_promocional,
                      qtd_minima_promocao: promo.qtd_minima || 1
                    }, 1);
                    toast.success("Oferta adicionada ao carrinho!");
                  }} 
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  <ShoppingCart size={18} /> Adicionar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TELA PRINCIPAL: INÍCIO B2B
// ==========================================
export default function B2BInicio() {
  const [user, setUser] = useState(null);
  
  const [isOfertasModalOpen, setIsOfertasModalOpen] = useState(false);
  const [listaOfertas, setListaOfertas] = useState([]);
  const [temCarrinho, setTemCarrinho] = useState(false);
  
  const [verificandoCadastro, setVerificandoCadastro] = useState(true);

  const [dadosDinamicos, setDadosDinamicos] = useState({
    ultima_compra: null,
    status_ultimo_pedido: null, // 🟢 NOVO!
    limite_credito: null,
    valor_em_aberto: 0,         // 🟢 NOVO!
    prazos_liberados: null
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("raizan_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setDadosDinamicos({
        ultima_compra: parsedUser.ultima_compra,
        status_ultimo_pedido: parsedUser.status_ultimo_pedido,
        limite_credito: parsedUser.limite_credito,
        valor_em_aberto: parsedUser.valor_em_aberto || 0,
        prazos_liberados: parsedUser.prazos_liberados
      });
    } else {
      window.location.href = "/login-b2b";
    }
  }, []);

  useEffect(() => {
    const checarCarrinho = () => {
      const cartRaw = localStorage.getItem("@raizan:carrinho");
      if (cartRaw) {
        try {
          const cartObj = JSON.parse(cartRaw);
          setTemCarrinho(Object.keys(cartObj).length > 0);
        } catch (e) { setTemCarrinho(false); }
      } else {
        setTemCarrinho(false);
      }
    };

    checarCarrinho();
    window.addEventListener('storage', checarCarrinho);
    return () => window.removeEventListener('storage', checarCarrinho);
  }, []);

  // 🟢 BUSCADOR SILENCIOSO 2.0 (LIMITES E FATURAS EM ABERTO)
  useEffect(() => {
    if (!user) return;

    const buscarDadosBackground = async () => {
      try {
        const tenantId = obterTenantSeguro();
        const customHeaders = getHeaders();
        if (tenantId) customHeaders["x-tenant-id"] = tenantId;

        const [resPedidos, resCliente] = await Promise.all([
          fetch(`${getHubUrl()}/api/hub/pedidos/b2b`, {
            method: "POST",
            headers: { ...customHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ page: 1, limit: 1, clienteEmail: user.email })
          }).catch(() => null),
          fetch(`${getHubUrl()}/api/hub/clientes`, { headers: customHeaders }).catch(() => null)
        ]);

        // 1. Processa a Última Compra E o Status Atual dela
        let ultimaDataStr = null;
        let ultimoStatusStr = null;
        if (resPedidos) {
          const dataPedidos = await resPedidos.json().catch(() => ({}));
          if (dataPedidos.success && dataPedidos.pedidos && dataPedidos.pedidos.length > 0) {
            const ultimoPed = dataPedidos.pedidos[0];
            ultimaDataStr = ultimoPed.date_created || ultimoPed.data_criacao;
            ultimoStatusStr = ultimoPed.status || ultimoPed.status_pedido || 'processando';
            
            setDadosDinamicos(prev => ({ 
              ...prev, 
              ultima_compra: ultimaDataStr,
              status_ultimo_pedido: ultimoStatusStr
            }));
          }
        }

        // 2. Processa o Limite e as Faturas em Aberto do Cadastro Mestre
        if (resCliente) {
          const dataCliente = await resCliente.json().catch(() => ({}));
          
          if (dataCliente.success) {
            const meuCadastro = dataCliente.clientes.find(c => 
              c.email === user.email || 
              (c.cpf_cnpj && user.cnpj && c.cpf_cnpj.replace(/\D/g, '') === user.cnpj.replace(/\D/g, ''))
            );

            if (meuCadastro) {
              let endObj = meuCadastro.endereco_json;
              if (typeof endObj === 'string') { try { endObj = JSON.parse(endObj); } catch(e) { endObj = {}; } }
              
              let metaObj = {};
              if (meuCadastro.metadata_json) {
                try { metaObj = JSON.parse(meuCadastro.metadata_json); } catch(e) {}
              }

              const novoLimiteCredito = metaObj.limite_credito !== undefined ? Number(metaObj.limite_credito) : 0;
              const faturasEmAberto = metaObj.valor_em_aberto || metaObj.total_a_vencer || 0;

              // Salvamos a condição do omie caso queira exibir depois no checkout, 
              // mas tiramos o Array mapeado da tela principal!
              const condicoesPermitidas = metaObj.condicoes_permitidas || [];

              const userAtualizado = {
                ...user,
                telefone: meuCadastro.telefone || user.telefone,
                endereco: endObj || user.endereco,
                limite_credito: novoLimiteCredito,
                valor_em_aberto: faturasEmAberto,
                prazos_liberados: condicoesPermitidas,
                ultima_compra: ultimaDataStr,
                status_ultimo_pedido: ultimoStatusStr
              };
              
              setUser(userAtualizado);
              setDadosDinamicos(prev => ({
                ...prev,
                limite_credito: novoLimiteCredito,
                valor_em_aberto: faturasEmAberto
              }));
              localStorage.setItem("raizan_user", JSON.stringify(userAtualizado)); 
            }
          }
        }
      } catch (e) {
        console.log("Aviso: Sincronização background falhou silenciosamente.");
      } finally {
        setVerificandoCadastro(false);
      }
    };

    buscarDadosBackground();
  }, [user?.email]);

  useEffect(() => {
    const abrirModal = () => {
      setIsOfertasModalOpen(true);
      carregarListaOfertasGlobais();
    };
    window.addEventListener('abrirOfertasB2B', abrirModal);
    return () => window.removeEventListener('abrirOfertasB2B', abrirModal);
  }, []);

  const carregarListaOfertasGlobais = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/promocoes`, { headers: getHeaders() });
      const data = await res.json();
      if(data.success) {
        const hoje = new Date();
        const ofertasAtivas = data.promocoes.filter(promo => {
          const inicio = new Date(promo.data_inicio);
          const fim = new Date(promo.data_fim);
          fim.setHours(23, 59, 59);
          return promo.ativo && hoje >= inicio && hoje <= fim;
        });
        setListaOfertas(ofertasAtivas);
      }
    } catch(e) {}
  };

  const adicionarOfertaAoCarrinho = (produto, qtd) => {
    const carrinhoSalvo = localStorage.getItem("@raizan:carrinho");
    let carrinhoAtual = {};
    if (carrinhoSalvo) { try { carrinhoAtual = JSON.parse(carrinhoSalvo); } catch (e) {} }

    const id = produto.id || produto.PDCODPRO;
    if (carrinhoAtual[id]) {
      carrinhoAtual[id].qtd += qtd;
    } else {
      carrinhoAtual[id] = { ...produto, qtd };
    }

    localStorage.setItem("@raizan:carrinho", JSON.stringify(carrinhoAtual));
    setTemCarrinho(true); 
    window.dispatchEvent(new Event('storage'));
  };

  const formatarData = (dataString) => {
    if (!dataString) return "Sem histórico";
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return "Sem histórico";
      return data.toLocaleDateString("pt-BR");
    } catch { return dataString; }
  };

  const renderLimiteCredito = (valor) => {
    const num = parseFloat(valor);
    if (isNaN(num) || num <= 0) {
      return <span className="text-lg sm:text-xl text-zinc-400 dark:text-zinc-500 font-medium tracking-normal">Sob Consulta</span>;
    }
    return formatarMoedaGlobal(num);
  };

  if (!user) return null; 

  let enderecoObj = user.endereco;
  if (typeof enderecoObj === 'string') {
    try { enderecoObj = JSON.parse(enderecoObj); } catch (e) { enderecoObj = {}; }
  }

  const hasTelefone = Boolean(user.telefone || enderecoObj?.telefone || enderecoObj?.phone);
  const hasCep = Boolean(enderecoObj?.cep || enderecoObj?.postcode);

  const isPerfilIncompleto = (!hasTelefone || !hasCep) && !verificandoCadastro;

  const handlePedidoClick = (e) => {
    if (verificandoCadastro) {
      e.preventDefault();
      return toast.loading("Sincronizando dados, aguarde...", { duration: 1500 });
    }
    if (isPerfilIncompleto) {
      e.preventDefault();
      toast.error("Antes de fazer um pedido, atualize seu endereço de entrega!", { duration: 4000 });
      window.location.href = "/b2b-perfil";
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] overflow-hidden transition-colors duration-300">
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative">
          
          <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-purple-600/10 dark:bg-purple-600/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Olá, <span className="text-purple-600 dark:text-purple-400">{user.nome}</span> 👋
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
                  Bem-vindo ao portal exclusivo de compras da distribuidora.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[10px] sm:text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm font-mono tracking-wider">
                    {user.cnpj?.length > 11 ? "CNPJ" : "CPF"}: {user.cnpj}
                  </span>
                </div>
              </div>
              
              <Link 
                href={isPerfilIncompleto ? "/b2b-perfil" : "/b2b-pedidos"}
                onClick={handlePedidoClick}
                className={`${temCarrinho ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)]'} text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-max h-max ${verificandoCadastro ? 'opacity-80 pointer-events-none' : ''}`}
              >
                {temCarrinho ? <ShoppingCart size={18} /> : <Store size={18} />}
                {temCarrinho ? "Continuar Pedido" : "Fazer Novo Pedido"}
              </Link>
            </div>

            {isPerfilIncompleto && (
              <div className="bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-md border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-rose-500/20 rounded-full text-rose-600 dark:text-rose-400 shrink-0 shadow-sm border border-rose-100 dark:border-transparent">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-rose-800 dark:text-rose-300">Ação Necessária: Finalize seu Cadastro</h3>
                    <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400/80 mt-1 max-w-2xl">
                      Para realizar novos pedidos ou aproveitar as ofertas, precisamos que você nos informe o seu <b>Endereço de Entrega</b> e <b>Telefone</b>.
                    </p>
                  </div>
                </div>
                <Link href="/b2b-perfil" className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] whitespace-nowrap text-center shrink-0">
                  Completar Agora
                </Link>
              </div>
            )}

            {/* 2. CARDS DE MÉTRICAS (GLASSMORPHISM ESTILO APPLE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Card 1: Limite de Crédito */}
              <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-lg shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-colors duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shadow-inner">
                    <CreditCard size={20} className="text-purple-600 dark:text-purple-400 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mb-1">Limite de Crédito</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight h-8 sm:h-9 flex items-center truncate">
                  {renderLimiteCredito(dadosDinamicos.limite_credito)}
                </h2>
                <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-500/70 mt-2 sm:mt-3 font-medium flex items-center gap-1">
                  <ArrowRight size={12} /> Status atual no ERP
                </p>
              </div>

              {/* 🟢 Card 2 (NOVO): Faturas em Aberto */}
              <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-lg shadow-zinc-200/20 dark:shadow-none transition-colors duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shadow-inner ${dadosDinamicos.valor_em_aberto > 0 ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'}`}>
                    <Receipt size={20} className={`sm:w-6 sm:h-6 ${dadosDinamicos.valor_em_aberto > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mb-1">Faturas em Aberto</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight h-8 sm:h-9 flex items-center truncate">
                  {dadosDinamicos.valor_em_aberto > 0 ? formatarMoedaGlobal(dadosDinamicos.valor_em_aberto) : "R$ 0,00"}
                </h2>
                <p className={`text-[10px] sm:text-xs mt-2 sm:mt-3 font-medium flex items-center gap-1 ${dadosDinamicos.valor_em_aberto > 0 ? 'text-amber-600 dark:text-amber-500/70' : 'text-emerald-600 dark:text-emerald-500/70'}`}>
                  {dadosDinamicos.valor_em_aberto > 0 ? <><AlertCircle size={12} /> Boletos pendentes no ERP</> : <><ShieldCheck size={12} /> Tudo em dia!</>}
                </p>
              </div>

              {/* 🟢 Card 3 (NOVO): Última Compra + Status do Pedido */}
              <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-lg shadow-zinc-200/20 dark:shadow-none transition-colors duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shadow-inner">
                    <ShoppingBag size={20} className="text-indigo-600 dark:text-indigo-400 sm:w-6 sm:h-6" />
                  </div>
                  {dadosDinamicos.status_ultimo_pedido && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {dadosDinamicos.status_ultimo_pedido}
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mb-1">Data Último Pedido</p>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 h-7 sm:h-8">
                  {formatarData(dadosDinamicos.ultima_compra)}
                </h2>
                <Link href="/b2b-historico" className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 font-medium flex items-center gap-1 transition-colors w-max">
                  Acompanhar entrega <ArrowRight size={12} />
                </Link>
              </div>

            </div>

            {/* 3. MENU RÁPIDO (Ações) */}
            <div className={isPerfilIncompleto ? "opacity-50 pointer-events-none grayscale transition-all" : "transition-all"}>
              <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-3 sm:mb-4 px-2">Acesso Rápido</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                
                <Link href="/b2b-pedidos" className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none hover:shadow-md">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                    <Package size={20} className="text-purple-600 dark:text-purple-400 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-tight">Catálogo de Produtos</span>
                </Link>

                <Link href="/b2b-historico" className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none hover:shadow-md">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                    <ShoppingBag size={20} className="text-indigo-600 dark:text-indigo-400 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-tight">Meus Pedidos</span>
                </Link>

                <Link href="/b2b-financeiro" className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none hover:shadow-md">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                    <Receipt size={20} className="text-pink-600 dark:text-pink-400 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-tight">2ª Via de Boletos</span>
                </Link>

                <Link href="/b2b-xml" className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none hover:shadow-md">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-100 dark:bg-zinc-700/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={20} className="text-zinc-500 dark:text-zinc-400 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-tight">Baixar Notas (XML)</span>
                </Link>

              </div>
            </div>

          </div>
        </main>
      </div>

      <ModalOfertasDoDia 
        isOpen={isOfertasModalOpen} 
        onClose={() => setIsOfertasModalOpen(false)} 
        ofertas={listaOfertas} 
        onComprar={adicionarOfertaAoCarrinho} 
      />

    </div>
  );
}