"use client";

import { useEffect, useRef, useState } from "react";
import { Database, Lock, Mail, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react"; 
// 🟢 MUDANÇA 1: Trocamos getApiUrl por getHubUrl para bater no Node.js
import { getHubUrl, getHeaders } from "@/components/utils/api";
import { esquecerComputadorConfiavel, guardarComputadorConfiavel, guardarSessao, identificarTerminal, lerComputadorConfiavel } from "@/components/utils/sessaoCore";
import { ModalOutroLocal, ModalTerminais, TelaDoCodigo, TrocarSenha } from "@/components/login/TelasDeAcesso";

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

          {aviso && <p role="status" className="mb-6 text-sm font-medium text-emerald-700 dark:text-emerald-400">{aviso}</p>}

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
                  {entrarComChave ? "Chave de Licença" : "Senha"}
                </label>
                <button type="button" onClick={esqueciSenha} hidden={entrarComChave} className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors uppercase tracking-widest">
                  Esqueceu?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                  <Lock size={18} className="text-zinc-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={entrarComChave ? license : senha}
                  onChange={(e) => (entrarComChave ? setLicense(e.target.value) : setSenha(e.target.value))}
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

          <button type="button" onClick={() => { setEntrarComChave(!entrarComChave); setErrorMsg(""); setAviso(""); }} className="mt-5 w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            {entrarComChave ? "Entrar com e-mail e senha" : "Ainda não recebi meu acesso: entrar com a chave"}
          </button>

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