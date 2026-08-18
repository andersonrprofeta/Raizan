import { useState, useEffect } from "react";
import { Store, Globe, Fingerprint } from "lucide-react";
import toast from 'react-hot-toast';

export default function FormRaizanCommerce({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formRaizan, setFormRaizan] = useState({
    nome_integracao: "Loja Oficial NUEV",
    url_loja: "https://nuev.com.br",
    tenant_id: "", 
    api_token: "" 
  });

  useEffect(() => {
    // Só roda no cliente, gera o UUID para preencher e pega o tenant
    const gerarToken = crypto.randomUUID();
    let cnpj = "";
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) cnpj = JSON.parse(storedUser).tenant_id;
    }
    setFormRaizan(prev => ({ ...prev, api_token: gerarToken, tenant_id: cnpj }));
  }, []);

  const salvarRaizanCommerce = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Registrando Loja Nativa...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/raizan", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "x-tenant-id": formRaizan.tenant_id },
        body: JSON.stringify(formRaizan)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Raizan Commerce conectado com sucesso!", { id: loadingToast });
        onSuccess(); 
      } else { 
        toast.error(data.message || "Erro ao registrar loja.", { id: loadingToast }); 
      }
    } catch (error) { 
      toast.error("Erro de conexão com o Hub.", { id: loadingToast }); 
    } finally { setLoading(false); }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-purple-200 dark:border-purple-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-purple-500/5 overflow-hidden">
      <div className="p-8 border-b border-purple-100 dark:border-purple-500/20 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/10">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-500/30">
            <img src="/RaizanCommerce.png" className="w-8 h-8 object-contain" alt="Raizan" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100 tracking-tight">Raizan Commerce</h2>
            <p className="text-sm text-purple-600/80 dark:text-purple-400/80 font-medium mt-1">Conecte sua Headless Store de alta performance.</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
      </div>

      <div className="p-8 max-w-3xl">
        <form onSubmit={salvarRaizanCommerce} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Store size={14} className="text-purple-500"/> Apelido da Loja
              </label>
              <input type="text" required value={formRaizan.nome_integracao} onChange={e => setFormRaizan({...formRaizan, nome_integracao: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Globe size={14} className="text-purple-500"/> URL da Loja (Site Oficial)
              </label>
              <input type="url" required value={formRaizan.url_loja} onChange={e => setFormRaizan({...formRaizan, url_loja: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
            </div>
          </div>

          <div className="p-6 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-2xl space-y-5 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Fingerprint size={80}/></div>
            <h3 className="text-sm font-black text-purple-900 dark:text-purple-300 flex items-center gap-2 relative z-10"><Fingerprint size={16} /> Identidade do Módulo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">CNPJ Vinculado (Tenant ID)</label>
                <input type="text" readOnly value={formRaizan.tenant_id} className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/30 p-3 rounded-xl font-mono font-bold text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Token da API Automático</label>
                <input type="text" readOnly value={formRaizan.api_token} className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/30 p-3 rounded-xl font-mono font-bold text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" />
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-500 mt-1 relative z-10">A loja vai ler seu catálogo de produtos e estoque unificado através destas credenciais.</p>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50">
              <Globe size={18} /> {loading ? "Ativando..." : "Ativar Raizan Commerce"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}