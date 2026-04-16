"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getApiUrl } from "@/components/utils/api";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Loader2, Database, AlertTriangle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';

export default function DashboardAnalitico() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fila, setFila] = useState(0);
  const [statusMotor, setStatusMotor] = useState("conectando"); 

  // Pega o nome do mês atual para exibir no título (Ex: "Março")
  const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
  const mesFormatado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  useEffect(() => {
    async function carregarDados() {
      try {
        const res = await fetch(`${getApiUrl()}/api/dashboard/resumo`);
        const json = await res.json();
        if (json.sucesso) setDados(json);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  useEffect(() => {
    async function checarFila() {
      try {
        const res = await fetch(`${getApiUrl()}/api/fila`);
        const json = await res.json();
        if (json.fila !== undefined) {
          setFila(json.fila);
          setStatusMotor(json.fila > 0 ? "sincronizando" : "online");
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

  // Cores do Motor
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
    // Usamos h-[100dvh] para ficar perfeito em celulares (ignora a barra de endereço do mobile)
    <div className="flex h-[100dvh] bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden w-full transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative w-full">
        <Header />
        
        {/* Adicionado p-4 para mobile e md:p-8 para desktop */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 w-full">
          <div className="max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Painel de Performance</h1>
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
                {/* CARDS OMNICHANNEL - Responsivos com grid-cols-1 no mobile, sm:2 e xl:4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  
                  {/* CARD 1: RECEITA TOTAL */}
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors w-full shadow-sm dark:shadow-none">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                        <TrendingUp size={12} /> Total Omnichannel
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors">Receita Bruta (Mês)</p>
                    <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate transition-colors">{formatarMoeda(dados?.receitaTotal)}</h3>
                  </div>

                  {/* CARD 2: WOOCOMMERCE */}
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors relative overflow-hidden w-full shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 dark:bg-purple-500/5 blur-2xl rounded-full"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 shadow-inner shadow-purple-500/10">
                        <ShoppingCart size={20} className="text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors">Pedidos no Woo</p>
                    <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 transition-colors">{dados?.pedidosWoo || 0}</h3>
                  </div>

                  {/* CARD 3: PORTAL B2B */}
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors relative overflow-hidden w-full shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/5 blur-2xl rounded-full"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shadow-inner shadow-emerald-500/10">
                        <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors">Pedidos Portal B2B</p>
                    <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 transition-colors">{dados?.pedidosB2B || 0}</h3>
                  </div>

                  {/* CARD 4: CLIENTES ÚNICOS */}
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors w-full shadow-sm dark:shadow-none">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20 shadow-inner shadow-blue-500/10">
                        <Users size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors">Clientes Globais</p>
                    <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 transition-colors">{dados?.novosClientes || 0}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* GRÁFICO DUPLO (ROXO WOO E VERDE B2B) */}
                  <div className="xl:col-span-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-4 md:p-6 w-full overflow-hidden shadow-sm dark:shadow-none transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100 transition-colors">Visão de Vendas ({mesFormatado})</h2>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div><span className="text-zinc-500 dark:text-zinc-400 transition-colors">WooCommerce</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="text-zinc-500 dark:text-zinc-400 transition-colors">Portal B2B</span></div>
                      </div>
                    </div>
                    
                    <div className="h-56 md:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dados?.graficoVendas || []} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
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
                          
                          {/* Dica do Grid: Usando strokeOpacity para ficar bom em light e dark mode */}
                          <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" strokeOpacity={0.2} vertical={false} />
                          
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 10 }} 
                            dy={10} 
                            minTickGap={15} 
                          />
                          
                          {/* Tooltip super premium formatado para mobile */}
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
                          
                          {/* A Onda Verde (B2B) */}
                          <Area 
                            type="monotone" dataKey="vendasB2B" name="vendasB2B"
                            stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#corVendasB2B)" 
                            activeDot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }} 
                          />
                          
                          {/* A Onda Roxa (Woo) por cima */}
                          <Area 
                            type="monotone" dataKey="vendasWoo" name="vendasWoo"
                            stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#corVendasWoo)" 
                            activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2 }} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* STATUS DO MOTOR */}
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 flex flex-col justify-between w-full h-full min-h-[250px] shadow-sm dark:shadow-none transition-colors">
                    <div className="flex flex-col h-full">
                      <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6 transition-colors">Status do Motor</h2>
                      <div className="flex flex-col items-center justify-center flex-1 space-y-5">
                        <div className={`relative w-20 h-20 rounded-full ${bgMotor} flex items-center justify-center transition-colors duration-500 shadow-xl`}>
                          <div className={`absolute inset-0 rounded-full border-4 ${ringStatic}`}></div>
                          {animacao && <div className={`absolute inset-0 rounded-full border-4 border-transparent ${ringSpin} ${animacao}`}></div>}
                          {statusMotor === "erro" ? <AlertTriangle size={32} className={`${corMotor} relative z-10 transition-colors`} /> : <Database size={32} className={`${corMotor} relative z-10 transition-colors`} />}
                        </div>
                        <div className="text-center">
                          <p className="text-zinc-800 dark:text-zinc-200 font-medium md:text-lg transition-colors">{textoPrincipal}</p>
                          <span className={`inline-block mt-2 text-[10px] md:text-xs px-3 py-1 rounded-full border transition-colors ${corMotor} ${bgMotor} ${badgeBorder}`}>
                            {textoBadge}
                          </span>
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