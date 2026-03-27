"use client";

import { useState } from "react";
import { Database, Lock, Mail, ArrowRight, AlertTriangle } from "lucide-react"; // Adicionei o AlertTriangle aqui

export default function Login() {
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); // Nosso "Toasty" de erro

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(""); // Limpa o erro anterior ao tentar de novo
    
    try {
      // ⚠️ Lembre-se: Para testar na sua casa, o localhost precisa ser o IP do servidor
      const response = await fetch("http://digital.rafany.com.br:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, license })
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostra o erro elegante na tela!
        setErrorMsg(data.error || "Falha na autenticação."); 
        setIsLoading(false);
        return;
      }

      // Tudo certo, salva no cofre
      localStorage.setItem("@raizan:email", data.email);
      localStorage.setItem("@raizan:license", license);
      localStorage.setItem("@raizan:expires_at", data.expires_at); 
      localStorage.setItem("@raizan:modulos", JSON.stringify(data.modulos));

      setIsLoading(false);
      window.location.href = "/"; 
      
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao conectar no servidor central. Verifique sua internet.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Efeitos de luz no fundo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Cabeçalho do Login */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)] mb-6">
            <Database size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-tight mb-2">
            Raizan Core
          </h1>
          <p className="text-zinc-500 text-sm">
            Gestão inteligente e sincronização de ponta
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-[#09090b] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
          
          {/* NOSSO AVISO ELEGANTE (TOASTY INLINE) */}
          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={20} className="text-red-400 shrink-0" />
              <p className="text-sm font-medium text-red-400">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Campo E-mail */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            {/* Campo Licença */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Chave de Licença
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-zinc-600 font-mono"
                  required
                />
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Autenticar Terminal <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Rodapé */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Precisa de ajuda com sua licença? <br/>
          <a href="https://raizan.com.br" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
            Acesse o portal do cliente
          </a>
        </p>

      </div>
    </div>
  );
}