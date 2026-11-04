"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getHubUrl, getApiUrl, getHeaders } from "@/components/utils/api";
import {
  TrendingUp, ShoppingCart, DollarSign, Loader2,
  Ban, Database, MapPin, PieChart as PieChartIcon, Trophy, Smartphone, Receipt, Briefcase
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================
const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// Superfície de vidro usada por todos os cards (claro + escuro)
const CARD =
  "relative overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] " +
  "bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] " +
  "transition-all duration-300";

const TITULO =
  "flex items-center gap-2.5 text-[15px] md:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(18,18,20,0.88)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  color: '#f4f4f5',
  boxShadow: '0 18px 40px -12px rgba(0, 0, 0, 0.6)',
  fontSize: '12px',
};

// Classes completas (o Tailwind precisa enxergá-las inteiras no código)
const TILE_CORES = {
  emerald: "from-emerald-400 to-emerald-600",
  purple: "from-violet-400 to-purple-600",
  amber: "from-amber-300 to-amber-500",
  blue: "from-sky-400 to-blue-600",
  indigo: "from-indigo-400 to-indigo-600",
  rose: "from-rose-400 to-rose-600",
};

// Ícone em "tile" arredondado, igual aos ícones de app da Apple
const Tile = ({ cor = "purple", size = 40, children, className = "" }) => (
  <div
    className={`shrink-0 flex items-center justify-center bg-gradient-to-br ${TILE_CORES[cor]} text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-6px_rgba(0,0,0,0.35)] ${className}`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    {children}
  </div>
);

// Animações: uma única sequência de entrada + barras que crescem
const ANIM_CSS = `
@keyframes rz-rise { from { opacity: 0; transform: translateY(14px) scale(.99); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes rz-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.rz-rise { animation: rz-rise .8s cubic-bezier(.16,1,.3,1) backwards; }
.rz-grow { transform-origin: left; animation: rz-grow 1.1s cubic-bezier(.16,1,.3,1) .3s backwards; }
@media (prefers-reduced-motion: reduce) { .rz-rise, .rz-grow { animation: none; } }
`;
const atraso = (i = 0) => ({ animationDelay: `${i * 70}ms` });

// ==========================================
// 🧩 COMPONENTE 0: CARD DE INDICADOR (KPI)
// ==========================================
const Kpi = ({ icone, cor, label, valor, badge, indice }) => (
  <div
    style={atraso(indice)}
    className={`${CARD} rz-rise group p-5 w-full hover:-translate-y-0.5 hover:bg-white dark:hover:bg-[#161619]`}
  >
    <div className="flex justify-between items-start mb-5 gap-2 relative z-10">
      <Tile cor={cor} size={42}>{icone}</Tile>
      {badge && (
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
          <TrendingUp size={12} /> {badge}
        </span>
      )}
    </div>
    <p className="text-xs md:text-[13px] font-medium text-zinc-500 dark:text-zinc-400 relative z-10">{label}</p>
    <h3 className="text-2xl md:text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1 truncate relative z-10">
      {valor}
    </h3>
  </div>
);

// ==========================================
// 🧩 COMPONENTE 1: GRÁFICO DINÂMICO (COM FILTRO)
// ==========================================
const GraficoDinamico = ({ dadosGrafico, canais, canaisOcultos, onAlternarCanal }) => {
  if (!dadosGrafico || dadosGrafico.length === 0) {
    return (
      <div className={`${CARD} xl:col-span-2 p-6 w-full flex items-center justify-center min-h-[300px] text-sm text-zinc-400`}>
        Nenhum dado de venda registrado para o período.
      </div>
    );
  }

  return (
    <div className={`${CARD} xl:col-span-2 p-5 md:p-7 w-full flex flex-col`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <h2 className={TITULO}>
          <Tile cor="emerald" size={32}><TrendingUp size={17} /></Tile>
          Evolução de Vendas
        </h2>

        {/* Filtro de canais no estilo "controle segmentado" */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-full bg-zinc-100/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.05]">
          {canais?.map(canal => {
            const oculto = canaisOcultos.includes(canal.id);
            return (
              <button
                key={canal.id}
                onClick={() => onAlternarCanal(canal.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 active:scale-95
                  ${oculto
                    ? 'opacity-45 grayscale'
                    : 'bg-white dark:bg-white/[0.09] shadow-sm text-zinc-800 dark:text-zinc-100'}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: canal.cor }} />
                <span className="truncate max-w-[110px]" title={canal.nome}>{canal.nome}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full min-w-0 relative z-10 mt-6" style={{ height: 280 }}>
        <ResponsiveContainer width="99%" height="100%">
          <AreaChart data={dadosGrafico} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
            <defs>
              {canais?.map(canal => (
                <linearGradient key={`grad_${canal.id}`} id={`cor_${canal.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={canal.cor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={canal.cor} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="#a1a1aa" strokeOpacity={0.18} vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} dy={10} minTickGap={15} />
            <RechartsTooltip
              cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ fontWeight: 'bold' }}
              formatter={(value, name) => {
                const canal = canais?.find(c => c.id === name);
                return [formatarMoeda(value), <span style={{ color: canal?.cor }}>{canal?.nome || name}</span>];
              }}
            />
            {canais?.map(canal => (
              !canaisOcultos.includes(canal.id) && (
                <Area
                  key={canal.id}
                  type="monotone"
                  dataKey={canal.id}
                  name={canal.id}
                  stroke={canal.cor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#cor_${canal.id})`}
                  activeDot={{ r: 5, fill: canal.cor, stroke: "#ffffff", strokeWidth: 2 }}
                />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==========================================
// 🧩 COMPONENTE 2: VENDAS POR CANAL (DONUT PREMIUM)
// ==========================================
const VendasPorCanal = ({ canais }) => {
  const totalGeral = canais?.reduce((acc, curr) => acc + curr.valor, 0) || 0;

  return (
    <div className={`${CARD} lg:col-span-1 p-6 w-full flex flex-col h-full min-h-[400px]`}>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-52 h-52 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <h2 className={`${TITULO} mb-6 relative z-10`}>
        <Tile cor="purple" size={32}><PieChartIcon size={16} /></Tile>
        Vendas por Canal
      </h2>

      {(!canais || canais.length === 0) ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">Sem integrações ativas</div>
      ) : (
        <div className="flex flex-col flex-1 relative z-10">

          <div className="w-full flex-1 min-h-[220px] relative flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={canais}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={96}
                  paddingAngle={4}
                  dataKey="valor"
                  stroke="none"
                  cornerRadius={8}
                >
                  {canais.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value, name, props) => [formatarMoeda(value), props.payload.nome || name]}
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-medium text-zinc-400 mb-0.5">Total</span>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatarMoeda(totalGeral)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 mt-auto">
            {canais.map(canal => {
              const percentual = totalGeral > 0 ? Math.round((canal.valor / totalGeral) * 100) : 0;
              return (
                <div
                  key={canal.id}
                  className="rounded-2xl p-3 flex items-center justify-between gap-3 bg-zinc-100/70 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${canal.cor}18`, border: `1px solid ${canal.cor}30` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: canal.cor, boxShadow: `0 0 8px ${canal.cor}90` }} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]" title={canal.nome}>{canal.nome}</span>
                      <span className="text-[11px] font-medium text-zinc-500">{percentual}% do faturamento</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{formatarMoeda(canal.valor)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🧩 COMPONENTE 3: RANKING DE ESTADOS
// ==========================================
const RankingEstados = ({ estados }) => {
  const topEstados = estados?.slice(0, 6) || [];
  const maxValor = topEstados.length > 0 ? Math.max(...topEstados.map(e => e.valor)) : 1;

  return (
    <div className={`${CARD} xl:col-span-1 p-6 w-full flex flex-col h-full min-h-[350px]`}>

      <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <h2 className={`${TITULO} mb-6 relative z-10`}>
        <Tile cor="blue" size={32}><MapPin size={16} /></Tile>
        Top Regiões
      </h2>

      {topEstados.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
          <MapPin size={32} className="opacity-20" />
          Sem dados de região no momento
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-5 relative z-10">
          {topEstados.map((uf, index) => {
            const percent = Math.max((uf.valor / maxValor) * 100, 2);
            const isFirst = index === 0;
            const siglaCrua = uf.sigla || "ND";
            const isGhost = siglaCrua === 'UF' || siglaCrua === 'ND';
            const nomeExibicao = uf.nome || (isGhost ? 'Local Não Informado' : siglaCrua);

            return (
              <div key={siglaCrua + index} className="space-y-2 group">
                <div className="flex justify-between items-center text-sm">
                  <span className={`font-semibold flex items-center gap-2.5 ${isGhost ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-transform group-hover:scale-110
                        ${isFirst ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                          isGhost ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700' :
                          'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'}`}
                    >
                      {isFirst ? <Trophy size={12} className="fill-amber-500/20" /> : index + 1}
                    </span>
                    <span className="truncate max-w-[120px]" title={nomeExibicao}>{nomeExibicao}</span>
                  </span>

                  <span className={`font-bold tracking-tight ${isFirst ? 'text-amber-600 dark:text-amber-400' : isGhost ? 'text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {formatarMoeda(uf.valor)}
                  </span>
                </div>

                <div className="w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className={`rz-grow h-full rounded-full group-hover:opacity-80 transition-opacity
                      ${isFirst ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                        isGhost ? 'bg-zinc-300 dark:bg-zinc-600' :
                        'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {uf.pedidos && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-right leading-none font-medium">{uf.pedidos} pedidos gerados</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🧩 COMPONENTE 4: RANKING DE VENDEDORES (REAL)
// ==========================================
const RankingVendedores = ({ vendedores, filtrado }) => {
  const listaVendedores = vendedores && vendedores.length > 0 ? vendedores : [];
  const maxValor = listaVendedores.length > 0 ? Math.max(...listaVendedores.map(v => parseFloat(v.valor) || 0)) : 1;

  return (
    <div className={`${CARD} lg:col-span-2 p-6 w-full flex flex-col h-full min-h-[350px]`}>

      <div className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />

      <h2 className={`${TITULO} justify-between mb-6 relative z-10`}>
        <span className="flex items-center gap-2.5">
          <Tile cor="indigo" size={32}><Briefcase size={16} /></Tile>
          Top 10 Vendedores
        </span>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
          {filtrado ? 'Canais filtrados' : 'Todos os canais'}
        </span>
      </h2>

      {listaVendedores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-sm gap-2 relative z-10">
          <Briefcase size={32} className="opacity-20" />
          Nenhum vendedor com vendas neste mês.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 relative z-10">
          {listaVendedores.map((vend, index) => {
            const valorReal = parseFloat(vend.valor) || 0;
            const percent = Math.max((valorReal / maxValor) * 100, 2);
            const isTop3 = index < 3;

            return (
              <div key={index} className="flex items-center gap-4 group">
                <div className="w-6 font-bold text-sm text-center text-zinc-400 group-hover:text-indigo-500 transition-colors">
                  {index + 1}º
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex justify-between items-end text-sm gap-3">
                    <span className={`font-semibold truncate max-w-[150px] md:max-w-[220px] ${isTop3 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {vend.nome || vend.vendedor_nome || "Vendedor Desconhecido"}
                    </span>
                    <span className={`font-bold tracking-tight whitespace-nowrap ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {formatarMoeda(valorReal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-zinc-100 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`rz-grow h-full rounded-full group-hover:opacity-80 transition-opacity
                          ${index === 0 ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' :
                            index === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                            index === 2 ? 'bg-gradient-to-r from-sky-400 to-sky-500' :
                            'bg-zinc-300 dark:bg-zinc-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium w-16 text-right">
                      {vend.pedidos || vend.qtd_pedidos || 0} pedidos
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// Refaz estados e vendedores somando só os canais que estão visíveis
const somarCanaisVisiveis = (lista, canaisVisiveis) => (lista || [])
  .map(item => {
    const canaisDoItem = canaisVisiveis.map(canal => item.porCanal?.[canal.id]).filter(Boolean);
    return {
      ...item,
      valor: canaisDoItem.reduce((acc, c) => acc + c.valor, 0),
      pedidos: canaisDoItem.reduce((acc, c) => acc + c.pedidos, 0)
    };
  })
  .filter(item => item.pedidos > 0)
  .sort((a, b) => b.valor - a.valor);

// ==========================================
// 🚀 TELA PRINCIPAL (DASHBOARD ANALÍTICO)
// ==========================================
export default function DashboardAnalitico() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  // Motor do Hub desativado, ver os blocos "MOTOR DO HUB" abaixo
  // const [fila, setFila] = useState(0);
  // const [statusMotor, setStatusMotor] = useState("conectando");
  const [statusSeller, setStatusSeller] = useState("conectando");
  const [ultimaSyncSeller, setUltimaSyncSeller] = useState(null);

  const [meuTenant, setMeuTenant] = useState("");
  const [canaisOcultos, setCanaisOcultos] = useState([]);

  const obterTenantSeguro = () => {
    if (typeof window === 'undefined') return "rafany";
    try {
      const userRaw = localStorage.getItem("@raizan:user");
      if (userRaw) {
        const userObj = JSON.parse(userRaw);
        if (userObj.tenant_id) return userObj.tenant_id;
        if (userObj.cnpj) return userObj.cnpj;
      }
      const configRaw = localStorage.getItem("raizan_config_geral");
      if (configRaw) {
        const configObj = JSON.parse(configRaw);
        if (configObj.tenantId) return configObj.tenantId;
      }
    } catch(e) {}
    const tenantLegado = localStorage.getItem("@raizan:tenant");
    if (tenantLegado && tenantLegado !== "localhost" && tenantLegado !== "-" && tenantLegado !== "127") return tenantLegado;
    if (process.env.NEXT_PUBLIC_TENANT_ID) return process.env.NEXT_PUBLIC_TENANT_ID;
    return "rafany";
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        const tenantId = obterTenantSeguro();
        setMeuTenant(tenantId);

        const customHeaders = getHeaders();
        customHeaders["x-tenant-id"] = tenantId || 'rafany';

        const res = await fetch(`${getHubUrl()}/api/dashboard/resumo`, { method: "GET", headers: customHeaders });
        const json = await res.json();

        if (json.sucesso) {
          setDados(json);
        }
      } catch (error) {
        console.warn("Status do Dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // MOTOR DO HUB (Oracle local): desativado por enquanto, guardado para um futuro retorno.
  /*
  // 🟢 POLING 1: Fila do Oracle (Mantido Original)
  useEffect(() => {
    async function checarFila() {
      try {
        const tenantId = obterTenantSeguro();
        const customHeaders = getHeaders();
        if(tenantId) customHeaders["x-tenant-id"] = tenantId;
        const res = await fetch(`${getApiUrl()}/api/fila`, { method: "GET", headers: customHeaders });
        const json = await res.json();
        if (json.fila !== undefined) {
          setFila(json.fila);
          setStatusMotor(json.fila > 0 ? "sincronizando" : "online");
        } else { setStatusMotor("erro"); }
      } catch (error) { setStatusMotor("erro"); }
    }
    checarFila();
    const intervalo = setInterval(checarFila, 10000);
    return () => clearInterval(intervalo);
  }, []);
  */

  // 🟢 POLING 2: Status do Omie/CronWorker (Independente)
  useEffect(() => {
    async function checarSeller() {
      try {
        const tenantId = obterTenantSeguro();
        const customHeaders = getHeaders();
        if(tenantId) customHeaders["x-tenant-id"] = tenantId;

        const res = await fetch(`${getHubUrl()}/api/hub/integracoes`, { method: "GET", headers: customHeaders });
        const json = await res.json();

        if (json.success && json.integracoes) {
          const omie = json.integracoes.find(i => i.plataforma === 'omie' && i.status === 'ativo');
          if (omie) {
            setStatusSeller("online");
            try {
              const config = typeof omie.config === 'string' ? JSON.parse(omie.config) : omie.config;
              if (config?.ultima_sync) {
                const dataSync = new Date(config.ultima_sync);
                const formatada = dataSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                setUltimaSyncSeller(formatada);
              }
            } catch(e) {}
          } else {
            setStatusSeller("erro");
          }
        } else {
          setStatusSeller("erro");
        }
      } catch (error) {
        setStatusSeller("erro");
      }
    }
    checarSeller();
    const intervalo = setInterval(checarSeller, 15000);
    return () => clearInterval(intervalo);
  }, []);

  // O filtro de canais vale para a tela inteira. O último canal visível não pode ser desligado.
  const canais = dados?.canais || [];
  const alternarCanal = (canalId) => {
    setCanaisOcultos(prev => {
      if (prev.includes(canalId)) return prev.filter(c => c !== canalId);
      return canais.length - prev.length > 1 ? [...prev, canalId] : prev;
    });
  };

  const visao = useMemo(() => {
    const canaisVisiveis = (dados?.canais || []).filter(canal => !canaisOcultos.includes(canal.id));
    return {
      canais: canaisVisiveis,
      receita: canaisVisiveis.reduce((acc, curr) => acc + curr.valor, 0),
      pedidos: canaisVisiveis.reduce((acc, curr) => acc + curr.pedidos, 0),
      cancelados: Object.entries(dados?.canceladosPorCanal || {}).reduce((acc, [idCanal, qtd]) => (canaisOcultos.includes(idCanal) ? acc : acc + qtd), 0),
      estados: somarCanaisVisiveis(dados?.rankingEstados, canaisVisiveis),
      vendedores: somarCanaisVisiveis(dados?.todosVendedores, canaisVisiveis).slice(0, 10)
    };
  }, [dados, canaisOcultos]);

  const filtrado = canaisOcultos.length > 0;
  const totalPedidosGeral = visao.pedidos;
  const ticketMedio = totalPedidosGeral > 0 ? visao.receita / totalPedidosGeral : 0;

  /* MOTOR DO HUB (Oracle local): desativado
  // 🟢 ESTADOS VISUAIS DO MOTOR ORACLE
  let corMotor = "text-emerald-500 dark:text-emerald-400"; let bgMotor = "bg-emerald-100 dark:bg-emerald-500/10"; let ringStatic = "border-emerald-200 dark:border-emerald-500/20"; let ringSpin = "border-t-emerald-500 dark:border-t-emerald-400"; let animacao = "animate-[spin_4s_linear_infinite]";
  if (statusMotor === "sincronizando") {
    corMotor = "text-blue-500 dark:text-blue-400"; bgMotor = "bg-blue-100 dark:bg-blue-500/10"; ringStatic = "border-blue-200 dark:border-blue-500/20"; ringSpin = "border-t-blue-500 dark:border-t-blue-400"; animacao = "animate-[spin_1s_linear_infinite]";
  } else if (statusMotor === "erro" || statusMotor === "conectando") {
    corMotor = "text-rose-500 dark:text-rose-400"; bgMotor = "bg-rose-100 dark:bg-rose-500/10"; ringStatic = "border-rose-200 dark:border-rose-500/20"; ringSpin = "border-t-rose-500 dark:border-t-rose-400"; animacao = "";
  }
  */

  // 🟢 ESTADOS VISUAIS DO RAIZAN SELLER APP
  let corApp = "text-indigo-600 dark:text-indigo-400";
  let bgApp = "bg-indigo-100 dark:bg-indigo-500/10";
  let dotApp = "bg-emerald-500";
  let dotPing = "bg-emerald-400";
  let textoApp = "Monitorando CRON";
  let subTextoApp = ultimaSyncSeller ? `Última sync: ${ultimaSyncSeller}` : "Aguardando dados...";

  if (statusSeller === "erro") {
    corApp = "text-rose-500 dark:text-rose-400";
    bgApp = "bg-rose-100 dark:bg-rose-500/10";
    dotApp = "bg-rose-500";
    dotPing = "hidden";
    textoApp = "Desconectado";
    subTextoApp = "Verifique a integração";
  }

  return (
    <div className="flex h-[100dvh] bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden w-full transition-colors duration-300 antialiased">
      <style>{ANIM_CSS}</style>
      <Sidebar />
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative w-full">

        {/* Luzes suaves atrás do vidro */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
        </div>

        <Header />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 w-full relative z-10">
          <div className="max-w-7xl w-full mx-auto space-y-6 md:space-y-8">

            {/* Título grande, estilo Apple */}
            <div className="rz-rise flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-2xl md:text-[34px] leading-tight font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex flex-wrap items-center gap-x-3 gap-y-2">
                  Painel de Performance
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap bg-purple-500/10 text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/20">
                    <Database size={11} /> Empresa: {meuTenant || "Desconhecida"}
                  </span>
                </h1>
                <p className="text-sm md:text-[15px] text-zinc-500 dark:text-zinc-400 mt-1.5">Visão unificada de todos os seus canais de venda.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
                <Loader2 size={40} className="animate-spin text-purple-600 dark:text-purple-500 mb-4" />
                <p className="text-sm">Sincronizando painel de controle...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">

                  {/* CARD 1: Receita Bruta */}
                  <Kpi
                    indice={1}
                    cor="emerald"
                    icone={<DollarSign size={20} />}
                    badge={filtrado ? "Canais filtrados" : "Total Omnichannel"}
                    label="Receita Bruta (Mês)"
                    valor={formatarMoeda(visao.receita)}
                  />

                  {/* CARD 2: Pedidos */}
                  <Kpi
                    indice={2}
                    cor="purple"
                    icone={<ShoppingCart size={20} />}
                    label="Total de Pedidos"
                    valor={totalPedidosGeral}
                  />

                  {/* CARD 3: Ticket Médio */}
                  <Kpi
                    indice={3}
                    cor="amber"
                    icone={<Receipt size={20} />}
                    label="Ticket Médio"
                    valor={formatarMoeda(ticketMedio)}
                  />

                  {/* CARD 4: Pedidos Cancelados */}
                  <Kpi
                    indice={4}
                    cor="rose"
                    icone={<Ban size={20} />}
                    label="Pedidos Cancelados"
                    valor={visao.cancelados}
                  />

                  {/* MOTOR DO HUB (Oracle local): desativado por enquanto, guardado para um futuro retorno.
                  <div style={atraso(4)} className={`${CARD} rz-rise group p-5 w-full flex flex-col justify-center hover:-translate-y-0.5`}>
                    <div className="absolute -bottom-4 -right-4 text-zinc-200/70 dark:text-white/[0.04] group-hover:text-zinc-300/70 dark:group-hover:text-white/[0.07] transition-colors">
                      <Database size={84} />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                      <div className={`relative w-12 h-12 shrink-0 rounded-full ${bgMotor} flex items-center justify-center transition-colors duration-500`}>
                        <div className={`absolute inset-0 rounded-full border-2 ${ringStatic}`}></div>
                        {animacao && <div className={`absolute inset-0 rounded-full border-2 border-transparent ${ringSpin} ${animacao}`}></div>}
                        {statusMotor === "erro" ? <AlertTriangle size={16} className={corMotor} /> : <Database size={16} className={corMotor} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{statusMotor === 'sincronizando' ? 'Processando Fila' : 'Motor do Hub'}</p>
                        <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">{statusMotor === 'sincronizando' ? `${fila} itens` : statusMotor === 'erro' ? 'Offline' : 'Online'}</p>
                      </div>
                    </div>
                  </div>
                  */}

                  {/* CARD 5: RAIZAN SELLER APP */}
                  <div style={atraso(5)} className={`${CARD} rz-rise group p-5 w-full flex flex-col justify-center hover:-translate-y-0.5 hover:bg-white dark:hover:bg-[#161619]`}>
                    <div className="absolute -bottom-4 -right-4 text-indigo-500/10 dark:text-indigo-500/10 group-hover:text-indigo-500/15 dark:group-hover:text-indigo-500/20 transition-colors duration-500">
                      <Smartphone size={84} />
                    </div>

                    <div className="flex items-center gap-3.5 relative z-10">
                      <div className={`relative w-12 h-12 shrink-0 rounded-[15px] ${bgApp} flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 group-hover:scale-105 transition-all duration-500`}>
                        {statusSeller === "conectando" ? (
                          <Loader2 size={20} className={`${corApp} animate-spin`} />
                        ) : (
                          <Smartphone size={20} className={corApp} />
                        )}

                        <span className={`absolute -top-1 -right-1 flex h-3 w-3 ${(statusSeller === 'erro' || statusSeller === 'conectando') ? 'hidden' : 'justify-center items-center'}`}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${dotApp} border-2 border-white dark:border-[#121214]`}></span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{textoApp}</p>
                        <p className={`text-base font-bold tracking-tight truncate transition-colors ${statusSeller === 'erro' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                          {subTextoApp}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <div style={atraso(6)} className="rz-rise grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                  <GraficoDinamico dadosGrafico={dados?.graficoVendasDinamico || []} canais={canais} canaisOcultos={canaisOcultos} onAlternarCanal={alternarCanal} />
                  <RankingEstados estados={visao.estados} />
                </div>

                <div style={atraso(7)} className="rz-rise grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mt-6">
                  <VendasPorCanal canais={visao.canais} />
                  <RankingVendedores vendedores={visao.vendedores} filtrado={filtrado} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}