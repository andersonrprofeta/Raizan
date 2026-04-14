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

    // 🟢 CORREÇÃO 2: Força a leitura do LocalStorage primeiro para blindar a URL!
    const urlSalva = localStorage.getItem("raizan_core_url") || getApiUrl();
    setCoreUrl(urlSalva);
    
    verificarLacreDaMaquina(urlSalva, currentTenant);
  }, []);

  // 🟢 CORREÇÃO 1: Agora passamos o "Tenant" pra montar o crachá e provar pro Motor quem somos!
  const verificarLacreDaMaquina = async (url, tenantFallback) => {
    try {
      // Forçamos a injeção do cabeçalho de segurança
      const customHeaders = {
        ...getHeaders(),
        "x-tenant-id": tenantFallback || "rafany" 
      };

      const response = await fetch(`${url}/api/config/status`, {
        headers: customHeaders // AQUI ESTAVA O SEGREDO! Agora o Motor recebe o crachá.
      });
      
      const data = await response.json();
      
      setIsLocked(data.locked);
      if (data.locked && data.tenantId) {
        setFormData(prev => ({ ...prev, tenantId: data.tenantId }));
      }
    } catch (error) {
      console.log("Motor offline ou indisponível.");
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
        headers: { ...getHeaders(), "x-tenant-id": formData.tenantId }, // Reforço de segurança
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
    
    try {
      // 🟢 CORREÇÃO: Enviando o crachá de segurança e dizendo quem somos!
      const response = await fetch(`${coreUrl}/api/config/revogar`, { 
        method: "POST",
        headers: { 
          ...getHeaders(), 
          "x-tenant-id": formData.tenantId || "rafany",
          "Content-Type": "application/json"
        } 
      });

      // Detetive para ver se o servidor devolveu erro HTML em vez de JSON (ex: Rota não existe)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         const erroBruto = await response.text();
         console.error("❌ Erro Bruto do Servidor ao revogar:", erroBruto);
         toast.error("Erro no motor! Verifique o console (F12).");
         return;
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success("Lacre removido! O sistema está livre novamente.");
        setIsLocked(false);
        setFormData(prev => ({ ...prev, tenantId: "" }));
        localStorage.removeItem("raizan_config_geral");
      } else {
        toast.error("Erro: " + (data.message || "O servidor recusou abrir o lacre."));
      }
    } catch (error) {
      console.error("❌ Erro fatal ao revogar:", error);
      toast.error("Erro de comunicação ao tentar revogar o lacre.");
    }
  };

  if (loadingLock) return <div className="h-screen bg-[#09090b]"></div>;

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-200 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
          
          <div className="max-w-3xl mx-auto space-y-8 pb-10 relative">
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
                  Configurações de Integração
                  {isLocked && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-1 rounded-md flex items-center gap-1"><Lock size={12}/> Máquina Lacrada</span>}
                </h1>
                <p className="text-sm text-zinc-400 mt-1">Configure os acessos ao ERP, Canais de Venda e Automações.</p>
              </div>

              {isLocked && (
                <button type="button" onClick={handleRevogarLacre} className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                  <ShieldAlert size={16} /> Revogar Licença da Máquina
                </button>
              )}
            </div>

            <form onSubmit={handleTestConnection} className="space-y-6 relative">
              
              {/* SE ESTIVER TRAVADO, COLOCA UMA TELA DE VIDRO POR CIMA DE TUDO */}
              {isLocked && (
                <div className="absolute inset-0 z-20 bg-[#09090b]/40 backdrop-blur-[2px] rounded-2xl cursor-not-allowed border border-emerald-500/10" />
              )}

              {/* O NOVO CARD DE IDENTIDADE (CRACHÁ DA MÁQUINA) */}
              <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-6 relative overflow-hidden">
                 <div className="flex items-center gap-3 mb-4 border-b border-emerald-500/20 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Lock size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-100">Identidade da Máquina</h2>
                    <p className="text-xs text-emerald-300/70">A qual subdomínio este motor local pertence?</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <input 
                    type="text" 
                    value={formData.tenantId} 
                    onChange={(e) => setFormData({...formData, tenantId: e.target.value})} 
                    placeholder="ex: rafany"
                    disabled={isLocked}
                    className="w-full bg-zinc-950 border border-emerald-500/30 text-emerald-100 px-4 py-3 rounded-lg text-sm outline-none focus:border-emerald-500 font-bold uppercase tracking-widest disabled:opacity-50" 
                  />
                </div>
              </div>

              {/* CARD: CONEXÃO DO APP */}
              <div className="border border-blue-500/30 bg-blue-500/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Server size={100} />
                </div>
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800/60 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Server size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-blue-100">Servidor Core (Backend)</h2>
                    <p className="text-xs text-blue-300/70">Onde o motor do Raizan está rodando?</p>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex gap-3">
                    <button type="button" disabled={isLocked} onClick={() => setCoreUrl("http://localhost:3001")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-900 border-zinc-700 text-zinc-400"} disabled:opacity-50`}>
                      <Laptop size={16} /> Modo Servidor Local
                    </button>
                    <button type="button" disabled={isLocked} onClick={() => setCoreUrl("http://192.168.1.200:3001")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${!coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-900 border-zinc-700 text-zinc-400"} disabled:opacity-50`}>
                      <Globe size={16} /> Modo Acesso Remoto
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={coreUrl} 
                    onChange={(e) => setCoreUrl(e.target.value)} 
                    placeholder="ex: http://localhost:3001 ou http://SEU_IP:3001"
                    disabled={isLocked}
                    className="w-full bg-zinc-950 border border-zinc-800 text-blue-100 px-4 py-3 rounded-lg text-sm outline-none focus:border-blue-500 font-mono disabled:opacity-50" 
                  />
                </div>
              </div>

              {/* CARD ORACLE */}
              <div className="border border-zinc-800/60 bg-zinc-900/40 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800/60">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Database size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Banco de Dados Oracle (ERP)</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Host / IP</label>
                    <input disabled={isLocked} type="text" value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" placeholder="localhost" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Porta</label>
                    <input disabled={isLocked} type="text" value={formData.port} onChange={(e) => setFormData({...formData, port: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" />
                  </div>
                </div>
                
                <div className="space-y-1.5 mb-5">
                  <label className="text-sm font-medium text-zinc-300">Service Name / SID</label>
                  <input disabled={isLocked} type="text" value={formData.serviceName} onChange={(e) => setFormData({...formData, serviceName: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Usuário</label>
                    <input disabled={isLocked} type="text" value={formData.user} onChange={(e) => setFormData({...formData, user: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Senha</label>
                    <input disabled={isLocked} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                  <label className="text-sm font-medium text-zinc-300">Tabela de Preço (Integração)</label>
                  <select 
                    disabled={isLocked}
                    value={formData.tabelaPreco} 
                    onChange={(e) => setFormData({...formData, tabelaPreco: e.target.value})} 
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="PDPRECO">Tabela 1 - Padrão / Revenda</option>
                    <option value="PDPRECO2">Tabela 2 - Atacado / Hospitais</option>
                    <option value="PDPRECO3">Tabela 3 - Consumidor final / Especial</option>
                  </select>
                </div>
              </div>

              {/* CARD WOOCOMMERCE */}
              <div className="border border-zinc-800/60 bg-zinc-900/40 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800/60">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <ShoppingCart size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">WooCommerce (Loja Virtual)</h2>
                  </div>
                </div>

                <div className="space-y-1.5 mb-5">
                  <label className="text-sm font-medium text-zinc-300">URL do Site</label>
                  <input disabled={isLocked} type="text" value={formData.wooUrl} onChange={(e) => setFormData({...formData, wooUrl: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Consumer Key (ck_...)</label>
                    <input disabled={isLocked} type="text" value={formData.wooKey} onChange={(e) => setFormData({...formData, wooKey: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Consumer Secret (cs_...)</label>
                    <input disabled={isLocked} type="password" value={formData.wooSecret} onChange={(e) => setFormData({...formData, wooSecret: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" />
                  </div>
                </div>
              </div>

              {/* 🟢 O NOVO CARD DO MERCADO PAGO 🟢 */}
              <div className="border border-sky-500/30 bg-sky-500/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800/60">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                    <CreditCard size={20} className="text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-sky-100">Mercado Pago (PIX e Cartões)</h2>
                    <p className="text-xs text-sky-300/70">Credenciais para recebimento no B2B.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Production Access Token</label>
                    <input 
                      disabled={isLocked}
                      type="password" 
                      value={formData.mpAccessToken} 
                      onChange={(e) => setFormData({...formData, mpAccessToken: e.target.value})} 
                      placeholder="APP_USR-123456789..."
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-sky-500 disabled:opacity-50 font-mono" 
                    />
                    <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                      <QrCode size={12} className="text-sky-500/50" /> Obrigatório para Webhook e Pix.
                    </p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Public Key</label>
                    <input 
                      disabled={isLocked}
                      type="text" 
                      value={formData.mpPublicKey} 
                      onChange={(e) => setFormData({...formData, mpPublicKey: e.target.value})} 
                      placeholder="APP_USR-..."
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-sky-500 disabled:opacity-50 font-mono" 
                    />
                    <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                      <CreditCard size={12} className="text-sky-500/50" /> Usado no frontend (Cartões).
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD AUTOMAÇÃO */}
              <div className="border border-zinc-800/60 bg-zinc-900/40 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800/60">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Timer size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Automação (Fila Fantasma)</h2>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Intervalo de Sincronização (Minutos)</label>
                  <input 
                    disabled={isLocked}
                    type="number" 
                    min="1" max="60" 
                    value={formData.cronInterval} 
                    onChange={(e) => setFormData({...formData, cronInterval: Number(e.target.value)})} 
                    className="w-full md:w-1/2 bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500 disabled:opacity-50" 
                  />
                </div>
              </div>

              {/* BOTÕES DE AÇÃO */}
              {!isLocked && (
                <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl sticky bottom-4 z-30">
                  <div className="flex items-center gap-2">
                      {status === "idle" && <span className="text-sm text-zinc-500">Pronto para salvar e lacrar máquina.</span>}
                      {status === "testing" && <><Loader2 size={16} className="text-purple-500 animate-spin" /><span className="text-sm text-purple-400">Lacrando e reiniciando automação...</span></>}
                      {status === "error" && <><AlertCircle size={16} className="text-rose-500" /><span className="text-sm text-rose-400">Falha ao salvar.</span></>}
                  </div>
                  <button type="submit" disabled={status === "testing"} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2">
                    <Lock size={16} /> Salvar e Lacrar Motor
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