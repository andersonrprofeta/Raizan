//essa página usa o controller desempenhoVendedorController para buscar os dados do relatório de vendas do vendedor selecionado. Ela exibe KPIs, gráficos e tabelas com informações detalhadas sobre o desempenho comercial do vendedor, incluindo faturamento, quantidade de pedidos, evolução diária, faturamento por marca e cidade, além de listas dos top produtos e clientes faturados. A página também permite a exportação do relatório em PDF (em desenvolvimento) e a visualização expandida dos gráficos.

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Users, UserPlus, UserCheck, AlertTriangle, 
  MapPin, ShoppingBag, Award, CalendarDays,
  Download, Maximize2, X, RefreshCw
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Line, ComposedChart,
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";
import { getHubUrl, getHeaders } from "@/components/utils/api";

const CORES_RESERVA = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#8b5cf6", "#14b8a6"];

// ==========================================
// COMPONENTES MENORES
// ==========================================

// 🟢 NOVO TOOLTIP: Mostra Dinheiro e Quantidade!
const CustomTooltipComposed = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-3 rounded-xl shadow-xl min-w-[160px]">
        <p className="text-zinc-300 text-xs font-bold mb-2 border-b border-zinc-700 pb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4 mb-1">
            <span style={{ color: item.color }} className="text-xs font-bold uppercase">
              {item.name === 'valor' ? 'Faturamento' : 'Pedidos (Qtd)'}
            </span>
            <span className="text-white font-black text-sm">
              {item.name === 'valor' ? `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length && payload[0].value !== undefined) {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-3 rounded-xl shadow-xl">
        <p className="text-zinc-300 text-xs font-bold mb-1">{label}</p>
        <p className="text-white font-black text-sm">
          R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const CardKPI = ({ titulo, valor, icon: Icon, bdClass, txtClass, icnClass, valClass }) => (
  <div className={`bg-white dark:bg-[#121214] border rounded-xl p-4 shadow-sm flex flex-col justify-between ${bdClass}`}>
    <div className="flex justify-between items-start mb-2">
      <span dangerouslySetInnerHTML={{ __html: titulo }} className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${txtClass}`} />
      <Icon size={16} className={icnClass} />
    </div>
    <h3 className={`text-xl sm:text-2xl font-black ${valClass}`}>{valor}</h3>
  </div>
);

const GraficoContainer = ({ titulo, icon: Icon, icnClass, onExpand, extraHead, children, isDonut }) => (
  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm group flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <Icon size={18} className={icnClass}/> {titulo}
      </h4>
      <div className="flex items-center gap-3">
        {extraHead}
        {onExpand && (
          <button onClick={onExpand} className="text-zinc-400 hover:text-blue-500 transition-colors p-1 opacity-0 group-hover:opacity-100" title="Expandir">
            <Maximize2 size={16} />
          </button>
        )}
      </div>
    </div>
    <div className={`w-full ${isDonut ? 'flex-1' : 'h-[250px]'}`}>
      {children}
    </div>
  </div>
);

const TabelaContainer = ({ titulo, icon: Icon, icnClass, thead, tbody }) => (
  <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
    <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
      <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <Icon size={18} className={icnClass}/> {titulo}
      </h4>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-zinc-50 dark:bg-[#0c0c0e] text-xs uppercase text-zinc-500">
          <tr>{thead}</tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {tbody}
        </tbody>
      </table>
    </div>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function TabVisaoGeral({ vendedor }) {
  const [graficoExpandido, setGraficoExpandido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState(null);

  useEffect(() => {
    async function carregarDadosRelatorio() {
      if (!vendedor?.id) return;

      setLoading(true);
      try {
        const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
        const res = await fetch(`${getHubUrl()}/api/hub/vendedores/${vendedor.id}/relatorio?tenant_id=${tenant_id}`, {
          headers: getHeaders()
        });
        const data = await res.json();

        if (data.success && data.relatorio) {
          setDados(data.relatorio);
        } else {
          toast.error("Erro ao carregar dados do ERP.");
          setDados(null);
        }
      } catch (error) {
        console.error("Erro ao comunicar com a API do Relatório:", error);
        toast.error("Falha de conexão com o Servidor.");
        setDados(null);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosRelatorio();
  }, [vendedor]);

  const handleExportarPDF = () => {
    toast.success("Módulo de PDF em desenvolvimento.");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-blue-500" />
        <p className="font-bold uppercase tracking-widest text-xs">Analisando Vendas no ERP...</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500 text-center">
        <AlertTriangle size={32} className="mb-4 text-rose-500" />
        <p className="font-bold uppercase tracking-widest text-sm text-zinc-900 dark:text-white">Nenhum dado encontrado</p>
        <p className="text-xs mt-2">O vendedor não possui histórico de vendas ou ocorreu um erro.</p>
      </div>
    );
  }

  const { 
    carteiraKPIs = { totalBase: 0, atendidosMes: 0, novosMes: 0, positivados: 0, inativos: 0 }, 
    vendasGeralMensal = [], 
    vendasDiarias = [], 
    vendasPorMarca = [], 
    vendasPorCidade = [], 
    topProdutos = [], 
    topClientes = [] 
  } = dados;

  const renderGrafico = (id) => {
    switch (id) {
      case 'mensal':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={vendasGeralMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.3} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
              
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `R$${val/1000}k`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              
              <Tooltip content={<CustomTooltipComposed />} cursor={{ fill: 'transparent' }} />
              
              <Bar yAxisId="left" dataKey="valor" radius={[6, 6, 0, 0]} fill="#3b82f6" fillOpacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="pedidos" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'diario':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={vendasDiarias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.3} />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
              
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `R$${val/1000}k`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              
              <Tooltip content={<CustomTooltipComposed />} />
              
              <Area yAxisId="left" type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
              <Line yAxisId="right" type="monotone" dataKey="pedidos" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'marca':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={vendasPorMarca} innerRadius={graficoExpandido ? 120 : 60} outerRadius={graficoExpandido ? 160 : 80} paddingAngle={5} dataKey="value" stroke="none">
                {vendasPorMarca.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || CORES_RESERVA[index % CORES_RESERVA.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'cidade':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={vendasPorCidade} margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.3} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis dataKey="cidade" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} width={80} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="valor" fill="#10b981" radius={[0, 6, 6, 0]} barSize={graficoExpandido ? 40 : 20} />
            </BarChart>
          </ResponsiveContainer>
        );
      default: return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      
      {/* CABEÇALHO */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Desempenho Comercial</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Relatório de vendas de {vendedor?.nome || 'Vendedor'}.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-zinc-50 dark:bg-[#0c0c0e]/50 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-500"/> Mês Atual
          </div>
          <button onClick={handleExportarPDF} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* KPIS DE CARTEIRA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <CardKPI titulo="Total<br/>Base" valor={carteiraKPIs.totalBase} icon={Users} bdClass="border-zinc-200 dark:border-zinc-800" txtClass="text-zinc-500" icnClass="text-zinc-400" valClass="text-zinc-900 dark:text-white" />
        <CardKPI titulo="Atendidos<br/>(Mês)" valor={carteiraKPIs.atendidosMes} icon={ShoppingBag} bdClass="border-blue-200 dark:border-blue-500/30" txtClass="text-blue-600/70 dark:text-blue-400/70" icnClass="text-blue-500" valClass="text-blue-600 dark:text-blue-400" />
        <CardKPI titulo="Novos<br/>Clientes" valor={`+${carteiraKPIs.novosMes}`} icon={UserPlus} bdClass="border-emerald-200 dark:border-emerald-500/30" txtClass="text-emerald-600/70 dark:text-emerald-400/70" icnClass="text-emerald-500" valClass="text-emerald-600 dark:text-emerald-400" />
        <CardKPI titulo="Clientes<br/>Positivados" valor={carteiraKPIs.positivados} icon={UserCheck} bdClass="border-purple-200 dark:border-purple-500/30" txtClass="text-purple-600/70 dark:text-purple-400/70" icnClass="text-purple-500" valClass="text-purple-600 dark:text-purple-400" />
        <CardKPI titulo="Inativos<br/>> 60 dias" valor={carteiraKPIs.inativos} icon={AlertTriangle} bdClass="border-rose-200 dark:border-rose-500/30" txtClass="text-rose-600/70 dark:text-rose-400/70" icnClass="text-rose-500" valClass="text-rose-600 dark:text-rose-400" />
      </div>

      {/* GRÁFICOS */}
      <div className="flex flex-col gap-6">
        <GraficoContainer 
          titulo="Faturamento vs Quantidade (Últimos 6 meses)" 
          icon={TrendingUp} icnClass="text-blue-500" 
          onExpand={() => setGraficoExpandido('mensal')}
          extraHead={
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1 text-blue-500"><div className="w-2 h-2 bg-blue-500 rounded-sm"></div> Faturamento</span>
              <span className="flex items-center gap-1 text-amber-500"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Pedidos</span>
            </div>
          }
        >
          {renderGrafico('mensal')}
        </GraficoContainer>

        <GraficoContainer 
          titulo="Evolução Diária (Mês Atual)" 
          icon={CalendarDays} icnClass="text-indigo-500" 
          onExpand={() => setGraficoExpandido('diario')}
          extraHead={
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1 text-indigo-500"><div className="w-2 h-2 bg-indigo-500 rounded-sm"></div> Faturamento</span>
              <span className="flex items-center gap-1 text-amber-500"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Pedidos</span>
            </div>
          }
        >
          {renderGrafico('diario')}
        </GraficoContainer>

        <GraficoContainer titulo="Faturamento por Marca (NFE Emitida)" icon={Award} icnClass="text-amber-500" onExpand={() => setGraficoExpandido('marca')} isDonut>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-[200px]">
            <div className="h-full w-full sm:w-[200px] shrink-0">
               {renderGrafico('marca')}
            </div>
            <div className="w-full grid grid-cols-2 gap-3 sm:block sm:space-y-3 overflow-y-auto custom-scrollbar pr-2 h-full">
              {vendasPorMarca.map((marca, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-zinc-50 dark:bg-zinc-800/30 p-2 sm:p-0 sm:bg-transparent rounded-lg sm:rounded-none">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: marca.color || CORES_RESERVA[i % CORES_RESERVA.length] }}></div>
                    <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[100px]">{marca.name}</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white shrink-0">R$ {(marca.value/1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </GraficoContainer>

        <GraficoContainer titulo="Mapa de Calor (Faturamento por Cidade)" icon={MapPin} icnClass="text-emerald-500" onExpand={() => setGraficoExpandido('cidade')}>
          {renderGrafico('cidade')}
        </GraficoContainer>
      </div>

      {/* TABELAS */}
      <div className="flex flex-col gap-6 mt-6">
        <TabelaContainer 
          titulo="Curva A - Top Produtos Faturados" icon={ShoppingBag} icnClass="text-purple-500"
          thead={
            <>
              <th className="px-5 py-3 font-bold">Produto</th>
              <th className="px-5 py-3 font-bold text-center">Qtd Vendida</th>
              <th className="px-5 py-3 font-bold text-right">Faturamento Real</th>
            </>
          }
          tbody={
            topProdutos.map((prod, i) => (
              <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]" title={prod.nome}>{prod.nome}</td>
                <td className="px-5 py-4 text-center text-zinc-500 dark:text-zinc-400">{prod.qtd}</td>
                <td className="px-5 py-4 text-right font-bold text-purple-600 dark:text-purple-400">R$ {prod.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))
          }
        />

        <TabelaContainer 
          titulo="Top Clientes Faturados (Mês)" icon={Users} icnClass="text-orange-500"
          thead={
            <>
              <th className="px-5 py-3 font-bold">Cliente</th>
              <th className="px-5 py-3 font-bold text-center">Qtd Pedidos</th>
              <th className="px-5 py-3 font-bold text-right">Faturamento Real</th>
            </>
          }
          tbody={
            topClientes.map((cli, idx) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-zinc-200 text-zinc-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-zinc-800 text-zinc-400'}`}>
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[150px]" title={cli.nome}>{cli.nome}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-center text-zinc-500 dark:text-zinc-400">{cli.pedidos}</td>
                <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">R$ {cli.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))
          }
        />
      </div>

      {/* MODAL TELA CHEIA */}
      <AnimatePresence>
        {graficoExpandido && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full h-full max-h-screen shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">Visualização Expandida</h3>
                <button onClick={() => setGraficoExpandido(null)} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 p-8">
                {renderGrafico(graficoExpandido)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}