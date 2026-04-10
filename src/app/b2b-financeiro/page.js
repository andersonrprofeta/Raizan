"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  DollarSign, AlertTriangle, TrendingUp, Calendar, Printer
} from "lucide-react";
import { getApiUrl } from "@/components/utils/api";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";

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
  }, [user]);

  const carregarPedidos = async () => {
    if (!user?.email) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/b2b/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 999, clienteEmail: user.email })
      });

      const data = await res.json();
      if (data.success) setPedidos(data.pedidos);
    } catch {
      toast.error("Erro ao carregar dados");
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
  // 🔥 GRÁFICO POR DIA (REAL BI)
  // =============================
  const agrupado = {};

  for (let i = periodo; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("pt-BR");
    agrupado[key] = { name: key, pagos: 0, abertos: 0 };
  }

  pedidosFiltrados.forEach(p => {
    if (statusCancelados.includes(p.status)) return;

    const data = new Date(p.date_created);
    const key = data.toLocaleDateString("pt-BR");

    if (!agrupado[key]) return;

    if (statusPagos.includes(p.status)) {
      agrupado[key].pagos += Number(p.total);
    } else if (statusAbertos.includes(p.status)) {
      agrupado[key].abertos += Number(p.total);
    }
  });

  const chartData = Object.values(agrupado);

  // =============================
  // 📊 RANKING CORRIGIDO
  // =============================
  const ranking = {};

  pedidosFiltrados.forEach(p => {
    if (statusCancelados.includes(p.status)) return;

    p.line_items?.forEach(item => {
      if (!ranking[item.name]) ranking[item.name] = 0;
      ranking[item.name] += item.quantity;
    });
  });

  const maxQtd = Math.max(...Object.values(ranking), 1);
  const rankingLista = Object.entries(ranking)
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 5);


  // ==========================================
  // 🟢 NOVA FUNÇÃO: GERADOR DE PDF/IMPRESSÃO
  // ==========================================
  const gerarPDF = () => {
    const printWindow = window.open('', '_blank');
    
    // Geramos um HTML branco, limpo e corporativo ideal para impressão
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Financeiro - Raizan B2B</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #18181b; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #09090b; }
            .header p { margin: 5px 0 0 0; color: #71717a; font-size: 14px; }
            .resumo { display: flex; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e4e4e7; background: #fafafa; padding: 20px; border-radius: 12px; flex: 1; }
            .card h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #71717a; }
            .card p { margin: 0; font-size: 24px; font-weight: bold; }
            .pago { color: #10b981; }
            .aberto { color: #f59e0b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th, td { border-bottom: 1px solid #e4e4e7; padding: 12px 10px; text-align: left; }
            th { background-color: #f4f4f5; color: #52525b; font-weight: 600; text-transform: uppercase; font-size: 12px; }
            .status { font-weight: bold; text-transform: uppercase; font-size: 11px; }
            .cancelado { color: #ef4444; text-decoration: line-through; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 20px; }
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
              <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
          
          <div class="resumo">
            <div class="card">
              <h3>Total Faturado (Pago)</h3>
              <p class="pago">${format(totalPago)}</p>
            </div>
            <div class="card">
              <h3>Títulos Pendentes (Aberto)</h3>
              <p class="aberto">${format(totalDevedor)}</p>
            </div>
            <div class="card">
              <h3>Volume de Pedidos</h3>
              <p style="color: #09090b;">${pagos.length + abertos.length} pedidos</p>
            </div>
          </div>

          <h3 style="margin-bottom: 15px; color: #27272a;">Histórico de Movimentações</h3>
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
                  <td style="text-align: right;" class="${statusCancelados.includes(p.status) ? 'cancelado' : ''}">
                    ${format(p.total)}
                  </td>
                </tr>
              `).join('')}
              ${pedidosFiltrados.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Nenhuma movimentação encontrada neste período.</td></tr>' : ''}
            </tbody>
          </table>

          <div class="footer">
            Documento gerado automaticamente via Raizan Core - Portal B2B.
          </div>

          <script>
            // Aciona a impressão/Salvar PDF e fecha a aba logo em seguida
            window.onload = () => { 
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex h-[100dvh] bg-[#09090b] text-zinc-100 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-w-0">

          {/* FILTRO */}
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map(d => (
              <button key={d}
                onClick={() => setPeriodo(d)}
                className={`flex-1 min-w-[96px] sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm md:text-base transition-all ${
                  periodo === d ? "bg-emerald-600 text-white shadow-lg" : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}>
                {d} dias
              </button>
            ))}
          </div>

          {/* CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <Card title="Faturado (Pago)" value={format(totalPago)} icon={<DollarSign />} />
            <Card title="A Receber (Devedor)" value={format(totalDevedor)} icon={<AlertTriangle />} />
            <Card title="Pedidos Válidos" value={pagos.length + abertos.length} icon={<TrendingUp />} />
            <Card title="Abertos" value={abertos.length} icon={<Calendar />} />
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">

            {/* GRÁFICO */}
            <div className="xl:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 sm:p-6 min-w-0">
              <h3 className="mb-3 sm:mb-4 text-zinc-100 font-bold text-base md:text-lg">Fluxo Financeiro</h3>

              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="corPago" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>

                    <linearGradient id="corAberto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="#27272a" vertical={false} />

                  <XAxis
                      dataKey="name"
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      dy={10}
                      minTickGap={30}
                    />

                  <Tooltip 
                    formatter={(v) => format(v)} 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} 
                    itemStyle={{ fontWeight: 'bold' }}
                  />

                  <Area dataKey="pagos" stroke="#10b981" strokeWidth={2} fill="url(#corPago)" />
                  <Area dataKey="abertos" stroke="#f59e0b" strokeWidth={2} fill="url(#corAberto)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* RANKING */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 sm:p-6 min-w-0">
              <h3 className="mb-4 text-zinc-100 font-bold text-base md:text-lg">Top Produtos</h3>

              {rankingLista.length === 0 ? (
                 <p className="text-sm text-zinc-500 mt-10 text-center">Nenhum dado no período.</p>
              ) : (
                rankingLista.map(p => (
                  <div key={p.nome} className="mb-4 min-w-0">
                    <div className="flex items-center justify-between text-sm md:text-base mb-1 gap-2 min-w-0">
                      <span className="truncate flex-1 min-w-0 text-zinc-300">{p.nome}</span>
                      <span className="text-emerald-400 font-bold">{p.qtd} un</span>
                    </div>

                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(p.qtd / maxQtd) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* EXTRATO COM BOTÃO DE PDF */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 sm:p-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
              <h3 className="text-zinc-100 font-bold text-base md:text-lg">Extrato de Movimentações</h3>
              
              {/* 🟢 O BOTÃO DE GERAR ESPELHO AQUI */}
              <button 
                onClick={gerarPDF}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border border-zinc-700 hover:border-zinc-500"
              >
                <Printer size={16} /> Exportar Extrato (PDF)
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden space-y-2 custom-scrollbar pr-1 sm:pr-2 min-w-0">
              {pedidosFiltrados.length === 0 && <p className="text-zinc-500 text-sm">Nenhuma movimentação no período.</p>}
              
              {pedidosFiltrados.slice(0, 20).map(p => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-xl border border-transparent hover:border-zinc-800 hover:bg-zinc-800/50 transition-all group min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-bold text-zinc-200 group-hover:text-white transition-colors truncate">Pedido #{p.id}</p>
                    
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block border ${
                      statusPagos.includes(p.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      statusCancelados.includes(p.status) ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {p.status.replace('-', ' ')}
                    </span>
                    
                  </div>
                  <span className={`font-bold text-sm md:text-base sm:text-right ${statusPagos.includes(p.status) ? "text-emerald-400" : statusCancelados.includes(p.status) ? "text-zinc-500 line-through" : "text-amber-400"}`}>
                    {format(p.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

function Card({ icon, title, value }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors relative overflow-hidden group min-w-0">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative flex justify-between items-start mb-2">
        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner">
          <div className="text-emerald-400">{icon}</div>
        </div>
      </div>
      <p className="text-sm md:text-base font-medium text-zinc-400 relative truncate">{title}</p>
      <h3 className="text-xl md:text-2xl font-bold text-zinc-100 mt-1 relative break-words">{value}</h3>
    </div>
  );
}