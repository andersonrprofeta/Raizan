"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  UserPlus, ArrowLeft, Save, Building2, User as UserIcon,
  Mail, Phone, CreditCard, MapPin, Loader2, Database,
  DollarSign, FileText
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

export default function NovoClienteHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  // 🟢 ESTADO INICIAL COMPLETO (INCLUINDO METADADOS COMERCIAIS)
  const [formData, setFormData] = useState({
    tipo_pessoa: 'fisica',
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    inscricao_estadual: '', 
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    codigo_vendedor: '',
    nome_vendedor: '',
    metadata: {
      limite_credito: 0,
      condicao_pagamento_padrao: '',
      bloqueado: false
    }
  });

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        return JSON.parse(storedUser).tenant_id;
      }
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 🟢 INTELIGÊNCIA: Se for CNPJ/CPF, já muda o tipo de pessoa automaticamente!
    if (name === 'cpf_cnpj') {
      const docLimpo = value.replace(/\D/g, '');
      const novoTipoPessoa = docLimpo.length > 11 ? 'juridica' : 'fisica';
      setFormData(prev => ({ ...prev, [name]: value, tipo_pessoa: novoTipoPessoa }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMetadataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [name]: type === 'checkbox' ? checked : value }
    }));
  };

  const buscarCep = async (cepBuscado) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || ''
        }));
        toast.success("Endereço preenchido!");
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value;
    setFormData(prev => ({ ...prev, cep: value }));
    if (value.replace(/\D/g, '').length === 8) {
      buscarCep(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) {
      return toast.error("Nome e E-mail são obrigatórios!");
    }

    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      return toast.error("Erro: Empresa não identificada. Faça login novamente.");
    }

    setLoading(true);

    const payload = {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      cpf_cnpj: formData.cpf_cnpj,
      inscricao_estadual: formData.inscricao_estadual, 
      tipo_pessoa: formData.tipo_pessoa,
      origem: 'manual', 
      codigo_vendedor: formData.codigo_vendedor,
      nome_vendedor: formData.nome_vendedor,
      metadata_json: JSON.stringify(formData.metadata), // 🟢 ENVIA OS DADOS DE CRÉDITO
      endereco: {
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf
      }
    };

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/clientes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Cliente cadastrado com sucesso!");
        router.push("/cadastros/clientes"); 
      } else {
        toast.error(data.message || "Erro ao salvar cliente.");
      }
    } catch (error) {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/cadastros/clientes">
                  <button className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm text-zinc-500">
                    <ArrowLeft size={20} />
                  </button>
                </Link>
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <UserPlus className="text-emerald-500" size={24} /> Novo Cliente
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Cadastre manualmente um novo contato na sua base.</p>
                </div>
              </div>

              <button 
                onClick={handleSubmit} disabled={loading}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? "Salvando..." : "Salvar Cliente"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* BLOCO 1: DADOS CADASTRAIS */}
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                  <UserIcon size={20} className="text-emerald-500" /> Informações Principais
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de Pessoa</label>
                    <div className="flex gap-4">
                      <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${formData.tipo_pessoa === 'fisica' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                        <input type="radio" name="tipo_pessoa" value="fisica" checked={formData.tipo_pessoa === 'fisica'} onChange={handleChange} className="hidden" />
                        <UserIcon size={18} /> Pessoa Física
                      </label>
                      <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${formData.tipo_pessoa === 'juridica' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                        <input type="radio" name="tipo_pessoa" value="juridica" checked={formData.tipo_pessoa === 'juridica'} onChange={handleChange} className="hidden" />
                        <Building2 size={18} /> Pessoa Jurídica
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {formData.tipo_pessoa === 'fisica' ? 'Nome Completo *' : 'Razão Social *'}
                    </label>
                    <input 
                      type="text" name="nome" value={formData.nome} onChange={handleChange} required
                      placeholder={formData.tipo_pessoa === 'fisica' ? "Ex: João da Silva" : "Ex: Empresa Tech LTDA"}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <CreditCard size={14} /> {formData.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                    </label>
                    <input 
                      type="text" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange}
                      placeholder={formData.tipo_pessoa === 'fisica' ? "000.000.000-00" : "00.000.000/0000-00"}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Building2 size={14} /> Inscrição Estadual (IE)
                    </label>
                    <input 
                      type="text" name="inscricao_estadual" value={formData.inscricao_estadual} onChange={handleChange}
                      placeholder={formData.tipo_pessoa === 'fisica' ? "ISENTO" : "Ex: 123.456.789.000"}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Phone size={14} /> Telefone / WhatsApp
                    </label>
                    <input 
                      type="text" name="telefone" value={formData.telefone} onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Mail size={14} /> E-mail *
                    </label>
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleChange} required
                      placeholder="cliente@email.com"
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO 2: DADOS COMERCIAIS */}
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                  <Database size={20} className="text-blue-500" /> Dados Comerciais (Opcional)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cód. Vendedor</label>
                    <input type="text" name="codigo_vendedor" value={formData.codigo_vendedor} onChange={handleChange} placeholder="Ex: 102" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome Vendedor</label>
                    <input type="text" name="nome_vendedor" value={formData.nome_vendedor} onChange={handleChange} placeholder="Ex: Carlos Oliveira" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Condição Padrão</label>
                    <input type="text" name="condicao_pagamento_padrao" value={formData.metadata.condicao_pagamento_padrao} onChange={handleMetadataChange} placeholder="Ex: 30_60_90" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Limite de Crédito</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">R$</span>
                      <input type="number" step="0.01" name="limite_credito" value={formData.metadata.limite_credito} onChange={handleMetadataChange} className="w-full p-3 pl-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <div className="space-y-2 flex flex-col justify-end pb-2">
                    <label className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      <input 
                        type="checkbox" name="bloqueado" 
                        checked={formData.metadata.bloqueado} 
                        onChange={handleMetadataChange} 
                        className="w-5 h-5 text-rose-600 rounded border-zinc-300 focus:ring-rose-500 dark:bg-zinc-800 dark:border-zinc-600"
                      />
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Bloqueado para Vendas</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* BLOCO 3: ENDEREÇO */}
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                  <MapPin size={20} className="text-emerald-500" /> Endereço de Entrega
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      CEP {buscandoCep && <Loader2 size={12} className="animate-spin text-emerald-500" />}
                    </label>
                    <input 
                      type="text" name="cep" value={formData.cep} onChange={handleCepChange} maxLength={9}
                      placeholder="00000-000"
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Logradouro (Rua/Av)</label>
                    <input type="text" name="logradouro" value={formData.logradouro} onChange={handleChange} placeholder="Ex: Avenida Paulista" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Número</label>
                    <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ex: 1000" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Complemento</label>
                    <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apto, Sala, Bloco..." className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bairro</label>
                    <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cidade</label>
                    <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">UF</label>
                    <input type="text" name="uf" value={formData.uf} onChange={handleChange} maxLength={2} placeholder="SP" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 uppercase" />
                  </div>
                </div>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}