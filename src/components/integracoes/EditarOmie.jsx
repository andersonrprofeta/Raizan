"use client";

import { useState, useEffect } from "react";
// 🟢 Adicionados Loader2 e CreditCard para o Seletor de Contas!
import { Database, RefreshCw, ShoppingCart, Users, Receipt, Briefcase, Clock, Save, X, Zap, Loader2, CreditCard } from "lucide-react";
import toast from 'react-hot-toast';

export default function EditarOmie({ integracao, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  // 🟢 NOVO ESTADO: Guarda a "foto" do tempo original salvo no banco
  const [originalInterval, setOriginalInterval] = useState(20);

  // 🟢 ESTADOS DA CONTA CORRENTE
  const [contasOmie, setContasOmie] = useState([]);
  const [carregandoContas, setCarregandoContas] = useState(false);

  const [form, setForm] = useState({
    id: integracao?.id,
    nome_integracao: integracao?.nome_integracao || "Omie ERP",
    tenant_id: "", 
    app_key: "",
    app_secret: "",
    sync_interval_min: 20,
    sync_clientes: true,
    sync_pedidos: true,
    sync_produtos: true,
    sync_financeiro: false,
    sync_vendedores: true,
    auto_enviar_pedidos: false, 
    conta_padrao: "", // 🟢 AQUI ESTÁ A VARIÁVEL DA CONTA
  });

  useEffect(() => {
    let cnpjAtual = integracao?.tenant_id || "";
    
    if (!cnpjAtual && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        cnpjAtual = JSON.parse(storedUser).tenant_id;
      }
    }

    let configParsed = {};
    if (integracao) {
      try {
        configParsed = typeof integracao.config === 'string' 
          ? JSON.parse(integracao.config) 
          : (integracao.config || {});
      } catch(e) { console.error("Erro ao ler config", e); }
    }

    // 🟢 SALVA O TEMPO ORIGINAL PARA MOSTRAR COMO REFERÊNCIA
    const tempoSalvo = (configParsed.sync_interval_min !== undefined && configParsed.sync_interval_min !== null)
      ? Number(configParsed.sync_interval_min) 
      : 20;
    setOriginalInterval(tempoSalvo);

    setForm(prev => ({
      ...prev,
      tenant_id: cnpjAtual, 
      app_key: configParsed.app_key || integracao?.consumer_key || "",
      app_secret: configParsed.app_secret || integracao?.consumer_secret || "",
      
      sync_interval_min: tempoSalvo,
      sync_clientes: configParsed.sync_clientes ?? true,
      sync_pedidos: configParsed.sync_pedidos ?? true,
      sync_produtos: configParsed.sync_produtos ?? true,
      sync_financeiro: configParsed.sync_financeiro ?? false,
      sync_vendedores: configParsed.sync_vendedores ?? true,
      auto_enviar_pedidos: configParsed.auto_enviar_pedidos ?? false,
      conta_padrao: configParsed.conta_padrao || "", // 🟢 RECUPERA DA NUVEM
    }));
  }, [integracao]);

  // 🟢 BUSCADOR DE CONTAS CORRENTES NA NUVEM
  useEffect(() => {
    if (!form.tenant_id) return;
    const fetchContas = async () => {
      setCarregandoContas(true);
      try {
        const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/omie/contas", {
          headers: { "x-tenant-id": form.tenant_id }
        });
        const data = await res.json();
        if (data.success) {
          setContasOmie(data.contas);
        }
      } catch (e) {
        console.error("Erro ao buscar contas", e);
      }
      setCarregandoContas(false);
    };
    fetchContas();
  }, [form.tenant_id]);

  const toggleSync = (campo) => {
    setForm(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    
    if (!form.tenant_id) {
      toast.error("Erro: CNPJ (Tenant) não encontrado.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("A atualizar regras de sincronização...");

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/omie", {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "x-tenant-id": form.tenant_id 
        },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Motor de sincronização atualizado com sucesso!", { id: loadingToast });
        onSuccess(); 
      } else { 
        toast.error(data.message || "Erro ao atualizar a integração.", { id: loadingToast }); 
      }
    } catch (error) { 
      toast.error("Erro de comunicação com a Nuvem.", { id: loadingToast }); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-emerald-200 dark:border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
      
      {/* HEADER LIMPO */}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Editar Motor Omie</h2>
          <p className="text-xs font-medium text-zinc-500 mt-1">Ajuste o que será sincronizado e com que frequência.</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-rose-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <form onSubmit={salvarEdicao} className="space-y-6">
          
          {/* TEMPO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm text-emerald-500">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Frequência do CRON</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 mb-2">Tempo entre cada busca automática no Omie.</p>
                <p className="text-[10px] font-bold text-emerald-600 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-md w-fit shadow-sm">
                  Último configurado: {originalInterval} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <input 
                type="number" min="5" max="1440" required 
                value={form.sync_interval_min} 
                onChange={e => setForm({...form, sync_interval_min: Number(e.target.value)})} 
                className="w-16 bg-transparent text-center font-mono font-black text-lg text-emerald-600 outline-none" 
              />
              <span className="text-xs font-bold text-zinc-400 pr-2">MIN</span>
            </div>
          </div>

          {/* 🟢 SELETOR DE CONTA BANCÁRIA PADRÃO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-colors shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 text-sky-500">
                <CreditCard size={20} />
              </div>
              <div className="pr-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Conta Corrente Padrão
                  {carregandoContas && <Loader2 size={12} className="animate-spin text-emerald-500" />}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Pedidos sem forma de pagamento mapeada cairão nesta conta no Omie.
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-auto min-w-[250px]">
              <select
                value={form.conta_padrao}
                onChange={(e) => setForm({ ...form, conta_padrao: e.target.value })}
                className="w-full border p-3 rounded-xl font-medium text-sm outline-none transition-all bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 dark:text-white shadow-sm cursor-pointer"
              >
                <option value="">Automático (Buscar no Omie)</option>
                {contasOmie.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.descricao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🟢 BLOCO DE ENVIO AUTOMÁTICO */}
          <div className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-amber-200 dark:border-amber-500/20 rounded-xl transition-colors shadow-sm">
            <div className="pr-4">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Zap size={18} className={form.auto_enviar_pedidos ? "text-amber-500 fill-amber-500/20" : "text-zinc-400"} /> 
                Envio Automático de Pedidos
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Se ativado, os pedidos do <strong className="text-indigo-500 dark:text-indigo-400">Raizan Seller App</strong> serão injetados e faturados no Omie imediatamente após o recebimento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSync('auto_enviar_pedidos')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                form.auto_enviar_pedidos ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.auto_enviar_pedidos ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* SWITCHES */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <RefreshCw size={16} className="text-emerald-500"/> Regras de Sincronização
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'sync_clientes', title: 'Clientes & B2B', desc: 'Busca clientes e limites.', icon: <Users size={18} />, color: 'blue' },
                { key: 'sync_pedidos', title: 'Pedidos de Venda', desc: 'Injeta pedidos no ERP.', icon: <ShoppingCart size={18} />, color: 'emerald' },
                { key: 'sync_produtos', title: 'Produtos & Estoque', desc: 'Baixa preços e estoque.', icon: <Database size={18} />, color: 'purple' },
                { key: 'sync_vendedores', title: 'Força de Vendas', desc: 'Importa vendedores.', icon: <Briefcase size={18} />, color: 'orange' },
                { key: 'sync_financeiro', title: 'Financeiro (Boletos)', desc: 'Lê pendências.', icon: <Receipt size={18} />, color: 'rose' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${item.color}-50 dark:bg-${item.color}-500/10 rounded-lg text-${item.color}-500`}>{item.icon}</div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{item.title}</p>
                      <p className="text-[10px] text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => toggleSync(item.key)} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${form[item.key] ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                    <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${form[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            <Save size={18} /> {loading ? "A guardar..." : "Guardar Alterações do Motor"}
          </button>
        </form>
      </div>
    </div>
  );
}