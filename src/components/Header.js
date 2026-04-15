"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, ShoppingCart, Tag, ArrowRight, Zap, X, Plus, Minus, Package, FileText, Menu, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// ==========================================
// MODAL: RESUMO DO CARRINHO (RESPONSIVO MODO GAVETA)
// ==========================================
function ModalResumoCarrinho({ isOpen, onClose }) {
  const [carrinho, setCarrinho] = useState({});

  useEffect(() => {
    if (isOpen) {
      const salvo = localStorage.getItem("@raizan:carrinho");
      if (salvo) try { setCarrinho(JSON.parse(salvo)); } catch(e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const itens = Object.values(carrinho);
  
  const subtotal = itens.reduce((acc, item) => {
    const precoOriginal = parseFloat(item.PDPRECO) || 0;
    const atingiuMinimo = item.em_promocao && item.qtd >= (item.qtd_minima_promocao || 1);
    const precoFinal = atingiuMinimo ? parseFloat(item.preco_promocional) : precoOriginal;
    return acc + (precoFinal * item.qtd);
  }, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-end p-0 sm:p-6 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in overflow-x-hidden" onClick={onClose}>
      <div className="bg-zinc-50 dark:bg-[#0c0c0e] border-t sm:border border-zinc-200 dark:border-zinc-800/80 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md h-[85vh] sm:h-full sm:max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-right-8" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="text-emerald-500 dark:text-emerald-400" size={20} /> Seu Pedido Atual
          </h2>
          <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
          {itens.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <Package size={48} className="text-zinc-400 dark:text-zinc-700" />
              <p className="text-zinc-500 text-sm">Seu carrinho está vazio.</p>
            </div>
          ) : (
            itens.map(item => {
              const precoOriginal = parseFloat(item.PDPRECO) || 0;
              const atingiuMinimo = item.em_promocao && item.qtd >= (item.qtd_minima_promocao || 1);
              const precoFinal = atingiuMinimo ? parseFloat(item.preco_promocional) : precoOriginal;
              
              return (
                <div key={item.PDCODPRO} className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/60 min-w-0 shadow-sm dark:shadow-none">
                  <div className="flex-1 pr-1 sm:pr-2 min-w-0">
                    <p className="text-sm md:text-base font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{item.PDNOME}</p>
                    
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.qtd}x {formatarMoeda(precoFinal)} 
                      {item.em_promocao && atingiuMinimo && <span className="text-emerald-600 dark:text-emerald-400 ml-1 font-bold">(Oferta Aplicada)</span>}
                      {item.em_promocao && !atingiuMinimo && <span className="text-rose-600 dark:text-rose-500 ml-1 font-bold">⚠️ Leve {item.qtd_minima_promocao} para Oferta</span>}
                    </p>
                  </div>
                  
                  <div className="text-sm md:text-base font-bold text-emerald-600 dark:text-emerald-400 pl-1 sm:pl-3 shrink-0">
                    {formatarMoeda(precoFinal * item.qtd)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {itens.length > 0 && (
          <div className="p-5 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base">Subtotal Estimado:</span>
              <span className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatarMoeda(subtotal)}</span>
            </div>
            
            <Link 
              href="/b2b-pedidos" 
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Ir para o Checkout <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MODAL DE OFERTAS (RESPONSIVO MODO GAVETA)
// ==========================================
function ModalOfertasGlobal({ isOpen, onClose, ofertas, onComprar }) {
  const [quantidades, setQuantidades] = useState({});

  if (!isOpen) return null;

  const handleQtdChange = (sku, novaQtd, minExigido) => {
    setQuantidades(prev => ({ ...prev, [sku]: Math.max(minExigido, novaQtd) }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm transition-all animate-in fade-in overflow-x-hidden" onClick={onClose}>
      <div className="bg-zinc-50 dark:bg-[#0c0c0e] border-t sm:border border-rose-200 dark:border-rose-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.15)] w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-4 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 opacity-20"><Tag size={120} /></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-base sm:text-2xl font-bold text-white flex items-center gap-2">
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
            ofertas.map(promo => {
              const minExigido = promo.qtd_minima || 1;
              const qtdAtual = quantidades[promo.sku] || minExigido;

              return (
                <div key={promo.sku} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500/50 transition-all group gap-4 min-w-0 shadow-sm dark:shadow-none">
                  <div className="flex-1 w-full min-w-0">
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-500/20 inline-block mb-2">SKU {promo.sku}</span>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 leading-snug text-sm sm:text-base break-words">{promo.nome_produto}</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{formatarMoeda(promo.preco_promocional)}</p>
                  </div>
                  
                  <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border border-emerald-500/30 rounded-lg overflow-hidden h-10 w-full sm:w-32">
                      <button onClick={() => handleQtdChange(promo.sku, qtdAtual - 1, minExigido)} className="w-10 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"><Minus size={14}/></button>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm w-8 text-center">{qtdAtual}</span>
                      <button onClick={() => handleQtdChange(promo.sku, qtdAtual + 1, minExigido)} className="w-10 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"><Plus size={14}/></button>
                    </div>

                    <button 
                      onClick={() => {
                        onComprar({
                          PDCODPRO: promo.sku, 
                          PDNOME: promo.nome_produto, 
                          PDPRECO: promo.preco_promocional, 
                          em_promocao: true, 
                          preco_promocional: promo.preco_promocional,
                          qtd_minima_promocao: minExigido 
                        }, qtdAtual);
                        toast.success(`${qtdAtual}x adicionado ao carrinho!`);
                      }} 
                      className="w-full sm:w-32 bg-emerald-600 hover:bg-emerald-500 text-white h-10 rounded-lg font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      <ShoppingCart size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TELA PRINCIPAL: HEADER RESPONSIVO 
// ==========================================
export default function Header() {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  const [lastPedidoId, setLastPedidoId] = useState(null);
  const [lastXmlId, setLastXmlId] = useState(null);

  const [userName, setUserName] = useState("Usuário");
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("R");
  const [dataHora, setDataHora] = useState("");
  const [qtdCarrinho, setQtdCarrinho] = useState(0);
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null); 
  const [isOfertasModalOpen, setIsOfertasModalOpen] = useState(false);
  const [listaOfertas, setListaOfertas] = useState([]);
  const [isCarrinhoModalOpen, setIsCarrinhoModalOpen] = useState(false);

  const gerarIniciais = (nome) => {
    if (!nome) return "R";
    const partes = nome.trim().split(" ");
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  const toggleMobileMenu = () => {
    window.dispatchEvent(new Event('toggleMobileSidebar'));
  };

  // 🟢 NOVA REGRA: Define Tema Padrão Baseado no Role (Somente no primeiro acesso)
  useEffect(() => {
    setMontado(true);
    if (userRole && montado) {
      const temaDefinido = localStorage.getItem("@raizan:tema_definido");
      if (!temaDefinido) {
        setTheme(userRole === "lojista" ? "light" : "dark");
        localStorage.setItem("@raizan:tema_definido", "true");
      }
    }
  }, [userRole, montado, setTheme]);

  useEffect(() => {
    const atualizarTempo = () => {
      const agora = new Date();
      const formatado = agora.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
      });
      setDataHora(formatado.charAt(0).toUpperCase() + formatado.slice(1).replace(" às ", " • "));
    };
    atualizarTempo();
    const timerRelogio = setInterval(atualizarTempo, 60000);

    const savedUser = localStorage.getItem("raizan_user");
    let isLojista = false;

    if (savedUser) {
      try {
        let userObj = JSON.parse(savedUser);
        if (userObj.user) userObj = userObj.user;

        setUserRole(userObj.tipo || "admin");
        isLojista = userObj.tipo === "lojista";
        
        if (isLojista) {
          const nomeOficial = userObj.nome || userObj.RAZAO || userObj.razao_social || "Cliente B2B";
          const primeiroNome = nomeOficial.trim().split(' ')[0];

          setUserName(primeiroNome);
          setUserEmail(userObj.cnpj || userObj.email || ""); 
          setUserInitial(gerarIniciais(primeiroNome));
        }
      } catch(e) {
        console.error("Erro ao ler Lojista:", e);
      }
    } else {
      setUserRole("admin"); 
    }

    if (!isLojista) {
      const vencimento = localStorage.getItem("@raizan:expires_at");
      if (vencimento) {
        const hoje = new Date();
        const dataVenc = new Date(vencimento);
        const diferencaTempo = dataVenc - hoje;
        const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
        setDiasRestantes(dias);
      }
      const emailStr = localStorage.getItem("@raizan:email");
      const nomeAdmin = localStorage.getItem("@raizan:nome"); 

      if (emailStr && !savedUser) {
        setUserEmail(emailStr);
        if (nomeAdmin && nomeAdmin.trim() !== "") {
          setUserName(nomeAdmin.split(' ')[0]);
          setUserInitial(gerarIniciais(nomeAdmin));
        } else {
          setUserName("Admin");
          setUserInitial(emailStr.charAt(0).toUpperCase());
        }
      }
    }

    return () => clearInterval(timerRelogio);
  }, []);

  useEffect(() => {
    if (userRole !== "lojista") return;

    const checarCarrinho = () => {
      const salvo = localStorage.getItem("@raizan:carrinho");
      if (salvo) {
        try {
          const parseado = JSON.parse(salvo);
          const qtd = Object.values(parseado).reduce((acc, item) => acc + item.qtd, 0);
          setQtdCarrinho(qtd);
        } catch (e) { }
      } else {
        setQtdCarrinho(0);
      }
    };
    checarCarrinho();
    
    window.addEventListener('storage', checarCarrinho);
    const timerCarrinho = setInterval(checarCarrinho, 1000);
    
    return () => {
      window.removeEventListener('storage', checarCarrinho);
      clearInterval(timerCarrinho);
    };
  }, [userRole]);

  useEffect(() => {
    if (userRole !== "admin") return;

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    let memoriaUltimoPedidoId = null; 
    let memoriaUltimaSolicitacaoId = null;
    let memoriaTotalSolicitacoes = 0;
    let primeiraRodada = true; 

    const checarRadar = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/admin/notificacoes`, { headers: getHeaders() });
        const data = await res.json();

        if (data.success) {
          setUpdateStatus(data.totalPendente > 0 ? "!" : null); 

          if (primeiraRodada) {
            if (data.ultimoPedido) {
              memoriaUltimoPedidoId = data.ultimoPedido.id;
              setLastPedidoId(data.ultimoPedido.id); 
            }
            if (data.ultimaSolicitacao) {
              memoriaUltimaSolicitacaoId = data.ultimaSolicitacao.id;
              setLastXmlId(data.ultimaSolicitacao.id); 
            }
            memoriaTotalSolicitacoes = data.totalSolicitacoes;
            primeiraRodada = false;
            return;
          }

          if (data.ultimoPedido && data.ultimoPedido.id !== memoriaUltimoPedidoId) {
            try { new Audio('/plim.mp3').play().catch(()=>{}); } catch (e) {}
            try {
              if (Notification.permission === "granted") {
                new Notification(`🛒 Pedido: ${data.ultimoPedido.nome}`, {
                  body: `Pedido #${data.ultimoPedido.id} recebido!`,
                  icon: "https://raizan.com.br/wp-content/uploads/2024/02/favicon.png",
                  silent: true 
                });
              }
            } catch (e) {}

            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#0c0c0e]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-emerald-500/30 p-4 border-l-4 border-emerald-500`}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-500 dark:text-emerald-400"/> Novo Pedido Registrado!</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">O cliente <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.ultimoPedido.nome}</span> fez uma compra (ID: {data.ultimoPedido.id}).</p>
                </div>
              </div>
            ), { duration: 6000 });

            memoriaUltimoPedidoId = data.ultimoPedido.id;
            setLastPedidoId(data.ultimoPedido.id); 
          }

          if (data.ultimaSolicitacao && (data.ultimaSolicitacao.id !== memoriaUltimaSolicitacaoId || data.totalSolicitacoes > memoriaTotalSolicitacoes)) {
            try { new Audio('/Newemail.mp3').play().catch(()=>{}); } catch (e) {}
            try {
              if (Notification.permission === "granted") {
                new Notification(`📄 Solicitação de ${data.ultimaSolicitacao.nome}`, {
                  body: `O cliente pediu o XML/Boleto do pedido #${data.ultimaSolicitacao.id}.`,
                  icon: "https://raizan.com.br/wp-content/uploads/2024/02/favicon.png",
                  silent: true 
                });
              }
            } catch (e) {}

            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#0c0c0e]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(244,63,94,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-rose-500/30 p-4 border-l-4 border-rose-500`}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2"><FileText size={16} className="text-rose-500 dark:text-rose-400"/> Solicitação de Documento</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300"><span className="font-bold text-rose-500 dark:text-rose-400">{data.ultimaSolicitacao.nome}</span> aguarda o XML do pedido #${data.ultimaSolicitacao.id}.</p>
                </div>
              </div>
            ), { duration: 8000 });

            memoriaUltimaSolicitacaoId = data.ultimaSolicitacao.id;
            setLastXmlId(data.ultimaSolicitacao.id); 
            memoriaTotalSolicitacoes = data.totalSolicitacoes;
          }

        }
      } catch (e) {}
    };

    checarRadar();
    const timerRadar = setInterval(checarRadar, 15000);

    return () => clearInterval(timerRadar);
  }, [userRole]);

  const carregarOfertasGlobais = async () => {
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
    if (carrinhoSalvo) try { carrinhoAtual = JSON.parse(carrinhoSalvo); } catch (e) {}

    const id = produto.PDCODPRO;
    if (carrinhoAtual[id]) carrinhoAtual[id].qtd += qtd;
    else carrinhoAtual[id] = { ...produto, qtd };

    localStorage.setItem("@raizan:carrinho", JSON.stringify(carrinhoAtual));
    window.dispatchEvent(new Event('storage')); 
  };

  if (!userRole) return <header className="sticky top-0 z-30 w-full h-16 md:mt-8 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60 overflow-x-hidden" style={{ WebkitAppRegion: 'drag' }}></header>;

  return (
    <>
      <header className="sticky top-0 z-30 w-full min-h-16 md:h-16 md:mt-8 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between px-3 sm:px-4 md:px-8 lg:pr-40 py-2 md:py-0 gap-2 sm:gap-3 overflow-x-hidden transition-colors duration-300" style={{ WebkitAppRegion: 'drag' }}>
        
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button onClick={toggleMobileMenu} className="lg:hidden shrink-0 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800/60">
            <Menu size={20} />
          </button>

          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-xs sm:text-sm md:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 md:gap-2 truncate max-w-[150px] sm:max-w-[220px] md:max-w-none">
              Olá, <span className={userRole === "lojista" ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"}>
                {userName}
              </span>! <span className="animate-wave origin-bottom-right inline-block">👋</span>
            </h2>
            <span className="hidden sm:block text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[260px] md:max-w-none">{dataHora}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-5 min-w-0 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
          
          {/* 🟢 BOTÃO DE TEMA (APARECE PARA AMBOS, MAS COM DEFAULTS DIFERENTES) */}
          {montado && (
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative shrink-0 p-1.5 md:p-2 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all"
              title="Alternar Tema Claro/Escuro"
            >
              {theme === "dark" ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
            </button>
          )}

          {userRole === "admin" && diasRestantes !== null && diasRestantes <= 15 && diasRestantes > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1.5 rounded-lg mr-2">
              <AlertTriangle size={16} className="text-orange-500 dark:text-orange-400 animate-pulse" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Licença expira em {diasRestantes} dias</span>
            </div>
          )}

          {userRole === "lojista" && (
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0">
              <button 
                onClick={() => { setIsOfertasModalOpen(true); carregarOfertasGlobais(); }}
                className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-2 py-1.5 sm:px-2.5 md:px-4 md:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all transform hover:scale-105 border border-orange-400/50 max-w-[120px] sm:max-w-none"
              >
                <Tag size={12} className="md:w-[14px] md:h-[14px]" /> 
                <span className="hidden sm:inline">Ofertas do Dia</span>
                <span className="sm:hidden">Ofertas</span>
              </button>

              <button 
                onClick={() => setIsCarrinhoModalOpen(true)} 
                className="relative shrink-0 p-1.5 md:p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all" 
                title="Ver Resumo do Carrinho"
              >
                <ShoppingCart size={18} className="md:w-5 md:h-5" />
                {qtdCarrinho > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white dark:text-black text-[9px] md:text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#09090b]">
                    {qtdCarrinho}
                  </span>
                )}
              </button>
            </div>
          )}

          {userRole === "admin" && (
            <div className="relative group cursor-pointer mr-0 md:mr-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
              <Link href="/xml" className="transition-colors relative block p-2 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800" title="Ver Central de Documentos">
                <Bell size={18} className={updateStatus ? "text-rose-500 dark:text-rose-400 animate-pulse" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"} />
                {updateStatus && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#09090b]">
                    {updateStatus === "!" ? "1" : updateStatus}
                  </span>
                )}
              </Link>

              <div className="hidden lg:block absolute right-0 top-full mt-3 w-64 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                <div className="bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">Resumo Pendente</h4>
                  <div className="space-y-4">
                    {!updateStatus && <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">Nenhuma notificação nova.</p>}
                    {lastPedidoId && (
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg"><ShoppingCart size={14} className="text-emerald-600 dark:text-emerald-400" /></div>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">Último Pedido</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">ID: {lastPedidoId}</p>
                        </div>
                      </div>
                    )}
                    {lastXmlId && (
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-500/10 rounded-lg"><FileText size={14} className="text-rose-600 dark:text-rose-400" /></div>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">Aguardando XML</p>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium truncate italic underline">Pedido #{lastXmlId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[9px] text-zinc-400 dark:text-zinc-500 italic">
                    <span>Radar ativo</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  </div>
                </div>
                <div className="absolute -top-1 right-4 w-2 h-2 bg-white dark:bg-[#0c0c0e] border-l border-t border-zinc-200 dark:border-zinc-800 rotate-45"></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 md:pl-5 border-l border-zinc-200 dark:border-zinc-800/60 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm md:text-base font-bold text-zinc-800 dark:text-zinc-200 leading-tight">{userRole === "lojista" ? "Meu Perfil" : "Operador"}</span>
              <span className={`text-[11px] max-w-[150px] truncate ${userRole === "lojista" ? "text-emerald-600 dark:text-emerald-500 font-medium" : "text-zinc-500 dark:text-zinc-500"}`}>{userRole === "lojista" ? `CNPJ: ${userEmail}` : userEmail}</span>
            </div>
            <Link href={userRole === "lojista" ? "/b2b-inicio" : "/conta"}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-zinc-950 hover:scale-105 transition-all cursor-pointer font-bold text-white text-xs md:text-sm ${userRole === "lojista" ? "bg-gradient-to-br from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 hover:ring-emerald-500/50" : "bg-gradient-to-br from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 hover:ring-purple-500/50"}`}>
                {userInitial}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <ModalOfertasGlobal isOpen={isOfertasModalOpen} onClose={() => setIsOfertasModalOpen(false)} ofertas={listaOfertas} onComprar={adicionarOfertaAoCarrinho} />
      <ModalResumoCarrinho isOpen={isCarrinhoModalOpen} onClose={() => setIsCarrinhoModalOpen(false)} />
    </>
  );
}