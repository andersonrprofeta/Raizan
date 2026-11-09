"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, User, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getHubUrl, getHeaders, getTenantId } from "@/components/utils/api";
import { marcaBonificada } from "@/components/utils/marcaBonificada";

// Mesma superfície de vidro das telas de Pedidos e Resumo
export const VIDRO =
  "rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] bg-white/80 dark:bg-[#121214]/80 " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)]";

export const CAMPO =
  "w-full h-11 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-transparent " +
  "focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/[0.07] text-sm text-zinc-900 dark:text-zinc-100 " +
  "placeholder:text-zinc-400 outline-none transition-all";

export const ROTULO = "block text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5";

export const BOTAO_PRIMARIO =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold text-white " +
  "bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 " +
  "shadow-[0_8px_20px_-8px_rgba(124,58,237,0.7)] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none";

export const BOTAO_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold text-zinc-700 dark:text-zinc-200 " +
  "bg-white/80 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/[0.1] " +
  "shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none";

export const moeda = (valor) =>
  `R$ ${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const moedaCurta = (valor) => {
  const numero = Number(valor || 0);
  if (Math.abs(numero) >= 1000000) return `R$ ${(numero / 1000000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(numero) >= 10000) return `R$ ${(numero / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return moeda(numero);
};

// Máscara de app de banco: cada dígito digitado entra pelos centavos
export const mascaraMoeda = (valor) => {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  if (!digitos) return "";
  return (Number(digitos) / 100).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
};

export const lerMoeda = (texto) => Number(String(texto || "0").replace(/\./g, "").replace(",", ".")) || 0;

export const valorParaMascara = (numero) => mascaraMoeda(Math.round(Number(numero || 0) * 100));

// Marca bonificada não recebe regra de comissão. O começo do nome vem de Parâmetros de sistema.
export async function lerMarcasComissionaveis() {
  const [dataMarcas, dataRegras] = await Promise.all([api("/marcas"), api("/parametros/app")]);
  if (!dataMarcas.success) return null;
  const prefixo = dataRegras.regras?.provadores?.prefixo;
  return (dataMarcas.marcas || []).filter((marca) => !marcaBonificada(marca.nome, prefixo));
}

export async function api(caminho, { metodo = "GET", corpo } = {}) {
  const separador = caminho.includes("?") ? "&" : "?";
  const url = metodo === "GET" ? `${caminho}${separador}tenant_id=${getTenantId()}` : caminho;
  const resposta = await fetch(`${getHubUrl()}/api/hub${url}`, {
    method: metodo,
    headers: getHeaders(),
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  return resposta.json();
}

export function CascaPagina({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
        </div>
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Abas em pílula. Quando não cabem, aparecem setinhas e as bordas somem suavemente.
export function Segmentado({ opcoes, valor, onChange, grande = false }) {
  const trilho = useRef(null);
  const [lados, setLados] = useState({ esquerda: false, direita: false });

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    setLados({ esquerda: el.scrollLeft > 4, direita: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return undefined;
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => { observador.disconnect(); el.removeEventListener("scroll", medir); };
  }, [medir, opcoes.length]);

  // Leva a aba escolhida para dentro da área visível
  useEffect(() => {
    const el = trilho.current;
    const ativo = el?.querySelector("[aria-selected=\"true\"]");
    if (!el || !ativo) return;
    const folga = 44;
    if (ativo.offsetLeft < el.scrollLeft + folga) el.scrollTo({ left: ativo.offsetLeft - folga, behavior: "smooth" });
    else if (ativo.offsetLeft + ativo.offsetWidth > el.scrollLeft + el.clientWidth - folga) el.scrollTo({ left: ativo.offsetLeft + ativo.offsetWidth - el.clientWidth + folga, behavior: "smooth" });
  }, [valor]);

  const rolar = (sentido) => {
    const el = trilho.current;
    if (el) el.scrollBy({ left: sentido * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  const mascara = `linear-gradient(to right, ${lados.esquerda ? "transparent 0, #000 56px" : "#000 0"}, ${lados.direita ? "#000 calc(100% - 56px), transparent 100%" : "#000 100%"})`;
  const seta = "absolute top-1/2 z-10 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl text-zinc-700 dark:text-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] dark:ring-white/10 transition-all duration-300 hover:scale-105 hover:text-purple-600 active:scale-95";
  const tamanhoSeta = grande ? "h-9 w-9" : "h-7 w-7";

  return (
    <div className={`relative max-w-full ${grande ? "flex w-full" : "inline-flex"} items-center rounded-full bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.05]`}>
      <button type="button" aria-label="Ver abas anteriores" tabIndex={lados.esquerda ? 0 : -1} onClick={() => rolar(-1)} className={`${seta} ${tamanhoSeta} left-1.5 ${lados.esquerda ? "opacity-100" : "pointer-events-none opacity-0 scale-75"}`}>
        <ChevronLeft size={grande ? 18 : 16} strokeWidth={2.4} />
      </button>
      <div
        ref={trilho}
        role="tablist"
        style={{ maskImage: mascara, WebkitMaskImage: mascara }}
        className={`flex min-w-0 flex-1 items-center gap-1 p-1 overflow-x-auto scroll-smooth no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {opcoes.map(({ id, rotulo, icone: Icone }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={valor === id}
            onClick={() => onChange(id)}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 ${grande ? "h-11 flex-1 px-5 text-[15px]" : "h-9 px-4 text-sm"} ${
              valor === id
                ? "bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {Icone && <Icone size={grande ? 17 : 15} className={valor === id ? "text-purple-600 dark:text-purple-400" : ""} />}
            {rotulo}
          </button>
        ))}
      </div>
      <button type="button" aria-label="Ver mais abas" tabIndex={lados.direita ? 0 : -1} onClick={() => rolar(1)} className={`${seta} ${tamanhoSeta} right-1.5 ${lados.direita ? "opacity-100" : "pointer-events-none opacity-0 scale-75"}`}>
        <ChevronRight size={grande ? 18 : 16} strokeWidth={2.4} />
      </button>
    </div>
  );
}

const iniciais = (nome) => String(nome || "?").trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();

export function Avatar({ nome, foto, tamanho = 44 }) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.34, borderRadius: tamanho * 0.32 };

  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt={nome} style={estilo} className="object-cover shrink-0 ring-1 ring-black/5 dark:ring-white/10" />;
  }

  return (
    <div style={estilo} className="shrink-0 flex items-center justify-center font-semibold text-white bg-gradient-to-br from-purple-400 to-indigo-600 ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
      {nome ? iniciais(nome) : <User size={tamanho * 0.45} />}
    </div>
  );
}

const ESTADOS_ACESSO = {
  bloqueado: { rotulo: "Bloqueado", ponto: "bg-rose-500", texto: "text-rose-600 dark:text-rose-400" },
  ativo: { rotulo: "No app", ponto: "bg-emerald-500", texto: "text-emerald-700 dark:text-emerald-400" },
  sem_acesso: { rotulo: "Sem acesso", ponto: "bg-zinc-400", texto: "text-zinc-500" }
};

export const estadoDeAcesso = (vendedor) => {
  if (vendedor.status_app === "bloqueado") return "bloqueado";
  return vendedor.tem_senha ? "ativo" : "sem_acesso";
};

export function StatusAcesso({ vendedor }) {
  const { rotulo, ponto, texto } = ESTADOS_ACESSO[estadoDeAcesso(vendedor)];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${texto}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ponto}`} />
      {rotulo}
    </span>
  );
}

export function BarraProgresso({ percentual, altura = 6 }) {
  const batida = percentual >= 100;
  return (
    <div style={{ height: altura }} className="w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
      <div
        style={{ width: `${Math.min(Math.max(percentual, 0), 100)}%` }}
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${batida ? "bg-emerald-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"}`}
      />
    </div>
  );
}

export function Kpi({ rotulo, valor, detalhe, tom = "", children }) {
  return (
    <div className={`${VIDRO} p-5 min-w-0`}>
      <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 truncate">{rotulo}</p>
      <p className={`mt-2 text-xl sm:text-[26px] leading-none font-semibold tracking-tight tabular-nums truncate ${tom || "text-zinc-900 dark:text-white"}`}>{valor}</p>
      {detalhe && <p className="mt-2.5 text-xs text-zinc-500">{detalhe}</p>}
      {children}
    </div>
  );
}

export function Carregando({ texto = "Carregando..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-400">
      <RefreshCw size={22} className="animate-spin" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

export function EstadoVazio({ icone: Icone, titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center text-center py-20 px-6">
      <div className="w-14 h-14 rounded-[18px] bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-zinc-400 mb-4">
        <Icone size={24} />
      </div>
      <h3 className="font-semibold tracking-tight text-zinc-900 dark:text-white">{titulo}</h3>
      {texto && <p className="text-sm text-zinc-500 mt-1 max-w-sm">{texto}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Modal({ titulo, descricao, onFechar, children, rodape, largura = "max-w-md" }) {
  useEffect(() => {
    const aoApertar = (evento) => { if (evento.key === "Escape") onFechar(); };
    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-150" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`w-full ${largura} max-h-[90vh] flex flex-col overflow-hidden rounded-[28px] bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-150`}>
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{titulo}</h2>
            {descricao && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{descricao}</p>}
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 pb-2 overflow-y-auto custom-scrollbar">{children}</div>
        {rodape && <div className="flex gap-3 p-6 pt-4">{rodape}</div>}
      </div>
    </div>
  );
}
