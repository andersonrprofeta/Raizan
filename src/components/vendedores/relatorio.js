"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { mesDeHoje, nomeDoMes } from "@/components/vendedores/SeletorMes";
import { api, Carregando, EstadoVazio, Kpi, moeda, moedaCurta, VIDRO } from "@/components/vendedores/ui";

const eixoEmReais = (valor) => (valor >= 1000 ? `${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : valor);

function DicaGrafico({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-zinc-900/95 px-3.5 py-2.5 text-xs text-white shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold tabular-nums">{moeda(payload[0].value)}</p>
      <p className="text-zinc-400 tabular-nums">{payload[0].payload.pedidos} pedido(s)</p>
    </div>
  );
}

function Cartao({ titulo, children }) {
  return (
    <section className={`${VIDRO} p-5 min-w-0`}>
      <h2 className="font-semibold tracking-tight mb-4">{titulo}</h2>
      {children}
    </section>
  );
}

// Barras simples: leem melhor que pizza e não pesam a página
function Ranking({ itens, vazio }) {
  if (itens.length === 0) return <p className="text-sm text-zinc-500 py-6 text-center">{vazio}</p>;
  const maior = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <div className="space-y-3.5">
      {itens.map((item) => (
        <div key={item.nome}>
          <div className="flex justify-between gap-3 mb-1.5 text-sm">
            <span className="truncate text-zinc-700 dark:text-zinc-300" title={item.nome}>{item.nome}</span>
            <span className="shrink-0 font-semibold tabular-nums">{moedaCurta(item.valor)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div style={{ width: `${(item.valor / maior) * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaTop({ itens, detalhe, vazio }) {
  if (itens.length === 0) return <p className="text-sm text-zinc-500 py-6 text-center">{vazio}</p>;
  return (
    <ol className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
      {itens.map((item, indice) => (
        <li key={`${item.nome}-${indice}`} className="flex items-center gap-3 py-2.5">
          <span className="w-5 text-center text-sm tabular-nums text-zinc-400">{indice + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={item.nome}>{item.nome}</p>
            <p className="text-xs text-zinc-500 tabular-nums">{detalhe(item)}</p>
          </div>
          <span className="text-sm font-semibold tabular-nums shrink-0">{moeda(item.valor)}</span>
        </li>
      ))}
    </ol>
  );
}

const projetar = (faturado, competencia) => {
  const hoje = mesDeHoje();
  if (competencia.mes !== hoje.mes || competencia.ano !== hoje.ano) return null;
  const dia = new Date().getDate();
  const diasNoMes = new Date(competencia.ano, competencia.mes, 0).getDate();
  return (faturado / dia) * diasNoMes;
};

export default function TabDesempenho({ vendedor, competencia }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const ultimaBusca = useRef(0);

  useEffect(() => {
    (async () => {
      const busca = ++ultimaBusca.current;
      setCarregando(true);
      try {
        const data = await api(`/vendedores/${vendedor.id}/relatorio?mes=${competencia.mes}&ano=${competencia.ano}`);
        if (busca !== ultimaBusca.current) return;
        if (!data.success || !data.relatorio) throw new Error();
        setDados(data.relatorio);
      } catch (erro) {
        if (busca !== ultimaBusca.current) return;
        setDados(null);
        toast.error("Erro ao carregar o desempenho.");
      } finally {
        if (busca === ultimaBusca.current) setCarregando(false);
      }
    })();
  }, [vendedor.id, competencia]);

  if (!dados) {
    return carregando
      ? <Carregando texto="Analisando vendas..." />
      : <EstadoVazio icone={AlertTriangle} titulo="Sem dados" texto="Não foi possível carregar o desempenho deste vendedor." />;
  }

  const {
    carteiraKPIs = {}, vendasGeralMensal = [], vendasDiarias = [], vendasPorMarca = [],
    vendasPorCidade = [], topProdutos = [], topClientes = []
  } = dados;

  const mesAtual = vendasGeralMensal.at(-1) || { valor: 0, pedidos: 0, faturados: 0 };
  const mesAnterior = vendasGeralMensal.at(-2);
  const variacao = mesAnterior?.valor > 0 ? ((mesAtual.valor - mesAnterior.valor) / mesAnterior.valor) * 100 : null;
  const ticket = mesAtual.faturados > 0 ? mesAtual.valor / mesAtual.faturados : 0;
  const projecao = projetar(mesAtual.valor, competencia);

  // Dia que ainda não chegou fica fora: uma queda a zero no gráfico pareceria venda perdida
  const noMesCorrente = competencia.mes === mesDeHoje().mes && competencia.ano === mesDeHoje().ano;
  const diasDoGrafico = noMesCorrente ? vendasDiarias.filter((d) => Number(d.dia) <= new Date().getDate()) : vendasDiarias;

  return (
    <div className={`space-y-6 pb-10 transition-opacity ${carregando ? "opacity-50" : ""}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          rotulo="Faturado"
          valor={moedaCurta(mesAtual.valor)}
          detalhe={variacao === null ? nomeDoMes(competencia) : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}% sobre o mês anterior`}
        />
        <Kpi rotulo="Pedidos" valor={mesAtual.pedidos} detalhe={`${mesAtual.faturados} faturado(s)`} />
        <Kpi rotulo="Ticket médio" valor={moedaCurta(ticket)} detalhe="Por pedido faturado" />
        <Kpi rotulo={projecao === null ? "Clientes atendidos" : "Projeção do mês"} valor={projecao === null ? carteiraKPIs.atendidosMes ?? 0 : moedaCurta(projecao)} detalhe={projecao === null ? nomeDoMes(competencia) : "No ritmo atual"} />
      </div>

      <section className={`${VIDRO} grid grid-cols-2 sm:grid-cols-5 divide-black/[0.05] dark:divide-white/[0.05] sm:divide-x`}>
        {[
          ["Carteira", carteiraKPIs.totalBase],
          ["Atendidos no mês", carteiraKPIs.atendidosMes],
          ["Novos", carteiraKPIs.novosMes],
          ["Compraram em 45 dias", carteiraKPIs.positivados],
          ["Sem comprar há 60 dias", carteiraKPIs.inativos]
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="px-5 py-4 min-w-0">
            <p className="text-xl font-semibold tracking-tight tabular-nums">{valor ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1 truncate" title={rotulo}>{rotulo}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Cartao titulo="Últimos 6 meses">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendasGeralMensal} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93" }} tickFormatter={eixoEmReais} />
                <Tooltip content={<DicaGrafico />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
                <Bar dataKey="valor" fill="#7c3aed" radius={[8, 8, 3, 3]} maxBarSize={44} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>

        <Cartao titulo={`Dia a dia de ${nomeDoMes(competencia)}`}>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={diasDoGrafico} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id={`area-${vendedor.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93" }} minTickGap={16} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93" }} tickFormatter={eixoEmReais} />
                <Tooltip content={<DicaGrafico />} />
                <Area type="monotone" dataKey="valor" stroke="#7c3aed" strokeWidth={2} fill={`url(#area-${vendedor.id})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Cartao>

        <Cartao titulo="Marcas">
          <Ranking itens={vendasPorMarca.map((m) => ({ nome: m.name, valor: m.value }))} vazio="Sem faturamento por marca neste mês." />
        </Cartao>

        <Cartao titulo="Cidades">
          <Ranking itens={vendasPorCidade.map((c) => ({ nome: c.cidade, valor: c.valor }))} vazio="Sem faturamento por cidade neste mês." />
        </Cartao>

        <Cartao titulo="Produtos mais vendidos">
          <ListaTop itens={topProdutos} detalhe={(p) => `${p.qtd} unidade(s)`} vazio="Sem produtos neste mês." />
        </Cartao>

        <Cartao titulo="Maiores clientes">
          <ListaTop itens={topClientes} detalhe={(c) => `${c.pedidos} pedido(s)`} vazio="Sem clientes faturados neste mês." />
        </Cartao>
      </div>
    </div>
  );
}
