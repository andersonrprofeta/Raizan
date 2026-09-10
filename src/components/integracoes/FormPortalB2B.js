import { useState, useEffect } from "react";
import { Globe, LayoutTemplate, Fingerprint, Lock, Percent } from "lucide-react";
import toast from 'react-hot-toast';

export default function FormPortalB2B({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formB2B, setFormB2B] = useState({
    url_loja: "",
    tenant_id: "",
    acrescimo_cpf: 0 // 🟢 NOVO CAMPO: Regra de negócio para Pessoa Física
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        setFormB2B(prev => ({ ...prev, tenant_id: JSON.parse(storedUser).tenant_id }));
      }
    }
  }, []);

  const salvarPortalB2B = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Ativando Portal B2B Cloud...");
    try {
      // 🟢 GERA UM TOKEN DE SEGURANÇA ÚNICO PARA ESTE PORTAL
      const tokenGerado = `b2b_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      
      const payload = {
        ...formB2B,
        api_token: tokenGerado
      };

      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/b2b", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "x-tenant-id": formB2B.tenant_id },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Portal B2B ativado na Nuvem!", { id: loadingToast });
        onSuccess(); 
      } else { 
        toast.error(data.message || "Erro ao instalar portal.", { id: loadingToast }); 
      }
    } catch (error) { 
      toast.error("Erro de conexão com o Hub.", { id: loadingToast }); 
    } finally { setLoading(false); }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-indigo-200 dark:border-indigo-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-indigo-500/5 overflow-hidden">
      <div className="p-8 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/10">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-500/30">
            <Globe className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">Portal B2B Nativo</h2>
            <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 font-medium mt-1">Habilite o seu portal B2B diretamente na Nuvem Raizan.</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
      </div>

      <div className="p-8 max-w-3xl">
        <form onSubmit={salvarPortalB2B} className="space-y-6">
          
          {/* 🟢 DIVIDIDO EM DUAS COLUNAS PARA FICAR ELEGANTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <LayoutTemplate size={14} className="text-indigo-500"/> URL do Portal (Lojista)
              </label>
              <input type="url" required value={formB2B.url_loja} onChange={e => setFormB2B({...formB2B, url_loja: e.target.value})} placeholder="https://portal.suaempresa.com.br" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              <p className="text-xs font-medium text-zinc-500 mt-1">Endereço de acesso dos clientes.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Percent size={14} className="text-indigo-500"/> Acréscimo para CPF (%)
              </label>
              <input 
                type="number" 
                min="0" 
                step="0.1" 
                value={formB2B.acrescimo_cpf} 
                onChange={e => setFormB2B({...formB2B, acrescimo_cpf: Number(e.target.value)})} 
                placeholder="Ex: 15" 
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-black text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
              />
              <p className="text-xs font-medium text-zinc-500 mt-1">Margem extra aplicada sobre o preço base para sacoleiros/PF.</p>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl space-y-5 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Fingerprint size={80}/></div>
            <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-2 relative z-10"><Lock size={16} /> Autenticação 100% Cloud</h3>
            <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 relative z-10 leading-relaxed font-medium">
              Esqueça túneis locais! O seu Portal B2B agora está plugado diretamente no <strong className="text-indigo-600 dark:text-indigo-400">Raizan Core</strong>. Os pedidos cairão automaticamente no Hub.
            </p>
            
            <div className="space-y-2 relative z-10 pt-2">
              <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">CNPJ Vinculado (Tenant ID)</label>
              <input type="text" readOnly value={formB2B.tenant_id} className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-500/30 p-3 rounded-xl font-mono font-bold text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50">
              <Globe size={18} /> {loading ? "Salvando..." : "Ativar Portal B2B na Nuvem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}