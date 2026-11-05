"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Calculator, CheckCircle2, Copy, FileSpreadsheet, FileText, Lock, Plus, Search, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import { nomeDoMes } from "@/components/vendedores/SeletorMes";
import {
  api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio, Kpi, lerMoeda, mascaraMoeda, moeda, Modal, ROTULO, Segmentado, VIDRO
} from "@/components/vendedores/ui";

const SECOES = [
  { id: "apuracao", rotulo: "Apuração", icone: Calculator },
  { id: "regras", rotulo: "Regras", icone: Settings2 }
];

const reais = (valor) => Number(valor || 0).toFixed(2).replace(".", ",");

const TIPOS_DE_AJUSTE = [
  { id: "devolucao", rotulo: "Devolução" },
  { id: "cancelamento", rotulo: "Cancelamento" },
  { id: "estorno", rotulo: "Estorno" },
  { id: "manual", rotulo: "Manual" }
];
const ROTULO_DO_TIPO = { ...Object.fromEntries(TIPOS_DE_AJUSTE.map((t) => [t.id, t.rotulo])), refechamento: "Recálculo" };
const ROTULO_DA_ORIGEM = { omie: "Omie", erp: "ERP", manual: "Manual" };

const usuarioLogado = () => {
  try {
    return JSON.parse(localStorage.getItem("@raizan:user"))?.nome || "";
  } catch (erro) {
    return "";
  }
};

function ModalAjuste({ vendedor, competencia, onFechar, onLancado }) {
  const [tipo, setTipo] = useState("devolucao");
  const [sentido, setSentido] = useState("desconto");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lancar = async () => {
    if (lerMoeda(valor) <= 0) return toast.error("Digite o valor do ajuste.");
    if (!motivo.trim()) return toast.error("Informe o motivo.");

    setSalvando(true);
    try {
      const data = await api("/comissoes/ajustes", {
        metodo: "POST",
        corpo: {
          vendedor_id: vendedor.id, ...competencia, tipo, motivo, referencia, usuario: usuarioLogado(),
          valor: sentido === "desconto" ? -lerMoeda(valor) : lerMoeda(valor)
        }
      });
      if (!data.success) throw new Error(data.message);
      toast.success("Ajuste lançado.");
      onLancado();
    } catch (erro) {
      toast.error(erro.message || "Erro ao lançar o ajuste.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo="Novo ajuste"
      descricao={`Entra na comissão de ${nomeDoMes(competencia)}. Depois de lançado não pode ser apagado: para corrigir, lance o valor contrário.`}
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={lancar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>Lançar ajuste</button>
      </>}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="tipo-ajuste" className={ROTULO}>Tipo</label>
          <select id="tipo-ajuste" value={tipo} onChange={(e) => setTipo(e.target.value)} className={CAMPO}>
            {TIPOS_DE_AJUSTE.map((t) => <option key={t.id} value={t.id}>{t.rotulo}</option>)}
          </select>
        </div>
        <Segmentado
          opcoes={[{ id: "desconto", rotulo: "Descontar" }, { id: "credito", rotulo: "Acrescentar" }]}
          valor={sentido}
          onChange={setSentido}
        />
        <div>
          <label htmlFor="valor-ajuste" className={ROTULO}>Valor da comissão</label>
          <input id="valor-ajuste" inputMode="numeric" placeholder="0,00" value={valor} onChange={(e) => setValor(mascaraMoeda(e.target.value))} className={`${CAMPO} tabular-nums`} />
        </div>
        <div>
          <label htmlFor="motivo-ajuste" className={ROTULO}>Motivo</label>
          <input id="motivo-ajuste" maxLength={255} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label htmlFor="referencia-ajuste" className={ROTULO}>Pedido ou nota (opcional)</label>
          <input id="referencia-ajuste" maxLength={100} value={referencia} onChange={(e) => setReferencia(e.target.value)} className={CAMPO} />
        </div>
      </div>
    </Modal>
  );
}

function Historico({ resumo, ajustes, podeLancar, onNovo }) {
  const somaDoTipo = (tipo) => ajustes.filter((a) => a.tipo === tipo).reduce((acc, a) => acc + a.valor, 0);
  const linhas = [
    ["Comissão original", resumo.comissao_original],
    ["Ajustes por devolução", somaDoTipo("devolucao")],
    ["Ajustes por cancelamento", somaDoTipo("cancelamento")],
    ["Estornos", somaDoTipo("estorno")],
    ["Ajustes manuais", somaDoTipo("manual")]
  ];

  return (
    <section className={`${VIDRO} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
        <h2 className="font-semibold tracking-tight">Histórico financeiro</h2>
        {podeLancar && <button type="button" onClick={onNovo} className={BOTAO_SECUNDARIO}><Plus size={15} /> Novo ajuste</button>}
      </div>

      <dl className="px-5 py-3 divide-y divide-black/[0.05] dark:divide-white/[0.05] text-sm tabular-nums">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4 py-2">
            <dt className="text-zinc-500">{rotulo}</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{moeda(valor)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-2.5 font-semibold">
          <dt>Comissão líquida</dt>
          <dd className="text-purple-600 dark:text-purple-400">{moeda(resumo.comissao_liquida)}</dd>
        </div>
      </dl>

      {ajustes.length > 0 && (
        <ul className="border-t border-black/[0.05] dark:border-white/[0.06] divide-y divide-black/[0.05] dark:divide-white/[0.05]">
          {ajustes.map((ajuste) => (
            <li key={ajuste.id} className="flex items-start justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {ROTULO_DO_TIPO[ajuste.tipo] || ajuste.tipo}
                  <span className="ml-2 text-xs font-normal text-zinc-500">{ROTULO_DA_ORIGEM[ajuste.origem] || ajuste.origem}</span>
                </p>
                {ajuste.motivo && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{ajuste.motivo}</p>}
                <p className="text-xs text-zinc-500 mt-0.5">
                  {ajuste.criado_em_br}
                  {ajuste.criado_por && ` · ${ajuste.criado_por}${ajuste.usuario_verificado ? "" : " (não verificado)"}`}
                  {ajuste.referencia && ` · ${ajuste.referencia}`}
                </p>
              </div>
              {ajuste.tipo !== "refechamento" && (
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${ajuste.valor < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {ajuste.valor > 0 ? "+ " : ""}{moeda(ajuste.valor)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Apuracao({ vendedor, competencia }) {
  const { mes, ano } = competencia;
  const [apuracao, setApuracao] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [resumo, setResumo] = useState({ fechado: false, congelado: false, comissao_original: 0, comissao_liquida: 0 });
  const [lancando, setLancando] = useState(false);
  const [fechamento, setFechamento] = useState(null);
  const [pendentes, setPendentes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [fechando, setFechando] = useState(false);
  const ultimaBusca = useRef(0);

  // Trocar de mês rápido não pode deixar a resposta de um mês na tela de outro
  const carregar = useCallback(async () => {
    const busca = ++ultimaBusca.current;
    setCarregando(true);
    try {
      const [dataApuracao, dataFechamentos] = await Promise.all([
        api(`/comissoes/apuracao?vendedor_id=${vendedor.id}&mes=${mes}&ano=${ano}`),
        api(`/comissoes/fechamentos?vendedor_id=${vendedor.id}`)
      ]);
      if (busca !== ultimaBusca.current) return;
      if (!dataApuracao.success) throw new Error();

      setApuracao(dataApuracao.apuracao || []);
      setAjustes(dataApuracao.ajustes || []);
      setResumo({
        fechado: Boolean(dataApuracao.fechado),
        congelado: Boolean(dataApuracao.congelado),
        comissao_original: dataApuracao.comissao_original || 0,
        comissao_liquida: dataApuracao.comissao_liquida || 0
      });
      setPendentes(dataApuracao.pendentes || null);
      setFechamento((dataFechamentos.fechamentos || []).find((f) => Number(f.mes) === mes && Number(f.ano) === ano) || null);
    } catch (erro) {
      if (busca !== ultimaBusca.current) return;
      setApuracao([]);
      setAjustes([]);
      setResumo({ fechado: false, congelado: false, comissao_original: 0, comissao_liquida: 0 });
      setPendentes(null);
      setFechamento(null);
      toast.error("Erro ao carregar a apuração do mês.");
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  }, [vendedor.id, mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);

  const totais = apuracao.reduce((acc, item) => ({
    vendas: acc.vendas + item.vendas,
    devolucoes: acc.devolucoes + item.devolucoes,
    base: acc.base + item.base,
    comissao: acc.comissao + item.comissao
  }), { vendas: 0, devolucoes: 0, base: 0, comissao: 0 });

  const fechar = async () => {
    setFechando(true);
    try {
      const data = await api("/comissoes/fechar", {
        metodo: "POST",
        corpo: { vendedor_id: vendedor.id, mes, ano, usuario: usuarioLogado() }
      });
      if (!data.success) throw new Error();
      toast.success(`Comissão de ${nomeDoMes(competencia)} fechada.`);
      carregar();
    } catch (erro) {
      toast.error("Erro ao fechar a comissão.");
    } finally {
      setFechando(false);
    }
  };

  const exportarCsv = () => {
    const linhas = apuracao.map((i) => `"${i.marca}";"${reais(i.vendas)}";"${reais(i.devolucoes)}";"${reais(i.base)}";"${String(i.regra).replace(".", ",")}";"${reais(i.comissao)}"`);
    const csv = ["Marca;Vendas;Devolucoes;Base;Regra (%);Comissao", ...linhas, `"Total";"${reais(totais.vendas)}";"${reais(totais.devolucoes)}";"${reais(totais.base)}";"-";"${reais(totais.comissao)}"`, `"Comissao liquida";"";"";"";"";"${reais(resumo.comissao_liquida)}"`].join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Comissao_${vendedor.nome.replace(/\s+/g, "_")}_${mes}-${ano}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportarPdf = () => {
    const janela = window.open("", "", "width=900,height=650");
    if (!janela) return toast.error("Libere as janelas do navegador para gerar o PDF.");
    const tabela = document.getElementById(`apuracao-${vendedor.id}`).outerHTML;
    janela.document.write(`<html><head><title>Comissões</title><style>
      body{font-family:-apple-system,Segoe UI,sans-serif;padding:32px;color:#18181b}h2{margin:0 0 4px}p{color:#71717a;margin:0 0 24px}
      table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #e4e4e7;padding:10px;text-align:right}
      th:first-child,td:first-child{text-align:left}th{color:#71717a;font-weight:500}
      </style></head><body><h2>Comissão de ${vendedor.nome}</h2><p>${nomeDoMes(competencia)}</p>${tabela}
      <script>window.onload=function(){window.print();window.close();}</script></body></html>`);
    janela.document.close();
  };

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${carregando ? "opacity-50" : ""}`}>
        <Kpi rotulo="Comissão líquida" valor={moeda(resumo.comissao_liquida)} tom="text-purple-600 dark:text-purple-400" detalhe={resumo.fechado ? "Mês fechado" : "Mês em aberto"} />
        <Kpi rotulo="Vendas" valor={moeda(totais.vendas)} />
        <Kpi rotulo="Devoluções" valor={moeda(totais.devolucoes)} />
        <Kpi rotulo="Base de cálculo" valor={moeda(totais.base)} />
      </div>

      {pendentes?.quantidade > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 px-5 py-3.5 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle size={17} className="shrink-0 mt-0.5" />
          <p>{pendentes.quantidade === 1 ? "1 pedido deste mês ainda não foi faturado" : `${pendentes.quantidade} pedidos deste mês ainda não foram faturados`} ({moeda(pendentes.valor)}). Eles ficam fora da comissão enquanto não faturarem.</p>
        </div>
      )}

      {resumo.congelado && (
        <div className="flex items-start gap-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] px-5 py-3.5 text-sm text-zinc-600 dark:text-zinc-300">
          <Lock size={16} className="shrink-0 mt-0.5" />
          <p>Valores congelados no fechamento{fechamento?.fechado_em_br ? ` de ${fechamento.fechado_em_br}` : ""}{fechamento?.fechado_por ? `, por ${fechamento.fechado_por}` : ""}. Mudar uma regra não altera este mês, e novos ajustes entram no mês em aberto.</p>
        </div>
      )}

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <h2 className="font-semibold tracking-tight">Por marca</h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={exportarCsv} disabled={apuracao.length === 0} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-40 transition-colors"><FileSpreadsheet size={15} /> CSV</button>
            <button type="button" onClick={exportarPdf} disabled={apuracao.length === 0} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-40 transition-colors"><FileText size={15} /> PDF</button>
          </div>
        </div>

        {carregando && apuracao.length === 0 ? (
          <Carregando texto="Apurando o mês..." />
        ) : apuracao.length === 0 ? (
          <EstadoVazio icone={Calculator} titulo="Nenhuma venda faturada" texto={`Não há faturamento de ${vendedor.nome} em ${nomeDoMes(competencia)}.`} />
        ) : (
          <div className={`overflow-x-auto custom-scrollbar transition-opacity ${carregando ? "opacity-50" : ""}`}>
            <table id={`apuracao-${vendedor.id}`} className="w-full min-w-[640px] text-sm tabular-nums">
              <thead>
                <tr className="text-xs text-zinc-400 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <th className="px-5 py-2.5 font-medium text-left">Marca</th>
                  <th className="px-5 py-2.5 font-medium text-right">Vendas</th>
                  <th className="px-5 py-2.5 font-medium text-right">Devoluções</th>
                  <th className="px-5 py-2.5 font-medium text-right">Base</th>
                  <th className="px-5 py-2.5 font-medium text-right">Regra</th>
                  <th className="px-5 py-2.5 font-medium text-right">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                {apuracao.map((item) => (
                  <tr key={item.marca}>
                    <td className="px-5 py-3 font-medium text-left text-zinc-900 dark:text-white">{item.marca}</td>
                    <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">{moeda(item.vendas)}</td>
                    <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">{item.devolucoes > 0 ? `- ${moeda(item.devolucoes)}` : "—"}</td>
                    <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">{moeda(item.base)}</td>
                    <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">
                      {Number(item.regra).toLocaleString("pt-BR")}%
                      {item.origem === "vendedor" && <span className="block text-[11px] text-purple-600 dark:text-purple-400">Regra própria</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-white">{moeda(item.comissao)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-black/[0.08] dark:border-white/[0.1] font-semibold">
                  <td className="px-5 py-3 text-left">Total</td>
                  <td className="px-5 py-3 text-right">{moeda(totais.vendas)}</td>
                  <td className="px-5 py-3 text-right">{totais.devolucoes > 0 ? `- ${moeda(totais.devolucoes)}` : "—"}</td>
                  <td className="px-5 py-3 text-right">{moeda(totais.base)}</td>
                  <td className="px-5 py-3 text-right">—</td>
                  <td className="px-5 py-3 text-right text-purple-600 dark:text-purple-400">{moeda(totais.comissao)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-black/[0.05] dark:border-white/[0.06]">
          <p className="text-sm text-zinc-500">
            {fechamento ? "Atualizar recalcula o mês com as regras de hoje e substitui o valor que o vendedor vê no Raizan Seller." : "O fechamento congela o mês e envia o valor ao Raizan Seller."}
          </p>
          <button type="button" onClick={fechar} disabled={fechando || carregando || (apuracao.length === 0 && ajustes.length === 0)} className={`${BOTAO_PRIMARIO} shrink-0`}>
            <CheckCircle2 size={16} /> {fechando ? "Salvando..." : fechamento ? "Atualizar fechamento" : "Fechar comissão"}
          </button>
        </div>
      </section>

      <Historico resumo={resumo} ajustes={ajustes} podeLancar={!resumo.fechado && !carregando} onNovo={() => setLancando(true)} />

      {lancando && (
        <ModalAjuste
          vendedor={vendedor}
          competencia={competencia}
          onFechar={() => setLancando(false)}
          onLancado={() => { setLancando(false); carregar(); }}
        />
      )}
    </div>
  );
}

function ModalCopiar({ vendedor, comissaoGeral, onFechar }) {
  const [destinos, setDestinos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api("/vendedores")
      .then((data) => setDestinos((data.vendedores || []).filter((v) => String(v.id) !== String(vendedor.id))))
      .catch(() => toast.error("Erro ao carregar a equipe."));
  }, [vendedor.id]);

  const alternar = (id) => setSelecionados((atuais) => (atuais.includes(id) ? atuais.filter((v) => v !== id) : [...atuais, id]));
  const todosMarcados = destinos.length > 0 && selecionados.length === destinos.length;

  const copiar = async () => {
    if (selecionados.length === 0) return toast.error("Selecione ao menos um vendedor.");
    setSalvando(true);
    try {
      const data = await api("/comissoes/copiar", { metodo: "POST", corpo: { vendedor_origem_id: vendedor.id, vendedores_destino: selecionados } });
      if (!data.success) throw new Error();
      toast.success(`Regras copiadas para ${selecionados.length} vendedor(es).`);
      onFechar();
    } catch (erro) {
      toast.error("Erro ao copiar as regras.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo="Copiar regras"
      descricao={`Copia a regra geral (${comissaoGeral ? `${comissaoGeral}%` : "da equipe"}) e as exceções de ${vendedor.nome}. Substitui as regras dos selecionados.`}
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={copiar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>Aplicar ({selecionados.length})</button>
      </>}
    >
      <div className="flex justify-end mb-2">
        <button type="button" onClick={() => setSelecionados(todosMarcados ? [] : destinos.map((v) => v.id))} className="text-sm font-semibold text-purple-600 dark:text-purple-400">
          {todosMarcados ? "Desmarcar todos" : "Selecionar todos"}
        </button>
      </div>
      <div className="space-y-1">
        {destinos.map((destino) => (
          <label key={destino.id} className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors">
            <input type="checkbox" checked={selecionados.includes(destino.id)} onChange={() => alternar(destino.id)} className="w-4 h-4 accent-purple-600" />
            <span className="text-sm font-medium truncate">{destino.nome}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

function Regras({ vendedor }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [geral, setGeral] = useState("");
  const [equipe, setEquipe] = useState({ geral: null, marcas: [] });
  const [marcas, setMarcas] = useState([]);
  const [excecoes, setExcecoes] = useState({});
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [dataMarcas, dataRegras] = await Promise.all([api("/marcas"), api(`/comissoes/regras?vendedor_id=${vendedor.id}`)]);
        if (dataRegras.success) {
          const proprio = dataRegras.geral_proprio;
          setGeral(proprio === null || proprio === undefined ? "" : String(Number(proprio)));
          setEquipe(dataRegras.equipe || { geral: null, marcas: [] });
          setExcecoes(Object.fromEntries((dataRegras.marcas || []).map((m) => [m.marca, String(Number(m.percentual))])));
        }
        if (dataMarcas.success) setMarcas((dataMarcas.marcas || []).filter((m) => !m.nome.toLowerCase().startsWith("provador")));
      } catch (erro) {
        toast.error("Erro ao carregar as regras.");
      } finally {
        setCarregando(false);
      }
    })();
  }, [vendedor.id]);

  const mudarExcecao = (marca, valor) => {
    const limpo = valor.replace(/[^0-9.]/g, "");
    setExcecoes((atuais) => ({ ...atuais, [marca]: Number(limpo) > 100 ? "100" : limpo }));
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const data = await api("/comissoes/regras", {
        metodo: "POST",
        corpo: {
          vendedor_id: vendedor.id,
          comissao_geral: geral === "" ? null : Number(geral),
          marcas_excecao: Object.entries(excecoes).filter(([, valor]) => valor !== "").map(([marca, percentual]) => ({ marca, percentual: Number(percentual) }))
        }
      });
      if (!data.success) throw new Error();
      toast.success("Regras salvas.");
    } catch (erro) {
      toast.error("Erro ao salvar as regras.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <Carregando texto="Buscando regras..." />;

  const visiveis = marcas.filter((m) => m.nome.toLowerCase().includes(busca.toLowerCase()));
  const geralDaEquipe = equipe.geral ?? 5;
  const percentualDaEquipe = (marca) => equipe.marcas.find((m) => m.marca.toLowerCase() === marca.toLowerCase())?.percentual;

  return (
    <div className="space-y-6">
      <section className={`${VIDRO} p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4`}>
        <div className="w-full sm:w-52">
          <label className={ROTULO}>Regra geral própria (%)</label>
          <input inputMode="decimal" placeholder={`Equipe: ${Number(geralDaEquipe)}`} value={geral} onChange={(e) => setGeral(e.target.value.replace(/[^0-9.]/g, ""))} className={`${CAMPO} text-lg font-semibold tabular-nums`} />
          <p className="text-xs text-zinc-500 mt-2">Em branco, segue a regra da equipe.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCopiando(true)} className={`${BOTAO_SECUNDARIO} flex-1 sm:flex-none`}><Copy size={15} /> Copiar</button>
          <button type="button" onClick={salvar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1 sm:flex-none`}>Salvar regras</button>
        </div>
      </section>

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div>
            <h2 className="font-semibold tracking-tight">Exceções por marca</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Em branco, a marca segue a regra da equipe.</p>
          </div>
          <div className="relative sm:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input placeholder="Buscar marca" value={busca} onChange={(e) => setBusca(e.target.value)} className={`${CAMPO} rounded-full pl-10`} />
          </div>
        </div>
        <div className="max-h-[460px] overflow-y-auto custom-scrollbar divide-y divide-black/[0.05] dark:divide-white/[0.05]">
          {visiveis.map((marca) => (
            <div key={marca.id ?? marca.nome} className="flex items-center justify-between gap-4 px-5 py-2.5">
              <span className="text-sm font-medium truncate">{marca.nome}</span>
              <div className="relative w-24 shrink-0">
                <input inputMode="decimal" aria-label={`Comissão de ${marca.nome}`} placeholder={percentualDaEquipe(marca.nome) === undefined ? "Geral" : String(Number(percentualDaEquipe(marca.nome)))} value={excecoes[marca.nome] ?? ""} onChange={(e) => mudarExcecao(marca.nome, e.target.value)} className={`${CAMPO} h-9 text-right pr-7 tabular-nums`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {copiando && <ModalCopiar vendedor={vendedor} comissaoGeral={geral} onFechar={() => setCopiando(false)} />}
    </div>
  );
}

export default function TabComissoes({ vendedor, competencia }) {
  const [secao, setSecao] = useState("apuracao");

  return (
    <div className="space-y-6 pb-10">
      <Segmentado opcoes={SECOES} valor={secao} onChange={setSecao} />
      {secao === "apuracao" ? <Apuracao vendedor={vendedor} competencia={competencia} /> : <Regras vendedor={vendedor} />}
    </div>
  );
}
