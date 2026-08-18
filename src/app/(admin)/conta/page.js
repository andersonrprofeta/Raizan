"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getApiUrl } from "@/components/utils/api";
import { 
  ShieldCheck, Key, LogOut, CheckCircle2, Store, 
  Eye, EyeOff, XOctagon, Lock, RefreshCw, AlertTriangle
} from "lucide-react";
import toast from 'react-hot-toast';

export default function MinhaConta() {
  const [dadosLicenca, setDadosLicenca] = useState({
    nome: "Carregando...",
    email: "",
    licenca: "",
    vencimento: "",
    modulos: []
  });
  
  const [mostrarChave, setMostrarChave] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState("...");
  const [sincronizando, setSincronizando] = useState(false);

  // 🟢 NOVO: ESTADOS PARA MÓDULOS DINÂMICOS E MODAL
  const [modulosDoSistema, setModulosDoSistema] = useState([]);
  const [carregandoModulos, setCarregandoModulos] = useState(true);
  const [modalRevogar, setModalRevogar] = useState(false);

  // 🟢 NOVO: BUSCA OS MÓDULOS DIRETO DO BANCO DE DADOS
  const carregarModulosDaAPI = async () => {
    try {
      // Como essa rota é pública para leitura ou usa o token do admin, puxamos direto
      const res = await fetch("https://api.raizan.com.br/api/admin/modulos");
      const data = await res.json();
      
      if (data.success) {
        // Remove a Dashboard da lista, pois ela é padrão e não deve ser bloqueada
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
    const nomeLocal = localStorage.getItem("@raizan:nome") || "Cliente Raizan";
    const email = localStorage.getItem("@raizan:email") || "email@nao-encontrado.com";
    const licenca = localStorage.getItem("@raizan:license") || "---";
    const vencimento = localStorage.getItem("@raizan:expires_at");
    const modulosRaw = localStorage.getItem("@raizan:modulos");
    
    let modulos = [];
    try { modulos = modulosRaw ? JSON.parse(modulosRaw) : []; } catch(e) {}

    setDadosLicenca({ nome: nomeLocal, email, licenca, vencimento, modulos });

    // Lógica da data
    if (vencimento && vencimento !== "undefined" && vencimento !== "null" && vencimento.trim() !== "") {
      try {
        let ano, mes, dia;
        
        if (vencimento.includes('/')) {
          const p = vencimento.split('/');
          dia = parseInt(p[0]); 
          mes = parseInt(p[1]) - 1; 
          ano = parseInt(p[2]);
        } 
        else if (vencimento.includes('-')) {
          const p = vencimento.split('T')[0].split('-');
          ano = parseInt(p[0]); 
          mes = parseInt(p[1]) - 1; 
          dia = parseInt(p[2]);
        } 
        else {
          const limpo = vencimento.replace(/\D/g, '');
          ano = parseInt(limpo.substring(0, 4));
          mes = parseInt(limpo.substring(4, 6)) - 1;
          dia = parseInt(limpo.substring(6, 8));
          
          if (ano > 2100) {
             ano = parseInt(limpo.substring(4, 8));
             mes = parseInt(limpo.substring(2, 4)) - 1;
             dia = parseInt(limpo.substring(0, 2));
          }
        }

        const dataVenc = new Date(ano, mes, dia, 23, 59, 59);
        const hoje = new Date();
        const diferencaTempo = dataVenc.getTime() - hoje.getTime();
        const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
        
        setDiasRestantes(dias > 0 ? dias : "Expirada");
      } catch (e) {
        setDiasRestantes("Erro de Leitura");
      }
    } else {
      setDiasRestantes("Vitalícia");
    }
  };

  useEffect(() => {
    carregarDadosDaMemoria();
    carregarModulosDaAPI(); // Chama os módulos ao abrir a tela
  }, []);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      const email = localStorage.getItem("@raizan:email");
      const license = localStorage.getItem("@raizan:license");
      
      // 🟢 CORREÇÃO AQUI: Atirando na API Central, não na local do Hub!
      const res = await fetch(`https://api.raizan.com.br/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, license })
      });
      
      const json = await res.json();
      
      if (json.sucesso || json.success) {
        localStorage.setItem("@raizan:expires_at", json.expires_at || "");
        localStorage.setItem("@raizan:modulos", JSON.stringify(json.modulos || []));
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

  // 🟢 NOVO: AÇÃO DO MODAL DE REVOGAR
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

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-24">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Detalhes da Assinatura</h1>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Gerencie os dados da sua empresa e o status da sua licença do Raizan Core.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-1 space-y-6">
                
                {/* CARD PERFIL */}
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm dark:shadow-none transition-colors">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30 dark:shadow-purple-900/20 mb-4 ring-4 ring-white dark:ring-zinc-950 transition-all">
                    <Store size={40} className="text-white" />
                  </div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 transition-colors">{dadosLicenca.nome}</h2>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 transition-colors">{dadosLicenca.email}</p>
                  
                  <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 mb-6 transition-colors shadow-sm dark:shadow-none">
                    <ShieldCheck size={14} /> Sistema Autenticado
                  </span>

                  <button 
                    onClick={handleSincronizar}
                    disabled={sincronizando}
                    className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700/50 shadow-sm dark:shadow-none active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={sincronizando ? "animate-spin text-purple-600 dark:text-purple-400" : ""} /> 
                    {sincronizando ? "Sincronizando..." : "Sincronizar Permissões"}
                  </button>
                </div>

                {/* CARD ZONA DE PERIGO */}
                <div className="bg-rose-50 dark:bg-red-500/5 border border-rose-200 dark:border-red-500/20 rounded-3xl p-6 shadow-sm dark:shadow-none transition-colors">
                  <h3 className="text-rose-700 dark:text-red-400 font-black flex items-center gap-2 mb-2 transition-colors">
                    <XOctagon size={18} /> Zona de Perigo
                  </h3>
                  <p className="text-xs font-medium text-rose-600/80 dark:text-zinc-500 mb-4 transition-colors">
                    Ao revogar a licença, este terminal perderá imediatamente o acesso.
                  </p>
                  <button 
                    onClick={() => setModalRevogar(true)} // 🟢 ABRE O MODAL NOVO!
                    className="w-full py-2.5 bg-white dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 text-rose-700 dark:text-red-400 border border-rose-200 dark:border-red-500/30 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm dark:shadow-none active:scale-95"
                  >
                    <LogOut size={16} /> Revogar Acesso
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                
                {/* CARD CHAVE DE LICENÇA */}
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none transition-colors">
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2 transition-colors">
                    <Key size={20} className="text-purple-600 dark:text-purple-400 transition-colors" /> Chave de Licença
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 transition-colors">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest transition-colors">Validade da Assinatura</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-lg font-black transition-colors ${diasRestantes === "Expirada" ? "text-rose-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {diasRestantes === "Expirada" ? "Expirada" : "Ativa"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-zinc-900 dark:text-zinc-200 transition-colors">{diasRestantes}</span>
                        {diasRestantes !== "Vitalícia" && diasRestantes !== "Data Inválida" && (
                          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-500 ml-1 transition-colors">dias restantes</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2 block transition-colors">Sua Chave Criptografada</label>
                      <div className="flex items-center shadow-sm dark:shadow-none rounded-xl">
                        <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-l-xl px-5 py-3.5 font-mono text-sm font-bold text-zinc-700 dark:text-zinc-300 overflow-hidden transition-colors">
                          {mostrarChave ? dadosLicenca.licenca : "••••••••••••••••••••••••••••••"}
                        </div>
                        <button 
                          onClick={() => setMostrarChave(!mostrarChave)}
                          className="px-5 py-3.5 bg-zinc-100 dark:bg-zinc-800 border-y border-r border-zinc-200 dark:border-zinc-800/80 rounded-r-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                          {mostrarChave ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD ECOSSISTEMA DINÂMICO */}
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none transition-colors">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 transition-colors">
                      <CheckCircle2 size={20} className="text-indigo-600 dark:text-indigo-400 transition-colors" /> Ecossistema Raizan
                    </h2>
                  </div>
                  
                  {carregandoModulos ? (
                    <div className="text-center py-6 text-zinc-500 animate-pulse">
                      Carregando módulos do sistema...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {modulosDoSistema.map((modulo) => {
                        const temModulo = temModuloLiberado(modulo.slug);
                        
                        return (
                          <div 
                            key={modulo.id || modulo.slug} 
                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                              temModulo 
                                ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none" 
                                : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/50 opacity-80 dark:opacity-70" 
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {temModulo ? (
                                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-500 shrink-0 transition-colors" />
                              ) : (
                                <Lock size={18} className="text-zinc-400 dark:text-zinc-600 shrink-0 transition-colors" />
                              )}
                              <span className={`text-sm font-bold truncate max-w-[150px] sm:max-w-[170px] transition-colors ${temModulo ? "text-emerald-900 dark:text-emerald-100" : "text-zinc-500 dark:text-zinc-500"}`}>
                                {modulo.nome}
                              </span>
                            </div>
                            
                            {!temModulo && (
                              <button className="text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-600/40 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0">
                                Upgrade
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                </div>

              </div>
            </div>

            {/* 🟢 MODAL DE REVOGAR LICENÇA FEITO DO ZERO */}
            {modalRevogar && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-500" />
                  
                  <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <AlertTriangle size={36} strokeWidth={2.5} />
                  </div>
                  
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">Revogar Acesso?</h2>
                  
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed px-2">
                    Você está prestes a apagar a licença deste terminal. 
                    <strong className="text-zinc-800 dark:text-zinc-200 block mt-2">O sistema será desconectado imediatamente.</strong>
                  </p>

                  <div className="flex gap-3 w-full justify-center">
                    <button 
                      onClick={() => setModalRevogar(false)} 
                      className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={confirmarRevogarLicenca} 
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-rose-500/20"
                    >
                      Sim, Revogar
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}