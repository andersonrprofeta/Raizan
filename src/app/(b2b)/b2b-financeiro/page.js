"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  DollarSign, AlertTriangle, TrendingUp, Calendar, Printer, Package
} from "lucide-react";
import { getHubUrl, getHeaders } from "@/components/utils/api";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";

const obterTenantSeguro = () => {
  if (process.env.NEXT_PUBLIC_TENANT_ID) return process.env.NEXT_PUBLIC_TENANT_ID;

  if (typeof window !== 'undefined') {
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
  }

  return null; 
};

export default function FinanceiroBI() {
  const [user, setUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [periodo, setPeriodo] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem("raizan_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (user) carregarPedidos();
  }, [user, periodo]); // 🟢 Adicionado periodo para recarregar se necessário (opcional)

  const carregarPedidos = async () => {
    if (!user?.email) return;

    try {
      const tenantId = obterTenantSeguro();
      const customHeaders = getHeaders();
      if (tenantId) customHeaders["x-tenant-id"] = tenantId;

      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/b2b`, {
        method: "POST",
        headers: { ...customHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 999, clienteEmail: user.email })
      });

      const data = await res.json();
      if (data.success) setPedidos(data.pedidos);
    } catch {
      toast.error("Erro ao carregar dados financeiros.");
    }
  };

  const format = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const agora = new Date();

  // 🟢 AS REGRAS FINANCEIRAS DE STATUS
  const statusPagos = ['completed', 'pago', 'enviado', 'entregue'];
  const statusAbertos = ['aguardando-pagamento', 'processing', 'pending', 'on-hold'];
  const statusCancelados = ['cancelled', 'cancelado'];

  const pedidosFiltrados = pedidos.filter(p => {
    const data = new Date(p.date_created);
    const diff = (agora - data) / (1000 * 60 * 60 * 24);
    return diff <= periodo;
  });

  const pagos = pedidosFiltrados.filter(p => statusPagos.includes(p.status));
  const abertos = pedidosFiltrados.filter(p => statusAbertos.includes(p.status));

  const totalPago = pagos.reduce((a, b) => a + Number(b.total), 0);
  const totalDevedor = abertos.reduce((a, b) => a + Number(b.total), 0);

  // =============================
  // 🔥 GRÁFICO POR DIA (REAL BI) COM LINHAS SUAVES
  // =============================
  const agrupado = {};

  for (let i = periodo; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
    agrupado[key] = { name: key, pagos: 0, abertos: 0 };
  }

  pedidosFiltrados.forEach(p => {
    if (statusCancelados.includes(p.status)) return;

    const data = new Date(p.date_created);
    const key = data.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });

    if (!agrupado[key]) return;

    if (statusPagos.includes(p.status)) {
      agrupado[key].pagos += Number(p.total);
    } else if (statusAbertos.includes(p.status)) {
      agrupado[key].abertos += Number(p.total);
    }
  });

  const chartData = Object.values(agrupado);

  // =============================
  // 📊 RANKING
  // =============================
  const ranking = {};

  pedidosFiltrados.forEach(p => {
    if (statusCancelados.includes(p.status)) return;

    p.line_items?.forEach(item => {
      if (!ranking[item.name]) ranking[item.name] = 0;
      ranking[item.name] += item.quantity || item.qtd || 1;
    });
  });

  const maxQtd = Math.max(...Object.values(ranking), 1);
  const rankingLista = Object.entries(ranking)
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 5);


  // ==========================================
  // 🟢 GERADOR DE PDF/IMPRESSÃO (ESTILO RAIZAN)
  // ==========================================
  const gerarPDF = () => {
    const printWindow = window.open('', '_blank');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Financeiro - Raizan B2B</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #18181b; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #7c3aed; letter-spacing: -0.5px; }
            .header p { margin: 5px 0 0 0; color: #71717a; font-size: 14px; }
            .resumo { display: flex; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e4e4e7; background: #fafafa; padding: 20px; border-radius: 16px; flex: 1; }
            .card h3 { margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #71717a; letter-spacing: 1px; }
            .card p { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
            .pago { color: #7c3aed; }
            .aberto { color: #e11d48; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border-bottom: 1px solid #f4f4f5; padding: 14px 10px; text-align: left; }
            th { background-color: #fafafa; color: #a1a1aa; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
            .status { font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            .cancelado { color: #a1a1aa; text-decoration: line-through; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #a1a1aa; border-top: 1px dashed #e4e4e7; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Extrato Financeiro B2B</h1>
              <p>Cliente: <strong>${user?.nome || user?.email || 'N/A'}</strong></p>
            </div>
            <div style="text-align: right;">
              <p><strong>Período:</strong> Últimos ${periodo} dias</p>
              <p><strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
          
          <div class="resumo">
            <div class="card">
              <h3>Total Faturado</h3>
              <p class="pago">${format(totalPago)}</p>
            </div>
            <div class="card">
              <h3>Títulos Pendentes</h3>
              <p class="aberto">${format(totalDevedor)}</p>
            </div>
            <div class="card">
              <h3>Volume de Pedidos</h3>
              <p style="color: #18181b;">${pagos.length + abertos.length} pedidos</p>
            </div>
          </div>

          <h3 style="margin-bottom: 15px; color: #27272a; font-size: 16px;">Histórico de Movimentações</h3>
          <table>
            <thead>
              <tr>
                <th>Nº Pedido</th>
                <th>Data</th>
                <th>Status</th>
                <th style="text-align: right;">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${pedidosFiltrados.map(p => `
                <tr>
                  <td><strong>#${p.id}</strong></td>
                  <td>${new Date(p.date_created).toLocaleDateString('pt-BR')}</td>
                  <td class="status ${statusPagos.includes(p.status) ? 'pago' : statusCancelados.includes(p.status) ? 'cancelado' : 'aberto'}">
                    ${p.status.replace('-', ' ')}
                  </td>
                  <td style="text-align: right; font-weight: bold;" class="${statusCancelados.includes(p.status) ? 'cancelado' : ''}">
                    ${format(p.total)}
                  </td>
                </tr>
              `).join('')}
              ${pedidosFiltrados.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #a1a1aa;">Nenhuma movimentação encontrada.</td></tr>' : ''}
            </tbody>
          </table>

          <div class="footer">
            Documento gerado de forma segura e auditável pelo Portal Raizan B2B.
          </div>

          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex h-[100dvh] bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-x-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
        <Header />

        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-w-0 relative z-10">
          
          {/* EFEITO GLOW RAIZAN */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

          {/* FILTRO PREMIUM */}
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90, 365].map(d => (
              <button key={d}
                onClick={() => setPeriodo(d)}
                className={`flex-1 min-w-[80px] sm:flex-none px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-sm ${
                  periodo === d ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/25" : "bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400"
                }`}>
                {d} dias
              </button>
            ))}
          </div>

          {/* CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card title="Faturado (Pago)" value={format(totalPago)} icon={<DollarSign />} color="purple" />
            <Card title="A Receber (Devedor)" value={format(totalDevedor)} icon={<AlertTriangle />} color="rose" />
            <Card title="Pedidos Válidos" value={pagos.length + abertos.length} icon={<TrendingUp />} color="indigo" />
            <Card title="Abertos" value={abertos.length} icon={<Calendar />} color="amber" />
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">

            {/* GRÁFICO COM LINHAS CURVAS (MONOTONE) E GLASSMORPHISM */}
            <div className="xl:col-span-2 bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] p-5 sm:p-7 min-w-0 shadow-lg shadow-zinc-200/20 dark:shadow-none transition-colors duration-300">
              <h3 className="mb-6 text-zinc-900 dark:text-zinc-100 font-black text-lg md:text-xl tracking-tight">Fluxo Financeiro</h3>

              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corPago" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>

                    <linearGradient id="corAberto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} opacity={0.15} />

                  <XAxis
                      dataKey="name"
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                      minTickGap={20}
                    />

                  <Tooltip 
                    formatter={(v) => format(v)} 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }} 
                    itemStyle={{ fontWeight: '900', fontSize: '14px', color: '#fff' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}
                  />

                  {/* 🟢 A MÁGICA DA CURVA: type="monotone" */}
                  <Area type="monotone" dataKey="pagos" stroke="#8b5cf6" strokeWidth={3} fill="url(#corPago)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="abertos" stroke="#f43f5e" strokeWidth={3} fill="url(#corAberto)" activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* RANKING (TOP PRODUTOS) */}
            <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] p-5 sm:p-7 min-w-0 shadow-lg shadow-zinc-200/20 dark:shadow-none transition-colors duration-300">
              <h3 className="mb-6 text-zinc-900 dark:text-zinc-100 font-black text-lg md:text-xl tracking-tight">Top Produtos</h3>

              {rankingLista.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                   <Package size={32} className="mb-2 opacity-50" />
                   <p className="text-xs font-bold uppercase tracking-wider">Sem dados no período</p>
                 </div>
              ) : (
                <div className="space-y-5">
                  {rankingLista.map(p => (
                    <div key={p.nome} className="min-w-0 group">
                      <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                        <span className="truncate flex-1 min-w-0 text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{p.nome}</span>
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{p.qtd} un</span>
                      </div>

                      <div className="w-full bg-zinc-100 dark:bg-zinc-800/50 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(p.qtd / maxQtd) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* EXTRATO COM BOTÃO DE PDF */}
          <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] p-5 sm:p-7 min-w-0 shadow-lg shadow-zinc-200/20 dark:shadow-none transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-zinc-900 dark:text-zinc-100 font-black text-lg md:text-xl tracking-tight">Extrato de Movimentações</h3>
              
              <button 
                onClick={gerarPDF}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
              >
                <Printer size={16} /> Exportar (PDF)
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto overflow-x-hidden space-y-2 custom-scrollbar pr-1 sm:pr-3 min-w-0">
              {pedidosFiltrados.length === 0 && (
                <p className="text-zinc-500 text-sm p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  Nenhuma movimentação financeira neste período.
                </p>
              )}
              
              {pedidosFiltrados.slice(0, 20).map(p => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group min-w-0">
                  <div className="min-w-0 flex flex-col items-start">
                    <p className="text-sm font-black text-zinc-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                      Pedido #{p.id}
                    </p>
                    
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mt-1.5 inline-block border ${
                      statusPagos.includes(p.status) ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' : 
                      statusCancelados.includes(p.status) ? 'bg-zinc-100 dark:bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/20' : 
                      'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                    }`}>
                      {p.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <span className={`font-black text-base sm:text-lg tracking-tight ${statusPagos.includes(p.status) ? "text-purple-600 dark:text-purple-400" : statusCancelados.includes(p.status) ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-rose-600 dark:text-rose-400"}`}>
                      {format(p.total)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(p.date_created).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: CARD ESTILO APPLE
// ==========================================
function Card({ icon, title, value, color = "emerald" }) {
  // Mapa de cores para facilitar o design sem poluir o JSX
  const colorMap = {
    purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20",
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
  };

  const selectedColor = colorMap[color] || colorMap.purple;

  return (
    <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 shadow-sm dark:shadow-none transition-colors relative overflow-hidden group min-w-0">
      <div className="relative flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${selectedColor}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider relative truncate mb-1">{title}</p>
      <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 relative break-words tracking-tight">{value}</h3>
    </div>
  );
}