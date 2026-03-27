"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getApiUrl } from "@/components/utils/api";
import { ShieldCheck, Key, LogOut, CheckCircle2, Store, CreditCard, Eye, EyeOff, XOctagon, Lock, RefreshCw } from "lucide-react";

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

  // A SUA NOVA LISTA REAL DE MÓDULOS 🚀
  const TODOS_MODULOS = [
    { id: "dashboard", nome: "Dashboard (Início)" },
    { id: "produtos", nome: "Gestão de produtos no ERP" },
    { id: "pedidos", nome: "Gestão de Pedidos no Woo" },
    { id: "shopee", nome: "Gestão de Pedidos na Shopee" },
    { id: "mercado-livre", nome: "Gestão de Pedidos no Mercado Livre" },
    { id: "magalu", nome: "Gestão de Pedidos na Magalu" },
    { id: "clientes", nome: "Gestão de Clientes Woo/ERP" },
    { id: "crm", nome: "Gestão de CRM" },
    { id: "relatorios", nome: "Controle de relatórios" },
    //{ id: "estoque", nome: "Controle de entradas e saídas" },
    { id: "pdv", nome: "Ponto de venda" },
    { id: "nfe", nome: "Emissão de Notas" },
    { id: "website", nome: "Site Institucional"},
    { id: "loja", nome: "E-commerce"},
    { id: "catalogo", nome: "Catalogo Virtual"},
    { id: "ads", nome: "Meta Business Metrics"},
    { id: "whatsapp", nome: "Bot de atendimento"},
    { id: "host", nome: "Hospedagem de site"},
    { id: "sistema", nome: "Atualização online"},
    { id: "configuracoes", nome: "Gestão do sistema" }
  ];

  const carregarDadosDaMemoria = () => {
    const nomeLocal = localStorage.getItem("@raizan:nome") || "Cliente Raizan";
    const email = localStorage.getItem("@raizan:email") || "email@nao-encontrado.com";
    const licenca = localStorage.getItem("@raizan:license") || "---";
    const vencimento = localStorage.getItem("@raizan:expires_at");
    const modulosRaw = localStorage.getItem("@raizan:modulos");
    
    let modulos = [];
    try { modulos = modulosRaw ? JSON.parse(modulosRaw) : []; } catch(e) {}

    setDadosLicenca({ nome: nomeLocal, email, licenca, vencimento, modulos });

    // A MÁGICA SUPREMA ANTI-BUG DA DATA (Agora à prova de milênios 🧙‍♂️)
    if (vencimento && vencimento !== "undefined" && vencimento !== "null" && vencimento.trim() !== "") {
      try {
        let ano, mes, dia;
        
        // 1. Se vier formato Brasileiro (ex: 31/03/2027)
        if (vencimento.includes('/')) {
          const p = vencimento.split('/');
          dia = parseInt(p[0]); 
          mes = parseInt(p[1]) - 1; // Mês no JS começa no 0
          ano = parseInt(p[2]);
        } 
        // 2. Se vier formato Americano/ISO (ex: 2027-03-31)
        else if (vencimento.includes('-')) {
          const p = vencimento.split('T')[0].split('-');
          ano = parseInt(p[0]); 
          mes = parseInt(p[1]) - 1; 
          dia = parseInt(p[2]);
        } 
        // 3. Se vier cru do banco de dados (ex: 20270331 ou 31032027)
        else {
          const limpo = vencimento.replace(/\D/g, '');
          ano = parseInt(limpo.substring(0, 4));
          mes = parseInt(limpo.substring(4, 6)) - 1;
          dia = parseInt(limpo.substring(6, 8));
          
          // Trava de segurança: Se o ano deu 3103, é porque inverteu (DDMMAAAA)
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
  }, []);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      const email = localStorage.getItem("@raizan:email");
      const license = localStorage.getItem("@raizan:license");
      
      const res = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, license })
      });
      
      const json = await res.json();
      
      if (json.sucesso) {
        localStorage.setItem("@raizan:expires_at", json.expires_at || "");
        localStorage.setItem("@raizan:modulos", JSON.stringify(json.modulos || []));
        carregarDadosDaMemoria();
      } else {
        alert("Erro ao sincronizar: " + (json.error || "Tente novamente."));
      }
    } catch (error) {
      alert("Erro de conexão com o servidor de licenças.");
    } finally {
      setTimeout(() => setSincronizando(false), 500);
    }
  };

  const handleRevogarLicenca = () => {
    const confirmar = window.confirm("ATENÇÃO: Você está prestes a revogar sua licença. Deseja continuar?");
    if (confirmar) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  // FUNÇÃO BLINDADA: Só libera se tiver o módulo E a licença estiver em dia!
  const temModuloLiberado = (modulo) => {
    // Se a licença expirou, deu erro ou é inválida, tranca tudo imediatamente!
    if (diasRestantes === "Expirada" || diasRestantes === "Data Inválida" || diasRestantes === "Erro de Leitura") {
      return false; 
    }
    
    const arrayModulos = dadosLicenca.modulos || [];
    return arrayModulos.includes(modulo.id) || arrayModulos.includes(modulo.nome);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-24">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Detalhes da Assinatura</h1>
              <p className="text-sm text-zinc-400 mt-1">Gerencie os dados da sua empresa e o status da sua licença do Raizan Core.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-1 space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-900/20 mb-4 ring-4 ring-zinc-950">
                    <Store size={40} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-100">{dadosLicenca.nome}</h2>
                  <p className="text-sm text-zinc-400 mb-4">{dadosLicenca.email}</p>
                  
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 mb-6">
                    <ShieldCheck size={14} /> Sistema Autenticado
                  </span>

                  <button 
                    onClick={handleSincronizar}
                    disabled={sincronizando}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-zinc-700/50"
                  >
                    <RefreshCw size={14} className={sincronizando ? "animate-spin text-purple-400" : ""} /> 
                    {sincronizando ? "Sincronizando..." : "Sincronizar Permissões"}
                  </button>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                  <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-2">
                    <XOctagon size={18} /> Zona de Perigo
                  </h3>
                  <p className="text-xs text-zinc-500 mb-4">
                    Ao revogar a licença, este terminal perderá imediatamente o acesso.
                  </p>
                  <button 
                    onClick={handleRevogarLicenca}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} /> Revogar Acesso
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-zinc-100 mb-6 flex items-center gap-2">
                    <Key size={18} className="text-purple-400" /> Chave de Licença
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Validade da Assinatura</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-lg font-medium ${diasRestantes === "Expirada" ? "text-red-400" : "text-emerald-400"}`}>
                            {diasRestantes === "Expirada" ? "Expirada" : "Ativa"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-zinc-200">{diasRestantes}</span>
                        {diasRestantes !== "Vitalícia" && diasRestantes !== "Data Inválida" && (
                          <span className="text-sm text-zinc-500 ml-1">dias restantes</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Sua Chave Criptografada</label>
                      <div className="flex items-center">
                        <div className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-l-xl px-4 py-3 font-mono text-sm text-zinc-300 overflow-hidden">
                          {mostrarChave ? dadosLicenca.licenca : "••••••••••••••••••••••••••••••"}
                        </div>
                        <button 
                          onClick={() => setMostrarChave(!mostrarChave)}
                          className="px-4 py-3 bg-zinc-800 border-y border-r border-zinc-800/80 rounded-r-xl text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                          {mostrarChave ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-indigo-400" /> Ecossistema Raizan
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TODOS_MODULOS.map((modulo) => {
                      const temModulo = temModuloLiberado(modulo);
                      
                      return (
                        <div 
                          key={modulo.id} 
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                            temModulo 
                              ? "bg-emerald-500/5 border-emerald-500/20" 
                              : "bg-zinc-950/50 border-zinc-800/50 opacity-70" 
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {temModulo ? (
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            ) : (
                              <Lock size={16} className="text-zinc-600 shrink-0" />
                            )}
                            <span className={`text-sm font-medium truncate max-w-[150px] sm:max-w-[180px] ${temModulo ? "text-emerald-100" : "text-zinc-500"}`}>
                              {modulo.nome}
                            </span>
                          </div>
                          
                          {!temModulo && (
                            <button className="text-[10px] font-bold uppercase tracking-wider bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 px-2 py-1 rounded-md transition-colors flex items-center gap-1 shrink-0">
                              Upgrade
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}