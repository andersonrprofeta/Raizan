"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle, Building2, CreditCard, Mail, MapPin, Package, Pencil, Phone, ShieldAlert, ChevronLeft, ChevronRight, Truck, User, UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Avatar, BOTAO_SECUNDARIO, Carregando, CascaPagina, EstadoVazio, Kpi, moeda, moedaCurta, Modal, Segmentado, VIDRO
} from "@/components/vendedores/ui";
import { getHeaders, getHubUrl } from "@/components/utils/api";
import { dataBrasilia, dataHoraCurtaBrasilia, instanteDe } from "@/components/utils/horaBrasilia";

const PEDIDOS_POR_PAGINA = 8;

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "faturado", rotulo: "Faturados" },
  { id: "aberto", rotulo: "Em aberto" },
  { id: "cancelado", rotulo: "Cancelados" }
];

const SITUACOES = {
  faturado: { rotulo: "Faturado", cor: "text-emerald-700 dark:text-emerald-400", ponto: "bg-emerald-500" },
  aberto: { rotulo: "Em aberto", cor: "text-amber-700 dark:text-amber-400", ponto: "bg-amber-500" },
  cancelado: { rotulo: "Cancelado", cor: "text-rose-600 dark:text-rose-400", ponto: "bg-rose-500" }
};

const lerJson = (valor) => {
  try {
    return (typeof valor === "string" ? JSON.parse(valor) : valor) || {};
  } catch (erro) {
    return {};
  }
};

function nomeDoCanal(origem) {
  const canal = String(origem || "").toLowerCase();
  if (canal.includes("omie")) return "Omie";
  if (canal.includes("woo")) return "WooCommerce";
  if (canal.includes("b2b")) return "Portal B2B";
  if (canal.includes("raizan") || canal.includes("seller")) return "Raizan Seller";
  return "Manual";
}

// Sempre na hora de Brasília
const formatarData = (data) => dataBrasilia(data, "Sem data");
const formatarDataHora = (data) => dataHoraCurtaBrasilia(data, "Sem data");

function textoDaUltimaCompra(data) {
  if (!data) return { valor: "Sem compras", detalhe: "Nenhum pedido registrado" };
  const dias = Math.floor((Date.now() - instanteDe(data)) / 86400000);
  if (dias <= 0) return { valor: "Hoje", detalhe: formatarData(data) };
  return { valor: dias === 1 ? "1 dia" : `${dias} dias`, detalhe: `Em ${formatarData(data)}` };
}

function canalFavorito(pedidos) {
  const contagem = {};
  pedidos.forEach((pedido) => {
    const canal = nomeDoCanal(pedido.origem);
    contagem[canal] = (contagem[canal] || 0) + 1;
  });
  return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

const Pilula = ({ children, tom = "" }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tom || "bg-black/[0.05] dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-300"}`}>
    {children}
  </span>
);

function Cartao({ titulo, icone: Icone, children }) {
  return (
    <section className={`${VIDRO} p-5`}>
      <h2 className="flex items-center gap-2 font-semibold tracking-tight mb-4">
        <Icone size={17} className="text-purple-600 dark:text-purple-400" aria-hidden /> {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dado({ icone: Icone, rotulo, children }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      {Icone && <Icone size={16} className="mt-0.5 shrink-0 text-zinc-400" aria-hidden />}
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{rotulo}</p>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words">{children}</div>
      </div>
    </div>
  );
}

const Linha = ({ rotulo, children, tom = "" }) => (
  <div className="flex items-center justify-between gap-4 py-2 text-sm">
    <span className="text-zinc-500 dark:text-zinc-400">{rotulo}</span>
    <span className={`font-semibold tabular-nums text-right ${tom || "text-zinc-900 dark:text-zinc-100"}`}>{children}</span>
  </div>
);

function LinhaPedido({ pedido, onAbrir }) {
  const situacao = SITUACOES[pedido.situacao] || SITUACOES.aberto;
  const quantidade = pedido.itens.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);

  return (
    <button type="button" onClick={onAbrir} className="w-full text-left grid grid-cols-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 px-5 py-3.5 hover:bg-black/[0.025] dark:hover:bg-white/[0.03] transition-colors">
      <div className="min-w-0">
        <p className="font-semibold tracking-tight truncate">#{pedido.codigo_externo}</p>
        <p className="text-xs text-zinc-500">{nomeDoCanal(pedido.origem)}</p>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-right sm:text-left tabular-nums">{formatarData(pedido.created_at)}</p>
      <p className={`inline-flex items-center gap-1.5 text-xs font-semibold ${situacao.cor}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${situacao.ponto}`} /> {situacao.rotulo}
      </p>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{moeda(pedido.valor_faturado ?? pedido.total)}</p>
        <p className="text-xs text-zinc-500 tabular-nums">{quantidade} {quantidade === 1 ? "unidade" : "unidades"}</p>
      </div>
    </button>
  );
}

function ModalPedido({ pedido, onFechar }) {
  return (
    <Modal titulo={`Pedido #${pedido.codigo_externo}`} descricao={`${nomeDoCanal(pedido.origem)} · ${formatarDataHora(pedido.created_at)}`} onFechar={onFechar} largura="max-w-lg">
      {pedido.itens.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 text-center">Este pedido não tem itens registrados.</p>
      ) : (
        <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
          {pedido.itens.map((item, indice) => (
            <li key={`${item.sku || item.nome_produto}-${indice}`} className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.nome_produto}</p>
                {item.sku && <p className="text-xs text-zinc-500 font-mono">{item.sku}</p>}
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {item.quantidade}
                {item.quantidade_pedida > item.quantidade && <span className="block text-xs font-normal text-rose-600 dark:text-rose-400">de {item.quantidade_pedida}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-between gap-4 py-4 mt-1 border-t border-black/[0.06] dark:border-white/[0.08] font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{moeda(pedido.valor_faturado ?? pedido.total)}</span>
      </div>
    </Modal>
  );
}

function HistoricoDePedidos({ pedidos }) {
  const [filtro, setFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [aberto, setAberto] = useState(null);

  const filtrados = useMemo(() => (filtro === "todos" ? pedidos : pedidos.filter((p) => p.situacao === filtro)), [pedidos, filtro]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PEDIDOS_POR_PAGINA));
  const visiveis = filtrados.slice((pagina - 1) * PEDIDOS_POR_PAGINA, pagina * PEDIDOS_POR_PAGINA);

  const trocarFiltro = (novo) => {
    setFiltro(novo);
    setPagina(1);
  };

  return (
    <section className={`${VIDRO} overflow-hidden`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div>
          <h2 className="font-semibold tracking-tight">Histórico de pedidos</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Todas as origens em uma só lista</p>
        </div>
        <Segmentado opcoes={FILTROS} valor={filtro} onChange={trocarFiltro} />
      </div>

      {visiveis.length === 0 ? (
        <EstadoVazio icone={Package} titulo="Nenhum pedido" texto="Não há pedidos nesta situação." />
      ) : (
        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
          {visiveis.map((pedido, indice) => <LinhaPedido key={`${pedido.origem}-${pedido.id}-${indice}`} pedido={pedido} onAbrir={() => setAberto(pedido)} />)}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-black/[0.05] dark:border-white/[0.06]">
          <p className="text-sm text-zinc-500 tabular-nums">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <button type="button" aria-label="Página anterior" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)} className={`${BOTAO_SECUNDARIO} !h-9 !px-3`}><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Próxima página" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)} className={`${BOTAO_SECUNDARIO} !h-9 !px-3`}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {aberto && <ModalPedido pedido={aberto} onFechar={() => setAberto(null)} />}
    </section>
  );
}

function PaginaCliente() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [dados, setDados] = useState(null);
  const [rota, setRota] = useState(null);
  const [condicoes, setCondicoes] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const [respostaCliente, respostaRotas] = await Promise.all([
        fetch(`${getHubUrl()}/api/hub/clientes/${id}/dashboard`, { headers: getHeaders() }),
        fetch(`${getHubUrl()}/api/hub/rotas-frete`, { headers: getHeaders() })
      ]);
      const data = await respostaCliente.json();
      const dataRotas = await respostaRotas.json();
      if (!data.success) throw new Error();

      setDados(data);
      setRota((dataRotas.rotas || []).find((r) => String(r.id) === String(data.cliente.id_rota_frete)) || null);
    } catch (erro) {
      toast.error("Cliente não encontrado.");
      router.push("/cadastros/clientes");
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) {
      router.push("/cadastros/clientes");
      return;
    }
    carregar();
    fetch(`${getHubUrl()}/api/hub/integracoes/omie/condicoes-pagamento`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => setCondicoes(data.success ? data.condicoes || [] : []))
      .catch(() => setCondicoes([]));
  }, [id, carregar, router]);

  if (!dados) return <Carregando texto="Abrindo cliente..." />;

  const { cliente, kpis, pedidos } = dados;
  const endereco = lerJson(cliente.endereco_json);
  const metadata = lerJson(cliente.metadata_json);
  const documento = String(cliente.cpf_cnpj || "").replace(/\D/g, "");
  const pessoaJuridica = cliente.tipo_pessoa === "juridica" || documento.length > 11;
  const canal = canalFavorito(pedidos);
  const ultimaCompra = textoDaUltimaCompra(kpis.ultima_compra);
  const titulos = metadata.titulos_em_aberto || [];
  const prazos = metadata.condicoes_permitidas || [];
  const cidade = [endereco.cidade, endereco.uf].filter(Boolean).join(" / ");

  return (
    <>
      <Link href="/cadastros/clientes" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <ChevronLeft size={16} /> Clientes
      </Link>

      <section className={`${VIDRO} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5`}>
        <div className="flex items-center gap-4 min-w-0">
          <Avatar nome={cliente.nome} tamanho={68} />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] leading-tight font-bold tracking-tight text-balance">{cliente.nome}</h1>
            {metadata.nome_fantasia && metadata.nome_fantasia !== cliente.nome && <p className="text-sm text-zinc-500 mt-0.5">{metadata.nome_fantasia}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <Pilula>{pessoaJuridica ? <><Building2 size={12} /> Pessoa jurídica</> : <><User size={12} /> Pessoa física</>}</Pilula>
              {canal && <Pilula>Compra por {canal}</Pilula>}
              {metadata.bloqueado && <Pilula tom="bg-rose-600 text-white"><ShieldAlert size={12} /> Faturamento bloqueado</Pilula>}
            </div>
          </div>
        </div>
        <Link href={`/cadastros/clientes/editar?id=${cliente.id}`} className={`${BOTAO_SECUNDARIO} shrink-0`}><Pencil size={15} /> Editar</Link>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi rotulo="Última compra" valor={ultimaCompra.valor} detalhe={ultimaCompra.detalhe} />
        <Kpi rotulo="Total comprado" valor={moedaCurta(kpis.total_gasto)} detalhe={`${kpis.pedidos_faturados} faturado(s)`} tom="text-purple-600 dark:text-purple-400" />
        <Kpi rotulo="Ticket médio" valor={moedaCurta(kpis.ticket_medio)} detalhe="Por pedido faturado" />
        <Kpi rotulo="Pedidos" valor={kpis.total_pedidos} detalhe={`${kpis.pedidos_em_aberto} em aberto, ${kpis.pedidos_cancelados} cancelado(s)`} />
        <Kpi
          rotulo="Inadimplência"
          valor={moedaCurta(kpis.valor_vencido)}
          detalhe={`${moedaCurta(kpis.valor_em_aberto)} em aberto`}
          tom={kpis.valor_vencido > 0 ? "text-rose-600 dark:text-rose-400" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 items-start">
        <div className="space-y-6 min-w-0 order-2 lg:order-1">
          <Cartao titulo="Contato" icone={User}>
            <div className="space-y-4">
              <Dado icone={Mail} rotulo="E-mail">{cliente.email || "Não informado"}</Dado>
              <Dado icone={Phone} rotulo="Telefone">{cliente.telefone || "Não informado"}</Dado>
              <Dado icone={CreditCard} rotulo={pessoaJuridica ? "CNPJ" : "CPF"}>{cliente.cpf_cnpj || "Não informado"}</Dado>
              <Dado icone={MapPin} rotulo="Endereço">
                {endereco.logradouro ? `${endereco.logradouro}, ${endereco.numero || "S/N"}${endereco.bairro ? ` - ${endereco.bairro}` : ""}` : "Não informado"}
                {cidade && <span className="block text-zinc-500 font-normal">{cidade}</span>}
              </Dado>
              <Dado icone={UserCheck} rotulo="Vendedor responsável">{cliente.nome_vendedor || "Não atribuído"}</Dado>
            </div>
          </Cartao>

          <Cartao titulo="Financeiro" icone={CreditCard}>
            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              <Linha rotulo="Situação" tom={metadata.bloqueado ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>{metadata.bloqueado ? "Bloqueado" : "Ativo"}</Linha>
              <Linha rotulo="Limite de crédito">{moeda(metadata.limite_credito)}</Linha>
              <Linha rotulo="Títulos em aberto">{moeda(kpis.valor_em_aberto)}</Linha>
              <Linha rotulo="Vencido" tom={kpis.valor_vencido > 0 ? "text-rose-600 dark:text-rose-400" : ""}>{moeda(kpis.valor_vencido)}</Linha>
              {metadata.condicao_pagamento_padrao && <Linha rotulo="Condição padrão">{metadata.condicao_pagamento_padrao}</Linha>}
            </div>

            {titulos.length > 0 && (
              <ul className="mt-3 space-y-2">
                {titulos.map((titulo, indice) => (
                  <li key={titulo.id_titulo || indice} className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-zinc-600 dark:text-zinc-300">{titulo.situacao || "Título"}</span>
                      <span className="font-semibold tabular-nums">{moeda(titulo.valor)}</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${Number(titulo.dias_atraso) > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-500"}`}>
                      Vence em {titulo.vencimento}{Number(titulo.dias_atraso) > 0 ? ` · ${titulo.dias_atraso} dias de atraso` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">Prazos liberados no app</p>
              {prazos.length === 0 ? (
                <p className="text-sm font-medium">Todos os prazos</p>
              ) : condicoes === null ? (
                <p className="text-sm text-zinc-500">Buscando os prazos...</p>
              ) : condicoes.length === 0 ? (
                <p className="text-sm text-zinc-500">{prazos.length} prazo(s) liberado(s). Os nomes não carregaram agora: reabra em 1 minuto.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {prazos.map((codigo) => <Pilula key={codigo}>{condicoes.find((c) => String(c.codigo) === String(codigo))?.descricao || "Prazo não encontrado no Omie"}</Pilula>)}
                </div>
              )}
            </div>
          </Cartao>

          <Cartao titulo="Logística" icone={Truck}>
            {rota ? (
              <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                <Linha rotulo="Rota">{rota.nome}</Linha>
                <Linha rotulo="Mínimo CIF">{moeda(rota.valor_minimo)}</Linha>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Nenhuma rota vinculada. <Link href={`/cadastros/clientes/editar?id=${cliente.id}`} className="font-semibold text-purple-600 dark:text-purple-400">Vincular rota</Link>
              </p>
            )}
          </Cartao>

          {metadata.observacoes && (
            <Cartao titulo="Observações" icone={AlertCircle}>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{metadata.observacoes}</p>
            </Cartao>
          )}
        </div>

        <div className="min-w-0 order-1 lg:order-2"><HistoricoDePedidos pedidos={pedidos} /></div>
      </div>
    </>
  );
}

export default function DetalhesClientePage() {
  return (
    <CascaPagina>
      <Suspense fallback={<Carregando texto="Abrindo cliente..." />}>
        <PaginaCliente />
      </Suspense>
    </CascaPagina>
  );
}
