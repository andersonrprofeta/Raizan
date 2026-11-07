"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import BarraFrete from "./BarraFrete";
import { definirQuantidade, useCarrinho } from "./carrinho";
import { useCadastro } from "./dados";
import { avaliarFrete } from "./precos";
import { ESTILO, moeda } from "./ui";

// Ao lado da lista, no computador: o pedido vai sendo montado à vista, sem trocar de tela
export default function PainelDoPedido() {
  const { itens, subtotal, unidades } = useCarrinho();
  const { dados: cadastro } = useCadastro();
  const frete = avaliarFrete(cadastro?.rota, subtotal);

  return (
    <aside aria-label="Seu pedido" className={`${ESTILO.cartao} sticky top-[100px] hidden max-h-[calc(100dvh-124px)] flex-col self-start overflow-hidden xl:flex`}>
      <div className="flex items-baseline justify-between border-b border-zinc-100 px-4 py-3">
        <h2 className="text-base font-bold text-zinc-900">Seu pedido</h2>
        <span className="text-xs tabular-nums text-zinc-500">{itens.length} {itens.length === 1 ? "produto" : "produtos"} · {unidades} un</span>
      </div>

      {itens.length === 0 ? (
        <p className="px-4 py-6 text-sm leading-relaxed text-zinc-500">
          Busque o produto, digite a quantidade e aperte <kbd className="rounded border border-zinc-300 px-1 text-xs font-semibold text-zinc-700">Enter</kbd>. O item aparece aqui.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto px-4">
          {itens.map((item) => (
            <li key={item.sku} className="flex items-start gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-zinc-800">{item.nome}</p>
                <p className="text-xs tabular-nums text-zinc-500">{item.qtd} × {moeda(item.precoUsado)}</p>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-zinc-900">{moeda(item.totalItem)}</span>
              <button type="button" aria-label={`Tirar ${item.nome}`} onClick={() => definirQuantidade(item, 0)} className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-zinc-100 p-4">
        {frete.temRegra && <BarraFrete frete={frete} compacta />}
        {frete.temRegra && !frete.gratis && <p className="-mt-1.5 text-[11px] text-zinc-500">Frete grátis a partir de {moeda(frete.minimo)}</p>}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-zinc-700">Total</span>
          <span className="text-xl font-bold tabular-nums text-zinc-900">{moeda(subtotal)}</span>
        </div>
        {itens.length > 0 && (
          <Link href="/b2b-carrinho" className="flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold bg-zinc-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(24,24,27,0.7)] hover:bg-zinc-800">
            Finalizar pedido <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </aside>
  );
}
