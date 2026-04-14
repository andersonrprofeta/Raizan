"use client";

import { useState } from "react";
import Image from "next/image"; 
import { Mail, Lock, ArrowRight, AlertTriangle, Loader2 } from "lucide-react"; 
//import { getApiUrl } from "@/components/utils/api";
import toast from "react-hot-toast";
import packageJson from "../../../../package.json";
import { getApiUrl, getHeaders } from "@/components/utils/api";

export default function LoginB2B() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Dentro do seu handleLogin do B2B:
      const response = await fetch(`${getApiUrl()}/api/b2b/auth`, {
        method: "POST",
        headers: getHeaders(), // 🛡️ TEM QUE TER O CRACHÁ AQUI TAMBÉM!
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Acesso negado. Verifique os dados.");
        toast.error("Falha na autenticação");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("raizan_user", JSON.stringify(data.user));
      toast.success(`Bem-vindo, ${data.user.nome}!`);
      
      setTimeout(() => {
        window.location.href = "/b2b-inicio"; 
      }, 1000);

    } catch (err) {
      setErrorMsg("Erro de conexão com o servidor da distribuidora.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 🟢 O SEGREDO DO NEON ESTÁ AQUI 🟢 */}
      {/* Exatamente as mesmas posições (left-1/4 e right-1/4) e o mesmo blur da tela de Admin, 
          mas brilhando no tom do botão da Rafany! */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Cabeçalho do Login */}
        <div className="flex flex-col items-center mb-10 text-center">
          
          <div className="mb-6 flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Logo da Distribuidora" 
              width={220} 
              height={85} 
              priority
              className="object-contain drop-shadow-2xl" 
            />
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-tight mb-2">
            Portal do Lojista
          </h1>
          <p className="text-zinc-500 text-sm">
            Acesso exclusivo ao catálogo da distribuidora
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-[#09090b] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
          
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-400 leading-snug">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Campo E-mail */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-emerald-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 autofill:bg-zinc-900 autofill:text-zinc-100"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex justify-between">
                <span>Senha de Acesso</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-emerald-500" />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 primeiros dígitos do CNPJ"
                  maxLength="6"
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 font-mono autofill:bg-zinc-900 autofill:text-zinc-100"
                  required
                />
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading || !email || senha.length < 6}
              className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar no Portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Rodapé do B2B */}
        <div className="mt-8 text-center text-xs text-zinc-600 space-y-4">
          <p>
            Ambiente Seguro • Integrado ao ERP Rafany <br/>
            <span className="font-medium mt-1 inline-block text-emerald-500/50">
              Versão B2B: {packageJson.version}
            </span>
          </p>
          
          {/* A PORTA DOS FUNDOS PARA O ADMIN */}
          <div>
            <a href="/login" className="text-zinc-500 hover:text-emerald-400 transition-colors">
              Acesso Administrativo (Terminal) &rarr;
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}