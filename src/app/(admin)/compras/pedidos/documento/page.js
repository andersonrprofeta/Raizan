"use client";

// Página do documento de compra: tudo de um orçamento, pedido ou NF-e numa tela só.
// É aqui que a contagem do Mapa de entrada é digitada e que a entrada da nota é confirmada.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Download, Link2, Loader2, PackageCheck, Pencil, Plus, Printer, Save, X } from "lucide-react";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, EstadoVazio, Modal, VIDRO, moeda } from "@/components/vendedores/ui";
import { ACAO_DO_STATUS, SeloStatus, SeloTipo, diaCurto, numeroDoDocumento, quantidade } from "@/components/compras/ui";
import { montarMapaDeEntrada } from "@/components/compras/MapaEntradas";
import { FormularioDocumento } from "@/components/compras/FormularioDocumento";
import { VincularPedido, VincularProduto } from "@/components/compras/Vinculos";
import { abrirDocumento } from "@/components/utils/documentoPdf";
import { getHeaders, getHubUrl, getTenantId } from "@/components/utils/api";

const LINHA_VAZIA = { quantidade: "", lote: "", validade: "" };
const MAX_LINHAS = 5;

const SITUACAO = {
  ok: { rotulo: "Confere", classe: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" },
  falta: { rotulo: "Faltou", classe: "text-rose-700 dark:text-rose-400 bg-rose-500/10" },
  sobra: { rotulo: "Sobrou", classe: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
  pendente: { rotulo: "A contar", classe: "text-zinc-500 bg-black/[0.04] dark:bg-white/[0.06]" },
};

const paraNumero = (texto) => {
  const limpo = String(texto ?? "").trim();
  if (!limpo) return null;
  const n = Number(limpo.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const paraTexto = (valor) => (valor === null || valor === undefined ? "" : String(valor).replace(".", ","));

// Linhas da contagem que já estavam salvas, no formato do formulário
function contagemInicial(itens, contagem) {
  const porPosicao = new Map((contagem?.itens || []).map((c) => [c.posicao, c]));
  return Object.fromEntries(itens.map((item) => {
    const salvas = porPosicao.get(item.posicao)?.linhas || [];
    const linhas = salvas.length
      ? salvas.map((l) => ({ quantidade: paraTexto(l.quantidade), lote: l.lote || "", validade: l.validade ? String(l.validade).slice(0, 10) : "" }))
      : [{ ...LINHA_VAZIA }];
    return [item.posicao, linhas];
  }));
}

function situacaoDaLinha(esperado, linhas) {
  const preenchidas = linhas.filter((l) => paraNumero(l.quantidade) !== null);
  if (!preenchidas.length) return { contado: null, situacao: "pendente" };
  const contado = Math.round(preenchidas.reduce((t, l) => t + paraNumero(l.quantidade), 0) * 10000) / 10000;
  return { contado, situacao: contado === esperado ? "ok" : contado < esperado ? "falta" : "sobra" };
}

function ConfirmarEntrada({ documento, onFechar, onConfirmar, enviando }) {
  const doErp = !["core", "xml", "sefaz"].includes(documento.origem_documento);
  return (
    <Modal
      titulo="Confirmar entrada da mercadoria"
      onFechar={onFechar}
      rodape={(
        <>
          <button type="button" onClick={onFechar} className={BOTAO_SECUNDARIO}>Voltar</button>
          <button type="button" onClick={onConfirmar} disabled={enviando} className={BOTAO_PRIMARIO}>
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}Confirmar entrada
          </button>
        </>
      )}
    >
      <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
        {doErp ? (
          <p>A quantidade contada de cada item (com lote e validade) vai para o recebimento desta nota no sistema integrado, e o recebimento é concluído lá. É o mesmo que mover o card para concluído.</p>
        ) : (
          <p>Os produtos entram no estoque do Raizan Core com a quantidade contada, e cada entrada fica registrada.</p>
        )}
        <p className="font-medium text-zinc-900 dark:text-white">Depois de confirmada, a contagem desta nota não pode mais ser alterada.</p>
      </div>
    </Modal>
  );
}

// Passo a passo da entrada da NF-e, com o passo atual em destaque
function PassosDaEntrada({ semProduto, pendentes, alterado, total, doErp }) {
  const passos = [
    { titulo: "Vincule os produtos", texto: semProduto ? `${semProduto} ${semProduto === 1 ? "item sem" : "itens sem"} produto do cadastro` : "Todos ligados ao cadastro", feito: !semProduto, opcional: doErp },
    { titulo: "Imprima o mapa e confira", texto: "O conferente anota quantidade, lote e validade", feito: pendentes < total },
    { titulo: "Digite a contagem e salve", texto: pendentes ? `Faltam ${pendentes} de ${total}` : alterado ? "Falta salvar" : "Contagem salva", feito: !pendentes && !alterado },
    { titulo: "Confirme a entrada", texto: doErp ? "Conclui o recebimento no sistema integrado" : "Os produtos entram no estoque do Core", feito: false },
  ];
  const atual = passos.findIndex((p) => !p.feito && !p.opcional);
  return (
    <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
      {passos.map((passo, indice) => {
        const estado = passo.feito ? "feito" : indice === atual ? "atual" : "depois";
        return (
          <li key={passo.titulo} className={`flex gap-3 rounded-2xl px-4 py-3 ${estado === "atual" ? "bg-purple-500/10 ring-1 ring-purple-500/30" : "bg-black/[0.03] dark:bg-white/[0.04]"}`}>
            <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${estado === "feito" ? "bg-emerald-500 text-white" : estado === "atual" ? "bg-purple-600 text-white" : "bg-black/[0.08] dark:bg-white/[0.1] text-zinc-500"}`}>
              {estado === "feito" ? <CheckCircle2 size={14} /> : indice + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{passo.titulo}{passo.opcional && !passo.feito ? <span className="font-normal text-zinc-500"> (se precisar)</span> : null}</span>
              <span className="block text-xs text-zinc-500">{passo.texto}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Documento() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const [detalhe, setDetalhe] = useState(null);
  const [linhas, setLinhas] = useState({});
  const [alterado, setAlterado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState(null);

  // manterContagem: recarrega a nota (vínculos) sem apagar a contagem digitada e ainda não salva
  const carregar = useCallback(async ({ manterContagem = false } = {}) => {
    if (!id) return;
    try {
      const resposta = await api(`/compras/${id}`);
      if (!resposta.success) { toast.error(resposta.message || "Documento não encontrado."); setDetalhe(false); return; }
      setDetalhe(resposta);
      if (manterContagem) return;
      setLinhas(contagemInicial(resposta.itens, resposta.contagem));
      setAlterado(false);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    }
  }, [id]);

  useEffect(() => {
    if (!id) { router.push("/compras/pedidos"); return; }
    carregar();
  }, [id, router, carregar]);

  const documento = detalhe?.documento;
  const itens = useMemo(() => detalhe?.itens || [], [detalhe]);
  const temContagem = documento && ["nfe", "pedido"].includes(documento.tipo_documento) && !["cancelado", "cancelada"].includes(documento.status);
  const travada = Boolean(documento?.entrada_em);

  const situacoes = useMemo(() => Object.fromEntries(itens.map((item) => [item.posicao, situacaoDaLinha(item.quantidade, linhas[item.posicao] || [])])), [itens, linhas]);
  const resumo = useMemo(() => {
    const lista = Object.values(situacoes);
    const conta = (s) => lista.filter((x) => x.situacao === s).length;
    return { total: lista.length, pendentes: conta("pendente"), ok: conta("ok"), faltas: conta("falta"), sobras: conta("sobra") };
  }, [situacoes]);
  const podeConfirmar = documento?.tipo_documento === "nfe" && !travada && ["pendente", "recebida", "divergente"].includes(documento.status);
  const doErp = Boolean(documento) && !["core", "xml", "sefaz"].includes(documento.origem_documento);
  const semProduto = itens.filter((item) => !item.produto_id).length;

  const mudarLinha = (posicao, indice, campo, valor) => {
    setLinhas((atual) => ({ ...atual, [posicao]: atual[posicao].map((l, i) => (i === indice ? { ...l, [campo]: valor } : l)) }));
    setAlterado(true);
  };
  const adicionarLinha = (posicao) => {
    setLinhas((atual) => ({ ...atual, [posicao]: [...atual[posicao], { ...LINHA_VAZIA }] }));
  };
  const removerLinha = (posicao, indice) => {
    setLinhas((atual) => ({ ...atual, [posicao]: atual[posicao].filter((_, i) => i !== indice) }));
    setAlterado(true);
  };
  // Atalho: o que chegou bate com a nota
  const conferirIgual = (item) => {
    setLinhas((atual) => ({ ...atual, [item.posicao]: [{ ...(atual[item.posicao]?.[0] || LINHA_VAZIA), quantidade: paraTexto(item.quantidade) }, ...(atual[item.posicao] || []).slice(1)] }));
    setAlterado(true);
  };

  const salvarContagem = async () => {
    setOcupado(true);
    try {
      const corpo = {
        itens: itens.map((item) => ({
          posicao: item.posicao,
          linhas: (linhas[item.posicao] || []).map((l) => ({ quantidade: paraNumero(l.quantidade) ?? 0, lote: l.lote, validade: l.validade })),
        })),
      };
      const resposta = await api(`/compras/${id}/contagem`, { metodo: "PUT", corpo });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível salvar a contagem."); return false; }
      toast.success(resposta.contagem?.divergente ? "Contagem salva. A nota ficou com divergência." : "Contagem salva.");
      await carregar();
      return true;
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const confirmar = async () => {
    if (alterado && !(await salvarContagem())) return;
    setOcupado(true);
    try {
      const resposta = await api(`/compras/${id}/confirmar-entrada`, { metodo: "POST" });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível confirmar a entrada."); return; }
      toast.success(resposta.message || "Entrada confirmada.");
      setModal(null);
      await carregar();
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  };

  const mudarStatus = async (acao, status) => {
    setOcupado(true);
    try {
      const resposta = acao === "status"
        ? await api(`/compras/${id}/status`, { metodo: "POST", corpo: { status } })
        : await api(`/compras/${id}/gerar-pedido`, { metodo: "POST" });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível concluir."); return; }
      if (acao === "gerar-pedido") { toast.success(`Pedido de compra nº ${resposta.numero_documento} criado.`); router.push(`/compras/pedidos/documento?id=${resposta.id}`); return; }
      toast.success("Situação atualizada.");
      await carregar();
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  };

  const imprimirMapa = () => {
    if (!abrirDocumento(montarMapaDeEntrada({ documento, itens, vinculados: detalhe.vinculados }))) toast.error("Libere as janelas do navegador para imprimir o mapa.");
  };

  const baixarXml = async () => {
    try {
      const resposta = await fetch(`${getHubUrl()}/api/hub/compras/${id}/xml?tenant_id=${getTenantId()}`, { headers: getHeaders() });
      if (!resposta.ok) { toast.error("Esta nota não tem o XML guardado no Core."); return; }
      const blob = await resposta.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `NFe${documento.chave_nfe || documento.numero_documento}.xml`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    }
  };

  if (detalhe === null) return <CascaPagina><Carregando texto="Abrindo documento..." /></CascaPagina>;
  if (detalhe === false) {
    return (
      <CascaPagina>
        <EstadoVazio icone={X} titulo="Documento não encontrado" texto="Ele pode ter sido removido ou pertencer a outra empresa.">
          <Link href="/compras/pedidos" className={BOTAO_SECUNDARIO}>Voltar para a Central de Compras</Link>
        </EstadoVazio>
      </CascaPagina>
    );
  }

  const { vinculados, proximos_status: proximos } = detalhe;
  const ehNota = documento.tipo_documento === "nfe";
  const pedidoGerado = vinculados.find((v) => v.tipo_documento === "pedido" && v.id !== documento.documento_origem_id);
  const podeGerarPedido = documento.tipo_documento === "orcamento" && documento.status === "aprovado" && !pedidoGerado;
  const temXml = ehNota && detalhe.tem_xml;
  const pedidoLigado = ehNota ? vinculados.find((v) => v.id === documento.documento_origem_id) : null;

  const informacoes = [
    ["Emissão", diaCurto(documento.data_emissao) || "Não informada"],
    ehNota ? ["Entrada", documento.data_recebimento ? diaCurto(documento.data_recebimento) : "Não registrada"] : ["Previsão de entrega", diaCurto(documento.data_previsao) || "Não informada"],
    documento.fornecedor_documento && ["CNPJ", documento.fornecedor_documento],
    documento.condicoes_comerciais && ["Condições", documento.condicoes_comerciais],
    documento.criado_por && ["Criado por", documento.criado_por],
    documento.conferido_por && ["Contado por", `${documento.conferido_por} · ${diaCurto(documento.conferido_em)}`],
    documento.entrada_em && ["Entrada confirmada", `${documento.entrada_por || ""} · ${diaCurto(documento.entrada_em)}`],
  ].filter(Boolean);

  return (
    <CascaPagina>
      <Link href="/compras/pedidos" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors w-fit">
        <ArrowLeft size={16} />Central de Compras
      </Link>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2"><SeloTipo tipo={documento.tipo_documento} /><SeloStatus status={documento.status} /></div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white tabular-nums">Nº {numeroDoDocumento(documento)}</h1>
          <p className="text-zinc-500 mt-1 truncate">{documento.fornecedor || (documento.fornecedor_documento ? `CNPJ ${documento.fornecedor_documento}` : "Fornecedor não informado")}</p>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Valor total</p>
          <p className="text-3xl font-semibold tabular-nums">{moeda(documento.valor_total)}</p>
        </div>
      </header>

      <section className={`${VIDRO} p-5 sm:p-6 space-y-4`}>
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {informacoes.map(([rotulo, valor]) => (
            <div key={rotulo}><dt className="text-[11px] text-zinc-500">{rotulo}</dt><dd className="font-medium">{valor}</dd></div>
          ))}
        </dl>
        {ehNota && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[11px] text-zinc-500 mr-1">Pedido de compra</span>
            {pedidoLigado
              ? <Link href={`/compras/pedidos/documento?id=${pedidoLigado.id}`} className="font-semibold tabular-nums hover:text-purple-600">nº {pedidoLigado.numero_documento}</Link>
              : <span className="text-zinc-500">Nenhum ligado</span>}
            {!travada && (
              <button type="button" onClick={() => setModal("pedido")} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/15">
                <Link2 size={12} />{pedidoLigado ? "Trocar" : "Ligar a um pedido"}
              </button>
            )}
          </div>
        )}
        {ehNota && documento.chave_nfe && <p className="text-[11px] text-zinc-500">Chave <span className="font-mono text-zinc-700 dark:text-zinc-300 break-all">{documento.chave_nfe}</span></p>}
        {vinculados.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[11px] text-zinc-500 mr-1">Ciclo</span>
            {vinculados.map((v) => (
              <Link key={v.id} href={`/compras/pedidos/documento?id=${v.id}`} className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full bg-black/[0.04] dark:bg-white/[0.05] hover:bg-purple-500/10 transition-colors">
                <SeloTipo tipo={v.tipo_documento} /><span className="font-semibold tabular-nums">{v.numero_documento}</span>
              </Link>
            ))}
          </div>
        )}
        {documento.observacao && <p className="text-sm text-zinc-600 dark:text-zinc-300 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3">{documento.observacao}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {temContagem && <button type="button" onClick={imprimirMapa} className={`${BOTAO_SECUNDARIO} h-10`}><Printer size={15} />Mapa de entrada</button>}
          {temXml && <button type="button" onClick={baixarXml} className={`${BOTAO_SECUNDARIO} h-10`}><Download size={15} />Baixar XML</button>}
          {documento.editavel && <button type="button" onClick={() => setModal("editar")} className={`${BOTAO_SECUNDARIO} h-10`}><Pencil size={15} />Editar</button>}
          <span className="flex-1" />
          {proximos.filter((s) => s === "cancelado").map((s) => (
            <button key={s} type="button" disabled={ocupado} onClick={() => mudarStatus("status", s)} className="h-10 px-4 rounded-full text-sm font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-40">{ACAO_DO_STATUS[s]}</button>
          ))}
          {!ehNota && proximos.filter((s) => s !== "cancelado").map((s, posicao, lista) => (
            <button key={s} type="button" disabled={ocupado} onClick={() => mudarStatus("status", s)} className={`${posicao === lista.length - 1 && !podeGerarPedido ? BOTAO_PRIMARIO : BOTAO_SECUNDARIO} h-10`}>{ACAO_DO_STATUS[s] || s}</button>
          ))}
          {podeGerarPedido && <button type="button" disabled={ocupado} onClick={() => mudarStatus("gerar-pedido")} className={`${BOTAO_PRIMARIO} h-10`}>Gerar pedido de compra<ArrowRight size={15} /></button>}
        </div>
      </section>

      {podeConfirmar && (
        <section className={`${VIDRO} p-5 sm:p-6 space-y-3`}>
          <div>
            <h2 className="text-lg font-semibold">Como dar entrada nesta nota</h2>
            <p className="text-sm text-zinc-500">Siga os passos. O botão <b>Confirmar entrada</b> libera quando todos os itens estiverem contados.</p>
          </div>
          <PassosDaEntrada semProduto={semProduto} pendentes={resumo.pendentes} alterado={alterado} total={resumo.total} doErp={doErp} />
        </section>
      )}

      <section className={`${VIDRO} overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-semibold">{temContagem ? "Produtos e contagem" : "Produtos"}</h2>
            {temContagem && (
              <p className="text-sm text-zinc-500">
                {travada ? "Entrada confirmada. A contagem está fechada."
                  : resumo.pendentes ? `${resumo.total - resumo.pendentes} de ${resumo.total} contados. Digite o que o conferente anotou no mapa.`
                    : resumo.faltas + resumo.sobras ? `${resumo.faltas + resumo.sobras} com diferença: ${resumo.faltas} faltando, ${resumo.sobras} sobrando.`
                      : "Tudo confere com o documento."}
              </p>
            )}
          </div>
          {temContagem && !travada && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={ocupado || !alterado} onClick={salvarContagem} className={`${BOTAO_SECUNDARIO} h-10`}>
                {ocupado ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Salvar contagem
              </button>
              {podeConfirmar && (
                <button type="button" disabled={ocupado || resumo.pendentes > 0} onClick={() => setModal("confirmar")} title={resumo.pendentes ? "Conte todos os itens antes de confirmar" : ""} className={`${BOTAO_PRIMARIO} h-10`}>
                  <PackageCheck size={15} />Confirmar entrada
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar border-t border-black/[0.05] dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-zinc-500 bg-black/[0.02] dark:bg-white/[0.03]">
                <th className="text-left font-semibold px-5 sm:px-6 py-2.5">Produto</th>
                <th className="text-right font-semibold px-3 py-2.5">{ehNota ? "Na nota" : "Pedido"}</th>
                {temContagem && <th className="text-left font-semibold px-3 py-2.5 min-w-[380px]">Contado · lote · validade</th>}
                {temContagem && <th className="text-left font-semibold px-3 py-2.5">Conferência</th>}
                <th className="text-right font-semibold px-3 py-2.5">Unitário</th>
                <th className="text-right font-semibold px-5 sm:px-6 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {itens.map((item) => {
                const situacao = situacoes[item.posicao] || { situacao: "pendente", contado: null };
                const estilo = SITUACAO[situacao.situacao];
                const minhas = linhas[item.posicao] || [];
                return (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 sm:px-6 py-3 min-w-[220px]">
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-[11px] font-mono text-zinc-500">{[item.sku, item.fabricante].filter(Boolean).join(" · ")}</p>
                      {ehNota && (item.produto_id ? (
                        <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 flex flex-wrap items-center gap-x-1.5">
                          <CheckCircle2 size={11} />Cadastro: {item.produto_nome || item.sku}
                          {item.codigo_fornecedor && item.codigo_fornecedor !== item.sku && <span className="text-zinc-500">· código do fornecedor {item.codigo_fornecedor}</span>}
                          {!travada && <button type="button" onClick={() => setModal({ produto: item })} className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">trocar</button>}
                        </p>
                      ) : (
                        <button type="button" disabled={travada} onClick={() => setModal({ produto: item })} className="mt-1.5 inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 disabled:opacity-60">
                          <Link2 size={12} />{travada ? "Sem produto do cadastro" : "Vincular produto"}
                        </button>
                      ))}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                      {quantidade(item.quantidade)} <span className="text-zinc-400 text-xs">{item.unidade}</span>
                      {temContagem && !travada && situacao.situacao === "pendente" && (
                        <button type="button" onClick={() => conferirIgual(item)} className="block ml-auto mt-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline">Chegou igual</button>
                      )}
                    </td>
                    {temContagem && (
                      <td className="px-3 py-2">
                        <div className="space-y-1.5">
                          {minhas.map((linha, indice) => (
                            <div key={indice} className="flex items-center gap-1.5">
                              <input aria-label="Quantidade contada" inputMode="decimal" disabled={travada} value={linha.quantidade} onChange={(e) => mudarLinha(item.posicao, indice, "quantidade", e.target.value)} placeholder="Qtd" className={`${CAMPO} h-9 w-20 px-3 text-right tabular-nums`} />
                              <input aria-label="Lote" disabled={travada} value={linha.lote} maxLength={60} onChange={(e) => mudarLinha(item.posicao, indice, "lote", e.target.value)} placeholder="Lote" className={`${CAMPO} h-9 w-28 px-3`} />
                              <input aria-label="Validade" type="date" disabled={travada} value={linha.validade} onChange={(e) => mudarLinha(item.posicao, indice, "validade", e.target.value)} className={`${CAMPO} h-9 w-36 px-3`} />
                              {!travada && indice > 0 && (
                                <button type="button" onClick={() => removerLinha(item.posicao, indice)} aria-label="Remover lote" className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10"><X size={14} /></button>
                              )}
                            </div>
                          ))}
                          {!travada && minhas.length < MAX_LINHAS && (
                            <button type="button" onClick={() => adicionarLinha(item.posicao)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-purple-600"><Plus size={12} />Outro lote</button>
                          )}
                        </div>
                      </td>
                    )}
                    {temContagem && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold ${estilo.classe}`}>
                          {situacao.situacao === "ok" ? <CheckCircle2 size={13} /> : situacao.situacao !== "pendente" ? <AlertTriangle size={13} /> : null}
                          {estilo.rotulo}{situacao.contado !== null && situacao.situacao !== "ok" ? ` ${situacao.contado > item.quantidade ? "+" : ""}${quantidade(situacao.contado - item.quantidade)}` : ""}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">{moeda(item.valor_unitario)}</td>
                    <td className="px-5 sm:px-6 py-3 text-right tabular-nums font-semibold whitespace-nowrap">{moeda(item.valor_total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modal === "confirmar" && <ConfirmarEntrada documento={documento} onFechar={() => setModal(null)} onConfirmar={confirmar} enviando={ocupado} />}
      {modal === "pedido" && <VincularPedido compraId={documento.id} pedidoAtual={pedidoLigado} onFechar={() => setModal(null)} onVinculado={() => { setModal(null); carregar({ manterContagem: true }); }} />}
      {modal?.produto && (
        <VincularProduto
          compraId={documento.id}
          item={modal.produto}
          fornecedor={documento.fornecedor}
          onFechar={() => setModal(null)}
          onVinculado={() => { setModal(null); carregar({ manterContagem: true }); }}
        />
      )}
      {modal === "editar" && (
        <FormularioDocumento
          tipo={documento.tipo_documento}
          documento={documento}
          itensAtuais={itens}
          fornecedores={[]}
          onFechar={() => setModal(null)}
          onSalvo={() => { setModal(null); carregar(); }}
        />
      )}
    </CascaPagina>
  );
}

export default function PaginaDoDocumento() {
  return (
    <Suspense fallback={null}>
      <Documento />
    </Suspense>
  );
}
