"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Database, ShoppingCart, CheckCircle2, AlertCircle, Loader2, Timer, Server, Globe, Laptop } from "lucide-react";
import { getApiUrl } from "@/components/utils/api"; 

export default function Configuracoes() {
  const [status, setStatus] = useState("idle"); 
  
  // ESTADO EXCLUSIVO DO FRONTEND (Onde está o backend?)
  const [coreUrl, setCoreUrl] = useState("http://localhost:3001");

  const [formData, setFormData] = useState({
    host: "", port: "1521", serviceName: "", user: "", password: "",
    wooUrl: "", wooKey: "", wooSecret: "",
    cronInterval: 5 
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem("raizan_config_geral");
    if (dadosSalvos) {
      const config = JSON.parse(dadosSalvos);
      setFormData({ ...config, cronInterval: config.cronInterval || 5 });
    }
    // Carrega a URL do Core usando nossa bússola
    setCoreUrl(getApiUrl());
  }, []);

  const handleTestConnection = async (e) => {
    e.preventDefault();
    setStatus("testing");

    // 1. Salva a URL do Core no navegador IMEDIATAMENTE
    const urlLimpa = coreUrl.trim().replace(/\/$/, "");
    localStorage.setItem("raizan_core_url", urlLimpa);
    setCoreUrl(urlLimpa);

    try {
      // 2. Manda para a URL dinâmica
      const response = await fetch(`${urlLimpa}/api/config/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), 
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success"); 
        localStorage.setItem("raizan_config_geral", JSON.stringify(formData));
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error"); 
      }
    } catch (error) {
      console.error("Erro na API:", error);
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-200 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-8">
            
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Configurações de Integração</h1>
              <p className="text-sm text-zinc-400 mt-1">Configure os acessos ao ERP, Canais de Venda e Automações.</p>
            </div>

            <form onSubmit={handleTestConnection} className="space-y-6">
              
              {/* NOVO CARD: CONEXÃO DO APP (Local vs Remoto) */}
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
                    <button type="button" onClick={() => setCoreUrl("http://localhost:3001")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`}>
                      <Laptop size={16} /> Modo Servidor Local
                    </button>
                    <button type="button" onClick={() => setCoreUrl("http://177.X.X.X:3001")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${!coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`}>
                      <Globe size={16} /> Modo Acesso Remoto
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={coreUrl} 
                    onChange={(e) => setCoreUrl(e.target.value)} 
                    placeholder="ex: http://localhost:3001 ou http://SEU_IP:3001"
                    className="w-full bg-zinc-950 border border-zinc-800 text-blue-100 px-4 py-3 rounded-lg text-sm outline-none focus:border-blue-500 font-mono" 
                  />
                </div>
              </div>

              {/* Card Oracle */}
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
                    <input type="text" value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Porta</label>
                    <input type="text" value={formData.port} onChange={(e) => setFormData({...formData, port: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                  </div>
                </div>
                
                <div className="space-y-1.5 mb-5">
                  <label className="text-sm font-medium text-zinc-300">Service Name / SID</label>
                  <input type="text" value={formData.serviceName} onChange={(e) => setFormData({...formData, serviceName: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Usuário</label>
                    <input type="text" value={formData.user} onChange={(e) => setFormData({...formData, user: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Senha</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                  </div>
                </div>
              </div>

              {/* Card WooCommerce */}
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
                  <input type="text" value={formData.wooUrl} onChange={(e) => setFormData({...formData, wooUrl: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Consumer Key (ck_...)</label>
                    <input type="text" value={formData.wooKey} onChange={(e) => setFormData({...formData, wooKey: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Consumer Secret (cs_...)</label>
                    <input type="password" value={formData.wooSecret} onChange={(e) => setFormData({...formData, wooSecret: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" />
                  </div>
                </div>
              </div>

              {/* Card Automação (Cron) */}
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
                    type="number" 
                    min="1" 
                    max="60" 
                    value={formData.cronInterval} 
                    onChange={(e) => setFormData({...formData, cronInterval: Number(e.target.value)})} 
                    className="w-full md:w-1/2 bg-zinc-950 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-purple-500" 
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Define de quanto em quanto tempo o sistema verifica alterações no ERP para mandar para o WooCommerce.
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-2">
                    {status === "idle" && <span className="text-sm text-zinc-500">Pronto para salvar.</span>}
                    {status === "testing" && <><Loader2 size={16} className="text-purple-500 animate-spin" /><span className="text-sm text-purple-400">Salvando configurações e reiniciando automação...</span></>}
                    {status === "success" && <><CheckCircle2 size={16} className="text-emerald-500" /><span className="text-sm text-emerald-400">Configurações Salvas e Automação Atualizada!</span></>}
                    {status === "error" && <><AlertCircle size={16} className="text-rose-500" /><span className="text-sm text-rose-400">Erro ao salvar configurações.</span></>}
                </div>
                <button type="submit" disabled={status === "testing"} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50">
                  Salvar Configurações
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}