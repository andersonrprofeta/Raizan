"use client";

import { Car, Gem, HeartPulse, Shirt, ShoppingBasket, Smartphone, Sparkles, UtensilsCrossed } from "lucide-react";
import { VIDRO } from "@/components/vendedores/ui";

// Biblioteca de temas por nicho. Por enquanto é só a vitrine dos temas: aplicar na loja vem depois.
const TEMAS = [
  { id: "beleza", nome: "Beleza", texto: "Rosa suave, fotos grandes e selos delicados.", icone: Sparkles, cor: "#db2777", fundo: "#fdf2f8", menu: "#831843" },
  { id: "saude", nome: "Saúde", texto: "Verde de confiança, leitura clara e selos de cuidado.", icone: HeartPulse, cor: "#059669", fundo: "#ecfdf5", menu: "#064e3b" },
  { id: "eletronicos", nome: "Eletrônicos", texto: "Escuro, contraste alto e preço em destaque.", icone: Smartphone, cor: "#2563eb", fundo: "#eff6ff", menu: "#0f172a" },
  { id: "joalheria", nome: "Joalheria", texto: "Preto e dourado, muito espaço e tipografia fina.", icone: Gem, cor: "#b45309", fundo: "#fffbeb", menu: "#1c1917" },
  { id: "automoveis", nome: "Automóveis", texto: "Peças por categoria, busca forte e tons de grafite.", icone: Car, cor: "#dc2626", fundo: "#f4f4f5", menu: "#27272a" },
  { id: "moda", nome: "Moda", texto: "Editorial, banners de coleção e vitrine em grade.", icone: Shirt, cor: "#111111", fundo: "#fafafa", menu: "#111111" },
  { id: "mercado", nome: "Supermercado", texto: "Departamentos à vista, ofertas do dia e carrinho rápido.", icone: ShoppingBasket, cor: "#16a34a", fundo: "#f0fdf4", menu: "#14532d" },
  { id: "food", nome: "Food", texto: "Cardápio em fotos, pedido rápido e cores quentes.", icone: UtensilsCrossed, cor: "#ea580c", fundo: "#fff7ed", menu: "#7c2d12" },
];

function Miniatura({ tema }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-black/[0.06]" style={{ background: tema.fundo }} aria-hidden="true">
      <div className="h-2" style={{ background: tema.menu }} />
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: `color-mix(in srgb, ${tema.cor} 85%, transparent)` }}>
        <span className="h-2 w-8 rounded-full bg-white/90" />
        <span className="h-2 flex-1 rounded-full bg-white/40" />
        <span className="h-3 w-3 rounded-full bg-white/80" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg bg-white p-1.5 shadow-sm">
            <div className="aspect-square rounded-md" style={{ background: `color-mix(in srgb, ${tema.cor} ${12 + i * 6}%, white)` }} />
            <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-zinc-200" />
            <div className="mt-1 h-1.5 w-1/2 rounded-full" style={{ background: tema.cor }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Temas() {
  return (
    <div className="space-y-5 text-zinc-900 dark:text-zinc-100">
      <section className={`${VIDRO} p-5 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight">Temas prontos por nicho</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Cores, cabeçalho, selos e vitrine pensados para cada tipo de loja. Escolha um e ajuste o que quiser nas outras abas.</p>
          </div>
          <span className="inline-flex h-8 shrink-0 items-center self-start rounded-full bg-purple-500/10 px-3 text-xs font-semibold text-purple-700 dark:text-purple-300">Em breve</span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TEMAS.map((tema) => {
          const Icone = tema.icone;
          return (
            <article key={tema.id} className={`${VIDRO} flex flex-col p-4`}>
              <Miniatura tema={tema} />
              <div className="mt-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: tema.cor }}><Icone size={17} /></span>
                <h3 className="text-[15px] font-semibold">{tema.nome}</h3>
              </div>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{tema.texto}</p>
              <button type="button" disabled className="mt-4 h-10 rounded-full bg-black/[0.05] text-sm font-semibold text-zinc-500 dark:bg-white/[0.06]">Em breve</button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
