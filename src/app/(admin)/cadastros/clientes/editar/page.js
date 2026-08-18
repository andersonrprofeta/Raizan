"use client";

import { useState, useEffect, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  UserPen, ArrowLeft, Save, Building2, User as UserIcon,
  Mail, Phone, CreditCard, MapPin, Loader2, Database, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from 'react-hot-toast';

function FormularioEdicao() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idCliente = searchParams.get("id");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [origemERP, setOrigemERP] = useState(null); // Guarda se veio do Omie/Oracle

  // 🟢 DADOS COMPLETOS (INCLUINDO METADADOS E VENDEDOR)
  const [formData, setFormData] = useState({
    tipo_pessoa: 'fisica', nome: '', email: '', telefone: '', cpf_cnpj: '', inscricao_estadual: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
    codigo_vendedor: '', nome_vendedor: '', codigo_erp: '',
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

  useEffect(() => {
    if (idCliente) carregarCliente();
    else { toast.error("ID não encontrado"); router.push('/cadastros/clientes'); }
  }, [idCliente]);

  const carregarCliente = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      toast.error("Sessão expirada. Faça login novamente.");
      return router.push('/login');
    }

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/clientes/${idCliente}`, {
        headers: { "x-tenant-id": tenantId }
      });
      const data = await res.json();
      
      if (data.success && data.cliente) {
        const c = data.cliente;
        setOrigemERP(c.origem || 'manual');

        let end = {};
        let meta = {};
        try { end = typeof c.endereco_json === 'string' ? JSON.parse(c.endereco_json) : (c.endereco_json || {}); } catch(e){}
        try { meta = typeof c.metadata_json === 'string' ? JSON.parse(c.metadata_json) : (c.metadata_json || {}); } catch(e){}

        // 🟢 Inteligência de PF/PJ pelo número do documento
        const documentoLimpo = c.cpf_cnpj ? String(c.cpf_cnpj).replace(/\D/g, '') : '';
        const tipoCerto = (c.tipo_pessoa === 'juridica' || documentoLimpo.length > 11) ? 'juridica' : 'fisica';

        setFormData({
          tipo_pessoa: tipoCerto,
          nome: c.nome || '',
          email: c.email || '',
          telefone: c.telefone || '',
          cpf_cnpj: c.cpf_cnpj || '',
          inscricao_estadual: c.inscricao_estadual || '', 
          codigo_erp: c.codigo_erp || '',
          codigo_vendedor: c.codigo_vendedor || '',
          nome_vendedor: c.nome_vendedor || '',
          cep: end.cep || '',
          logradouro: end.logradouro || '',
          numero: end.numero || '',
          complemento: end.complemento || '',
          bairro: end.bairro || '',
          cidade: end.cidade || '',
          uf: end.uf || '',
          metadata: {
            limite_credito: meta.limite_credito || 0,
            condicao_pagamento_padrao: meta.condicao_pagamento_padrao || '',
            bloqueado: meta.bloqueado || false
          }
        });
      } else {
        toast.error("Cliente não encontrado.");
        router.push('/cadastros/clientes');
      }
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Trata mudanças dentro do Metadata (Limite, etc)
  const handleMetadataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [name]: type === 'checkbox' ? checked : value
      }
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
        setFormData(prev => ({ ...prev, logradouro: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', uf: data.uf || '' }));
        toast.success("Endereço preenchido!");
      } else toast.error("CEP não encontrado.");
    } catch (error) { console.error(error); } finally { setBuscandoCep(false); }
  };

  const handleCepChange = (e) => {
    let value = e.target.value;
    setFormData(prev => ({ ...prev, cep: value }));
    if (value.replace(/\D/g, '').length === 8) buscarCep(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tenantId = pegarCnpjLogado();
    if (!tenantId) return toast.error("Sessão expirada. Faça login novamente.");

    setLoading(true);

    const payload = {
      nome: formData.nome, 
      email: formData.email, 
      telefone: formData.telefone,
      cpf_cnpj: formData.cpf_cnpj, 
      inscricao_estadual: formData.inscricao_estadual, 
      tipo_pessoa: formData.tipo_pessoa,
      codigo_vendedor: formData.codigo_vendedor,
      nome_vendedor: formData.nome_vendedor,
      codigo_erp: formData.codigo_erp, // Importante mandar de volta
      metadata_json: JSON.stringify(formData.metadata), // Envia a caixa de metadata atualizada
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
      const res = await fetch(`https://api.raizan.com.br/api/hub/clientes/${idCliente}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId }, 
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Cadastro atualizado!");
        router.push(`/cadastros/clientes/detalhes?id=${idCliente}`); 
      } else {
        toast.error(data.message || "Erro ao salvar.");
      }
    } catch (error) { 
      toast.error("Falha de conexão."); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loadingInitial) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={40} className="text-emerald-500 animate-spin" /></div>;
  }

  const veioDoERP = origemERP && (origemERP.includes('omie') || origemERP.includes('oracle'));

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm text-zinc-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPen className="text-emerald-500" size={24} /> Editar Cliente
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">Atualizando os dados de {formData.nome}</p>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* DADOS CADASTRAIS (O que todo mundo mexe) */}
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
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{formData.tipo_pessoa === 'fisica' ? 'Nome Completo *' : 'Razão Social *'}</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><CreditCard size={14} /> {formData.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}</label>
                <input type="text" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
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
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Phone size={14} /> Telefone / WhatsApp</label>
                <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Mail size={14} /> E-mail *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>

          {/* DADOS DO ERP E VENDEDOR (SEI LÁ, SE DEIXAR VAZAR COMISSÃO DÁ BRIGA) */}
          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
              <Database size={20} className="text-blue-500" /> Dados Comerciais (ERP)
            </h2>
            
            {veioDoERP && (
              <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                <p>Este cliente foi importado do <b>{origemERP}</b>. Campos como Limite de Crédito e Bloqueio devem ser alterados preferencialmente direto no sistema emissor.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Código ERP</label>
                <input type="text" value={formData.codigo_erp} readOnly disabled className="w-full p-3 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none cursor-not-allowed" />
              </div>

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
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Cliente Bloqueado para Vendas</span>
                </label>
              </div>

            </div>
          </div>

          {/* DADOS DE ENDEREÇO */}
          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
              <MapPin size={20} className="text-emerald-500" /> Endereço de Entrega
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">CEP {buscandoCep && <Loader2 size={12} className="animate-spin text-emerald-500" />}</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleCepChange} maxLength={9} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Logradouro (Rua/Av)</label>
                <input type="text" name="logradouro" value={formData.logradouro} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Número</label>
                <input type="text" name="numero" value={formData.numero} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Complemento</label>
                <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500" />
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
                <input type="text" name="uf" value={formData.uf} onChange={handleChange} maxLength={2} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 uppercase" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function EditarClienteHub() {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 size={40} className="text-emerald-500 animate-spin" /></div>}>
          <FormularioEdicao />
        </Suspense>
      </div>
    </div>
  );
}