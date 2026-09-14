"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; 
import { Mail, Lock, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react"; 
import toast from "react-hot-toast";
import packageJson from "../../../../package.json";
import { getHubUrl } from "@/components/utils/api";

export default function LoginB2B() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [configuracaoPronta, setConfiguracaoPronta] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true);

  // ======================================================================
  // 🟢 A MÁGICA: DESCOBRINDO A IDENTIDADE (SEM FANTASMAS E COM SACOLEIRO)
  // ======================================================================
  useEffect(() => {
    const identificarPortal = async () => {
      try {
        const host = window.location.hostname; 
        
        const res = await fetch(`${getHubUrl()}/api/hub/integracoes/b2b/identificar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url_acesso: host })
        });
        
        if (!res.ok) throw new Error(`Erro no servidor: ${res.status}`);

        const data = await res.json();
        
        if (data.success) {
          localStorage.setItem("@raizan:b2b_tenant_id", data.tenant_id);
          
          // 🟢 1ª LINHA NOVA: Salva o acréscimo que vem do banco de dados na nuvem!
          localStorage.setItem("@raizan:acrescimo_cpf", data.acrescimo_cpf || 0);

          const urlCorreta = data.url_api_local?.includes("rafany") ? "https://api.raizan.com.br" : data.url_api_local;
          localStorage.setItem("@raizan:b2b_api_url", urlCorreta || "https://api.raizan.com.br");
          console.log(`🔥 Identidade confirmada: ${data.tenant_id} | Nuvem Ativada!`);
          setConfiguracaoPronta(true);
        } else {
          if (host === 'localhost' || host === '127.0.0.1') {
            localStorage.setItem("@raizan:b2b_tenant_id", process.env.NEXT_PUBLIC_TENANT_ID || "28389424000109");
            localStorage.setItem("@raizan:b2b_api_url", process.env.NEXT_PUBLIC_HUB_URL || "https://api.raizan.com.br");
            
            // 🟢 2ª LINHA NOVA: Força os 30% no seu computador para testar!
            localStorage.setItem("@raizan:acrescimo_cpf", 30); 
            
            setConfiguracaoPronta(true);
          } else {
            setErrorMsg("Portal não registrado. Verifique a URL no painel administrativo.");
          }
        }
      } catch (e) {
        console.error("Falha ao comunicar com o Hub Central.", e);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          localStorage.setItem("@raizan:b2b_tenant_id", process.env.NEXT_PUBLIC_TENANT_ID || "28389424000109");
          localStorage.setItem("@raizan:b2b_api_url", process.env.NEXT_PUBLIC_HUB_URL || "https://api.raizan.com.br");
          
          // 🟢 3ª LINHA NOVA: Força os 30% no seu computador se der erro de conexão!
          localStorage.setItem("@raizan:acrescimo_cpf", 30);
          
          setConfiguracaoPronta(true);
        } else {
          setErrorMsg("Servidor Central indisponível. Verifique as rotas da Hostinger.");
        }
      } finally {
        setIsConfiguring(false);
      }
    };

    identificarPortal();
  }, []);
  // ======================================================================

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const tenantId = localStorage.getItem("@raizan:b2b_tenant_id");

    try {
      const response = await fetch(`${getHubUrl()}/api/auth/b2b/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId 
        }, 
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
      setErrorMsg("Erro de conexão com o servidor da distribuidora na Nuvem.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#09090b] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-500">
      
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-[#121214] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* LADO ESQUERDO - BRANDING (AGORA ROXO/INDIGO) */}
        <div className="w-full md:w-5/12 bg-[#0c0c0e] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-zinc-800/50">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 mb-10 md:mb-0">
            <Image src="/logo.png" alt="Logo da Distribuidora" width={180} height={70} priority className="object-contain drop-shadow-2xl" />
          </div>
          
          <div className="relative z-10 my-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Seu estoque atualizado.
            </h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-sm">
              Reposição de estoque, acompanhamento de pedidos e gestão inteligente em um só lugar.
            </p>
          </div>
          
          <div className="relative z-10 mt-10 md:mt-0">
            <div className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
              <ShieldCheck size={16} /> Ambiente Seguro e Monitorado
            </div>
          </div>
        </div>

        {/* LADO DIREITO - FORMULÁRIO */}
        <div className="w-full md:w-7/12 bg-white dark:bg-[#121214] p-8 md:p-12 lg:p-16 flex flex-col justify-center relative transition-colors duration-500">
          <div className="max-w-md w-full mx-auto">
            
            <div className="mb-10">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Bem-vindo(a)</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Identifique-se para acessar o portal de compras.</p>
            </div>

            {errorMsg && (
              <div className="mb-6 flex items-start gap-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl animate-in slide-in-from-top-2">
                <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 leading-snug">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">E-mail Corporativo / Pessoal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium disabled:opacity-50"
                    required
                    disabled={isConfiguring || !configuracaoPronta}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">Senha de Acesso</label>
                  <button type="button" onClick={() => toast('A recuperação de senha estará disponível em breve.')} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 uppercase tracking-wider transition-colors">
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Digite sua senha"
                    maxLength="6"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-mono font-medium tracking-widest disabled:opacity-50"
                    required
                    disabled={isConfiguring || !configuracaoPronta}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isConfiguring || !configuracaoPronta || !email || senha.length < 6}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(147,51,234,0.5)] hover:shadow-[0_10px_25px_-10px_rgba(147,51,234,0.7)] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
              >
                {isLoading || isConfiguring ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar no Portal <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Versão B2B • {packageJson.version}</span>
              <a href="/login" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors flex items-center gap-1">Acesso Matriz &rarr;</a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}