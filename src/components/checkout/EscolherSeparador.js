"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { VIDRO } from "@/components/checkout/estilos";

const CHAVE_RECENTES = "@raizan:separadores_recentes";
const LIMITE_RECENTES = 5;
const MINIMO_PARA_OUTRA_PESSOA = 3;

const semAcento = (texto) => String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const lerRecentes = () => {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_RECENTES) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
};

// Quem bipa informa quem separou. Quem bipa não precisa ser informado: a API usa a sessão logada.
// O Enter só escolhe alguém da lista: o leitor manda Enter sozinho, e um código bipado aqui não pode virar nome.
export default function EscolherSeparador({ equipe, aoEscolher }) {
  const [busca, setBusca] = useState("");
  const [indice, setIndice] = useState(0);
  const [recentes] = useState(lerRecentes);
  const listaRef = useRef(null);
  const buscaRef = useRef(null);

  // O campo do leitor, atrás desta janela, também pede o foco ao abrir a tela
  useEffect(() => { buscaRef.current?.focus(); }, []);

  const encontrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    const posicao = (pessoa) => {
      const lugar = recentes.indexOf(pessoa.id);
      return lugar === -1 ? recentes.length : lugar;
    };
    return equipe
      .filter((pessoa) => semAcento(`${pessoa.nome} ${pessoa.cargo || ""}`).includes(termo))
      .sort((a, b) => posicao(a) - posicao(b));
  }, [equipe, busca, recentes]);

  const escolher = (pessoa) => {
    if (pessoa.id) {
      const novos = [pessoa.id, ...recentes.filter((id) => id !== pessoa.id)].slice(0, LIMITE_RECENTES);
      localStorage.setItem(CHAVE_RECENTES, JSON.stringify(novos));
    }
    aoEscolher({ id: pessoa.id, nome: pessoa.nome });
  };

  const moverDestaque = (passo) => {
    const novo = Math.max(0, Math.min(encontrados.length - 1, indice + passo));
    setIndice(novo);
    listaRef.current?.children[novo]?.scrollIntoView({ block: "nearest" });
  };

  const aoTeclar = (evento) => {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      moverDestaque(evento.key === "ArrowDown" ? 1 : -1);
    }
    if (evento.key === "Enter") {
      evento.preventDefault();
      if (encontrados[indice]) escolher(encontrados[indice]);
    }
  };

  const nomeDigitado = busca.trim();
  const podeUsarOutroNome = /[a-zA-ZÀ-ÿ]{3}/.test(nomeDigitado) && nomeDigitado.length >= MINIMO_PARA_OUTRA_PESSOA
    && !encontrados.some((pessoa) => semAcento(pessoa.nome) === semAcento(nomeDigitado));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md">
      <div role="dialog" aria-modal="true" aria-label="Quem separou este pedido" className={`${VIDRO} !bg-white/95 dark:!bg-[#121214]/95 w-full max-w-md p-6`}>
        <h2 className="text-[22px] leading-tight font-bold tracking-tight">Quem separou este pedido?</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Fica registrado no histórico da conferência.</p>

        <div className="mt-4 flex items-center gap-2.5 h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] focus-within:ring-2 focus-within:ring-purple-500/40">
          <Search size={17} className="shrink-0 text-zinc-400" aria-hidden />
          <input
            ref={buscaRef}
            aria-label="Buscar quem separou"
            placeholder="Digite o nome"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setIndice(0); }}
            onKeyDown={aoTeclar}
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-zinc-400"
          />
        </div>

        <ul ref={listaRef} className="mt-3 h-[236px] space-y-1 overflow-y-auto custom-scrollbar">
          {encontrados.map((pessoa, posicao) => {
            const destaque = posicao === indice;
            return (
              <li key={pessoa.id}>
                <button
                  type="button"
                  onClick={() => escolher(pessoa)}
                  onMouseEnter={() => setIndice(posicao)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${destaque ? "bg-purple-500/10" : ""}`}
                >
                  <UserRound size={16} className="shrink-0 text-zinc-400" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{pessoa.nome}</span>
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{pessoa.cargo || (recentes.includes(pessoa.id) ? "Recente" : "")}</span>
                </button>
              </li>
            );
          })}
          {encontrados.length === 0 && <li className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Ninguém encontrado com esse nome.</li>}
        </ul>

        {podeUsarOutroNome && (
          <button type="button" onClick={() => escolher({ id: null, nome: nomeDigitado })} className="mt-3 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] px-3 py-2.5 text-sm font-semibold truncate hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
            Registrar “{nomeDigitado}” sem cadastro
          </button>
        )}
      </div>
    </div>
  );
}
