"use client";

import { useState } from "react";
import { Barcode, Tag, Zap } from "lucide-react";
import { definirQuantidade, useCarrinho } from "./carrinho";
import { precoDoItem } from "./precos";
import { Botao, Etiqueta, Folha, Foto, Quantidade, fotosDoProduto, moeda } from "./ui";

function Preco({ produto, qtd, grande }) {
  const { preco, normal, promocional, minimo, temPromocao, atingiu, faltam } = precoDoItem(produto, qtd);
  const tamanho = grande ? "text-3xl" : "text-lg";

  if (temPromocao && minimo <= 1) {
    return (
      <div>
        <p className="text-xs text-zinc-400 line-through">{moeda(normal)}</p>
        <p className={`${tamanho} font-bold tabular-nums text-violet-700`}>{moeda(promocional)}</p>
      </div>
    );
  }

  return (
    <div>
      <p className={`${tamanho} font-bold tabular-nums ${atingiu ? "text-violet-700" : "text-zinc-900"}`}>{moeda(preco)}</p>
      {temPromocao && (
        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-violet-700">
          <Tag size={12} className="shrink-0" />
          {atingiu ? "Preço de atacado aplicado" : qtd > 0 ? `Faltam ${faltam} un para ${moeda(promocional)}` : `${moeda(promocional)} a partir de ${minimo} un`}
        </p>
      )}
    </div>
  );
}

function AcaoDeCompra({ produto, qtd, grande }) {
  if (produto.estoque_inicial <= 0 && qtd === 0) {
    return <p className={`flex items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-500 ${grande ? "h-12" : "h-10"}`}>Esgotado</p>;
  }
  if (qtd > 0) return <Quantidade qtd={qtd} rotulo={produto.nome} compacto={!grande} onChange={(nova) => definirQuantidade(produto, nova)} />;

  return (
    <Botao variante={grande ? "primario" : "suave"} className={`w-full ${grande ? "" : "!min-h-10 !text-sm"}`} onClick={() => definirQuantidade(produto, 1)}>
      Adicionar
    </Botao>
  );
}

export function DetalheDoProduto({ produto, qtd, onFechar }) {
  const fotos = fotosDoProduto(produto);
  const [fotoAtiva, setFotoAtiva] = useState(0);

  return (
    <Folha aberta onFechar={onFechar} titulo={produto.marca || "Produto"} larga rodape={<AcaoDeCompra produto={produto} qtd={qtd} grande />}>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-white">
            <Foto produto={produto} src={fotos[fotoAtiva]} className="h-full w-full p-3" />
          </div>
          {fotos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
              {fotos.map((foto, indice) => (
                <button key={foto} type="button" aria-label={`Ver foto ${indice + 1}`} onClick={() => setFotoAtiva(indice)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${indice === fotoAtiva ? "border-violet-600" : "border-zinc-100"}`}>
                  <Foto src={foto} className="h-full w-full p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold leading-snug text-zinc-900">{produto.nome}</h3>
          <div className="mt-4"><Preco produto={produto} qtd={qtd} grande /></div>
          <div className="mt-4">
            {produto.estoque_inicial > 0 ? <Etiqueta tom="ok">{produto.estoque_inicial} em estoque</Etiqueta> : <Etiqueta>Sem estoque</Etiqueta>}
          </div>
          <dl className="mt-5 space-y-1.5 text-sm text-zinc-500">
            <div className="flex gap-2"><dt>SKU</dt><dd className="font-medium text-zinc-700">{produto.sku}</dd></div>
            {produto.gtin && <div className="flex items-center gap-2"><dt><Barcode size={15} aria-label="Código de barras" /></dt><dd className="font-medium text-zinc-700">{produto.gtin}</dd></div>}
          </dl>
        </div>
      </div>
    </Folha>
  );
}

export default function CartaoProduto({ produto, className = "" }) {
  const { carrinho } = useCarrinho();
  const [detalheAberto, setDetalheAberto] = useState(false);
  const qtd = carrinho[produto.sku]?.qtd || 0;
  const { desconto, temPromocao } = precoDoItem(produto, qtd);
  const esgotado = produto.estoque_inicial <= 0;

  return (
    <article className={`flex min-w-0 flex-col rounded-2xl border bg-white p-2.5 sm:p-3 ${qtd > 0 ? "border-violet-300" : "border-zinc-200"} ${className}`}>
      <button type="button" onClick={() => setDetalheAberto(true)} className="flex min-w-0 flex-1 flex-col text-left" aria-label={`Ver ${produto.nome}`}>
        <div className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white ${esgotado ? "opacity-50 grayscale" : ""}`}>
          <Foto produto={produto} className="h-full w-full p-1" />
          {temPromocao && desconto > 0 && (
            <span className="absolute left-0 top-0 inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <Zap size={10} fill="currentColor" /> -{desconto}%
            </span>
          )}
        </div>
        {produto.marca && <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{produto.marca}</p>}
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-zinc-800">{produto.nome}</h3>
        <div className="mt-2 flex-1"><Preco produto={produto} qtd={qtd} /></div>
      </button>
      <div className="mt-2.5"><AcaoDeCompra produto={produto} qtd={qtd} /></div>
      {detalheAberto && <DetalheDoProduto produto={produto} qtd={qtd} onFechar={() => setDetalheAberto(false)} />}
    </article>
  );
}
