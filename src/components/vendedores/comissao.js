"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, Percent, Copy, Save, RefreshCw, 
  Search, ShieldAlert, CheckCircle2, AlertCircle, 
  TrendingUp, TrendingDown, Layers, ArrowRight,
  Calculator, CheckSquare, X, Settings2, Tag // 🟢 AQUI ESTAVA FALTANDO O SETTINGS2 E A TAG!
} from "lucide-react";
import toast from "react-hot-toast";

export default function TabComissoes({ vendedor, listaVendedores = [] }) {
  // 🟢 ESTADOS DA COMISSÃO
  const [subAba, setSubAba] = useState("regras"); // 'regras' ou 'apuracao'
  const [comissaoGeral, setComissaoGeral] = useState(5.0);
  const [busca, setBusca] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [modalReplica, setModalReplica] = useState(false);

  // Remove o próprio vendedor da lista de replicação
  const vendedoresDestino = listaVendedores.filter(v => v.id !== vendedor?.id);

  // 🟢 MOCKS: Famílias do Omie tratadas como Marcas no Raizan Core
  const [familias, setFamilias] = useState([
    { id: 101, nome: "Wella Professionals", percentual: 6.5 },
    { id: 102, nome: "L'Oréal Professionnel", percentual: 5.0 },
    { id: 103, nome: "Truss Hair", percentual: 8.0 },
    { id: 104, nome: "Braé", percentual: 7.5 },
    { id: 105, nome: "Kérastase", percentual: 4.5 },
    { id: 106, nome: "Knut", percentual: 10.0 },
    { id: 107, nome: "Aneethun", percentual: 5.0 },
    { id: 108, nome: "Acessórios / Secadores", percentual: 2.0 },
  ]);

  // 🟢 MOCK: Dados da Apuração do Mês
  const apuracaoMock = [
    { marca: "Wella Professionals", vendido: 15400.00, comissaoPerc: 6.5, comissaoValor: 1001.00 },
    { marca: "Truss Hair", vendido: 8200.00, comissaoPerc: 8.0, comissaoValor: 656.00 },
    { marca: "Knut", vendido: 5000.00, comissaoPerc: 10.0, comissaoValor: 500.00 },
    { marca: "Outros (Regra Geral)", vendido: 12500.00, comissaoPerc: comissaoGeral, comissaoValor: (12500 * (comissaoGeral / 100)) },
  ];
  
  const totalVendido = apuracaoMock.reduce((acc, curr) => acc + curr.vendido, 0);
  const totalComissao = apuracaoMock.reduce((acc, curr) => acc + curr.comissaoValor, 0);

  // 🟢 KPIS DINÂMICOS
  const maiorComissao = Math.max(...familias.map(f => f.percentual));
  const menorComissao = Math.min(...familias.map(f => f.percentual));

  const handlePercentualChange = (id, valor) => {
    let num = Number(valor);
    if (num < 0) num = 0;
    if (num > 100) num = 100;
    setFamilias(familias.map(f => f.id === id ? { ...f, percentual: num } : f));
  };

  const handleSincronizarOmie = async () => {
    setSincronizando(true);
    const toastId = toast.loading("Salvando regras no Raizan Core e ERP...");
    setTimeout(() => {
      toast.success("Comissões atualizadas com sucesso!", { id: toastId });
      setSincronizando(false);
    }, 2000);
  };

  const handleFecharComissao = async () => {
    setFechando(true);
    const toastId = toast.loading("Fechando comissões e enviando para o App do Vendedor...");
    setTimeout(() => {
      toast.success("Comissão fechada e enviada com sucesso!", { id: toastId });
      setFechando(false);
    }, 2500);
  };

  const familiasFiltradas = familias.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-6 pb-20">
      
      {/* 🟢 CABEÇALHO PREMIUM (Com Flex-Wrap para não espremer botões) */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 min-w-[250px]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Comissionamento</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Regras, exceções por marca e fechamento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            onClick={() => setSubAba('regras')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${subAba === 'regras' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <Settings2 size={16} /> Regras
          </button>
          <button 
            onClick={() => setSubAba('apuracao')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${subAba === 'apuracao' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <Calculator size={16} /> Apuração
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subAba === 'regras' ? (
          <motion.div key="regras" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* 🟢 KPIS RESUMO - ESTILO NASA */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#121214] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-emerald-50 dark:bg-emerald-500/10 w-16 h-16 rounded-full blur-xl"></div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Comissão Padrão</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{comissaoGeral.toFixed(1)}%</h3>
              </div>
              
              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Maior Comissão</p>
                <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <TrendingUp size={16} /> {maiorComissao.toFixed(1)}%
                </h3>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Menor Comissão</p>
                <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <TrendingDown size={16} /> {menorComissao.toFixed(1)}%
                </h3>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Marcas Exceção</p>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-1">
                  <Layers size={16} className="text-zinc-400"/> {familias.length}
                </h3>
              </div>
            </div>

            {/* 🟢 COMISSÃO GERAL E BOTÕES DE AÇÃO */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                <div className="flex-1">
                  <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                    <Percent size={18} className="text-emerald-500"/> Regra Geral do Vendedor
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Aplicada em produtos que não possuem comissão na família.
                  </p>
                </div>
                <div className="relative w-full sm:w-32 shrink-0">
                  <input 
                    type="number" 
                    value={comissaoGeral} 
                    onChange={(e) => setComissaoGeral(Number(e.target.value))} 
                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-lg font-bold text-center outline-none focus:border-emerald-500 transition-colors" 
                  />
                  <span className="absolute right-4 top-3.5 text-zinc-400 font-bold">%</span>
                </div>
              </div>

              <div className="flex w-full lg:w-auto items-center gap-3 border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-800 pt-4 lg:pt-0 lg:pl-6">
                <button 
                  onClick={() => setModalReplica(true)}
                  className="flex-1 lg:flex-none bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700"
                >
                  <Copy size={16} /> Replicar
                </button>
                <button 
                  onClick={handleSincronizarOmie}
                  disabled={sincronizando}
                  className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sincronizando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </div>

            {/* 🟢 COMISSÕES POR FAMÍLIA (AGORA EM LISTA PARA NÃO ESPREMER) */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/50">
                <div>
                  <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                    <Layers size={18} className="text-emerald-500"/> Exceções por Marca (Família)
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Defina percentuais específicos. Isso sobrepõe a regra geral.
                  </p>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar marca..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white py-2 pl-9 pr-4 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* O NOVO LAYOUT EM LISTA VAI AQUI */}
              <div className="p-5">
                <div className="flex flex-col gap-3">
                  {familiasFiltradas.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500">
                      <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Nenhuma marca encontrada com "{busca}".</p>
                    </div>
                  ) : (
                    familiasFiltradas.map((fam) => (
                      <div key={fam.id} className="bg-zinc-50 dark:bg-[#0c0c0e]/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:border-emerald-500/50 transition-colors group gap-4 sm:gap-0">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                            <Tag size={18} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{fam.nome}</p>
                            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">ID Omie: {fam.id}</p>
                          </div>
                        </div>
                        
                        <div className="relative w-full sm:w-32 shrink-0">
                          <input 
                            type="number" 
                            step="0.1"
                            value={fam.percentual} 
                            onChange={(e) => handlePercentualChange(fam.id, e.target.value)} 
                            className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-3 pr-8 text-base font-bold text-right outline-none focus:border-emerald-500 transition-colors shadow-sm" 
                          />
                          <span className="absolute right-3 top-2.5 text-zinc-400 text-sm font-bold">%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="apuracao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* 🟢 ABA DE FECHAMENTO DE COMISSÃO */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="text-emerald-500" /> Fechamento do Período
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Resumo do valor vendido por marca e a comissão acumulada.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-[#0c0c0e] text-xs uppercase text-zinc-500 dark:text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-bold">Marca / Família</th>
                      <th className="px-6 py-4 font-bold text-right">Total Vendido</th>
                      <th className="px-6 py-4 font-bold text-center">Regra Aplicada</th>
                      <th className="px-6 py-4 font-bold text-right">Comissão (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {apuracaoMock.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-200">{item.marca}</td>
                        <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400">R$ {item.vendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{item.comissaoPerc}%</td>
                        <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">R$ {item.comissaoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50/50 dark:bg-[#0c0c0e]/50 border-t-2 border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <td className="px-6 py-4 font-black text-zinc-900 dark:text-white uppercase">Totais</td>
                      <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400">R$ {totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-center text-zinc-400">-</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-lg">R$ {totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="p-6 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                <button 
                  onClick={handleFecharComissao}
                  disabled={fechando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3)] flex items-center gap-2 disabled:opacity-50"
                >
                  {fechando ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  {fechando ? "Processando..." : "Fechar Comissão e Enviar"}
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟢 MODAL DE REPLICAÇÃO (COM DADOS REAIS) */}
      <AnimatePresence>
        {modalReplica && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-colors">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 flex flex-col max-h-[90vh]"
            >
              <div className="mb-6">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 mb-4">
                  <Copy size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">Replicar Estrutura de Comissão</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Copie as regras do vendedor <strong className="text-zinc-800 dark:text-zinc-200">{vendedor?.nome}</strong> para outros membros da equipe.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-[#0c0c0e]/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl mb-6">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Resumo da Cópia</p>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">Comissão Geral:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{comissaoGeral}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Marcas Exceção:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{familias.length} configuradas</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar border-y border-zinc-100 dark:border-zinc-800 py-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Selecione os Vendedores Destino</p>
                
                {vendedoresDestino.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Nenhum outro vendedor encontrado.</p>
                ) : (
                  <div className="space-y-2">
                    {vendedoresDestino.map((v, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 bg-white dark:bg-zinc-900" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{v.nome}</span>
                          <span className="text-[10px] text-zinc-400">ID: {v.codigo_erp}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalReplica(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors">
                  Cancelar
                </button>
                <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all">
                  Confirmar Cópia <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}