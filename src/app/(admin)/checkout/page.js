"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation'; // 🟢 ADD: Roteador do Next.js
import {
  PackageSearch, Loader2, ScanBarcode, ArrowRight, PackageCheck,
  User, MoreHorizontal, Printer, MonitorPlay, PackagePlus,
  LayoutGrid, List, AlertTriangle, Store, Smartphone, Globe, ShoppingCart,
  Home // 🟢 ADD: Ícone da casinha
} from 'lucide-react';
import { getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';
import ListaSeparacao, { montarSeparacao } from "@/components/checkout/ListaSeparacao";
import { VIDRO, BOTAO_ROXO, BOTAO_VIDRO, SELO, LuzesDeFundo, NotificacaoVidro } from "@/components/checkout/estilos";

const BOTAO_MODO = "w-10 h-9 rounded-full flex items-center justify-center transition-all duration-300";
const BOTAO_MODO_ATIVO = "bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]";
const BOTAO_MODO_INATIVO = "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200";

export default function CheckoutConferencia() {
  const router = useRouter(); // 🟢 ADD: Instanciando o roteador
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState(null);
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState(null);

  const [viewMode, setViewMode] = useState('grid');
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [modoTV, setModoTV] = useState(false);
  const pedidosIdsRef = useRef([]);

  const tocarSomNovaSenha = () => {
    try {
      const audio = new Audio('/notificacao.mp3');
      audio.play().catch(e => console.log("Áudio bloqueado. O usuário precisa clicar no 'Modo TV' primeiro."));
    } catch (e) {}
  };

  const ativarModoTV = () => {
    setModoTV(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log("Erro ao tentar tela cheia:", err);
      });
    }
    toast.custom((t) => (
      <NotificacaoVidro visivel={t.visible} Icone={MonitorPlay} titulo="Modo TV ativado" subtitulo="Fila atualizando em tempo real" />
    ));
  };

  const abrirConferencia = (pedidoId) => {
    const url = `scanner?id=${pedidoId}`;
    const nomeJanela = `conferencia_${pedidoId}`;
    const configs = 'width=1200,height=800,left=100,top=100,resizable=yes,scrollbars=yes';
    window.open(url, nomeJanela, configs);
  };

  const carregarFilaConferencia = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    if (silencioso) setIsAutoRefreshing(true);

    try {
      const tenantId = localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID;

      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/omie`, {
        method: 'POST',
        headers: { ...getHeaders(), 'x-tenant-id': tenantId },
        body: JSON.stringify({ page: 1, limit: 100 })
      });
      const data = await res.json();

      if (data.success) {
        const fila = data.pedidos.filter(p => {
          const s = String(p.status_pedido || p.status || '').toLowerCase().trim();
          return s === '20' || s === 'processando' || s === 'separacao';
        });

        const novosIds = fila.map(p => p.id);
        const idsAntigos = pedidosIdsRef.current;

        if (silencioso) {
          const novos = fila.filter(p => !idsAntigos.includes(p.id));
          if (novos.length > 0) {
            const primeiro = novos[0];
            tocarSomNovaSenha();
            toast.custom((t) => (
              <NotificacaoVidro
                visivel={t.visible}
                Icone={PackagePlus}
                titulo={novos.length === 1 ? 'Novo pedido na esteira' : `${novos.length} novos pedidos na esteira`}
                subtitulo={novos.length === 1 ? `#${primeiro.pedido_id} · ${primeiro.billing?.first_name || 'Cliente não informado'}` : 'Prontos para separação'}
              />
            ), { duration: 5000 });
          }
        }

        pedidosIdsRef.current = novosIds;
        setPedidos(fila);
      }
    } catch (error) {
      if (!silencioso) toast.error("Erro ao carregar fila de separação.");
    }

    setLoading(false);
    if (silencioso) setTimeout(() => setIsAutoRefreshing(false), 1000);
  };

  useEffect(() => {
    carregarFilaConferencia(false);
    const radar = setInterval(() => {
      carregarFilaConferencia(true);
    }, 10000);
    return () => clearInterval(radar);
  }, []);

  const pedidosFiltrados = pedidos.filter(p =>
    String(p.id).includes(busca) ||
    String(p.pedido_id).includes(busca) ||
    (p.billing?.first_name || '').toLowerCase().includes(busca.toLowerCase())
  );

  // O leitor manda Enter no fim do bipe: com o número exato, já abre a conferência do pedido
  const abrirPedidoBipado = (e) => {
    if (e.key !== 'Enter') return;
    const codigo = busca.trim();
    const bipado = pedidos.find(p => String(p.pedido_id) === codigo || String(p.id) === codigo);
    if (!bipado) return;
    abrirConferencia(bipado.pedido_id);
    setBusca('');
  };

  const verificarUrgency = (pedido) => {
    const metodo = String(pedido.payment_method_title || pedido.metodo_pagamento || '').toLowerCase().trim();
    return ['000', 'pix', 'dinheiro', 'à vista', 'a vista'].some(termo => metodo.includes(termo));
  };

  const getCanalVenda = (pedido) => {
    const origem = String(pedido.origem || pedido.plataforma || 'omie').toLowerCase();

    if (origem.includes('woo')) return { label: 'WooCommerce', tom: 'purple', Icon: ShoppingCart };
    if (origem.includes('seller') || origem.includes('app')) return { label: 'Raizan Seller', tom: 'emerald', Icon: Smartphone };
    if (origem.includes('b2b') || origem.includes('portal')) return { label: 'Portal B2B', tom: 'blue', Icon: Globe };
    return { label: 'Omie / ERP', tom: 'orange', Icon: Store };
  };

  const emLista = viewMode === 'list';

  return (
    <div className="relative min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300 print:bg-white">

      <div className="print:hidden">
        <LuzesDeFundo />

        <div className={`relative p-4 sm:p-6 lg:p-8 mx-auto ${modoTV ? 'max-w-full' : 'max-w-7xl'}`}>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-[34px] leading-tight font-bold tracking-tight">Estação de Checkout</h1>
              <p className="text-sm sm:text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Fila de pedidos aguardando separação e bipagem.</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 h-11 pl-4 pr-5 rounded-full bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <span className="flex h-2 w-2 relative" title="Radar Automático Ativado">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAutoRefreshing ? 'bg-emerald-400' : 'bg-purple-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoRefreshing ? 'bg-emerald-500' : 'bg-purple-500'}`}></span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}</span>
                <span className="text-xs font-semibold text-zinc-400">na fila</span>
              </div>

              <div className="flex items-center gap-1 p-1 h-11 rounded-full bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]">
                <button onClick={() => setViewMode('grid')} title="Visualização em Cards" className={`${BOTAO_MODO} ${viewMode === 'grid' ? BOTAO_MODO_ATIVO : BOTAO_MODO_INATIVO}`}>
                  <LayoutGrid size={17} />
                </button>
                <button onClick={() => setViewMode('list')} title="Visualização em Lista" className={`${BOTAO_MODO} ${emLista ? BOTAO_MODO_ATIVO : BOTAO_MODO_INATIVO}`}>
                  <List size={17} />
                </button>
              </div>

              {!modoTV && (
                <button onClick={ativarModoTV} className={`${BOTAO_ROXO} h-11 px-5 text-sm`}>
                  <MonitorPlay size={18} />
                  Modo TV
                </button>
              )}
            </div>
          </div>

          <div className={`${VIDRO} mb-6 flex items-center gap-3 px-5 h-[60px] focus-within:ring-2 focus-within:ring-purple-500/40 transition-shadow duration-300`}>
            <ScanBarcode size={22} className="text-zinc-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Bipe o código de barras ou digite o nº do pedido"
              className="w-full bg-transparent text-base sm:text-lg font-medium outline-none placeholder:text-zinc-400"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={abrirPedidoBipado}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="animate-spin text-purple-600 mb-4" size={36} />
              <p className="text-zinc-500 font-medium">Buscando pedidos na esteira...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className={`${VIDRO} flex flex-col items-center justify-center py-20 px-6 text-center`}>
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
                <PackageCheck className="text-emerald-600 dark:text-emerald-400" size={38} strokeWidth={1.6} />
              </div>
              <p className="text-xl font-bold tracking-tight">Fila limpa</p>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Nenhum pedido aguardando separação no momento.</p>
            </div>
          ) : (
            <div className={emLista ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
              {pedidosFiltrados.map((pedido) => {
                const isUrgente = verificarUrgency(pedido);
                const canal = getCanalVenda(pedido);
                const { itensParaSeparar } = montarSeparacao(pedido);
                const unidades = itensParaSeparar.reduce((acc, item) => acc + item.qtdSeparar, 0);

                return (
                  <div
                    key={pedido.id}
                    onClick={() => abrirConferencia(pedido.pedido_id)}
                    className={`${VIDRO} group cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] ${menuAberto === pedido.id ? 'z-30' : ''}
                      ${emLista ? 'flex items-center gap-5 px-5 py-4 flex-wrap' : 'flex flex-col p-5'}
                      ${isUrgente ? 'ring-1 ring-rose-500/40' : 'hover:ring-1 hover:ring-purple-500/30'}`}
                  >
                    <div className={`flex items-start justify-between gap-3 ${emLista ? 'min-w-[170px]' : 'mb-4'}`}>
                      <div>
                        <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full border text-[11px] font-semibold ${isUrgente ? SELO.rose : SELO.blue}`}>
                          {isUrgente ? <AlertTriangle size={12} /> : <PackageSearch size={12} />}
                          {isUrgente ? 'Urgente' : 'Separação'}
                        </span>
                        <h3 className="text-[28px] leading-tight font-bold tracking-tight mt-2 tabular-nums">#{pedido.pedido_id}</h3>
                      </div>

                      {!emLista && (
                        <AcoesDoCard
                          aberto={menuAberto === pedido.id}
                          onAlternar={() => setMenuAberto(menuAberto === pedido.id ? null : pedido.id)}
                          onFechar={() => setMenuAberto(null)}
                          onImprimir={() => { setMenuAberto(null); setPedidoParaImprimir(pedido); }}
                        />
                      )}
                    </div>

                    <div className={emLista ? 'flex-1 min-w-[220px]' : 'flex-1'}>
                      <div className="flex items-start gap-2.5">
                        <User size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug line-clamp-2">{pedido.billing?.first_name || 'Cliente não informado'}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{pedido.vendedor_nome || 'Televendas'}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 flex-wrap ${emLista ? '' : 'mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.07]'}`}>
                      <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full border text-[11px] font-semibold ${SELO[canal.tom]}`}>
                        <canal.Icon size={12} /> {canal.label}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {itensParaSeparar.length} {itensParaSeparar.length === 1 ? 'produto' : 'produtos'} · {unidades} un
                      </span>
                    </div>

                    {emLista && (
                      <AcoesDoCard
                        aberto={menuAberto === pedido.id}
                        onAlternar={() => setMenuAberto(menuAberto === pedido.id ? null : pedido.id)}
                        onFechar={() => setMenuAberto(null)}
                        onImprimir={() => { setMenuAberto(null); setPedidoParaImprimir(pedido); }}
                      />
                    )}

                    <ArrowRight size={18} className={`text-zinc-300 dark:text-zinc-600 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all duration-300 ${emLista ? '' : 'hidden'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🟢 O BOTÃO DISCRETO PARA SAIR/VOLTAR */}
        {!modoTV && (
          <button
            onClick={() => router.push('/')} // Troque '/' pela rota real do seu painel/dashboard se for diferente (ex: '/dashboard')
            className={`${BOTAO_VIDRO} fixed bottom-6 right-6 h-11 px-5 text-sm backdrop-blur-xl z-20`}
          >
            <Home size={16} />
            Voltar ao painel
          </button>
        )}
      </div>

      {pedidoParaImprimir && (
        <ListaSeparacao
          pedido={pedidoParaImprimir}
          onFechar={() => setPedidoParaImprimir(null)}
        />
      )}

    </div>
  );
}

function AcoesDoCard({ aberto, onAlternar, onFechar, onImprimir }) {
  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onAlternar}
        title="Mais ações"
        className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all duration-300 active:scale-90"
      >
        <MoreHorizontal size={18} />
      </button>

      {aberto && (
        <>
          {/* Fora do card: dentro do vidro o "fixed" ficaria preso ao card e clicar fora não fecharia o menu */}
          {createPortal(<div className="fixed inset-0 z-20 print:hidden" onClick={onFechar} />, document.body)}
          <div className={`${VIDRO} absolute top-full right-0 mt-2 w-56 !rounded-2xl p-1.5 z-50`}>
            <button
              onClick={onImprimir}
              className="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-sm font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            >
              <Printer size={16} className="text-zinc-400" />
              Imprimir separação
            </button>
          </div>
        </>
      )}
    </div>
  );
}
