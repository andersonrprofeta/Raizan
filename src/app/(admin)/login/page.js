"use client";

import { useEffect, useRef, useState } from "react";
import { Database, Lock, Mail, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react"; 
// 🟢 MUDANÇA 1: Trocamos getApiUrl por getHubUrl para bater no Node.js
import { getHubUrl, getHeaders } from "@/components/utils/api";
import { esquecerComputadorConfiavel, guardarComputadorConfiavel, guardarSessao, identificarTerminal, lerComputadorConfiavel } from "@/components/utils/sessaoCore";
import { ModalOutroLocal, ModalTerminais, TelaDoCodigo, TrocarSenha } from "@/components/login/TelasDeAcesso";
import { ControlesDaJanela, useMostrarLinkDoPortal } from "@/components/login/MolduraLogin";
import { FundoVivo, LetreiroVivo, VitrineViva } from "@/components/login/VitrineViva";
import { motion } from "framer-motion";
import { BOTAO_PRIMARIO, VIDRO } from "@/components/vendedores/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [senha, setSenha] = useState("");
  // Enquanto todos não recebem o acesso novo, a chave continua entrando
  const [entrarComChave, setEntrarComChave] = useState(false);
  const [limite, setLimite] = useState(null);
  const [outroLocal, setOutroLocal] = useState(null);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [aviso, setAviso] = useState("");
  const [desafio, setDesafio] = useState(null);
  const [erroDoCodigo, setErroDoCodigo] = useState("");
  // O limite de terminais aparece depois do código certo: o envio se repete com quem deve sair
  const codigoConferido = useRef(null);
  // Vale até o fim do login: o limite de terminais pode pedir mais um envio depois da confirmação
  const encerrarOutroLocal = useRef(false);

  const mostrarPortal = useMostrarLinkDoPortal();

  useEffect(() => {
    try {
      const motivo = sessionStorage.getItem("@raizan:motivo_saida");
      if (motivo) setAviso(motivo);
      sessionStorage.removeItem("@raizan:motivo_saida");
    } catch (e) {}
  }, []);

  const abrirSistema = () => { window.location.href = "/resumo"; };

  const concluirLogin = (data) => {
    setLimite(null);
    setOutroLocal(null);
    setDesafio(null);
    if (data.computador_confiavel) guardarComputadorConfiavel(email, data.computador_confiavel);
    guardarSessao(data);
    if (data.trocar_senha) setTrocandoSenha(true);
    else abrirSistema();
  };

  const entrarComSenha = async (derrubarSessao) => {
    const response = await fetch(`${getHubUrl()}/api/auth/core/entrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        senha,
        terminal: identificarTerminal(),
        derrubar_sessao: derrubarSessao,
        encerrar_outro_local: encerrarOutroLocal.current,
        computador_confiavel: lerComputadorConfiavel(email)
      })
    });
    const data = await response.json();

    if (data.dois_passos) {
      esquecerComputadorConfiavel(email);
      setErroDoCodigo("");
      setDesafio(data);
      return;
    }
    if (data.sessao_em_outro_local) {
      setOutroLocal(data);
      return;
    }
    if (data.limite_terminais) {
      setLimite(data);
      return;
    }
    if (!data.success) {
      (desafio ? setErroDoCodigo : setErrorMsg)(data.message || "Falha na autenticação.");
      return;
    }

    concluirLogin(data);
  };

  const confirmarCodigo = async ({ codigo, confiar }, derrubarSessao) => {
    setIsLoading(true);
    setErroDoCodigo("");
    try {
      const response = await fetch(`${getHubUrl()}/api/auth/core/confirmar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desafio: desafio.desafio, codigo, confiar, terminal: identificarTerminal(), derrubar_sessao: derrubarSessao, encerrar_outro_local: encerrarOutroLocal.current })
      });
      const data = await response.json();

      if (data.sessao_em_outro_local) {
        codigoConferido.current = { codigo, confiar };
        setOutroLocal(data);
      } else if (data.limite_terminais) {
        codigoConferido.current = { codigo, confiar };
        setOutroLocal(null);
        setLimite(data);
      } else if (data.success) {
        concluirLogin(data);
      } else {
        setLimite(null);
        setErroDoCodigo(data.message || "Não foi possível confirmar o código.");
      }
    } catch (err) {
      setErroDoCodigo("Erro de conexão. Tente novamente.");
    }
    setIsLoading(false);
  };

  const confirmarOutroLocal = async () => {
    encerrarOutroLocal.current = true;
    if (codigoConferido.current) return confirmarCodigo(codigoConferido.current);

    setIsLoading(true);
    try {
      await entrarComSenha();
    } catch (err) {
      setErrorMsg("Erro de conexão. Tente novamente.");
    }
    setIsLoading(false);
  };

  const fecharOutroLocal = () => {
    encerrarOutroLocal.current = false;
    codigoConferido.current = null;
    setOutroLocal(null);
  };

  const reenviarCodigo = async () => {
    setIsLoading(true);
    try {
      await entrarComSenha();
    } catch (err) {
      setErroDoCodigo("Erro de conexão. Tente novamente.");
    }
    setIsLoading(false);
  };

  const esqueciSenha = async () => {
    setErrorMsg("");
    setAviso("");
    if (!email) return setErrorMsg("Digite seu e-mail para receber o link.");
    try {
      const res = await fetch(`${getHubUrl()}/api/auth/core/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setAviso(data.message || "Confira seu e-mail.");
    } catch (err) {
      setErrorMsg("Erro de conexão.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setAviso("");

    try {
      if (!entrarComChave) {
        await entrarComSenha();
        setIsLoading(false);
        return;
      }

      // 🟢 MUDANÇA 2: Usando o getHubUrl() para bater na rota /api/auth/login do Node
      const response = await fetch(`${getHubUrl()}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }, 
        body: JSON.stringify({ email, license })
      });

      const data = await response.json();

      // 🟢 O NOSSO RAIO-X: Isso vai imprimir no F12 tudo que o servidor mandou!
      console.log("📦 PACOTE QUE CHEGOU DA API NODE:", data);

      if (!response.ok || !data.success) { // Ajustado para ler o success padrão da sua API
        setErrorMsg(data.error || data.message || "Falha na autenticação."); 
        setIsLoading(false);
        return;
      }

      // 🟢 Tudo certo, salva os dados básicos
      localStorage.setItem("@raizan:token", data.token);
      localStorage.setItem("@raizan:email", data.email || email);
      localStorage.setItem("@raizan:license", license);
      if (data.expires_at) localStorage.setItem("@raizan:expires_at", data.expires_at); 
      if (data.modulos) localStorage.setItem("@raizan:modulos", JSON.stringify(data.modulos));

      // 🟢 O Detetive de Nomes
      const nomeOficial = data.nome || 
                          data.first_name || 
                          "Administrador";
                          
      localStorage.setItem("@raizan:nome", nomeOficial);

      // 🟢 SALVANDO A LOGO NA MEMÓRIA DO NAVEGADOR
      if (data.logo_url) {
        localStorage.setItem("@raizan:logo", data.logo_url);
      } else {
        localStorage.removeItem("@raizan:logo");
      }

      // 🟢 MUDANÇA 3: A MÁGICA DO TENANT!
      // Cria o "crachá" completo que as outras telas (Configurações, Clientes) vão usar.
      const dadosDoUsuario = {
        nome: nomeOficial,
        email: data.email || email,
        tenant_id: data.tenant_id || data.cnpj // Puxa o CNPJ/Tenant da sua API
      };
      localStorage.setItem("@raizan:user", JSON.stringify(dadosDoUsuario));


      // ======================================================================
      // 🟢 O GRANDE FINAL (FASE 3): O DOWNLOAD DA URL DO TÚNEL CLOUDFLARE
      // ======================================================================
      try {
        const resConfig = await fetch(`${getHubUrl()}/api/hub/integracoes/b2b/config`, {
          headers: { "x-tenant-id": dadosDoUsuario.tenant_id }
        });
        const configData = await resConfig.json();
        
        if (configData.success && configData.url_api_local) {
          // Salva na memória para o seu arquivo api.js (getApiUrl) usar automaticamente!
          localStorage.setItem("@raizan:b2b_api_url", configData.url_api_local);
          console.log("🔥 Motor Local Dinâmico configurado com sucesso:", configData.url_api_local);
        }
      } catch (e) {
        console.error("Aviso: Não foi possível carregar a URL do Motor Local no login.");
      }
      // ======================================================================

      setIsLoading(false);
      window.location.href = "/resumo"; 
      
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao conectar no servidor central. Verifique se a API está online.");
      setIsLoading(false);
    }
  };

  const campo = "w-full h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-transparent pl-11 pr-4 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all focus:bg-white dark:focus:bg-white/[0.07] focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10";

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#f5f5f7] dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased">
      <ControlesDaJanela />

      <div className="dark:hidden"><FundoVivo claro /></div>
      <div className="hidden dark:block"><FundoVivo /></div>

      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col items-center justify-center gap-10 px-4 py-14 sm:px-8 [@media(max-height:820px)]:lg:py-8 lg:flex-row lg:justify-between lg:gap-20">

        {/* Marca e o ecossistema acontecendo */}
        <section className="w-full max-w-[500px] text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-b from-purple-500 to-indigo-600 text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.9)]">
              <span className="absolute inset-0 rounded-[14px] bg-purple-500/50 blur-md motion-safe:animate-pulse" aria-hidden="true" />
              <Database size={20} className="relative" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">Raizan Core</span>
          </motion.div>

          <div className="mt-9 hidden lg:block [@media(max-height:820px)]:mt-6">
            <VitrineViva />
          </div>

          <div className="mt-5 flex justify-center lg:hidden">
            <LetreiroVivo />
          </div>
        </section>

        {/* Formulário */}
        <motion.section
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`${VIDRO} anel-login w-full max-w-[420px] p-7 sm:p-10 backdrop-blur-2xl`}
        >
          <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Entrar</h2>
          <p className="mt-1.5 text-[15px] text-zinc-500 dark:text-zinc-400">
            {entrarComChave ? "Use o e-mail e a chave de licença da empresa." : "Use seu e-mail e senha do Raizan Core."}
          </p>

          {errorMsg && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{errorMsg}</p>
            </div>
          )}

          {aviso && <p role="status" className="mt-6 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">{aviso}</p>}

          {desafio && (
            <TelaDoCodigo
              key={desafio.desafio}
              desafio={desafio}
              erro={erroDoCodigo}
              ocupado={isLoading}
              aoConfirmar={(dados) => confirmarCodigo(dados)}
              aoReenviar={reenviarCodigo}
              aoVoltar={() => { setDesafio(null); setErroDoCodigo(""); }}
            />
          )}
          {outroLocal && <ModalOutroLocal mensagem={outroLocal.message} ocupado={isLoading} aoConfirmar={confirmarOutroLocal} aoFechar={fecharOutroLocal} />}
          {limite && (
            <ModalTerminais limite={limite} ocupado={isLoading} aoFechar={() => setLimite(null)} aoDerrubar={async (id) => {
              if (desafio) return confirmarCodigo(codigoConferido.current, id);
              setIsLoading(true);
              try { await entrarComSenha(id); } catch (err) { setErrorMsg("Erro de conexão."); }
              setIsLoading(false);
            }} />
          )}
          {trocandoSenha && <TrocarSenha senhaAtual={senha} aoConcluir={abrirSistema} />}

          <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-medium text-zinc-500 dark:text-zinc-400">E-mail</label>
              <div className="relative group">
                <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-purple-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@suaempresa.com.br"
                  autoComplete="email"
                  inputMode="email"
                  className={campo}
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-senha" className="block text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                  {entrarComChave ? "Chave de licença" : "Senha"}
                </label>
                <button type="button" onClick={esqueciSenha} hidden={entrarComChave} className="text-[13px] font-medium text-purple-600 transition-colors hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative group">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-purple-500" />
                <input
                  id="login-senha"
                  type="password"
                  value={entrarComChave ? license : senha}
                  onChange={(e) => (entrarComChave ? setLicense(e.target.value) : setSenha(e.target.value))}
                  placeholder={entrarComChave ? "••••••••••••••••" : "Sua senha"}
                  autoComplete={entrarComChave ? "off" : "current-password"}
                  className={`${campo} ${entrarComChave ? "font-mono tracking-widest" : ""}`}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={`${BOTAO_PRIMARIO} botao-brilho mt-3 !h-12 w-full text-[15px]`}>
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Entrar <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <button type="button" onClick={() => { setEntrarComChave(!entrarComChave); setErrorMsg(""); setAviso(""); }} className="mt-5 w-full text-center text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200">
            {entrarComChave ? "Entrar com e-mail e senha" : "Ainda não recebi meu acesso: entrar com a chave"}
          </button>

          {mostrarPortal && (
            <div className="mt-7 border-t border-black/[0.06] pt-5 text-center dark:border-white/[0.07]">
              <a href="/login-b2b" className="text-[13px] font-medium text-zinc-400 transition-colors hover:text-purple-600 dark:hover:text-purple-400">
                É cliente? Acessar o portal de compras &rarr;
              </a>
            </div>
          )}

          <p className="mt-7 flex items-center justify-center gap-2 text-[12px] text-zinc-500">
            <ShieldCheck size={14} className="text-emerald-500" /> Ambiente seguro e monitorado
          </p>
        </motion.section>

      </main>
    </div>
  );
}
