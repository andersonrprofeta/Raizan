"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Grip } from "lucide-react";
import { getHubUrl, getTenantId } from "@/components/utils/api";
import LogoApp from "@/components/apps/LogoApp";
import { abrirAplicacao, montarAplicacoes, useWorkspace } from "@/components/apps/aplicacoes";
import { EVENTO_APPS_INTEGRADOS, buscarAppsIntegrados, lerAppsGuardados } from "@/components/apps/appsIntegrados";

const plataformasAtivas = (integracoes) => (
  new Set((Array.isArray(integracoes) ? integracoes : []).filter((item) => item.status === "ativo").map((item) => item.plataforma))
);

function lerGuardadas(tenant) {
  try {
    return plataformasAtivas(JSON.parse(localStorage.getItem(`@raizan:cache_integracoes_${tenant}`)));
  } catch {
    return new Set();
  }
}

export default function LauncherAplicacoes({ classeBotao, classePainel, classeRotulo }) {
  const [aberto, setAberto] = useState(false);
  const [ativas, setAtivas] = useState(new Set());
  const [conectados, setConectados] = useState({});
  const { abertos } = useWorkspace();

  useEffect(() => {
    const tenant = getTenantId();
    if (!tenant) return;
    setAtivas(lerGuardadas(tenant));

    fetch(`${getHubUrl()}/api/hub/integracoes`, { headers: { "x-tenant-id": tenant } })
      .then((resposta) => resposta.json())
      .then((dados) => { if (dados.success) setAtivas(plataformasAtivas(dados.integracoes)); })
      .catch(() => {});

    setConectados(lerAppsGuardados());
    buscarAppsIntegrados().then(setConectados).catch(() => {});

    const aoMudar = (evento) => setConectados(evento.detail);
    window.addEventListener(EVENTO_APPS_INTEGRADOS, aoMudar);
    return () => window.removeEventListener(EVENTO_APPS_INTEGRADOS, aoMudar);
  }, []);

  const disponiveis = useMemo(() => montarAplicacoes(conectados, ativas), [conectados, ativas]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        onBlur={() => setTimeout(() => setAberto(false), 200)}
        className={`${classeBotao} hover:text-purple-600 dark:hover:text-purple-400`}
        title="Aplicações"
        aria-label="Aplicações"
        aria-expanded={aberto}
      >
        <Grip size={18} />
        {abertos.length > 0 && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#121214]" />}
      </button>

      {aberto && (
        <div className={`${classePainel} bg-white/95! dark:bg-[#121214]/95! absolute right-0 top-full z-[100] mt-4 w-80 rounded-[28px] p-3 animate-in slide-in-from-top-2`}>
          <div className="flex items-center justify-between px-3 pb-3 pt-2">
            <h4 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Aplicações</h4>
            {abertos.length > 0 && <span className={classeRotulo}>{abertos.length === 1 ? "1 aberta" : `${abertos.length} abertas`}</span>}
          </div>

          <div className="space-y-1">
            {disponiveis.map((app) => {
              const emUso = abertos.includes(app.id);
              return (
                <button
                  key={app.id}
                  type="button"
                  onMouseDown={() => abrirAplicacao(app)}
                  className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-black/[0.05] active:scale-[0.99] dark:hover:bg-white/[0.07]"
                >
                  <LogoApp app={app} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{app.nome}</span>
                    <span className={`block truncate text-xs ${emUso ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {emUso ? "Sessão aberta" : app.descricao}
                    </span>
                  </span>
                  {emUso && <span className="mr-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" aria-hidden />}
                </button>
              );
            })}
            {disponiveis.length === 0 && (
              <p className="px-3 pb-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Conecte WhatsApp ou E-mail em <Link href="/cadastros/integracoes" className="font-semibold text-purple-600 dark:text-purple-400">Integrações</Link>.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
