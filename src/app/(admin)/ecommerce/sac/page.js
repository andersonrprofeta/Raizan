"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Save, 
  Headset, 
  MapPin, 
  FileText, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Loader2,
  Phone,
  MessageCircle,
  Mail,
  Store,
  MonitorPlay,
  CheckCircle2
} from "lucide-react";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";

export default function SACEcommercePage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  
  // Controle de qual política está sendo editada no momento
  const [activePolicy, setActivePolicy] = useState("privacidade");

  // Estado central do SAC e Políticas
  const [content, setContent] = useState({
    contacts: {
      whatsapp: "(62) 99999-9999",
      televendas: "0800 123 4567",
      sac: "(62) 3333-3333",
      emailAtendimento: "atendimento@raizan.com.br",
      emailSuporte: "suporte@raizan.com.br",
      horario: "Segunda a Sexta, das 08h às 18h."
    },
    address: {
      enablePickup: true,
      cep: "74000-000",
      street: "Rua Luziânia",
      number: "47",
      complement: "Sala 101",
      neighborhood: "Aparecida",
      city: "Goiânia",
      state: "GO",
      infoPickup: "A retirada só é permitida após a confirmação do pagamento via e-mail. Apresente documento original com foto."
    },
    policies: {
      atendimento: "Nosso compromisso é com a sua satisfação. O Serviço de Atendimento ao Cliente (SAC) da Raizan Store está disponível para tirar dúvidas, receber sugestões e auxiliar em suas compras. Nosso prazo máximo de resposta é de até 48 horas úteis.",
      frete: "Nossas entregas são realizadas por transportadoras parceiras e Correios. O prazo e valor do frete variam de acordo com o CEP de destino e peso do pedido. Oferecemos frete grátis em campanhas específicas e para a modalidade de Retirada na Loja.",
      cookies: "Utilizamos cookies para personalizar anúncios e melhorar a sua experiência no site. Ao continuar navegando, você concorda com a nossa Política de Cookies. Você pode gerenciar suas preferências nas configurações do seu navegador.",
      privacidade: "A Raizan Store valoriza a sua privacidade. Coletamos apenas os dados necessários para o processamento do seu pedido e melhoria da sua navegação. Suas informações financeiras são criptografadas e não são armazenadas em nossos servidores.",
      devolucao: "Você tem até 7 (sete) dias corridos após o recebimento do produto para solicitar a devolução por arrependimento, conforme o Código de Defesa do Consumidor. Para trocas por defeito, o prazo é de 30 dias. O produto deve retornar na embalagem original, sem indícios de uso."
    },
    faq: [
      { id: 1, question: "Como rastreio meu pedido?", answer: "Acesse a área 'Meus Pedidos' em sua conta. Lá você encontrará o código de rastreio e o link da transportadora." },
      { id: 2, question: "Quais são as formas de pagamento?", answer: "Aceitamos PIX (com aprovação imediata), Cartões de Crédito em até 12x e Boleto Bancário." }
    ]
  });

  // 🔥 TENANT DINÂMICO BLINDADO
  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      const userLogado = storedUser ? JSON.parse(storedUser) : {};
      const cabecalhosPadrao = getHeaders();
      return userLogado.tenant_id || cabecalhosPadrao["x-tenant-id"] || process.env.NEXT_PUBLIC_TENANT_ID || "";
    }
    return "";
  };

  useEffect(() => {
    buscarConteudoAtual();
  }, []);

  // 🟢 BUSCAR DADOS REAIS DO BANCO
  const buscarConteudoAtual = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      toast.error("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/ecommerce/config?tenant=${tenantId}`, {
        headers: { ...getHeaders(), "x-tenant-id": tenantId }
      });
      const data = await res.json();
      
      if (data.success && data.config?.sac) {
        setContent(prev => ({ ...prev, ...data.config.sac }));
      }
    } catch (error) {
      toast.error("Erro ao carregar informações de SAC atuais.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 SALVAR NA NUVEM
  const salvarConteudo = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) return toast.error("Sessão expirada.");

    setSalvando(true);
    const toastId = toast.loading("Salvando informações de SAC e Políticas...");

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/ecommerce/config/sac`, {
        method: "POST",
        headers: { 
          ...getHeaders(),
          "Content-Type": "application/json",
          "x-tenant-id": tenantId 
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          sac: content
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Informações atualizadas com sucesso!", { id: toastId });
      } else {
        toast.error("Falha ao salvar informações.", { id: toastId });
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.", { id: toastId });
    } finally {
      setSalvando(false);
    }
  };

  // Funções do FAQ
  const addFaq = () => {
    const newFaq = [...content.faq, { id: Date.now(), question: "Nova Pergunta?", answer: "Resposta da pergunta..." }];
    setContent({ ...content, faq: newFaq });
  };

  const removeFaq = (id) => {
    const newFaq = content.faq.filter(f => f.id !== id);
    setContent({ ...content, faq: newFaq });
  };

  const updateFaq = (id, field, value) => {
    const newFaq = content.faq.map(f => f.id === id ? { ...f, [field]: value } : f);
    setContent({ ...content, faq: newFaq });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* CABEÇALHO DA PÁGINA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
               <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <Headset size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">SAC & Políticas</h1>
                  <p className="text-sm text-zinc-500">Gerencie canais de atendimento, endereço físico e textos legais.</p>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button onClick={salvarConteudo} disabled={salvando} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* MENU LATERAL DE ABAS */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm flex flex-col gap-1 sticky top-6">
                  <button onClick={() => setActiveTab("contacts")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "contacts" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <Headset size={18} /> Canais de Contato
                  </button>
                  <button onClick={() => setActiveTab("address")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "address" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <MapPin size={18} /> Endereço Físico (Retirada)
                  </button>
                  <button onClick={() => setActiveTab("policies")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "policies" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <FileText size={18} /> Textos e Políticas
                  </button>
                  <button onClick={() => setActiveTab("faq")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === "faq" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                    <HelpCircle size={18} /> Dúvidas Frequentes (FAQ)
                  </button>
                </div>
              </div>

              {/* ÁREA DE CONFIGURAÇÃO (CENTRO/DIREITA) */}
              <div className="lg:col-span-9 xl:col-span-6">
                
                {/* ABA: CONTATOS */}
                {activeTab === "contacts" && (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full" /> Canais de Atendimento
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><MessageCircle size={14}/> WhatsApp</label>
                        <input type="text" value={content.contacts.whatsapp} onChange={(e) => setContent({...content, contacts: {...content.contacts, whatsapp: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Phone size={14}/> SAC (Fixo)</label>
                        <input type="text" value={content.contacts.sac} onChange={(e) => setContent({...content, contacts: {...content.contacts, sac: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Phone size={14}/> Televendas</label>
                        <input type="text" value={content.contacts.televendas} onChange={(e) => setContent({...content, contacts: {...content.contacts, televendas: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm focus:border-blue-500 transition-colors" />
                      </div>
                      <div className="md:col-span-2 border-t border-zinc-100 dark:border-zinc-800 pt-6 mt-2">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Mail size={14}/> E-mail de Atendimento</label>
                        <input type="email" value={content.contacts.emailAtendimento} onChange={(e) => setContent({...content, contacts: {...content.contacts, emailAtendimento: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Mail size={14}/> E-mail de Suporte Técnico</label>
                        <input type="email" value={content.contacts.emailSuporte} onChange={(e) => setContent({...content, contacts: {...content.contacts, emailSuporte: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm focus:border-blue-500 transition-colors" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Horário de Funcionamento</label>
                        <input type="text" value={content.contacts.horario} onChange={(e) => setContent({...content, contacts: {...content.contacts, horario: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm focus:border-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: ENDEREÇO DA LOJA */}
                {activeTab === "address" && (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full" /> Loja Física / Matriz
                      </h2>
                      <label className="flex items-center gap-3 cursor-pointer bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Permitir Retirada na Loja</span>
                        <input type="checkbox" checked={content.address.enablePickup} onChange={(e) => setContent({...content, address: {...content.address, enablePickup: e.target.checked}})} className="w-4 h-4 accent-emerald-600" />
                      </label>
                    </div>

                    <div className="grid md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">CEP</label>
                        <input type="text" value={content.address.cep} onChange={(e) => setContent({...content, address: {...content.address, cep: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-8">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Rua / Avenida</label>
                        <input type="text" value={content.address.street} onChange={(e) => setContent({...content, address: {...content.address, street: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Número</label>
                        <input type="text" value={content.address.number} onChange={(e) => setContent({...content, address: {...content.address, number: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-9">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Complemento</label>
                        <input type="text" value={content.address.complement} onChange={(e) => setContent({...content, address: {...content.address, complement: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Bairro</label>
                        <input type="text" value={content.address.neighborhood} onChange={(e) => setContent({...content, address: {...content.address, neighborhood: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Cidade</label>
                        <input type="text" value={content.address.city} onChange={(e) => setContent({...content, address: {...content.address, city: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">UF</label>
                        <input type="text" value={content.address.state} onChange={(e) => setContent({...content, address: {...content.address, state: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 h-12 outline-none text-sm uppercase" maxLength={2} />
                      </div>
                    </div>

                    {content.address.enablePickup && (
                      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                         <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Aviso para Retirada na Loja</label>
                         <textarea rows="2" value={content.address.infoPickup} onChange={(e) => setContent({...content, address: {...content.address, infoPickup: e.target.value}})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 outline-none text-sm resize-none" placeholder="Ex: Aguarde o e-mail confirmando que o produto está separado..." />
                      </div>
                    )}
                  </div>
                )}

                {/* ABA: POLÍTICAS E TERMOS */}
                {activeTab === "policies" && (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-purple-600 rounded-full" /> Textos das Políticas
                    </h2>

                    {/* Sub-abas de Políticas */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                      {["privacidade", "devolucao", "frete", "cookies", "atendimento"].map((policyKey) => (
                        <button 
                          key={policyKey}
                          onClick={() => setActivePolicy(policyKey)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activePolicy === policyKey ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-transparent'}`}
                        >
                          {policyKey}
                        </button>
                      ))}
                    </div>

                    <div>
                       <label className="block text-[11px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">Editando: Política de {activePolicy.charAt(0).toUpperCase() + activePolicy.slice(1)}</label>
                       {/* Textarea padrão (Pode ser substituído por um TinyMCE/Quill futuramente se quiser Rich Text) */}
                       <textarea 
                         rows="12" 
                         value={content.policies[activePolicy]} 
                         onChange={(e) => setContent({...content, policies: {...content.policies, [activePolicy]: e.target.value}})} 
                         className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 outline-none text-sm leading-relaxed resize-y focus:border-purple-500 transition-colors" 
                         placeholder="Digite o texto da política aqui..."
                       />
                       <p className="text-[10px] text-zinc-400 mt-2">Dica: Separe os parágrafos pulando linhas. Estes textos aparecerão nas páginas de rodapé correspondentes.</p>
                    </div>
                  </div>
                )}

                {/* ABA: DÚVIDAS FREQUENTES (FAQ) */}
                {activeTab === "faq" && (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-2 h-6 bg-orange-500 rounded-full" /> Dúvidas Frequentes (FAQ)
                      </h2>
                      <button onClick={addFaq} className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-4 py-2 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={14} /> Adicionar Pergunta
                      </button>
                    </div>

                    <div className="space-y-4">
                      {content.faq.map((item, index) => (
                        <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 relative group">
                           <div className="absolute top-4 right-4">
                            <button onClick={() => removeFaq(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                           </div>
                           
                           <div className="pr-8 space-y-3">
                             <div>
                               <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Pergunta {index + 1}</label>
                               <input type="text" value={item.question} onChange={(e) => updateFaq(item.id, "question", e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 h-10 outline-none text-sm font-bold" />
                             </div>
                             <div>
                               <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Resposta</label>
                               <textarea rows="2" value={item.answer} onChange={(e) => updateFaq(item.id, "answer", e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 outline-none text-sm resize-none" />
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE PREVIEW (DIREITA) */}
              <div className="hidden xl:block xl:col-span-3">
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sticky top-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center justify-center gap-2">
                    <MonitorPlay size={14} className="text-blue-500" /> Resumo do SAC
                  </h3>

                  {/* Mockup visual dos canais */}
                  <div className="space-y-4">
                    
                    {/* Card de Contato */}
                    <div className="bg-[#f0fdf4] dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                        <MessageCircle size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Atendimento WhatsApp</span>
                      </div>
                      <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{content.contacts.whatsapp || "Não informado"}</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                        <Phone size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Televendas</span>
                      </div>
                      <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{content.contacts.televendas || "Não informado"}</p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                        <Store size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Loja Física</span>
                      </div>
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {content.address.street}, {content.address.number}<br/>
                        {content.address.neighborhood} - {content.address.city}/{content.address.state}<br/>
                        CEP: {content.address.cep}
                      </p>
                      {content.address.enablePickup && (
                        <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                          <CheckCircle2 size={12} /> Retirada Liberada
                        </div>
                      )}
                    </div>

                    <div className="text-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                       <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Horário de Funcionamento</p>
                       <p className="text-xs text-zinc-600 dark:text-zinc-300">{content.contacts.horario || "Não informado"}</p>
                    </div>

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