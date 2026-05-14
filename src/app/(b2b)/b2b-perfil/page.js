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
  
  // 🟢 NOVO ESTADO: O Lacre!
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
              setCidade(data.endereco.cidade || "");
              setEstado(data.endereco.estado || "");

              const userAtualizado = { ...parsedUser, telefone: data.telefone, endereco: data.endereco };
              localStorage.setItem("raizan_user", JSON.stringify(userAtualizado));
              setUser(userAtualizado);
              
              // 🟢 Se achou o endereço no banco, tranca o formulário!
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
        setEstado(data.uf);
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
        
        // 🟢 Fecha o Lacre após salvar com sucesso!
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
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <User size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Meu Perfil de Empresa</h1>
                <p className="text-sm text-zinc-500">Mantenha seus dados de entrega e contato atualizados para faturamento.</p>
              </div>
            </div>

            <form onSubmit={handleSalvarPerfil} className="space-y-6">
              
              {/* BLOCO 1: DADOS FISCAIS DO ERP (BLOQUEADOS) */}
              <div className="bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-200 dark:bg-zinc-800 rounded-full blur-[60px] opacity-50 pointer-events-none" />
                
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Building2 size={18} className="text-zinc-500" /> Dados Fiscais Oficiais <span className="ml-auto text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded-md font-mono flex items-center gap-1"><Lock size={10}/> Importado do ERP</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Razão Social / Nome</label>
                    <input type="text" value={user.nome} disabled className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CNPJ</label>
                    <input type="text" value={user.cnpj} disabled className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed font-medium font-mono" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">E-mail Principal</label>
                    <input type="email" value={user.email} disabled className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed font-medium" />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 flex items-start gap-1 mt-2">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  Para alterar os dados fiscais acima, por favor entre em contato com o suporte ou seu representante comercial.
                </p>
              </div>

              {/* BLOCO 2: DADOS EDITÁVEIS (NUVEM) */}
              <div className={`bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border transition-all duration-500 shadow-sm ${isLocked ? 'border-zinc-200 dark:border-zinc-800/60 opacity-90' : 'border-emerald-500/30 shadow-emerald-500/5 ring-4 ring-emerald-500/10'} space-y-4`}>
                
                {/* 🟢 CABEÇALHO COM O BOTÃO EDITAR E O LACRE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <MapPin size={18} className={isLocked ? "text-zinc-500" : "text-emerald-500"} /> 
                    Endereço de Entrega e Contato
                  </h3>

                  {isLocked ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> Salvo e Validado
                      </span>
                      <button type="button" onClick={() => setIsLocked(false)} className="text-xs flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 transition-colors">
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                      Modo Edição
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Celular / WhatsApp *</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="tel" disabled={isLocked} placeholder="(00) 00000-0000" value={telefone} onChange={handleTelefoneChange} maxLength={15} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">CEP *</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="text" disabled={isLocked} placeholder="00000-000" value={cep} onChange={handleCepChange} maxLength={9} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all font-mono" />
                      {buscandoCep && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />}
                    </div>
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Endereço (Rua/Av) *</label>
                    <input type="text" disabled={isLocked} value={logradouro} onChange={e => setLogradouro(e.target.value)} required placeholder="Ex: Av. Paulista" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Número *</label>
                    <input id="input_numero" type="text" disabled={isLocked} value={numero} onChange={e => setNumero(e.target.value)} required placeholder="Ex: 1000" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Complemento</label>
                    <input type="text" disabled={isLocked} value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Ex: Galpão B, Sala 12" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Bairro *</label>
                    <input type="text" disabled={isLocked} value={bairro} onChange={e => setBairro(e.target.value)} required placeholder="Ex: Centro" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Cidade *</label>
                    <input type="text" disabled={isLocked} value={cidade} onChange={e => setCidade(e.target.value)} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">UF *</label>
                    <input type="text" disabled={isLocked} value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 disabled:border-transparent disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-xl text-sm outline-none transition-all uppercase" />
                  </div>
                </div>
              </div>

              {/* 🟢 O BOTÃO DE SALVAR SOME SE ESTIVER LACRADO */}
              {!isLocked && (
                <div className="flex justify-end pt-4 animate-in fade-in slide-in-from-top-2">
                  <button type="submit" disabled={loading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Salvar Dados do Perfil
                  </button>
                </div>
              )}

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}