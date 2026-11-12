"use client";

// Peças visuais da Central Logística. Os nomes de status são os mesmos que a API grava.
// Especificação do dono: src/components/transportadora/page.js (comentário).

export const BOTAO =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold text-white whitespace-nowrap " +
  "bg-gradient-to-b from-purple-500 to-purple-700 hover:brightness-110 shadow-[0_10px_24px_-10px_rgba(124,58,237,0.75)] " +
  "transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none";

const CINZA = { ponto: "bg-zinc-400", texto: "text-zinc-600 dark:text-zinc-300", fundo: "bg-zinc-500/10" };
const AMBAR = { ponto: "bg-amber-500", texto: "text-amber-700 dark:text-amber-400", fundo: "bg-amber-500/10" };
const AZUL = { ponto: "bg-sky-500", texto: "text-sky-700 dark:text-sky-400", fundo: "bg-sky-500/10" };
const ROXO = { ponto: "bg-purple-500", texto: "text-purple-700 dark:text-purple-300", fundo: "bg-purple-500/10" };
const INDIGO = { ponto: "bg-indigo-500", texto: "text-indigo-700 dark:text-indigo-300", fundo: "bg-indigo-500/10" };
const VERDE = { ponto: "bg-emerald-500", texto: "text-emerald-700 dark:text-emerald-400", fundo: "bg-emerald-500/10" };
const VERMELHO = { ponto: "bg-rose-500", texto: "text-rose-700 dark:text-rose-400", fundo: "bg-rose-500/10" };
const APAGADO = { ponto: "bg-zinc-300 dark:bg-zinc-600", texto: "text-zinc-400", fundo: "bg-zinc-500/5" };

export const RASTREIO = {
  aguardando_coleta: { rotulo: "Aguardando coleta", ...AMBAR },
  coletado: { rotulo: "Coletado", ...ROXO },
  em_transferencia: { rotulo: "Em transferência", ...INDIGO },
  em_rota: { rotulo: "Em rota", ...AZUL },
  saiu_para_entrega: { rotulo: "Saiu para entrega", ...AZUL },
  entregue: { rotulo: "Entregue", ...VERDE },
  ocorrencia: { rotulo: "Ocorrência", ...VERMELHO },
  devolvido: { rotulo: "Devolvido", ...APAGADO },
};

// Ordem da linha do tempo (ocorrência e devolução ficam fora do trilho)
export const TRILHO = ["aguardando_coleta", "coletado", "em_transferencia", "em_rota", "saiu_para_entrega", "entregue"];

export const ROMANEIO = {
  aberto: { rotulo: "Em montagem", ...AMBAR },
  gerado: { rotulo: "Gerado", ...ROXO },
  cancelado: { rotulo: "Cancelado", ...APAGADO },
};

export const SITUACAO = {
  ativa: { rotulo: "Ativa", ...VERDE },
  bloqueada: { rotulo: "Bloqueada", ...VERMELHO },
  inativa: { rotulo: "Inativa", ...APAGADO },
};

export const MODAIS = {
  rodoviario: "Rodoviário",
  aereo: "Aéreo",
  correios: "Correios",
  frota_propria: "Frota própria",
  motoboy: "Motoboy",
  outro: "Outro",
};

export const CLASSIFICACOES = {
  preferencial: "Preferencial",
  homologada: "Homologada",
  em_avaliacao: "Em avaliação",
  contingencia: "Contingência",
};

export function Selo({ mapa, valor }) {
  const s = mapa[valor] || { rotulo: valor, ...CINZA };
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold whitespace-nowrap ${s.fundo} ${s.texto}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.ponto}`} />
      {s.rotulo}
    </span>
  );
}

// A API devolve hora como "2026-11-09 09:22:28", já na hora de Brasília
export const diaCurto = (valor) => {
  const [ano, mes, dia] = String(valor || "").slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${ano}` : "";
};
export const diaEHora = (valor) => (valor ? `${diaCurto(valor)} ${String(valor).slice(11, 16)}` : "");
export const peso = (valor) => (valor === null || valor === undefined ? "—" : `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`);
export const numeroNfe = (e) => (e.nfe_numero ? `${e.nfe_numero}${e.nfe_serie ? `-${e.nfe_serie}` : ""}` : "");
export const nomeDaTransportadora = (t) => t?.nome_fantasia || t?.razao_social || "";

export function formatarCnpj(valor) {
  const n = String(valor || "").replace(/\D/g, "");
  if (n.length === 14) return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (n.length === 11) return n.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return valor || "";
}

// Em atraso: em trânsito com a previsão vencida
export const emAtraso = (e, agora = new Date()) => {
  if (!e.previsao_entrega || ["entregue", "devolvido", "aguardando_coleta"].includes(e.status_rastreio)) return false;
  return new Date(e.previsao_entrega.replace(" ", "T")) < agora;
};

// ==========================================
// CAMINHÃO: o elemento icônico da Central Logística
// ==========================================
// Linhas finas, carroceria de vidro em degradê roxo, rodas girando, estrada correndo por baixo.
export function CaminhaoAnimado({ className = "", parado = false }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <style>{`
        @keyframes rz-roda { to { transform: rotate(360deg); } }
        @keyframes rz-estrada { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -64; } }
        @keyframes rz-balanco { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.2px); } }
        @keyframes rz-vento { 0% { opacity: 0; transform: translateX(14px); } 30% { opacity: .7; } 100% { opacity: 0; transform: translateX(-34px); } }
        @keyframes rz-brilho { 0%, 100% { opacity: .35; } 50% { opacity: .9; } }
        .rz-roda { transform-box: fill-box; transform-origin: center; animation: rz-roda .9s linear infinite; }
        .rz-estrada { animation: rz-estrada .9s linear infinite; }
        .rz-corpo { animation: rz-balanco 1.8s ease-in-out infinite; }
        .rz-vento { animation: rz-vento 1.6s ease-out infinite; }
        .rz-farol { animation: rz-brilho 2.4s ease-in-out infinite; }
        .rz-parado .rz-roda, .rz-parado .rz-estrada, .rz-parado .rz-corpo, .rz-parado .rz-vento { animation: none; }
        @media (prefers-reduced-motion: reduce) { .rz-roda, .rz-estrada, .rz-corpo, .rz-vento, .rz-farol { animation: none; } }
      `}</style>
      <svg viewBox="0 0 360 170" className={`w-full h-auto ${parado ? "rz-parado" : ""}`} role="img">
        <defs>
          <linearGradient id="rz-bau" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c4b5fd" />
            <stop offset=".55" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="rz-reflexo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset=".45" stopColor="#fff" stopOpacity=".08" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rz-cabine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f4f5" />
            <stop offset="1" stopColor="#d4d4d8" />
          </linearGradient>
          <linearGradient id="rz-vidro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e1b4b" stopOpacity=".85" />
            <stop offset="1" stopColor="#4c1d95" stopOpacity=".65" />
          </linearGradient>
          <radialGradient id="rz-sombra" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#000" stopOpacity=".28" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rz-luz" cx="0" cy=".5" r="1">
            <stop offset="0" stopColor="#fde68a" stopOpacity=".9" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* estrada */}
        <line x1="0" y1="150" x2="360" y2="150" stroke="currentColor" strokeOpacity=".12" strokeWidth="1.5" />
        <line className="rz-estrada" x1="0" y1="160" x2="360" y2="160" stroke="currentColor" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" strokeDasharray="22 42" />

        {/* vento */}
        <g stroke="#8b5cf6" strokeLinecap="round" strokeWidth="2">
          <line className="rz-vento" x1="18" y1="64" x2="46" y2="64" style={{ animationDelay: "0s" }} />
          <line className="rz-vento" x1="8" y1="88" x2="30" y2="88" style={{ animationDelay: ".5s" }} />
          <line className="rz-vento" x1="22" y1="110" x2="44" y2="110" style={{ animationDelay: "1s" }} />
        </g>

        <ellipse cx="190" cy="150" rx="150" ry="9" fill="url(#rz-sombra)" />

        <g className="rz-corpo">
          {/* baú */}
          <rect x="54" y="36" width="190" height="94" rx="12" fill="url(#rz-bau)" />
          <rect x="54" y="36" width="190" height="94" rx="12" fill="url(#rz-reflexo)" />
          <rect x="54.5" y="36.5" width="189" height="93" rx="11.5" fill="none" stroke="#fff" strokeOpacity=".35" />
          <g stroke="#fff" strokeOpacity=".16">
            <line x1="96" y1="44" x2="96" y2="122" /><line x1="140" y1="44" x2="140" y2="122" /><line x1="184" y1="44" x2="184" y2="122" />
          </g>
          {/* marca */}
          <g transform="translate(108 70)">
            <rect width="96" height="26" rx="13" fill="#fff" fillOpacity=".16" />
            <circle cx="14" cy="13" r="5" fill="#fff" fillOpacity=".9" />
            <rect x="26" y="9" width="58" height="3" rx="1.5" fill="#fff" fillOpacity=".85" />
            <rect x="26" y="15" width="38" height="3" rx="1.5" fill="#fff" fillOpacity=".55" />
          </g>

          {/* cabine */}
          <path d="M250 62 h38 c8 0 13 3 17 10 l18 30 c3 5 4 9 4 14 v8 c0 4-3 6-7 6 h-70 z" fill="url(#rz-cabine)" />
          <path d="M250.5 62.5 h37.5 c7.6 0 12.4 2.8 16.3 9.6 l18 30 c2.8 4.8 3.7 8.6 3.7 13.4" fill="none" stroke="#fff" strokeOpacity=".9" />
          <path d="M262 72 h24 c5 0 8 2 10.5 6.5 l11 19 c1 2-.2 3.5-2.2 3.5 h-43.3 z" fill="url(#rz-vidro)" />
          <path d="M266 75 h10 l-8 22 h-4 z" fill="#fff" fillOpacity=".18" />
          <rect x="246" y="58" width="6" height="72" rx="3" fill="#a1a1aa" />
          <rect x="300" y="112" width="12" height="4" rx="2" fill="#a1a1aa" />
          {/* farol */}
          <rect x="320" y="108" width="7" height="9" rx="2.5" fill="#fde68a" />
          <ellipse className="rz-farol" cx="340" cy="113" rx="22" ry="9" fill="url(#rz-luz)" />
          {/* para-choque */}
          <rect x="248" y="126" width="82" height="8" rx="4" fill="#3f3f46" />
          <rect x="48" y="126" width="200" height="6" rx="3" fill="#3f3f46" />
        </g>

        {/* rodas */}
        {[96, 136, 292].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="136" r="15" fill="#18181b" />
            <circle cx={cx} cy="136" r="15" fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="2" />
            <g className="rz-roda">
              <circle cx={cx} cy="136" r="8" fill="#d4d4d8" />
              <g stroke="#71717a" strokeWidth="1.6" strokeLinecap="round">
                <line x1={cx} y1="129.5" x2={cx} y2="142.5" />
                <line x1={cx - 6.5} y1="136" x2={cx + 6.5} y2="136" />
                <line x1={cx - 4.6} y1="131.4" x2={cx + 4.6} y2="140.6" />
                <line x1={cx - 4.6} y1="140.6" x2={cx + 4.6} y2="131.4" />
              </g>
              <circle cx={cx} cy="136" r="2.6" fill="#7c3aed" />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
