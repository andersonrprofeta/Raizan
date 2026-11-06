"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DESLOCAMENTO = 280;

const BotaoSeta = ({ direcao, rotulo, onClick, Icone }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={rotulo}
    className={`absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-600 shadow-[0_1px_3px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition-colors hover:text-purple-600 dark:bg-[#26262b] dark:text-zinc-200 dark:ring-white/10 dark:hover:text-purple-300 ${direcao === "esquerda" ? "left-1" : "right-1"}`}
  >
    <Icone size={16} />
  </button>
);

// Mesmo visual das guias do sistema. Com muitas marcas, a lista desliza pelas setas, sem barra de rolagem.
export default function FiltroMarcas({ marcas, selecionada, onChange }) {
  const lista = useRef(null);
  const [setas, setSetas] = useState({ esquerda: false, direita: false });

  const conferirSetas = useCallback(() => {
    const elemento = lista.current;
    if (!elemento) return;
    setSetas({
      esquerda: elemento.scrollLeft > 4,
      direita: elemento.scrollLeft + elemento.clientWidth < elemento.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    conferirSetas();
    window.addEventListener("resize", conferirSetas);
    return () => window.removeEventListener("resize", conferirSetas);
  }, [marcas, conferirSetas]);

  useEffect(() => {
    lista.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selecionada]);

  const deslizar = (sentido) => lista.current?.scrollBy({ left: sentido * DESLOCAMENTO, behavior: "smooth" });

  const opcoes = [{ id: "", rotulo: "Todas" }, ...marcas.map((marca) => ({ id: marca, rotulo: marca }))];

  return (
    <div className="relative mt-5 rounded-full border border-black/[0.04] bg-black/[0.05] p-1 dark:border-white/[0.05] dark:bg-white/[0.06]">
      {setas.esquerda && <BotaoSeta direcao="esquerda" rotulo="Ver marcas anteriores" onClick={() => deslizar(-1)} Icone={ChevronLeft} />}

      <div
        ref={lista}
        onScroll={conferirSetas}
        role="group"
        aria-label="Filtrar por marca"
        className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {opcoes.map(({ id, rotulo }) => {
          const ativa = selecionada === id;
          return (
            <button
              key={rotulo}
              type="button"
              aria-pressed={ativa}
              onClick={() => onChange(id)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all active:scale-95 ${
                ativa
                  ? "bg-white text-purple-700 shadow-[0_1px_3px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:bg-white/[0.12] dark:text-white dark:ring-white/10"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {rotulo}
            </button>
          );
        })}
      </div>

      {setas.direita && <BotaoSeta direcao="direita" rotulo="Ver mais marcas" onClick={() => deslizar(1)} Icone={ChevronRight} />}
    </div>
  );
}
