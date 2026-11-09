"use client";

// Pedido rápido: o lojista já sabe o que quer. Busca, digita a quantidade, Enter, e vai para o próximo.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, PackageSearch, RefreshCw, Search, SlidersHorizontal, Zap } from "lucide-react";
import LinhaProduto, { EVENTO_DA_BUSCA, focarBusca, focarQuantidade } from "@/components/portal/LinhaProduto";
import PainelDoPedido from "@/components/portal/PainelDoPedido";
import { useCarrinho } from "@/components/portal/carrinho";
import { useCadastro, useCatalogo } from "@/components/portal/dados";
import { codigoExato, combina, notaNaBusca, pesoNaBusca, semAcento } from "@/components/portal/filtro";
import { precoDoItem } from "@/components/portal/precos";
import { Botao, ESTILO, Esqueleto, Vazio } from "@/components/portal/ui";
import { marcaBonificada } from "@/components/utils/marcaBonificada";

const POR_VEZ = 60;
const NO_COMPUTADOR = "(min-width: 768px)";

const ORDENACOES = {
  relevancia: { rotulo: "Padrão", comparar: null },
  nome: { rotulo: "Nome (A-Z)", comparar: (a, b) => a.nome.localeCompare(b.nome, "pt-BR") },
  menor: { rotulo: "Menor preço", comparar: (a, b) => precoDoItem(a).preco - precoDoItem(b).preco },
  maior: { rotulo: "Maior preço", comparar: (a, b) => precoDoItem(b).preco - precoDoItem(a).preco },
};

const cumprirFocoDe = (pendente) => {
  const alvo = pendente.current;
  if (!alvo) return;
  pendente.current = null;
  if (!focarQuantidade(alvo.sku)) focarBusca();
};

function Chip({ ativo, onClick, children }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick} className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-all ${ativo ? "bg-zinc-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]" : "border border-black/[0.06] bg-white text-zinc-700"}`}>
      {children}
    </button>
  );
}

function OpcaoDeMarca({ ativo, onClick, children, contagem }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick} className={`group flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] transition-colors ${ativo ? "bg-zinc-900 font-semibold text-white" : "text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-900"}`}>
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border ${ativo ? "border-white/30 bg-white/15" : "border-black/15 bg-white"}`}>{ativo && <Check size={11} strokeWidth={3} />}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {contagem !== undefined && <span className={`text-[11px] tabular-nums ${ativo ? "text-white/60" : "text-zinc-400"}`}>{contagem}</span>}
    </button>
  );
}

function FiltrosDoComputador({ marcas, marca, ofertas, totalOfertas, escolherMarca, alternarOfertas, limpar, filtroAtivo }) {
  const [procurar, setProcurar] = useState("");
  const visiveis = marcas.filter(({ nome }) => semAcento(nome).includes(semAcento(procurar)));

  return (
    <aside className={`${ESTILO.cartao} sticky top-[100px] hidden max-h-[calc(100dvh-124px)] flex-col self-start overflow-hidden lg:flex`}>
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <p className="flex items-center gap-2 text-sm font-bold text-zinc-900"><SlidersHorizontal size={15} className="text-zinc-400" /> Filtros</p>
        {filtroAtivo && <button type="button" onClick={limpar} className="text-xs font-semibold text-violet-700 hover:text-violet-900">Limpar</button>}
      </div>

      <div className="px-3">
        <button type="button" aria-pressed={ofertas} onClick={alternarOfertas} className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all ${ofertas ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-black/[0.03]"}`}>
          <span className={`${ESTILO.tile} flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]`}><Zap size={15} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-zinc-900">Só ofertas</span>
            <span className="block text-[11px] text-zinc-500">{totalOfertas} produtos com preço especial</span>
          </span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${ofertas ? "bg-violet-600" : "bg-zinc-200"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${ofertas ? "left-[18px]" : "left-0.5"}`} />
          </span>
        </button>
      </div>

      <div className="mt-3 border-t border-black/5 px-3 pt-3">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Marcas</p>
        {marcas.length > 8 && (
          <label className="relative mt-2 block">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={procurar} onChange={(evento) => setProcurar(evento.target.value)} placeholder="Procurar marca" aria-label="Procurar marca" className="h-8 w-full rounded-lg bg-black/[0.04] pl-8 pr-2 text-[13px] outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20" />
          </label>
        )}
      </div>
      <div className="mt-1.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">
        {!procurar && <OpcaoDeMarca ativo={!marca} onClick={() => escolherMarca("")}>Todas as marcas</OpcaoDeMarca>}
        {visiveis.map(({ nome, total }) => (
          <OpcaoDeMarca key={nome} ativo={marca === nome} onClick={() => escolherMarca(marca === nome ? "" : nome)} contagem={total}>{nome}</OpcaoDeMarca>
        ))}
        {visiveis.length === 0 && <p className="px-2.5 py-2 text-xs text-zinc-400">Nenhuma marca com esse nome</p>}
      </div>
    </aside>
  );
}

function FiltrosDoCelular({ marcas, marca, ofertas, escolherMarca, alternarOfertas }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden">
      <Chip ativo={ofertas} onClick={alternarOfertas}><Zap size={14} /> Ofertas</Chip>
      {marcas.map(({ nome }) => (
        <Chip key={nome} ativo={marca === nome} onClick={() => escolherMarca(marca === nome ? "" : nome)}>{nome}</Chip>
      ))}
    </div>
  );
}

function Catalogo() {
  const router = useRouter();
  const parametros = useSearchParams();
  const { dados, carregando, erro, recarregar } = useCatalogo();
  const { dados: cadastro } = useCadastro();
  const { carrinho } = useCarrinho();
  const [ordem, setOrdem] = useState("relevancia");
  const [visiveis, setVisiveis] = useState(POR_VEZ);
  const fimDaLista = useRef(null);
  const focoPendente = useRef(null);
  const termoAtual = useRef("");

  const termo = parametros.get("q") || "";
  const marca = parametros.get("marca") || "";
  const ofertas = parametros.get("ofertas") === "1";
  const pedirFoco = parametros.get("focar") === "1";
  const produtos = useMemo(() => dados?.produtos || [], [dados]);

  const trocarFiltro = (nome, valor) => {
    const filtros = new URLSearchParams(parametros.toString());
    if (valor) filtros.set(nome, valor);
    else filtros.delete(nome);
    const consulta = filtros.toString();
    router.replace(`/b2b-pedidos${consulta ? `?${consulta}` : ""}`, { scroll: false });
  };

  useEffect(() => setVisiveis(POR_VEZ), [termo, marca, ofertas, ordem]);

  // No computador o cursor já começa na busca
  useEffect(() => {
    if (!pedirFoco && window.matchMedia(NO_COMPUTADOR).matches) focarBusca();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const marcas = useMemo(() => {
    const contagem = new Map();
    produtos.forEach(({ marca: nome }) => { if (nome) contagem.set(nome, (contagem.get(nome) || 0) + 1); });
    return [...contagem]
      .filter(([nome]) => !marcaBonificada(nome, cadastro?.prefixoBonificados))
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [produtos, cadastro]);

  const emOferta = useMemo(() => produtos.filter((produto) => precoDoItem(produto).temPromocao), [produtos]);

  const encontrados = useMemo(() => {
    const busca = semAcento(termo);
    const filtrados = (ofertas ? emOferta : produtos).filter((produto) => (!marca || produto.marca === marca) && combina(produto, busca));
    const comparar = ORDENACOES[ordem].comparar;
    const ordenados = comparar ? [...filtrados].sort(comparar) : filtrados;
    const peso = comparar ? pesoNaBusca : notaNaBusca;
    return [...ordenados].sort((a, b) => peso(b, busca) - peso(a, busca));
  }, [produtos, emOferta, termo, marca, ofertas, ordem]);

  // Para onde vai o cursor depois de uma busca confirmada: código exato (leitor de código de barras),
  // resultado único ou, no computador, a primeira linha da lista
  const marcarFoco = (texto) => {
    const busca = semAcento(texto);
    if (!busca) return;
    const exato = produtos.find((produto) => codigoExato(produto, busca));
    const achados = produtos.filter((produto) => combina(produto, busca));
    const certeiro = exato || (achados.length === 1 ? achados[0] : null);
    if (!certeiro && !window.matchMedia(NO_COMPUTADOR).matches) return;
    focoPendente.current = { busca, sku: certeiro?.sku || "" };
    if (termoAtual.current === busca) requestAnimationFrame(() => cumprirFocoDe(focoPendente));
  };

  useEffect(() => {
    const aoBuscar = ({ detail }) => marcarFoco(detail);
    window.addEventListener(EVENTO_DA_BUSCA, aoBuscar);
    return () => window.removeEventListener(EVENTO_DA_BUSCA, aoBuscar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos]);

  // Vindo de uma sugestão da busca em outra tela
  useEffect(() => {
    if (!pedirFoco || produtos.length === 0) return;
    termoAtual.current = semAcento(termo);
    marcarFoco(termo);
    trocarFiltro("focar", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedirFoco, produtos]);

  useEffect(() => {
    termoAtual.current = semAcento(termo);
    if (focoPendente.current?.busca === termoAtual.current) requestAnimationFrame(() => cumprirFocoDe(focoPendente));
  }, [termo, encontrados]);

  const temMais = visiveis < encontrados.length;
  useEffect(() => {
    if (!temMais || !fimDaLista.current) return undefined;
    const observador = new IntersectionObserver(([marcador]) => {
      if (marcador.isIntersecting) setVisiveis((atual) => atual + POR_VEZ);
    }, { rootMargin: "600px" });
    observador.observe(fimDaLista.current);
    return () => observador.disconnect();
  }, [temMais, encontrados.length, visiveis]);

  const filtroAtivo = Boolean(termo || marca || ofertas);
  const limpar = () => router.replace("/b2b-pedidos", { scroll: false });
  const filtros = {
    marcas, marca, ofertas, totalOfertas: emOferta.length, filtroAtivo, limpar,
    escolherMarca: (nome) => trocarFiltro("marca", nome),
    alternarOfertas: () => trocarFiltro("ofertas", ofertas ? "" : "1"),
  };

  if (erro && !dados) {
    return (
      <Vazio Icone={RefreshCw} titulo="Não conseguimos abrir os produtos" texto="Verifique sua internet e tente de novo.">
        <Botao onClick={recarregar}>Tentar de novo</Botao>
      </Vazio>
    );
  }

  const mostrando = Math.min(visiveis, encontrados.length);
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
      <FiltrosDoComputador {...filtros} />

      <div className="min-w-0 space-y-3">
        <FiltrosDoCelular {...filtros} />

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Pedido rápido</h1>
            <p className="text-[13px] text-zinc-500">
              {carregando ? "Carregando produtos" : `${encontrados.length.toLocaleString("pt-BR")} ${encontrados.length === 1 ? "produto" : "produtos"}`}
              <span className="hidden md:inline"> · digite a quantidade e aperte Enter</span>
            </p>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-zinc-500">
            <span className="hidden sm:inline">Ordenar</span>
            <select value={ordem} onChange={(evento) => setOrdem(evento.target.value)} aria-label="Ordenar produtos" className="h-9 rounded-full border border-black/[0.06] bg-white px-3 text-[13px] font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-violet-500/20">
              {Object.entries(ORDENACOES).map(([chave, { rotulo }]) => <option key={chave} value={chave}>{rotulo}</option>)}
            </select>
          </label>
        </div>

        {carregando && <Esqueleto className="h-[480px] rounded-[22px]" />}

        {!carregando && encontrados.length === 0 && (
          <Vazio Icone={PackageSearch} titulo="Nenhum produto encontrado" texto="Confira o nome, o SKU ou o EAN, ou tire os filtros.">
            {filtroAtivo && <Botao variante="secundario" onClick={limpar}>Limpar filtros</Botao>}
          </Vazio>
        )}

        {!carregando && encontrados.length > 0 && (
          <div className={`${ESTILO.cartao} overflow-hidden`}>
            <div className="hidden grid-cols-[44px_minmax(0,1fr)_72px_112px_132px] gap-x-3 border-b border-black/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 md:grid">
              <span />
              <span>Produto</span>
              <span className="text-right">Estoque</span>
              <span className="text-right">Preço</span>
              <span className="text-center">Quantidade</span>
            </div>
            <ul className="divide-y divide-black/5">
              {encontrados.slice(0, mostrando).map((produto) => <LinhaProduto key={produto.sku} produto={produto} qtd={carrinho[produto.sku]?.qtd || 0} />)}
            </ul>
          </div>
        )}

        {!carregando && encontrados.length > 0 && (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs tabular-nums text-zinc-500">Mostrando {mostrando.toLocaleString("pt-BR")} de {encontrados.length.toLocaleString("pt-BR")}</p>
            {temMais && (
              <>
                <div className="h-1 w-40 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(mostrando / encontrados.length) * 100}%` }} /></div>
                <button ref={fimDaLista} type="button" onClick={() => setVisiveis((atual) => atual + POR_VEZ)} className="mt-1 h-9 rounded-full border border-black/[0.06] bg-white px-4 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50">Carregar mais</button>
              </>
            )}
          </div>
        )}
      </div>

      <PainelDoPedido />
    </div>
  );
}

export default function PaginaDoCatalogo() {
  return <Suspense><Catalogo /></Suspense>;
}
