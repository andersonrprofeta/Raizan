"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, ShoppingCart, Tag, ArrowRight, Zap, X, Plus, Minus, Package, FileText, Menu, Sun, Moon, Loader2, Grip } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { getApiUrl, getHeaders, getHubUrl } from "@/components/utils/api";
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
            <div className="text-center py-10 text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-zinc-400" size={24} />
              Buscando ofertas...
            </div>
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
  
  // 🟢 ESTADO DO MENU WAFFLE (GOOGLE)
  const [isWaffleOpen, setIsWaffleOpen] = useState(false);
  
  const gerarIniciais = (nome) => {
    if (!nome) return "R";
    const partes = nome.trim().split(" ");
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  const toggleMobileMenu = () => {
    window.dispatchEvent(new Event('toggleMobileSidebar'));
  };

  useEffect(() => {
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.mudarTemaElectron) {
    window.electronAPI.mudarTemaElectron(theme === 'system' ? 'dark' : theme); 
  }
}, [theme]);

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
          let nomeOficial = userObj.nome || userObj.RAZAO || userObj.razao_social || "Cliente B2B";
          
          // 🟢 LIMPEZA DO CNPJ: Remove números, pontos, traços e barras do início
          nomeOficial = nomeOficial.replace(/^[\d\.\-\/\s]+/, '').trim();
          
          // 🟢 FANTASIA MENOR: Pega até as duas primeiras palavras limpas
          const palavras = nomeOficial.split(' ').filter(p => p.length > 0);
          const nomeExibicao = palavras.length > 1 ? `${palavras[0]} ${palavras[1]}` : (palavras[0] || "Cliente");

          setUserName(nomeExibicao);
          setUserEmail(userObj.cnpj || userObj.email || ""); 
          setUserInitial(gerarIniciais(nomeExibicao));
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
        const res = await fetch(`${getHubUrl()}/api/admin/notificacoes`, { headers: getHeaders() });
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
            
            // 🟢 AVISO DO SELLER: Identifica a origem do pedido para a notificação
            const isSeller = data.ultimoPedido.origem === 'raizan_seller' || data.ultimoPedido.origem === 'app';
            const nomeVendedor = data.ultimoPedido.vendedor_nome || data.ultimoPedido.vendedor || 'Vendedor';
            const textoSeller = isSeller ? ` pelo Digital Seller (${nomeVendedor})` : '';

            try {
              if (Notification.permission === "granted") {
                new Notification(`🛒 Pedido: ${data.ultimoPedido.nome}`, {
                  body: `Pedido #${data.ultimoPedido.id} recebido${textoSeller}!`,
                  icon: "https://raizan.com.br/wp-content/uploads/2024/02/favicon.png",
                  silent: true 
                });
              }
            } catch (e) {}

            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#0c0c0e]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-emerald-500/30 p-4 border-l-4 border-emerald-500`}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-500 dark:text-emerald-400"/> Novo Pedido Registrado!</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    O cliente <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.ultimoPedido.nome}</span> fez uma compra{textoSeller} (ID: {data.ultimoPedido.id}).
                  </p>
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

  // 🟢 SISTEMA DE CACHE INTELIGENTE DAS OFERTAS
  const carregarOfertasGlobais = async () => {
    const cacheOfertas = sessionStorage.getItem("@raizan:cache_ofertas");
    if (cacheOfertas) {
      setListaOfertas(JSON.parse(cacheOfertas));
    }

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
        
        sessionStorage.setItem("@raizan:cache_ofertas", JSON.stringify(ofertasAtivas));
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

  if (!userRole) return <header className="sticky top-4 z-30 w-full md:w-[calc(100%-2rem)] mx-auto h-16 bg-transparent pointer-events-none"></header>;

  return (
    <>
      {/* 🔥 A MÁGICA DO HEADER FLUTUANTE (FLOATING PILL) ESTÁ NESTA DIV ABAIXO */}
      <div className="w-full px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 md:pt-6 pb-2" style={{ WebkitAppRegion: 'drag' }}>
        <header 
          className="sticky top-4 z-30 w-full min-h-16 md:h-[72px] bg-white/90 dark:bg-[#121214]/90 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-between px-4 sm:px-6 py-2 md:py-0 transition-all duration-300" 
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button onClick={toggleMobileMenu} className="lg:hidden shrink-0 p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-700">
              <Menu size={20} />
            </button>

            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-sm md:text-[17px] font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1 md:gap-2 truncate">
                Olá, <span className={userRole === "lojista" ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"}>
                  {userName}
                </span>! <span className="animate-wave origin-bottom-right inline-block">👋</span>
              </h2>
              <span className="hidden sm:block text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">{dataHora}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-4 min-w-0 shrink-0">
            
            {montado && (
              <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative shrink-0 p-2 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700/50 transition-all"
                title="Alternar Tema Claro/Escuro"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* 🟢 WAFFLE MENU DO SUPER APP (Apenas para Admin) */}
            {userRole === "admin" && (
              <div className="relative group shrink-0">
                <button 
                  onClick={() => setIsWaffleOpen(!isWaffleOpen)}
                  onBlur={() => setTimeout(() => setIsWaffleOpen(false), 200)} 
                  className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700/50 transition-all"
                  title="Aplicativos Integrados"
                >
                  <Grip size={18} />
                </button>

                {isWaffleOpen && (
                  <div className="absolute right-0 top-full mt-4 w-72 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 z-[100] animate-in slide-in-from-top-2">
                    <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">Seus Favoritos</h4>
                    
                    <div className="grid grid-cols-3 gap-2">
                       <button 
                          onMouseDown={() => window.dispatchEvent(new CustomEvent('abrirAppExterno', { detail: { nome: 'OMIE', url: 'https://app.omie.com.br/' }}))} 
                          className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors gap-2"
                       >
                          <div className="w-10 h-10 rounded-full bg-[#001D4A] flex items-center justify-center text-white font-black text-xs shadow-sm">OM</div>
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">OMIE</span>
                       </button>
                       
                       <button 
                          onMouseDown={() => window.dispatchEvent(new CustomEvent('abrirAppExterno', { detail: { nome: 'Hostinger', url: 'https://mail.hostinger.com/' }}))} 
                          className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors gap-2"
                       >
                          <div className="w-10 h-10 rounded-full bg-[#673DE6] flex items-center justify-center text-white font-black text-xs shadow-sm">@</div>
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">Webmail</span>
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {userRole === "admin" && diasRestantes !== null && diasRestantes <= 15 && diasRestantes > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-2 rounded-xl">
                <AlertTriangle size={16} className="text-orange-500 dark:text-orange-400 animate-pulse" />
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Expira em {diasRestantes} dias</span>
              </div>
            )}

            {userRole === "lojista" && (
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => { setIsOfertasModalOpen(true); carregarOfertasGlobais(); }}
                  className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 border border-orange-400/50"
                >
                  <Tag size={14} /> 
                  <span className="hidden sm:inline">Ofertas do Dia</span>
                  <span className="sm:hidden">Ofertas</span>
                </button>

                <button 
                  onClick={() => setIsCarrinhoModalOpen(true)} 
                  className="relative shrink-0 p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700/50 transition-all" 
                  title="Ver Resumo do Carrinho"
                >
                  <ShoppingCart size={18} />
                  {qtdCarrinho > 0 && (
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white dark:text-black text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#121214] shadow-sm">
                      {qtdCarrinho}
                    </span>
                  )}
                </button>
              </div>
            )}

            {userRole === "admin" && (
              <div className="relative group cursor-pointer shrink-0">
                <Link href="/xml" className="transition-all relative block p-2 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700/50" title="Ver Central de Documentos">
                  <Bell size={18} className={updateStatus ? "text-rose-500 dark:text-rose-400 animate-pulse" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"} />
                  {updateStatus && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#121214] shadow-sm">
                      {updateStatus === "!" ? "1" : updateStatus}
                    </span>
                  )}
                </Link>

                <div className="hidden lg:block absolute right-0 top-full mt-4 w-64 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[100]">
                  <div className="bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
                    <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">Resumo Pendente</h4>
                    <div className="space-y-4">
                      {!updateStatus && <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2 font-medium">Nenhuma notificação nova.</p>}
                      {lastPedidoId && (
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg"><ShoppingCart size={14} className="text-emerald-600 dark:text-emerald-400" /></div>
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">Último Pedido</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono mt-0.5">ID: {lastPedidoId}</p>
                          </div>
                        </div>
                      )}
                      {lastXmlId && (
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-rose-100 dark:bg-rose-500/10 rounded-lg"><FileText size={14} className="text-rose-600 dark:text-rose-400" /></div>
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">Aguardando XML</p>
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium truncate mt-0.5 hover:underline">Pedido #{lastXmlId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-zinc-200 dark:border-zinc-800 shrink-0 ml-1 sm:ml-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none mb-1">{userRole === "lojista" ? "Meu Perfil" : "Operador"}</span>
                <span className={`text-[10px] font-bold tracking-wide uppercase max-w-[150px] truncate ${userRole === "lojista" ? "text-emerald-600 dark:text-emerald-500" : "text-zinc-500 dark:text-zinc-400"}`}>{userRole === "lojista" ? `CNPJ: ${userEmail}` : userEmail}</span>
              </div>
              
              <Link href={userRole === "lojista" ? "/b2b-perfil" : "/conta"}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer font-black text-white text-sm ${userRole === "lojista" ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20" : "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/20"}`}>
                  {userInitial}
                </div>
              </Link>
            </div>
          </div>
        </header>
      </div>

      <ModalOfertasGlobal isOpen={isOfertasModalOpen} onClose={() => setIsOfertasModalOpen(false)} ofertas={listaOfertas} onComprar={adicionarOfertaAoCarrinho} />
      <ModalResumoCarrinho isOpen={isCarrinhoModalOpen} onClose={() => setIsCarrinhoModalOpen(false)} />
    </>
  );
}