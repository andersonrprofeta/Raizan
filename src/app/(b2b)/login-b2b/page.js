"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react"; 
import toast from "react-hot-toast";
import packageJson from "../../../../package.json";
import { getHubUrl } from "@/components/utils/api";
import { guardarAcrescimo } from "@/components/utils/acrescimoPortal";
import { prepararCarrinhoPara } from "@/components/portal/carrinho";
import EtapaAcesso from "@/components/b2b/EtapaAcesso";
import { BOTAO_PRIMARIO } from "@/components/vendedores/ui";

export default function LoginB2B() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [configuracaoPronta, setConfiguracaoPronta] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [logoEmpresa, setLogoEmpresa] = useState(null);
  const [etapa, setEtapa] = useState("entrar");
  const [loginPendente, setLoginPendente] = useState(null);
  const [codigoRecuperacao, setCodigoRecuperacao] = useState(null);

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
          setLogoEmpresa(data.logo_url || null);

          guardarAcrescimo(data.acrescimo_cpf);

          localStorage.setItem("@raizan:b2b_api_url", "https://api.raizan.com.br");
          console.log(`🔥 Identidade confirmada: ${data.tenant_id} | Nuvem Ativada!`);
          setConfiguracaoPronta(true);
        } else {
          if (host === 'localhost' || host === '127.0.0.1') {
            localStorage.setItem("@raizan:b2b_tenant_id", process.env.NEXT_PUBLIC_TENANT_ID || "");
            localStorage.setItem("@raizan:b2b_api_url", process.env.NEXT_PUBLIC_HUB_URL || "https://api.raizan.com.br");
            setConfiguracaoPronta(true);
          } else {
            setErrorMsg("Portal não registrado. Verifique a URL no painel administrativo.");
          }
        }
      } catch (e) {
        console.error("Falha ao comunicar com o Hub Central.", e);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          localStorage.setItem("@raizan:b2b_tenant_id", process.env.NEXT_PUBLIC_TENANT_ID || "");
          localStorage.setItem("@raizan:b2b_api_url", process.env.NEXT_PUBLIC_HUB_URL || "https://api.raizan.com.br");
          setConfiguracaoPronta(true);
        } else {
          setErrorMsg("Servidor Central indisponível. Verifique as rotas da Hostinger.");
        }
      } finally {
        setIsConfiguring(false);
      }
    };

    identificarPortal();

    const codigo = new URLSearchParams(window.location.search).get("redefinir");
    if (codigo) {
      setCodigoRecuperacao(codigo);
      setEtapa("redefinir");
    }
  }, []);

  const irParaOPortal = () => {
    window.location.href = "/b2b-inicio";
  };
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

      if (data.precisaCriarSenha) {
        setLoginPendente(data);
        setEtapa("criar");
        setIsLoading(false);
        return;
      }

      salvarSessao(data);
      toast.success(`Bem-vindo, ${data.user.nome}!`);
      setTimeout(irParaOPortal, 1000);

    } catch (err) {
      setErrorMsg("Erro de conexão com o servidor da distribuidora na Nuvem.");
      setIsLoading(false);
    }
  };

  const salvarSessao = (data) => {
    prepararCarrinhoPara(data.user?.email);
    localStorage.setItem("raizan_user", JSON.stringify(data.user));
    localStorage.setItem("@raizan:token", data.token);

      // 🟢 O PULO DO GATO: Pesca a logo do backend e já joga no cache principal do Sidebar
      const logoB2B = data.user.logo_url || logoEmpresa;
      if (logoB2B) {
        localStorage.setItem("@raizan:logo", logoB2B);
      } else {
        localStorage.removeItem("@raizan:logo"); // Limpa resquícios antigos se não houver logo
      }
  };

  // Sem logo da empresa (ou endereço não reconhecido), entra a marca neutra da Raizan, nunca a de outro cliente
  const logoDoPortal = (className, fundoEscuro = false) => {
    if (isConfiguring) return <div className={`${className} w-36 rounded-xl ${fundoEscuro ? "bg-white/10" : "bg-black/[0.05]"} animate-pulse`} aria-hidden="true" />;
    if (logoEmpresa) return <img src={logoEmpresa} alt="Logo da distribuidora" className={`${className} max-w-[180px] object-contain`} />;
    return <img src={fundoEscuro ? "/raizan-logo-escura.png" : "/raizan-logo-clara.png"} alt="Raizan" className={`${className} max-w-[170px] object-contain`} />;
  };

  const campo = "w-full h-12 rounded-2xl bg-black/[0.04] border border-transparent pl-11 pr-4 text-base text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:bg-white focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 disabled:opacity-50";

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-white md:bg-[#f5f5f7] text-zinc-900 antialiased">
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
        <div className="absolute -top-48 left-[10%] h-[600px] w-[600px] rounded-full bg-purple-400/20 blur-[130px]" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-[520px] w-[520px] rounded-full bg-indigo-400/20 blur-[130px]" />
      </div>

      <main className="relative z-10 flex min-h-dvh items-start justify-center md:items-center md:p-8">
        <div className="flex w-full max-w-[980px] overflow-hidden md:rounded-[32px] md:border md:border-black/[0.06] md:bg-white/80 md:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_30px_60px_-30px_rgba(0,0,0,0.25)] md:backdrop-blur-xl">

          {/* Marca da distribuidora */}
          <div className="relative hidden w-5/12 shrink-0 flex-col justify-between overflow-hidden bg-[#0c0c0e] p-12 md:flex">
            <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-purple-600/35 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-600/25 blur-[100px]" />

            <div className="relative z-10 flex h-[70px] items-center">
              {logoDoPortal("max-h-[70px] h-full", true)}
            </div>

            <div className="relative z-10 my-12">
              <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-white lg:text-[44px]">
                Seu estoque<br />atualizado.
              </h1>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-zinc-400">
                Reposição de estoque, acompanhamento de pedidos e gestão inteligente em um só lugar.
              </p>
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-zinc-300">
                <ShieldCheck size={15} className="text-emerald-400" /> Ambiente seguro
              </span>
            </div>
          </div>

          {/* Formulário */}
          <div className="flex w-full flex-col justify-center px-6 py-10 md:w-7/12 md:p-12 lg:p-16">
            <div className="mx-auto w-full max-w-[380px]">
              <div className="mb-10 flex h-12 items-center md:hidden">
                {logoDoPortal("max-h-full h-full")}
              </div>

              {etapa !== "entrar" ? (
                <EtapaAcesso
                  etapa={etapa}
                  token={loginPendente?.token}
                  codigo={codigoRecuperacao}
                  emailInicial={email}
                  onConcluir={(resposta) => {
                    toast.success("Senha salva com sucesso!");
                    if (etapa === "criar") {
                      salvarSessao({ ...loginPendente, token: resposta.token });
                      setTimeout(irParaOPortal, 800);
                    } else {
                      window.history.replaceState(null, "", "/login-b2b");
                      setSenha("");
                      setEtapa("entrar");
                    }
                  }}
                  onVoltar={() => {
                    window.history.replaceState(null, "", "/login-b2b");
                    setEtapa("entrar");
                  }}
                />
              ) : (
                <>
                  <h2 className="text-[28px] font-semibold tracking-[-0.02em]">Entrar</h2>
                  <p className="mt-1.5 text-[15px] text-zinc-500">Acesse o portal para comprar e acompanhar seus pedidos.</p>

                  {errorMsg && (
                    <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 animate-in slide-in-from-top-2">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-500" />
                      <p className="text-sm font-medium leading-snug text-rose-700">{errorMsg}</p>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-4">
                    <div>
                      <label htmlFor="b2b-email" className="mb-1.5 block text-[13px] font-medium text-zinc-500">E-mail</label>
                      <div className="relative group">
                        <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-purple-500" />
                        <input
                          id="b2b-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com.br"
                          autoComplete="email"
                          inputMode="email"
                          className={campo}
                          required
                          disabled={isConfiguring || !configuracaoPronta}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="b2b-senha" className="block text-[13px] font-medium text-zinc-500">Senha</label>
                        <button type="button" onClick={() => setEtapa("esqueci")} className="text-[13px] font-medium text-purple-600 transition-colors hover:text-purple-500">
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-purple-500" />
                        <input
                          id="b2b-senha"
                          type="password"
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          placeholder="Digite sua senha"
                          autoComplete="current-password"
                          className={campo}
                          required
                          disabled={isConfiguring || !configuracaoPronta}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || isConfiguring || !configuracaoPronta || !email || senha.length < 6}
                      className={`${BOTAO_PRIMARIO} mt-3 !h-12 w-full text-[15px]`}
                    >
                      {isLoading || isConfiguring ? (
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>Entrar <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                  <p className="mt-5 text-center text-[13px] text-zinc-500">
                    Primeiro acesso? Use os 6 primeiros dígitos do seu CNPJ ou CPF.
                  </p>
                </>
              )}

              <div className="mt-10 flex items-center justify-between gap-4 border-t border-black/[0.06] pt-5 text-[12px] font-medium text-zinc-400">
                <span>Portal B2B · versão {packageJson.version}</span>
                <a href="/login" className="transition-colors hover:text-purple-600">Acesso da empresa &rarr;</a>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
