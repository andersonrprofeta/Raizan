"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, ChevronRight, ClipboardList, CreditCard, Download, FileText, QrCode, RefreshCw, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { repetirPedido } from "@/components/portal/carrinho";
import { esquecerDados, useCadastro, useCatalogo, useMetodos, usePedidos } from "@/components/portal/dados";
import { FormularioCartao, PixAguardando } from "@/components/portal/PagamentoOnline";
import { ETAPAS, lerMeta, rotuloDoPagamento, situacaoDoPedido, totalDoItem } from "@/components/portal/pedidos";
import { chamarApi } from "@/components/portal/sessao";
import { Botao, Cartao, Esqueleto, Etiqueta, Folha, Foto, Opcao, Vazio, dataCurta, moeda } from "@/components/portal/ui";

const FILTROS = [
  { chave: "todos", rotulo: "Todos", vale: () => true },
  { chave: "andamento", rotulo: "Em andamento", vale: ({ etapa }) => etapa >= 0 && etapa < 3 },
  { chave: "entregues", rotulo: "Entregues", vale: ({ etapa }) => etapa === 3 },
  { chave: "cancelados", rotulo: "Cancelados", vale: ({ etapa }) => etapa < 0 },
];

// O histórico do pedido grava valores crus, como "R$ 1250.5"
const textoDoAviso = (texto) => String(texto).replace(/R\$\s*(-?\d+(\.\d+)?)/g, (original, numero) => {
  const valor = parseFloat(numero);
  return Number.isNaN(valor) ? original : moeda(valor);
});

function Etapas({ etapa }) {
  return (
    <ol>
      {ETAPAS.map((nome, indice) => {
        const feita = indice <= etapa;
        return (
          <li key={nome} className="relative flex items-center gap-3 pb-4 last:pb-0">
            {indice < ETAPAS.length - 1 && <span className={`absolute left-[11px] top-6 h-[calc(100%-24px)] w-0.5 ${indice < etapa ? "bg-violet-600" : "bg-zinc-200"}`} />}
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${feita ? "bg-violet-600 text-white" : "bg-zinc-200 text-transparent"}`}><Check size={14} strokeWidth={3} /></span>
            <span className={`text-sm ${indice === etapa ? "font-semibold text-zinc-900" : feita ? "text-zinc-700" : "text-zinc-400"}`}>{nome}</span>
          </li>
        );
      })}
    </ol>
  );
}

function DocumentosDoPedido({ pedido, onSolicitado }) {
  const [enviando, setEnviando] = useState(false);
  const link = lerMeta(pedido, "link_xml_boleto");

  const solicitar = async () => {
    setEnviando(true);
    try {
      const resposta = await chamarApi("/api/hub/pedidos/solicitar-documentos", { metodo: "POST", corpo: { pedidoId: pedido.id } });
      if (resposta.success) {
        toast.success("Pedimos seus documentos à equipe.");
        onSolicitado();
      } else toast.error(resposta.message || "Não foi possível solicitar.");
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    }
    setEnviando(false);
  };

  if (link) return <a href={link} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 text-[15px] font-semibold text-zinc-800"><Download size={18} /> Baixar nota e boleto</a>;
  if (lerMeta(pedido, "solicitacao_documentos") === "pendente") return <p className="flex min-h-12 items-center justify-center rounded-xl bg-amber-50 text-sm font-semibold text-amber-800">Nota e boleto solicitados</p>;
  if (situacaoDoPedido(pedido).etapa < 1) return null;
  return <Botao variante="secundario" className="w-full" carregando={enviando} onClick={solicitar}><FileText size={18} /> Pedir nota e boleto</Botao>;
}

function DetalheDoPedido({ pedido, onFechar, onPagar, onAtualizado }) {
  const { dados: catalogo } = useCatalogo();
  const { dados: cadastro } = useCadastro();
  const { dados: metodos } = useMetodos();
  const { rotulo, tom, etapa } = situacaoDoPedido(pedido);

  const produtos = useMemo(() => new Map((catalogo?.produtos || []).map((produto) => [produto.sku, produto])), [catalogo]);
  const avisos = (pedido.meta_data || []).filter((meta) => meta.key === "historico_edicao");
  const envio = lerMeta(pedido, "metodo_envio");
  const pagavel = pedido.status === "aguardando-pagamento" && metodos?.online;

  const comprarDeNovo = () => {
    if (!repetirPedido(pedido, [...produtos.values()])) return;
    onFechar();
  };

  return (
    <Folha aberta onFechar={onFechar} titulo={`Pedido #${pedido.id}`} rodape={(
      <div className="space-y-2.5">
        {pagavel && <Botao className="w-full" onClick={() => onPagar(pedido)}><QrCode size={18} /> Pagar com Pix ou cartão</Botao>}
        <DocumentosDoPedido pedido={pedido} onSolicitado={onAtualizado} />
        <Botao variante="suave" className="w-full" onClick={comprarDeNovo}><RotateCcw size={18} /> Comprar de novo</Botao>
      </div>
    )}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">{dataCurta(pedido.date_created)}</p>
        <Etiqueta tom={tom}>{rotulo}</Etiqueta>
      </div>

      {etapa >= 0 && <div className="mt-4"><Etapas etapa={etapa} /></div>}

      {avisos.length > 0 && (
        <div className="mt-5 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900">
          <p className="mb-1 flex items-center gap-1.5 font-semibold"><AlertCircle size={16} /> Este pedido foi ajustado</p>
          {avisos.map((aviso, indice) => <p key={indice} className="mt-1">{textoDoAviso(aviso.value)}</p>)}
        </div>
      )}

      <h3 className="mb-1 mt-5 text-sm font-bold text-zinc-900">Itens</h3>
      <ul className="divide-y divide-zinc-100">
        {pedido.line_items?.map((item, indice) => (
          <li key={item.sku || indice} className="flex items-center gap-3 py-2.5">
            <Foto produto={produtos.get(String(item.sku))} className="h-11 w-11 shrink-0 rounded-lg border border-zinc-100 p-0.5" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-zinc-800">{item.name}</p>
              <p className="text-xs tabular-nums text-zinc-500">{item.quantity} x {moeda(item.price)}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-zinc-900">{moeda(totalDoItem(item))}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-zinc-500">Pagamento</dt><dd className="text-right text-zinc-800">{rotuloDoPagamento(pedido, cadastro?.condicoes)}</dd></div>
        {envio && <div className="flex justify-between gap-4"><dt className="text-zinc-500">Entrega</dt><dd className="text-zinc-800">{envio}</dd></div>}
        <div className="flex justify-between gap-4 text-base font-bold text-zinc-900"><dt>Total</dt><dd className="tabular-nums">{moeda(pedido.total)}</dd></div>
      </dl>
    </Folha>
  );
}

function PagarPedido({ pedido, onFechar, onPago }) {
  const { dados: metodos } = useMetodos();
  const [forma, setForma] = useState("pix");
  const [pix, setPix] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const pagar = async (dadosCartao) => {
    setEnviando(true);
    try {
      const resposta = await chamarApi("/api/hub/pagamentos/gerar", { metodo: "POST", corpo: { pedidoId: pedido.id, metodo: forma, valor: Number(pedido.total), dadosCartao } });
      if (!resposta.success) toast.error(resposta.message || "Não foi possível gerar o pagamento.");
      else if (resposta.tipo === "pix") setPix(resposta);
      else {
        toast.success("Pagamento aprovado");
        onPago();
      }
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    }
    setEnviando(false);
  };

  return (
    <Folha aberta onFechar={onFechar} titulo={`Pagar pedido #${pedido.id}`}>
      {pix ? <PixAguardando pix={pix} pedidoId={pedido.id} valor={pedido.total} onPago={() => { toast.success("Pagamento aprovado"); onPago(); }} /> : (
        <>
          <p className="text-sm text-zinc-500">Total a pagar</p>
          <p className="mb-4 text-2xl font-bold tabular-nums text-zinc-900">{moeda(pedido.total)}</p>
          <div role="radiogroup" aria-label="Forma de pagamento" className="space-y-2">
            <Opcao Icone={QrCode} titulo="Pix" texto="Aprovação na hora" selecionada={forma === "pix"} onClick={() => setForma("pix")} />
            <Opcao Icone={CreditCard} titulo="Cartão" texto="Crédito ou débito" selecionada={forma === "cartao"} onClick={() => setForma("cartao")} />
          </div>
          {forma === "pix" && <Botao className="mt-4 w-full" carregando={enviando} onClick={() => pagar()}>Gerar Pix</Botao>}
          {forma === "cartao" && metodos?.online && <div className="mt-4"><FormularioCartao chavePublica={metodos.chavePublica} valor={Number(pedido.total)} onEnviar={pagar} /></div>}
        </>
      )}
    </Folha>
  );
}

export default function Pedidos() {
  const { dados, carregando, erro, recarregar } = usePedidos();
  const [filtro, setFiltro] = useState("todos");
  const [idAberto, setIdAberto] = useState(null);
  const [pedidoAPagar, setPedidoAPagar] = useState(null);

  const pedidos = useMemo(() => dados || [], [dados]);
  const { vale } = FILTROS.find(({ chave }) => chave === filtro);
  const visiveis = pedidos.filter((pedido) => vale(situacaoDoPedido(pedido)));
  const aberto = pedidos.find((pedido) => pedido.id === idAberto);

  const atualizar = () => {
    esquecerDados("pedidos");
    return recarregar();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
        <button type="button" aria-label="Atualizar pedidos" onClick={atualizar} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200/60"><RefreshCw size={19} className={carregando ? "animate-spin" : ""} /></button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
        {FILTROS.map(({ chave, rotulo }) => (
          <button key={chave} type="button" aria-pressed={filtro === chave} onClick={() => setFiltro(chave)} className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold ${filtro === chave ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700"}`}>{rotulo}</button>
        ))}
      </div>

      {carregando && !dados && Array.from({ length: 4 }, (_, indice) => <Esqueleto key={indice} className="h-[88px]" />)}

      {erro && !dados && (
        <Vazio Icone={RefreshCw} titulo="Não conseguimos abrir seus pedidos" texto="Verifique sua internet e tente de novo.">
          <Botao onClick={atualizar}>Tentar de novo</Botao>
        </Vazio>
      )}

      {dados && visiveis.length === 0 && (
        <Vazio Icone={ClipboardList} titulo={pedidos.length === 0 ? "Você ainda não fez pedidos" : "Nenhum pedido neste filtro"}>
          {pedidos.length === 0 && <Link href="/b2b-pedidos" className="inline-flex min-h-12 items-center rounded-full px-6 text-[15px] font-semibold bg-zinc-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(24,24,27,0.7)] hover:bg-zinc-800">Ver produtos</Link>}
        </Vazio>
      )}

      <ul className="space-y-2.5">
        {visiveis.map((pedido) => {
          const { rotulo, tom } = situacaoDoPedido(pedido);
          const unidades = pedido.line_items?.reduce((soma, item) => soma + (Number(item.quantity) || 1), 0) || 0;
          return (
            <li key={pedido.id}>
              <Cartao>
                <button type="button" onClick={() => setIdAberto(pedido.id)} className="flex w-full items-center gap-3 p-4 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[15px] font-bold tabular-nums text-zinc-900">#{pedido.id}</span>
                      <Etiqueta tom={tom}>{rotulo}</Etiqueta>
                    </div>
                    <p className="mt-1 text-[13px] text-zinc-500">{dataCurta(pedido.date_created)} · {unidades} {unidades === 1 ? "item" : "itens"}</p>
                  </div>
                  <span className="text-[15px] font-bold tabular-nums text-zinc-900">{moeda(pedido.total)}</span>
                  <ChevronRight size={18} className="shrink-0 text-zinc-400" />
                </button>
              </Cartao>
            </li>
          );
        })}
      </ul>

      {aberto && <DetalheDoPedido pedido={aberto} onFechar={() => setIdAberto(null)} onAtualizado={atualizar} onPagar={(pedido) => { setIdAberto(null); setPedidoAPagar(pedido); }} />}
      {pedidoAPagar && <PagarPedido pedido={pedidoAPagar} onFechar={() => setPedidoAPagar(null)} onPago={() => { setPedidoAPagar(null); atualizar(); }} />}
    </div>
  );
}
