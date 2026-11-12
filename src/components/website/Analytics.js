"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, Clock, Compass, Eye, FileText, Layers, Lightbulb, Mail, MapPin, MessageCircle, MousePointerClick,
  Phone, Repeat, Sparkles, TrendingUp, UserPlus, Users,
} from "lucide-react";
import { VIDRO } from "@/components/vendedores/ui";
import { lerAnalytics } from "./dados";
import {
  Bloco, Esqueleto, EstadoDaFonte, IndicadorSite, SeletorPeriodo, TOOLTIP_GRAFICO,
  dataCurta, duracao, intervaloDoPeriodo, numero, percentual, rotuloDoPeriodo, tempoRelativo,
} from "./comum";

const CORES_ORIGEM = ["#8b5cf6", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#a1a1aa"];

const ICONE_ATIVIDADE = {
  form_submit: { icone: FileText, cor: "bg-purple-500" },
  whatsapp_click: { icone: MessageCircle, cor: "bg-green-500" },
  phone_click: { icone: Phone, cor: "bg-sky-500" },
  email_click: { icone: Mail, cor: "bg-indigo-500" },
  page_view: { icone: Eye, cor: "bg-zinc-400" },
  session_start: { icone: UserPlus, cor: "bg-amber-500" },
  conversion: { icone: Sparkles, cor: "bg-emerald-500" },
};

function BarrasHorizontais({ itens, valor, rotulo, detalhe, cor = "from-purple-500 to-indigo-500" }) {
  const maximo = Math.max(1, ...itens.map(valor));
  return (
    <ul className="space-y-4">
      {itens.map((item, i) => (
        <li key={i} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-zinc-200">{rotulo(item)}</span>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-white">{numero(valor(item))}</span>
          </div>
          {detalhe && <p className="text-[11px] text-zinc-400 truncate -mt-1">{detalhe(item)}</p>}
          <div className="h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${cor}`} style={{ width: `${Math.max(2, (valor(item) / maximo) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const SemDados = ({ texto = "Sem dados no período." }) => <p className="text-sm text-zinc-400 py-10 text-center">{texto}</p>;

// Frases tiradas só dos números recebidos. Sem dado, sem frase.
function frasesDeInteligencia(dados) {
  const frases = [];
  (dados.paginas || []).slice(0, 3).forEach((p) => {
    if (p.visualizacoes > 0 && p.caminho !== "/") frases.push({ icone: Eye, texto: <>A página <b>{p.titulo || p.caminho}</b> recebeu <b>{numero(p.visualizacoes)}</b> visualizações.</> });
  });
  (dados.formularios || []).forEach((f) => {
    if (f.envios > 0) frases.push({ icone: FileText, texto: <>O formulário <b>{f.formulario}</b> recebeu <b>{numero(f.envios)}</b> {f.envios === 1 ? "envio" : "envios"}.</> });
  });
  const regiao = (dados.regioes || [])[0];
  if (regiao?.visitas > 0) frases.push({ icone: MapPin, texto: <><b>{regiao.regiao}</b> é a região com mais acessos: <b>{numero(regiao.visitas)}</b> visitas.</> });
  const origem = (dados.origens || [])[0];
  if (origem?.sessoes > 0) frases.push({ icone: Compass, texto: <>A maior parte das visitas veio de <b>{origem.origem}</b> ({numero(origem.sessoes)} sessões).</> });
  return frases.slice(0, 6);
}

export default function Analytics({ siteId }) {
  const [periodo, setPeriodo] = useState("30d");
  const [personalizado, setPersonalizado] = useState({});
  const [resposta, setResposta] = useState(null);
  const intervalo = intervaloDoPeriodo(periodo, personalizado);

  const carregar = useCallback(async () => {
    setResposta(null);
    setResposta(await lerAnalytics({ site_id: siteId, de: intervalo.de, ate: intervalo.ate }));
  }, [siteId, intervalo.de, intervalo.ate]);

  useEffect(() => { carregar(); }, [carregar]);

  const dados = resposta?.estado === "ok" ? resposta.dados : null;
  const r = dados?.resumo;

  const cabecalho = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <p className="text-sm text-zinc-500">{rotuloDoPeriodo(periodo, intervalo)}{r?.conversao_definicao ? ` · Conversão = ${r.conversao_definicao.toLowerCase()}` : ""}</p>
      <SeletorPeriodo periodo={periodo} personalizado={personalizado} onPeriodo={setPeriodo} onPersonalizado={setPersonalizado} />
    </div>
  );

  if (!resposta) {
    return (
      <div className="space-y-6">
        {cabecalho}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }, (_, i) => <Esqueleto key={i} altura={136} />)}</div>
        <Esqueleto altura={340} />
      </div>
    );
  }
  if (!dados) return <div className="space-y-6">{cabecalho}<div className={VIDRO}><EstadoDaFonte resposta={resposta} onTentar={carregar} /></div></div>;
  if (!r) {
    return (
      <div className="space-y-6">
        {cabecalho}
        <div className={VIDRO}><EstadoDaFonte resposta={{ estado: "indisponivel" }} titulo="Este site ainda não enviou visitas" /></div>
      </div>
    );
  }

  const inteligencia = frasesDeInteligencia(dados);
  const totalOrigens = (dados.origens || []).reduce((acc, o) => acc + o.sessoes, 0);

  return (
    <div className="space-y-6">
      {cabecalho}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <IndicadorSite rotulo="Visitantes únicos" valor={numero(r.visitantes)} icone={Users} cor="indigo" />
        <IndicadorSite rotulo="Visitas" valor={numero(r.visitas)} icone={Eye} cor="sky" />
        <IndicadorSite rotulo="Sessões" valor={numero(r.sessoes)} icone={Layers} cor="purple" />
        <IndicadorSite rotulo="Páginas visualizadas" valor={numero(r.paginas_vistas)} icone={FileText} cor="zinc" />
        <IndicadorSite rotulo="Novos visitantes" valor={numero(r.novos_visitantes)} icone={UserPlus} cor="amber" />
        <IndicadorSite rotulo="Visitantes recorrentes" valor={numero(r.recorrentes)} icone={Repeat} cor="indigo" />
        <IndicadorSite rotulo="Tempo médio de engajamento" valor={duracao(r.engajamento_medio_seg)} icone={Clock} cor="sky" detalhe={r.engajamento_medio_seg === null || r.engajamento_medio_seg === undefined ? "Ainda não mensurável" : undefined} />
        <IndicadorSite rotulo="Taxa de conversão" valor={percentual(r.conversao_pct)} icone={MousePointerClick} cor="emerald" detalhe="Sessões com formulário enviado" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[["Formulários enviados", FileText, r.formularios, "text-purple-600 dark:text-purple-400"], ["Cliques no WhatsApp", MessageCircle, r.whatsapp, "text-green-600 dark:text-green-400"], ["Cliques no telefone", Phone, r.telefone, "text-sky-600 dark:text-sky-400"], ["Cliques no e-mail", Mail, r.email, "text-indigo-600 dark:text-indigo-400"]].map(([rotulo, Icone, valor, tom]) => (
          <div key={rotulo} className={`${VIDRO} !rounded-3xl p-4 flex items-center gap-3`}>
            <Icone size={20} className={tom} />
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white">{numero(valor)}</p>
              <p className="text-xs text-zinc-500 truncate">{rotulo}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Bloco titulo="Visitas por dia" icone={TrendingUp} cor="sky" className="xl:col-span-2">
          {dados.por_dia?.length ? (
            <div className="h-[280px] min-w-0">
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={dados.por_dia} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rz-visitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                    <linearGradient id="rz-visitantes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#a1a1aa" strokeOpacity={0.18} vertical={false} />
                  <XAxis dataKey="data" tickFormatter={dataCurta} axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_GRAFICO} labelFormatter={dataCurta} formatter={(v, nome) => [numero(v), nome === "visitas" ? "Visitas" : "Visitantes"]} />
                  <Area type="monotone" dataKey="visitas" stroke="#0ea5e9" strokeWidth={2.4} fill="url(#rz-visitas)" />
                  <Area type="monotone" dataKey="visitantes" stroke="#8b5cf6" strokeWidth={2.4} fill="url(#rz-visitantes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <SemDados />}
        </Bloco>

        <Bloco titulo="Origem do tráfego" icone={Compass} cor="purple">
          {totalOrigens > 0 ? (
            <>
              <div className="h-[170px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dados.origens} dataKey="sessoes" nameKey="origem" innerRadius={52} outerRadius={74} paddingAngle={3} stroke="none" cornerRadius={6}>
                      {dados.origens.map((_, i) => <Cell key={i} fill={CORES_ORIGEM[i % CORES_ORIGEM.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_GRAFICO} formatter={(v, nome) => [`${numero(v)} sessões`, nome]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {dados.origens.map((o, i) => (
                  <li key={o.origem} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: CORES_ORIGEM[i % CORES_ORIGEM.length] }} /><span className="truncate">{o.origem}</span></span>
                    <span className="text-zinc-500 tabular-nums">{Math.round((o.sessoes / totalOrigens) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <SemDados />}
        </Bloco>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Bloco titulo="Formulários e conversões" icone={FileText} cor="amber">
          {dados.por_dia?.some((d) => d.formularios || d.conversoes) ? (
            <div className="h-[240px] min-w-0">
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={dados.por_dia} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="#a1a1aa" strokeOpacity={0.18} vertical={false} />
                  <XAxis dataKey="data" tickFormatter={dataCurta} axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} minTickGap={20} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_GRAFICO} labelFormatter={dataCurta} cursor={{ fill: "rgba(139,92,246,0.06)" }} formatter={(v, nome) => [numero(v), nome === "formularios" ? "Formulários" : "Conversões"]} />
                  <Bar dataKey="formularios" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="conversoes" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <SemDados texto="Nenhum formulário no período." />}
        </Bloco>

        <Bloco titulo="Páginas mais acessadas" icone={Eye} cor="indigo">
          {dados.paginas?.length ? (
            <BarrasHorizontais itens={dados.paginas.slice(0, 6)} valor={(p) => p.visualizacoes} rotulo={(p) => p.titulo || p.caminho} detalhe={(p) => p.caminho} />
          ) : <SemDados />}
        </Bloco>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Bloco titulo="Regiões com mais acessos" icone={MapPin} cor="sky">
          {dados.regioes?.length ? (
            <BarrasHorizontais itens={dados.regioes.slice(0, 6)} valor={(x) => x.visitas} rotulo={(x) => x.regiao} cor="from-sky-400 to-blue-600" />
          ) : <SemDados />}
          <p className="text-[11px] text-zinc-400 mt-4">Região aproximada, sem GPS e sem guardar IP completo.</p>
        </Bloco>

        <Bloco titulo="Interações por categoria" icone={Activity} cor="emerald">
          {dados.categorias?.some((c) => c.total > 0) ? (
            <BarrasHorizontais itens={dados.categorias.filter((c) => c.total > 0)} valor={(c) => c.total} rotulo={(c) => c.rotulo || c.tipo} cor="from-emerald-400 to-emerald-600" />
          ) : <SemDados />}
        </Bloco>

        <Bloco titulo="Desempenho dos formulários" icone={FileText} cor="purple">
          {dados.formularios?.length ? (
            <ul className="space-y-4">
              {dados.formularios.map((f) => {
                const taxa = f.visualizacoes > 0 ? (f.envios / f.visualizacoes) * 100 : null;
                return (
                  <li key={f.formulario}>
                    <div className="flex justify-between gap-3 text-sm"><span className="font-medium truncate">{f.formulario}</span><span className="font-semibold tabular-nums">{percentual(taxa)}</span></div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{numero(f.visualizacoes)} viram · {numero(f.inicios)} começaram · {numero(f.envios)} enviaram</p>
                  </li>
                );
              })}
            </ul>
          ) : <SemDados />}
        </Bloco>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Bloco titulo="Inteligência comercial" icone={Lightbulb} cor="amber">
          {inteligencia.length ? (
            <ul className="space-y-3">
              {inteligencia.map(({ icone: Icone, texto }, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-black/[0.025] dark:bg-white/[0.035] p-3.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <Icone size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          ) : <SemDados texto="Os destaques aparecem quando houver visitas suficientes." />}
        </Bloco>

        <Bloco titulo="Atividades recentes" icone={Activity} cor="indigo">
          {dados.atividades?.length ? (
            <ol className="relative border-l border-black/[0.08] dark:border-white/[0.08] ml-3 space-y-4">
              {dados.atividades.map((a, i) => {
                const { icone: Icone, cor } = ICONE_ATIVIDADE[a.tipo] || ICONE_ATIVIDADE.page_view;
                return (
                  <li key={i} className="pl-6 relative">
                    <span className={`absolute -left-3 top-0 w-6 h-6 rounded-full ${cor} text-white flex items-center justify-center ring-4 ring-white dark:ring-[#121214]`}><Icone size={12} /></span>
                    <p className="text-[13px] text-zinc-800 dark:text-zinc-200">{a.descricao}</p>
                    <p className="text-[11px] text-zinc-500">{tempoRelativo(a.quando)}</p>
                  </li>
                );
              })}
            </ol>
          ) : <SemDados texto="Nenhuma atividade recente." />}
        </Bloco>
      </div>
    </div>
  );
}
