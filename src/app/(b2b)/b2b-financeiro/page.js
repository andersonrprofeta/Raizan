"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Printer, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { montarPdfFinanceiro } from "@/components/b2b/pdfFinanceiro";
import { useCadastro, usePedidos } from "@/components/portal/dados";
import { situacaoDoPedido } from "@/components/portal/pedidos";
import { lerUsuario } from "@/components/portal/sessao";
import { Botao, Cartao, Esqueleto, Etiqueta, Vazio, dataCurta, moeda } from "@/components/portal/ui";
import { abrirDocumento } from "@/components/utils/documentoPdf";

const PERIODOS = [
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
  { dias: 365, rotulo: "12 meses" },
];
const DIA_MS = 86_400_000;
const SEMANA_MS = 7 * DIA_MS;
const SEMANAS_NO_MES = 5;
const MAIS_COMPRADOS = 5;
const LINHAS_NO_EXTRATO = 20;

const somar = (pedidos) => pedidos.reduce((total, pedido) => total + Number(pedido.total), 0);

function barrasPorSemana(pedidos, agora) {
  return Array.from({ length: SEMANAS_NO_MES }, (_, indice) => {
    const fim = agora - (SEMANAS_NO_MES - 1 - indice) * SEMANA_MS;
    const inicio = fim - SEMANA_MS;
    const daSemana = pedidos.filter(({ date_created }) => {
      const data = new Date(date_created).getTime();
      return data > inicio && data <= fim;
    });
    return { nome: new Date(inicio + DIA_MS).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), valor: somar(daSemana) };
  });
}

function barrasPorMes(pedidos, quantidade) {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, indice) => {
    const mes = new Date(hoje.getFullYear(), hoje.getMonth() - (quantidade - 1 - indice), 1);
    const doMes = pedidos.filter(({ date_created }) => {
      const data = new Date(date_created);
      return data.getMonth() === mes.getMonth() && data.getFullYear() === mes.getFullYear();
    });
    return { nome: mes.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), valor: somar(doMes) };
  });
}

// O valor aparece no topo do gráfico ao tocar ou passar o mouse: funciona igual no celular
function GraficoDeCompras({ barras, total, carregando }) {
  const [ativa, setAtiva] = useState(null);
  const maior = Math.max(...barras.map((barra) => barra.valor), 1);
  const selecionada = ativa === null ? null : barras[ativa];

  return (
    <Cartao className="p-4 md:p-5">
      <p className="text-sm text-zinc-500">{selecionada ? `Compras em ${selecionada.nome}` : "Compras no período"}</p>
      {carregando ? <Esqueleto className="mt-1 h-8 w-32" /> : <p className="text-2xl font-bold tabular-nums text-zinc-900">{moeda(selecionada ? selecionada.valor : total)}</p>}

      <div className="mt-4 flex h-36 items-end" onMouseLeave={() => setAtiva(null)}>
        {barras.map((barra, indice) => (
          <button key={barra.nome} type="button" aria-label={`${barra.nome}: ${moeda(barra.valor)}`} onMouseEnter={() => setAtiva(indice)} onFocus={() => setAtiva(indice)} onClick={() => setAtiva(indice)} className="flex h-full min-w-0 flex-1 flex-col justify-end px-0.5 md:px-2">
            <span className={`block w-full rounded-t ${barra.valor === 0 ? "bg-zinc-200" : ativa === indice ? "bg-violet-700" : "bg-violet-500"}`} style={{ height: barra.valor > 0 ? `${Math.max(3, (barra.valor / maior) * 100)}%` : "2px" }} />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex border-t border-zinc-200 pt-1.5">
        {barras.map((barra) => <span key={barra.nome} className="min-w-0 flex-1 truncate text-center text-[11px] text-zinc-500">{barra.nome}</span>)}
      </div>
    </Cartao>
  );
}

function ContasEmAberto({ pedidos }) {
  if (pedidos.length === 0) return null;

  return (
    <Cartao className="p-4 md:p-5">
      <h2 className="text-base font-bold text-zinc-900">Pedidos em aberto</h2>
      <ul className="mt-2 divide-y divide-zinc-100">
        {pedidos.map((pedido) => (
          <li key={pedido.id}>
            <Link href="/b2b-historico" className="flex min-h-14 items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900">Pedido #{pedido.id}</span>
                <span className="text-[13px] text-zinc-500">{situacaoDoPedido(pedido).rotulo}</span>
              </span>
              <span className="text-[15px] font-bold tabular-nums text-zinc-900">{moeda(pedido.total)}</span>
              <ChevronRight size={18} className="text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}

export default function Financeiro() {
  const { dados, carregando } = usePedidos();
  const { dados: cadastro } = useCadastro();
  const [dias, setDias] = useState(30);
  const [agora] = useState(() => Date.now());

  const periodo = useMemo(() => (dados || []).filter((pedido) => agora - new Date(pedido.date_created).getTime() <= dias * DIA_MS), [dados, dias, agora]);
  const validos = useMemo(() => periodo.filter((pedido) => situacaoDoPedido(pedido).grupo !== "cancelado"), [periodo]);
  const abertos = validos.filter((pedido) => situacaoDoPedido(pedido).grupo === "aberto");
  const pagos = validos.filter((pedido) => situacaoDoPedido(pedido).grupo === "pago");

  const barras = useMemo(() => {
    if (dias === 30) return barrasPorSemana(validos, agora);
    return barrasPorMes(validos, dias === 90 ? 3 : 12);
  }, [validos, dias, agora]);

  const ranking = useMemo(() => {
    const contagem = new Map();
    validos.forEach((pedido) => pedido.line_items?.forEach(({ name, quantity }) => contagem.set(name, (contagem.get(name) || 0) + (Number(quantity) || 1))));
    return [...contagem].sort((a, b) => b[1] - a[1]).slice(0, MAIS_COMPRADOS);
  }, [validos]);
  const maiorQuantidade = ranking[0]?.[1] || 1;

  const gerarPdf = () => {
    const usuario = lerUsuario();
    const html = montarPdfFinanceiro({
      cliente: usuario?.nome || usuario?.email || "Não informado",
      periodo: dias,
      pedidos: periodo,
      totalPago: somar(pagos),
      totalDevedor: somar(abertos),
      pedidosPagos: pagos.length,
      pedidosEmAberto: abertos.length,
      situacaoDoPedido: (pedido) => situacaoDoPedido(pedido).grupo,
      format: moeda,
    });
    if (!abrirDocumento(html)) toast.error("Libere as janelas do navegador para gerar o PDF.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Financeiro</h1>
        <div role="group" aria-label="Período" className="flex rounded-xl bg-zinc-200/70 p-1">
          {PERIODOS.map(({ dias: valor, rotulo }) => (
            <button key={valor} type="button" aria-pressed={dias === valor} onClick={() => setDias(valor)} className={`min-h-9 rounded-lg px-3 text-sm font-semibold ${dias === valor ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"}`}>{rotulo}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <GraficoDeCompras barras={barras} total={somar(validos)} carregando={carregando} />
          <ContasEmAberto pedidos={abertos} />
        </div>

        <div className="min-w-0 space-y-4">
          <Cartao className="divide-y divide-zinc-100">
            <div className="flex items-center justify-between gap-3 p-4"><span className="text-sm text-zinc-500">Em aberto</span><span className="text-lg font-bold tabular-nums text-zinc-900">{moeda(cadastro?.emAberto)}</span></div>
            <div className="flex items-center justify-between gap-3 p-4"><span className="text-sm text-zinc-500">Pedidos no período</span><span className="text-lg font-bold tabular-nums text-zinc-900">{validos.length}</span></div>
          </Cartao>

          {ranking.length > 0 && (
            <Cartao className="p-4 md:p-5">
              <h2 className="text-base font-bold text-zinc-900">Mais comprados</h2>
              <ul className="mt-3 space-y-3">
                {ranking.map(([nome, quantidade]) => (
                  <li key={nome}>
                    <div className="flex justify-between gap-3 text-[13px]"><span className="min-w-0 truncate text-zinc-700">{nome}</span><span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-zinc-900">{quantidade} un</span></div>
                    <div className="mt-1 h-1 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(quantidade / maiorQuantidade) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}

          <Link href="/b2b-xml" className="flex min-h-14 items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800">Notas e boletos <ChevronRight size={18} className="text-zinc-400" /></Link>
        </div>
      </div>

      <Cartao className="p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-zinc-900">Extrato</h2>
          <Botao variante="secundario" className="!min-h-10 !px-3 !text-sm" disabled={periodo.length === 0} onClick={gerarPdf}><Printer size={16} /> PDF</Botao>
        </div>
        {!carregando && periodo.length === 0 && <Vazio Icone={Wallet} titulo="Sem movimentação neste período" />}
        <ul className="mt-2 divide-y divide-zinc-100">
          {periodo.slice(0, LINHAS_NO_EXTRATO).map((pedido) => {
            const { rotulo, tom, grupo } = situacaoDoPedido(pedido);
            return (
              <li key={pedido.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold tabular-nums text-zinc-900">#{pedido.id}</span>
                    <Etiqueta tom={tom}>{rotulo}</Etiqueta>
                  </span>
                  <span className="mt-0.5 block text-[13px] text-zinc-500">{dataCurta(pedido.date_created)}</span>
                </span>
                <span className={`shrink-0 whitespace-nowrap text-right text-sm font-bold tabular-nums ${grupo === "cancelado" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>{moeda(pedido.total)}</span>
              </li>
            );
          })}
        </ul>
      </Cartao>
    </div>
  );
}
