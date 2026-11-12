"use client";

// Painel da Central Logística (torre de controle): cards, coletas por dia, SLA por transportadora e por região.

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, Clock, Gauge, PackageCheck, Route, Truck, Wallet, Zap } from "lucide-react";
import { Segmentado, VIDRO, moeda } from "@/components/vendedores/ui";
import { ROMANEIO, Selo, diaCurto, diaEHora, peso } from "@/components/transportadora/ui";

export const PERIODOS = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "7", rotulo: "7 dias" },
  { id: "30", rotulo: "30 dias" },
  { id: "90", rotulo: "90 dias" },
  { id: "365", rotulo: "365 dias" },
];

function Card({ icone: Icone, rotulo, valor, detalhe, tom = "", destaque = false, onClick }) {
  const Elemento = onClick ? "button" : "div";
  return (
    <Elemento
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${VIDRO} group relative overflow-hidden p-5 text-left min-w-0 transition-all duration-300 ${onClick ? "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(124,58,237,0.45)] active:scale-[0.99]" : ""}`}
    >
      {destaque && <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-500/15 blur-2xl" aria-hidden="true" />}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] leading-snug font-medium text-zinc-500 dark:text-zinc-400">{rotulo}</p>
        <span className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          <Icone size={16} />
        </span>
      </div>
      <p className={`mt-3 text-2xl sm:text-[30px] leading-none font-semibold tracking-tight tabular-nums truncate ${tom || "text-zinc-900 dark:text-white"}`}>{valor}</p>
      {detalhe && <p className="mt-2.5 text-xs leading-snug text-zinc-500 line-clamp-2 sm:truncate">{detalhe}</p>}
    </Elemento>
  );
}

// Uma série só (coletas): um tom, barras finas com ponta arredondada, valor no passar do mouse
function ColetasPorDia({ dados, periodo }) {
  const [foco, setFoco] = useState(null);
  const dias = useMemo(() => {
    const total = periodo === "hoje" ? 1 : Number(periodo);
    const mapa = new Map(dados.map((d) => [d.dia, d.coletas]));
    const hoje = new Date();
    return Array.from({ length: Math.min(total, 90) }, (_, i) => {
      const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (Math.min(total, 90) - 1 - i));
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
      return { dia: chave, coletas: mapa.get(chave) || 0 };
    });
  }, [dados, periodo]);
  const maximo = Math.max(1, ...dias.map((d) => d.coletas));
  const total = dados.reduce((t, d) => t + d.coletas, 0);
  const atual = foco !== null ? dias[foco] : null;

  return (
    <section className={`${VIDRO} p-5 sm:p-6`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-semibold tracking-tight">Coletas por dia</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Hora da coleta = geração do romaneio{Number(periodo) > 90 ? " · últimos 90 dias" : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{atual ? atual.coletas : total}</p>
          <p className="text-[11px] text-zinc-500">{atual ? diaCurto(atual.dia) : "no período"}</p>
        </div>
      </div>
      <div className="mt-5 flex h-40 items-end gap-[2px]" onMouseLeave={() => setFoco(null)} role="img" aria-label={`Coletas por dia: ${total} no período`}>
        {dias.map((d, i) => (
          <div key={d.dia} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setFoco(i)}>
            <div
              style={{ height: `${d.coletas ? Math.max(4, (d.coletas / maximo) * 100) : 0}%` }}
              className={`w-full rounded-t-[4px] transition-all duration-500 ${foco === i ? "bg-purple-700 dark:bg-purple-300" : "bg-purple-500/80 dark:bg-purple-400/80"}`}
            />
            {!d.coletas && <div className="absolute bottom-0 w-full h-px bg-black/[0.08] dark:bg-white/[0.08]" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-zinc-400 tabular-nums">
        <span>{diaCurto(dias[0]?.dia)}</span><span>{diaCurto(dias[dias.length - 1]?.dia)}</span>
      </div>
    </section>
  );
}

const MEDALHAS = [
  { rotulo: "1º", cor: "from-amber-300 to-amber-500 text-amber-950" },
  { rotulo: "2º", cor: "from-zinc-200 to-zinc-400 text-zinc-800" },
  { rotulo: "3º", cor: "from-orange-300 to-orange-600 text-orange-950" },
];

function RankingSla({ ranking, porTransportadora }) {
  const maximo = Math.max(1, ...porTransportadora.map((t) => t.coletas));
  return (
    <section className={`${VIDRO} p-5 sm:p-6`}>
      <h3 className="font-semibold tracking-tight">SLA por transportadora</h3>
      <p className="text-xs text-zinc-500 mt-0.5">Entregas no prazo sobre as entregas do período</p>
      {ranking.length > 0 ? (
        <ol className="mt-5 space-y-2.5">
          {ranking.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2.5">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b ${MEDALHAS[i].cor} text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]`}>{MEDALHAS[i].rotulo}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{t.nome}</span>
                <span className="block text-[11px] text-zinc-500">{t.entregas} {t.entregas === 1 ? "entrega" : "entregas"}</span>
              </span>
              <span className="text-lg font-semibold tabular-nums">{t.sla?.toLocaleString("pt-BR")}%</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-6 text-center text-sm text-zinc-500">O ranking aparece depois das primeiras entregas confirmadas.</p>
      )}
      {porTransportadora.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Coletas no período</p>
          <ul className="mt-3 space-y-3">
            {porTransportadora.slice(0, 6).map((t) => (
              <li key={t.id} className="text-sm" title={`${t.nome}: ${t.coletas} coletas`}>
                <div className="flex justify-between gap-3"><span className="truncate">{t.nome}</span><span className="tabular-nums font-semibold">{t.coletas}</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.06] overflow-hidden">
                  <div style={{ width: `${(t.coletas / maximo) * 100}%` }} className="h-full rounded-full bg-purple-500 transition-[width] duration-700" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function PorRegiao({ porUf }) {
  if (porUf.length === 0) return null;
  return (
    <section className={`${VIDRO} overflow-hidden`}>
      <div className="p-5 sm:p-6 pb-3">
        <h3 className="font-semibold tracking-tight">Entregas por região</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Média de dias da coleta à entrega e SLA por UF de destino</p>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-zinc-400">
              <th className="text-left font-semibold px-6 py-2">UF</th>
              <th className="text-right font-semibold px-3 py-2">Entregas</th>
              <th className="text-right font-semibold px-3 py-2">Dias médios</th>
              <th className="text-right font-semibold px-6 py-2">No prazo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {porUf.map((u) => (
              <tr key={u.uf}>
                <td className="px-6 py-2.5 font-semibold">{u.uf}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{u.entregas}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{u.dias_medios === null ? "—" : u.dias_medios.toLocaleString("pt-BR")}</td>
                <td className="px-6 py-2.5 text-right tabular-nums font-semibold">{u.sla === null ? "—" : `${u.sla.toLocaleString("pt-BR")}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Painel({ dados, periodo, onPeriodo, irPara }) {
  const k = dados.indicadores;
  const atraso = k.em_atraso > 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmentado opcoes={PERIODOS} valor={periodo} onChange={onPeriodo} />
        {!dados.regra_de_rota.rotas ? (
          <a href="/configuracoes?guia=logistica" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline">
            <AlertTriangle size={15} />Cadastre os prazos por rota para a entrega automática
          </a>
        ) : (
          <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <Zap size={14} className={dados.regra_de_rota.ativa ? "text-emerald-500" : "text-zinc-400"} />
            Entrega automática {dados.regra_de_rota.ativa ? "ligada" : "desligada"} · {dados.regra_de_rota.rotas} {dados.regra_de_rota.rotas === 1 ? "rota" : "rotas"}
            {dados.regra_de_rota.uf_origem ? ` saindo de ${dados.regra_de_rota.uf_origem}` : ""}
          </p>
        )}
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icone={Truck} rotulo="Transportadoras ativas" valor={k.transportadoras_ativas} detalhe={`${k.transportadoras_total} cadastradas`} onClick={() => irPara("transportadoras")} />
        <Card icone={PackageCheck} rotulo="Coletas hoje" valor={k.coletas_hoje} detalhe={`${k.coletas_periodo} no período · ${k.aguardando_coleta} aguardando`} destaque onClick={() => irPara("expedicao")} />
        <Card icone={Route} rotulo="Entregas hoje" valor={k.entregas_hoje} detalhe={`${k.entregas_periodo} no período · ${k.em_transito} em trânsito`} onClick={() => irPara("expedicao", "transito")} />
        <Card icone={Clock} rotulo="Entregas em atraso" valor={k.em_atraso} tom={atraso ? "text-rose-600 dark:text-rose-400" : ""} detalhe={atraso ? "Previsão vencida em trânsito" : "Nada atrasado"} onClick={() => irPara("expedicao", "atrasadas")} />
        <Card icone={Gauge} rotulo="SLA médio" valor={k.sla_medio === null ? "—" : `${k.sla_medio.toLocaleString("pt-BR")}%`} detalhe={k.automaticas_periodo ? `${k.automaticas_periodo} confirmadas pela regra de rota` : "Entregas no prazo"} />
        <Card icone={Wallet} rotulo="Frete médio" valor={k.frete_medio === null ? "—" : moeda(k.frete_medio)} detalhe={k.frete_medio === null ? "Informe o frete no CT-e do pedido" : "Por pedido coletado"} />
        <Card icone={AlertTriangle} rotulo="Ocorrências logísticas" valor={k.ocorrencias} tom={k.ocorrencias ? "text-rose-600 dark:text-rose-400" : ""} detalhe="Em aberto" onClick={() => irPara("expedicao", "ocorrencias")} />
        <Card icone={CalendarClock} rotulo="Tempo até despacho" valor={k.horas_ate_despacho === null ? "—" : `${k.horas_ate_despacho.toLocaleString("pt-BR")} h`} detalhe={k.sla_expedicao === null ? "Da NF-e à coleta" : `${k.sla_expedicao.toLocaleString("pt-BR")}% despachados em 24 h`} />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6 min-w-0">
          <ColetasPorDia dados={dados.coletas_por_dia} periodo={periodo} />
          <PorRegiao porUf={dados.por_uf} />
        </div>
        <RankingSla ranking={dados.ranking_sla} porTransportadora={dados.por_transportadora} />
      </div>

      {dados.romaneios.length > 0 && (
        <section className={`${VIDRO} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 p-5 sm:p-6 pb-3">
            <h3 className="font-semibold tracking-tight">Últimos romaneios</h3>
            <button type="button" onClick={() => irPara("romaneios")} className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400">Ver todos<ArrowRight size={14} /></button>
          </div>
          <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {dados.romaneios.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => irPara("romaneios", null, r.id)} className="w-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-6 py-3.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-sm font-bold text-purple-700 dark:text-purple-300 tabular-nums">{r.numero}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.transportadora_nome || "Sem transportadora"}</span>
                    <span className="block truncate text-xs text-zinc-500">{r.total_pedidos} pedidos · {peso(r.peso_total)} · {r.gerado_em ? `coleta ${diaEHora(r.gerado_em)}` : "em montagem"}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <Selo mapa={ROMANEIO} valor={r.status} />
                    {r.status === "gerado" && <span className="text-[11px] text-zinc-500 tabular-nums">{r.entregues}/{r.total_pedidos} entregues</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
