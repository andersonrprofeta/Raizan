"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Minus, Plus, X } from "lucide-react";

const FOTO_AUSENTE = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f4f4f5"/><text x="50" y="54" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#a1a1aa">Sem foto</text></svg>');

// Identidade Raizan: vidro, cantos generosos, botões escuros com brilho de borda e o violeta só como destaque.
// As classes ficam inteiras aqui para o Tailwind enxergá-las.
export const ESTILO = {
  vidro: "bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.22)]",
  cta: "bg-zinc-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(24,24,27,0.7)] hover:bg-zinc-800",
  tile: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-8px_rgba(109,40,217,0.7)]",
  iconeRedondo: "relative flex h-11 shrink-0 items-center justify-center rounded-full border border-black/[0.04] bg-black/[0.04] text-zinc-700 transition-all hover:bg-black/[0.07] active:scale-95",
  cartao: "rounded-[22px] border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
};

const TIPO_DA_EMPRESA = /[\s-]+(ltda|me|mei|epp|eireli|s\.?a\.?)\.?\s*$/i;
// "12.345.678 LOJA DE TESTE COSMETICOS LTDA" vira "Loja De Teste"
export function nomeCurto(nome = "", palavras = 3) {
  const limpo = String(nome).replace(/^[\d.\-/\s]+/, "").replace(TIPO_DA_EMPRESA, "").trim().toLowerCase();
  return limpo.split(/\s+/).slice(0, palavras).map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1)).join(" ");
}

export function iniciais(nome = "") {
  const partes = nomeCurto(nome, 2).split(" ").filter(Boolean);
  return (partes.map((parte) => parte[0]).join("") || "R").toUpperCase();
}

export const moeda = (valor) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dataCurta = (valor) => (valor ? new Date(valor).toLocaleDateString("pt-BR") : "");

export function fotosDoProduto(produto) {
  let fotos = produto?.imagens_anexos;
  if (typeof fotos === "string") {
    try { fotos = JSON.parse(fotos); } catch (erro) { fotos = []; }
  }
  return Array.isArray(fotos) ? fotos.filter(Boolean) : [];
}

export function Foto({ produto, src, className = "" }) {
  return (
    <img
      src={src || fotosDoProduto(produto)[0] || FOTO_AUSENTE}
      alt=""
      loading="lazy"
      onError={(evento) => { evento.target.onerror = null; evento.target.src = FOTO_AUSENTE; }}
      className={`object-contain ${className}`}
    />
  );
}

const VARIANTES = {
  primario: ESTILO.cta,
  secundario: "border border-black/10 bg-white text-zinc-800 hover:bg-zinc-50",
  suave: "bg-violet-50 text-violet-700 hover:bg-violet-100",
};

export function Botao({ variante = "primario", carregando, children, className = "", ...resto }) {
  return (
    <button
      type="button"
      {...resto}
      disabled={resto.disabled || carregando}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
    >
      {carregando && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}

const TONS = {
  alerta: "bg-amber-50 text-amber-800",
  info: "bg-violet-50 text-violet-700",
  ok: "bg-emerald-50 text-emerald-700",
  neutro: "bg-zinc-100 text-zinc-600",
};

export function Etiqueta({ tom = "neutro", children }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONS[tom]}`}>{children}</span>;
}

export const Cartao = ({ className = "", children }) => <section className={`${ESTILO.cartao} ${className}`}>{children}</section>;

export function Vazio({ Icone, titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400"><Icone size={26} /></div>
      <h2 className="text-lg font-bold text-zinc-900">{titulo}</h2>
      {texto && <p className="mt-1 max-w-sm text-sm text-zinc-500">{texto}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export const Esqueleto = ({ className = "" }) => <div className={`animate-pulse rounded-xl bg-zinc-200/70 ${className}`} />;

export function Quantidade({ qtd, onChange, rotulo, compacto }) {
  const [texto, setTexto] = useState(String(qtd));
  useEffect(() => setTexto(String(qtd)), [qtd]);

  const confirmar = () => {
    const numero = parseInt(texto, 10);
    if (numero === qtd) return;
    if (Number.isFinite(numero)) onChange(numero);
    else setTexto(String(qtd));
  };

  const altura = compacto ? "h-10" : "h-12";
  return (
    <div className={`flex ${altura} items-center overflow-hidden rounded-xl border border-zinc-300 bg-white`}>
      <button type="button" aria-label={`Diminuir ${rotulo}`} onClick={() => onChange(qtd - 1)} className={`flex ${altura} w-10 shrink-0 items-center justify-center text-zinc-600 hover:bg-zinc-100`}><Minus size={16} /></button>
      <input
        value={texto}
        inputMode="numeric"
        aria-label={`Quantidade de ${rotulo}`}
        onFocus={(evento) => evento.target.select()}
        onChange={(evento) => setTexto(evento.target.value.replace(/\D/g, ""))}
        onBlur={confirmar}
        onKeyDown={(evento) => { if (evento.key === "Enter") evento.target.blur(); }}
        className="h-full w-full min-w-8 bg-transparent text-center text-base font-semibold tabular-nums text-zinc-900 outline-none"
      />
      <button type="button" aria-label={`Aumentar ${rotulo}`} onClick={() => onChange(qtd + 1)} className={`flex ${altura} w-10 shrink-0 items-center justify-center text-zinc-600 hover:bg-zinc-100`}><Plus size={16} /></button>
    </div>
  );
}

// No celular sobe da base da tela; no computador abre no centro
export function Folha({ aberta, onFechar, titulo, children, rodape, larga }) {
  useEffect(() => {
    if (!aberta) return undefined;
    const fecharComEsc = (evento) => { if (evento.key === "Escape") onFechar(); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", fecharComEsc);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [aberta, onFechar]);

  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-6" onClick={onFechar}>
      <div role="dialog" aria-modal="true" aria-label={titulo} onClick={(evento) => evento.stopPropagation()} className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white md:rounded-3xl ${larga ? "md:max-w-3xl" : "md:max-w-lg"}`}>
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
          <h2 className="min-w-0 truncate text-base font-bold text-zinc-900">{titulo}</h2>
          <button type="button" aria-label="Fechar" onClick={onFechar} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"><X size={20} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {rodape && <div className="border-t border-zinc-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{rodape}</div>}
      </div>
    </div>
  );
}

export function Opcao({ selecionada, onClick, Icone, titulo, texto }) {
  return (
    <button type="button" role="radio" aria-checked={selecionada} onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${selecionada ? "border-violet-500 bg-violet-50/50 ring-1 ring-violet-500" : "border-black/10 hover:border-black/20"}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selecionada ? ESTILO.tile : "bg-zinc-100 text-zinc-500"}`}><Icone size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-zinc-900">{titulo}</span>
        {texto && <span className="mt-0.5 block text-[13px] text-zinc-500">{texto}</span>}
      </span>
      {selecionada && <Check size={18} className="shrink-0 text-violet-600" />}
    </button>
  );
}
