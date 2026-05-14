"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  CreditCard, ShoppingBag, Calendar, Store, 
  ArrowRight, Package, Receipt, FileText,
  Zap, Tag, X, ShoppingCart, AlertCircle 
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
// FUNÇÃO GLOBAL DE MOEDA (Para o modal enxergar)
// ==========================================
const formatarMoedaGlobal = (valor) => {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// ==========================================
// COMPONENTE: MODAL DE OFERTAS DO DIA (RESPONSIVO MODO GAVETA)
// ==========================================
function ModalOfertasDoDia({ isOpen, onClose, ofertas, onComprar }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#0c0c0e] border-t sm:border border-rose-200 dark:border-rose-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.15)] w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-4 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 opacity-20"><Tag size={120} /></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="fill-white text-white" /> Ofertas Exclusivas
              </h2>
              <p className="text-rose-100 text-xs sm:text-sm mt-1">Aproveite os descontos especiais para o seu CNPJ hoje!</p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          {ofertas.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">Nenhuma oferta relâmpago ativa no momento.</div>
          ) : (
            ofertas.map(promo => (
              <div key={promo.sku} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500/50 transition-all group gap-4 shadow-sm dark:shadow-none">
                <div className="flex-1 w-full">
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-500/20 inline-block mb-2">
                    SKU {promo.sku}
                  </span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 leading-snug text-sm sm:text-base">{promo.nome_produto}</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{formatarMoedaGlobal(promo.preco_promocional)}</p>
                </div>
                
                <button 
                  onClick={() => {
                    onComprar({
                      PDCODPRO: promo.sku,
                      PDNOME: promo.nome_produto,
                      PDPRECO: promo.preco_promocional, 
                      em_promocao: true,
                      preco_promocional: promo.preco_promocional
                    }, 1);
                    toast.success("Oferta adicionada ao carrinho!");
                  }} 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
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
  
  // ESTADOS DO MODAL DE OFERTAS E CARRINHO
  const [isOfertasModalOpen, setIsOfertasModalOpen] = useState(false);
  const [listaOfertas, setListaOfertas] = useState([]);
  const [temCarrinho, setTemCarrinho] = useState(false);

  // ESTADO PARA OS DADOS DINÂMICOS DA HOME
  const [dadosDinamicos, setDadosDinamicos] = useState({
    ultima_compra: null,
    limite_credito: null,
    prazos_liberados: null
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("raizan_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setDadosDinamicos({
        ultima_compra: parsedUser.ultima_compra,
        limite_credito: parsedUser.limite_credito,
        prazos_liberados: parsedUser.prazos_liberados
      });
    } else {
      window.location.href = "/login-b2b";
    }
  }, []);

  // RADAR DO CARRINHO (Checa se tem item pendente)
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

  // BUSCADOR SILENCIOSO DOS DADOS DINÂMICOS
  useEffect(() => {
    if (!user) return;

    const buscarResumoAtualizado = async () => {
      try {
        const tenantId = obterTenantSeguro();
        const customHeaders = getHeaders();
        if (tenantId) customHeaders["x-tenant-id"] = tenantId;

        const resPedidos = await fetch(`${getHubUrl()}/api/hub/pedidos/b2b`, {
          method: "POST",
          headers: { ...customHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ page: 1, limit: 1, clienteEmail: user.email })
        });
        const dataPedidos = await resPedidos.json();

        if (dataPedidos.success && dataPedidos.pedidos && dataPedidos.pedidos.length > 0) {
          const ultimaData = dataPedidos.pedidos[0].date_created || dataPedidos.pedidos[0].data_criacao;
          setDadosDinamicos(prev => ({ ...prev, ultima_compra: ultimaData }));
        }
      } catch (e) {
        console.log("Aviso: Não foi possível atualizar os dados silenciosamente.");
      }
    };

    buscarResumoAtualizado();
  }, [user]);

  // ESCUTADOR DO HEADER PARA ABRIR O MODAL
  useEffect(() => {
    const abrirModal = () => {
      setIsOfertasModalOpen(true);
      carregarListaOfertasGlobais();
    };
    window.addEventListener('abrirOfertasB2B', abrirModal);
    return () => window.removeEventListener('abrirOfertasB2B', abrirModal);
  }, []);

  // BUSCA AS OFERTAS DIRETAMENTE DO BANCO
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
    } catch(e) { console.error("Erro ao buscar ofertas do modal"); }
  };

  const adicionarOfertaAoCarrinho = (produto, qtd) => {
    const carrinhoSalvo = localStorage.getItem("@raizan:carrinho");
    let carrinhoAtual = {};
    
    if (carrinhoSalvo) {
      try { carrinhoAtual = JSON.parse(carrinhoSalvo); } catch (e) {}
    }

    const id = produto.PDCODPRO;
    
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
    if (!dataString) return "Sem compras recentes";
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return "Sem compras recentes";
      return data.toLocaleDateString("pt-BR");
    } catch {
      return dataString;
    }
  };

  const renderLimiteCredito = (valor) => {
    const num = parseFloat(valor);
    if (isNaN(num) || num <= 0) {
      return <span className="text-lg sm:text-xl text-amber-500 dark:text-amber-400 font-semibold tracking-normal">Sob Consulta</span>;
    }
    return formatarMoedaGlobal(num);
  };

  const renderPrazos = (prazos) => {
    if (Array.isArray(prazos)) {
      if (prazos.length === 0) return "À vista ou Sob Consulta";
      return prazos.join(" | "); 
    }
    if (!prazos || String(prazos).trim() === "" || prazos === "0") {
      return "À vista ou Sob Consulta";
    }
    return prazos;
  };

  if (!user) return null; 

  // 🟢 LÓGICA DO ALERTA DE CADASTRO
  const isPerfilIncompleto = !user.telefone || !user.endereco || !user.endereco.cep;

  const handlePedidoClick = (e) => {
    if (isPerfilIncompleto) {
      e.preventDefault(); // Impede de ir pro catálogo
      toast.error("Antes de fazer um pedido, atualize seu endereço de entrega!", { duration: 4000 });
      window.location.href = "/b2b-perfil"; // Força a ida pro perfil
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] overflow-hidden transition-colors duration-300">
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative">
          
          <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-emerald-600/10 dark:bg-emerald-600/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
            
            {/* 1. CABEÇALHO DE BOAS VINDAS */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Olá, <span className="text-emerald-600 dark:text-emerald-400">{user.nome}</span> 👋
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
                  Bem-vindo ao portal exclusivo de compras da distribuidora.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-zinc-200 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-[10px] sm:text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 font-mono">
                    CNPJ: {user.cnpj}
                  </span>
                </div>
              </div>
              
              {/* BOTÃO NEON INTELIGENTE (INTERCEPTA SE FALTAR ENDEREÇO) */}
              <Link 
                href={isPerfilIncompleto ? "/b2b-perfil" : "/b2b-pedidos"}
                onClick={handlePedidoClick}
                className={`${temCarrinho ? 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.4)]'} text-white px-5 py-3 sm:py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-max h-max`}
              >
                {temCarrinho ? <ShoppingCart size={18} /> : <Store size={18} />}
                {temCarrinho ? "Continuar Pedido" : "Fazer Novo Pedido"}
              </Link>
            </div>

            {/* 🟢 1.5 ALERTA DE CADASTRO INCOMPLETO */}
            {isPerfilIncompleto && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-full text-rose-600 dark:text-rose-400 shrink-0">
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

            {/* 2. CARDS DE MÉTRICAS (FINANCEIRO) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-lg dark:shadow-xl relative overflow-hidden transition-colors duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                    <CreditCard size={20} className="text-emerald-600 dark:text-emerald-400 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mb-1">Limite de Crédito</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight h-8 sm:h-9 flex items-center truncate">
                  {renderLimiteCredito(dadosDinamicos.limite_credito)}
                </h2>
                <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-500/70 mt-2 sm:mt-3 font-medium flex items-center gap-1">
                  <ArrowRight size={12} /> Status atual para faturamento
                </p>
              </div>

              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-lg dark:shadow-xl transition-colors duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-100 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center">
                    <Calendar size={20} className="text-teal-600 dark:text-teal-400 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mb-1">Prazos Autorizados</p>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 sm:mt-2 line-clamp-2 h-7">
                  {renderPrazos(dadosDinamicos.prazos_liberados)}
                </h2>
              </div>

              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-lg dark:shadow-xl transition-colors duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center">
                    <ShoppingBag size={20} className="text-purple-600 dark:text-purple-400 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mb-1">Última Compra Realizada</p>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 h-7 sm:h-8">
                  {formatarData(dadosDinamicos.ultima_compra)}
                </h2>
                <Link href="/b2b-historico" className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mt-2 font-medium flex items-center gap-1 transition-colors w-max">
                  Ver histórico completo <ArrowRight size={12} />
                </Link>
              </div>

            </div>

            {/* 3. MENU RÁPIDO (Ações) */}
            <div className={isPerfilIncompleto ? "opacity-50 pointer-events-none grayscale transition-all" : ""}>
              <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-3 sm:mb-4">Acesso Rápido</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                
                <Link href="/b2b-pedidos" className="bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <Package size={16} className="text-emerald-600 dark:text-emerald-400 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-tight">Catálogo de Produtos</span>
                </Link>

                <Link href="/b2b-historico" className="bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag size={16} className="text-blue-600 dark:text-blue-400 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-tight">Meus Pedidos</span>
                </Link>

                <Link href="/b2b-financeiro" className="bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Receipt size={16} className="text-amber-600 dark:text-amber-400 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-tight">2ª Via de Boletos</span>
                </Link>

                <Link href="/b2b-xml" className="bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 text-center group shadow-sm dark:shadow-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-200 dark:bg-zinc-700/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={16} className="text-zinc-600 dark:text-zinc-400 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-tight">Baixar Notas (XML)</span>
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