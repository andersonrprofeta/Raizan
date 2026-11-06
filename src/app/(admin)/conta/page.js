"use client";

import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getApiUrl, getTenantId } from "@/components/utils/api";
import { lerUsuario, renovarSessao, temPermissao } from "@/components/utils/sessaoCore";
import GestaoUsuarios from "@/components/usuarios/GestaoUsuarios";
import { Segmentado } from "@/components/vendedores/ui";
import {
  ShieldCheck, LogOut, CheckCircle2, Store,
  Eye, EyeOff, Lock, RefreshCw, AlertTriangle,
  ImagePlus, Loader2, Building2, Users
} from "lucide-react";
import toast from 'react-hot-toast';
import { VIDRO, BOTAO_VIDRO, SELO, LuzesDeFundo } from "@/components/checkout/estilos";

const TAMANHO_MAXIMO_LOGO_MB = 10;
const TIPOS_DE_LOGO = ['image/png', 'image/jpeg', 'image/webp'];
const ABAS_DA_CONTA = [
  { id: "empresa", rotulo: "Empresa", icone: Building2 },
  { id: "usuarios", rotulo: "Usuários e Permissões", icone: Users },
];
const SELO_BASE =  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border";

export default function MinhaConta() {
  const [isClient, setIsClient] = useState(false); // 🟢 TRAVA CONTRA "PISCAR"
  const [aba, setAba] = useState("empresa");

  const [dadosLicenca, setDadosLicenca] = useState({
    nome: "Carregando...",
    email: "",
    licenca: "",
    vencimento: "",
    modulos: [],
    logoUrl: null 
  });
  
  const [mostrarChave, setMostrarChave] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState("...");
  const [sincronizando, setSincronizando] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [previa, setPrevia] = useState(null);
  
  const fileInputRef = useRef(null); 

  const [modulosDoSistema, setModulosDoSistema] = useState([]);
  const [carregandoModulos, setCarregandoModulos] = useState(true);
  const [modalRevogar, setModalRevogar] = useState(false);

  const carregarModulosDaAPI = async () => {
    try {
      const res = await fetch("https://api.raizan.com.br/api/admin/modulos");
      const data = await res.json();
      
      if (data.success) {
        const modulosFiltrados = data.modulos.filter((m) => m.slug !== 'dashboard' && m.slug !== 'inicio');
        setModulosDoSistema(modulosFiltrados);
      }
    } catch (error) {
      console.error("Erro ao puxar módulos:", error);
    } finally {
      setCarregandoModulos(false);
    }
  };

  const carregarDadosDaMemoria = () => {
    // 🟢 SEGURANÇA MÁXIMA DA TELA: Se não tem licença, expulsa pro login imediatamente
    const licenca = localStorage.getItem("@raizan:license");
    if (!licenca) {
        window.location.href = "/login";
        return;
    }

    const nomeLocal = localStorage.getItem("@raizan:nome") || "Cliente Raizan";
    const email = localStorage.getItem("@raizan:email") || "email@nao-encontrado.com";
    const vencimento = localStorage.getItem("@raizan:expires_at");
    const modulosRaw = localStorage.getItem("@raizan:modulos");
    const logoUrl = localStorage.getItem("@raizan:logo"); 
    
    let modulos = [];
    try { modulos = modulosRaw ? JSON.parse(modulosRaw) : []; } catch(e) {}

    setDadosLicenca({ 
        nome: nomeLocal, 
        email, 
        licenca, 
        vencimento, 
        modulos, 
        logoUrl: logoUrl !== "null" ? logoUrl : null 
    });

    if (vencimento && vencimento !== "undefined" && vencimento !== "null" && vencimento.trim() !== "") {
      try {
        let ano, mes, dia;
        
        if (vencimento.includes('/')) {
          const p = vencimento.split('/');
          dia = parseInt(p[0]); mes = parseInt(p[1]) - 1; ano = parseInt(p[2]);
        } else if (vencimento.includes('-')) {
          const p = vencimento.split('T')[0].split('-');
          ano = parseInt(p[0]); mes = parseInt(p[1]) - 1; dia = parseInt(p[2]);
        } else {
          const limpo = vencimento.replace(/\D/g, '');
          ano = parseInt(limpo.substring(0, 4)); mes = parseInt(limpo.substring(4, 6)) - 1; dia = parseInt(limpo.substring(6, 8));
          if (ano > 2100) { ano = parseInt(limpo.substring(4, 8)); mes = parseInt(limpo.substring(2, 4)) - 1; dia = parseInt(limpo.substring(0, 2)); }
        }

        const dataVenc = new Date(ano, mes, dia, 23, 59, 59);
        const hoje = new Date();
        const diferencaTempo = dataVenc.getTime() - hoje.getTime();
        const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
        
        setDiasRestantes(dias > 0 ? dias : "Expirada");
      } catch (e) { setDiasRestantes("Erro de Leitura"); }
    } else {
      setDiasRestantes("Vitalícia");
    }
  };

  useEffect(() => {
    carregarDadosDaMemoria();
    carregarModulosDaAPI(); 
    setIsClient(true); // 🟢 Libera a renderização da tela após tudo ser lido do cache
  }, []);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      if (lerUsuario()) {
        const { ok } = await renovarSessao();
        if (ok) {
          carregarDadosDaMemoria();
          toast.success("Licença sincronizada com sucesso!");
        } else {
          toast.error("Sessão expirada. Entre novamente.");
        }
        return;
      }

      const email = localStorage.getItem("@raizan:email");
      const license = localStorage.getItem("@raizan:license");
      
      const res = await fetch(`https://api.raizan.com.br/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, license })
      });
      
      const json = await res.json();
      
      if (json.sucesso || json.success) {
        localStorage.setItem("@raizan:expires_at", json.expires_at || "");
        localStorage.setItem("@raizan:modulos", JSON.stringify(json.modulos || []));
        if (json.token) localStorage.setItem("@raizan:token", json.token);
        if (json.logo_url) localStorage.setItem("@raizan:logo", json.logo_url);
        else localStorage.removeItem("@raizan:logo");
        
        carregarDadosDaMemoria();
        toast.success("Licença sincronizada com sucesso!");
      } else {
        toast.error("Erro ao sincronizar: " + (json.error || json.message || "Tente novamente."));
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor de licenças.");
    } finally {
      setTimeout(() => setSincronizando(false), 500);
    }
  };

  const enviarLogo = async (file) => {
    if (!file) return;

    if (!TIPOS_DE_LOGO.includes(file.type)) {
      toast.error("Use uma imagem PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > TAMANHO_MAXIMO_LOGO_MB * 1024 * 1024) {
      toast.error(`A imagem precisa ter até ${TAMANHO_MAXIMO_LOGO_MB} MB.`);
      return;
    }

    const urlDaPrevia = URL.createObjectURL(file);
    setPrevia(urlDaPrevia);
    setFazendoUpload(true);
    
    try {
      const tenantId = getTenantId();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://api.raizan.com.br/api/hub/upload/logo", {
        method: "POST",
        headers: { "x-tenant-id": tenantId, Authorization: `Bearer ${localStorage.getItem("@raizan:token")}` },
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("@raizan:logo", data.url);
        setDadosLicenca(prev => ({ ...prev, logoUrl: data.url }));
        toast.success("Logo atualizada com sucesso!");
        
        window.dispatchEvent(new Event('storage')); 
      } else {
        toast.error(data.message || "Falha ao enviar a imagem.");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro de conexão ao enviar a imagem.");
    } finally {
      setFazendoUpload(false);
      setPrevia(null);
      URL.revokeObjectURL(urlDaPrevia);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmarRevogarLicenca = () => {
    setModalRevogar(false);
    toast.loading("Limpando dados do terminal...");
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "/login";
    }, 1500);
  };

  const temModuloLiberado = (slug) => {
    if (diasRestantes === "Expirada" || diasRestantes === "Data Inválida" || diasRestantes === "Erro de Leitura") {
      return false; 
    }
    const arrayModulos = dadosLicenca.modulos || [];
    return arrayModulos.includes(slug);
  };

  if (!isClient) {
    // 🟢 Evita que a tela pisque enquanto lê as informações do Cache
    return <div className="h-screen bg-[#f5f5f7] dark:bg-black"></div>;
  }

  const logoExibida = previa || dadosLicenca.logoUrl;
  const podeGerirUsuarios = temPermissao("usuarios");

  const expirada = diasRestantes === "Expirada";
  const temPrazo = typeof diasRestantes === "number";

  return (
    <div className="relative flex h-screen bg-[#f5f5f7] dark:bg-black text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans antialiased transition-colors duration-300">
      <LuzesDeFundo />
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-24">
          <div className="max-w-5xl mx-auto space-y-6">

            <div>
              <h1 className="text-[28px] font-bold tracking-tight">Minha Conta</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Identidade da empresa, licença e módulos do Raizan Core.</p>
            </div>

            {podeGerirUsuarios && <Segmentado opcoes={ABAS_DA_CONTA} valor={aba} onChange={setAba} />}

            {aba === "usuarios" && podeGerirUsuarios && <GestaoUsuarios />}

            {aba === "empresa" && (<>
            {/* IDENTIDADE */}
            <section className={`${VIDRO} p-6 sm:p-8`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Logo da empresa</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Aparece no Raizan Core e no Portal B2B dos seus clientes.</p>
                </div>
                <span className={`${SELO_BASE} ${SELO.emerald} self-start`}>
                  <ShieldCheck size={13} /> Sistema autenticado
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <button
                  type="button"
                  disabled={fazendoUpload}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
                  onDragLeave={() => setArrastando(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastando(false);
                    enviarLogo(e.dataTransfer.files[0]);
                  }}
                  className={`min-h-[188px] rounded-[22px] border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-all duration-300 disabled:cursor-wait ${
                    arrastando
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-black/10 dark:border-white/15 hover:border-purple-400 hover:bg-purple-500/[0.04]"
                  }`}
                >
                  {fazendoUpload ? (
                    <>
                      <Loader2 size={26} className="text-purple-600 dark:text-purple-400 animate-spin mb-3" />
                      <span className="text-sm font-semibold">Enviando a logo...</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Isso leva só alguns segundos</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={26} className="text-purple-600 dark:text-purple-400 mb-3" />
                      <span className="text-sm font-semibold">{logoExibida ? "Trocar logo" : "Enviar logo"}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Arraste a imagem aqui ou clique para escolher</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-3">PNG, JPG ou WEBP, até {TAMANHO_MAXIMO_LOGO_MB} MB. PNG com fundo transparente fica melhor.</span>
                    </>
                  )}
                </button>

                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => enviarLogo(e.target.files[0])}
                />

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { nome: "Tema claro", fundo: "bg-white border-black/[0.08]", rotulo: "text-zinc-500", icone: "text-zinc-300" },
                    { nome: "Tema escuro", fundo: "bg-[#0c0c0e] border-white/10", rotulo: "text-zinc-400", icone: "text-zinc-700" },
                  ].map((tema) => (
                    <div key={tema.nome} className={`rounded-[22px] border ${tema.fundo} p-4 flex flex-col`}>
                      <span className={`text-[11px] font-medium ${tema.rotulo}`}>{tema.nome}</span>
                      <div className="flex-1 min-h-[120px] flex items-center justify-center">
                        {logoExibida
                          ? <img src={logoExibida} alt={`Logo no ${tema.nome.toLowerCase()}`} className="max-h-16 max-w-full object-contain" />
                          : <Store size={36} className={tema.icone} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* LICENÇA */}
              <section className={`${VIDRO} p-6 sm:p-8 lg:col-span-3`}>
                <h2 className="text-lg font-semibold tracking-tight mb-5">Licença</h2>

                <div className="flex items-end justify-between gap-4 mb-6">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold truncate">{dadosLicenca.nome}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{dadosLicenca.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[28px] leading-none font-bold tracking-tight ${expirada ? "text-rose-600 dark:text-rose-400" : ""}`}>{diasRestantes}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{temPrazo ? "dias restantes" : expirada ? "renove para continuar" : "validade"}</p>
                  </div>
                </div>

                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">Chave de licença</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl px-4 py-3 font-mono text-sm truncate">
                    {mostrarChave ? dadosLicenca.licenca : "••••••••••••••••••••••••"}
                  </div>
                  <button
                    onClick={() => setMostrarChave(!mostrarChave)}
                    aria-label={mostrarChave ? "Esconder chave" : "Mostrar chave"}
                    className={`${BOTAO_VIDRO} w-11 h-11 shrink-0`}
                  >
                    {mostrarChave ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <button
                  onClick={handleSincronizar}
                  disabled={sincronizando}
                  className={`${BOTAO_VIDRO} w-full mt-5 py-2.5 text-sm disabled:opacity-50`}
                >
                  <RefreshCw size={15} className={sincronizando ? "animate-spin" : ""} />
                  {sincronizando ? "Sincronizando..." : "Sincronizar permissões"}
                </button>
              </section>

              {/* ENCERRAR */}
              <section className={`${VIDRO} p-6 sm:p-8 lg:col-span-2 flex flex-col`}>
                <h2 className="text-lg font-semibold tracking-tight mb-2">Este computador</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
                  Revogar remove a licença deste terminal, que perde o acesso na hora. Sua conta e seus dados continuam na nuvem.
                </p>
                <button
                  onClick={() => setModalRevogar(true)}
                  className="mt-5 w-full py-2.5 rounded-full text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  <LogOut size={15} /> Revogar acesso
                </button>
              </section>
            </div>

            {/* MÓDULOS */}
            <section className={`${VIDRO} p-6 sm:p-8`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold tracking-tight">Módulos</h2>
                {!carregandoModulos && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {modulosDoSistema.filter((m) => temModuloLiberado(m.slug)).length} de {modulosDoSistema.length} ativos
                  </span>
                )}
              </div>

              {carregandoModulos ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Carregando módulos">
                  {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modulosDoSistema.map((modulo) => {
                    const temModulo = temModuloLiberado(modulo.slug);
                    return (
                      <div
                        key={modulo.id || modulo.slug}
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {temModulo
                            ? <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            : <Lock size={17} className="text-zinc-400 dark:text-zinc-600 shrink-0" />}
                          <span className={`text-sm font-medium truncate ${temModulo ? "" : "text-zinc-500"}`}>{modulo.nome}</span>
                        </div>
                        {!temModulo && (
                          <button className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 shrink-0 transition-colors">
                            Upgrade
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {modalRevogar && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
                <div className={`${VIDRO} !bg-white/95 dark:!bg-[#1c1c1e]/95 w-full max-w-sm p-7 text-center`}>
                  <div className="w-14 h-14 mx-auto bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={26} />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight mb-2">Revogar acesso?</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    A licença será apagada deste computador, que será desconectado na hora.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setModalRevogar(false)} className={`${BOTAO_VIDRO} flex-1 py-2.5 text-sm`}>
                      Cancelar
                    </button>
                    <button
                      onClick={confirmarRevogarLicenca}
                      className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all duration-300 active:scale-95"
                    >
                      Revogar
                    </button>
                  </div>
                </div>
              </div>
            )}
            </>)}

          </div>
        </main>
      </div>
    </div>
  );
}
