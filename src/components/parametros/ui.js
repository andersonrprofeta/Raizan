import { VIDRO } from "@/components/vendedores/ui";

export const CAMPO = "w-full h-11 px-4 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15 transition-all dark:[color-scheme:dark]";

export const Grupo = ({ titulo, texto, children }) => (
  <section className={`${VIDRO} p-5 sm:p-6`}>
    <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{titulo}</h2>
    {texto && <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{texto}</p>}
    <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.07]">{children}</div>
  </section>
);

export function LinhaSwitch({ titulo, texto, ligado, onChange, desativado = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{titulo}</p>
        {texto && <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{texto}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label={titulo}
        disabled={desativado}
        onClick={() => onChange(!ligado)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${ligado ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${ligado ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

export const LinhaCampo = ({ titulo, texto, children }) => (
  <div className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{titulo}</p>
      {texto && <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{texto}</p>}
    </div>
    <div className="shrink-0 sm:w-44">{children}</div>
  </div>
);

export const Aviso = ({ children }) => (
  <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-800 dark:text-amber-300">{children}</p>
);

export function Etiquetas({ opcoes, marcadas, onChange, rotuloVazio }) {
  if (opcoes.length === 0) return <p className="text-xs text-zinc-500">{rotuloVazio}</p>;

  const alternar = (id) => onChange(marcadas.includes(id) ? marcadas.filter((item) => item !== id) : [...marcadas, id]);

  return (
    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto custom-scrollbar">
      {opcoes.map(({ id, rotulo }) => {
        const marcada = marcadas.includes(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={marcada}
            onClick={() => alternar(id)}
            className={`h-8 rounded-full border px-3 text-xs font-semibold transition-colors ${marcada ? "border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300" : "border-black/[0.08] text-zinc-500 hover:text-zinc-800 dark:border-white/10 dark:hover:text-zinc-200"}`}
          >
            {rotulo}
          </button>
        );
      })}
    </div>
  );
}
