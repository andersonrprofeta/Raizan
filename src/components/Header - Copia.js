"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, ShoppingCart, Tag, ArrowRight, Zap, X, Plus, Minus, Package, FileText } from "lucide-react";
import Link from "next/link";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// ==========================================
// NOVO MODAL: RESUMO DO CARRINHO
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
    const precoFinal = item.em_promocao ? parseFloat(item.preco_promocional) : precoOriginal;
    return acc + (precoFinal * item.qtd);
  }, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose}>
      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-3xl shadow-2xl w-full max-w-md h-full max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-right-8" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="text-emerald-400" size={20} /> Seu Pedido Atual
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1.5 bg-zinc-800 rounded-lg transition-colors"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
          {itens.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <Package size={48} className="text-zinc-700" />
              <p className="text-zinc-500 text-sm">Seu carrinho está vazio.</p>
            </div>
          ) : (
            itens.map(item => {
              const precoOriginal = parseFloat(item.PDPRECO) || 0;
              const precoFinal = item.em_promocao ? parseFloat(item.preco_promocional) : precoOriginal;
              
              return (
                <div key={item.PDCODPRO} className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-200 line-clamp-1">{item.PDNOME}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.qtd}x {formatarMoeda(precoFinal)} {item.em_promocao && <span className="text-rose-400 ml-1 font-bold">(Oferta)</span>}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-emerald-400 pl-3">
                    {formatarMoeda(precoFinal * item.qtd)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {itens.length > 0 && (
          <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/80 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Subtotal Estimado:</span>
              <span className="text-xl font-bold text-emerald-400">{formatarMoeda(subtotal)}</span>
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
// COMPONENTE GLOBAL: MODAL DE OFERTAS 
// ==========================================
function ModalOfertasGlobal({ isOpen, onClose, ofertas, onComprar }) {
  const [quantidades, setQuantidades] = useState({});

  if (!isOpen) return null;

  const handleQtdChange = (sku, novaQtd) => {
    setQuantidades(prev => ({ ...prev, [sku]: Math.max(1, novaQtd) }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose}>
      <div className="bg-[#0c0c0e] border border-rose-500/30 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.15)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-6 relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 opacity-20"><Tag size={120} /></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="fill-white text-white" /> Ofertas Exclusivas
              </h2>
              <p className="text-rose-100 text-sm mt-1">Aproveite os descontos especiais para o seu CNPJ hoje!</p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {ofertas.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">Nenhuma oferta relâmpago ativa no momento.</div>
          ) : (
            ofertas.map(promo => {
              const qtdAtual = quantidades[promo.sku] || 1;

              return (
                <div key={promo.sku} className="flex flex-col sm:flex-row justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 hover:border-rose-500/50 transition-all group gap-4">
                  <div className="flex-1 w-full">
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-rose-500/20 inline-block mb-2">SKU {promo.sku}</span>
                    <p className="font-bold text-zinc-200 leading-snug">{promo.nome_produto}</p>
                    <p className="text-xl font-bold text-emerald-400 mt-2">{formatarMoeda(promo.preco_promocional)}</p>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                    <div className="flex items-center justify-between bg-zinc-950 border border-emerald-500/30 rounded-lg overflow-hidden h-10 w-full sm:w-32">
                      <button onClick={() => handleQtdChange(promo.sku, qtdAtual - 1)} className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"><Minus size={14}/></button>
                      <span className="font-bold text-emerald-400 text-sm w-8 text-center">{qtdAtual}</span>
                      <button onClick={() => handleQtdChange(promo.sku, qtdAtual + 1)} className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"><Plus size={14}/></button>
                    </div>

                    <button 
                      onClick={() => {
                        onComprar({
                          PDCODPRO: promo.sku, PDNOME: promo.nome_produto, PDPRECO: promo.preco_promocional, em_promocao: true, preco_promocional: promo.preco_promocional
                        }, qtdAtual);
                        toast.success(`${qtdAtual}x adicionado ao carrinho!`);
                      }} 
                      className="w-full sm:w-32 bg-emerald-600 hover:bg-emerald-500 text-white h-10 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
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
// TELA PRINCIPAL: HEADER
// ==========================================
export default function Header() {
  // 🟢 OS ESTADOS DO TOOLTIP AGORA ESTÃO NO LUGAR CERTO (DENTRO DA FUNÇÃO!)
  const [lastPedidoId, setLastPedidoId] = useState(null);
  const [lastXmlId, setLastXmlId] = useState(null);

  // 1. TODOS OS ESTADOS DA TELA
  const [userName, setUserName] = useState("Carregando...");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [qtdCarrinho, setQtdCarrinho] = useState(0);
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null); 
  const [isOfertasModalOpen, setIsOfertasModalOpen] = useState(false);
  const [listaOfertas, setListaOfertas] = useState([]);
  const [isCarrinhoModalOpen, setIsCarrinhoModalOpen] = useState(false);

  // 2. FUNÇÃO AUXILIAR DE INICIAIS
  const gerarIniciais = (nome) => {
    if (!nome || nome === "null") return "R";
    const partes = nome.trim().split(" ");
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  // 🟢 3. O DETETIVE ÚNICO
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

    const b2bUser = localStorage.getItem("raizan_user");

    if (b2bUser) {
      try {
        const user = JSON.parse(b2bUser);
        const primeiroNome = user.nome ? user.nome.split(' ')[0] : "Lojista";
        setUserName(primeiroNome);
        setUserRole("lojista");
        setUserEmail(user.cnpj || user.email || "Não informado");
        setUserInitial(gerarIniciais(primeiroNome));
      } catch (e) {}
    } else {
      setUserRole("admin");
      const adminName = localStorage.getItem("@raizan:nome");
      const adminEmail = localStorage.getItem("@raizan:email");
      const vencimento = localStorage.getItem("@raizan:expires_at");

      if (adminName && adminName !== "null" && adminName.trim() !== "") {
        const primeiroNomeAdmin = adminName.split(' ')[0];
        setUserName(primeiroNomeAdmin);
        setUserEmail(adminEmail || "admin@sistema.com");
        setUserInitial(gerarIniciais(adminName));
      } else {
        setUserName("Admin");
        setUserEmail(adminEmail || "admin@sistema.com");
        setUserInitial("A");
      }

      if (vencimento) {
        const hoje = new Date();
        const dataVenc = new Date(vencimento);
        const diferencaTempo = dataVenc - hoje;
        const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
        setDiasRestantes(dias);
      }
    }

    return () => clearInterval(timerRelogio);
  }, []);

  // VIGIA DO CARRINHO
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

  // ==========================================
  // VIGIA DE NOTIFICAÇÕES (ELECTRON + TOAST GLASSMORPHISM)
  // ==========================================
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
              setLastPedidoId(data.ultimoPedido.id); // Atualiza o Tooltip
            }
            if (data.ultimaSolicitacao) {
              memoriaUltimaSolicitacaoId = data.ultimaSolicitacao.id;
              setLastXmlId(data.ultimaSolicitacao.id); // Atualiza o Tooltip
            }
            memoriaTotalSolicitacoes = data.totalSolicitacoes;
            primeiraRodada = false;
            return;
          }

          // 🛒 1. NOVO PEDIDO CHEGOU
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
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0c0c0e]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-emerald-500/30 p-4 border-l-4 border-emerald-500`}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-400"/> Novo Pedido Registrado!</p>
                  <p className="mt-1 text-sm text-zinc-300">O cliente <span className="font-bold text-emerald-400">{data.ultimoPedido.nome}</span> fez uma compra (ID: {data.ultimoPedido.id}).</p>
                </div>
              </div>
            ), { duration: 6000 });

            memoriaUltimoPedidoId = data.ultimoPedido.id;
            setLastPedidoId(data.ultimoPedido.id); // Atualiza o Tooltip
          }

          // 📄 2. NOVA SOLICITAÇÃO (XML/Boleto)
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
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0c0c0e]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(244,63,94,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-rose-500/30 p-4 border-l-4 border-rose-500`}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white flex items-center gap-2"><FileText size={16} className="text-rose-400"/> Solicitação de Documento</p>
                  <p className="mt-1 text-sm text-zinc-300"><span className="font-bold text-rose-400">{data.ultimaSolicitacao.nome}</span> aguarda o XML do pedido #${data.ultimaSolicitacao.id}.</p>
                </div>
              </div>
            ), { duration: 8000 });

            memoriaUltimaSolicitacaoId = data.ultimaSolicitacao.id;
            setLastXmlId(data.ultimaSolicitacao.id); // Atualiza o Tooltip
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

  if (!userRole) return <header className="sticky top-0 z-30 w-full h-16 mt-8 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/60" style={{ WebkitAppRegion: 'drag' }}></header>;

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 mt-8 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between px-8 pr-40" style={{ WebkitAppRegion: 'drag' }}>
        
        <div className="flex flex-col justify-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            Olá, <span className={userRole === "lojista" ? "text-emerald-400" : "text-purple-400"}>
              {(userName?.trim() || "Usuário").split(" ")[0]}
            </span>! <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h2>
          <span className="text-xs text-zinc-400 font-medium">{dataHora}</span>
        </div>

        <div className="flex items-center gap-5" style={{ WebkitAppRegion: 'no-drag' }}>
          
          {userRole === "admin" && diasRestantes !== null && diasRestantes <= 15 && diasRestantes > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg mr-2">
              <AlertTriangle size={16} className="text-orange-400 animate-pulse" />
              <span className="text-xs font-medium text-orange-400">Licença expira em {diasRestantes} dias</span>
            </div>
          )}

          {userRole === "lojista" && (
            <div className="flex items-center gap-4 mr-2">
              <button 
                onClick={() => { setIsOfertasModalOpen(true); carregarOfertasGlobais(); }}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all transform hover:scale-105 border border-orange-400/50"
              >
                <Tag size={14} /> Ofertas do Dia
              </button>

              <button 
                onClick={() => setIsCarrinhoModalOpen(true)} 
                className="relative p-2 text-zinc-400 hover:text-emerald-400 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all" 
                title="Ver Resumo do Carrinho"
              >
                <ShoppingCart size={20} />
                {qtdCarrinho > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#09090b]">
                    {qtdCarrinho}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* NOVO SININHO COM TOOLTIP INTELIGENTE */}
          {userRole === "admin" && (
            <div className="relative group cursor-pointer mr-2" style={{ WebkitAppRegion: 'no-drag' }}>
              <Link href="/xml" className="transition-colors relative block p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl border border-zinc-800" title="Ver Central de Documentos">
                <Bell size={18} className={updateStatus ? "text-rose-400 animate-pulse" : "text-zinc-400 hover:text-zinc-100"} />
                
                {updateStatus && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#09090b]">
                    {updateStatus === "!" ? "1" : updateStatus}
                  </span>
                )}
              </Link>

              {/* TOOLTIP GLASSMORPHISM (Aparece no Hover) */}
              <div className="absolute right-0 top-full mt-3 w-64 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                <div className="bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl ring-1 ring-white/5">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">Resumo Pendente</h4>
                  
                  <div className="space-y-4">
                    {!updateStatus && (
                      <p className="text-xs text-zinc-500 text-center py-2">Nenhuma notificação nova.</p>
                    )}

                    {/* Último Pedido */}
                    {lastPedidoId && (
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                          <ShoppingCart size={14} className="text-emerald-400" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-zinc-200 truncate">Último Pedido</p>
                          <p className="text-[10px] text-zinc-400 truncate">ID: {lastPedidoId}</p>
                        </div>
                      </div>
                    )}

                    {/* Última Solicitação */}
                    {lastXmlId && (
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-rose-500/10 rounded-lg">
                          <FileText size={14} className="text-rose-400" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-zinc-200 truncate">Aguardando XML</p>
                          <p className="text-[10px] text-rose-400 font-medium truncate italic underline">Pedido #{lastXmlId}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2 border-t border-zinc-800 flex justify-between items-center text-[9px] text-zinc-500 italic">
                    <span>Radar ativo</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  </div>
                </div>
                
                {/* Seta do Tooltip */}
                <div className="absolute -top-1 right-4 w-2 h-2 bg-[#0c0c0e] border-l border-t border-zinc-800 rotate-45"></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pl-5 border-l border-zinc-800/60">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-zinc-200 leading-tight">{userRole === "lojista" ? "Meu Perfil" : "Operador"}</span>
              <span className={`text-[11px] max-w-[150px] truncate ${userRole === "lojista" ? "text-emerald-500 font-medium" : "text-zinc-500"}`}>{userRole === "lojista" ? `CNPJ: ${userEmail}` : userEmail}</span>
            </div>
            <Link href={userRole === "lojista" ? "/b2b-inicio" : "/conta"}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-zinc-950 hover:scale-105 transition-all cursor-pointer font-bold text-white text-sm ${userRole === "lojista" ? "bg-gradient-to-br from-emerald-600 to-teal-600 hover:ring-emerald-500/50" : "bg-gradient-to-br from-purple-600 to-indigo-600 hover:ring-purple-500/50"}`}>
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