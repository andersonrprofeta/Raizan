"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Zap } from "lucide-react";
import { DetalheDoProduto } from "./CartaoProduto";
import { definirQuantidade } from "./carrinho";
import { precoDoItem } from "./precos";
import { Foto, moeda } from "./ui";

const NO_COMPUTADOR = "(min-width: 768px)";
export const EVENTO_DA_BUSCA = "raizan:busca-enter";

// Depois do Enter, o cursor volta para a busca com o texto marcado: o próximo produto já pode ser digitado
export function focarBusca() {
  const campo = [...document.querySelectorAll("[data-busca]")].find((elemento) => elemento.offsetParent !== null);
  if (!campo) return false;
  campo.focus();
  campo.select();
  return true;
}

function focarCampo(campo) {
  if (!campo) return false;
  campo.scrollIntoView({ block: "nearest" });
  campo.focus();
  return true;
}

export function focarQuantidade(sku) {
  return focarCampo(sku ? document.querySelector(`[data-qtd-sku="${CSS.escape(String(sku))}"]`) : document.querySelector("[data-qtd-sku]"));
}

// Setas para cima e para baixo andam entre as linhas, como numa planilha
function focarVizinha(atual, passo) {
  const campos = [...document.querySelectorAll("[data-qtd-sku]")];
  const destino = campos[campos.indexOf(atual) + passo];
  if (destino) return focarCampo(destino);
  if (passo < 0) return focarBusca();
  return false;
}

function QuantidadeRapida({ produto, qtd }) {
  const [texto, setTexto] = useState(qtd ? String(qtd) : "");
  useEffect(() => setTexto(qtd ? String(qtd) : ""), [qtd]);

  const confirmar = () => {
    const numero = parseInt(texto, 10) || 0;
    if (numero !== qtd) definirQuantidade(produto, numero);
    else setTexto(qtd ? String(qtd) : "");
  };

  const aoTeclar = (evento) => {
    if (evento.key === "Escape") {
      setTexto(qtd ? String(qtd) : "");
      return;
    }
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      focarVizinha(evento.currentTarget, evento.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    // Sair do campo confirma a quantidade (onBlur)
    if (!(window.matchMedia(NO_COMPUTADOR).matches && focarBusca())) evento.currentTarget.blur();
  };

  const ativo = qtd > 0;
  return (
    <div className={`flex h-10 w-full items-center overflow-hidden rounded-lg border ${ativo ? "border-violet-500 bg-white" : "border-zinc-300 bg-white"}`}>
      <button type="button" tabIndex={-1} aria-label={`Diminuir ${produto.nome}`} disabled={!ativo} onClick={() => definirQuantidade(produto, qtd - 1)} className="flex h-10 w-9 shrink-0 items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent">
        <Minus size={16} />
      </button>
      <input
        data-qtd-sku={produto.sku}
        value={texto}
        placeholder="0"
        inputMode="numeric"
        enterKeyHint="done"
        aria-label={`Quantidade de ${produto.nome}`}
        onFocus={(evento) => evento.target.select()}
        onChange={(evento) => setTexto(evento.target.value.replace(/\D/g, "").slice(0, 5))}
        onBlur={confirmar}
        onKeyDown={aoTeclar}
        className={`h-full w-full min-w-0 bg-transparent text-center text-base font-bold tabular-nums outline-none placeholder:font-normal placeholder:text-zinc-300 ${ativo ? "text-violet-700" : "text-zinc-900"}`}
      />
      <button type="button" tabIndex={-1} aria-label={`Aumentar ${produto.nome}`} onClick={() => definirQuantidade(produto, qtd + 1)} className="flex h-10 w-9 shrink-0 items-center justify-center text-zinc-600 hover:bg-zinc-100">
        <Plus size={16} />
      </button>
    </div>
  );
}

function Preco({ produto, qtd }) {
  const { preco, normal, promocional, minimo, temPromocao, atingiu, faltam } = precoDoItem(produto, qtd);

  if (temPromocao && minimo <= 1) {
    return (
      <div className="md:text-right">
        <p className="text-xs tabular-nums text-zinc-400 line-through">{moeda(normal)}</p>
        <p className="text-[15px] font-bold tabular-nums text-violet-700">{moeda(promocional)}</p>
      </div>
    );
  }

  return (
    <div className="md:text-right">
      <p className={`text-[15px] font-bold tabular-nums ${atingiu ? "text-violet-700" : "text-zinc-900"}`}>{moeda(preco)}</p>
      {temPromocao && (
        <p className="text-[11px] font-semibold leading-tight text-violet-700">
          {atingiu ? "Atacado aplicado" : qtd > 0 ? `+${faltam} un: ${moeda(promocional)}` : `${moeda(promocional)} a partir de ${minimo}`}
        </p>
      )}
    </div>
  );
}

function Estoque({ quantidade, longo }) {
  if (quantidade <= 0) return <span className="text-xs font-semibold text-zinc-400">Esgotado</span>;
  return <span className="text-xs font-semibold tabular-nums text-emerald-700">{quantidade.toLocaleString("pt-BR")} {longo ? "em estoque" : "un"}</span>;
}

export default function LinhaProduto({ produto, qtd }) {
  const [detalheAberto, setDetalheAberto] = useState(false);
  const esgotado = produto.estoque_inicial <= 0;
  const { temPromocao } = precoDoItem(produto, qtd);

  return (
    <li className={`grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 gap-y-2 px-3 py-3 md:grid-cols-[44px_minmax(0,1fr)_72px_112px_132px] md:items-center md:px-4 md:py-2.5 ${qtd > 0 ? "bg-violet-50/60" : ""}`}>
      <button type="button" tabIndex={-1} onClick={() => setDetalheAberto(true)} aria-label={`Ver foto de ${produto.nome}`} className={`row-span-2 h-11 w-11 overflow-hidden rounded-lg border border-zinc-100 bg-white md:row-span-1 ${esgotado ? "opacity-50 grayscale" : ""}`}>
        <Foto produto={produto} className="h-full w-full p-0.5" />
      </button>

      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {temPromocao && <Zap size={13} className="mr-1 inline -translate-y-px text-violet-600" fill="currentColor" aria-label="Oferta" />}
          {produto.nome}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-zinc-500">
          {produto.marca && <span className="font-medium text-zinc-600">{produto.marca}</span>}
          <span className="tabular-nums">SKU {produto.sku}</span>
          {produto.gtin && <span className="tabular-nums">EAN {produto.gtin}</span>}
          <span className="md:hidden"><Estoque quantidade={produto.estoque_inicial} longo /></span>
        </p>
      </div>

      <div className="col-start-2 flex items-center justify-between gap-3 md:contents">
        <div className="hidden text-right md:block"><Estoque quantidade={produto.estoque_inicial} /></div>
        <div className="md:justify-self-end"><Preco produto={produto} qtd={qtd} /></div>
        <div className="w-[132px] shrink-0">
          {esgotado && qtd === 0
            ? <p className="flex h-10 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-400">Esgotado</p>
            : <QuantidadeRapida produto={produto} qtd={qtd} />}
        </div>
      </div>

      {detalheAberto && <DetalheDoProduto produto={produto} qtd={qtd} onFechar={() => setDetalheAberto(false)} />}
    </li>
  );
}
