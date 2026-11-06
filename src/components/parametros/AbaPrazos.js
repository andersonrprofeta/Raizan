import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Aviso, Grupo } from "@/components/parametros/ui";
import { getHeaders, getHubUrl } from "@/components/utils/api";

export default function AbaPrazos({ prazosLiberados, onChange }) {
  const [prazos, setPrazos] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    fetch(`${getHubUrl()}/api/hub/integracoes/omie/condicoes-pagamento`, { headers: getHeaders() })
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (!dados.success) throw new Error(dados.message);
        setPrazos(dados.condicoes || []);
      })
      .catch(() => setFalhou(true));
  }, []);

  const alternar = (codigo) => onChange(
    prazosLiberados.includes(codigo) ? prazosLiberados.filter((item) => item !== codigo) : [...prazosLiberados, codigo]
  );

  return (
    <div className="space-y-5">
      <Aviso>
        Os prazos marcados aqui valem para todos os clientes, no app e no portal. No cadastro de um cliente, você libera os prazos que são só dele. Sem nada marcado aqui nem no cadastro, todos os prazos ficam disponíveis.
      </Aviso>

      <Grupo titulo="Prazos para todos os clientes" texto="Lista lida do Omie.">
        {falhou ? (
          <p className="text-sm text-zinc-500">Não foi possível buscar os prazos do Omie. Aguarde 1 minuto e abra esta guia de novo.</p>
        ) : prazos === null ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 size={15} className="animate-spin" /> Buscando os prazos...</p>
        ) : prazos.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum prazo encontrado no Omie.</p>
        ) : (
          <div className="pt-1">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500">{prazosLiberados.length} de {prazos.length} marcados</span>
              <div className="flex gap-3 font-semibold">
                <button type="button" onClick={() => onChange([])} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Limpar</button>
                <button type="button" onClick={() => onChange(prazos.map((prazo) => String(prazo.codigo)))} className="text-purple-600 hover:text-purple-500 dark:text-purple-400">Marcar todos</button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {prazos.map((prazo) => {
                const codigo = String(prazo.codigo);
                const marcado = prazosLiberados.includes(codigo);
                return (
                  <button
                    key={codigo}
                    type="button"
                    role="checkbox"
                    aria-checked={marcado}
                    onClick={() => alternar(codigo)}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 py-2 text-left text-sm font-semibold transition-colors ${marcado ? "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-200" : "border-black/[0.08] text-zinc-600 hover:border-purple-300 dark:border-white/10 dark:text-zinc-300 dark:hover:border-purple-500/40"}`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${marcado ? "border-purple-500 bg-purple-500 text-white" : "border-zinc-300 dark:border-zinc-600"}`}>
                      {marcado && <Check size={14} aria-hidden />}
                    </span>
                    {prazo.descricao}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Grupo>
    </div>
  );
}
