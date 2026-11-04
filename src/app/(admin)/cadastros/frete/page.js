"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Truck, Search, Plus, Edit, Trash2, 
  Loader2, X, AlertTriangle, Zap, MapPin
} from "lucide-react";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api"; 

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================

const CARD =
  "relative overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] " +
  "bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] " +
  "transition-colors duration-300";

const PAINEL =
  "bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] " +
  "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_90px_-20px_rgba(0,0,0,0.9)]";

const ICON_BTN =
  "w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] " +
  "border border-black/[0.04] dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 " +
  "transition-all duration-300 active:scale-90";

// Campos dos modais (fundo sólido no escuro para o <select> nativo ficar legível)
const CAMPO =
  "w-full h-12 px-4 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl outline-none " +
  "text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all dark:[color-scheme:dark]";

const ROTULO = "block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2";

const BTN_CANCELAR =
  "flex-1 h-12 bg-black/[0.05] hover:bg-black/[0.08] text-zinc-700 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] dark:text-zinc-200 rounded-full font-semibold transition-all active:scale-95";

const PILULA = "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap";

// Lê os parâmetros da regra com segurança (a API pode mandar texto JSON ou já um array)
const lerParametros = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch (e) { return []; }
  }
  return [];
};

// Tira acentos e deixa maiúsculo: "Goiânia" encontra "GOIANIA"
const normalizar = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

// Valor em reais: só números, no máximo 1 vírgula e 2 casas decimais
const limparMoeda = (v) => {
  let s = String(v).replace(/[^0-9,]/g, '');
  const i = s.indexOf(',');
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, '').slice(0, 2);
  return s;
};

export default function RegrasFretePage() {
  const [rotas, setRotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  // Controle do Modal de Formulário
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(null); 
  
  // 🟢 NOVOS ESTADOS PARA O BUSCADOR DE CIDADES/UFS
  const [cidadesDb, setCidadesDb] = useState([]);
  const [ufsDb, setUfsDb] = useState([]);
  const [buscaLocalidade, setBuscaLocalidade] = useState("");

  const [modalDelete, setModalDelete] = useState({ open: false, rota: null });
  // 🟢 NOVO ESTADO: Controle do Modal de Sincronização (Substituindo o confirm feio)
  const [modalSync, setModalSync] = useState({ open: false, rota: null });

  // 🟢 AGORA PARAMETROS É UM ARRAY []
  const [formData, setFormData] = useState({
    nome: '',
    valor_minimo: '',
    taxa_frete: '',
    tipo_vinculo: 'manual', 
    parametros: [] 
  });

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        return JSON.parse(storedUser).tenant_id;
      }
    }
    return "";
  };

  useEffect(() => {
    buscarRotas();
    buscarLocalidadesERP(); 
  }, []);

  const buscarLocalidadesERP = async () => {
    const cnpj = pegarCnpjLogado();
    if (!cnpj) return;

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/rotas-frete/localidades`, { 
        headers: { ...getHeaders(), "x-tenant-id": cnpj } 
      });
      const data = await res.json();
      
      if (data.success) {
        setCidadesDb(data.cidades || []);
        setUfsDb(data.ufs || []);
      } else {
        setCidadesDb(['GOIANIA', 'APARECIDA DE GOIANIA', 'SENADOR CANEDO', 'TRINDADE', 'ANAPOLIS']);
        setUfsDb(['GO', 'TO', 'MT', 'MS', 'DF']);
      }
    } catch (error) {
      setCidadesDb(['GOIANIA', 'APARECIDA DE GOIANIA', 'SENADOR CANEDO', 'TRINDADE']);
      setUfsDb(['GO', 'TO', 'MT']);
    }
  };

  const buscarRotas = async () => {
    setLoading(true);
    const cnpj = pegarCnpjLogado();
    if (!cnpj) {
      toast.error("Erro: CNPJ da empresa não encontrado.");
      setLoading(false); return;
    }
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/rotas-frete`, { headers: { ...getHeaders(), "x-tenant-id": cnpj } });
      const data = await res.json();
      if (data.success && data.rotas) setRotas(data.rotas);
      else if (Array.isArray(data)) setRotas(data);
      else setRotas([]);
    } catch (error) { toast.error("Erro de conexão ao buscar rotas."); } 
    finally { setLoading(false); }
  };

  const abrirModalNovo = () => {
    setEditandoId(null);
    setFormData({ nome: '', valor_minimo: '', taxa_frete: '', tipo_vinculo: 'manual', parametros: [] });
    setBuscaLocalidade("");
    setModalAberto(true);
  };

  const abrirModalEditar = (rota) => {
    setEditandoId(rota.id);
    // 🆕 lerParametros aceita texto JSON ou array pronto (antes, array pronto virava lista vazia e ao salvar apagava as cidades)
    const arrayParams = lerParametros(rota.parametros);
    setFormData({
      nome: rota.nome || '',
      // 🆕 String(... ?? '') evita erro quando o valor vem nulo
      valor_minimo: String(rota.valor_minimo ?? '').replace('.', ','),
      taxa_frete: String(rota.taxa_frete ?? '').replace('.', ','),
      tipo_vinculo: rota.tipo_vinculo || 'manual',
      parametros: arrayParams
    });
    setBuscaLocalidade("");
    setModalAberto(true);
  };

  const adicionarParametro = (item) => {
    if (!formData.parametros.includes(item)) {
      setFormData(prev => ({ ...prev, parametros: [...prev.parametros, item] }));
    }
    setBuscaLocalidade(""); 
  };

  const removerParametro = (itemRemover) => {
    setFormData(prev => ({ ...prev, parametros: prev.parametros.filter(i => i !== itemRemover) }));
  };

  const salvarRota = async (e) => {
    e.preventDefault();

    // 🆕 Regra por cidade/UF sem nenhuma localidade não atende ninguém: avisa antes de salvar
    if (formData.tipo_vinculo !== 'manual' && formData.parametros.length === 0) {
      toast.error(`Adicione ao menos ${formData.tipo_vinculo === 'cidade' ? 'uma cidade' : 'um estado (UF)'} ou escolha o modo Manual.`);
      return;
    }

    setIsSaving(true);
    const cnpj = pegarCnpjLogado();
    const toastId = toast.loading(editandoId ? "Atualizando regra..." : "Criando regra...");

    const payload = {
      nome: formData.nome,
      valor_minimo: Number(formData.valor_minimo.replace(',', '.')) || 0,
      taxa_frete: Number(formData.taxa_frete.replace(',', '.')) || 0,
      tipo_vinculo: formData.tipo_vinculo,
      parametros: JSON.stringify(formData.parametros) 
    };

    try {
      const url = editandoId ? `${getHubUrl()}/api/hub/rotas-frete/${editandoId}` : `${getHubUrl()}/api/hub/rotas-frete`;
      const method = editandoId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { ...getHeaders(), "Content-Type": "application/json", "x-tenant-id": cnpj }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (res.ok || data.success) {
        toast.success(editandoId ? "Regra atualizada!" : "Regra criada com sucesso!", { id: toastId });
        setModalAberto(false);
        buscarRotas(); 
      } else {
        toast.error(data.message || "Erro ao salvar a regra.", { id: toastId });
      }
    } catch (error) { toast.error("Falha de comunicação ao salvar.", { id: toastId }); } 
    finally { setIsSaving(false); }
  };

  const confirmarExclusao = async () => {
    const id = modalDelete.rota.id;
    const loadingToast = toast.loading("Excluindo regra de frete...");
    const cnpj = pegarCnpjLogado();

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/rotas-frete/${id}`, { method: "DELETE", headers: { ...getHeaders(), "x-tenant-id": cnpj } });
      const data = await res.json();
      if (res.ok || data.success) {
        toast.success("Regra removida com sucesso!", { id: loadingToast });
        setRotas(rotas.filter(r => r.id !== id));
      } else { toast.error(data.message || "Erro ao excluir a rota.", { id: loadingToast }); }
    } catch (error) { toast.error("Erro de conexão ao tentar excluir.", { id: loadingToast }); } 
    finally { setModalDelete({ open: false, rota: null }); }
  };

  // 🟢 MUDANÇA AQUI: Apenas abre o modal em vez de usar o confirm() do Windows
  const sincronizarRota = (rota) => {
    setModalSync({ open: true, rota });
  };

  // 🟢 MUDANÇA AQUI: Lógica que executa a sincronização após confirmar no Modal
  const confirmarSincronizacao = async () => {
    const rota = modalSync.rota;
    setModalSync({ open: false, rota: null }); // Fecha o modal imediatamente
    
    setIsSyncing(rota.id);
    const toastId = toast.loading(`Sincronizando clientes da regra ${rota.nome}...`);
    const cnpj = pegarCnpjLogado();

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/rotas-frete/${rota.id}/sincronizar`, { method: "POST", headers: { ...getHeaders(), "x-tenant-id": cnpj } });
      const data = await res.json();
      if (res.ok || data.success) {
        toast.success(`Sucesso! ${data.clientes_afetados || 'Vários'} clientes foram atualizados.`, { id: toastId });
      } else { toast.error(data.message || "Erro ao sincronizar clientes.", { id: toastId }); }
    } catch (error) { toast.error("Erro de conexão ao sincronizar.", { id: toastId }); } 
    finally { setIsSyncing(null); }
  };

  // 🆕 Number(valor) || 0: evita "R$ NaN" quando o valor vem vazio
  const formatarMoeda = (valor) => (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderBadgeTipo = (tipo) => {
    if (tipo === 'cidade') return <span className={`${PILULA} bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20`}>Por Cidade</span>;
    if (tipo === 'uf') return <span className={`${PILULA} bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20`}>Por UF</span>;
    return <span className={`${PILULA} bg-black/[0.05] dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-400 border-black/[0.08] dark:border-white/[0.1]`}>Manual</span>;
  };

  // 🆕 A busca também encontra pelo nome de uma cidade/UF que a regra cobre
  const termoBusca = normalizar(busca);
  const rotasFiltradas = rotas.filter(r =>
    normalizar(r.nome).includes(termoBusca) ||
    lerParametros(r.parametros).some(p => normalizar(p).includes(termoBusca))
  );
  
  // Lógica de filtragem do Autocomplete (🆕 sem diferenciar acentos)
  const listaFiltroAtiva = formData.tipo_vinculo === 'cidade' ? cidadesDb : ufsDb;
  const opcoesFiltradas = listaFiltroAtiva.filter(item => 
    normalizar(item).includes(normalizar(buscaLocalidade)) && 
    !formData.parametros.includes(item)
  ).slice(0, 8); 

  // 🆕 Mapa de conflitos: quais OUTRAS regras (mesmo tipo) já cobrem cada cidade/UF
  const mapaConflitos = {};
  rotas.forEach(r => {
    if (r.id === editandoId || !r.tipo_vinculo || r.tipo_vinculo === 'manual') return;
    lerParametros(r.parametros).forEach(p => {
      const chave = `${r.tipo_vinculo}:${p}`;
      (mapaConflitos[chave] = mapaConflitos[chave] || []).push(r.nome);
    });
  });
  const conflitosDe = (item) => mapaConflitos[`${formData.tipo_vinculo}:${item}`] || [];

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">

        {/* Luzes suaves atrás do vidro */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
        </div>

        <Header />
        
        {/* ⚠️ Sem z-index no <main>: senão os modais (fixed) ficam presos atrás do Header e da Sidebar */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Título */}
            <div className={`${CARD} flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 gap-4`}>
              <div className="absolute -left-10 -top-10 w-44 h-44 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-400 to-purple-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-8px_rgba(124,58,237,0.6)] rounded-[16px] sm:rounded-[18px]">
                  <Truck size={26} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-[28px] leading-tight font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">Regras de Frete</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gerencie as rotas de entrega e aplique regras em massa.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                <button onClick={abrirModalNovo} className="w-full sm:w-auto h-11 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white px-6 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(147,51,234,0.6)] transition-all active:scale-95">
                  <Plus size={18} /> Nova Regra
                </button>
              </div>
            </div>

            {/* Busca */}
            <div className={`${CARD} p-3 sm:p-4 flex flex-col sm:flex-row gap-4`}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar regra pelo nome, cidade ou UF..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-black/[0.04] dark:bg-white/[0.05] border border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/[0.07] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 pl-11 pr-4 h-11 rounded-full text-sm outline-none focus:ring-4 focus:ring-purple-500/15 font-medium transition-all"
                />
              </div>
            </div>

            {/* Tabela */}
            <div className={`${CARD} flex flex-col z-10`}>
              {loading ? (
                <div className="min-h-[300px] flex items-center justify-center"><Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" /></div>
              ) : (
                <div className="w-full overflow-x-auto relative min-h-[250px] custom-scrollbar"> 
                  <table className="w-full min-w-[1000px] text-sm text-left relative z-20">
                    <thead className="text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.07]">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold">ID</th>
                        <th className="px-6 py-4 text-xs font-semibold">Nome da Rota</th>
                        <th className="px-6 py-4 text-xs font-semibold">Tipo de Regra</th>
                        <th className="px-6 py-4 text-xs font-semibold">Abrangência</th>
                        <th className="px-6 py-4 text-xs font-semibold text-center">Pedido Mín. (CIF)</th>
                        <th className="px-6 py-4 text-xs font-semibold text-center">Taxa de Frete</th>
                        <th className="px-6 py-4 text-xs font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                      {rotasFiltradas.length === 0 ? (
                        <tr><td colSpan="7" className="px-6 py-16 text-center text-zinc-500 dark:text-zinc-400">
                          <div className="flex flex-col items-center gap-3">
                            <Truck size={32} className="text-zinc-300 dark:text-zinc-700" />
                            <p className="font-medium text-base">Nenhuma regra encontrada.</p>
                            {rotas.length === 0 && (
                              <button onClick={abrirModalNovo} className="mt-1 h-10 px-5 bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/15 rounded-full text-sm font-semibold transition-all active:scale-95">
                                Criar a primeira regra
                              </button>
                            )}
                          </div>
                        </td></tr>
                      ) : (
                        rotasFiltradas.map((rota) => {
                          const params = lerParametros(rota.parametros);
                          return (
                            <tr key={rota.id} className="hover:bg-purple-500/[0.04] dark:hover:bg-white/[0.03] transition-colors group">
                              <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium tabular-nums">#{rota.id}</td>
                              <td className="px-6 py-4"><span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{rota.nome}</span></td>
                              <td className="px-6 py-4">{renderBadgeTipo(rota.tipo_vinculo)}</td>

                              {/* 🆕 Quais cidades/UFs a regra cobre (antes só dava para ver abrindo a edição) */}
                              <td className="px-6 py-4">
                                {rota.tipo_vinculo && rota.tipo_vinculo !== 'manual' && params.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]" title={params.join(', ')}>
                                    {params.slice(0, 3).map(p => (
                                      <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[11px] font-semibold truncate max-w-[110px]">{p}</span>
                                    ))}
                                    {params.length > 3 && <span className="text-[11px] font-semibold text-zinc-500">+{params.length - 3}</span>}
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400">{rota.tipo_vinculo && rota.tipo_vinculo !== 'manual' ? 'Nenhuma localidade' : 'Definida no cadastro do cliente'}</span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-center">
                                <span className={`${PILULA} bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 tabular-nums`}>{formatarMoeda(rota.valor_minimo)}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`${PILULA} bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 tabular-nums`}>{formatarMoeda(rota.taxa_frete)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {rota.tipo_vinculo && rota.tipo_vinculo !== 'manual' && (
                                    <button onClick={() => sincronizarRota(rota)} disabled={isSyncing === rota.id} title="Aplicar a todos os clientes correspondentes" className={`${ICON_BTN} hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 disabled:opacity-50`}>
                                      {isSyncing === rota.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                    </button>
                                  )}
                                  <button onClick={() => abrirModalEditar(rota)} title="Editar" className={`${ICON_BTN} hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400`}><Edit size={16} /></button>
                                  <button onClick={() => setModalDelete({ open: true, rota })} title="Excluir" className={`${ICON_BTN} hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400`}><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 🟢 MODAL DE CRIAÇÃO / EDIÇÃO - À PROVA DE ELECTRON */}
            {modalAberto && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                
                {/* O container principal é flex-col e tem max-height de 90vh */}
                <div className={`${PAINEL} rounded-[32px] w-full max-w-lg relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden`}>
                  
                  {/* HEADER DO MODAL (Fixo) */}
                  <div className="px-8 pt-7 pb-4 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{editandoId ? 'Editar Regra' : 'Nova Regra'}</h2>
                    <button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar" className="w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.09] dark:hover:bg-white/[0.14] transition-all active:scale-90"><X size={18} /></button>
                  </div>

                  {/* FORMULÁRIO ROLÁVEL */}
                  <form onSubmit={salvarRota} className="flex flex-col flex-1 overflow-hidden">
                    
                    {/* ÁREA DE INPUTS (Pode scrollar se precisar) */}
                    <div className="px-8 pb-6 overflow-y-auto custom-scrollbar flex-1">
                      
                      <div className="mb-5">
                        <label className={ROTULO}>Nome da Região / Rota *</label>
                        <input type="text" required placeholder="Ex: Grande Goiânia, Tocantins..." value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className={`${CAMPO} focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15`} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                          <label className={ROTULO}>Valor Mín. (CIF) *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">R$</span>
                            <input type="text" inputMode="decimal" required placeholder="500,00" value={formData.valor_minimo} onChange={(e) => setFormData({...formData, valor_minimo: limparMoeda(e.target.value)})} className={`${CAMPO} pl-11 tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/15`} />
                          </div>
                        </div>
                        <div>
                          <label className={ROTULO}>Taxa de Frete *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400 font-semibold text-sm">R$</span>
                            <input type="text" inputMode="decimal" required placeholder="50,00" value={formData.taxa_frete} onChange={(e) => setFormData({...formData, taxa_frete: limparMoeda(e.target.value)})} className={`${CAMPO} pl-11 tabular-nums text-amber-700 dark:text-amber-400 font-semibold focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/15`} />
                          </div>
                        </div>
                      </div>

                      {/* MOTOR DE REGRAS: AUTOCOMPLETE */}
                      <div className="p-5 border border-purple-500/15 bg-purple-500/[0.06] rounded-[22px]">
                        <label className="block text-sm font-semibold tracking-tight text-purple-900 dark:text-purple-200 mb-3">Aplicar essa regra por:</label>
                        <select 
                          value={formData.tipo_vinculo}
                          onChange={(e) => {
                            setFormData({...formData, tipo_vinculo: e.target.value, parametros: []});
                            setBuscaLocalidade("");
                          }}
                          className={`${CAMPO} mb-4 cursor-pointer focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15`}
                        >
                          <option value="manual">Manual (Um por um no cadastro do cliente)</option>
                          <option value="cidade">Lista de Cidades</option>
                          <option value="uf">Estado (Lista de UF)</option>
                        </select>

                        {formData.tipo_vinculo !== 'manual' && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            
                            {/* Campo de Busca Inteligente */}
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
                              <input 
                                type="text" 
                                placeholder={formData.tipo_vinculo === 'cidade' ? "Buscar cidade..." : "Buscar UF..."}
                                value={buscaLocalidade}
                                onChange={(e) => setBuscaLocalidade(e.target.value.toUpperCase())}
                                // 🆕 Enter adiciona a 1ª opção da lista. Antes, o Enter enviava o formulário e salvava a regra sem querer.
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (opcoesFiltradas.length > 0) adicionarParametro(opcoesFiltradas[0]);
                                  }
                                }}
                                className={`${CAMPO} pl-11 font-semibold uppercase focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15`}
                              />
                            </div>

                            {/* 🆕 Resultados em lista dentro do formulário (não é cortada pela rolagem do modal) */}
                            {buscaLocalidade.length > 0 && (
                              <div className="mt-2 rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                                {opcoesFiltradas.length === 0 ? (
                                  <p className="px-4 py-3 text-sm text-zinc-500">Nada encontrado para "{buscaLocalidade}".</p>
                                ) : (
                                  opcoesFiltradas.map((opcao, idx) => {
                                    const conflito = conflitosDe(opcao);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => adicionarParametro(opcao)}
                                        className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                      >
                                        <span>+ Adicionar {opcao}</span>
                                        {conflito.length > 0 && (
                                          <span className="shrink-0 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full truncate max-w-[150px]" title={`Já está em: ${conflito.join(', ')}`}>
                                            já em {conflito[0]}{conflito.length > 1 ? ` +${conflito.length - 1}` : ''}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}

                            {/* 🟢 O SEGREDO DO ELECTRON: Lista de Chips com Scroll próprio e limite de altura */}
                            <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] max-h-40 overflow-y-auto custom-scrollbar pr-2 pb-2">
                              {formData.parametros.length === 0 ? (
                                <span className="text-xs text-purple-500 dark:text-purple-400 italic flex items-center">
                                  Nenhuma localidade selecionada.
                                </span>
                              ) : (
                                formData.parametros.map((item, index) => {
                                  const conflito = conflitosDe(item);
                                  return (
                                    <div
                                      key={index}
                                      title={conflito.length > 0 ? `Atenção: também está em ${conflito.join(', ')}` : undefined}
                                      className={`flex items-center gap-1.5 text-white pl-3 pr-1.5 py-1.5 rounded-full shadow-sm animate-in zoom-in duration-200 bg-gradient-to-b from-purple-500 to-purple-600 ${conflito.length > 0 ? 'ring-2 ring-amber-400' : ''}`}
                                    >
                                      <span className="text-xs font-semibold tracking-wide">{item}</span>
                                      <button type="button" onClick={() => removerParametro(item)} aria-label={`Remover ${item}`} className="w-5 h-5 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                        <X size={12} />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* 🆕 Aviso de conflito: a mesma localidade em duas regras pode gerar frete duplicado/ambíguo */}
                            {formData.parametros.some(p => conflitosDe(p).length > 0) && (
                              <p className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                Algumas localidades (com borda amarela) já pertencem a outra regra. Ao sincronizar, só uma delas poderá valer para o cliente.
                              </p>
                            )}

                          </div>
                        )}
                      </div>
                    </div>

                    {/* RODAPÉ DO MODAL (Fixo, nunca sai da tela) */}
                    <div className="px-8 pb-8 pt-4 shrink-0 flex gap-3 border-t border-black/[0.06] dark:border-white/[0.07]">
                      <button type="button" onClick={() => setModalAberto(false)} className={BTN_CANCELAR}>Cancelar</button>
                      <button type="submit" disabled={isSaving} className="flex-1 h-12 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white rounded-full font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(147,51,234,0.6)] flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                        {editandoId ? 'Salvar' : 'Criar Regra'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* MODAL DE EXCLUSÃO */}
            {modalDelete.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                <div className={`${PAINEL} rounded-[32px] w-full max-w-md p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200`}>
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative w-20 h-20 mb-6 rounded-[24px] flex items-center justify-center bg-gradient-to-br from-rose-400 to-red-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_16px_34px_-10px_rgba(239,68,68,0.7)]"><AlertTriangle size={34} strokeWidth={2.2} /></div>
                  <h2 className="relative text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">Excluir Regra?</h2>
                  <p className="relative text-sm text-zinc-500 dark:text-zinc-400 mb-6 px-2">Tem certeza que deseja apagar a rota <strong className="font-semibold text-zinc-800 dark:text-zinc-200">"{modalDelete.rota?.nome}"</strong>?</p>
                  <div className="relative flex gap-3 w-full justify-center">
                    <button onClick={() => setModalDelete({ open: false, rota: null })} className={BTN_CANCELAR}>Cancelar</button>
                    <button onClick={confirmarExclusao} className="flex-1 h-12 bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-600 text-white rounded-full font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(239,68,68,0.6)] active:scale-95">Sim, Excluir</button>
                  </div>
                </div>
              </div>
            )}

            {/* 🟢 MODAL DE SINCRONIZAÇÃO */}
            {modalSync.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                <div className={`${PAINEL} rounded-[32px] w-full max-w-md p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200`}>
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative w-20 h-20 mb-6 rounded-[24px] flex items-center justify-center bg-gradient-to-br from-yellow-300 to-yellow-500 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_16px_34px_-10px_rgba(234,179,8,0.7)]">
                    <Zap size={34} strokeWidth={2.2} />
                  </div>
                  <h2 className="relative text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">Sincronizar Clientes?</h2>
                  <p className="relative text-sm text-zinc-500 dark:text-zinc-400 mb-6 px-2">
                    Deseja aplicar a regra <strong className="font-semibold text-zinc-800 dark:text-zinc-200">"{modalSync.rota?.nome}"</strong> para todos os clientes correspondentes agora?
                  </p>
                  <div className="relative flex gap-3 w-full justify-center">
                    <button onClick={() => setModalSync({ open: false, rota: null })} className={BTN_CANCELAR}>Cancelar</button>
                    <button onClick={confirmarSincronizacao} className="flex-1 h-12 bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-500 text-white rounded-full font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_24px_-8px_rgba(234,179,8,0.6)] active:scale-95">Sim, Sincronizar</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}