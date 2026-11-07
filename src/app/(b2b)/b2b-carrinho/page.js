"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronDown, CreditCard, FileText, MapPin, QrCode, ShoppingBag, Trash2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import BarraFrete from "@/components/portal/BarraFrete";
import { definirQuantidade, esvaziarCarrinho, useCarrinho } from "@/components/portal/carrinho";
import { esquecerDados, prazosLiberados, useCadastro, useMetodos } from "@/components/portal/dados";
import { FormularioCartao, PixAguardando } from "@/components/portal/PagamentoOnline";
import { avaliarFrete, precoDoItem } from "@/components/portal/precos";
import { chamarApi, lerUsuario, tenantDoPortal } from "@/components/portal/sessao";
import { Botao, Cartao, ESTILO, Esqueleto, Foto, Quantidade, Vazio, moeda } from "@/components/portal/ui";

// Pedidos grandes: a lista começa recolhida para entrega e pagamento ficarem logo à vista
const ITENS_RECOLHIDOS = 6;

const Secao = ({ titulo, children }) => (
  <Cartao className="p-4 md:p-5">
    <h2 className="mb-3 text-base font-bold text-zinc-900">{titulo}</h2>
    {children}
  </Cartao>
);

// A coluna de entrega e pagamento só fica presa na tela quando cabe inteira nela.
// Se não couber (cartão aberto, tela baixa), ela rola junto com a página e nada fica escondido.
function useCabeNaTela(folga = 116) {
  const [elemento, setElemento] = useState(null);
  const [cabe, setCabe] = useState(true);

  useEffect(() => {
    if (!elemento) return undefined;
    const medir = () => setCabe(elemento.offsetHeight <= window.innerHeight - folga);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    window.addEventListener("resize", medir);
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [elemento, folga]);

  return [setElemento, cabe];
}

function ItemDoCarrinho({ item }) {
  const { preco, atingiu, temPromocao, faltam, promocional } = precoDoItem(item);

  return (
    <li className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-x-3 gap-y-2 py-3 md:grid-cols-[40px_minmax(0,1fr)_96px_124px_96px_32px] md:items-center md:py-2.5">
      <Foto produto={item} className="row-span-2 h-11 w-11 rounded-lg border border-black/5 bg-white p-0.5 md:row-span-1 md:h-10 md:w-10" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 md:line-clamp-1">{item.nome}</p>
        <p className="text-xs tabular-nums text-zinc-500">
          SKU {item.sku}<span className="md:hidden"> · {moeda(preco)} / un</span>
          {temPromocao && <span className={`ml-1.5 font-semibold ${atingiu ? "text-emerald-700" : "text-violet-700"}`}>{atingiu ? "Atacado aplicado" : `+${faltam} un: ${moeda(promocional)}`}</span>}
        </p>
      </div>
      <button type="button" aria-label={`Remover ${item.nome}`} onClick={() => definirQuantidade(item, 0)} className="-mr-1.5 flex h-8 w-8 items-center justify-center self-start rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600 md:hidden"><Trash2 size={15} /></button>
      <p className="hidden text-right text-[13px] tabular-nums text-zinc-500 md:block">{moeda(preco)}</p>
      <div className="col-start-2 col-end-4 flex items-center justify-between gap-3 md:contents">
        <div className="w-[124px]"><Quantidade qtd={item.qtd} rotulo={item.nome} compacto onChange={(nova) => definirQuantidade(item, nova)} /></div>
        <p className="text-right text-[15px] font-bold tabular-nums text-zinc-900">{moeda(item.totalItem)}</p>
      </div>
      <button type="button" aria-label={`Remover ${item.nome}`} onClick={() => definirQuantidade(item, 0)} className="hidden h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600 md:flex"><Trash2 size={15} /></button>
    </li>
  );
}

function ListaDeItens({ itens, unidades }) {
  const [todos, setTodos] = useState(false);
  const recolher = itens.length > ITENS_RECOLHIDOS;
  const mostrados = recolher && !todos ? itens.slice(0, ITENS_RECOLHIDOS) : itens;

  const esvaziar = () => {
    if (window.confirm("Tirar todos os produtos do carrinho?")) esvaziarCarrinho();
  };

  return (
    <Cartao className="px-4 pb-2 pt-4 md:px-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-zinc-900">Produtos <span className="font-medium text-zinc-400">· {itens.length} · {unidades} un</span></h2>
        <button type="button" onClick={esvaziar} className="text-xs font-semibold text-zinc-400 hover:text-red-600">Esvaziar</button>
      </div>
      <div className="mt-2 hidden grid-cols-[40px_minmax(0,1fr)_96px_124px_96px_32px] gap-x-3 border-b border-black/5 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 md:grid">
        <span /><span>Produto</span><span className="text-right">Unitário</span><span className="text-center">Qtd</span><span className="text-right">Total</span><span />
      </div>
      <ul className="divide-y divide-black/5">{mostrados.map((item) => <ItemDoCarrinho key={item.sku} item={item} />)}</ul>
      {recolher && (
        <button type="button" onClick={() => setTodos((atual) => !atual)} className="flex w-full items-center justify-center gap-1.5 border-t border-black/5 py-3 text-sm font-semibold text-violet-700">
          {todos ? "Mostrar menos" : `Ver todos os ${itens.length} produtos`} <ChevronDown size={16} className={todos ? "rotate-180" : ""} />
        </button>
      )}
    </Cartao>
  );
}

function Escolha({ selecionada, onClick, Icone, titulo }) {
  return (
    <button type="button" role="radio" aria-checked={selecionada} onClick={onClick} className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-[13px] font-semibold transition-all ${selecionada ? "border-violet-500 bg-violet-50/60 text-zinc-900 ring-1 ring-violet-500" : "border-black/10 text-zinc-600 hover:border-black/20"}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-[9px] ${selecionada ? ESTILO.tile : "bg-zinc-100 text-zinc-500"}`}><Icone size={15} /></span>
      {titulo}
    </button>
  );
}

function Entrega({ envio, setEnvio, frete, cadastro }) {
  const textoDaTransportadora = frete.temRegra
    ? (frete.gratis ? `Frete grátis para ${frete.regiao}.` : `Frete por sua conta. Faltam ${moeda(frete.falta)} para ser grátis.`)
    : "O valor do frete é combinado com a nossa equipe.";
  const { logradouro, numero, cidade, estado } = cadastro?.endereco || {};

  return (
    <Secao titulo="Entrega">
      <div role="radiogroup" aria-label="Forma de entrega" className="grid grid-cols-2 gap-2">
        <Escolha Icone={Truck} titulo="Transportadora" selecionada={envio === "transportadora"} onClick={() => setEnvio("transportadora")} />
        <Escolha Icone={MapPin} titulo="Retirar no CD" selecionada={envio === "retirada"} onClick={() => setEnvio("retirada")} />
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-500">
        {envio === "retirada" ? "Sem frete. Agende a retirada depois do faturamento." : textoDaTransportadora}
        {envio === "transportadora" && logradouro && <> Entrega em {logradouro}, {numero} · {cidade}{estado ? ` - ${estado}` : ""}. <Link href="/b2b-perfil#endereco" className="font-semibold text-violet-700">Alterar</Link></>}
      </p>
    </Secao>
  );
}

const EXPLICACAO_DO_PAGAMENTO = { boleto: "Faturado no seu cadastro.", pix: "Aprovação na hora. O código aparece depois de concluir.", cartao: "Crédito ou débito, aprovado na hora." };

function Pagamento({ forma, setForma, prazo, setPrazo, prazos, metodos, subtotal, onCartao }) {
  return (
    <Secao titulo="Pagamento">
      <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-3 gap-2">
        {metodos?.boleto !== false && <Escolha Icone={FileText} titulo="Boleto" selecionada={forma === "boleto"} onClick={() => setForma("boleto")} />}
        {metodos?.online && <Escolha Icone={QrCode} titulo="Pix" selecionada={forma === "pix"} onClick={() => setForma("pix")} />}
        {metodos?.online && <Escolha Icone={CreditCard} titulo="Cartão" selecionada={forma === "cartao"} onClick={() => setForma("cartao")} />}
      </div>
      <p className="mt-2.5 text-[13px] text-zinc-500">{EXPLICACAO_DO_PAGAMENTO[forma]}</p>

      {forma === "boleto" && prazos.length > 0 && (
        <label className="mt-3 block text-[13px] font-medium text-zinc-700">
          Prazo do boleto
          <select value={prazo} onChange={(evento) => setPrazo(evento.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-base text-zinc-900 outline-none focus:border-violet-500 md:text-sm">
            {prazos.map((opcao) => <option key={opcao.codigo} value={opcao.codigo}>{opcao.descricao}</option>)}
          </select>
        </label>
      )}

      {forma === "cartao" && metodos?.online && <div className="mt-3"><FormularioCartao chavePublica={metodos.chavePublica} valor={subtotal} onEnviar={onCartao} /></div>}
    </Secao>
  );
}

function Resumo({ subtotal, frete, envio, unidades, botao }) {
  let textoDoFrete = "A combinar";
  if (envio === "retirada") textoDoFrete = "Sem frete";
  else if (frete.gratis) textoDoFrete = "Grátis";
  else if (frete.temRegra) textoDoFrete = "Por sua conta";

  return (
    <Cartao className="p-5">
      <h2 className="text-base font-bold text-zinc-900">Resumo</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-zinc-500">Produtos ({unidades})</dt><dd className="tabular-nums text-zinc-800">{moeda(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-zinc-500">Frete</dt><dd className={envio !== "retirada" && frete.gratis ? "font-semibold text-emerald-700" : "text-zinc-800"}>{textoDoFrete}</dd></div>
      </dl>
      <div className="mt-3 flex items-baseline justify-between border-t border-zinc-100 pt-3">
        <span className="text-sm font-semibold text-zinc-800">Total</span>
        <span className="text-2xl font-bold tabular-nums text-zinc-900">{moeda(subtotal)}</span>
      </div>
      {botao && <div className="mt-4">{botao}</div>}
    </Cartao>
  );
}

function Concluido({ pedidoId, forma }) {
  const textos = {
    pix: "Recebemos seu Pix. O pedido já foi para a nossa equipe.",
    cartao: "Pagamento aprovado. O pedido já foi para a separação.",
    boleto: "Nossa equipe vai analisar e faturar seu pedido.",
  };

  return (
    <Cartao className="mx-auto max-w-lg px-6 py-12 text-center">
      <CheckCircle2 size={52} className="mx-auto text-emerald-500" />
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">Pedido #{pedidoId} recebido</h1>
      <p className="mt-2 text-sm text-zinc-500">{textos[forma]}</p>
      <div className="mt-7 flex flex-col gap-2.5">
        <Link href="/b2b-historico" className="flex min-h-12 items-center justify-center rounded-full text-[15px] font-semibold bg-zinc-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(24,24,27,0.7)] hover:bg-zinc-800">Acompanhar pedido</Link>
        <Link href="/b2b-pedidos" className="flex min-h-12 items-center justify-center rounded-full border border-black/10 text-[15px] font-semibold text-zinc-800">Continuar comprando</Link>
      </div>
    </Cartao>
  );
}

function telaAposPagar(metodo, resposta) {
  if (metodo === "pix" && resposta.tipo === "pix") return "pix";
  return "concluido";
}

export default function Carrinho() {
  const { itens, subtotal, unidades } = useCarrinho();
  const { dados: cadastro, carregando: lendoCadastro } = useCadastro();
  const { dados: metodos } = useMetodos();
  const [envio, setEnvio] = useState("transportadora");
  const [forma, setForma] = useState("boleto");
  const [prazoEscolhido, setPrazoEscolhido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [tela, setTela] = useState("carrinho");

  const prazos = useMemo(() => prazosLiberados(cadastro || {}), [cadastro]);
  const prazo = prazoEscolhido || prazos[0]?.codigo || "";
  const frete = avaliarFrete(cadastro?.rota, subtotal);
  const [colunaLateral, colunaCabe] = useCabeNaTela();

  useEffect(() => {
    if (metodos && !metodos.boleto && metodos.online) setForma("pix");
  }, [metodos]);

  const concluirCompra = (pedidoId, resposta) => {
    esvaziarCarrinho();
    esquecerDados("pedidos");
    setPedido({ id: pedidoId, valor: subtotal, pix: resposta });
  };

  const enviarPedido = async (dadosDoCartao) => {
    const usuario = lerUsuario();
    setEnviando(true);

    try {
      const criado = await chamarApi("/api/hub/pedidos/criar", {
        metodo: "POST",
        corpo: {
          itens: itens.map(({ sku, nome, qtd, precoUsado, totalItem }) => ({ sku, nome_produto: nome, qtd, precoUsado, totalItem })),
          metodoPagamento: forma === "boleto" ? (prazo || "faturado") : forma,
          metodoEnvio: envio,
          tenant_id: tenantDoPortal(),
          cliente: { telefone: cadastro?.telefone || usuario?.telefone },
        },
      });

      if (!criado.success) {
        toast.error(criado.message || "Não foi possível criar o pedido.");
        return;
      }

      if (forma === "boleto") {
        concluirCompra(criado.pedidoId);
        setTela("concluido");
        return;
      }

      const pagamento = await chamarApi("/api/hub/pagamentos/gerar", {
        metodo: "POST",
        corpo: { pedidoId: criado.pedidoId, metodo: forma, valor: subtotal, dadosCartao: dadosDoCartao, cliente: { telefone: cadastro?.telefone || usuario?.telefone } },
      });

      // O pedido já existe: manter o carrinho faria o lojista criar o mesmo pedido duas vezes
      concluirCompra(criado.pedidoId, pagamento);
      if (!pagamento.success) {
        toast.error("Pedido criado, mas o pagamento não foi concluído. Tente pagar de novo em Pedidos.", { duration: 7000 });
        window.location.href = "/b2b-historico";
        return;
      }
      setTela(telaAposPagar(forma, pagamento));
    } catch (erro) {
      toast.error("Sem conexão com o servidor. Confira em Pedidos antes de tentar de novo.");
    } finally {
      setEnviando(false);
    }
  };

  if (tela === "pix") {
    return (
      <Cartao className="mx-auto max-w-lg px-6 py-8">
        <h1 className="mb-5 text-center text-xl font-bold text-zinc-900">Pague para confirmar o pedido #{pedido.id}</h1>
        <PixAguardando pix={pedido.pix} pedidoId={pedido.id} valor={pedido.valor} onPago={() => setTela("concluido")} />
      </Cartao>
    );
  }
  if (tela === "concluido") return <Concluido pedidoId={pedido.id} forma={forma} />;

  if (itens.length === 0) {
    return (
      <Vazio Icone={ShoppingBag} titulo="Seu carrinho está vazio" texto="Escolha os produtos e eles aparecem aqui.">
        <Link href="/b2b-pedidos" className="inline-flex min-h-12 items-center rounded-full px-6 text-[15px] font-semibold bg-zinc-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(24,24,27,0.7)] hover:bg-zinc-800">Ver produtos</Link>
      </Vazio>
    );
  }

  const cadastroPendente = !lendoCadastro && cadastro?.cadastroCompleto === false;
  const botaoConcluir = (
    <Botao className="w-full" carregando={enviando} disabled={lendoCadastro || cadastroPendente} onClick={() => enviarPedido()}>
      {forma === "pix" ? "Gerar Pix" : "Concluir pedido"}
    </Botao>
  );

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/b2b-pedidos" aria-label="Voltar para os produtos" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-black/5"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">Finalizar pedido</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
          {cadastroPendente && (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Falta seu endereço de entrega</p>
              <p className="mt-0.5">Complete o cadastro para concluir. Seu carrinho fica guardado.</p>
              <Link href="/b2b-perfil#endereco" className="mt-2 inline-block font-semibold underline">Completar cadastro</Link>
            </div>
          )}
          {lendoCadastro ? <Esqueleto className="h-[74px] rounded-[22px]" /> : envio === "transportadora" && <BarraFrete frete={frete} />}
        </div>

        {/* Celular: entrega e pagamento logo no começo. Computador: presos ao lado, com o total e o botão sempre à vista */}
        <div ref={colunaLateral} className={`flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 ${colunaCabe ? "lg:sticky lg:top-[100px]" : ""}`}>
          <div className="space-y-4">
            <Entrega envio={envio} setEnvio={setEnvio} frete={frete} cadastro={cadastro} />
            <Pagamento forma={forma} setForma={setForma} prazo={prazo} setPrazo={setPrazoEscolhido} prazos={prazos} metodos={metodos} subtotal={subtotal} onCartao={enviarPedido} />
          </div>
          <div className="hidden lg:block">
            <Resumo subtotal={subtotal} frete={frete} envio={envio} unidades={unidades} botao={forma !== "cartao" && botaoConcluir} />
          </div>
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <ListaDeItens itens={itens} unidades={unidades} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className={`${ESTILO.vidro} flex items-center gap-3 rounded-[22px] bg-white/90 p-3`}>
          <div className="shrink-0 pl-1">
            <p className="text-xs text-zinc-500">Total · {unidades} un</p>
            <p className="text-lg font-bold tabular-nums text-zinc-900">{moeda(subtotal)}</p>
          </div>
          {forma !== "cartao" ? <div className="min-w-0 flex-1">{botaoConcluir}</div> : <p className="min-w-0 flex-1 text-right text-[13px] text-zinc-500">Preencha o cartão para pagar</p>}
        </div>
      </div>
    </>
  );
}
