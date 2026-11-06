"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MonitorCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/components/vendedores/ui";
import { VIDRO } from "@/components/checkout/estilos";

const data = (valor) => new Date(valor).toLocaleDateString("pt-BR");

export default function ComputadoresConfiaveis() {
  const [computadores, setComputadores] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const dados = await api("/usuarios/computadores");
    if (dados.success) setComputadores(dados.computadores);
    else toast.error(dados.message || "Erro ao carregar os computadores.");
  }, []);

  useEffect(() => { carregar().catch(() => toast.error("Erro de conexão.")); }, [carregar]);

  const revogar = async (caminho) => {
    setOcupado(true);
    try {
      const dados = await api(caminho, { metodo: "DELETE" });
      if (dados.success) toast.success(dados.message);
      else toast.error(dados.message || "Erro ao remover.");
      await carregar();
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className={`${VIDRO} p-6 sm:p-8`}>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="text-lg font-semibold tracking-tight">Computadores confiáveis</h2>
        {computadores?.length > 1 && (
          <button type="button" disabled={ocupado} onClick={() => revogar("/usuarios/computadores")} className="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400 disabled:opacity-50">
            Remover todos
          </button>
        )}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Estes computadores não pedem o código do e-mail ao entrar. A senha continua sendo pedida.</p>

      {!computadores && <Loader2 size={18} className="animate-spin text-zinc-400" aria-label="Carregando" />}
      {computadores?.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum computador confiável.</p>}

      <ul className="space-y-2">
        {computadores?.map((computador) => (
          <li key={computador.id} className="flex items-center gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3">
            <MonitorCheck size={18} className="shrink-0 text-zinc-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {computador.nome || "Computador"}
                {computador.este && <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Este computador</span>}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Confiável desde {data(computador.criado_em)}, vale até {data(computador.expira_em)}</p>
            </div>
            <button type="button" disabled={ocupado} onClick={() => revogar(`/usuarios/computadores/${computador.id}`)} aria-label={`Remover ${computador.nome || "computador"}`} className="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400 disabled:opacity-50">
              Remover
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
