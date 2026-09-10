"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { User, MapPin, Phone, Lock, Save, Loader2, Building2, Search, AlertCircle, Edit2, CheckCircle2 } from "lucide-react";
import { getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

export default function MeuPerfilB2B() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  
  // 🟢 ESTADO: O Lacre!
  const [isLocked, setIsLocked] = useState(false);

  // Estados do Formulário
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("raizan_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      const buscarNoBanco = async () => {
        try {
          const customHeaders = getHeaders();
          if (parsedUser.tenant_id) customHeaders["x-tenant-id"] = parsedUser.tenant_id;
          
          const res = await fetch(`${getHubUrl()}/api/hub/clientes/b2b-perfil?cnpj=${parsedUser.cnpj}`, { headers: customHeaders });
          const data = await res.json();
          
          if (data.success) {
            if (data.telefone) setTelefone(data.telefone);
            
            if (data.endereco && data.endereco.cep) {
              setCep(data.endereco.cep || "");
              setLogradouro(data.endereco.logradouro || "");
              setNumero(data.endereco.numero || "");
              setComplemento(data.endereco.complemento || "");
              setBairro(data.endereco.bairro || "");
              
              // ========================================================
              // 🟢 A MÁGICA DA LIMPEZA DE ERP (Ex: Goiânia (GO) -> Goiânia | GO)
              // ========================================================
              let cidadeSuja = data.endereco.cidade || "";
              let ufReal = data.endereco.estado || data.endereco.uf || "";

              // Detecta se a string termina com a sigla do estado entre parênteses, traço ou barra
              const ufRegex = /[-(/]\s*([a-zA-Z]{2})\s*[)]?$/;
              const match = cidadeSuja.match(ufRegex);

              if (match) {
                // Se não tinha UF definida ainda, rouba a sigla que achou na cidade
                if (!ufReal) ufReal = match[1].toUpperCase();
                // Limpa a cidade arrancando a sigla dela
                cidadeSuja = cidadeSuja.replace(ufRegex, '').trim();
              }

              setCidade(cidadeSuja);
              setEstado(ufReal.toUpperCase());
              // ========================================================

              const userAtualizado = { ...parsedUser, telefone: data.telefone, endereco: data.endereco };
              localStorage.setItem("raizan_user", JSON.stringify(userAtualizado));
              setUser(userAtualizado);
              
              // Se achou o endereço perfeitinho no banco, tranca o formulário!
              setIsLocked(true);
            }
          }
        } catch(e) {}
      };
      buscarNoBanco();

    } else {
      window.location.href = "/login-b2b";
    }
  }, []);

  const buscarCep = async (valorCep) => {
    const cepLimpo = valorCep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
      } else {
        setLogradouro(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
        setEstado(data.uf.toUpperCase());
        toast.success("Endereço preenchido automaticamente!");
        document.getElementById('input_numero').focus(); 
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP.");
    }
    setBuscandoCep(false);
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setCep(value);
    if (value.replace('-', '').length === 8) {
      buscarCep(value);
    }
  };

  const handleTelefoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    setTelefone(value);
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    if (!cep || !logradouro || !numero || !cidade || !estado || !telefone) {
      toast.error("Preencha todos os campos obrigatórios (*)");
      return;
    }

    setLoading(true);
    
    const payload = {
      nome: user.nome,
      email: user.email,
      cpf_cnpj: user.cnpj,
      telefone: telefone,
      endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado }
    };

    try {
      const response = await fetch(`${getHubUrl()}/api/hub/clientes/b2b-atualizar`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Perfil atualizado e sincronizado na Nuvem!");
        
        const userAtualizado = { ...user, telefone: telefone, endereco: payload.endereco };
        localStorage.setItem("raizan_user", JSON.stringify(userAtualizado));
        setUser(userAtualizado);
        
        setIsLocked(true);
      } else {
        toast.error(data.message || "Erro ao salvar perfil na Nuvem.");
      }
    } catch (error) {
      toast.error("Erro de comunicação com a Nuvem.");
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] transition-colors duration-300 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative h-screen">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          
          {/* EFEITO GLOW RAIZAN (APPLE STYLE) */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 relative z-10 pb-20">
            
            {/* HEADER DO PERFIL */}
            <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex items-center gap-5 transition-colors duration-300">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner shrink-0">
                <User size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Meu Perfil de Empresa</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Mantenha seus dados de entrega e contato atualizados para faturamento.</p>
              </div>
            </div>

            <form onSubmit={handleSalvarPerfil} className="space-y-6 sm:space-y-8">
              
              {/* BLOCO 1: DADOS FISCAIS DO ERP (BLOQUEADOS) */}
              <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/60 shadow-sm space-y-5 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-zinc-200 dark:bg-zinc-800 rounded-full blur-[80px] opacity-40 pointer-events-none" />
                
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-4 uppercase tracking-wider">
                  <Building2 size={16} className="text-zinc-400" /> Dados Fiscais Oficiais 
                  <span className="ml-auto text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded-md font-bold uppercase flex items-center gap-1">
                    <Lock size={10}/> Importado do ERP
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 block">Razão Social / Nome</label>
                    <input type="text" value={user.nome} disabled className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 px-4 py-3.5 rounded-2xl text-sm cursor-not-allowed font-medium shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 block">CNPJ / CPF</label>
                    <input type="text" value={user.cnpj} disabled className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 px-4 py-3.5 rounded-2xl text-sm cursor-not-allowed font-medium font-mono shadow-inner" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 block">E-mail Principal</label>
                    <input type="email" value={user.email} disabled className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 px-4 py-3.5 rounded-2xl text-sm cursor-not-allowed font-medium shadow-inner" />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5 mt-2 font-medium">
                  <AlertCircle size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
                  Para alterar os dados fiscais da sua empresa, por favor, entre em contato com o suporte ou seu representante comercial.
                </p>
              </div>

              {/* BLOCO 2: DADOS EDITÁVEIS (NUVEM) - O LACRE INTELIGENTE */}
              <div className={`bg-white/90 dark:bg-[#121214]/90 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border transition-all duration-500 shadow-sm relative overflow-hidden ${isLocked ? 'border-zinc-200 dark:border-zinc-800/60 opacity-95' : 'border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.1)] ring-4 ring-purple-500/10'} space-y-5`}>
                
                {/* CABEÇALHO COM O BOTÃO EDITAR E O LACRE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
                    <MapPin size={16} className={isLocked ? "text-zinc-400" : "text-purple-500"} /> 
                    Endereço de Entrega e Contato
                  </h3>

                  {isLocked ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-md font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-100 dark:border-emerald-500/20">
                        <CheckCircle2 size={12} /> Salvo e Validado
                      </span>
                      <button type="button" onClick={() => setIsLocked(false)} className="text-[10px] uppercase tracking-wider flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 transition-colors">
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1.5 rounded-md font-black uppercase tracking-widest flex items-center gap-1 border border-purple-100 dark:border-purple-500/20 animate-pulse">
                      Modo Edição
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">Celular / WhatsApp *</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="tel" disabled={isLocked} placeholder="(00) 00000-0000" value={telefone} onChange={handleTelefoneChange} maxLength={15} required className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">CEP *</label>
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="text" disabled={isLocked} placeholder="00000-000" value={cep} onChange={handleCepChange} maxLength={9} required className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 pl-12 pr-10 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all font-mono" />
                      {buscandoCep && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 animate-spin" />}
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">Endereço (Rua/Av) *</label>
                    <input type="text" disabled={isLocked} value={logradouro} onChange={e => setLogradouro(e.target.value)} required placeholder="Ex: Av. Paulista" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">Número *</label>
                    <input id="input_numero" type="text" disabled={isLocked} value={numero} onChange={e => setNumero(e.target.value)} required placeholder="Ex: 1000" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">Complemento</label>
                    <input type="text" disabled={isLocked} value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Ex: Galpão B, Sala 12" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">Bairro *</label>
                    <input type="text" disabled={isLocked} value={bairro} onChange={e => setBairro(e.target.value)} required placeholder="Ex: Centro" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">Cidade *</label>
                    <input type="text" disabled={isLocked} value={cidade} onChange={e => setCidade(e.target.value)} required className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 block">UF *</label>
                    <input type="text" disabled={isLocked} value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} required className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 disabled:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-zinc-900 dark:text-zinc-100 px-5 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all uppercase" />
                  </div>
                </div>

                {/* 🟢 O BOTÃO DE SALVAR SOME SE ESTIVER LACRADO */}
                {!isLocked && (
                  <div className="flex justify-end pt-5 animate-in fade-in slide-in-from-top-2">
                    <button type="submit" disabled={loading} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-2xl font-black shadow-[0_10px_30px_rgba(147,51,234,0.25)] transition-all flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-wider">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Salvar Endereço
                    </button>
                  </div>
                )}
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}