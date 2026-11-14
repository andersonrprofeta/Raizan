"use client";

import { FileCheck2, ShoppingBag, Store, Truck } from "lucide-react";

// Visual parado de propósito: as animações pesavam (luzes desfocadas em movimento travavam em alguns computadores).
// Os cartões são exemplos do dia a dia de quem usa o Raizan Core (ilustração, não são dados reais).
const ACONTECIMENTOS = [
  { modulo: "ERP", icone: FileCheck2, cor: "from-violet-500 to-purple-600", titulo: "Pedido 4821 faturado", detalhe: "NF-e autorizada pela SEFAZ", quando: "agora" },
  { modulo: "Portal B2B", icone: Store, cor: "from-indigo-500 to-blue-600", titulo: "Novo pedido no portal", detalhe: "Lojista repôs 38 itens", quando: "2 min" },
  { modulo: "Logística", icone: Truck, cor: "from-amber-400 to-orange-500", titulo: "Romaneio 118 saiu", detalhe: "12 entregas na rota Centro", quando: "5 min" }
];

const DESTAQUE_NO_CELULAR = { modulo: "Loja virtual", icone: ShoppingBag, cor: "from-pink-500 to-rose-500", titulo: "Venda aprovada na loja" };

export const MODULOS = ["ERP", "Loja virtual", "Portal B2B", "Compras", "Logística", "Sites", "App de vendas"];

// Fundo: luzes desfocadas e grade suave, sem nada se mexendo
export function FundoVivo({ claro = false }) {
  const linha = claro ? "rgba(24,24,27,0.06)" : "rgba(255,255,255,0.06)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute -top-56 left-[6%] h-[680px] w-[680px] rounded-full blur-[130px] ${claro ? "bg-purple-400/30" : "bg-purple-600/25"}`} />
      <div className={`absolute top-[30%] -right-40 h-[560px] w-[560px] rounded-full blur-[130px] ${claro ? "bg-indigo-400/25" : "bg-indigo-600/20"}`} />
      <div className={`absolute -bottom-64 left-[35%] h-[520px] w-[520px] rounded-full blur-[140px] ${claro ? "bg-fuchsia-300/25" : "bg-fuchsia-600/15"}`} />
      <div
        className={`absolute inset-0 ${claro ? "opacity-[0.5]" : "opacity-[0.35]"}`}
        style={{
          backgroundImage: `linear-gradient(to right, ${linha} 1px, transparent 1px), linear-gradient(to bottom, ${linha} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)"
        }}
      />
    </div>
  );
}

function CartaoDoAcontecimento({ item }) {
  const Icone = item.icone;
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-black/[0.06] bg-white/80 px-4 py-3 shadow-[0_10px_30px_-18px_rgba(76,29,149,0.35)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:shadow-[0_14px_34px_-20px_rgba(0,0,0,0.9)]">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br ${item.cor} text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)]`}>
        <Icone size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-zinc-900 dark:text-white">{item.titulo}</p>
        <p className="truncate text-[12.5px] text-zinc-500 dark:text-zinc-400">{item.detalhe}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-purple-700 dark:bg-purple-400/10 dark:text-purple-300">{item.modulo}</span>
        <span className="text-[11px] text-zinc-400">{item.quando}</span>
      </div>
    </div>
  );
}

// Lado esquerdo do login do painel: o ecossistema em cartões
export function VitrineViva() {
  const moduloAtivo = ACONTECIMENTOS[0].modulo;

  return (
    <div className="w-full">
      <h1 className="text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] text-zinc-900 dark:text-white xl:text-[52px] [@media(max-height:820px)]:!text-[38px]">
        Toda a sua operação.
        <span className="texto-vivo block pb-1">Num só lugar.</span>
      </h1>
      <p className="mt-5 max-w-[440px] text-[17px] leading-relaxed text-zinc-500 dark:text-zinc-400 [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:text-[15px] [@media(max-height:700px)]:hidden">
        ERP, loja virtual, portal B2B, compras, logística, sites e app de vendas trabalhando juntos, com os mesmos dados e em tempo real.
      </p>

      <div className="mt-9 max-w-[440px] [@media(max-height:820px)]:mt-6">
        <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          Acontecendo agora no Raizan Core
        </div>

        <div className="flex flex-col gap-2">
          {ACONTECIMENTOS.map((item, passo) => (
            <div key={item.titulo} className={passo === 2 ? "[@media(max-height:740px)]:hidden" : ""}>
              <CartaoDoAcontecimento item={item} />
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-7 flex max-w-[460px] flex-wrap gap-2 [@media(max-height:820px)]:mt-4" aria-label="O que o Raizan Core reúne">
        {MODULOS.map((modulo) => (
          <li
            key={modulo}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${
              modulo === moduloAtivo
                ? "border-purple-500/40 bg-purple-500/15 text-purple-700 shadow-[0_0_24px_-6px_rgba(168,85,247,0.7)] dark:text-purple-200"
                : "border-black/[0.06] bg-white/70 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300"
            }`}
          >
            {modulo}
          </li>
        ))}
      </ul>
    </div>
  );
}

// No celular, uma linha resume o ecossistema sem empurrar o formulário para baixo
export function LetreiroVivo() {
  const Icone = DESTAQUE_NO_CELULAR.icone;
  return (
    <div className="flex h-9 w-full max-w-[420px] items-center justify-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400" aria-hidden="true">
      <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${DESTAQUE_NO_CELULAR.cor} text-white`}><Icone size={13} /></span>
      <span className="font-medium text-zinc-700 dark:text-zinc-200">{DESTAQUE_NO_CELULAR.modulo}</span>
      <span className="truncate">· {DESTAQUE_NO_CELULAR.titulo}</span>
    </div>
  );
}
