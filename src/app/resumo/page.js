"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getApiUrl } from "@/components/utils/api";
import { TrendingUp, Users, ShoppingCart, DollarSign, Activity, Package, Loader2, Database, AlertTriangle } from "lucide-react";
// ⚠️ IMPORTANTE: Mudamos as ferramentas do Recharts aqui para AreaChart!
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
  let corMotor = "text-emerald-400";
  let bgMotor = "bg-emerald-500/10";
  let ringStatic = "border-emerald-500/20";
  let ringSpin = "border-t-emerald-400"; 
  let badgeBorder = "border-emerald-500/30";
  let animacao = "animate-[spin_4s_linear_infinite]"; 
  let textoPrincipal = "Online e Monitorando";
  let textoBadge = "Espelho de Memória Ativo";

  if (statusMotor === "sincronizando") {
    corMotor = "text-blue-400"; bgMotor = "bg-blue-500/10"; ringStatic = "border-blue-500/20"; ringSpin = "border-t-blue-400"; badgeBorder = "border-blue-500/30";
    animacao = "animate-[spin_1s_linear_infinite]"; textoPrincipal = "Processando Fila..."; textoBadge = `${fila} item(ns) pendente(s)`;
  } else if (statusMotor === "erro" || statusMotor === "conectando") {
    corMotor = "text-red-400"; bgMotor = "bg-red-500/10"; ringStatic = "border-red-500/20"; ringSpin = "border-t-red-400"; badgeBorder = "border-red-500/30";
    animacao = ""; textoPrincipal = statusMotor === "erro" ? "Motor Offline" : "Conectando..."; textoBadge = "Sem comunicação";
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-24">
          <div className="max-w-7xl w-full mx-auto space-y-8">
            
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Painel de Performance</h1>
              <p className="text-sm text-zinc-400 mt-1">Visão geral do sistema e indicadores reais do WooCommerce.</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <Loader2 size={40} className="animate-spin text-purple-500 mb-4" />
                <p>Sincronizando painel de controle...</p>
              </div>
            ) : (
              <>
                {/* CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-800/40 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign size={20} className="text-emerald-400" />
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                        <TrendingUp size={12} /> Real
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Receita Bruta (Mês)</p>
                    <h3 className="text-2xl font-bold text-zinc-100 mt-1">{formatarMoeda(dados?.receitaMes)}</h3>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-800/40 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <ShoppingCart size={20} className="text-purple-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Pedidos no Woo</p>
                    <h3 className="text-2xl font-bold text-zinc-100 mt-1">{dados?.pedidosMes || 0}</h3>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-800/40 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Users size={20} className="text-blue-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Clientes Únicos</p>
                    <h3 className="text-2xl font-bold text-zinc-100 mt-1">{dados?.novosClientes || 0}</h3>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 hover:bg-zinc-800/40 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Activity size={20} className="text-orange-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Sincronizações Hoje</p>
                    <h3 className="text-2xl font-bold text-zinc-100 mt-1">{dados?.sincronizacoesHoje || 0}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* O NOVO GRÁFICO DE ÁREA (LINHA DO TEMPO) */}
                  <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-base font-semibold text-zinc-100">Visão de Vendas ({mesFormatado})</h2>
                    </div>
                    
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dados?.graficoVendas || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="corVendas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          
                          {/* Grade de fundo discreta */}
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          
                          {/* Eixo X com as datas */}
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 11 }} 
                            dy={10} 
                            minTickGap={20} // Evita que as datas fiquem espremidas
                          />
                          
                          <Tooltip 
                            cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                            itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
                            formatter={(value) => [formatarMoeda(value), 'Vendas']}
                          />
                          
                          {/* A Linha principal e o preenchimento de área */}
                          <Area 
                            type="monotone" 
                            dataKey="vendas" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#corVendas)" 
                            activeDot={{ r: 6, fill: "#c4b5fd", stroke: "#09090b", strokeWidth: 2 }} // Bolinha charmosa ao passar o mouse
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* STATUS DO MOTOR */}
                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-100 mb-6">Status do Motor</h2>
                      <div className="flex flex-col items-center justify-center h-40 space-y-4">
                        <div className={`relative w-20 h-20 rounded-full ${bgMotor} flex items-center justify-center transition-colors duration-500`}>
                          <div className={`absolute inset-0 rounded-full border-4 ${ringStatic}`}></div>
                          {animacao && <div className={`absolute inset-0 rounded-full border-4 border-transparent ${ringSpin} ${animacao}`}></div>}
                          {statusMotor === "erro" ? <AlertTriangle size={32} className={`${corMotor} relative z-10`} /> : <Database size={32} className={`${corMotor} relative z-10`} />}
                        </div>
                        <p className="text-zinc-200 font-medium text-lg transition-colors">{textoPrincipal}</p>
                        <span className={`text-xs px-3 py-1 rounded-full border transition-colors ${corMotor} ${bgMotor} ${badgeBorder}`}>
                          {textoBadge}
                        </span>
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