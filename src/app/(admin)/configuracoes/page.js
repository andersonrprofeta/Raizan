"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Database, ShoppingCart, CheckCircle2, AlertCircle, Loader2, Timer, Server, Globe, Laptop, Lock, Unlock, ShieldAlert, CreditCard, QrCode } from "lucide-react";
import { getApiUrl, getHeaders } from "@/components/utils/api"; 
import toast from 'react-hot-toast'; 

export default function Configuracoes() {
  const [status, setStatus] = useState("idle"); 
  
  const [coreUrl, setCoreUrl] = useState("http://localhost:3001");
  const [isLocked, setIsLocked] = useState(false); 
  const [loadingLock, setLoadingLock] = useState(true);

  const [formData, setFormData] = useState({
    tenantId: "",
    host: "", port: "1521", serviceName: "", user: "", password: "",
    wooUrl: "", wooKey: "", wooSecret: "",
    cronInterval: 5,
    tabelaPreco: "PDPRECO",
    mpAccessToken: "", 
    mpPublicKey: ""    
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem("raizan_config_geral");
    let currentTenant = "";

    if (dadosSalvos) {
      const config = JSON.parse(dadosSalvos);
      currentTenant = config.tenantId || ""; // Captura o tenant salvo
      setFormData({ 
        ...config, 
        cronInterval: config.cronInterval || 5,
        tabelaPreco: config.tabelaPreco || "PDPRECO",
        mpAccessToken: config.mpAccessToken || "", 
        mpPublicKey: config.mpPublicKey || "" 
      });
    }

    const urlSalva = localStorage.getItem("raizan_core_url") || getApiUrl();
    setCoreUrl(urlSalva);
    
    verificarLacreDaMaquina(urlSalva, currentTenant);
  }, []);

  const verificarLacreDaMaquina = async (url, tenantFallback) => {
    try {
      const customHeaders = {
        ...getHeaders(),
        "x-tenant-id": tenantFallback || "rafany" 
      };

      // Tira o cache do Electron para sempre ler o status real
      const response = await fetch(`${url}/api/config/status?t=${Date.now()}`, {
        headers: customHeaders,
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      setIsLocked(data.locked);
      if (data.locked && data.tenantId) {
        setFormData(prev => ({ ...prev, tenantId: data.tenantId }));
      }
    } catch (error) {
      console.log("Motor offline ou indisponível.");
      setIsLocked(false); // Se o motor estiver fora, garante tela destravada
    } finally {
      setLoadingLock(false);
    }
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    if (isLocked) return toast.error("Máquina lacrada! Revogue a licença para editar.");
    if (!formData.tenantId) return toast.error("Digite o subdomínio da empresa para lacrar a máquina!");

    setStatus("testing");
    const urlLimpa = coreUrl.trim().replace(/\/$/, "");
    localStorage.setItem("raizan_core_url", urlLimpa);
    setCoreUrl(urlLimpa);

    try {
      const response = await fetch(`${urlLimpa}/api/config/salvar`, {
        method: "POST",
        headers: { ...getHeaders(), "x-tenant-id": formData.tenantId },
        body: JSON.stringify(formData), 
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success"); 
        localStorage.setItem("raizan_config_geral", JSON.stringify(formData));
        toast.success("Máquina Lacrada e Configurações salvas!"); 
        setIsLocked(true); 
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error"); 
        toast.error("Erro ao salvar: " + (data.message || "Verifique os dados."));
      }
    } catch (error) {
      setStatus("error");
      toast.error("Motor offline. O Node.js está rodando?");
    }
  };

  const handleRevogarLacre = async () => {
    if (!confirm("CUIDADO: Isso vai desvincular o motor desta máquina da nuvem. O sistema será reiniciado. Continuar?")) return;
    
    // 🟢 A MÁGICA DA FORÇA BRUTA AQUI!
    // A primeira coisa que fazemos é DESTRAVAR O REACT (setIsLocked=false).
    // Não esperamos o servidor. Não apagamos o seu formulário. Apenas abrimos os cadeados.
    setIsLocked(false);
    toast.success("Lacre removido forçadamente da tela! Pode atualizar os dados.");
    
    try {
      await fetch(`${coreUrl}/api/config/revogar`, { 
        method: "POST",
        headers: { 
          ...getHeaders(), 
          "x-tenant-id": formData.tenantId || "rafany",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      // Mesmo se a chamada falhar ou der erro 500 no Electron, a tela JÁ ESTÁ DESTRAVADA.
    } catch (error) {
      console.error("Erro silencioso ao revogar no backend. A tela já está liberada.", error);
    }
  };

  if (loadingLock) return <div className="h-screen bg-white dark:bg-[#09090b] transition-colors duration-300"></div>;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar relative">
          
          <div className="max-w-3xl mx-auto space-y-8 pb-10 relative">
            
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3 transition-colors">
                  Configurações de Integração
                  {isLocked && <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-bold transition-colors"><Lock size={12}/> Máquina Lacrada</span>}
                </h1>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Configure os acessos ao ERP, Canais de Venda e Automações.</p>
              </div>

              {isLocked && (
                <button type="button" onClick={handleRevogarLacre} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-100 dark:bg-rose-500/10 hover:bg-rose-200 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm dark:shadow-[0_0_15px_rgba(244,63,94,0.1)] active:scale-95">
                  <ShieldAlert size={18} /> Revogar Licença
                </button>
              )}
            </div>

            <form onSubmit={handleTestConnection} className="space-y-6 relative">
              
              {isLocked && (
                <div className="absolute inset-0 z-20 bg-white/50 dark:bg-[#09090b]/40 backdrop-blur-[2px] rounded-2xl cursor-not-allowed border border-emerald-500/10 transition-colors" />
              )}

              {/* IDENTIDADE DA MÁQUINA */}
              <div className="border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
                 <div className="flex items-center gap-4 mb-6 border-b border-emerald-200 dark:border-emerald-500/20 pb-6 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30 transition-colors">
                    <Lock size={24} className="text-emerald-600 dark:text-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-emerald-900 dark:text-emerald-100 transition-colors">Identidade da Máquina</h2>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300/70 transition-colors">A qual subdomínio este motor local pertence?</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={formData.tenantId} 
                    onChange={(e) => setFormData({...formData, tenantId: e.target.value})} 
                    placeholder="ex: rafany"
                    disabled={isLocked}
                    className="w-full bg-white dark:bg-zinc-950 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-100 px-5 py-3.5 rounded-xl text-base outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-black uppercase tracking-widest disabled:opacity-50 transition-all placeholder:text-emerald-300 dark:placeholder:text-emerald-900/50 shadow-sm dark:shadow-none" 
                  />
                </div>
              </div>

              {/* SERVIDOR CORE */}
              <div className="border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none transition-opacity">
                  <Server size={120} className="text-blue-900 dark:text-blue-100" />
                </div>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-blue-200 dark:border-zinc-800/60 relative z-10 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center border border-blue-200 dark:border-blue-500/30 transition-colors">
                    <Server size={24} className="text-blue-600 dark:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-blue-900 dark:text-blue-100 transition-colors">Servidor Core (Backend)</h2>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300/70 transition-colors">Onde o motor do Raizan está rodando?</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="button" disabled={isLocked} onClick={() => setCoreUrl("http://localhost:3001")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all ${coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20" : "bg-white dark:bg-zinc-900 border-blue-200 dark:border-zinc-700 text-blue-800 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-zinc-800"} disabled:opacity-50`}>
                      <Laptop size={18} /> Modo Servidor Local
                    </button>
                    <button type="button" disabled={isLocked} onClick={() => setCoreUrl("http://192.168.1.200:3001")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all ${!coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20" : "bg-white dark:bg-zinc-900 border-blue-200 dark:border-zinc-700 text-blue-800 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-zinc-800"} disabled:opacity-50`}>
                      <Globe size={18} /> Modo Acesso Remoto
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={coreUrl} 
                    onChange={(e) => setCoreUrl(e.target.value)} 
                    placeholder="ex: http://localhost:3001 ou http://SEU_IP:3001"
                    disabled={isLocked}
                    className="w-full bg-white dark:bg-zinc-950 border border-blue-300 dark:border-zinc-800 text-blue-900 dark:text-blue-100 px-5 py-3.5 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono font-bold disabled:opacity-50 transition-all placeholder:text-blue-300 dark:placeholder:text-blue-900/50 shadow-sm dark:shadow-none" 
                  />
                </div>
              </div>

              {/* BANCO DE DADOS ORACLE */}
              <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none transition-colors">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-200 dark:border-red-500/20 transition-colors">
                    <Database size={24} className="text-red-600 dark:text-red-500 transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 transition-colors">Banco de Dados Oracle (ERP)</h2>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors">Conexão direta com a base local do cliente.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Host / IP</label>
                    <input disabled={isLocked} type="text" value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none" placeholder="localhost" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Porta</label>
                    <input disabled={isLocked} type="text" value={formData.port} onChange={(e) => setFormData({...formData, port: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none" />
                  </div>
                </div>
                
                <div className="space-y-2 mb-5">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Service Name / SID</label>
                  <input disabled={isLocked} type="text" value={formData.serviceName} onChange={(e) => setFormData({...formData, serviceName: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Usuário</label>
                    <input disabled={isLocked} type="text" value={formData.user} onChange={(e) => setFormData({...formData, user: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Senha</label>
                    <input disabled={isLocked} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium shadow-sm dark:shadow-none" />
                  </div>
                </div>

                <div className="space-y-2 p-5 bg-purple-50 dark:bg-zinc-950/50 border border-purple-200 dark:border-zinc-800 rounded-2xl transition-colors">
                  <label className="text-sm font-bold text-purple-900 dark:text-zinc-300 transition-colors">Tabela de Preço (Integração Principal)</label>
                  <select 
                    disabled={isLocked}
                    value={formData.tabelaPreco} 
                    onChange={(e) => setFormData({...formData, tabelaPreco: e.target.value})} 
                    className="w-full bg-white dark:bg-zinc-900 border border-purple-300 dark:border-zinc-700 text-purple-900 dark:text-zinc-200 px-5 py-3.5 rounded-xl text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 cursor-pointer disabled:opacity-50 font-bold transition-all shadow-sm dark:shadow-none"
                  >
                    <option value="PDPRECO">Tabela 1 - Padrão / Revenda</option>
                    <option value="PDPRECO2">Tabela 2 - Atacado / Hospitais</option>
                    <option value="PDPRECO3">Tabela 3 - Consumidor final / Especial</option>
                  </select>
                </div>
              </div>

              {/* WOOCOMMERCE */}
              <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none transition-colors">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 transition-colors">
                    <ShoppingCart size={24} className="text-purple-600 dark:text-purple-500 transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 transition-colors">WooCommerce (Loja Virtual)</h2>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors">Credenciais para espelhamento de catálogo e pedidos.</p>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">URL do Site</label>
                  <input disabled={isLocked} type="text" value={formData.wooUrl} onChange={(e) => setFormData({...formData, wooUrl: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Consumer Key (ck_...)</label>
                    <input disabled={isLocked} type="text" value={formData.wooKey} onChange={(e) => setFormData({...formData, wooKey: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Consumer Secret (cs_...)</label>
                    <input disabled={isLocked} type="password" value={formData.wooSecret} onChange={(e) => setFormData({...formData, wooSecret: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-purple-500 disabled:opacity-50 transition-all font-medium shadow-sm dark:shadow-none" />
                  </div>
                </div>
              </div>

              {/* MERCADO PAGO */}
              <div className="border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-sky-200 dark:border-zinc-800/60 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center border border-sky-200 dark:border-sky-500/20 transition-colors">
                    <CreditCard size={24} className="text-sky-600 dark:text-sky-400 transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-sky-900 dark:text-sky-100 transition-colors">Mercado Pago (PIX e Cartões)</h2>
                    <p className="text-xs font-medium text-sky-700 dark:text-sky-300/70 transition-colors">Credenciais para recebimento no B2B.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-sky-900 dark:text-zinc-300 transition-colors">Production Access Token</label>
                    <input 
                      disabled={isLocked}
                      type="password" 
                      value={formData.mpAccessToken} 
                      onChange={(e) => setFormData({...formData, mpAccessToken: e.target.value})} 
                      placeholder="APP_USR-123456789..."
                      className="w-full bg-white dark:bg-zinc-950 border border-sky-300 dark:border-zinc-800 text-sky-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 font-mono transition-all shadow-sm dark:shadow-none" 
                    />
                    <p className="text-[11px] font-medium text-sky-700 dark:text-zinc-500 mt-2 flex items-center gap-1.5 transition-colors">
                      <QrCode size={14} className="text-sky-600 dark:text-sky-500/50" /> Obrigatório para Webhook e Pix.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-sky-900 dark:text-zinc-300 transition-colors">Public Key</label>
                    <input 
                      disabled={isLocked}
                      type="text" 
                      value={formData.mpPublicKey} 
                      onChange={(e) => setFormData({...formData, mpPublicKey: e.target.value})} 
                      placeholder="APP_USR-..."
                      className="w-full bg-white dark:bg-zinc-950 border border-sky-300 dark:border-zinc-800 text-sky-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 font-mono transition-all shadow-sm dark:shadow-none" 
                    />
                    <p className="text-[11px] font-medium text-sky-700 dark:text-zinc-500 mt-2 flex items-center gap-1.5 transition-colors">
                      <CreditCard size={14} className="text-sky-600 dark:text-sky-500/50" /> Usado no frontend (Cartões).
                    </p>
                  </div>
                </div>
              </div>

              {/* AUTOMAÇÃO */}
              <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none transition-colors">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 transition-colors">
                    <Timer size={24} className="text-emerald-600 dark:text-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 transition-colors">Automação (Fila Fantasma)</h2>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors">De quanto em quanto tempo o motor deve subir atualizações de estoque/preço?</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Intervalo de Sincronização (Minutos)</label>
                  <input 
                    disabled={isLocked}
                    type="number" 
                    min="1" max="60" 
                    value={formData.cronInterval} 
                    onChange={(e) => setFormData({...formData, cronInterval: Number(e.target.value)})} 
                    className="w-full md:w-1/3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-5 py-3 rounded-xl text-base font-black outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 transition-all shadow-sm dark:shadow-none" 
                  />
                </div>
              </div>

              {/* BOTÃO FLUTUANTE DE SALVAR */}
              {!isLocked && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sticky bottom-4 z-30 shadow-2xl shadow-zinc-200/50 dark:shadow-none transition-colors gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                      {status === "idle" && <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 transition-colors">Pronto para salvar e lacrar máquina.</span>}
                      {status === "testing" && <><Loader2 size={18} className="text-purple-600 dark:text-purple-500 animate-spin transition-colors" /><span className="text-sm font-bold text-purple-700 dark:text-purple-400 transition-colors">Lacrando e reiniciando automação...</span></>}
                      {status === "error" && <><AlertCircle size={18} className="text-rose-600 dark:text-rose-500 transition-colors" /><span className="text-sm font-bold text-rose-700 dark:text-rose-400 transition-colors">Falha ao salvar.</span></>}
                  </div>
                  <button type="submit" disabled={status === "testing"} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Lock size={18} /> Salvar e Lacrar Motor
                  </button>
                </div>
              )}

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}