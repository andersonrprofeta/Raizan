"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Users, UserPlus, UserCheck, AlertTriangle, 
  MapPin, ShoppingBag, DollarSign, Award, CalendarDays,
  Download, Maximize2, X
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";

// 🟢 MOCKS: DADOS DO ERP OMIE
const carteiraKPIs = {
  totalBase: 154,
  atendidosMes: 89,
  novosMes: 12,
  positivados: 65,
  inativos: 23 // > 60 dias
};

const vendasGeralMensal = [
  { mes: "Mar", valor: 42000 },
  { mes: "Abr", valor: 55000 },
  { mes: "Mai", valor: 48000 },
  { mes: "Jun", valor: 61000 },
  { mes: "Jul", valor: 59000 },
  { mes: "Ago", valor: 74500 },
];

const vendasDiarias = [
  { dia: "01", valor: 1200 }, { dia: "05", valor: 3500 },
  { dia: "10", valor: 2800 }, { dia: "15", valor: 5100 },
  { dia: "20", valor: 4200 }, { dia: "25", valor: 6800 },
  { dia: "30", valor: 8500 },
];

const vendasPorMarca = [
  { name: "Wella Prof.", value: 35000, color: "#4f46e5" }, // Indigo
  { name: "Truss Hair", value: 25000, color: "#10b981" },  // Emerald
  { name: "L'Oréal", value: 15000, color: "#f59e0b" },     // Amber
  { name: "Kérastase", value: 10000, color: "#ec4899" },   // Pink
  { name: "Outros", value: 5000, color: "#6366f1" },       // Indigo Light
];

const vendasPorCidade = [
  { cidade: "Goiânia", valor: 45000 },
  { cidade: "Aparecida de G.", valor: 22000 },
  { cidade: "Anápolis", valor: 15000 },
  { cidade: "Senador Canedo", valor: 8000 },
];

const topProdutos = [
  { id: 1, nome: "Kit Wella Fusion Profissional", qtd: 45, valor: 12500, margem: "35%" },
  { id: 2, nome: "Truss Net Mask 500g", qtd: 120, valor: 9800, margem: "42%" },
  { id: 3, nome: "L'Oréal Absolut Repair Shampoo", qtd: 85, valor: 7600, margem: "38%" },
];

const topClientes = [
  { id: 1, nome: "Salão Beleza Pura", pedidos: 4, valor: 8500, ticket: 2125 },
  { id: 2, nome: "Studio Hair Design", pedidos: 2, valor: 5200, ticket: 2600 },
  { id: 3, nome: "Barbearia do Zé", pedidos: 6, valor: 4800, ticket: 800 },
];

// Tooltip Customizado para os Gráficos
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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

export default function TabVisaoGeral({ vendedor }) {
  // Estado para controlar o modal de tela cheia dos gráficos
  const [graficoExpandido, setGraficoExpandido] = useState(null);

  const handleExportarPDF = () => {
    const toastId = toast.loading("Gerando PDF do relatório...");
    setTimeout(() => {
      toast.success("Relatório baixado com sucesso!", { id: toastId });
      // Lógica real de exportação entra aqui (ex: jsPDF, html2canvas)
    }, 2000);
  };

  // Função para não repetir o código do gráfico na tela cheia
  const renderGrafico = (id) => {
    switch (id) {
      case 'mensal':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendasGeralMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.3} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {vendasGeralMensal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === vendasGeralMensal.length - 1 ? "#3b82f6" : "#3b82f640"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'diario':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={vendasDiarias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.3} />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'marca':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={vendasPorMarca} innerRadius={graficoExpandido ? 120 : 60} outerRadius={graficoExpandido ? 160 : 80} paddingAngle={5} dataKey="value" stroke="none">
                {vendasPorMarca.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 pb-10"
    >
      {/* 🟢 CABEÇALHO DO RELATÓRIO */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Desempenho Comercial</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Relatório de vendas e carteira sincronizado.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-zinc-50 dark:bg-[#0c0c0e]/50 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-500"/> Agosto 2026
          </div>
          <button 
            onClick={handleExportarPDF}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* 🟢 KPIS DE CARTEIRA DE CLIENTES (Design Harmonizado e Compacto) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-tight">Total<br/>Base</span>
            <Users size={16} className="text-zinc-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">{carteiraKPIs.totalBase}</h3>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider leading-tight">Atendidos<br/>(Mês)</span>
            <ShoppingBag size={16} className="text-blue-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{carteiraKPIs.atendidosMes}</h3>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider leading-tight">Novos<br/>Clientes</span>
            <UserPlus size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">+{carteiraKPIs.novosMes}</h3>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-purple-200 dark:border-purple-500/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider leading-tight">Clientes<br/>Positivados</span>
            <UserCheck size={16} className="text-purple-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">{carteiraKPIs.positivados}</h3>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-rose-200 dark:border-rose-500/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-wider leading-tight">Inativos<br/>{'>'} 60 dias</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{carteiraKPIs.inativos}</h3>
        </div>
      </div>

      {/* 🟢 GRÁFICOS EMPILHADOS VERTICALMENTE (MELHOR PARA OFFCANVAS) */}
      <div className="flex flex-col gap-6">
        
        {/* Gráfico 1: Mensal (Barras) */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm group">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500"/> Faturamento Mensal (Últimos 6 meses)
            </h4>
            <button onClick={() => setGraficoExpandido('mensal')} className="text-zinc-400 hover:text-blue-500 transition-colors p-1 opacity-0 group-hover:opacity-100" title="Expandir">
              <Maximize2 size={16} />
            </button>
          </div>
          <div className="h-[250px] w-full">
            {renderGrafico('mensal')}
          </div>
        </div>

        {/* Gráfico 2: Diário (Área) */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm group">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <CalendarDays size={18} className="text-indigo-500"/> Vendas Diárias (Mês Atual)
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md font-bold">Média: R$ 4.2K/dia</span>
              <button onClick={() => setGraficoExpandido('diario')} className="text-zinc-400 hover:text-indigo-500 transition-colors p-1 opacity-0 group-hover:opacity-100" title="Expandir">
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
          <div className="h-[250px] w-full">
             {renderGrafico('diario')}
          </div>
        </div>

        {/* Gráfico 3: Marcas (Donut) */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col group">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-amber-500"/> Faturamento por Marca
            </h4>
            <button onClick={() => setGraficoExpandido('marca')} className="text-zinc-400 hover:text-amber-500 transition-colors p-1 opacity-0 group-hover:opacity-100" title="Expandir">
              <Maximize2 size={16} />
            </button>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-[200px] w-full sm:w-[200px] shrink-0">
               {renderGrafico('marca')}
            </div>
            <div className="w-full grid grid-cols-2 gap-3 sm:block sm:space-y-3">
              {vendasPorMarca.map((marca, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-zinc-50 dark:bg-zinc-800/30 p-2 sm:p-0 sm:bg-transparent rounded-lg sm:rounded-none">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: marca.color }}></div>
                    <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[100px]">{marca.name}</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">R$ {(marca.value/1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico 4: Cidades (Barras Horizontais) */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm group">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <MapPin size={18} className="text-emerald-500"/> Mapa de Calor (Cidades)
            </h4>
            <button onClick={() => setGraficoExpandido('cidade')} className="text-zinc-400 hover:text-emerald-500 transition-colors p-1 opacity-0 group-hover:opacity-100" title="Expandir">
              <Maximize2 size={16} />
            </button>
          </div>
          <div className="h-[250px] w-full">
            {renderGrafico('cidade')}
          </div>
        </div>

      </div>

      {/* 🟢 TABELAS: TOP PRODUTOS E RANKING DE CLIENTES (Empilhadas) */}
      <div className="flex flex-col gap-6 mt-6">
        
        {/* TOP PRODUTOS */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-purple-500"/> Curva A - Top Produtos
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-[#0c0c0e] text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Produto</th>
                  <th className="px-5 py-3 font-bold text-center">Qtd</th>
                  <th className="px-5 py-3 font-bold text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {topProdutos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{prod.nome}</td>
                    <td className="px-5 py-4 text-center text-zinc-500 dark:text-zinc-400">{prod.qtd}</td>
                    <td className="px-5 py-4 text-right font-bold text-purple-600 dark:text-purple-400">R$ {prod.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RANKING DE CLIENTES */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-orange-500"/> Top Clientes do Mês
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-[#0c0c0e] text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Cliente</th>
                  <th className="px-5 py-3 font-bold text-center">Pedidos</th>
                  <th className="px-5 py-3 font-bold text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {topClientes.map((cli, idx) => (
                  <tr key={cli.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-zinc-200 text-zinc-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-zinc-800 text-zinc-400'}`}>
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[150px]">{cli.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-zinc-500 dark:text-zinc-400">{cli.pedidos}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">R$ {cli.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 🟢 MODAL TELA CHEIA (FULLSCREEN CHART) */}
      <AnimatePresence>
        {graficoExpandido && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full h-full max-h-screen shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Visualização Expandida
                </h3>
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