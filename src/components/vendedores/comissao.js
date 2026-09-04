//comissoesController.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, Percent, Copy, Save, RefreshCw, 
  Search, ShieldAlert, CheckCircle2, AlertCircle, 
  TrendingUp, TrendingDown, Layers, ArrowRight,
  Calculator, CheckSquare, X, Settings2, Tag, CalendarDays,
  FileSpreadsheet, FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { getHubUrl, getHeaders } from "@/components/utils/api";

export default function TabComissoes({ vendedor, listaVendedores = [] }) {
  const [subAba, setSubAba] = useState("regras");
  const [busca, setBusca] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [fechando, setFechando] = useState(false);
  
  const [modalReplica, setModalReplica] = useState(false);
  const [vendedoresSelecionados, setVendedoresSelecionados] = useState([]);

  const [loading, setLoading] = useState(true);
  const [marcasReais, setMarcasReais] = useState([]);
  const [vendedoresReais, setVendedoresReais] = useState([]); 
  
  // 🟢 ESTADOS REAIS
  const [comissaoGeral, setComissaoGeral] = useState(5.0);
  const [regrasMarcas, setRegrasMarcas] = useState({}); 
  const [apuracaoDinamica, setApuracaoDinamica] = useState([]); // Agora é estado!

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  const baseVendedores = vendedoresReais.length > 0 ? vendedoresReais : listaVendedores;
  const vendedoresDestino = baseVendedores.filter(v => String(v.id) !== String(vendedor?.id));

  // ==========================================
  // 🚀 BUSCA DE DADOS REAIS
  // ==========================================
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      if (!tenant_id || !vendedor?.id) return;
      
      // 1. Busca Marcas
      const resMarcas = await fetch(`${getHubUrl()}/api/hub/marcas?tenant_id=${tenant_id}`, { headers: getHeaders() });
      const dataMarcas = await resMarcas.json();
      
      // 2. Busca Regras do Vendedor
      const resRegras = await fetch(`${getHubUrl()}/api/hub/comissoes/regras?tenant_id=${tenant_id}&vendedor_id=${vendedor.id}`, { headers: getHeaders() });
      const dataRegras = await resRegras.json();

      let regrasAtuais = {};
      if (dataRegras.success) {
        setComissaoGeral(dataRegras.geral);
        dataRegras.marcas.forEach(m => regrasAtuais[m.marca] = m.percentual);
      }

      if (dataMarcas.success) {
        const marcasLimpas = dataMarcas.marcas.filter(m => !m.nome.toLowerCase().startsWith("provador"));
        setMarcasReais(marcasLimpas);

        const regrasForm = {};
        marcasLimpas.forEach(m => {
          regrasForm[m.nome] = regrasAtuais[m.nome] !== undefined ? regrasAtuais[m.nome] : "";
        });
        setRegrasMarcas(regrasForm);
      }

      // 3. Busca Vendedores para o Modal
      const resVend = await fetch(`${getHubUrl()}/api/hub/vendedores?tenant_id=${tenant_id}`, { headers: getHeaders() });
      const dataVend = await resVend.json();
      if (dataVend.success) setVendedoresReais(dataVend.vendedores || []);

      // 4. Busca Apuração (Matemática Real!)
      const resApuracao = await fetch(`${getHubUrl()}/api/hub/comissoes/apuracao?tenant_id=${tenant_id}&vendedor_id=${vendedor.id}&mes=${mesAtual}&ano=${anoAtual}`, { headers: getHeaders() });
      const dataApuracao = await resApuracao.json();
      if (dataApuracao.success) setApuracaoDinamica(dataApuracao.apuracao || []);

    } catch (error) {
      console.error("Erro ao puxar dados da API", error);
    } finally {
      setLoading(false);
    }
  }, [vendedor]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // ==========================================
  // 🛠️ EVENTOS E INTEGRAÇÃO (SALVAR E COPIAR)
  // ==========================================
  const handlePercentualChange = (nomeMarca, valor) => {
    let num = valor.replace(/[^0-9.]/g, ''); 
    if (Number(num) > 100) num = "100";
    setRegrasMarcas(prev => ({ ...prev, [nomeMarca]: num }));
  };

  const handleSalvarRegras = async () => {
    setSincronizando(true);
    const toastId = toast.loading("Salvando comissões no banco...");
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      const payload = {
        tenant_id,
        vendedor_id: vendedor.id,
        comissao_geral: comissaoGeral,
        marcas_excecao: Object.entries(regrasMarcas)
          .filter(([_, valor]) => valor !== "")
          .map(([nome, valor]) => ({ marca: nome, percentual: Number(valor) }))
      };

      const res = await fetch(`${getHubUrl()}/api/hub/comissoes/regras`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        toast.success("Comissões salvas! Atualizando apuração...", { id: toastId });
        carregarDados(); // Recarrega para aplicar a nova regra
      } else throw new Error(data.message);
    } catch(e) {
      toast.error("Erro ao salvar", { id: toastId });
    } finally { setSincronizando(false); }
  };

  const handleCopiarComissao = async () => {
    if (vendedoresSelecionados.length === 0) return toast.error("Selecione pelo menos um vendedor!");
    const toastId = toast.loading("Copiando estrutura...");
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      const payload = { tenant_id, vendedor_origem_id: vendedor.id, vendedores_destino: vendedoresSelecionados };
      const res = await fetch(`${getHubUrl()}/api/hub/comissoes/copiar`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        toast.success(`Copiado para ${vendedoresSelecionados.length} vendedor(es)!`, { id: toastId });
        setModalReplica(false); setVendedoresSelecionados([]);
      } else throw new Error(data.message);
    } catch(e) { toast.error("Erro ao copiar", { id: toastId }); }
  };

  const totalVendasBrutas = apuracaoDinamica.reduce((acc, curr) => acc + curr.vendas, 0);
  const totalDevolucoes = apuracaoDinamica.reduce((acc, curr) => acc + curr.devolucoes, 0);
  const totalBaseCalc = apuracaoDinamica.reduce((acc, curr) => acc + curr.base, 0);
  const totalComissaoCalculada = apuracaoDinamica.reduce((acc, curr) => acc + curr.comissao, 0);

  const handleFecharComissao = async () => {
    setFechando(true);
    const toastId = toast.loading("Congelando período no banco...");
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      const payload = { tenant_id, vendedor_id: vendedor.id, mes: mesAtual, ano: anoAtual, total_vendas: totalVendasBrutas, total_devolucoes: totalDevolucoes, comissao_final: totalComissaoCalculada };
      const res = await fetch(`${getHubUrl()}/api/hub/comissoes/fechar`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) toast.success("Comissão fechada com sucesso!", { id: toastId });
      else throw new Error(data.message);
    } catch(e) { toast.error("Erro ao fechar comissão", { id: toastId }); }
    finally { setFechando(false); }
  };

  // 🟢 EXPORTAÇÃO
  const exportarParaExcel = () => {
    let csv = "Marca/Familia;Vendas Brutas (R$);Devolucoes (R$);Base de Calculo (R$);Regra Aplicada (%);Valor da Comissao (R$)\n";
    apuracaoDinamica.forEach(item => {
      csv += `"${item.marca}";"${item.vendas.toFixed(2).replace('.', ',')}";"${item.devolucoes.toFixed(2).replace('.', ',')}";"${item.base.toFixed(2).replace('.', ',')}";"${item.regra.toFixed(1).replace('.', ',')}";"${item.comissao.toFixed(2).replace('.', ',')}"\n`;
    });
    csv += `"TOTAIS DO MES";"${totalVendasBrutas.toFixed(2).replace('.', ',')}";"${totalDevolucoes.toFixed(2).replace('.', ',')}";"${totalBaseCalc.toFixed(2).replace('.', ',')}";"-";"${totalComissaoCalculada.toFixed(2).replace('.', ',')}"\n`;
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `Comissao_Raizan_${vendedor?.nome || 'Vendedor'}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Excel gerado!");
  };

  const exportarParaPDF = () => {
    const conteudo = document.getElementById('tabela-apuracao').outerHTML;
    const janela = window.open('', '', 'width=900,height=650');
    janela.document.write(`
      <html>
        <head><title>Relatório de Comissões</title>
        <style>
          body { font-family: sans-serif; padding: 30px; color: #18181b; }
          h2 { margin-bottom: 5px; color: #4f46e5; }
          p { color: #71717a; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { border-bottom: 1px solid #e4e4e7; padding: 12px; text-align: left; }
          th { background-color: #f4f4f5; text-transform: uppercase; font-size: 12px; }
          .text-right { text-align: right; } .text-center { text-align: center; }
          @media print { button { display: none; } }
        </style></head>
        <body>
          <h2>Relatório de Comissões - ${vendedor?.nome || 'Vendedor'}</h2>
          <p>Competência: ${mesAtual}/${anoAtual}</p>
          ${conteudo}
          <script>window.onload=function(){window.print();window.close();}</script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  const marcasFiltradas = marcasReais.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()));
  const alternarVend = (id) => setVendedoresSelecionados(p => p.includes(id) ? p.filter(v => v !== id) : [...p, id]);
  const selecionarTodos = () => setVendedoresSelecionados(vendedoresSelecionados.length === vendedoresDestino.length ? [] : vendedoresDestino.map(v => v.id));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
      <RefreshCw size={32} className="animate-spin mb-4 text-indigo-500" />
      <p className="font-bold uppercase tracking-widest text-xs">Carregando Motor de Vendas...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* CABEÇALHO */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
            <DollarSign size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">Comissionamento</h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Gerencie e apure de forma simples.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setSubAba('regras')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${subAba === 'regras' ? 'bg-white dark:bg-[#18181b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}><Settings2 size={14} /> Regras</button>
          <button onClick={() => setSubAba('apuracao')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${subAba === 'apuracao' ? 'bg-white dark:bg-[#18181b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}><Calculator size={14} /> Apuração</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subAba === 'regras' ? (
          <motion.div key="regras" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* REGRA GERAL */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div>
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white text-base sm:text-lg">
                  <Percent size={18} className="text-indigo-500"/> Regra Geral do Vendedor
                </h4>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Percentual base aplicado em produtos sem exceção.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-32 shrink-0">
                  <input type="number" step="0.1" value={comissaoGeral} onChange={(e) => setComissaoGeral(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-lg font-black text-center outline-none focus:border-indigo-500 transition-colors dark:text-white" />
                  <span className="absolute right-3 top-3.5 text-zinc-400 font-bold">%</span>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2 sm:ml-auto">
                  <button onClick={() => setModalReplica(true)} className="flex-1 sm:flex-none bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2">
                    <Copy size={16} /> Copiar
                  </button>
                  <button onClick={handleSalvarRegras} disabled={sincronizando} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 disabled:opacity-50">
                    {sincronizando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                  </button>
                </div>
              </div>
            </div>

            {/* MARCAS */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/50">
                <div>
                  <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white text-base sm:text-lg">
                    <Layers size={18} className="text-indigo-500"/> Exceções por Marca
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Deixe em branco para usar a Regra Geral.</p>
                </div>
                <div className="relative w-full sm:w-64 shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-zinc-400" /></div>
                  <input type="text" placeholder="Buscar marca..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white py-2 pl-9 pr-4 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors shadow-sm" />
                </div>
              </div>

              <div className="flex flex-col max-h-[450px] overflow-y-auto custom-scrollbar p-0 sm:p-2">
                {marcasFiltradas.map((marca) => (
                  <div key={marca.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 mx-2 my-1 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 transition-colors gap-3 sm:gap-0">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0"><Tag size={14} /></div>
                      <div className="flex-1">
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm sm:text-base">{marca.nome}</p>
                        <p className="text-[10px] text-zinc-400 font-mono tracking-widest mt-0.5">ID: {marca.id}</p>
                      </div>
                    </div>
                    <div className="relative w-full sm:w-28 shrink-0 flex justify-end">
                      <input type="number" step="0.1" placeholder="Geral" value={regrasMarcas[marca.nome] || ""} onChange={(e) => handlePercentualChange(marca.nome, e.target.value)} className="w-full sm:w-24 bg-transparent border-b-2 border-zinc-200 dark:border-zinc-700 py-1 pr-5 text-right text-sm sm:text-base font-bold text-zinc-900 dark:text-indigo-400 outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600" />
                      <span className="absolute right-0 top-1 text-zinc-400 font-bold text-xs sm:text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="apuracao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* APURAÇÃO */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-4 bg-zinc-50/50 dark:bg-[#0c0c0e]/50">
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="text-indigo-500" size={18} /> Fechamento de Comissão
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Cálculo exato de Vendas abatendo as Devoluções.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 shrink-0">
                    <CalendarDays size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Competência</p>
                      <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 whitespace-nowrap">Mês {mesAtual}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={exportarParaExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap"><FileSpreadsheet size={14} /> Exportar CSV</button>
                    <button onClick={exportarParaPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400 transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap"><FileText size={14} /> Gerar PDF</button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto w-full custom-scrollbar">
                <table id="tabela-apuracao" className="w-full min-w-[750px] text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-[#0c0c0e] text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 font-bold whitespace-nowrap">Marca</th>
                      <th className="px-5 py-3 font-bold text-right text-blue-600/70 whitespace-nowrap">Vendas (R$)</th>
                      <th className="px-5 py-3 font-bold text-right text-rose-500/70 whitespace-nowrap">(-) Devoluções</th>
                      <th className="px-5 py-3 font-bold text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Base Calculo</th>
                      <th className="px-5 py-3 font-bold text-center whitespace-nowrap">Regra (%)</th>
                      <th className="px-5 py-3 font-bold text-right text-indigo-600/80 whitespace-nowrap">Comissão (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {apuracaoDinamica.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-xs sm:text-sm">
                        <td className="px-5 py-3 font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{item.marca}</td>
                        <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{item.vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-right text-rose-500 dark:text-rose-400 whitespace-nowrap">{item.devolucoes > 0 ? `-${item.devolucoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</td>
                        <td className="px-5 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-900/20 whitespace-nowrap">{item.base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{item.regra.toFixed(1)}%</td>
                        <td className="px-5 py-3 text-right font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">R$ {item.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-100/80 dark:bg-[#0c0c0e]/80 border-t border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm">
                    <tr>
                      <td className="px-5 py-4 font-black text-zinc-900 dark:text-white uppercase tracking-widest whitespace-nowrap">Totais do Mês</td>
                      <td className="px-5 py-4 text-right font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">R$ {totalVendasBrutas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-right font-black text-rose-500 dark:text-rose-400 whitespace-nowrap">- R$ {totalDevolucoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-right font-black text-zinc-800 dark:text-zinc-200 whitespace-nowrap">R$ {totalBaseCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-center text-zinc-400 whitespace-nowrap">-</td>
                      <td className="px-5 py-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-base whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/10">R$ {totalComissaoCalculada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="p-5 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  <ShieldAlert size={16} className="text-indigo-500 shrink-0" />
                  <p>O fechamento congela a competência e envia o resultado ao <strong>Raizan Seller</strong>.</p>
                </div>
                <button onClick={handleFecharComissao} disabled={fechando} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 text-sm">
                  {fechando ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} {fechando ? "Processando..." : "Fechar Comissão e Enviar"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟢 MODAL COPIAR */}
      <AnimatePresence>
        {modalReplica && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-colors">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Copy size={20} /></div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white">Copiar Regras</h2>
                </div>
                <button onClick={() => setModalReplica(false)} className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"><X size={18} className="text-zinc-600 dark:text-zinc-400"/></button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Copie a regra Geral ({comissaoGeral}%) e as Exceções configuradas de <strong className="text-zinc-800 dark:text-zinc-200">{vendedor?.nome}</strong> para outros membros.</p>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Selecione os Destinos</p>
                    <button onClick={selecionarTodosVendedores} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{vendedoresSelecionados.length === vendedoresDestino.length ? 'Desmarcar Todos' : 'Selecionar Todos'}</button>
                  </div>
                  <div className="space-y-2">
                    {vendedoresDestino.map((v) => (
                      <label key={v.id} onClick={() => alternarVend(v.id)} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${vendedoresSelecionados.includes(v.id) ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${vendedoresSelecionados.includes(v.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-zinc-300 dark:border-zinc-600'}`}>
                          {vendedoresSelecionados.includes(v.id) && <CheckCircle2 size={14} />}
                        </div>
                        <div className="flex flex-col pointer-events-none">
                          <span className={`text-sm font-bold ${vendedoresSelecionados.includes(v.id) ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-700 dark:text-zinc-300'}`}>{v.nome}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">ID ERP: {v.codigo_erp || v.id}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] flex gap-3">
                <button onClick={() => setModalReplica(false)} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors text-sm">Cancelar</button>
                <button onClick={handleCopiarComissao} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all text-sm">Aplicar ({vendedoresSelecionados.length})</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}