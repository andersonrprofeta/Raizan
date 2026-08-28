"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Trophy, Medal, Plus, Copy, StopCircle, 
  CheckCircle2, Calendar, DollarSign, TrendingUp, 
  Layers, AlertTriangle, X, ChevronRight, BarChart3,
  Award
} from "lucide-react";
import toast from "react-hot-toast";

export default function TabMetasCampanhas({ vendedor }) {
  // 🟢 ESTADOS DE NAVEGAÇÃO E MODAIS
  const [subAba, setSubAba] = useState("campanhas"); // 'campanhas' ou 'metas'
  const [modalNovaCampanha, setModalNovaCampanha] = useState(false);
  const [modalReplicarMetas, setModalReplicarMetas] = useState(false);
  const [modalEncerrar, setModalEncerrar] = useState(false);

  // 🟢 MOCKS: CAMPANHAS ATIVAS (Estilo Rafany)
  const [campanhas, setCampanhas] = useState([
    {
      id: 1,
      nome: "Explosão Truss Hair - Agosto",
      marca: "Truss Hair",
      validade: "31/08/2026",
      status: "ativa",
      faixas: [
        { id: 1, meta: 5000, premio: 250 },
        { id: 2, meta: 10000, premio: 500 },
        { id: 3, meta: 20000, premio: 1200 },
      ],
      ranking: [
        { pos: 1, nome: "Maria Santos", valor: 18500, foto: null },
        { pos: 2, nome: vendedor?.nome || "Vendedor Atual", valor: 12400, foto: vendedor?.foto },
        { pos: 3, nome: "Carlos Oliveira", valor: 9800, foto: null },
        { pos: 4, nome: "Ana Paula", valor: 4200, foto: null },
      ]
    }
  ]);

  // 🟢 MOCKS: METAS DO VENDEDOR (Mês Atual)
  const [metas, setMetas] = useState([
    { id: 1, tipo: "Geral", alvo: 80000, realizado: 54000 },
    { id: 2, tipo: "Marca", nome: "Wella Professionals", alvo: 15000, realizado: 12500 },
    { id: 3, tipo: "Marca", nome: "L'Oréal", alvo: 10000, realizado: 4200 },
  ]);

  // 🟢 ESTADOS PARA NOVA CAMPANHA
  const [novaCampNome, setNovaCampNome] = useState("");
  const [novaCampMarca, setNovaCampMarca] = useState("");
  const [novaCampValidade, setNovaCampValidade] = useState("");
  const [novaCampFaixas, setNovaCampFaixas] = useState([{ id: Date.now(), meta: "", premio: "" }]);

  // 🟢 ESTADOS PARA REPLICAR METAS
  const [acrescimoMeta, setAcrescimoMeta] = useState(10);

  // 🛠️ FUNÇÕES DE MANIPULAÇÃO DE FAIXAS (NOVA CAMPANHA)
  const addFaixa = () => {
    setNovaCampFaixas([...novaCampFaixas, { id: Date.now(), meta: "", premio: "" }]);
  };

  const removeFaixa = (id) => {
    if (novaCampFaixas.length > 1) {
      setNovaCampFaixas(novaCampFaixas.filter(f => f.id !== id));
    }
  };

  const handleFaixaChange = (id, campo, valor) => {
    setNovaCampFaixas(novaCampFaixas.map(f => f.id === id ? { ...f, [campo]: Number(valor) } : f));
  };

  const salvarCampanha = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Criando campanha...");
    setTimeout(() => {
      toast.success("Campanha ativada e ranking iniciado!", { id: toastId });
      setModalNovaCampanha(false);
      // Aqui entraria a lógica real de add no array/banco
    }, 1500);
  };

  const encerrarCampanha = () => {
    const toastId = toast.loading("Calculando prêmios e encerrando...");
    setTimeout(() => {
      toast.success("Campanha encerrada. Prêmios creditados na Conta Flex!", { id: toastId });
      setModalEncerrar(false);
    }, 2000);
  };

  const replicarMetas = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Calculando novos valores baseados no mês anterior...");
    setTimeout(() => {
      toast.success(`Metas replicadas com +${acrescimoMeta}% de acréscimo!`, { id: toastId });
      setModalReplicarMetas(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 🟢 CABEÇALHO E TABS */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 min-w-[250px]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Metas e Campanhas</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Gerencie prêmios, rankings e objetivos do vendedor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            onClick={() => setSubAba('campanhas')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${subAba === 'campanhas' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <Award size={16} /> Campanhas
          </button>
          <button 
            onClick={() => setSubAba('metas')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${subAba === 'metas' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <Target size={16} /> Metas Mensais
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ============================================================== */}
        {/* 🟢 ABA: CAMPANHAS ATIVAS E RANKING (ESTILO RAFANY / NASA)      */}
        {/* ============================================================== */}
        {subAba === 'campanhas' ? (
          <motion.div key="campanhas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            <div className="flex justify-end">
              <button onClick={() => setModalNovaCampanha(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] flex items-center gap-2">
                <Plus size={18} /> Nova Campanha
              </button>
            </div>

            {campanhas.map(camp => (
              <div key={camp.id} className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl">
                
                {/* Background Espacial / Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-[#09090b] z-0"></div>
                {/* Efeito de Vidro (Glassmorphism) no topo */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-0"></div>

                {/* 🟢 LAYOUT CORRIGIDO: APENAS FLEX-COL PARA O PAINEL RESPIRAR */}
                <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-6">
                  
                  {/* TOPO: INFOS E FAIXAS DE PRÊMIO */}
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Ao Vivo
                        </span>
                        <span className="bg-white/10 text-white/80 border border-white/10 px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5">
                          <Calendar size={12} /> Expira em {camp.validade}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                        {camp.nome}
                      </h2>
                      <p className="text-indigo-200 font-medium flex items-center gap-2 mt-2">
                        <Layers size={16} /> Marca: {camp.marca}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Faixas de Premiação</p>
                      {camp.faixas.map((faixa, index) => {
                        const isTop = index === camp.faixas.length - 1;
                        return (
                          <div key={faixa.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isTop ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTop ? 'bg-amber-500/30 text-amber-400' : 'bg-white/10 text-white'}`}>
                                <Target size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs text-white/60 uppercase font-bold">Vendeu acima de</p>
                                <p className="text-base sm:text-lg font-black text-white">R$ {faixa.meta.toLocaleString('pt-BR')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] sm:text-xs text-white/60 uppercase font-bold">Ganha</p>
                              <p className={`text-xl sm:text-2xl font-black ${isTop ? 'text-amber-400' : 'text-emerald-400'}`}>
                                R$ {faixa.premio.toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2">
                      <button onClick={() => setModalEncerrar(true)} className="w-full sm:w-auto bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                        <StopCircle size={18} /> Encerrar Campanha
                      </button>
                    </div>
                  </div>

                  {/* BASE: RANKING DA NASA (AGORA OCUPANDO 100% DA LARGURA) */}
                  <div className="w-full mt-2">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="text-lg font-black text-white flex items-center gap-2">
                          <Trophy className="text-amber-400" size={20} /> Ranking Atual
                        </h4>
                        <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Ver Completo</button>
                      </div>

                      <div className="space-y-3">
                        {camp.ranking.map((rank) => {
                          const isOuro = rank.pos === 1;
                          const isPrata = rank.pos === 2;
                          const isBronze = rank.pos === 3;
                          const isVendedorAtual = rank.nome === (vendedor?.nome || "Vendedor Atual");

                          const perc = (rank.valor / camp.ranking[0].valor) * 100;

                          return (
                            <div key={rank.pos} className={`relative p-4 rounded-2xl border transition-all ${isVendedorAtual ? 'bg-indigo-600/20 border-indigo-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {isOuro && <Medal size={24} className="text-amber-400 absolute -top-3 -left-3 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
                                    {isPrata && <Medal size={24} className="text-zinc-300 absolute -top-3 -left-3" />}
                                    {isBronze && <Medal size={24} className="text-orange-400 absolute -top-3 -left-3" />}
                                    
                                    <div className={`w-10 h-10 rounded-full bg-zinc-800 border-2 flex items-center justify-center overflow-hidden ${isOuro ? 'border-amber-400' : isPrata ? 'border-zinc-300' : isBronze ? 'border-orange-400' : 'border-zinc-700'}`}>
                                      {rank.foto ? <img src={rank.foto} alt="Foto" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-white">{rank.pos}º</span>}
                                    </div>
                                  </div>
                                  <div>
                                    <p className={`font-bold text-sm ${isVendedorAtual ? 'text-indigo-300' : 'text-zinc-200'}`}>
                                      {rank.nome} {isVendedorAtual && "(Este)"}
                                    </p>
                                    <p className="text-xs text-zinc-400 font-mono">R$ {rank.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-1 rounded-md">{rank.pos}º LUGAR</span>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden mt-1">
                                <div style={{ width: `${perc}%` }} className={`h-full rounded-full ${isOuro ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : isPrata ? 'bg-zinc-300' : isBronze ? 'bg-orange-400' : 'bg-indigo-500'}`}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          
          /* ============================================================== */
          /* 🟢 ABA: METAS MENSAIS E REPLICAÇÃO                           */
          /* ============================================================== */
          <motion.div key="metas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Target size={18} className="text-indigo-500"/> Metas do Mês Atual
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Acompanhamento de objetivos gerais e por marcas.
                </p>
              </div>
              
              <button 
                onClick={() => setModalReplicarMetas(true)}
                className="w-full sm:w-auto bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <Copy size={16} /> Replicar do Mês Anterior
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metas.map((meta) => {
                const percAtingido = (meta.realizado / meta.alvo) * 100;
                const isMetaBatida = percAtingido >= 100;

                return (
                  <div key={meta.id} className={`bg-white dark:bg-[#121214] border rounded-2xl p-5 shadow-sm transition-all ${isMetaBatida ? 'border-emerald-500/50' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.tipo === 'Geral' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600'}`}>
                          {meta.tipo === 'Geral' ? <BarChart3 size={20} /> : <Layers size={20} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{meta.tipo}</p>
                          <h4 className="font-black text-zinc-900 dark:text-white">{meta.nome || "Faturamento Total"}</h4>
                        </div>
                      </div>
                      {isMetaBatida && (
                        <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> Batida
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-xs text-zinc-500">Realizado</p>
                        <p className="text-xl font-black text-zinc-900 dark:text-white">R$ {meta.realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Alvo</p>
                        <p className="text-sm font-bold text-zinc-400">R$ {meta.alvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(percAtingido, 100)}%` }} 
                        className={`h-full rounded-full transition-all duration-1000 ${isMetaBatida ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs font-bold">
                      <span className={isMetaBatida ? 'text-emerald-500' : 'text-indigo-500'}>{percAtingido.toFixed(1)}% Atingido</span>
                      <span className="text-zinc-400">Faltam R$ {Math.max(0, meta.alvo - meta.realizado).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )
              })}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 🟢 MODAIS                                                      */}
      {/* ============================================================== */}

      {/* MODAL: NOVA CAMPANHA */}
      <AnimatePresence>
        {modalNovaCampanha && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#18181b]">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2"><Trophy className="text-indigo-500"/> Criar Nova Campanha</h2>
                <button onClick={() => setModalNovaCampanha(false)} className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"><X size={20} className="text-zinc-600 dark:text-zinc-400"/></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nome da Campanha</label>
                    <input type="text" value={novaCampNome} onChange={(e) => setNovaCampNome(e.target.value)} placeholder="Ex: Explosão de Vendas Maio" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Marca Alvo (Opcional)</label>
                    <input type="text" value={novaCampMarca} onChange={(e) => setNovaCampMarca(e.target.value)} placeholder="Ex: Truss Hair" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Data de Expiração</label>
                    <input type="date" value={novaCampValidade} onChange={(e) => setNovaCampValidade(e.target.value)} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white" />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-zinc-900 dark:text-white">Faixas de Premiação</label>
                    <button onClick={addFaixa} type="button" className="text-xs font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors">
                      <Plus size={14} /> Adicionar Faixa
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {novaCampFaixas.map((faixa, i) => (
                      <div key={faixa.id} className="flex flex-col sm:flex-row gap-3 items-center bg-zinc-50 dark:bg-[#18181b] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">{i + 1}</div>
                        <div className="flex-1 w-full relative">
                          <span className="absolute left-3 top-3 text-zinc-400 text-sm font-bold">R$</span>
                          <input type="number" placeholder="Vendeu acima de..." value={faixa.meta} onChange={(e) => handleFaixaChange(faixa.id, 'meta', e.target.value)} className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 pl-9 text-sm outline-none focus:border-indigo-500 text-zinc-900 dark:text-white" />
                        </div>
                        <ArrowRight className="hidden sm:block text-zinc-300 dark:text-zinc-600" size={16} />
                        <div className="flex-1 w-full relative">
                          <span className="absolute left-3 top-3 text-emerald-500 text-sm font-bold">R$</span>
                          <input type="number" placeholder="Prêmio ao vendedor" value={faixa.premio} onChange={(e) => handleFaixaChange(faixa.id, 'premio', e.target.value)} className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 pl-9 text-sm outline-none focus:border-emerald-500 text-zinc-900 dark:text-white font-bold" />
                        </div>
                        <button onClick={() => removeFaixa(faixa.id)} type="button" className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] flex gap-3">
                <button onClick={() => setModalNovaCampanha(false)} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors">Cancelar</button>
                <button onClick={salvarCampanha} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all">Salvar e Ativar Ranking</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ENCERRAR CAMPANHA */}
      <AnimatePresence>
        {modalEncerrar && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Encerrar Campanha?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                O ranking será congelado e os prêmios serão calculados e enviados para a Conta Flex dos ganhadores.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalEncerrar(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold">Voltar</button>
                <button onClick={encerrarCampanha} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">Sim, Encerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REPLICAR METAS DO MÊS ANTERIOR */}
      <AnimatePresence>
        {modalReplicarMetas && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Copy size={24} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Replicar do Mês Anterior</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Isso criará as metas deste mês baseadas nos alvos do mês passado. Você pode aplicar um acréscimo automático.
              </p>
              
              <div className="mb-6">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Acréscimo Percentual (%)</label>
                <div className="relative">
                  <input type="number" value={acrescimoMeta} onChange={(e) => setAcrescimoMeta(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-10 text-lg font-bold outline-none focus:border-indigo-500 text-zinc-900 dark:text-white" />
                  <span className="absolute left-4 top-3.5 text-zinc-400 font-bold">+</span>
                  <span className="absolute right-4 top-3.5 text-zinc-400 font-bold">%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setModalReplicarMetas(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold">Cancelar</button>
                <button onClick={replicarMetas} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.3)]">Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}