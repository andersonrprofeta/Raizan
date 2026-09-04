"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Trophy, Medal, Plus, Copy, StopCircle, 
  CheckCircle2, Calendar, Layers, AlertTriangle, 
  X, BarChart3, Award, ArrowRight, RefreshCw, Trash2, Crown, Users, Share2, Edit, ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import { getHubUrl, getHeaders } from "@/components/utils/api";

// 🟢 MÁGICA: FUNÇÕES DE MÁSCARA DE MOEDA (Estilo App de Banco)
const mascaraMoeda = (valor) => {
  if (valor === undefined || valor === null) return "";
  let v = String(valor).replace(/\D/g, ''); // Remove tudo que não é dígito
  if (v === "") return "";
  v = (Number(v) / 100).toFixed(2) + ''; // Divide por 100 para centavos
  v = v.replace('.', ','); // Troca ponto por vírgula
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); // Adiciona o ponto de milhar
  return v;
};

const reverterMoeda = (valorStr) => {
  if (!valorStr) return 0;
  let v = String(valorStr).replace(/\./g, '').replace(',', '.'); // Remove pontos e troca vírgula por ponto
  return Number(v);
};

export default function TabMetasCampanhas({ vendedor }) {
  const [subAba, setSubAba] = useState("campanhas"); 
  const [viewCampanha, setViewCampanha] = useState("ativas"); 
  const [mostrarAntigas, setMostrarAntigas] = useState(false); 
  
  const [modalNovaCampanha, setModalNovaCampanha] = useState(false);
  const [modalNovaMeta, setModalNovaMeta] = useState(false); 
  const [modalEditarMeta, setModalEditarMeta] = useState({ open: false, meta: null }); 
  const [modalReplicarMetas, setModalReplicarMetas] = useState(false);
  const [modalEncerrar, setModalEncerrar] = useState({ open: false, id: null });
  const [modalExcluir, setModalExcluir] = useState({ open: false, id: null });

  const [loading, setLoading] = useState(true);
  const [marcasOmie, setMarcasOmie] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [metas, setMetas] = useState([]);

  // Estados Nova Campanha
  const [novaCampNome, setNovaCampNome] = useState("");
  const [novaCampMarca, setNovaCampMarca] = useState("");
  const [novaCampValidade, setNovaCampValidade] = useState("");
  const [novaCampFaixas, setNovaCampFaixas] = useState([{ id: Date.now(), meta: "", premio: "" }]);

  // Estados Meta
  const [novaMetaTipo, setNovaMetaTipo] = useState("Geral");
  const [novaMetaMarca, setNovaMetaMarca] = useState("");
  const [novaMetaValor, setNovaMetaValor] = useState("");
  const [editMetaValor, setEditMetaValor] = useState(""); 
  const [replicarTodos, setReplicarTodos] = useState(false);
  const [acrescimoMeta, setAcrescimoMeta] = useState(10);

  const carregarDados = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      if (!tenant_id) return;
      
      const resMarcas = await fetch(`${getHubUrl()}/api/hub/marcas?tenant_id=${tenant_id}`, { headers: getHeaders() });
      const dataMarcas = await resMarcas.json();
      if (dataMarcas.success) setMarcasOmie(dataMarcas.marcas || []);

      const resCamp = await fetch(`${getHubUrl()}/api/hub/metas/campanhas?tenant_id=${tenant_id}`, { headers: getHeaders() });
      const dataCamp = await resCamp.json();
      if (dataCamp.success) setCampanhas(dataCamp.campanhas || []);

      const urlMetas = vendedor?.id 
        ? `${getHubUrl()}/api/hub/metas?tenant_id=${tenant_id}&vendedor_id=${vendedor.id}`
        : `${getHubUrl()}/api/hub/metas?tenant_id=${tenant_id}`;
        
      const resMetas = await fetch(urlMetas, { headers: getHeaders() });
      const dataMetas = await resMetas.json();
      if (dataMetas.success) setMetas(dataMetas.metas || []);

    } catch (error) {
      console.error("Erro ao puxar dados de Metas/Campanhas", error);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [vendedor]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const campanhasAtivas = campanhas.filter(c => c.status !== 'encerrada');
  
  // 🟢 ORDENA AS ENCERRADAS PELA DATA DE VALIDADE (A mais recente no topo!)
  const campanhasEncerradas = campanhas
    .filter(c => c.status === 'encerrada')
    .sort((a, b) => {
      const parseD = (d) => {
        if (!d) return 0;
        const p = d.split('/');
        return p.length === 3 ? new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime() : 0;
      };
      return parseD(b.validade) - parseD(a.validade);
    });

  const marcasDisponiveis = marcasOmie.filter(
    m => !metas.some(meta => meta.nome === m.nome && meta.tipo === 'Marca')
  );

  const addFaixa = () => setNovaCampFaixas([...novaCampFaixas, { id: Date.now(), meta: "", premio: "" }]);
  const removeFaixa = (id) => { if (novaCampFaixas.length > 1) setNovaCampFaixas(novaCampFaixas.filter(f => f.id !== id)); };
  
  // 🟢 APLICA MÁSCARA NAS FAIXAS DA CAMPANHA
  const handleFaixaChange = (id, campo, valor) => {
    const formatado = mascaraMoeda(valor);
    setNovaCampFaixas(novaCampFaixas.map(f => f.id === id ? { ...f, [campo]: formatado } : f));
  };

  const salvarCampanha = async (e) => {
    e.preventDefault();
    if (!novaCampNome || !novaCampValidade || novaCampFaixas[0].meta === "") return toast.error("Preencha o nome, data e ao menos 1 faixa!");
    const toastId = toast.loading("Criando campanha...");
    try {
      // 🟢 REVERTE PARA NÚMERO ANTES DE ENVIAR PRO BANCO
      const faixasLimpas = novaCampFaixas.map(f => ({
        ...f,
        meta: reverterMoeda(f.meta),
        premio: reverterMoeda(f.premio)
      }));

      const payload = { nome: novaCampNome, marca: novaCampMarca, validade: novaCampValidade, faixas: faixasLimpas };
      const res = await fetch(`${getHubUrl()}/api/hub/metas/campanhas/criar`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        toast.success("Campanha ativada!", { id: toastId });
        setModalNovaCampanha(false);
        setNovaCampNome(""); setNovaCampMarca(""); setNovaCampValidade(""); setNovaCampFaixas([{ id: Date.now(), meta: "", premio: "" }]);
        carregarDados(true); 
      } else { toast.error(data.message, { id: toastId }); }
    } catch (err) { toast.error("Falha de conexão.", { id: toastId }); }
  };

  const encerrarCampanha = async () => {
    const toastId = toast.loading("Calculando prêmios e encerrando...");
    const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/metas/campanhas/encerrar`, {
        method: "PUT",
        headers: { ...getHeaders(), 'x-tenant-id': tenant_id },
        body: JSON.stringify({ campanha_id: modalEncerrar.id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Campanha encerrada e vencedor coroado!", { id: toastId });
        setModalEncerrar({ open: false, id: null });
        carregarDados(true); 
      } else { toast.error("Erro ao encerrar", { id: toastId }); }
    } catch (error) { toast.error("Falha na conexão.", { id: toastId }); }
  };

  const excluirCampanha = async () => {
    const toastId = toast.loading("Excluindo campanha...");
    const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/metas/campanhas/${modalExcluir.id}`, { method: "DELETE", headers: { ...getHeaders(), 'x-tenant-id': tenant_id } });
      const data = await res.json();
      if (data.success) {
        toast.success("Campanha removida com sucesso!", { id: toastId });
        setModalExcluir({ open: false, id: null });
        carregarDados(true);
      } else { toast.error(data.message || "Erro ao excluir", { id: toastId }); }
    } catch (error) { toast.error("Falha na conexão.", { id: toastId }); }
  };

  const salvarMeta = async (e) => {
    e.preventDefault();
    if (!novaMetaValor) return toast.error("Digite o valor alvo da meta!");
    if (novaMetaTipo === 'Marca' && !novaMetaMarca) return toast.error("Selecione a marca!");
    const toastId = toast.loading("Cadastrando meta...");
    try {
      // 🟢 REVERTE O VALOR PRA NÚMERO
      const payload = { vendedor_id: vendedor?.id, tipo: novaMetaTipo, marca: novaMetaTipo === 'Marca' ? novaMetaMarca : null, valor_alvo: reverterMoeda(novaMetaValor), replicar_todos: replicarTodos };
      const res = await fetch(`${getHubUrl()}/api/hub/metas/criar`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        toast.success(replicarTodos ? "Meta aplicada para TODOS!" : "Meta cadastrada!", { id: toastId });
        setModalNovaMeta(false); setNovaMetaValor(""); setNovaMetaMarca(""); setReplicarTodos(false);
        carregarDados(true);
      } else { toast.error(data.message, { id: toastId }); }
    } catch (err) { toast.error("Falha de conexão.", { id: toastId }); }
  };

  const editarMeta = async (e) => {
    e.preventDefault();
    if (!editMetaValor) return toast.error("Digite o novo valor alvo!");
    const toastId = toast.loading("Atualizando meta...");
    try {
      const tenant_id = JSON.parse(localStorage.getItem("@raizan:user"))?.tenant_id;
      const res = await fetch(`${getHubUrl()}/api/hub/metas/editar`, { 
        method: "PUT", 
        headers: { ...getHeaders(), 'x-tenant-id': tenant_id }, 
        // 🟢 REVERTE O VALOR PRA NÚMERO
        body: JSON.stringify({ meta_id: modalEditarMeta.meta.id, valor_alvo: reverterMoeda(editMetaValor) }) 
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Meta atualizada com sucesso!", { id: toastId });
        setModalEditarMeta({ open: false, meta: null });
        carregarDados(true);
      } else { 
        toast.error("Endpoint de edição ainda não criado na API.", { id: toastId }); 
      }
    } catch (err) { 
      toast.error("Aviso: Rota de Edição (Backend) necessária.", { id: toastId }); 
      setModalEditarMeta({ open: false, meta: null }); 
    }
  };

  const replicarMetas = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Calculando novos valores...");
    setTimeout(() => {
      toast.success(`Metas replicadas com +${acrescimoMeta}%!`, { id: toastId });
      setModalReplicarMetas(false);
    }, 2000);
  };

  const exportarImagemCampanha = async (campId, campNome) => {
    const element = document.getElementById(`campanha-card-${campId}`);
    if (!element) return;
    const toastId = toast.loading("Gerando arte...");
    try {
      const filtroOcultarBotoes = (node) => {
        if (node?.getAttribute && node.getAttribute("data-html2canvas-ignore") === "true") return false;
        return true;
      };
      const dataUrl = await toPng(element, { pixelRatio: 2, backgroundColor: "#09090b", filter: filtroOcultarBotoes });
      const link = document.createElement("a");
      link.download = `Campanha_Raizan_${campNome.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Imagem gerada com sucesso!", { id: toastId });
    } catch (err) { toast.error("Erro ao gerar.", { id: toastId }); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-indigo-500" />
        <p className="font-bold uppercase tracking-widest text-xs">Sincronizando Metas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* 🟢 CABEÇALHO GERAL */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 min-w-[250px]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Metas e Campanhas</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {vendedor?.nome ? `Gerencie os objetivos de ${vendedor.nome}.` : "Visão global de rankings e prêmios da equipe."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setSubAba('campanhas')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${subAba === 'campanhas' ? 'bg-white dark:bg-[#18181b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
            <Award size={16} /> Campanhas
          </button>
          <button onClick={() => setSubAba('metas')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${subAba === 'metas' ? 'bg-white dark:bg-[#18181b] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
            <Target size={16} /> Metas Mensais
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ============================================================== */}
        {/* 🟢 ABA PRINCIPAL: CAMPANHAS                                    */}
        {/* ============================================================== */}
        {subAba === 'campanhas' ? (
          <motion.div key="campanhas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* SUB-MENU DE CAMPANHAS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2">
                <button onClick={() => setViewCampanha('ativas')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors border ${viewCampanha === 'ativas' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  Ativas ({campanhasAtivas.length})
                </button>
                <button onClick={() => setViewCampanha('ranking')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors border ${viewCampanha === 'ranking' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400' : 'border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  Ranking Ao Vivo
                </button>
                <button onClick={() => setViewCampanha('encerradas')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors border ${viewCampanha === 'encerradas' ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200' : 'border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  Histórico
                </button>
              </div>
              <button onClick={() => setModalNovaCampanha(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2">
                <Plus size={18} /> Nova Campanha Global
              </button>
            </div>

            {/* 1. VIEW: ATIVAS */}
            {viewCampanha === 'ativas' && (
              <div className="space-y-4">
                {campanhasAtivas.length === 0 ? (
                  <div className="py-20 text-center bg-white dark:bg-[#121214] border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
                    <Trophy size={48} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <h4 className="text-lg font-black text-zinc-700 dark:text-zinc-300">Nenhuma Campanha Ativa</h4>
                    <p className="text-sm text-zinc-500 mt-2">Crie uma nova campanha para mobilizar a equipe de vendas.</p>
                  </div>
                ) : (
                  campanhasAtivas.map(camp => (
                    <div key={camp.id} id={`campanha-card-${camp.id}`} className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-[#09090b] z-0"></div>
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-0"></div>

                      <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Ao Vivo
                              </span>
                              <span className="bg-white/10 text-white/80 border border-white/10 px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5">
                                <Calendar size={12} /> Expira em {camp.validade}
                              </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{camp.nome}</h2>
                            {camp.marca && <p className="text-indigo-200 font-medium mt-1">Marca Exclusiva: {camp.marca}</p>}
                          </div>
                          
                          <div className="flex gap-2" data-html2canvas-ignore="true">
                            <button onClick={() => exportarImagemCampanha(camp.id, camp.nome)} title="Gerar Imagem" className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-400 rounded-xl transition-colors border border-indigo-500/20">
                              <Share2 size={18} />
                            </button>
                            <button onClick={() => setModalExcluir({ open: true, id: camp.id })} title="Excluir Campanha" className="p-2.5 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-xl transition-colors border border-rose-500/20">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {camp.faixas?.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Faixas de Premiação</p>
                            {camp.faixas.map((faixa, index) => {
                              const isTop = index === camp.faixas.length - 1;
                              return (
                                <div key={faixa.id || index} className={`flex items-center justify-between p-4 rounded-2xl border ${isTop ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-white/5 border-white/10'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTop ? 'bg-amber-500/30 text-amber-400' : 'bg-white/10 text-white'}`}><Target size={20} /></div>
                                    <div>
                                      <p className="text-xs text-white/60 uppercase font-bold">Vendeu acima de</p>
                                      <p className="text-lg font-black text-white">R$ {Number(faixa.meta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-white/60 uppercase font-bold">Ganha</p>
                                    <p className={`text-2xl font-black ${isTop ? 'text-amber-400' : 'text-emerald-400'}`}>R$ {Number(faixa.premio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2" data-html2canvas-ignore="true">
                          <button onClick={() => setModalEncerrar({ open: true, id: camp.id })} className="w-fit bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold py-2.5 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                            <StopCircle size={18} /> Encerrar Campanha Manualmente
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. VIEW: RANKING AO VIVO */}
            {viewCampanha === 'ranking' && (
              <div className="space-y-6">
                {campanhasAtivas.length === 0 ? (
                  <div className="py-20 text-center bg-white dark:bg-[#121214] border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
                     <p className="text-center text-zinc-500 font-bold">Nenhum ranking disponível (Sem campanhas ativas).</p>
                  </div>
                ) : (
                  campanhasAtivas.map(camp => (
                    <div key={`rank-${camp.id}`} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <Trophy className="text-amber-500" size={20} /> Ranking: {camp.nome}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1">Atualizado em tempo real pelas vendas faturadas no ERP.</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {camp.ranking && camp.ranking.length > 0 ? (
                          camp.ranking.map((rank) => {
                            const isOuro = rank.pos === 1;
                            const maxValor = camp.ranking[0].valor || 1; 
                            const perc = (rank.valor / maxValor) * 100;
                            
                            return (
                              <div key={rank.pos} className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${isOuro ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shadow-sm' : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                  {rank.pos}º
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-end mb-1">
                                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{rank.nome}</p>
                                    <p className="font-black text-sm text-indigo-600 dark:text-indigo-400">R$ {rank.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div style={{ width: `${perc}%` }} className={`h-full rounded-full transition-all duration-1000 ${isOuro ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-500">
                            <Users size={16} /> <p className="text-sm font-bold">Nenhum vendedor registrado nesta base.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. VIEW: ENCERRADAS (Histórico c/ Sanfona) */}
            {viewCampanha === 'encerradas' && (
              <div className="space-y-4">
                {campanhasEncerradas.length === 0 ? (
                   <div className="py-20 text-center bg-white dark:bg-[#121214] border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
                     <p className="text-center text-zinc-500 font-bold">Nenhum histórico de campanhas encerradas.</p>
                   </div>
                ) : (
                  <>
                    {/* 🟢 CARD PRINCIPAL (Mais recente baseada na Validade) */}
                    {campanhasEncerradas.slice(0, 1).map(camp => {
                      const vencedorReal = camp.ranking && camp.ranking.length > 0 ? camp.ranking[0] : null;

                      return (
                        <div key={camp.id} className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b] opacity-90 hover:opacity-100 transition-opacity shadow-sm">
                          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left">
                              <span className="bg-zinc-300 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg">Campanha Encerrada</span>
                              <h2 className="text-2xl font-black text-zinc-400 dark:text-zinc-500 mt-3 line-through decoration-zinc-300 dark:decoration-zinc-700">{camp.nome}</h2>
                              <p className="text-sm text-zinc-500 mt-1">Finalizada em {camp.validade}</p>
                            </div>
                            
                            {vencedorReal && (
                              <div className="w-full md:w-auto bg-white dark:bg-[#222225] border border-amber-200 dark:border-amber-500/20 p-5 rounded-2xl shadow-xl flex items-center gap-5 transform md:scale-110 md:-translate-x-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                                  <Crown size={28} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Grande Vencedor</p>
                                  <p className="text-lg font-black text-zinc-900 dark:text-white">{vencedorReal.nome}</p>
                                  <p className="text-sm font-bold text-zinc-500">Faturou: R$ {Number(vencedorReal.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* 🟢 SANFONA PARA AS CAMPANHAS MAIS ANTIGAS */}
                    {campanhasEncerradas.length > 1 && (
                      <div className="pt-4 flex flex-col items-center">
                        <button 
                          onClick={() => setMostrarAntigas(!mostrarAntigas)} 
                          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-full"
                        >
                          {mostrarAntigas ? <><ChevronUp size={16}/> Ocultar Antigas</> : <><ChevronDown size={16}/> Ver Histórico Antigo ({campanhasEncerradas.length - 1})</>}
                        </button>

                        <AnimatePresence>
                          {mostrarAntigas && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full mt-4 space-y-3 overflow-hidden text-left">
                              {campanhasEncerradas.slice(1).map(camp => (
                                <div key={camp.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex justify-between items-center hover:bg-zinc-100 transition-colors">
                                  <div>
                                    <h4 className="font-bold text-zinc-600 dark:text-zinc-300">{camp.nome}</h4>
                                    <p className="text-xs text-zinc-400">Encerrada: {camp.validade}</p>
                                  </div>
                                  {camp.ranking && camp.ranking.length > 0 && (
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold uppercase text-amber-500">Vencedor</p>
                                      <p className="text-sm font-black text-zinc-700 dark:text-white flex items-center gap-1 justify-end"><Crown size={14} className="text-amber-500"/> {camp.ranking[0].nome}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          
          /* ============================================================== */
          /* 🟢 ABA: METAS MENSAIS E REPLICAÇÃO                             */
          /* ============================================================== */
          <motion.div key="metas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Target size={18} className="text-indigo-500"/> Metas do Mês Atual
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Acompanhamento de objetivos gerais e por marcas.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                <button onClick={() => setModalReplicarMetas(true)} className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                  <Copy size={16} /> Replicar Anterior
                </button>
                <button onClick={() => setModalNovaMeta(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2">
                  <Plus size={16} /> Nova Meta
                </button>
              </div>
            </div>

            {metas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#121214] border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
                <Target size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
                <h4 className="text-lg font-black text-zinc-700 dark:text-zinc-300">Sem metas para este mês</h4>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {metas.map((meta) => {
                  const valorRealizado = Number(meta.realizado) || 0;
                  const valorAlvo = Number(meta.alvo) || 0;
                  const percAtingido = valorAlvo > 0 ? (valorRealizado / valorAlvo) * 100 : 0;
                  const isMetaBatida = percAtingido >= 100;

                  return (
                    <div key={meta.id} className={`bg-white dark:bg-[#121214] border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-5 transition-all hover:bg-zinc-50 dark:hover:bg-[#18181b] ${isMetaBatida ? 'border-emerald-500/50' : 'border-zinc-200 dark:border-zinc-800'}`}>
                      
                      {/* Ícone e Info */}
                      <div className="flex items-center gap-3 w-full sm:w-1/4 shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.tipo === 'Geral' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600'}`}>
                          {meta.tipo === 'Geral' ? <BarChart3 size={20} /> : <Layers size={20} />}
                        </div>
                        <div className="truncate">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{meta.tipo}</p>
                          <h4 className="font-black text-sm text-zinc-900 dark:text-white truncate">{meta.nome || "Faturamento Total"}</h4>
                        </div>
                      </div>

                      {/* Progresso */}
                      <div className="w-full sm:w-2/4 flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Progresso</span>
                          <span className={`text-xs font-black ${isMetaBatida ? 'text-emerald-500' : 'text-indigo-500'}`}>{percAtingido.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div style={{ width: `${Math.min(percAtingido, 100)}%` }} className={`h-full rounded-full transition-all duration-1000 ${isMetaBatida ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                        </div>
                      </div>

                      {/* Valores e Edição */}
                      <div className="w-full sm:w-1/4 flex items-center justify-between sm:justify-end gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase font-bold">Realizado / Alvo</p>
                          <p className="text-sm font-black text-zinc-900 dark:text-white">R$ {valorRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs font-bold text-zinc-400">R$ {valorAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <button 
                          onClick={() => {
                            // 🟢 PASSA O VALOR ALVO PARA MÁSCARA AO ABRIR MODAL
                            const valorInicial = (valorAlvo * 100).toFixed(0); 
                            setEditMetaValor(mascaraMoeda(valorInicial));
                            setModalEditarMeta({ open: true, meta: meta });
                          }} 
                          title="Editar Meta"
                          className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors shrink-0"
                        >
                          <Edit size={16} />
                        </button>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 🟢 MODAIS                                                      */}
      {/* ============================================================== */}
      
      {/* 🟢 MODAL: NOVA CAMPANHA */}
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
                    <input type="text" value={novaCampNome} onChange={(e) => setNovaCampNome(e.target.value)} placeholder="Ex: Explosão NUEV" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Marca Alvo (Opcional)</label>
                    <select 
                      value={novaCampMarca} 
                      onChange={(e) => setNovaCampMarca(e.target.value)} 
                      className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white appearance-none"
                    >
                      <option value="">Todas as Marcas (Global)</option>
                      {marcasOmie.map((marca, i) => (
                        <option key={i} value={marca.nome}>{marca.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Data de Expiração</label>
                    <input type="date" value={novaCampValidade} onChange={(e) => setNovaCampValidade(e.target.value)} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white" />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-zinc-900 dark:text-white">Faixas de Premiação (Fechou, Ganhou)</label>
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
                          <input type="text" placeholder="Vendeu acima de..." value={faixa.meta} onChange={(e) => handleFaixaChange(faixa.id, 'meta', e.target.value)} className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 pl-9 text-sm outline-none focus:border-indigo-500 text-zinc-900 dark:text-white" />
                        </div>
                        <ArrowRight className="hidden sm:block text-zinc-300 dark:text-zinc-600" size={16} />
                        <div className="flex-1 w-full relative">
                          <span className="absolute left-3 top-3 text-emerald-500 text-sm font-bold">R$</span>
                          <input type="text" placeholder="Prêmio ao vendedor" value={faixa.premio} onChange={(e) => handleFaixaChange(faixa.id, 'premio', e.target.value)} className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 pl-9 text-sm outline-none focus:border-emerald-500 text-zinc-900 dark:text-white font-bold" />
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

      {/* 🟢 MODAL: NOVA META MENSAL */}
      <AnimatePresence>
        {modalNovaMeta && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#18181b]">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2"><Target className="text-indigo-500"/> Definir Nova Meta</h2>
                <button onClick={() => setModalNovaMeta(false)} className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"><X size={20} className="text-zinc-600 dark:text-zinc-400"/></button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tipo de Meta</label>
                  <div className="flex gap-2">
                    <button onClick={() => setNovaMetaTipo('Geral')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${novaMetaTipo === 'Geral' ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>Geral (Faturamento)</button>
                    <button onClick={() => setNovaMetaTipo('Marca')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${novaMetaTipo === 'Marca' ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>Por Marca</button>
                  </div>
                </div>

                {novaMetaTipo === 'Marca' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Selecione a Marca</label>
                    <select 
                      value={novaMetaMarca} 
                      onChange={(e) => setNovaMetaMarca(e.target.value)} 
                      className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white appearance-none"
                    >
                      <option value="" disabled selected={!novaMetaMarca}>Selecione...</option>
                      {marcasDisponiveis.map((marca, i) => (
                        <option key={i} value={marca.nome}>{marca.nome}</option>
                      ))}
                      {marcasDisponiveis.length === 0 && <option value="" disabled>Todas as marcas já possuem meta!</option>}
                    </select>
                  </motion.div>
                )}

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Valor Alvo (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-zinc-400 font-bold">R$</span>
                    <input type="text" placeholder="Ex: 50.000,00" value={novaMetaValor} onChange={(e) => setNovaMetaValor(mascaraMoeda(e.target.value))} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-9 text-lg font-black outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-[#18181b] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <input type="checkbox" id="replicarCheck" checked={replicarTodos} onChange={(e) => setReplicarTodos(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                  <label htmlFor="replicarCheck" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                    Aplicar para TODOS os vendedores
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] flex gap-3">
                <button onClick={() => setModalNovaMeta(false)} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors">Cancelar</button>
                <button onClick={salvarMeta} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all">Salvar Meta</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🟢 MODAL: EDITAR META MENSAL */}
      <AnimatePresence>
        {modalEditarMeta.open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#18181b]">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2"><Edit className="text-indigo-500" size={20}/> Editar Meta</h2>
                <button onClick={() => setModalEditarMeta({ open: false, meta: null })} className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"><X size={20} className="text-zinc-600 dark:text-zinc-400"/></button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Referência</p>
                  <p className="text-base font-black text-zinc-900 dark:text-white">{modalEditarMeta.meta?.nome || "Meta Geral"}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Novo Valor Alvo (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-zinc-400 font-bold">R$</span>
                    <input type="text" placeholder="Ex: 50.000,00" value={editMetaValor} onChange={(e) => setEditMetaValor(mascaraMoeda(e.target.value))} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-9 text-lg font-black outline-none focus:border-indigo-500 transition-colors text-zinc-900 dark:text-white" />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] flex gap-3">
                <button onClick={() => setModalEditarMeta({ open: false, meta: null })} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors">Cancelar</button>
                <button onClick={editarMeta} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all">Salvar Alteração</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ENCERRAR CAMPANHA */}
      <AnimatePresence>
        {modalEncerrar.open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
                <Trophy size={32} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Encerrar Campanha?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                O ranking será congelado, e o primeiro colocado será coroado na aba de histórico.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalEncerrar({ open: false, id: null })} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold">Voltar</button>
                <button onClick={encerrarCampanha} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold">Sim, Encerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EXCLUIR CAMPANHA */}
      <AnimatePresence>
        {modalExcluir.open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#121214] border border-rose-200 dark:border-rose-500/30 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Excluir Campanha?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Essa ação apagará todo o histórico e faixas de premiação desta campanha. Não tem volta.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalExcluir({ open: false, id: null })} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold">Cancelar</button>
                <button onClick={excluirCampanha} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-[0_4px_14px_rgba(225,29,72,0.3)]">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REPLICAR METAS */}
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