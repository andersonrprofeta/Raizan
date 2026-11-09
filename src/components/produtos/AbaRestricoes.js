import { Ban, Lock, Plug, ShieldCheck, Smartphone } from "lucide-react";

const CANAIS = [
  { campo: "geral", icone: Ban, titulo: "Bloqueio geral de vendas", texto: "Sai do aplicativo, do Portal B2B e das lojas integradas." },
  { campo: "app", icone: Smartphone, titulo: "Bloqueio para aplicativo", texto: "Sai do catálogo do Raizan Seller." },
  { campo: "integracoes", icone: Plug, titulo: "Bloqueio para integrações", texto: "Sai do Portal B2B e não pode ser enviado às lojas integradas." },
];

const ROTULO_ORIGEM = { omie: "Omie", manual: "Manual" };

function Chave({ ligada, desativada, onChange, titulo }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={titulo}
      disabled={desativada}
      onClick={() => onChange(!ligada)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${ligada ? "bg-rose-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ligada ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Informacao({ rotulo, valor }) {
  return (
    <div className="bg-black/[0.04] dark:bg-white/[0.05] border border-transparent rounded-2xl focus:bg-white dark:focus:bg-white/[0.07] p-4">
      <p className="text-xs font-bold text-zinc-500">{rotulo}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-200">{valor}</p>
    </div>
  );
}

export default function AbaRestricoes({ produto, atualizarCampo }) {
  const restricoes = produto.restricoes || {};
  const { geral, app, integracoes, motivo, data, origem } = restricoes;
  const bloqueado = Boolean(geral || app || integracoes);
  const vemDoOmie = origem === "omie" && geral;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {bloqueado ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <Lock size={20} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="text-sm font-black text-rose-700 dark:text-rose-400">BLOQUEADO PARA VENDA</p>
            <p className="text-sm text-rose-700/90 dark:text-rose-300/90 mt-0.5">
              {vemDoOmie
                ? "Este bloqueio vem do Omie e é liberado sozinho quando o produto for reativado lá."
                : "O produto continua no cadastro e no histórico, mas não entra em novos pedidos dos canais bloqueados."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <ShieldCheck size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Liberado para venda em todos os canais</p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.06] pb-3 transition-colors">
          <Ban className="text-purple-600 dark:text-purple-500" size={20} /> Onde bloquear
        </h2>

        {CANAIS.map(({ campo, icone: Icone, titulo, texto }) => {
          const cobertoPeloGeral = campo !== "geral" && geral;
          return (
            <div key={campo} className="flex items-center gap-4 bg-black/[0.04] dark:bg-white/[0.05] border border-transparent rounded-2xl focus:bg-white dark:focus:bg-white/[0.07] p-4">
              <Icone size={20} className="shrink-0 text-zinc-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{titulo}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{texto}</p>
              </div>
              <Chave
                titulo={titulo}
                ligada={Boolean(restricoes[campo] || cobertoPeloGeral)}
                desativada={Boolean(vemDoOmie || cobertoPeloGeral)}
                onChange={(valor) => atualizarCampo("restricoes", campo, valor)}
              />
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="motivo-bloqueio" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Motivo do bloqueio</label>
          <input
            id="motivo-bloqueio"
            type="text"
            maxLength={255}
            disabled={!bloqueado || vemDoOmie}
            placeholder="Ex: Produto substituído por novo SKU"
            value={motivo || ""}
            onChange={(e) => atualizarCampo("restricoes", "motivo", e.target.value)}
            className="w-full bg-black/[0.04] dark:bg-white/[0.05] border border-transparent rounded-2xl focus:bg-white dark:focus:bg-white/[0.07] p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
          />
        </div>

        {bloqueado && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Informacao rotulo="Data do bloqueio" valor={data || "Definida ao salvar"} />
            <Informacao rotulo="Origem do bloqueio" valor={ROTULO_ORIGEM[origem] || "Manual"} />
          </div>
        )}
      </section>
    </div>
  );
}
