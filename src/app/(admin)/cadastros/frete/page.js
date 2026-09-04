"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Truck, Search, Plus, Edit, Trash2, 
  Loader2, X, AlertTriangle, Zap, MapPin
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api"; 

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
    let arrayParams = [];
    if (rota.parametros) {
      try { arrayParams = JSON.parse(rota.parametros); } 
      catch (e) { arrayParams = []; }
    }
    setFormData({
      nome: rota.nome,
      valor_minimo: rota.valor_minimo.toString().replace('.', ','),
      taxa_frete: rota.taxa_frete.toString().replace('.', ','),
      tipo_vinculo: rota.tipo_vinculo || 'manual',
      parametros: Array.isArray(arrayParams) ? arrayParams : []
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

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderBadgeTipo = (tipo) => {
    if (tipo === 'cidade') return <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Por Cidade</span>;
    if (tipo === 'uf') return <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Por UF</span>;
    return <span className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Manual</span>;
  };

  const rotasFiltradas = rotas.filter(r => r.nome.toLowerCase().includes(busca.toLowerCase()));
  
  // Lógica de filtragem do Autocomplete
  const listaFiltroAtiva = formData.tipo_vinculo === 'cidade' ? cidadesDb : ufsDb;
  const opcoesFiltradas = listaFiltroAtiva.filter(item => 
    item.toUpperCase().includes(buscaLocalidade.toUpperCase()) && 
    !formData.parametros.includes(item)
  ).slice(0, 8); 

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300 gap-4">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 transition-colors">
                  <Truck size={28} className="text-purple-600 dark:text-purple-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate transition-colors">Regras de Frete</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Gerencie as rotas de entrega e aplique regras em massa.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                <button onClick={abrirModalNovo} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-95">
                  <Plus size={18} /> Nova Regra
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none transition-colors">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar regra de frete pelo nome..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-md dark:shadow-2xl relative transition-colors flex flex-col z-10 overflow-hidden">
              {loading ? (
                <div className="min-h-[300px] flex items-center justify-center"><Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" /></div>
              ) : (
                <div className="w-full overflow-x-auto relative min-h-[250px]"> 
                  <table className="w-full min-w-[900px] text-sm text-left relative z-20">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                      <tr>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs">ID</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs">Nome da Rota</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs">Tipo de Regra</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs text-center">Pedido Mín. (CIF)</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-xs text-center">Taxa de Frete</th>
                        <th className="px-6 py-4 text-right uppercase tracking-wider text-xs">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 transition-colors">
                      {rotasFiltradas.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-16 text-center text-zinc-500 dark:text-zinc-400">Nenhuma regra encontrada.</td></tr>
                      ) : (
                        rotasFiltradas.map((rota) => (
                          <tr key={rota.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors group">
                            <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium">#{rota.id}</td>
                            <td className="px-6 py-4"><span className="font-bold text-zinc-900 dark:text-zinc-100">{rota.nome}</span></td>
                            <td className="px-6 py-4">{renderBadgeTipo(rota.tipo_vinculo)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md text-xs font-bold">{formatarMoeda(rota.valor_minimo)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold">{formatarMoeda(rota.taxa_frete)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {rota.tipo_vinculo && rota.tipo_vinculo !== 'manual' && (
                                  <button onClick={() => sincronizarRota(rota)} disabled={isSyncing === rota.id} title="Aplicar a todos os clientes correspondentes" className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 text-zinc-500 hover:text-yellow-600 dark:hover:text-yellow-500 rounded-lg shadow-sm transition-colors disabled:opacity-50">
                                    {isSyncing === rota.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                  </button>
                                )}
                                <button onClick={() => abrirModalEditar(rota)} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-purple-50 dark:hover:bg-purple-500/10 text-zinc-500 hover:text-purple-600 rounded-lg shadow-sm transition-colors"><Edit size={16} /></button>
                                <button onClick={() => setModalDelete({ open: true, rota })} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 rounded-lg shadow-sm transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 🟢 MODAL DE CRIAÇÃO / EDIÇÃO - À PROVA DE ELECTRON */}
            {modalAberto && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                
                {/* O container principal agora é flex-col e tem max-height de 90vh */}
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                  
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
                  
                  {/* HEADER DO MODAL (Fixo) */}
                  <div className="px-8 pt-8 pb-4 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{editandoId ? 'Editar Regra' : 'Nova Regra'}</h2>
                    <button onClick={() => setModalAberto(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"><X size={24} /></button>
                  </div>

                  {/* FORMULÁRIO ROLÁVEL (A mágica acontece aqui) */}
                  <form onSubmit={salvarRota} className="flex flex-col flex-1 overflow-hidden">
                    
                    {/* ÁREA DE INPUTS (Pode scrollar se precisar) */}
                    <div className="p-8 pt-0 overflow-y-auto custom-scrollbar flex-1">
                      
                      <div className="mb-5">
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Nome da Região / Rota *</label>
                        <input type="text" required placeholder="Ex: Grande Goiânia, Tocantins..." value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-medium" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Valor Mín. (CIF) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">R$</span>
                            <input type="text" required placeholder="500,00" value={formData.valor_minimo} onChange={(e) => setFormData({...formData, valor_minimo: e.target.value.replace(/[^0-9,]/g, '')})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 pl-10 pr-4 py-3 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-700 dark:text-emerald-400 font-bold" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Taxa de Frete *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold">R$</span>
                            <input type="text" required placeholder="50,00" value={formData.taxa_frete} onChange={(e) => setFormData({...formData, taxa_frete: e.target.value.replace(/[^0-9,]/g, '')})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 pl-10 pr-4 py-3 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-amber-700 dark:text-amber-400 font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* MOTOR DE REGRAS: AUTOCOMPLETE */}
                      <div className="p-5 border border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-500/5 rounded-2xl">
                        <label className="block text-sm font-bold text-purple-900 dark:text-purple-300 mb-2">Aplicar essa regra por:</label>
                        <select 
                          value={formData.tipo_vinculo}
                          onChange={(e) => {
                            setFormData({...formData, tipo_vinculo: e.target.value, parametros: []});
                            setBuscaLocalidade("");
                          }}
                          className="w-full mb-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-medium cursor-pointer"
                        >
                          <option value="manual">Manual (Um por um no cadastro do cliente)</option>
                          <option value="cidade">Lista de Cidades</option>
                          <option value="uf">Estado (Lista de UF)</option>
                        </select>

                        {formData.tipo_vinculo !== 'manual' && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            
                            {/* Campo de Busca Inteligente */}
                            <div className="relative mb-3">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
                              <input 
                                type="text" 
                                placeholder={formData.tipo_vinculo === 'cidade' ? "Buscar cidade..." : "Buscar UF..."}
                                value={buscaLocalidade}
                                onChange={(e) => setBuscaLocalidade(e.target.value.toUpperCase())}
                                className="w-full bg-white dark:bg-zinc-950 border border-purple-200 dark:border-purple-800 text-zinc-900 dark:text-zinc-200 pl-10 pr-4 py-3 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-bold uppercase"
                              />
                              
                              {/* Dropdown de Resultados */}
                              {buscaLocalidade.length > 0 && opcoesFiltradas.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                                  {opcoesFiltradas.map((opcao, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => adicionarParametro(opcao)}
                                      className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors border-b last:border-0 border-zinc-100 dark:border-zinc-800"
                                    >
                                      + Adicionar {opcao}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* 🟢 O SEGREDO DO ELECTRON: Lista de Chips com Scroll próprio e limite de altura */}
                            <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] max-h-40 overflow-y-auto custom-scrollbar pr-2 pb-2">
                              {formData.parametros.length === 0 ? (
                                <span className="text-xs text-purple-400 dark:text-purple-500 italic flex items-center">
                                  Nenhuma localidade selecionada.
                                </span>
                              ) : (
                                formData.parametros.map((item, index) => (
                                  <div key={index} className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg shadow-sm animate-in zoom-in duration-200">
                                    <span className="text-xs font-bold tracking-wider">{item}</span>
                                    <button type="button" onClick={() => removerParametro(item)} className="hover:bg-purple-700 p-0.5 rounded-full transition-colors">
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    </div>

                    {/* RODAPÉ DO MODAL (Fixo, nunca sai da tela) */}
                    <div className="px-8 pb-8 pt-4 shrink-0 flex gap-3 bg-white dark:bg-[#121214] border-t border-zinc-100 dark:border-zinc-800/50">
                      <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold transition-colors">Cancelar</button>
                      <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-purple-500/20 flex items-center justify-center gap-2">
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
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-500" />
                  <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-inner"><AlertTriangle size={36} strokeWidth={2.5} /></div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">Excluir Regra?</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 px-2">Tem certeza que deseja apagar a rota <strong className="text-zinc-800 dark:text-zinc-200">"{modalDelete.rota?.nome}"</strong>?</p>
                  <div className="flex gap-3 w-full justify-center">
                    <button onClick={() => setModalDelete({ open: false, rota: null })} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 rounded-xl font-bold transition-colors">Cancelar</button>
                    <button onClick={confirmarExclusao} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-md">Sim, Excluir</button>
                  </div>
                </div>
              </div>
            )}

            {/* 🟢 NOVO MODAL DE SINCRONIZAÇÃO */}
            {modalSync.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-yellow-600" />
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Zap size={36} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">Sincronizar Clientes?</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 px-2">
                    Deseja aplicar a regra <strong className="text-zinc-800 dark:text-zinc-200">"{modalSync.rota?.nome}"</strong> para todos os clientes correspondentes agora?
                  </p>
                  <div className="flex gap-3 w-full justify-center">
                    <button onClick={() => setModalSync({ open: false, rota: null })} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 rounded-xl font-bold transition-colors">Cancelar</button>
                    <button onClick={confirmarSincronizacao} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition-colors shadow-md">Sim, Sincronizar</button>
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