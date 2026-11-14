"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FileCheck2, Globe, PackageCheck, ShoppingBag, Smartphone, Store, Truck
} from "lucide-react";

// Exemplos do que acontece no dia a dia de quem usa o Raizan Core (ilustração, não são dados reais)
const ACONTECIMENTOS = [
  { modulo: "ERP", icone: FileCheck2, cor: "from-violet-500 to-purple-600", titulo: "Pedido 4821 faturado", detalhe: "NF-e autorizada pela SEFAZ" },
  { modulo: "Portal B2B", icone: Store, cor: "from-indigo-500 to-blue-600", titulo: "Novo pedido no portal", detalhe: "Lojista repôs 38 itens" },
  { modulo: "Logística", icone: Truck, cor: "from-amber-400 to-orange-500", titulo: "Romaneio 118 saiu", detalhe: "12 entregas na rota Centro" },
  { modulo: "Loja virtual", icone: ShoppingBag, cor: "from-pink-500 to-rose-500", titulo: "Venda aprovada na loja", detalhe: "Pagamento confirmado no Pix" },
  { modulo: "Compras", icone: PackageCheck, cor: "from-emerald-400 to-teal-500", titulo: "Mercadoria recebida", detalhe: "Entrada conferida no estoque" },
  { modulo: "App de vendas", icone: Smartphone, cor: "from-sky-400 to-cyan-500", titulo: "Pedido enviado pelo app", detalhe: "Vendedor em visita ao cliente" },
  { modulo: "Sites", icone: Globe, cor: "from-fuchsia-500 to-purple-500", titulo: "Contato novo pelo site", detalhe: "Pedido de orçamento recebido" }
];

export const MODULOS = ["ERP", "Loja virtual", "Portal B2B", "Compras", "Logística", "Sites", "App de vendas"];

const INTERVALO = 2600;

function useAcontecimentoAtual() {
  const parado = useReducedMotion();
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    if (parado) return undefined;
    const relogio = setInterval(() => setIndice((atual) => atual + 1), INTERVALO);
    return () => clearInterval(relogio);
  }, [parado]);
  return indice;
}

// Fundo: luzes que se movem devagar, grade suave e um brilho que acompanha o mouse
export function FundoVivo({ claro = false }) {
  const parado = useReducedMotion();
  const luz = useRef(null);

  useEffect(() => {
    if (parado) return undefined;
    const mover = (evento) => {
      if (!luz.current) return;
      luz.current.style.setProperty("--x", `${evento.clientX}px`);
      luz.current.style.setProperty("--y", `${evento.clientY}px`);
      luz.current.style.opacity = "1";
    };
    window.addEventListener("pointermove", mover);
    return () => window.removeEventListener("pointermove", mover);
  }, [parado]);

  const flutuar = (x, y, duracao) => (parado ? {} : {
    animate: { x: [0, x, -x * 0.6, 0], y: [0, y, y * 0.4, 0], scale: [1, 1.12, 0.94, 1] },
    transition: { duration: duracao, repeat: Infinity, ease: "easeInOut" }
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div {...flutuar(120, 80, 22)} className={`absolute -top-56 left-[6%] h-[680px] w-[680px] rounded-full blur-[130px] ${claro ? "bg-purple-400/30" : "bg-purple-600/25"}`} />
      <motion.div {...flutuar(-100, 120, 26)} className={`absolute top-[30%] -right-40 h-[560px] w-[560px] rounded-full blur-[130px] ${claro ? "bg-indigo-400/25" : "bg-indigo-600/20"}`} />
      <motion.div {...flutuar(80, -90, 30)} className={`absolute -bottom-64 left-[35%] h-[520px] w-[520px] rounded-full blur-[140px] ${claro ? "bg-fuchsia-300/25" : "bg-fuchsia-600/15"}`} />

      <div
        className={`absolute inset-0 ${claro ? "opacity-[0.5]" : "opacity-[0.35]"}`}
        style={{
          backgroundImage: `linear-gradient(to right, ${claro ? "rgba(24,24,27,0.06)" : "rgba(255,255,255,0.06)"} 1px, transparent 1px), linear-gradient(to bottom, ${claro ? "rgba(24,24,27,0.06)" : "rgba(255,255,255,0.06)"} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)"
        }}
      />

      <div
        ref={luz}
        className="absolute inset-0 opacity-0 transition-opacity duration-700"
        style={{ background: `radial-gradient(520px circle at var(--x, 50%) var(--y, 50%), ${claro ? "rgba(147,51,234,0.10)" : "rgba(168,85,247,0.12)"}, transparent 60%)` }}
      />
    </div>
  );
}

function CartaoDoAcontecimento({ item, destaque }) {
  const Icone = item.icone;
  return (
    <div className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3 backdrop-blur-xl transition-colors ${
      destaque
        ? "border-black/[0.06] bg-white/90 shadow-[0_18px_40px_-20px_rgba(76,29,149,0.45)] dark:border-white/[0.1] dark:bg-white/[0.08] dark:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]"
        : "border-black/[0.04] bg-white/60 dark:border-white/[0.05] dark:bg-white/[0.035]"
    }`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br ${item.cor} text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)]`}>
        <Icone size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-zinc-900 dark:text-white">{item.titulo}</p>
        <p className="truncate text-[12.5px] text-zinc-500 dark:text-zinc-400">{item.detalhe}</p>
      </div>
      <span className="shrink-0 text-[11px] font-medium text-zinc-400">{destaque ? "agora" : item.modulo}</span>
    </div>
  );
}

// Lado esquerdo do login do painel: o ecossistema "acontecendo" na frente da pessoa
export function VitrineViva() {
  const indice = useAcontecimentoAtual();
  const visiveis = [0, 1, 2].map((passo) => {
    const posicao = (((indice - passo) % ACONTECIMENTOS.length) + ACONTECIMENTOS.length) % ACONTECIMENTOS.length;
    return { chave: indice - passo, item: ACONTECIMENTOS[posicao], passo };
  });
  const moduloAtivo = visiveis[0].item.modulo;

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <h1 className="text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] text-zinc-900 dark:text-white xl:text-[52px] [@media(max-height:820px)]:!text-[38px]">
          Toda a sua operação.
          <span className="texto-vivo block pb-1">Num só lugar.</span>
        </h1>
        <p className="mt-5 max-w-[440px] text-[17px] leading-relaxed text-zinc-500 dark:text-zinc-400 [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:text-[15px] [@media(max-height:700px)]:hidden">
          ERP, loja virtual, portal B2B, compras, logística, sites e app de vendas trabalhando juntos, com os mesmos dados e em tempo real.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mt-9 max-w-[440px] [@media(max-height:820px)]:mt-6"
      >
        <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Acontecendo agora no Raizan Core
        </div>

        <div className="relative h-[214px] [@media(max-height:740px)]:h-[136px] [@media(max-height:740px)]:overflow-hidden">
          <AnimatePresence initial={false}>
            {visiveis.map(({ chave, item, passo }) => (
              <motion.div
                key={chave}
                layout
                initial={{ opacity: 0, y: -28, scale: 0.96 }}
                animate={{ opacity: 1 - passo * 0.28, y: passo * 72, scale: 1 - passo * 0.035 }}
                exit={{ opacity: 0, y: 3 * 72, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="absolute inset-x-0 top-0"
                style={{ zIndex: 10 - passo }}
              >
                <CartaoDoAcontecimento item={item} destaque={passo === 0} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <ul className="mt-7 flex max-w-[460px] flex-wrap gap-2 [@media(max-height:820px)]:mt-4" aria-label="O que o Raizan Core reúne">
        {MODULOS.map((modulo, posicao) => {
          const ativo = modulo === moduloAtivo;
          return (
            <motion.li
              key={modulo}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + posicao * 0.06, duration: 0.5 }}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium backdrop-blur transition-all duration-500 ${
                ativo
                  ? "border-purple-500/40 bg-purple-500/15 text-purple-700 shadow-[0_0_24px_-6px_rgba(168,85,247,0.7)] dark:text-purple-200"
                  : "border-black/[0.06] bg-white/70 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300"
              }`}
            >
              {modulo}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

// No celular, uma linha que troca sozinha mostra o ecossistema sem empurrar o formulário para baixo
export function LetreiroVivo() {
  const indice = useAcontecimentoAtual();
  const item = ACONTECIMENTOS[indice % ACONTECIMENTOS.length];
  const Icone = item.icone;
  return (
    <div className="relative h-9 w-full max-w-[420px] overflow-hidden" aria-hidden="true">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={indice}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400"
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${item.cor} text-white`}><Icone size={13} /></span>
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{item.modulo}</span>
          <span className="truncate">· {item.titulo}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

