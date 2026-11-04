 "use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Activity, BarChart3, Instagram, MessageCircle, MousePointerClick,
  Plus, RefreshCw, Search, Send, Settings2, Trash2, Users,
  Wallet, Eye, Zap, Loader2, X, AlertCircle, CheckCircle2,
  ExternalLink, Megaphone, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { getHubUrl, getHeaders } from "@/components/utils/api";

const CARD = "relative overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] transition-colors duration-300";
const PANEL = "bg-white/95 dark:bg-[#121214]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]";
const FIELD = "w-full h-11 px-4 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all";
const LABEL = "block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2";
const BUTTON = "h-11 px-5 rounded-full bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_10px_24px_-8px_rgba(147,51,234,.55)] transition-all active:scale-95 disabled:opacity-60";
const MUTED_BUTTON = "h-10 px-4 rounded-full bg-black/[0.05] hover:bg-black/[0.08] dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all";

const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const number = (v) => Number(v || 0).toLocaleString("pt-BR");
const percent = (v) => `${Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export default function MarketingPage() {
  const [tenantId, setTenantId] = useState("");
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connection, setConnection] = useState(null);
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("last_30d");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", trigger_type: "comment_keyword", keyword: "", response_text: "", active: true });

  const api = useCallback(async (path, options = {}) => {
    const headers = { ...getHeaders(), "Content-Type": "application/json", "x-tenant-id": tenantId, ...(options.headers || {}) };
    const response = await fetch(`${getHubUrl()}/api/hub/marketing${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Erro ${response.status}`);
    return data;
  }, [tenantId]);

  const loadAll = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [conn, dash, ads, flows] = await Promise.all([
        api("/connection"),
        api(`/overview?period=${period}`),
        api(`/campaigns?period=${period}`),
        api("/automations")
      ]);
      setConnection(conn.connection || null);
      setOverview(dash.overview || null);
      setCampaigns(ads.campaigns || []);
      setAutomations(flows.automations || []);
    } catch (err) {
      toast.error(err.message || "Não foi possível carregar o Marketing.");
    } finally { setLoading(false); }
  }, [api, tenantId, period]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("@raizan:user");
      const user = raw ? JSON.parse(raw) : null;
      setTenantId(user?.tenant_id || "");
    } catch { setTenantId(""); }
  }, []);

  useEffect(() => { if (tenantId) loadAll(); }, [tenantId, loadAll]);

  const connectMeta = async () => {
    if (!tenantId) return toast.error("Empresa não identificada.");
    try {
      const result = await api("/oauth/url");
      if (!result.url) throw new Error("A URL de conexão não foi retornada.");
      window.location.assign(result.url);
    } catch (err) { toast.error(err.message); }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      await api("/sync", { method: "POST", body: JSON.stringify({ period }) });
      await loadAll();
      toast.success("Dados da Meta atualizados.");
    } catch (err) { toast.error(err.message); }
    finally { setSyncing(false); }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", trigger_type: "comment_keyword", keyword: "", response_text: "", active: true });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      trigger_type: item.trigger_type || "comment_keyword",
      keyword: item.keyword || "",
      response_text: item.response_text || "",
      active: Boolean(item.active)
    });
    setModalOpen(true);
  };

  const saveAutomation = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.keyword.trim() || !form.response_text.trim()) return toast.error("Preencha nome, palavra-chave e resposta.");
    setSaving(true);
    try {
      const path = editingId ? `/automations/${editingId}` : "/automations";
      await api(path, { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) });
      toast.success(editingId ? "Automação atualizada." : "Automação criada.");
      setModalOpen(false);
      await loadAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const deleteAutomation = async (id) => {
    if (!window.confirm("Excluir esta automação?")) return;
    try {
      await api(`/automations/${id}`, { method: "DELETE" });
      setAutomations((prev) => prev.filter((x) => x.id !== id));
      toast.success("Automação removida.");
    } catch (err) { toast.error(err.message); }
  };

  const filteredCampaigns = useMemo(() => campaigns.filter((c) => (c.name || "").toLowerCase().includes(search.toLowerCase())), [campaigns, search]);

  const Metric = ({ title, value, detail, icon: Icon, tint = "purple" }) => {
    const colors = {
      purple: "from-purple-400 to-purple-600",
      emerald: "from-emerald-400 to-emerald-600",
      blue: "from-blue-400 to-indigo-600",
      amber: "from-amber-300 to-orange-500"
    };
    return <div className={`${CARD} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{title}</p><p className="text-2xl sm:text-[28px] font-bold tracking-tight mt-2 tabular-nums">{value}</p><p className="text-xs text-zinc-400 mt-1">{detail}</p></div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${colors[tint]} text-white flex items-center justify-center shadow-lg`}><Icon size={20}/></div>
      </div>
    </div>;
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]"/>
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]"/>
        </div>
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-[1500px] mx-auto space-y-6">
            <div className={`${CARD} p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-5`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 shrink-0 rounded-[18px] bg-gradient-to-br from-violet-400 to-purple-600 text-white flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(147,51,234,.65)]"><Megaphone size={27}/></div>
                <div><h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">Raizan Marketing</h1><p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Anúncios, leads e automações do Instagram em um só lugar.</p></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${FIELD} sm:w-40`}>
                  <option value="last_7d">Últimos 7 dias</option><option value="last_30d">Últimos 30 dias</option><option value="this_month">Este mês</option>
                </select>
                <button onClick={syncNow} disabled={syncing || !connection} className={MUTED_BUTTON}>{syncing ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Atualizar</button>
                <button onClick={connectMeta} className={BUTTON}><Instagram size={17}/> {connection ? "Reconectar Meta" : "Conectar Meta"}</button>
              </div>
            </div>

            <div className={`${CARD} p-2 flex gap-1 overflow-x-auto`}>
              {[
                ["overview", BarChart3, "Visão geral"], ["campaigns", Megaphone, "Campanhas"], ["automations", Zap, "Automações"]
              ].map(([key, Icon, label]) => <button key={key} onClick={() => setTab(key)} className={`px-4 py-3 rounded-full flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-all ${tab === key ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-zinc-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"}`}><Icon size={16}/>{label}</button>)}
            </div>

            {loading ? <div className={`${CARD} min-h-[320px] flex items-center justify-center`}><Loader2 className="animate-spin text-purple-500" size={32}/></div> : <>
              {!connection && <div className={`${CARD} p-6 flex flex-col md:flex-row items-start md:items-center gap-4`}>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center"><AlertCircle size={24}/></div>
                <div className="flex-1"><h3 className="font-bold">Conecte a conta Meta da empresa</h3><p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Conecte Facebook, Instagram profissional e conta de anúncios para carregar os indicadores e ativar as automações.</p></div>
                <button onClick={connectMeta} className={BUTTON}><ExternalLink size={16}/> Iniciar conexão</button>
              </div>}

              {tab === "overview" && <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <Metric title="Investimento" value={money(overview?.spend)} detail="No período selecionado" icon={Wallet} tint="purple"/>
                  <Metric title="Alcance" value={number(overview?.reach)} detail={`${number(overview?.impressions)} impressões`} icon={Eye} tint="blue"/>
                  <Metric title="Cliques" value={number(overview?.clicks)} detail={`${percent(overview?.ctr)} CTR`} icon={MousePointerClick} tint="emerald"/>
                  <Metric title="Leads" value={number(overview?.leads)} detail={`${money(overview?.cost_per_lead)} por lead`} icon={Users} tint="amber"/>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className={`${CARD} p-6 xl:col-span-2`}>
                    <div className="flex items-center justify-between mb-5"><div><h2 className="font-bold text-lg">Desempenho das campanhas</h2><p className="text-xs text-zinc-500 mt-1">Resumo consolidado da conta de anúncios</p></div><Activity className="text-purple-500" size={21}/></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]"><p className="text-xs text-zinc-500">CPM</p><p className="text-xl font-bold mt-1">{money(overview?.cpm)}</p></div>
                      <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]"><p className="text-xs text-zinc-500">CPC</p><p className="text-xl font-bold mt-1">{money(overview?.cpc)}</p></div>
                      <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]"><p className="text-xs text-zinc-500">Frequência</p><p className="text-xl font-bold mt-1">{Number(overview?.frequency || 0).toFixed(2).replace(".", ",")}</p></div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-5">Os resultados dependem das métricas e permissões liberadas pela Meta. Leads de formulários exigem configuração adicional de Lead Ads.</p>
                  </div>
                  <div className={`${CARD} p-6`}>
                    <div className="flex items-center gap-2 mb-4"><Instagram className="text-purple-500"/><h2 className="font-bold">Instagram conectado</h2></div>
                    {connection ? <><p className="text-lg font-bold">@{connection.instagram_username || "Conta profissional"}</p><p className="text-xs text-zinc-500 mt-1">{connection.page_name || "Página conectada"} · {connection.ad_account_id || "Conta de anúncios não selecionada"}</p><div className="mt-5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"><CheckCircle2 size={15}/> Conexão ativa</div></> : <p className="text-sm text-zinc-500">Nenhuma conta conectada.</p>}
                  </div>
                </div>
              </>}

              {tab === "campaigns" && <div className={`${CARD} overflow-hidden`}>
                <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.07] flex flex-col sm:flex-row gap-3 justify-between">
                  <div><h2 className="font-bold text-lg">Campanhas</h2><p className="text-xs text-zinc-500 mt-1">Desempenho por campanha no período selecionado.</p></div>
                  <div className="relative sm:w-72"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar campanha..." className={`${FIELD} pl-10`}/></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-sm text-left">
                    <thead className="text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.07]"><tr>{["Campanha","Status","Investimento","Alcance","Impressões","Cliques","CTR"].map(x => <th key={x} className="px-5 py-4 text-xs font-semibold">{x}</th>)}</tr></thead>
                    <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                      {filteredCampaigns.length ? filteredCampaigns.map(c => <tr key={c.id} className="hover:bg-purple-500/[0.04]"><td className="px-5 py-4 font-semibold">{c.name}</td><td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-[11px] bg-emerald-500/10 text-emerald-600">{c.effective_status || c.status || "—"}</span></td><td className="px-5 py-4 tabular-nums">{money(c.spend)}</td><td className="px-5 py-4 tabular-nums">{number(c.reach)}</td><td className="px-5 py-4 tabular-nums">{number(c.impressions)}</td><td className="px-5 py-4 tabular-nums">{number(c.clicks)}</td><td className="px-5 py-4 tabular-nums">{percent(c.ctr)}</td></tr>) : <tr><td colSpan="7" className="px-5 py-16 text-center text-zinc-500">Nenhuma campanha encontrada para este período.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>}

              {tab === "automations" && <div className="space-y-4">
                <div className={`${CARD} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}><div><h2 className="font-bold text-lg">Automações do Instagram</h2><p className="text-xs text-zinc-500 mt-1">Respostas por palavra-chave em comentários e mensagens recebidas.</p></div><button onClick={openNew} className={BUTTON}><Plus size={17}/> Nova automação</button></div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {automations.map(item => <div key={item.id} className={`${CARD} p-5`}>
                    <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center"><Zap size={19}/></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold">{item.name}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.active ? "bg-emerald-500/10 text-emerald-600" : "bg-zinc-500/10 text-zinc-500"}`}>{item.active ? "ATIVA" : "PAUSADA"}</span></div><p className="text-xs text-zinc-500 mt-1">{item.trigger_type === "comment_keyword" ? "Comentário contém" : "Mensagem recebida contém"}: <strong>{item.keyword}</strong></p></div><button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-purple-500 text-xs font-semibold">Editar</button><button onClick={() => deleteAutomation(item.id)} className="text-zinc-400 hover:text-rose-500"><Trash2 size={16}/></button></div>
                    <div className="mt-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] p-4"><p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Resposta automática</p><p className="text-sm">{item.response_text}</p></div>
                    <p className="text-[11px] text-zinc-400 mt-3">Disparos registrados: {number(item.trigger_count)}</p>
                  </div>)}
                  {!automations.length && <div className={`${CARD} p-12 text-center xl:col-span-2`}><MessageCircle size={34} className="mx-auto text-zinc-300 mb-3"/><h3 className="font-bold">Nenhuma automação criada</h3><p className="text-sm text-zinc-500 mt-1 mb-4">Crie sua primeira regra para responder comentários ou mensagens.</p><button onClick={openNew} className={BUTTON}><Plus size={16}/> Criar automação</button></div>}
                </div>
                <div className={`${CARD} p-5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed`}><strong className="text-zinc-700 dark:text-zinc-200">Importante:</strong> a API oficial não permite disparos indiscriminados. Mensagens devem respeitar consentimento, permissões, janelas de atendimento e as políticas da Meta. Resposta privada a comentário e resposta a DM são operações diferentes.</div>
              </div>}
            </>}
          </div>
        </main>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
        <div className={`${PANEL} rounded-[30px] w-full max-w-lg overflow-hidden`}>
          <div className="px-7 pt-7 pb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">{editingId ? "Editar automação" : "Nova automação"}</h2><p className="text-xs text-zinc-500 mt-1">Configure o gatilho e a resposta.</p></div><button onClick={() => setModalOpen(false)} className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center"><X size={17}/></button></div>
          <form onSubmit={saveAutomation} className="px-7 pb-7 space-y-4">
            <div><label className={LABEL}>Nome da automação</label><input className={FIELD} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Ex: Enviar catálogo" required/></div>
            <div><label className={LABEL}>Quando executar</label><select className={FIELD} value={form.trigger_type} onChange={e => setForm({...form, trigger_type:e.target.value})}><option value="comment_keyword">Comentário em publicação contém palavra</option><option value="message_keyword">Mensagem no Direct contém palavra</option></select></div>
            <div><label className={LABEL}>Palavra-chave</label><input className={FIELD} value={form.keyword} onChange={e => setForm({...form, keyword:e.target.value})} placeholder="CATÁLOGO" required/></div>
            <div><label className={LABEL}>Mensagem de resposta</label><textarea className={`${FIELD} h-28 py-3 resize-none`} value={form.response_text} onChange={e => setForm({...form, response_text:e.target.value})} placeholder="Olá! 😊 Aqui está nosso catálogo..." required/></div>
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active:e.target.checked})} className="accent-purple-600"/> Ativar automação ao salvar</label>
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className={`${MUTED_BUTTON} flex-1`}>Cancelar</button><button disabled={saving} className={`${BUTTON} flex-1`}>{saving ? <Loader2 size={16} className="animate-spin"/> : null}Salvar automação</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
