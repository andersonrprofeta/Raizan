"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getHubUrl, getApiUrl, getHeaders } from "@/components/utils/api";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Loader2, Database, AlertTriangle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';

export default function DashboardAnalitico() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fila, setFila] = useState(0);
  const [statusMotor, setStatusMotor] = useState("conectando"); 
  const [meuTenant, setMeuTenant] = useState(""); 

  const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
  const mesFormatado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  // 🟢 NOVA BLINDAGEM: Acha a empresa vasculhando apenas o cache seguro, sem olhar pra URL!
  const obterTenantSeguro = () => {
    if (typeof window === 'undefined') return "rafany";

    // 1. Busca no login novo (@raizan:user)
    try {
      const userRaw = localStorage.getItem("@raizan:user");
      if (userRaw) {
        const userObj = JSON.parse(userRaw);
        if (userObj.tenant_id) return userObj.tenant_id;
        if (userObj.cnpj) return userObj.cnpj;
      }
    } catch(e) {}

    // 2. Busca nas configurações do Wizard (raizan_config_geral)
    try {
      const configRaw = localStorage.getItem("raizan_config_geral");
      if (configRaw) {
        const configObj = JSON.parse(configRaw);
        if (configObj.tenantId) return configObj.tenantId;
      }
    } catch(e) {}

    // 3. Busca no padrão legado (@raizan:tenant)
    const tenantLegado = localStorage.getItem("@raizan:tenant");
    if (tenantLegado && tenantLegado !== "localhost" && tenantLegado !== "-" && tenantLegado !== "127") {
      return tenantLegado;
    }

    // 4. Último recurso (Variável de Ambiente)
    if (process.env.NEXT_PUBLIC_TENANT_ID) {
      return process.env.NEXT_PUBLIC_TENANT_ID;
    }

    return "rafany";
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        const tenantId = obterTenantSeguro();
        setMeuTenant(tenantId); // Salva na tela pra gente ver!

        if(!tenantId) {
          throw new Error("Aguardando identificação do Tenant...");
        }

        const customHeaders = getHeaders();
        customHeaders["x-tenant-id"] = tenantId;

        const res = await fetch(`${getHubUrl()}/api/dashboard/resumo`, {
          method: "GET",
          headers: customHeaders
        });
        
        const json = await res.json();
        if (json.sucesso) setDados(json);
      } catch (error) {
        console.warn("Status do Dashboard:", error.message || error);
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

        const res = await fetch(`${getApiUrl()}/api/fila`, {
          method: "GET",
          headers: customHeaders
        });
        
        if (!res.ok) throw new Error("Sem comunicação com o motor");
        
        const json = await res.json();
        if (json.fila !== undefined) {
          setFila(json.fila);
          setStatusMotor(json.fila > 0 ? "sincronizando" : "online");
        } else {
          setStatusMotor("erro");
        }
      } catch (error) {
        setStatusMotor("erro");
      }
    }
    checarFila(); 
    const intervalo = setInterval(checarFila, 10000); 
    return () => clearInterval(intervalo);
  }, []);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  let corMotor = "text-emerald-500 dark:text-emerald-400";
  let bgMotor = "bg-emerald-100 dark:bg-emerald-500/10";
  let ringStatic = "border-emerald-200 dark:border-emerald-500/20";
  let ringSpin = "border-t-emerald-500 dark:border-t-emerald-400"; 
  let badgeBorder = "border-emerald-300 dark:border-emerald-500/30";
  let animacao = "animate-[spin_4s_linear_infinite]"; 
  let textoPrincipal = "Online e Monitorando";
  let textoBadge = "Espelho de Memória Ativo";

  if (statusMotor === "sincronizando") {
    corMotor = "text-blue-500 dark:text-blue-400"; bgMotor = "bg-blue-100 dark:bg-blue-500/10"; ringStatic = "border-blue-200 dark:border-blue-500/20"; ringSpin = "border-t-blue-500 dark:border-t-blue-400"; badgeBorder = "border-blue-300 dark:border-blue-500/30";
    animacao = "animate-[spin_1s_linear_infinite]"; textoPrincipal = "Processando Fila..."; textoBadge = `${fila} item(ns) pendente(s)`;
  } else if (statusMotor === "erro" || statusMotor === "conectando") {
    corMotor = "text-rose-500 dark:text-rose-400"; bgMotor = "bg-rose-100 dark:bg-rose-500/10"; ringStatic = "border-rose-200 dark:border-rose-500/20"; ringSpin = "border-t-rose-500 dark:border-t-rose-400"; badgeBorder = "border-rose-300 dark:border-rose-500/30";
    animacao = ""; textoPrincipal = statusMotor === "erro" ? "Motor Offline" : "Conectando..."; textoBadge = "Sem comunicação";
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
                {/* 🟢 O RASTREADOR ATUALIZADO PARA "EMPRESA" */}
                <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors flex items-center gap-3">
                  Painel de Performance 
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-500/30 uppercase tracking-widest font-black flex items-center gap-1 shadow-sm">
                    <Database size={10} /> Empresa: {meuTenant || "DESCONHECIDA"}
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Visão omnichannel: WooCommerce e Portal B2B.</p>
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
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 dark:bg-purple-500/5 blur-2xl rounded-full"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 shadow-inner shadow-purple-500/10">
                        <ShoppingCart size={20} className="text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors relative z-10">Pedidos no Woo</p>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 transition-colors relative z-10">{dados?.pedidosWoo || 0}</h3>
                  </div>

                  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors relative overflow-hidden w-full shadow-sm group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/5 blur-2xl rounded-full"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shadow-inner shadow-emerald-500/10">
                        <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors relative z-10">Pedidos Portal B2B</p>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 transition-colors relative z-10">{dados?.pedidosB2B || 0}</h3>
                  </div>

                  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors w-full shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20 shadow-inner shadow-blue-500/10">
                        <Users size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors relative z-10">Clientes Globais</p>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 transition-colors relative z-10">{dados?.novosClientes || 0}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                  
                  {/* GRÁFICO PRINCIPAL DE VENDAS */}
                  <div className="xl:col-span-2 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 md:p-6 w-full flex flex-col shadow-sm transition-colors overflow-hidden relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 relative z-10">
                      <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100 transition-colors">Visão de Vendas ({mesFormatado})</h2>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div><span className="text-zinc-500 dark:text-zinc-400 transition-colors">WooCommerce</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="text-zinc-500 dark:text-zinc-400 transition-colors">Portal B2B</span></div>
                      </div>
                    </div>
                    
                    <div className="w-full min-w-0 relative z-10 mt-4" style={{ height: 260 }}>
                      <ResponsiveContainer width="99%" height={260} minHeight={260}>
                        <AreaChart data={dados?.graficoVendas || []} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="corVendasWoo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="corVendasB2B" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          
                          <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" strokeOpacity={0.15} vertical={false} />
                          
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 10 }} 
                            dy={10} 
                            minTickGap={15} 
                          />
                          
                          <Tooltip 
                            cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{ backgroundColor: '#0c0c0e', borderColor: '#27272a', borderRadius: '12px', color: '#f4f4f5', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', fontSize: '12px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            formatter={(value, name) => [
                              formatarMoeda(value), 
                              <span key={name} className={name === 'vendasWoo' ? 'text-purple-400' : 'text-emerald-400'}>
                                {name === 'vendasWoo' ? 'WooCommerce' : 'Portal B2B'}
                              </span>
                            ]}
                          />
                          
                          <Area type="monotone" dataKey="vendasB2B" name="vendasB2B" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#corVendasB2B)" activeDot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="vendasWoo" name="vendasWoo" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#corVendasWoo)" activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* COLUNA DA DIREITA: APENAS O MOTOR LOCAL (CENTRALIZADO E ELEGANTE) */}
                  <div className="flex flex-col gap-6 h-full">
                    <div className="flex-1 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-center w-full shadow-sm transition-colors relative overflow-hidden h-full">
                      <div className="flex flex-col h-full justify-between">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-wide uppercase transition-colors">Status do Motor</h2>
                        
                        <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                          <div className={`relative w-24 h-24 rounded-full ${bgMotor} flex items-center justify-center transition-colors duration-500 shadow-md border border-white/5`}>
                            <div className={`absolute inset-0 rounded-full border-4 ${ringStatic}`}></div>
                            {animacao && <div className={`absolute inset-0 rounded-full border-4 border-transparent ${ringSpin} ${animacao}`}></div>}
                            {statusMotor === "erro" ? <AlertTriangle size={32} className={`${corMotor} relative z-10 transition-colors`} /> : <Database size={32} className={`${corMotor} relative z-10 transition-colors`} />}
                          </div>
                          
                          <div className="text-center w-full space-y-3">
                            <p className="text-zinc-800 dark:text-zinc-200 font-bold text-xl transition-colors">{textoPrincipal}</p>
                            
                            <div className="flex flex-col items-center gap-3 w-full">
                              <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${corMotor} ${bgMotor} ${badgeBorder}`}>
                                {textoBadge}
                              </span>
                              
                              {fila > 0 && (
                                <div className="flex items-center justify-center gap-2 mt-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 px-5 py-2.5 rounded-xl animate-in fade-in zoom-in-95 w-full max-w-[220px] mx-auto">
                                  <div className="relative flex h-2.5 w-2.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                                  </div>
                                  <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest truncate">Enviando {Math.min(fila, 100)} itens</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}