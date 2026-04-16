"use client";

import { useState } from "react";
import Image from "next/image"; 
import { Mail, Lock, ArrowRight, AlertTriangle, Loader2, ShieldCheck } from "lucide-react"; 
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
      const response = await fetch(`${getApiUrl()}/api/b2b/auth`, {
        method: "POST",
        headers: getHeaders(),
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
    // Fundo da página adapta ao tema do SO do usuário para não agredir os cantos
    <div className="min-h-screen bg-zinc-100 dark:bg-[#09090b] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-500">
      
      {/* Container Principal Split Screen */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* ========================================== */}
        {/* LADO ESQUERDO: DARK MODE + INSTITUCIONAL */}
        {/* ========================================== */}
        <div className="w-full md:w-5/12 bg-[#0c0c0e] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden shrink-0">
          
          {/* Neons da Marca */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-600/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-600/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Topo / Logo */}
          <div className="relative z-10 mb-10 md:mb-0">
            <Image 
              src="/logo.png" 
              alt="Logo da Distribuidora" 
              width={180} 
              height={70} 
              priority
              className="object-contain drop-shadow-2xl" 
            />
          </div>

          {/* Textos Centrais */}
          <div className="relative z-10 my-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Seu estoque atualizado.
            </h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-sm">
              Reposição de estoque, acompanhamento de pedidos e gestão inteligente em um só lugar.
            </p>
          </div>

          {/* Rodapé do lado esquerdo */}
          <div className="relative z-10 mt-10 md:mt-0">
            <div className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
              <ShieldCheck size={16} /> Ambiente Seguro e Monitorado
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* LADO DIREITO: LIGHT MODE + FORMULÁRIO */}
        {/* ========================================== */}
        <div className="w-full md:w-7/12 bg-white p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-zinc-900 mb-2">Bem-vindo(a)</h2>
              <p className="text-zinc-500 text-sm">Identifique-se para acessar o portal do lojista.</p>
            </div>

            {errorMsg && (
              <div className="mb-6 flex items-start gap-3 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl animate-in slide-in-from-top-2">
                <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-rose-600 leading-snug">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              
              {/* Campo E-mail */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-400 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Senha de Acesso
                  </label>
                  {/* Botão Fake de Esqueceu a Senha - Exatamente como a Sou Básica */}
                  <button 
                    type="button" 
                    onClick={() => toast('A recuperação de senha estará disponível em breve.')}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Digite sua senha"
                    maxLength="6"
                    className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-400 font-mono font-medium tracking-widest"
                    required
                  />
                </div>
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={isLoading || !email || senha.length < 6}
                className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_10px_25px_-10px_rgba(16,185,129,0.7)] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
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

            {/* Rodapé Administrativo */}
            <div className="mt-12 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Versão B2B • {packageJson.version}</span>
              <a href="/login" className="hover:text-emerald-500 transition-colors flex items-center gap-1">
                Acesso Matriz &rarr;
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}