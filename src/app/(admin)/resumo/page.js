"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getHubUrl, getApiUrl, getHeaders } from "@/components/utils/api";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Loader2, Database, AlertTriangle, MapPin, PieChart as PieChartIcon, Trophy } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

// ==========================================
// 🧩 COMPONENTE 1: GRÁFICO DINÂMICO (COM FILTRO)
// ==========================================
const GraficoDinamico = ({ dadosGrafico, canais }) => {
  const [canaisOcultos, setCanaisOcultos] = useState([]);

  const toggleCanal = (canalId) => {
    setCanaisOcultos(prev => prev.includes(canalId) ? prev.filter(c => c !== canalId) : [...prev, canalId]);
  };

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  if (!dadosGrafico || dadosGrafico.length === 0) {
    return (
      <div className="xl:col-span-2 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 md:p-6 w-full flex items-center justify-center min-h-[300px] shadow-sm text-zinc-400">
        Nenhum dado de venda registrado para o período.
      </div>
    );
  }

  return (
    <div className="xl:col-span-2 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 md:p-6 w-full flex flex-col shadow-sm transition-colors overflow-hidden relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 relative z-10">
        <h2 className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" /> Evolução de Vendas
        </h2>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-medium">
          {canais?.map(canal => (
            <button 
              key={canal.id} 
              onClick={() => toggleCanal(canal.id)}
              className={`flex items-center gap-1.5 transition-all duration-300 hover:scale-105 ${canaisOcultos.includes(canal.id) ? 'opacity-40 grayscale' : 'opacity-100'}`}
            >
              <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: canal.cor }}></div>
              <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]" title={canal.nome}>{canal.nome}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="w-full min-w-0 relative z-10 mt-4" style={{ height: 280 }}>
        <ResponsiveContainer width="99%" height="100%">
          <AreaChart data={dadosGrafico} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
            <defs>
              {canais?.map(canal => (
                <linearGradient key={`grad_${canal.id}`} id={`cor_${canal.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={canal.cor} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={canal.cor} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} dy={10} minTickGap={15} />
            <RechartsTooltip 
              cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ backgroundColor: '#0c0c0e', borderColor: '#27272a', borderRadius: '12px', color: '#f4f4f5', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', fontSize: '12px' }}
              itemStyle={{ fontWeight: 'bold' }}
              formatter={(value, name) => {
                const canal = canais.find(c => c.id === name);
                return [formatarMoeda(value), <span style={{ color: canal?.cor }}>{canal?.nome || name}</span>];
              }}
            />
            {canais?.map(canal => (
              !canaisOcultos.includes(canal.id) && (
                <Area key={canal.id} type="monotone" dataKey={canal.id} name={canal.id} stroke={canal.cor} strokeWidth={2} fillOpacity={1} fill={`url(#cor_${canal.id})`} activeDot={{ r: 5, fill: canal.cor, stroke: "#ffffff", strokeWidth: 2 }} />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==========================================
// 🧩 COMPONENTE 2: VENDAS POR CANAL (DONUT)
// ==========================================
const VendasPorCanal = ({ canais }) => {
  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 w-full shadow-sm relative overflow-hidden flex flex-col h-full min-h-[350px]">
      <h2 className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
        <PieChartIcon size={18} className="text-purple-500" /> Pedidos por integrações
      </h2>
      
      {(!canais || canais.length === 0) ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">Sem integrações ativas</div>
      ) : (
        <>
          <div className="flex-1 w-full min-h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={canais} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="valor">
                  {canais.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value, name, props) => [formatarMoeda(value), props.payload.nome || name]}
                  contentStyle={{ backgroundColor: '#0c0c0e', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-zinc-500">Canais</span>
              <span className="text-lg font-black text-zinc-800 dark:text-zinc-200">{canais.length}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
            {canais.map(canal => (
              <div key={canal.id} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: canal.cor }}></div>
                  <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]" title={canal.nome}>{canal.nome}</span>
                </div>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatarMoeda(canal.valor)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 🧩 COMPONENTE 3: RANKING DE ESTADOS (COM VIDA E TROFÉU!)
// ==========================================
const RankingEstados = ({ estados }) => {
  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  
  const topEstados = estados?.slice(0, 6) || [];
  const maxValor = topEstados.length > 0 ? Math.max(...topEstados.map(e => e.valor)) : 1;

  return (
    <div className="xl:col-span-1 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 w-full shadow-sm relative overflow-hidden flex flex-col h-full min-h-[350px]">
      
      {/* Fundo decorativo sutil */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <h2 className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-6 relative z-10">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
          <MapPin size={16} />
        </div>
        Top Regiões
      </h2>
      
      {!topEstados || topEstados.length === 0 ? (
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
                <div className="flex justify-between items-end text-sm">
                  <span className={`font-bold flex items-center gap-2.5 transition-colors ${isGhost ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    
                    {/* Badge Animado do Número/Troféu */}
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm shrink-0 transition-transform group-hover:scale-110 
                      ${isFirst ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 
                        isGhost ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700' : 
                        'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'}`}
                    >
                      {isFirst ? <Trophy size={12} className="fill-amber-500/20" /> : index + 1}
                    </span>

                    <span className="truncate max-w-[120px]" title={nomeExibicao}>{nomeExibicao}</span>
                  </span>
                  
                  <span className={`font-bold ${isFirst ? 'text-amber-600 dark:text-amber-400' : isGhost ? 'text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {formatarMoeda(uf.valor)}
                  </span>
                </div>
                
                {/* Barra de Progresso em Degradê */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-full h-2 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80
                      ${isFirst ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                        isGhost ? 'bg-zinc-300 dark:bg-zinc-600' : 
                        'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                
                {uf.pedidos && (
                   <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right leading-none font-medium">{uf.pedidos} pedidos gerados</p>
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
// 🚀 TELA PRINCIPAL (DASHBOARD ANALÍTICO)
// ==========================================
export default function DashboardAnalitico() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fila, setFila] = useState(0);
  const [statusMotor, setStatusMotor] = useState("conectando"); 
  const [meuTenant, setMeuTenant] = useState(""); 

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

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  // Status do Motor Visual
  let corMotor = "text-emerald-500 dark:text-emerald-400"; let bgMotor = "bg-emerald-100 dark:bg-emerald-500/10"; let ringStatic = "border-emerald-200 dark:border-emerald-500/20"; let ringSpin = "border-t-emerald-500 dark:border-t-emerald-400"; let badgeBorder = "border-emerald-300 dark:border-emerald-500/30"; let animacao = "animate-[spin_4s_linear_infinite]"; let textoPrincipal = "Online e Monitorando"; let textoBadge = "Espelho de Memória Ativo";
  if (statusMotor === "sincronizando") {
    corMotor = "text-blue-500 dark:text-blue-400"; bgMotor = "bg-blue-100 dark:bg-blue-500/10"; ringStatic = "border-blue-200 dark:border-blue-500/20"; ringSpin = "border-t-blue-500 dark:border-t-blue-400"; badgeBorder = "border-blue-300 dark:border-blue-500/30"; animacao = "animate-[spin_1s_linear_infinite]"; textoPrincipal = "Processando Fila..."; textoBadge = `${fila} item(ns) pendente(s)`;
  } else if (statusMotor === "erro" || statusMotor === "conectando") {
    corMotor = "text-rose-500 dark:text-rose-400"; bgMotor = "bg-rose-100 dark:bg-rose-500/10"; ringStatic = "border-rose-200 dark:border-rose-500/20"; ringSpin = "border-t-rose-500 dark:border-t-rose-400"; badgeBorder = "border-rose-300 dark:border-rose-500/30"; animacao = ""; textoPrincipal = statusMotor === "erro" ? "Motor Offline" : "Conectando..."; textoBadge = "Sem comunicação";
  }

  return (
    <div className="flex h-[100dvh] bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden w-full transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative w-full">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 w-full">
          <div className="max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors flex items-center gap-3">
                  Painel de Performance 
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-500/30 uppercase tracking-widest font-black flex items-center gap-1 shadow-sm">
                    <Database size={10} /> Empresa: {meuTenant || "DESCONHECIDA"}
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Visão unificada de todos os seus canais de venda.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
                <Loader2 size={40} className="animate-spin text-purple-600 dark:text-purple-500 mb-4" />
                <p className="text-sm">Sincronizando painel de controle...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors w-full shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                        <TrendingUp size={12} /> Total Omnichannel
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors relative z-10">Receita Bruta (Mês)</p>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 truncate transition-colors relative z-10">{formatarMoeda(dados?.receitaTotal)}</h3>
                  </div>

                  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors relative overflow-hidden w-full shadow-sm group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 shadow-inner shadow-purple-500/10">
                        <ShoppingCart size={20} className="text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors relative z-10">Total de Pedidos</p>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 transition-colors relative z-10">
                      {dados?.canais?.reduce((acc, curr) => acc + curr.pedidos, 0) || 0}
                    </h3>
                  </div>

                  {/* 🟢 O RETORNO DOS NOVOS CLIENTES */}
                  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors relative overflow-hidden w-full shadow-sm group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20 shadow-inner shadow-blue-500/10">
                        <Users size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors relative z-10">Novos Clientes</p>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 transition-colors relative z-10">{dados?.novosClientes || 0}</h3>
                  </div>

                  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 w-full shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <div className={`relative w-12 h-12 shrink-0 rounded-full ${bgMotor} flex items-center justify-center transition-colors duration-500 border border-white/5`}>
                        <div className={`absolute inset-0 rounded-full border-2 ${ringStatic}`}></div>
                        {animacao && <div className={`absolute inset-0 rounded-full border-2 border-transparent ${ringSpin} ${animacao}`}></div>}
                        {statusMotor === "erro" ? <AlertTriangle size={16} className={`${corMotor}`} /> : <Database size={16} className={`${corMotor}`} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{statusMotor === 'sincronizando' ? 'Processando Fila' : 'Status do Motor'}</p>
                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{statusMotor === 'sincronizando' ? `${fila} itens` : statusMotor === 'erro' ? 'Offline' : 'Online'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                  <GraficoDinamico dadosGrafico={dados?.graficoVendasDinamico || []} canais={dados?.canais || []} />
                  <RankingEstados estados={dados?.rankingEstados || []} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch mt-6">
                  <VendasPorCanal canais={dados?.canais || []} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}