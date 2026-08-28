"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, TrendingUp, TrendingDown, Clock, ShieldAlert, 
  Settings2, Copy, History, PlusCircle, ArrowRightLeft, 
  Check, AlertCircle, Info, ChevronDown
} from "lucide-react";

// 🟢 COMPONENTE SWITCH PREMIUM (Estilo iOS - Sem tipagem do TS)
const Switch = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-purple-600' : 'bg-zinc-200 dark:bg-zinc-700'
    }`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export default function TabContaFlex({ vendedor }) {
  // 🟢 ESTADOS DA CONTA FLEX
  const [isFlexAtivo, setIsFlexAtivo] = useState(true);
  
  // Geração
  const [geracaoAtiva, setGeracaoAtiva] = useState(true);
  const [percEmpresa, setPercEmpresa] = useState(70);
  const [percVendedor, setPercVendedor] = useState(30);
  const [baseCalculo, setBaseCalculo] = useState("diferenca");
  
  // Utilização
  const [usoAtivo, setUsoAtivo] = useState(true);
  
  // Saldo Negativo e Validade
  const [permiteNegativo, setPermiteNegativo] = useState(false);
  const [temValidade, setTemValidade] = useState(false);

  // 🟢 MOCKS DE DADOS FINANCEIROS
  const kpis = { disponivel: 350.00, bloqueado: 80.00, gerado: 470.00, utilizado: 120.00 };
  
  const extrato = [
    { id: 1, data: "26/08/2026 14:30", tipo: "crédito", origem: "Venda #1050", valor: 80.00, saldo: 130.00 },
    { id: 2, data: "23/08/2026 09:15", tipo: "débito", origem: "Venda #1080", valor: -30.00, saldo: 100.00 },
    { id: 3, data: "20/08/2026 16:45", tipo: "crédito", origem: "Venda #1020", valor: 50.00, saldo: 50.00 },
  ];

  // Handler para manter a soma de empresa/vendedor em 100%
  const handlePercChange = (tipo, valor) => {
    let num = Number(valor);
    if (num > 100) num = 100;
    if (num < 0) num = 0;

    if (tipo === 'empresa') {
      setPercEmpresa(num);
      setPercVendedor(100 - num);
    } else {
      setPercVendedor(num);
      setPercEmpresa(100 - num);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 🟢 MASTER SWITCH - ATIVAÇÃO GERAL */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isFlexAtivo ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Conta Flex</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Verba de negociação individual do vendedor.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold uppercase tracking-wider ${isFlexAtivo ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}`}>
            {isFlexAtivo ? "Ativada" : "Desligada"}
          </span>
          <Switch checked={isFlexAtivo} onChange={setIsFlexAtivo} />
        </div>
      </div>

      <AnimatePresence>
        {!isFlexAtivo ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-50 dark:bg-[#121214]/50 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-8 text-center"
          >
            <ShieldAlert size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h4 className="text-zinc-700 dark:text-zinc-300 font-bold mb-2">Conta Flex Inativa</h4>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              O vendedor não participa do sistema Flex. O saldo e as configurações estão ocultos e ele não gera nem consome créditos no app.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            
            {/* 🟢 KPIS RESUMO */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#121214] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-emerald-50 dark:bg-emerald-500/10 w-16 h-16 rounded-full blur-xl"></div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Saldo Disponível</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">R$ {kpis.disponivel.toFixed(2).replace('.',',')}</h3>
              </div>
              
              <div className="bg-white dark:bg-[#121214] border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Bloqueado</p>
                    <h3 className="text-lg font-black text-amber-600 dark:text-amber-500">R$ {kpis.bloqueado.toFixed(2).replace('.',',')}</h3>
                  </div>
                  <Clock size={16} className="text-amber-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Gerado (Mês)</p>
                <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <TrendingUp size={16} /> R$ {kpis.gerado.toFixed(2).replace('.',',')}
                </h3>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Utilizado (Mês)</p>
                <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <TrendingDown size={16} /> R$ {kpis.utilizado.toFixed(2).replace('.',',')}
                </h3>
              </div>
            </div>

            {/* 🟢 CONFIGURAÇÕES EM DUAS COLUNAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BLOCO 1: GERAÇÃO */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><Settings2 size={18} className="text-purple-500"/> Geração de Saldo</h4>
                  <Switch checked={geracaoAtiva} onChange={setGeracaoAtiva} />
                </div>

                <div className={`space-y-5 transition-opacity ${!geracaoAtiva && 'opacity-40 pointer-events-none'}`}>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Base de Cálculo</label>
                    <div className="bg-zinc-50 dark:bg-black/30 p-1 rounded-xl flex">
                      {['diferenca', 'margem', 'venda'].map(opt => (
                        <button 
                          key={opt} onClick={() => setBaseCalculo(opt)}
                          className={`flex-1 text-xs font-bold py-2 rounded-lg capitalize transition-all ${baseCalculo === opt ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                          {opt === 'diferenca' ? 'Diferença de Tabela' : opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex justify-between">
                      <span>Divisão do Flex</span>
                      <span className="text-purple-500">{percEmpresa}% Empresa / {percVendedor}% Vend.</span>
                    </label>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <div className="relative">
                          <input type="number" value={percEmpresa} onChange={(e) => handlePercChange('empresa', Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500" />
                          <span className="absolute right-3 top-2.5 text-zinc-400">% Emp.</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <input type="number" value={percVendedor} onChange={(e) => handlePercChange('vendedor', Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500" />
                          <span className="absolute right-3 top-2.5 text-zinc-400">% Vend.</span>
                        </div>
                      </div>
                    </div>
                    {/* Barra de Progresso Visual */}
                    <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${percEmpresa}%` }} className="bg-zinc-800 dark:bg-zinc-400 transition-all duration-300"></div>
                      <div style={{ width: `${percVendedor}%` }} className="bg-purple-500 transition-all duration-300"></div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Max. Gerado por Venda (%)</label>
                    <input type="number" placeholder="Ex: 5%" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500" />
                  </div>
                </div>
              </div>

              {/* BLOCO 2: UTILIZAÇÃO */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><Wallet size={18} className="text-emerald-500"/> Utilização de Saldo</h4>
                  <Switch checked={usoAtivo} onChange={setUsoAtivo} />
                </div>

                <div className={`space-y-5 flex-1 transition-opacity ${!usoAtivo && 'opacity-40 pointer-events-none'}`}>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                      Max. Flex por Pedido (%) <Info size={12} className="text-zinc-400" title="Limite percentual sobre o valor da venda" />
                    </label>
                    <input type="number" placeholder="Ex: 10%" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                      Valor Max. por Pedido (R$) <Info size={12} className="text-zinc-400" title="Trava financeira absoluta" />
                    </label>
                    <input type="number" placeholder="Ex: 500,00" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500" />
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Permitir Saldo Negativo?</label>
                      <Switch checked={permiteNegativo} onChange={setPermiteNegativo} />
                    </div>
                    {permiteNegativo && (
                      <input type="number" placeholder="Limite Negativo (R$)" className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-lg p-2.5 text-sm outline-none placeholder:text-rose-300" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 🟢 BOTÕES DE AÇÃO ADMINISTRATIVA */}
            <div className="flex flex-wrap gap-3">
              <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm">
                <PlusCircle size={18} /> Ajustar Saldo
              </button>
              <button className="flex-1 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-200 shadow-sm">
                <ArrowRightLeft size={18} /> Transferir
              </button>
              <button className="flex-1 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
                <Copy size={18} /> Replicar Regras
              </button>
            </div>

            {/* 🟢 EXTRATO DA CONTA */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><History size={18} className="text-zinc-400"/> Extrato Flex</h4>
                <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">Ver Histórico Completo</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-[#0c0c0e] text-xs uppercase text-zinc-500 dark:text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 font-bold">Data</th>
                      <th className="px-5 py-3 font-bold">Origem</th>
                      <th className="px-5 py-3 font-bold text-right">Crédito</th>
                      <th className="px-5 py-3 font-bold text-right">Débito</th>
                      <th className="px-5 py-3 font-bold text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {extrato.map((mov) => (
                      <tr key={mov.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3 text-zinc-500">{mov.data}</td>
                        <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-200">{mov.origem}</td>
                        <td className="px-5 py-3 text-right font-bold text-blue-600 dark:text-blue-400">{mov.valor > 0 ? `+ R$ ${mov.valor.toFixed(2).replace('.',',')}` : '—'}</td>
                        <td className="px-5 py-3 text-right font-bold text-rose-600 dark:text-rose-400">{mov.valor < 0 ? `- R$ ${Math.abs(mov.valor).toFixed(2).replace('.',',')}` : '—'}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">R$ {mov.saldo.toFixed(2).replace('.',',')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}