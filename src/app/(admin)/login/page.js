"use client";

import { useState } from "react";
import { Database, Lock, Mail, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react"; 
import { getApiUrl, getHeaders } from "@/components/utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(""); 
    
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: "POST",
        headers: getHeaders(), 
        body: JSON.stringify({ email, license })
      });

      const data = await response.json();

      // 🟢 O NOSSO RAIO-X: Isso vai imprimir no F12 tudo que o servidor mandou!
      console.log("📦 PACOTE QUE CHEGOU DO SERVIDOR:", data);

      if (!response.ok) {
        setErrorMsg(data.error || "Falha na autenticação."); 
        setIsLoading(false);
        return;
      }

      // 🟢 Tudo certo, salva no cofre
      localStorage.setItem("@raizan:email", data.email);
      localStorage.setItem("@raizan:license", license);
      localStorage.setItem("@raizan:expires_at", data.expires_at); 
      localStorage.setItem("@raizan:modulos", JSON.stringify(data.modulos));

      // 🟢 A CORREÇÃO DEFINITIVA: O Detetive de Nomes
      // Ele tenta pegar o "nome", se não tiver, tenta o "first_name", se não tiver, usa "Administrador"
      const nomeOficial = data.nome || 
                          [data.first_name, data.last_name].filter(Boolean).join(" ") || 
                          data.display_name || 
                          "Administrador";
                          
      localStorage.setItem("@raizan:nome", nomeOficial);

      setIsLoading(false);
      window.location.href = "/resumo"; 
      
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao conectar no servidor central. Verifique se o IP está correto nas configurações.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-50 dark:bg-[#09090b] transition-colors duration-300">
      
      {/* ============================== */}
      {/* LADO ESQUERDO: BRANDING & TECH */}
      {/* ============================== */}
      <div className="hidden lg:flex w-1/2 bg-[#050505] relative overflow-hidden flex-col justify-between p-16 border-r border-zinc-800/80">
        
        {/* GRID E LUZES DE FUNDO */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />

        {/* CONTEÚDO SUPERIOR */}
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-8 ring-4 ring-[#09090b]">
            <Database size={32} className="text-white" />
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
            O Ecossistema <br /> da sua Operação.
          </h1>
          <p className="text-lg font-medium text-zinc-400 max-w-md leading-relaxed">
            Controle absoluto, sincronização de ponta e gestão inteligente do ERP e E-commerce em um só terminal.
          </p>
        </div>

        {/* CONTEÚDO INFERIOR */}
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-zinc-500">
            <ShieldCheck size={20} className="text-emerald-500" />
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Ambiente Seguro e Monitorado</span>
          </div>
          <p className="text-[11px] font-medium text-zinc-600 ml-8 uppercase tracking-widest">
            Acesso Restrito • Raizan Core © 2026
          </p>
        </div>
      </div>

      {/* ============================== */}
      {/* LADO DIREITO: FORMULÁRIO       */}
      {/* ============================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        
        {/* Efeitos de luz no mobile (já que a parte escura some) */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none lg:hidden transition-colors" />
        
        <div className="w-full max-w-[420px] relative z-10">
          
          {/* Cabeçalho do Formulário */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 transition-colors tracking-tight">
              Bem-vindo(a)
            </h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors">
              Identifique-se para acessar o terminal administrativo.
            </p>
          </div>

          {/* NOSSO AVISO ELEGANTE (TOASTY INLINE) */}
          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 bg-rose-50 dark:bg-red-500/10 border border-rose-200 dark:border-red-500/20 px-4 py-3.5 rounded-xl animate-in fade-in slide-in-from-top-2 transition-colors">
              <AlertTriangle size={20} className="text-rose-600 dark:text-red-400 shrink-0 transition-colors" />
              <p className="text-sm font-bold text-rose-700 dark:text-red-400 transition-colors">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Campo E-mail */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest transition-colors">
                E-mail Corporativo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                  <Mail size={18} className="text-zinc-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@suaempresa.com"
                  className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium shadow-sm dark:shadow-none"
                  required
                />
              </div>
            </div>

            {/* Campo Licença */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest transition-colors">
                  Chave de Licença
                </label>
                <button type="button" className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors uppercase tracking-widest">
                  Esqueceu?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                  <Lock size={18} className="text-zinc-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-mono font-bold shadow-sm dark:shadow-none tracking-widest"
                  required
                />
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 dark:shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-70 active:scale-[0.98] uppercase tracking-wider text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar no Portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Rodapé Mobile (Aparece mais em telas menores) */}
          <div className="mt-12 text-center text-xs font-medium text-zinc-500 dark:text-zinc-500 space-y-5 transition-colors">
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/60 transition-colors">
              <a href="/login-b2b" className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors font-bold flex items-center justify-center gap-2">
                &larr; Voltar para o Portal do Lojista
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}