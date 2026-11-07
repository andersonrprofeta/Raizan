"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, ChevronRight, RotateCcw, Sparkles, Zap } from "lucide-react";
import CartaoProduto from "@/components/portal/CartaoProduto";
import LinhaProduto from "@/components/portal/LinhaProduto";
import { repetirPedido, useCarrinho } from "@/components/portal/carrinho";
import { useCadastro, useCatalogo, usePedidos } from "@/components/portal/dados";
import { ETAPAS, situacaoDoPedido } from "@/components/portal/pedidos";
import { precoDoItem } from "@/components/portal/precos";
import { lerUsuario } from "@/components/portal/sessao";
import { Cartao, ESTILO, Esqueleto, Etiqueta, dataCurta, moeda, nomeCurto } from "@/components/portal/ui";

const PEDIDOS_PARA_RECOMPRA = 20;
const ITENS_NA_VITRINE = 10;
const ITENS_MAIS_COMPRADOS = 6;
const COLUNAS_NO_COMPUTADOR = 5;

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function Painel({ usuario, cadastro, lendoCadastro, compradoNoMes, ultimo, produtos, unidades }) {
  const router = useRouter();
  const limite = cadastro?.limite || 0;
  const disponivel = Math.max(0, limite - (cadastro?.emAberto || 0));
  const usado = limite > 0 ? Math.min(1, (cadastro?.emAberto || 0) / limite) : 0;

  const repetir = () => {
    if (ultimo && repetirPedido(ultimo, produtos)) router.push("/b2b-carrinho");
  };

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-zinc-950 p-5 text-white md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-violet-600/40 blur-[90px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-indigo-600/30 blur-[90px]" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <p className="text-sm text-zinc-400">{saudacao()}, <span className="font-semibold text-white">{nomeCurto(usuario?.nome)}</span></p>
          <p className="mt-5 text-[13px] font-medium uppercase tracking-[0.12em] text-violet-300">{limite > 0 ? "Disponível para comprar" : "Comprado este mês"}</p>
          {lendoCadastro ? <Esqueleto className="mt-2 h-11 w-56 bg-white/10" /> : (
            <p className="mt-1 text-[40px] font-bold leading-none tracking-tight tabular-nums md:text-[52px]">{moeda(limite > 0 ? disponivel : compradoNoMes)}</p>
          )}
          {limite > 0 && (
            <div className="mt-4 max-w-md">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400" style={{ width: `${(1 - usado) * 100}%` }} /></div>
              <p className="mt-2 text-xs text-zinc-400">Limite de {moeda(limite)} · {moeda(cadastro?.emAberto)} em aberto</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href={unidades > 0 ? "/b2b-carrinho" : "/b2b-pedidos"} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-zinc-900 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-0.5">
              <Zap size={18} className="text-violet-600" /> {unidades > 0 ? "Continuar pedido" : "Novo pedido"}
            </Link>
            {ultimo && (
              <button type="button" onClick={repetir} disabled={produtos.length === 0} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/[0.12] disabled:opacity-50">
                <RotateCcw size={17} /> Repetir último pedido
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs text-zinc-400">Em aberto</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{moeda(cadastro?.emAberto)}</p>
            <p className="text-[11px] text-zinc-500">{cadastro?.emAberto > 0 ? "Boletos a pagar" : "Tudo em dia"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs text-zinc-400">Comprado este mês</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{moeda(compradoNoMes)}</p>
            <Link href="/b2b-financeiro" className="text-[11px] font-semibold text-violet-300 hover:text-violet-200">Ver financeiro</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rastreio({ pedido }) {
  const { rotulo, tom, etapa } = situacaoDoPedido(pedido);

  return (
    <Cartao className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Último pedido</p>
          <p className="mt-1 text-base font-bold tabular-nums text-zinc-900">#{pedido.id}</p>
          <p className="text-[13px] tabular-nums text-zinc-500">{dataCurta(pedido.date_created)} · {moeda(pedido.total)}</p>
        </div>
        <Etiqueta tom={tom}>{rotulo}</Etiqueta>
      </div>

      {etapa >= 0 && (
        <ol className="mt-5 grid grid-cols-4">
          {ETAPAS.map((nome, indice) => {
            const feita = indice <= etapa;
            return (
              <li key={nome} className="relative flex flex-col items-center text-center">
                {indice > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${feita ? "bg-violet-500" : "bg-zinc-200"}`} />}
                <span className={`relative flex h-6 w-6 items-center justify-center rounded-full ${feita ? ESTILO.tile : "bg-zinc-200 text-transparent"}`}><Check size={13} strokeWidth={3} /></span>
                <span className={`mt-2 text-[11px] leading-tight md:text-xs ${indice === etapa ? "font-semibold text-zinc-900" : "text-zinc-500"}`}>{nome}</span>
              </li>
            );
          })}
        </ol>
      )}

      <Link href="/b2b-historico" className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-zinc-600 hover:text-zinc-900">Acompanhar pedidos <ChevronRight size={16} /></Link>
    </Cartao>
  );
}

function Titulo({ Icone, titulo, href, rotulo = "Ver todas" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-zinc-900">
        <span className={`${ESTILO.tile} flex h-8 w-8 items-center justify-center rounded-[10px]`}><Icone size={16} /></span>
        {titulo}
      </h2>
      {href && <Link href={href} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-violet-700">{rotulo} <ArrowRight size={15} /></Link>}
    </div>
  );
}

function maisComprados(pedidos, produtos) {
  const catalogo = new Map(produtos.map((produto) => [produto.sku, produto]));
  const contagem = new Map();
  pedidos.slice(0, PEDIDOS_PARA_RECOMPRA).forEach((pedido) => {
    pedido.line_items?.forEach(({ sku, quantity }) => {
      contagem.set(String(sku), (contagem.get(String(sku)) || 0) + (Number(quantity) || 1));
    });
  });

  return [...contagem]
    .sort((a, b) => b[1] - a[1])
    .map(([sku]) => catalogo.get(sku))
    .filter((produto) => produto?.estoque_inicial > 0)
    .slice(0, ITENS_MAIS_COMPRADOS);
}

export default function Inicio() {
  const [usuario] = useState(lerUsuario);
  const { dados: cadastro, carregando: lendoCadastro } = useCadastro();
  const { dados: catalogo } = useCatalogo();
  const { dados: pedidos, carregando: lendoPedidos } = usePedidos();
  const { carrinho, unidades } = useCarrinho();

  const produtos = useMemo(() => catalogo?.produtos || [], [catalogo]);
  const historico = useMemo(() => pedidos || [], [pedidos]);

  const ofertas = useMemo(() => (
    produtos.filter((produto) => precoDoItem(produto).temPromocao && produto.estoque_inicial > 0)
      .sort((a, b) => Number(b.em_oferta) - Number(a.em_oferta))
      .slice(0, ITENS_NA_VITRINE)
  ), [produtos]);

  const compradoNoMes = useMemo(() => {
    const agora = new Date();
    return historico
      .filter((pedido) => {
        const data = new Date(pedido.date_created);
        return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear() && situacaoDoPedido(pedido).grupo !== "cancelado";
      })
      .reduce((soma, pedido) => soma + Number(pedido.total), 0);
  }, [historico]);

  const recompra = useMemo(() => maisComprados(historico, produtos), [historico, produtos]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Painel usuario={usuario} cadastro={cadastro} lendoCadastro={lendoCadastro} compradoNoMes={compradoNoMes} ultimo={historico[0]} produtos={produtos} unidades={unidades} />
        {lendoPedidos ? <Esqueleto className="h-60 rounded-[22px]" /> : historico[0] ? <Rastreio pedido={historico[0]} /> : (
          <Cartao className="flex flex-col justify-center p-6">
            <span className={`${ESTILO.tile} flex h-10 w-10 items-center justify-center rounded-[12px]`}><Sparkles size={18} /></span>
            <h2 className="mt-3 text-base font-bold text-zinc-900">Seu primeiro pedido começa aqui</h2>
            <p className="mt-1 text-sm text-zinc-500">Busque pelo código, digite a quantidade e aperte Enter.</p>
          </Cartao>
        )}
      </div>

      {cadastro?.cadastroCompleto === false && (
        <Link href="/b2b-perfil" className="flex items-center gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle size={20} className="shrink-0" />
          <span className="min-w-0 flex-1 text-sm"><strong className="block font-semibold">Complete seu cadastro</strong> Precisamos do endereço e telefone para entregar seus pedidos.</span>
          <ChevronRight size={18} className="shrink-0" />
        </Link>
      )}

      {ofertas.length > 0 && (
        <section>
          <Titulo Icone={Zap} titulo="Ofertas da semana" href="/b2b-pedidos?ofertas=1" />
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
            {ofertas.map((produto, indice) => <CartaoProduto key={produto.sku} produto={produto} className={`w-[168px] shrink-0 md:w-[200px] lg:w-auto ${indice >= COLUNAS_NO_COMPUTADOR ? "lg:hidden" : ""}`} />)}
          </div>
        </section>
      )}

      {recompra.length > 0 && (
        <section>
          <Titulo Icone={RotateCcw} titulo="Seus mais comprados" href="/b2b-pedidos" rotulo="Pedido rápido" />
          <ul className={`${ESTILO.cartao} divide-y divide-black/5 overflow-hidden`}>
            {recompra.map((produto) => <LinhaProduto key={produto.sku} produto={produto} qtd={carrinho[produto.sku]?.qtd || 0} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
