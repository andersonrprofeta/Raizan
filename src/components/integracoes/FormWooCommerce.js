import { useState, useEffect } from "react";
import { Store, Globe, Key, Link as LinkIcon } from "lucide-react";
import toast from 'react-hot-toast';

export default function FormWooCommerce({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formWoo, setFormWoo] = useState({
    nome_integracao: "Minha Loja WooCommerce",
    url_loja: "",
    consumer_key: "",
    consumer_secret: "",
    tenant_id: ""
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        setFormWoo(prev => ({ ...prev, tenant_id: JSON.parse(storedUser).tenant_id }));
      }
    }
  }, []);

  const salvarWooCommerce = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Conectando ao WooCommerce...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/woocommerce", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "x-tenant-id": formWoo.tenant_id },
        body: JSON.stringify(formWoo)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: loadingToast });
        onSuccess(); 
      } else { 
        toast.error(data.message, { id: loadingToast }); 
      }
    } catch (error) { 
      toast.error("Erro de conexão.", { id: loadingToast }); 
    } finally { setLoading(false); }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700/50 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-zinc-500/5 overflow-hidden">
      <div className="p-8 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/30">
            <img src="/woocommerce.svg" className="w-8 h-8 object-contain" alt="WooCommerce" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">WooCommerce</h2>
            <p className="text-sm text-zinc-500 font-medium mt-1">Conecte sua loja virtual WordPress.</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
      </div>

      <div className="p-8 max-w-3xl">
        <form onSubmit={salvarWooCommerce} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Store size={14} className="text-zinc-500"/> Apelido da Loja
            </label>
            <input type="text" required value={formWoo.nome_integracao} onChange={e => setFormWoo({...formWoo, nome_integracao: e.target.value})} placeholder="Ex: Filial São Paulo, Varejo Matriz..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
            <p className="text-xs font-medium text-zinc-500 mt-1">Isso ajudará você a identificar esta loja no painel.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Globe size={14} className="text-zinc-500"/> URL do Site
            </label>
            <input type="url" required value={formWoo.url_loja} onChange={e => setFormWoo({...formWoo, url_loja: e.target.value})} placeholder="https://www.sualoja.com.br" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Key size={14} className="text-zinc-500"/> Consumer Key
              </label>
              <input type="text" required value={formWoo.consumer_key} onChange={e => setFormWoo({...formWoo, consumer_key: e.target.value})} placeholder="ck_1234567890abcdef..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Key size={14} className="text-zinc-500"/> Consumer Secret
              </label>
              <input type="password" required value={formWoo.consumer_secret} onChange={e => setFormWoo({...formWoo, consumer_secret: e.target.value})} placeholder="cs_1234567890abcdef..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-purple-500 transition-all" />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[0.98] disabled:opacity-50">
              <LinkIcon size={18} /> {loading ? "Conectando..." : "Conectar WooCommerce"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}