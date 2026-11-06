"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, ShoppingCart, Tag, ArrowRight, Zap, X, Plus, Minus, Package, Menu, Sun, Moon, Loader2, Trash2, Maximize2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { getApiUrl, getHeaders, getHubUrl } from "@/components/utils/api";
import { lerUsuario } from "@/components/utils/sessaoCore";
import toast from 'react-hot-toast';
import SinoNotificacoes from "@/components/SinoNotificacoes";
import LauncherAplicacoes from "@/components/apps/LauncherAplicacoes";

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================

// Painel de vidro (header, dropdowns, modais)
const PAINEL =
  "bg-white/80 dark:bg-[#121214]/85 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] " +
  "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_70px_-20px_rgba(0,0,0,0.9)]";

// Botão de ícone redondo
const ICON_BTN =
  "relative shrink-0 w-10 h-10 flex items-center justify-center rounded-full " +
  "bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] " +
  "text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.07] dark:hover:bg-white/[0.10] " +
  "transition-all duration-300 active:scale-95";

// Contador flutuante (carrinho / notificações)
const BADGE =
  "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold text-white " +
  "flex items-center justify-center border-2 border-white dark:border-[#121214] shadow-sm";

// Rótulo pequeno de seção
const ROTULO = "text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide";

// Classes completas (o Tailwind precisa enxergá-las inteiras no código)
const TILE_CORES = {
  emerald: "from-emerald-400 to-emerald-600",
  purple: "from-violet-400 to-purple-600",
  amber: "from-amber-300 to-amber-500",
  blue: "from-sky-400 to-blue-600",
  indigo: "from-indigo-400 to-indigo-600",
  rose: "from-rose-400 to-rose-600",
};

// Ícone em "tile" arredondado, igual aos ícones de app da Apple
const Tile = ({ cor = "purple", size = 40, children, className = "" }) => (
  <div
    className={`shrink-0 flex items-center justify-center bg-gradient-to-br ${TILE_CORES[cor]} text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-6px_rgba(0,0,0,0.35)] ${className}`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    {children}
  </div>
);

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

  // 🟢 A MÁGICA DA LIXEIRA: Remove e avisa o sistema inteiro na mesma hora!
  const removerItem = (sku) => {
    const novoCarrinho = { ...carrinho };
    delete novoCarrinho[sku];
    setCarrinho(novoCarrinho);
    localStorage.setItem("@raizan:carrinho", JSON.stringify(novoCarrinho));
    // Esse evento faz o Checkout e o Catálogo se atualizarem sozinhos:
    window.dispatchEvent(new Event('storage'));
    toast.success("Item removido!");
  };

  if (!isOpen) return null;

  const itens = Object.values(carrinho);

  const subtotal = itens.reduce((acc, item) => {
    const precoOriginal = parseFloat(item.preco_venda) || 0;
    const atingiuMinimo = item.em_promocao && item.qtd >= (item.qtd_minima_promocao || 1);
    const precoFinal = atingiuMinimo ? parseFloat(item.preco_promocional) : precoOriginal;
    return acc + (precoFinal * item.qtd);
  }, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-end p-0 sm:p-6 bg-black/50 backdrop-blur-md transition-all animate-in fade-in overflow-x-hidden" onClick={onClose}>
      <div className={`${PAINEL} bg-zinc-50/90 dark:bg-[#0c0c0e]/90 rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-md h-[85vh] sm:h-full sm:max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-right-8`} onClick={e => e.stopPropagation()}>

        {/* Alça de gaveta (só no celular) */}
        <div className="sm:hidden pt-2.5 flex justify-center">
          <span className="w-9 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-black/[0.06] dark:border-white/[0.07]">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3 tracking-tight">
            <Tile cor="purple" size={34}><ShoppingCart size={17} /></Tile>
            Seu Pedido Atual
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] dark:hover:bg-white/[0.14] rounded-full transition-colors active:scale-95"><X size={15}/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-2.5">
          {itens.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <Package size={48} className="text-zinc-300 dark:text-zinc-700" />
              <p className="text-zinc-500 text-sm font-medium">Seu carrinho está vazio.</p>
            </div>
          ) : (
            itens.map(item => {
              const precoOriginal = parseFloat(item.preco_venda) || 0;
              const atingiuMinimo = item.em_promocao && item.qtd >= (item.qtd_minima_promocao || 1);
              const precoFinal = atingiuMinimo ? parseFloat(item.preco_promocional) : precoOriginal;

              return (
                <div key={item.sku} className="flex items-center justify-between gap-2 bg-white dark:bg-white/[0.04] p-4 rounded-[20px] border border-black/[0.05] dark:border-white/[0.06] min-w-0 shadow-sm dark:shadow-none group transition-colors">
                  <div className="flex-1 pr-1 sm:pr-2 min-w-0">
                    <p className="text-sm md:text-[15px] font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 line-clamp-1">{item.nome}</p>

                    <p className="text-xs text-zinc-500 mt-1 font-medium">
                      {item.qtd}x {formatarMoeda(precoFinal)}
                      {item.em_promocao && atingiuMinimo && <span className="text-purple-600 dark:text-purple-400 ml-1 font-semibold inline-flex items-center gap-0.5"><Zap size={10}/> Oferta Aplicada</span>}
                      {item.em_promocao && !atingiuMinimo && <span className="text-rose-500 dark:text-rose-400 ml-1 font-semibold inline-flex items-center gap-0.5"><AlertTriangle size={10}/> Leve {item.qtd_minima_promocao} para Oferta</span>}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-sm md:text-[15px] font-bold tracking-tight text-purple-600 dark:text-purple-400 pl-1 sm:pl-3">
                      {formatarMoeda(precoFinal * item.qtd)}
                    </div>
                    {/* 🟢 O BOTÃO DA LIXEIRA */}
                    <button
                      onClick={() => removerItem(item.sku)}
                      className="text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-90"
                      title="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {itens.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-black/[0.06] dark:border-white/[0.07] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Subtotal Estimado</span>
              <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{formatarMoeda(subtotal)}</span>
            </div>

            <Link
              href="/b2b-pedidos"
              onClick={onClose}
              className="w-full bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_28px_-8px_rgba(147,51,234,0.6)] active:scale-[0.98]"
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

  // 🟢 DETECTOR DE SACOLEIRO DIRETO NAS OFERTAS GLOBAIS!
  const percentualCpf = typeof window !== 'undefined' ? Number(localStorage.getItem("@raizan:acrescimo_cpf") || 0) : 0;
  let fatorAcrescimo = 1;

  if (typeof window !== 'undefined') {
    const userSalvo = localStorage.getItem("raizan_user");
    const userObj = userSalvo ? JSON.parse(userSalvo) : null;
    const documentoOriginal = userObj?.cpf_cnpj || userObj?.cnpj || userObj?.cpf || "";
    const docLimpo = String(documentoOriginal).replace(/\D/g, '');
    const isCPF = docLimpo.length === 11;
    fatorAcrescimo = (isCPF && percentualCpf > 0) ? (1 + (percentualCpf / 100)) : 1;
  }

  if (!isOpen) return null;

  const handleQtdChange = (sku, novaQtd, minExigido) => {
    setQuantidades(prev => ({ ...prev, [sku]: Math.max(minExigido, novaQtd) }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md transition-all animate-in fade-in overflow-x-hidden" onClick={onClose}>
      <div className={`${PAINEL} bg-zinc-50/95 dark:bg-[#0c0c0e]/95 rounded-t-[32px] sm:rounded-[32px] w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden shadow-[0_0_70px_-10px_rgba(244,63,94,0.3)] animate-in slide-in-from-bottom-full sm:zoom-in-95`} onClick={e => e.stopPropagation()}>

        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 p-5 sm:p-8 relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 opacity-20"><Tag size={140} /></div>
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(255,255,255,0.22)_0%,transparent_60%)] pointer-events-none" />
          <div className="flex justify-between items-center relative z-10 gap-3">
            <div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
                <Zap className="fill-white text-white" size={28} /> Ofertas Exclusivas
              </h2>
              <p className="text-rose-100 text-xs sm:text-sm mt-1.5 font-medium">Aproveite os descontos especiais para o seu cadastro hoje!</p>
            </div>
            <button onClick={onClose} className="shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"><X size={18}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-3">
          {ofertas.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-zinc-400" size={32} />
              <span className="text-zinc-500 font-medium">Buscando ofertas...</span>
            </div>
          ) : (
            ofertas.map(promo => {
              const minExigido = promo.qtd_minima || 1;
              const qtdAtual = quantidades[promo.sku] || minExigido;

              // 🟢 APLICANDO A INFLAÇÃO NO PREÇO PROMOCIONAL ANTES DE EXIBIR!
              const precoInflacionado = parseFloat(promo.preco_promocional || 0) * fatorAcrescimo;

              return (
                <div key={promo.sku} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-white/[0.04] p-5 rounded-[22px] border border-black/[0.05] dark:border-white/[0.06] hover:border-rose-300 dark:hover:border-rose-500/40 transition-all group gap-4 min-w-0 shadow-sm dark:shadow-none">
                  <div className="flex-1 w-full min-w-0">
                    <span className="text-[11px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full font-semibold border border-rose-100 dark:border-rose-500/20 inline-block mb-3">SKU {promo.sku}</span>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-100 leading-snug text-sm sm:text-base break-words tracking-tight">{promo.nome_produto}</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2 tracking-tight">
                      {formatarMoeda(precoInflacionado)}
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
                    <div className="flex items-center justify-between bg-zinc-100 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] rounded-full overflow-hidden h-11 w-full sm:w-36 p-1">
                      <button onClick={() => handleQtdChange(promo.sku, qtdAtual - 1, minExigido)} className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:bg-white dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"><Minus size={16}/></button>
                      <span className="font-bold text-purple-600 dark:text-purple-400 text-sm w-10 text-center">{qtdAtual}</span>
                      <button onClick={() => handleQtdChange(promo.sku, qtdAtual + 1, minExigido)} className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:bg-white dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"><Plus size={16}/></button>
                    </div>

                    <button
                      onClick={() => {
                        // 🟢 MANDANDO PRO CARRINHO JÁ INFLACIONADO! O carrinho não vai notar a diferença.
                        onComprar({
                          sku: promo.sku,
                          nome: promo.nome_produto,
                          preco_venda: precoInflacionado,
                          em_promocao: true,
                          preco_promocional: precoInflacionado,
                          qtd_minima_promocao: minExigido
                        }, qtdAtual);
                        toast.success(`${qtdAtual}x adicionado ao carrinho!`);
                      }}
                      className="w-full sm:w-36 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white h-11 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(147,51,234,0.6)] active:scale-95"
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


  const [userName, setUserName] = useState("Usuário");
  const [perfilUsuario, setPerfilUsuario] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("R");
  const [dataHora, setDataHora] = useState("");
  const [qtdCarrinho, setQtdCarrinho] = useState(0);
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [isOfertasModalOpen, setIsOfertasModalOpen] = useState(false);
  const [listaOfertas, setListaOfertas] = useState([]);
  const [isCarrinhoModalOpen, setIsCarrinhoModalOpen] = useState(false);

  // 🟢 ESTADO DO MENU WAFFLE (GOOGLE)

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

          // 🟢 LIMPEZA DO CNPJ
          nomeOficial = nomeOficial.replace(/^[\d\.\-\/\s]+/, '').trim();

          // 🟢 FANTASIA MENOR
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
      const usuarioLogado = lerUsuario();
      const nomeAdmin = usuarioLogado?.nome || localStorage.getItem("@raizan:nome");
      setPerfilUsuario(usuarioLogado?.perfil === "Administrador" && usuarioLogado?.principal ? "Administrador Master" : usuarioLogado?.perfil || "");

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

    // 🟢 Ajustado para a nova API: sku
    const id = produto.sku;
    if (carrinhoAtual[id]) carrinhoAtual[id].qtd += qtd;
    else carrinhoAtual[id] = { ...produto, qtd };

    localStorage.setItem("@raizan:carrinho", JSON.stringify(carrinhoAtual));
    window.dispatchEvent(new Event('storage'));
  };

  if (!userRole) return <header className="sticky top-4 z-30 w-full md:w-[calc(100%-2rem)] mx-auto h-16 bg-transparent pointer-events-none"></header>;

  return (
    <>
      {/* 🔥 O SEGREDO DO GLASSMORPHISM: O WRAPPER FICA STICKY ZERO E O HEADER GANHA MARGENS */}
      <div className="sticky top-0 z-40 w-full px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 md:pt-6 pb-2 pointer-events-none" style={{ WebkitAppRegion: 'drag' }}>

        {/* LUZ DE FUNDO PARA REFRATAR O GLASSMORPHISM */}
        <div className="absolute top-1/2 left-1/4 w-64 h-32 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none -translate-y-1/2 -z-10 hidden dark:block"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-32 bg-indigo-600/20 blur-[60px] rounded-full pointer-events-none -translate-y-1/2 -z-10 hidden dark:block"></div>

        <header
          className={`${PAINEL} pointer-events-auto w-full min-h-16 md:h-[72px] rounded-[28px] flex items-center justify-between px-3 sm:px-5 py-2 md:py-0 transition-all duration-300`}
          style={{ WebkitAppRegion: 'no-drag' }}
        >

          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button onClick={toggleMobileMenu} className={`${ICON_BTN} lg:hidden`}>
              <Menu size={19} />
            </button>

            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-sm md:text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-1 md:gap-2 truncate">
                Olá, <span className="bg-gradient-to-r from-purple-600 to-indigo-500 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  {userName}
                </span>! <span className="animate-wave origin-bottom-right inline-block">👋</span>
                {perfilUsuario && <span className="hidden sm:inline-flex items-center h-6 px-2.5 rounded-full bg-purple-500/10 text-[11px] font-semibold text-purple-700 dark:text-purple-300">{perfilUsuario}</span>}
              </h2>
              <span className="hidden sm:block text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">{dataHora}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-2.5 md:gap-3 min-w-0 shrink-0">

            {montado && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`${ICON_BTN} hover:text-amber-500 dark:hover:text-amber-400`}
                title="Alternar Tema Claro/Escuro"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {userRole === "admin" && <LauncherAplicacoes classeBotao={ICON_BTN} classePainel={PAINEL} classeRotulo={ROTULO} />}

            {userRole === "admin" && diasRestantes !== null && diasRestantes <= 15 && diasRestantes > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3.5 py-2 rounded-full">
                <AlertTriangle size={15} className="text-orange-500 dark:text-orange-400 animate-pulse" />
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Expira em {diasRestantes} dias</span>
              </div>
            )}

            {userRole === "lojista" && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  onClick={() => { setIsOfertasModalOpen(true); carregarOfertasGlobais(); }}
                  className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-b from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white px-4 h-10 rounded-full text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(244,63,94,0.6)] transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <Tag size={14} />
                  <span className="hidden sm:inline">Ofertas do Dia</span>
                  <span className="sm:hidden">Ofertas</span>
                </button>

                <button
                  onClick={() => setIsCarrinhoModalOpen(true)}
                  className={`${ICON_BTN} hover:text-purple-600 dark:hover:text-purple-400`}
                  title="Ver Resumo do Carrinho"
                >
                  <ShoppingCart size={18} />
                  {qtdCarrinho > 0 && (
                    <span className={`${BADGE} bg-purple-600`}>
                      {qtdCarrinho}
                    </span>
                  )}
                </button>
              </div>
            )}

            {userRole === "admin" && (
              <SinoNotificacoes classeBotao={ICON_BTN} classeBadge={BADGE} classePainel={PAINEL} classeRotulo={ROTULO} Tile={Tile} />
            )}

            <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-black/[0.08] dark:border-white/[0.08] shrink-0 ml-0.5 sm:ml-1.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none mb-1">{userRole === "lojista" ? "Meu Perfil" : perfilUsuario || "Operador"}</span>
                <span className={`text-[11px] font-medium max-w-[150px] truncate ${userRole === "lojista" ? "text-purple-600 dark:text-purple-400" : "text-zinc-500 dark:text-zinc-400"}`}>{userRole === "lojista" ? `CNPJ: ${userEmail}` : userEmail}</span>
              </div>

              <Link href={userRole === "lojista" ? "/b2b-perfil" : "/conta"}>
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_20px_-8px_var(--sombra)] hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer font-bold text-white text-sm bg-gradient-to-br ${userRole === "lojista" ? "from-purple-400 to-indigo-600 [--sombra:rgba(124,58,237,0.7)]" : "from-indigo-400 to-blue-600 [--sombra:rgba(79,70,229,0.7)]"}`}>
                  {userInitial}
                </div>
              </Link>
            </div>

             {/* 🟢 AS BOLINHAS SÓ APARECEM SE ESTIVER RODANDO NO ELECTRON! */}
            {typeof window !== 'undefined' && window.electronAPI && (
              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-black/[0.08] dark:border-white/[0.08] shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
                <button
                  onClick={() => {
                    if(window.electronAPI?.minimizarJanela) window.electronAPI.minimizarJanela();
                    else console.log("Comando de minimizar não encontrado no preload!");
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-400 hover:bg-amber-500 text-amber-900 shadow-sm transition-colors border border-amber-500/20 active:scale-90"
                  title="Minimizar"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <button
                  onClick={() => {
                    if(window.electronAPI?.maximizarJanela) window.electronAPI.maximizarJanela();
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-sm transition-colors border border-emerald-600/20 active:scale-90"
                  title="Maximizar"
                >
                  <Maximize2 size={10} strokeWidth={3} />
                </button>
                <button
                  onClick={() => {
                    if(window.electronAPI?.fecharJanela) window.electronAPI.fecharJanela();
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 text-rose-950 shadow-sm transition-colors border border-rose-600/20 active:scale-90"
                  title="Fechar"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            )}
            {/* 🟢 FIM DAS BOLINHAS SÓ APARECEM SE ESTIVER RODANDO NO ELECTRON! */}


          </div>
        </header>
      </div>

      <ModalOfertasGlobal isOpen={isOfertasModalOpen} onClose={() => setIsOfertasModalOpen(false)} ofertas={listaOfertas} onComprar={adicionarOfertaAoCarrinho} />
      <ModalResumoCarrinho isOpen={isCarrinhoModalOpen} onClose={() => setIsCarrinhoModalOpen(false)} />
    </>
  );
}