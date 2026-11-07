"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CornerDownLeft, Loader2, Search, X } from "lucide-react";
import { useCatalogo } from "./dados";
import { codigoExato, combina, pesoNaBusca, semAcento } from "./filtro";
import { EVENTO_DA_BUSCA } from "./LinhaProduto";
import { precoDoItem } from "./precos";
import { ESTILO, Foto, moeda } from "./ui";

const CATALOGO = "/b2b-pedidos";
const ESPERA_MS = 180;
const SUGESTOES = 6;

function Sugestao({ produto, destacada, onEscolher, onApontar }) {
  const { preco } = precoDoItem(produto, 1);
  const esgotado = produto.estoque_inicial <= 0;
  return (
    <li>
      <button type="button" onMouseEnter={onApontar} onClick={onEscolher} className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left ${destacada ? "bg-black/[0.05]" : ""}`}>
        <Foto produto={produto} className={`h-10 w-10 shrink-0 rounded-lg border border-black/5 bg-white p-0.5 ${esgotado ? "opacity-50 grayscale" : ""}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900">{produto.nome}</span>
          <span className="block truncate text-xs text-zinc-500">{produto.marca} · SKU {produto.sku}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold tabular-nums text-zinc-900">{moeda(preco)}</span>
          <span className={`block text-[11px] font-semibold ${esgotado ? "text-zinc-400" : "text-emerald-700"}`}>{esgotado ? "Esgotado" : `${produto.estoque_inicial} em estoque`}</span>
        </span>
      </button>
    </li>
  );
}

// No catálogo a lista filtra enquanto digita; nas outras telas aparecem sugestões logo abaixo da busca
export default function Busca() {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const termoDaTela = parametros.get("q") || "";
  const noCatalogo = caminho.startsWith(CATALOGO);
  const { dados, carregando } = useCatalogo();

  const [texto, setTexto] = useState(termoDaTela);
  const [buscado, setBuscado] = useState(termoDaTela);
  const [aberta, setAberta] = useState(false);
  const [destaque, setDestaque] = useState(-1);
  const campo = useRef(null);

  useEffect(() => {
    if (document.activeElement !== campo.current) {
      setTexto(termoDaTela);
      setBuscado(termoDaTela);
    }
  }, [termoDaTela]);

  useEffect(() => {
    const espera = setTimeout(() => setBuscado(texto), ESPERA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  const busca = semAcento(buscado);
  const achados = useMemo(() => {
    if (!busca) return [];
    return (dados?.produtos || []).filter((produto) => combina(produto, busca)).sort((a, b) => pesoNaBusca(b, busca) - pesoNaBusca(a, busca));
  }, [dados, busca]);

  const levarAoCatalogo = (valor, focar) => {
    const filtros = new URLSearchParams(noCatalogo ? parametros.toString() : "");
    if (valor) filtros.set("q", valor);
    else filtros.delete("q");
    if (focar && !noCatalogo) filtros.set("focar", "1");
    const consulta = filtros.toString();
    const destino = `${CATALOGO}${consulta ? `?${consulta}` : ""}`;
    if (noCatalogo) router.replace(destino, { scroll: false });
    else router.push(destino);
  };

  // No catálogo, cada pausa na digitação já filtra a lista
  useEffect(() => {
    if (noCatalogo && semAcento(buscado) !== semAcento(termoDaTela)) levarAoCatalogo(buscado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscado]);

  const confirmar = (valor) => {
    setAberta(false);
    setDestaque(-1);
    setTexto(valor);
    setBuscado(valor);
    if (!window.matchMedia("(min-width: 768px)").matches) campo.current?.blur();
    levarAoCatalogo(valor, true);
    if (noCatalogo) window.dispatchEvent(new CustomEvent(EVENTO_DA_BUSCA, { detail: valor }));
  };

  const sugestoes = achados.slice(0, SUGESTOES);
  const mostrarSugestoes = aberta && !noCatalogo && Boolean(texto.trim());
  const pensando = texto !== buscado || (carregando && Boolean(texto));

  const aoTeclar = (evento) => {
    if (evento.key === "Escape") {
      setAberta(false);
      return;
    }
    if (evento.key === "ArrowDown") {
      if (mostrarSugestoes && sugestoes.length) {
        evento.preventDefault();
        setDestaque((atual) => Math.min(sugestoes.length - 1, atual + 1));
        return;
      }
      const linha = document.querySelector("[data-qtd-sku]");
      if (noCatalogo && linha) {
        evento.preventDefault();
        linha.focus();
      }
    }
    if (evento.key === "ArrowUp" && mostrarSugestoes) {
      evento.preventDefault();
      setDestaque((atual) => Math.max(-1, atual - 1));
    }
  };

  return (
    <div className="relative w-full">
      <form
        role="search"
        onSubmit={(evento) => {
          evento.preventDefault();
          const escolhida = mostrarSugestoes ? sugestoes[destaque] : null;
          confirmar(escolhida ? escolhida.sku : texto.trim());
        }}
      >
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          ref={campo}
          data-busca
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={texto}
          onChange={(evento) => { setTexto(evento.target.value); setAberta(true); setDestaque(-1); }}
          onFocus={() => setAberta(true)}
          onBlur={() => setAberta(false)}
          onKeyDown={aoTeclar}
          placeholder="Buscar por nome, marca, SKU ou EAN"
          aria-label="Buscar produto"
          aria-expanded={mostrarSugestoes}
          className="h-11 w-full rounded-full border border-black/[0.06] bg-black/[0.04] pl-11 pr-24 text-base text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 md:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {texto && (pensando
            ? <Loader2 size={16} className="animate-spin text-violet-500" aria-label="Buscando" />
            : <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 ring-1 ring-black/5" aria-live="polite">{achados.length} {achados.length === 1 ? "item" : "itens"}</span>)}
          {texto && (
            <button type="button" aria-label="Limpar busca" onMouseDown={(evento) => evento.preventDefault()} onClick={() => { setTexto(""); setBuscado(""); if (noCatalogo) levarAoCatalogo(""); campo.current?.focus(); }} className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-black/5 hover:text-zinc-700">
              <X size={15} />
            </button>
          )}
        </span>
      </form>

      {mostrarSugestoes && (
        <div onMouseDown={(evento) => evento.preventDefault()} className={`${ESTILO.vidro} absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl bg-white/95 p-1.5`}>
          {pensando && sugestoes.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-500"><Loader2 size={15} className="animate-spin" /> Buscando</p>
          ) : sugestoes.length === 0 ? (
            <p className="px-3 py-3 text-sm text-zinc-500">Nenhum produto com &quot;{texto.trim()}&quot;. Confira o código ou o nome.</p>
          ) : (
            <>
              <ul>
                {sugestoes.map((produto, indice) => (
                  <Sugestao key={produto.sku} produto={produto} destacada={indice === destaque || (destaque < 0 && indice === 0 && codigoExato(produto, busca))} onApontar={() => setDestaque(indice)} onEscolher={() => confirmar(produto.sku)} />
                ))}
              </ul>
              <button type="button" onClick={() => confirmar(texto.trim())} className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">
                Ver {achados.length === 1 ? "o resultado" : `os ${achados.length} resultados`} na lista
                <CornerDownLeft size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
