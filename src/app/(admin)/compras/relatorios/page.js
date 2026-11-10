"use client";

// Relatórios de compras do Raizan Core. Uma página com cartões; cada cartão abre o relatório aqui mesmo (?r=...).
// A inteligência (consumo, cortes, tendência, cobertura) é calculada na API: services/comprasRelatorios.js

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Boxes, Building2, Lightbulb, PackageX, Plus, RefreshCw, Truck, TrendingDown, TrendingUp, Scissors,
} from "lucide-react";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, Kpi, ROTULO, VIDRO, moedaCurta } from "@/components/vendedores/ui";
import { quantidade } from "@/components/compras/ui";
import { BotoesDeSaida, Pilula, TabelaRelatorio } from "@/components/compras/relatorios/comum";
import { FormularioDocumento } from "@/components/compras/FormularioDocumento";

const RELATORIOS = [
  { id: "sugestao", titulo: "Sugestão de compras", texto: "O que comprar agora, quanto e por quê: consumo real, cortes, saída acelerada, queda de venda e o que já está a caminho.", icone: Lightbulb, destaque: true },
  { id: "cortes", titulo: "Cortes e ruptura", texto: "Produtos que os clientes pediram e não foram atendidos por falta de estoque, e quanto isso custou.", icone: Scissors },
  { id: "estoque", titulo: "Estoque de produtos", texto: "Saldo, cobertura, valor parado, zerados, abaixo do mínimo e itens sem venda.", icone: Boxes },
  { id: "abc", titulo: "Curva ABC de compras", texto: "Onde está o dinheiro das compras: os poucos itens que somam 80% do valor comprado.", icone: BarChart3 },
  { id: "fornecedores", titulo: "Compras por fornecedor", texto: "Quanto foi comprado de cada fornecedor, participação e prazo médio de entrega.", icone: Building2 },
  { id: "transito", titulo: "Compras em trânsito", texto: "Pedidos emitidos e ainda não recebidos, com previsão e atraso. Evita comprar duas vezes.", icone: Truck },
];

const SITUACAO_DA_SUGESTAO = {
  ruptura: { rotulo: "Ruptura", classe: "text-rose-700 dark:text-rose-300 bg-rose-500/15" },
  critico: { rotulo: "Crítico", classe: "text-rose-700 dark:text-rose-400 bg-rose-500/10" },
  atencao: { rotulo: "Atenção", classe: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
  saudavel: { rotulo: "Saudável", classe: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" },
};
const SITUACAO_DO_ESTOQUE = {
  zerado: { rotulo: "Zerado", classe: "text-rose-700 dark:text-rose-400 bg-rose-500/10" },
  abaixo_minimo: { rotulo: "Abaixo do mínimo", classe: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
  parado: { rotulo: "Parado", classe: "text-zinc-600 dark:text-zinc-300 bg-black/[0.05] dark:bg-white/[0.08]" },
  normal: { rotulo: "Normal", classe: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" },
};
const CLASSE_ABC = { A: "text-purple-700 dark:text-purple-300 bg-purple-500/15", B: "text-sky-700 dark:text-sky-300 bg-sky-500/10", C: "text-zinc-600 dark:text-zinc-300 bg-black/[0.05] dark:bg-white/[0.08]" };
const ICONE_DO_ALERTA = { acelerando: TrendingUp, queda: TrendingDown, corte: Scissors };

const hojeIso = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
const diasAtrasIso = (dias) => new Date(Date.now() - 3 * 60 * 60 * 1000 - dias * 86400000).toISOString().slice(0, 10);
const produtoComSku = (l) => (
  <span className="block min-w-[200px]">
    <span className="block font-medium">{l.nome || l.descricao}</span>
    <span className="block text-[11px] font-mono text-zinc-500">{[l.sku || l.codigo, l.marca].filter(Boolean).join(" · ")}</span>
  </span>
);

// ==========================================
// DEFINIÇÃO DE CADA RELATÓRIO (colunas, indicadores e filtros)
// ==========================================
const DEFINICOES = {
  cortes: {
    filtros: ["periodo"],
    kpis: (r) => [["Produtos com corte", r.resumo.produtos], ["Unidades cortadas", quantidade(r.resumo.unidades)], ["Venda perdida", moedaCurta(r.resumo.valor_perdido)], ["Zerados agora", r.resumo.zerados_agora]],
    colunas: [
      { chave: "nome", rotulo: "Produto", render: produtoComSku },
      { chave: "sku", rotulo: "SKU", soPlanilha: true },
      { chave: "cortado", rotulo: "Cortado", tipo: "qtd" },
      { chave: "pedido", rotulo: "Pedido", tipo: "qtd" },
      { chave: "atendimento", rotulo: "Atendido", tipo: "pct" },
      { chave: "valor_perdido", rotulo: "Venda perdida", tipo: "moeda" },
      { chave: "pedidos", rotulo: "Pedidos", tipo: "qtd" },
      { chave: "clientes", rotulo: "Clientes", tipo: "qtd" },
      { chave: "estoque", rotulo: "Estoque hoje", tipo: "qtd" },
      { chave: "ultimo", rotulo: "Último corte", tipo: "dia" },
    ],
  },
  estoque: {
    filtros: ["situacao", "marca", "parado"],
    kpis: (r) => [["Valor em estoque", moedaCurta(r.resumo.valor)], ["Zerados", r.resumo.zerados], ["Abaixo do mínimo", r.resumo.abaixo_minimo], ["Parados", `${r.resumo.parados} · ${moedaCurta(r.resumo.valor_parado)}`]],
    colunas: [
      { chave: "nome", rotulo: "Produto", render: produtoComSku },
      { chave: "sku", rotulo: "SKU", soPlanilha: true },
      { chave: "marca", rotulo: "Marca", soPlanilha: true },
      { chave: "estoque", rotulo: "Estoque", tipo: "qtd" },
      { chave: "minimo", rotulo: "Mínimo", tipo: "qtd" },
      { chave: "consumo_mes", rotulo: "Venda/mês", tipo: "qtd" },
      { chave: "cobertura_dias", rotulo: "Cobertura", tipo: "dias" },
      { chave: "custo", rotulo: "Último custo", tipo: "moeda" },
      { chave: "valor_estoque", rotulo: "Valor", tipo: "moeda" },
      { chave: "ultima_venda", rotulo: "Última venda", tipo: "dia" },
      { chave: "situacao", rotulo: "Situação", valor: (l) => SITUACAO_DO_ESTOQUE[l.situacao]?.rotulo, render: (l) => <Pilula classe={SITUACAO_DO_ESTOQUE[l.situacao].classe}>{SITUACAO_DO_ESTOQUE[l.situacao].rotulo}</Pilula> },
    ],
  },
  abc: {
    filtros: ["periodo", "fornecedor_livre", "marca_livre"],
    kpis: (r) => [["Total comprado", moedaCurta(r.resumo.total)], ["Classe A", `${r.resumo.A.itens} itens · ${moedaCurta(r.resumo.A.valor)}`], ["Classe B", `${r.resumo.B.itens} itens · ${moedaCurta(r.resumo.B.valor)}`], ["Classe C", `${r.resumo.C.itens} itens · ${moedaCurta(r.resumo.C.valor)}`]],
    aviso: (r) => (r.base === "pedido" ? "Sem NF-e de entrada no período: a curva foi feita com os pedidos de compra." : null),
    colunas: [
      { chave: "classe", rotulo: "Classe", render: (l) => <Pilula classe={CLASSE_ABC[l.classe]}>{l.classe}</Pilula> },
      { chave: "descricao", rotulo: "Produto", render: produtoComSku },
      { chave: "codigo", rotulo: "Código", soPlanilha: true },
      { chave: "marca", rotulo: "Marca", soPlanilha: true },
      { chave: "fornecedor", rotulo: "Fornecedor" },
      { chave: "quantidade", rotulo: "Quantidade", tipo: "qtd" },
      { chave: "valor", rotulo: "Valor comprado", tipo: "moeda" },
      { chave: "participacao", rotulo: "Part.", tipo: "pct" },
      { chave: "acumulado", rotulo: "Acumulado", tipo: "pct" },
    ],
  },
  fornecedores: {
    filtros: ["periodo"],
    kpis: (r) => [["Total comprado", moedaCurta(r.resumo.total)], ["Fornecedores", r.resumo.fornecedores], ["Pedidos de compra", r.resumo.pedidos], ["NF-es de entrada", r.resumo.notas]],
    colunas: [
      { chave: "fornecedor", rotulo: "Fornecedor", classe: "font-medium" },
      { chave: "pedidos", rotulo: "Pedidos", tipo: "qtd" },
      { chave: "valor_pedidos", rotulo: "Valor em pedidos", tipo: "moeda" },
      { chave: "notas", rotulo: "NF-es", tipo: "qtd" },
      { chave: "valor_notas", rotulo: "Valor em notas", tipo: "moeda" },
      { chave: "participacao", rotulo: "Part.", tipo: "pct" },
      { chave: "prazo_medio", rotulo: "Prazo médio", tipo: "dias" },
      { chave: "ultima", rotulo: "Última compra", tipo: "dia" },
    ],
  },
  transito: {
    filtros: ["atrasados"],
    kpis: (r) => [["Pedidos a receber", r.resumo.pedidos], ["Atrasados", r.resumo.atrasados], ["Itens a caminho", r.resumo.itens], ["Valor a receber", moedaCurta(r.resumo.valor)]],
    colunas: [
      { chave: "pedido", rotulo: "Pedido", render: (l) => <Link href={`/compras/pedidos/documento?id=${l.compra_id}`} onClick={(e) => e.stopPropagation()} className="font-semibold tabular-nums text-purple-700 dark:text-purple-300 hover:underline">{l.pedido}</Link> },
      { chave: "fornecedor", rotulo: "Fornecedor" },
      { chave: "descricao", rotulo: "Produto", render: (l) => produtoComSku({ nome: l.descricao, sku: l.sku }) },
      { chave: "sku", rotulo: "SKU", soPlanilha: true },
      { chave: "falta", rotulo: "Falta chegar", tipo: "qtd" },
      { chave: "comprado", rotulo: "Comprado", tipo: "qtd" },
      { chave: "valor", rotulo: "Valor", tipo: "moeda" },
      { chave: "previsao", rotulo: "Previsão", tipo: "dia" },
      { chave: "atraso", rotulo: "Atraso", tipo: "dias", render: (l) => (l.atraso > 0 ? <span className="font-semibold text-rose-600">{l.atraso} {l.atraso === 1 ? "dia" : "dias"}</span> : "—") },
    ],
  },
};

const COLUNAS_DA_SUGESTAO = [
  { chave: "situacao", rotulo: "Situação", valor: (l) => SITUACAO_DA_SUGESTAO[l.situacao].rotulo, render: (l) => <Pilula classe={SITUACAO_DA_SUGESTAO[l.situacao].classe}>{SITUACAO_DA_SUGESTAO[l.situacao].rotulo}</Pilula> },
  {
    chave: "nome", rotulo: "Produto", render: (l) => (
      <span className="block min-w-[220px]">
        <span className="block font-medium">{l.nome}</span>
        <span className="block text-[11px] font-mono text-zinc-500">{[l.sku, l.marca].filter(Boolean).join(" · ")}</span>
        {l.alertas.length > 0 && (
          <span className="flex flex-wrap gap-1 mt-1">
            {l.alertas.map((a) => {
              const Icone = ICONE_DO_ALERTA[a.tipo] || AlertTriangle;
              return <span key={a.tipo} title={a.texto} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-700 dark:text-amber-400"><Icone size={11} />{a.tipo === "acelerando" ? "Saída acelerada" : a.tipo === "queda" ? "Venda caindo" : "Com cortes"}</span>;
            })}
          </span>
        )}
      </span>
    ),
  },
  { chave: "sku", rotulo: "SKU", soPlanilha: true },
  { chave: "marca", rotulo: "Marca", soPlanilha: true },
  { chave: "estoque", rotulo: "Estoque", tipo: "qtd" },
  { chave: "transito", rotulo: "A caminho", tipo: "qtd" },
  { chave: "venda_mes", rotulo: "Venda/mês", tipo: "qtd", valor: (l) => Math.round(l.consumo_dia * 30 * 10) / 10 },
  { chave: "cortes_30", rotulo: "Cortes 30d", tipo: "qtd" },
  { chave: "acaba_em", rotulo: "Acaba em", tipo: "dias" },
  { chave: "prazo_entrega", rotulo: "Entrega", tipo: "dias", soPlanilha: true },
  { chave: "sugestao", rotulo: "Comprar", tipo: "qtd", classe: "font-semibold text-purple-700 dark:text-purple-300" },
  { chave: "custo", rotulo: "Último custo", tipo: "moeda" },
  { chave: "valor_sugestao", rotulo: "Valor", tipo: "moeda" },
  { chave: "fornecedor", rotulo: "Último fornecedor" },
  { chave: "motivos", rotulo: "Justificativa", soPlanilha: true, valor: (l) => [...l.alertas.map((a) => a.texto), ...l.motivos].join(" ") },
];

// ==========================================
// FILTROS
// ==========================================
function Filtros({ tipos, valores, onMudar, marcas = [], fornecedores = [] }) {
  const campo = (id, rotulo, elemento) => <div key={id} className="min-w-[150px]"><label className={ROTULO} htmlFor={`f-${id}`}>{rotulo}</label>{elemento}</div>;
  const selecao = (id, opcoes, vazio) => (
    <select id={`f-${id}`} value={valores[id] || ""} onChange={(e) => onMudar({ [id]: e.target.value })} className={`${CAMPO} h-10`}>
      <option value="">{vazio}</option>
      {opcoes.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
    </select>
  );
  return (
    <div className="flex flex-wrap items-end gap-3">
      {tipos.includes("periodo") && [
        campo("de", "De", <input id="f-de" type="date" value={valores.de || ""} onChange={(e) => onMudar({ de: e.target.value })} className={`${CAMPO} h-10`} />),
        campo("ate", "Até", <input id="f-ate" type="date" value={valores.ate || ""} onChange={(e) => onMudar({ ate: e.target.value })} className={`${CAMPO} h-10`} />),
      ]}
      {tipos.includes("prazo") && campo("prazo", "Prazo de entrega (dias)", <input id="f-prazo" type="number" min={1} max={120} value={valores.prazo || ""} onChange={(e) => onMudar({ prazo: e.target.value })} className={`${CAMPO} h-10 w-32`} />)}
      {tipos.includes("cobertura") && campo("cobertura", "Estoque para (dias)", <input id="f-cobertura" type="number" min={1} max={365} value={valores.cobertura || ""} onChange={(e) => onMudar({ cobertura: e.target.value })} className={`${CAMPO} h-10 w-32`} />)}
      {tipos.includes("situacao") && campo("situacao", "Situação", selecao("situacao", Object.entries(SITUACAO_DO_ESTOQUE).map(([k, v]) => [k, v.rotulo]), "Todas"))}
      {(tipos.includes("marca") || tipos.includes("marca_livre")) && campo("marca", "Marca", tipos.includes("marca")
        ? selecao("marca", marcas.map((m) => [m, m]), "Todas")
        : <input id="f-marca" value={valores.marca || ""} onChange={(e) => onMudar({ marca: e.target.value })} placeholder="Todas" className={`${CAMPO} h-10`} />)}
      {tipos.includes("fornecedor") && campo("fornecedor", "Fornecedor", selecao("fornecedor", fornecedores.map((f) => [f, f]), "Todos"))}
      {tipos.includes("fornecedor_livre") && campo("fornecedor", "Fornecedor", <input id="f-fornecedor" value={valores.fornecedor || ""} onChange={(e) => onMudar({ fornecedor: e.target.value })} placeholder="Todos" className={`${CAMPO} h-10`} />)}
      {tipos.includes("parado") && campo("parado", "Parado há (dias)", <input id="f-parado" type="number" min={7} value={valores.parado || ""} onChange={(e) => onMudar({ parado: e.target.value })} placeholder="90" className={`${CAMPO} h-10 w-28`} />)}
      {tipos.includes("atrasados") && (
        <label className="flex items-center gap-2 h-10 text-sm font-medium"><input type="checkbox" checked={valores.atrasados === "1"} onChange={(e) => onMudar({ atrasados: e.target.checked ? "1" : "" })} className="accent-purple-600 w-4 h-4" />Só atrasados</label>
      )}
      {tipos.includes("todos") && (
        <label className="flex items-center gap-2 h-10 text-sm font-medium"><input type="checkbox" checked={valores.todos === "1"} onChange={(e) => onMudar({ todos: e.target.checked ? "1" : "" })} className="accent-purple-600 w-4 h-4" />Mostrar também os saudáveis</label>
      )}
    </div>
  );
}

function useRelatorio(tipo, filtros) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const consulta = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== "" && v !== null && v !== undefined));
      const resposta = await api(`/compras-relatorios/${tipo}?${consulta.toString()}`);
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível montar o relatório."); setDados({ erro: true, linhas: [] }); return; }
      setDados(resposta);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
      setDados({ erro: true, linhas: [] });
    } finally {
      setCarregando(false);
    }
  }, [tipo, filtros]);
  useEffect(() => {
    const espera = setTimeout(carregar, 300);
    return () => clearTimeout(espera);
  }, [carregar]);
  return { dados, carregando, carregar };
}

// ==========================================
// SUGESTÃO DE COMPRAS
// ==========================================
function Sugestao() {
  const [filtros, setFiltros] = useState({ prazo: "7", cobertura: "30", fornecedor: "", marca: "", todos: "" });
  const { dados, carregando, carregar } = useRelatorio("sugestao", filtros);
  const [selecionados, setSelecionados] = useState({});
  const [rascunho, setRascunho] = useState(null);
  const router = useRouter();
  const linhas = useMemo(() => dados?.linhas || [], [dados]);

  const marcar = (linha, valor) => setSelecionados((atual) => {
    const novo = { ...atual };
    if (valor) novo[linha.produto_id] = linha; else delete novo[linha.produto_id];
    return novo;
  });
  const escolhidos = Object.values(selecionados);
  const todosMarcados = linhas.filter((l) => l.sugestao > 0).length > 0 && linhas.filter((l) => l.sugestao > 0).every((l) => selecionados[l.produto_id]);

  const criarPedido = () => {
    const fornecedores = [...new Set(escolhidos.map((l) => l.fornecedor).filter(Boolean))];
    setRascunho({
      inicial: {
        fornecedor: fornecedores.length === 1 ? fornecedores[0] : "",
        observacao: `Gerado pela sugestão de compras (entrega ${dados?.parametros?.prazo} dias, estoque para ${dados?.parametros?.cobertura} dias).`,
      },
      itens: escolhidos.map((l) => ({
        produto_id: l.produto_id, sku: l.sku, ean: "", descricao: l.nome, fabricante: l.marca || "", unidade: l.unidade || "UN",
        quantidade: Math.max(l.sugestao, 1), valor_unitario: l.custo ?? "",
      })),
    });
  };

  const colunas = [
    {
      chave: "selecao", rotulo: "", ordenavel: false, soTela: true,
      render: (l) => <input type="checkbox" aria-label={`Selecionar ${l.nome}`} checked={Boolean(selecionados[l.produto_id])} onClick={(e) => e.stopPropagation()} onChange={(e) => marcar(l, e.target.checked)} className="accent-purple-600 w-4 h-4" />,
    },
    ...COLUNAS_DA_SUGESTAO,
  ];
  const resumo = dados?.resumo;

  return (
    <>
      {resumo && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi rotulo="Em ruptura" valor={resumo.ruptura} tom={resumo.ruptura ? "text-rose-600 dark:text-rose-400" : ""} detalhe="Zerados com venda" />
          <Kpi rotulo="Críticos" valor={resumo.critico} tom={resumo.critico ? "text-rose-600 dark:text-rose-400" : ""} detalhe="Acabam antes de a compra chegar" />
          <Kpi rotulo="Saída acelerada" valor={resumo.acelerando} detalhe={`${resumo.com_corte} com cortes em 30 dias`} />
          <Kpi rotulo="Compra sugerida" valor={moedaCurta(resumo.valor_sugerido)} detalhe={`${resumo.itens_sugeridos} produtos`} />
        </section>
      )}

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="p-5 sm:p-6 space-y-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <Filtros tipos={["prazo", "cobertura", "fornecedor", "marca", "todos"]} valores={filtros} onMudar={(m) => setFiltros((f) => ({ ...f, ...m }))} marcas={dados?.marcas} fornecedores={dados?.fornecedores} />
          <p className="text-xs text-zinc-500 max-w-3xl">
            A conta usa o que os clientes pediram (inclusive o que foi cortado) nos últimos 7 a 180 dias, com mais peso no último mês. Quando a semana dispara, o consumo sobe; quando o mês despenca, a sugestão segura.
            O prazo de entrega é o do fornecedor quando já há histórico de entregas; senão, o informado aqui. Clique numa linha para ver a justificativa.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setSelecionados(todosMarcados ? {} : Object.fromEntries(linhas.filter((l) => l.sugestao > 0).map((l) => [l.produto_id, l])))} className={`${BOTAO_SECUNDARIO} h-10`}>
              {todosMarcados ? "Desmarcar todos" : "Marcar os sugeridos"}
            </button>
            <button type="button" onClick={carregar} disabled={carregando} className={`${BOTAO_SECUNDARIO.replace("px-5", "px-0")} h-10 w-10`} aria-label="Recalcular"><RefreshCw size={15} className={carregando ? "animate-spin" : ""} /></button>
            <span className="flex-1" />
            <BotoesDeSaida nome="sugestao-de-compras" titulo="Sugestão de compras" subtitulo={dados?.parametros ? `Entrega em ${dados.parametros.prazo} dias · estoque para ${dados.parametros.cobertura} dias` : ""} colunas={COLUNAS_DA_SUGESTAO} linhas={escolhidos.length ? escolhidos : linhas} />
            <button type="button" disabled={!escolhidos.length} onClick={criarPedido} className={`${BOTAO_PRIMARIO} h-10`}><Plus size={15} />Criar pedido com {escolhidos.length || ""} {escolhidos.length === 1 ? "item" : "itens"}</button>
          </div>
        </div>
        {carregando && !dados ? <Carregando texto="Calculando a sugestão..." /> : (
          <TabelaRelatorio
            colunas={colunas}
            linhas={linhas}
            chave={(l) => l.produto_id}
            vazio="Nenhum produto precisa de compra com esses parâmetros."
            detalhe={(l) => (
              <div className="space-y-1.5 text-sm">
                {l.alertas.map((a) => <p key={a.tipo} className="font-medium text-amber-700 dark:text-amber-400">{a.texto}</p>)}
                {l.motivos.map((m) => <p key={m} className="text-zinc-600 dark:text-zinc-300">{m}</p>)}
                <p className="text-[11px] text-zinc-500">Vendas: 7d {quantidade(l.vendas[7])} · 15d {quantidade(l.vendas[15])} · 30d {quantidade(l.vendas[30])} · 60d {quantidade(l.vendas[60])} · 90d {quantidade(l.vendas[90])} · 180d {quantidade(l.vendas[180])}</p>
              </div>
            )}
          />
        )}
      </section>

      {rascunho && (
        <FormularioDocumento
          tipo="pedido"
          documento={null}
          itensAtuais={rascunho.itens}
          inicial={rascunho.inicial}
          fornecedores={dados?.fornecedores || []}
          onFechar={() => setRascunho(null)}
          onSalvo={(id) => { setRascunho(null); setSelecionados({}); router.push(`/compras/pedidos/documento?id=${id}`); }}
        />
      )}
    </>
  );
}

// ==========================================
// RELATÓRIOS DE TABELA
// ==========================================
function RelatorioSimples({ tipo, titulo }) {
  const definicao = DEFINICOES[tipo];
  const [filtros, setFiltros] = useState(() => (definicao.filtros.includes("periodo") ? { de: diasAtrasIso(89), ate: hojeIso() } : {}));
  const { dados, carregando } = useRelatorio(tipo, filtros);
  const pronto = dados && !dados.erro;
  const kpis = pronto ? definicao.kpis(dados) : [];
  const aviso = pronto && definicao.aviso ? definicao.aviso(dados) : null;
  const subtitulo = pronto && dados.periodo ? `Período de ${dados.periodo.de.split("-").reverse().join("/")} a ${dados.periodo.ate.split("-").reverse().join("/")}` : "";

  return (
    <>
      {pronto && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(([rotulo, valor]) => <Kpi key={rotulo} rotulo={rotulo} valor={valor} />)}
        </section>
      )}
      <section className={`${VIDRO} overflow-hidden`}>
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <Filtros tipos={definicao.filtros} valores={filtros} onMudar={(m) => setFiltros((f) => ({ ...f, ...m }))} marcas={dados?.marcas} />
          <BotoesDeSaida nome={tipo} titulo={titulo} subtitulo={subtitulo} resumo={kpis} colunas={definicao.colunas} linhas={dados?.linhas || []} />
        </div>
        {aviso && <p className="px-6 py-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-500/[0.06]">{aviso}</p>}
        {carregando && !dados ? <Carregando texto="Montando o relatório..." /> : <TabelaRelatorio colunas={definicao.colunas} linhas={dados?.linhas || []} />}
      </section>
    </>
  );
}

// ==========================================
// PÁGINA
// ==========================================
function Relatorios() {
  const tipo = useSearchParams().get("r");
  const relatorio = RELATORIOS.find((r) => r.id === tipo);

  if (!relatorio) {
    return (
      <CascaPagina>
        <header>
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Compras</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">Relatórios de compras</h1>
          <p className="text-zinc-500 mt-1">Do que comprar agora até onde o dinheiro das compras está parado.</p>
        </header>
        <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {RELATORIOS.map(({ id, titulo, texto, icone: Icone, destaque }) => (
            <Link key={id} href={`/compras/relatorios?r=${id}`} className={`${VIDRO} group p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-lg transition-all ${destaque ? "sm:col-span-2 xl:col-span-1 ring-1 ring-purple-500/30" : ""}`}>
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${destaque ? "bg-purple-600 text-white" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}><Icone size={20} /></span>
              <span className="flex-1">
                <span className="block text-lg font-semibold text-zinc-900 dark:text-white">{titulo}</span>
                <span className="block text-sm text-zinc-500 mt-1">{texto}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400">Abrir<ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          ))}
        </section>
        <p className="text-xs text-zinc-500 flex items-center gap-1.5"><PackageX size={13} />Os números de estoque vêm do cadastro de produtos; vendas e cortes vêm dos pedidos.</p>
      </CascaPagina>
    );
  }

  return (
    <CascaPagina>
      <Link href="/compras/relatorios" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors w-fit">
        <ArrowLeft size={16} />Relatórios de compras
      </Link>
      <header>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">{relatorio.titulo}</h1>
        <p className="text-zinc-500 mt-1 max-w-3xl">{relatorio.texto}</p>
      </header>
      {tipo === "sugestao" ? <Sugestao /> : <RelatorioSimples key={tipo} tipo={tipo} titulo={relatorio.titulo} />}
    </CascaPagina>
  );
}

export default function PaginaDeRelatorios() {
  return (
    <Suspense fallback={null}>
      <Relatorios />
    </Suspense>
  );
}
