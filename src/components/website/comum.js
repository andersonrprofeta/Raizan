"use client";

import { AlertTriangle, CalendarRange, Lock, PlugZap, RefreshCw } from "lucide-react";
import { BOTAO_SECUNDARIO, CAMPO, EstadoVazio, VIDRO } from "@/components/vendedores/ui";

// ---------- Datas ----------

const doisDigitos = (n) => String(n).padStart(2, "0");
export const diaISO = (data) => `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;

const menosDias = (dias) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data;
};

export const PERIODOS = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "ontem", rotulo: "Ontem" },
  { id: "7d", rotulo: "7 dias" },
  { id: "30d", rotulo: "30 dias" },
  { id: "90d", rotulo: "90 dias" },
  { id: "personalizado", rotulo: "Personalizado" },
];

// Converte a escolha da tela em { de, ate } (datas do calendário local, a API usa o fuso da empresa)
export function intervaloDoPeriodo(periodo, personalizado = {}) {
  if (periodo === "hoje") return { de: diaISO(new Date()), ate: diaISO(new Date()) };
  if (periodo === "ontem") return { de: diaISO(menosDias(1)), ate: diaISO(menosDias(1)) };
  if (periodo === "7d") return { de: diaISO(menosDias(6)), ate: diaISO(new Date()) };
  if (periodo === "90d") return { de: diaISO(menosDias(89)), ate: diaISO(new Date()) };
  if (periodo === "personalizado" && personalizado.de && personalizado.ate) {
    return personalizado.de <= personalizado.ate ? personalizado : { de: personalizado.ate, ate: personalizado.de };
  }
  return { de: diaISO(menosDias(29)), ate: diaISO(new Date()) };
}

export const rotuloDoPeriodo = (periodo, intervalo) => {
  const achado = PERIODOS.find((p) => p.id === periodo);
  if (periodo !== "personalizado") return achado?.rotulo === "Hoje" || achado?.rotulo === "Ontem" ? achado.rotulo : `Últimos ${achado?.rotulo || "30 dias"}`;
  return `${dataCurta(intervalo.de)} a ${dataCurta(intervalo.ate)}`;
};

// Aceita "2026-11-12" (dia) ou um instante ISO
const paraData = (valor) => {
  if (!valor) return null;
  const texto = String(valor);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto) ? new Date(`${texto}T12:00:00`) : new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
};

export const dataCurta = (valor) => paraData(valor)?.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") || "—";
export const dataLonga = (valor) => paraData(valor)?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) || "—";
export const dataHora = (valor) => paraData(valor)?.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) || "—";

export function tempoRelativo(valor) {
  const data = paraData(valor);
  if (!data) return "—";
  const minutos = Math.round((Date.now() - data.getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ontem" : `há ${dias} dias`;
}

// Dias até a data (negativo = já passou)
export function diasAte(valor) {
  const data = paraData(valor);
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const alvo = new Date(data);
  alvo.setHours(12, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

export const numero = (valor) => (valor === null || valor === undefined ? "—" : Number(valor).toLocaleString("pt-BR"));
export const percentual = (valor) => (valor === null || valor === undefined ? "—" : `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
export const duracao = (segundos) => {
  if (segundos === null || segundos === undefined) return "—";
  const s = Math.round(Number(segundos));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}min ${doisDigitos(s % 60)}s`;
};

export const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  return hora < 18 ? "Boa tarde" : "Boa noite";
};

// ---------- Peças visuais ----------

const TILE = {
  purple: "from-violet-400 to-purple-600",
  emerald: "from-emerald-400 to-emerald-600",
  sky: "from-sky-400 to-blue-600",
  amber: "from-amber-300 to-amber-500",
  rose: "from-rose-400 to-rose-600",
  indigo: "from-indigo-400 to-indigo-600",
  green: "from-green-400 to-green-600",
  zinc: "from-zinc-400 to-zinc-600",
};

export function Tile({ icone: Icone, cor = "purple", tamanho = 36 }) {
  return (
    <div
      style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.3 }}
      className={`shrink-0 flex items-center justify-center bg-gradient-to-br ${TILE[cor] || TILE.purple} text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-6px_rgba(0,0,0,0.35)]`}
    >
      <Icone size={tamanho * 0.47} />
    </div>
  );
}

export function Bloco({ titulo, icone, cor, acao, className = "", children }) {
  return (
    <section className={`${VIDRO} p-5 md:p-6 min-w-0 ${className}`}>
      {(titulo || acao) && (
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 min-w-0">
            {icone && <Tile icone={icone} cor={cor} tamanho={30} />}
            <span className="truncate">{titulo}</span>
          </h2>
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

export function IndicadorSite({ rotulo, valor, icone, cor, detalhe }) {
  return (
    <div className={`${VIDRO} p-5 min-w-0 transition-transform duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <Tile icone={icone} cor={cor} tamanho={38} />
      </div>
      <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 truncate">{rotulo}</p>
      <p className="mt-1 text-2xl md:text-[28px] leading-tight font-bold tracking-tight tabular-nums text-zinc-900 dark:text-white truncate">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-zinc-500 truncate">{detalhe}</p>}
    </div>
  );
}

const TONS = {
  verde: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  ambar: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  vermelho: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  roxo: "text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/20",
  azul: "text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  cinza: "text-zinc-600 dark:text-zinc-400 bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.08]",
};

export function Etiqueta({ tom = "cinza", ponto = false, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONS[tom] || TONS.cinza}`}>
      {ponto && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// Situação de uma fonte de dados: aguardando ativação, sem permissão ou erro
export function EstadoDaFonte({ resposta, onTentar, titulo = "Coleta do site ainda não ativada" }) {
  if (resposta.estado === "sem_permissao") {
    return <EstadoVazio icone={Lock} titulo="Acesso restrito" texto={resposta.mensagem} />;
  }
  if (resposta.estado === "erro") {
    return (
      <EstadoVazio icone={AlertTriangle} titulo="Não foi possível carregar" texto={resposta.mensagem}>
        {onTentar && <button type="button" onClick={onTentar} className={BOTAO_SECUNDARIO}><RefreshCw size={15} /> Tentar de novo</button>}
      </EstadoVazio>
    );
  }
  return (
    <EstadoVazio
      icone={PlugZap}
      titulo={titulo}
      texto="Assim que o site da empresa estiver conectado ao Raizan Insight, as visitas, os formulários e os contatos aparecem aqui automaticamente."
    />
  );
}

export function SeletorPeriodo({ periodo, personalizado, onPeriodo, onPersonalizado }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
      <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.05] overflow-x-auto no-scrollbar [scrollbar-width:none] max-w-full">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={periodo === p.id}
            onClick={() => onPeriodo(p.id)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
              periodo === p.id
                ? "bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {p.id === "personalizado" ? <CalendarRange size={14} aria-label="Personalizado" /> : p.rotulo}
          </button>
        ))}
      </div>
      {periodo === "personalizado" && (
        <div className="flex items-center gap-2">
          <input type="date" aria-label="Data inicial" value={personalizado.de || ""} onChange={(e) => onPersonalizado({ ...personalizado, de: e.target.value })} className={`${CAMPO.replace("w-full", "w-auto")} h-9 px-3`} />
          <span className="text-xs text-zinc-400">até</span>
          <input type="date" aria-label="Data final" value={personalizado.ate || ""} onChange={(e) => onPersonalizado({ ...personalizado, ate: e.target.value })} className={`${CAMPO.replace("w-full", "w-auto")} h-9 px-3`} />
        </div>
      )}
    </div>
  );
}

// Esqueleto enquanto carrega: o layout não pula quando os dados chegam
export function Esqueleto({ altura = 120, className = "" }) {
  return <div style={{ height: altura }} className={`${VIDRO} animate-pulse bg-black/[0.03] dark:bg-white/[0.03] ${className}`} />;
}

export const TOOLTIP_GRAFICO = {
  backgroundColor: "rgba(18,18,20,0.88)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  color: "#f4f4f5",
  fontSize: "12px",
  boxShadow: "0 18px 40px -12px rgba(0, 0, 0, 0.6)",
};

// ---------- Interações ----------

export const STATUS_INTERACAO = {
  novo: { rotulo: "Novo", tom: "roxo" },
  atendimento: { rotulo: "Em atendimento", tom: "azul" },
  negociacao: { rotulo: "Em negociação", tom: "ambar" },
  convertido: { rotulo: "Convertido", tom: "verde" },
  arquivado: { rotulo: "Arquivado", tom: "cinza" },
};

export const nomeDoContato = (item) => item?.nome?.trim() || item?.empresa?.trim() || "Contato sem identificação";

// ---------- Licença ----------

export const STATUS_LICENCA = {
  active: { rotulo: "Ativa", tom: "verde" },
  payment_pending: { rotulo: "Pagamento pendente", tom: "ambar" },
  overdue: { rotulo: "Em atraso", tom: "vermelho" },
  grace_period: { rotulo: "Em carência", tom: "ambar" },
  suspended: { rotulo: "Suspensa", tom: "vermelho" },
  cancelled: { rotulo: "Cancelada", tom: "cinza" },
};

export const STATUS_CONEXAO = {
  conectado: { rotulo: "Conectado", tom: "verde" },
  aguardando: { rotulo: "Aguardando primeiro evento", tom: "ambar" },
  sem_comunicacao: { rotulo: "Sem comunicação", tom: "vermelho" },
  desconectado: { rotulo: "Desconectado", tom: "cinza" },
};
