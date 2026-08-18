import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import toast from 'react-hot-toast';

export default function FormFrenet({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formFrenet, setFormFrenet] = useState({
    nome_integracao: "Frenet Oficial",
    chave_frenet: "",
    senha_frenet: "",
    token_frenet: "",
    tenant_id: ""
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        setFormFrenet(prev => ({ ...prev, tenant_id: JSON.parse(storedUser).tenant_id }));
      }
    }
  }, []);

  const salvarFrenet = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Configurando Frenet...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/frenet", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "x-tenant-id": formFrenet.tenant_id },
        body: JSON.stringify(formFrenet)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Frenet configurada com sucesso!", { id: loadingToast });
        onSuccess(); 
      } else { 
        toast.error(data.message || "Erro ao salvar credenciais.", { id: loadingToast }); 
      }
    } catch (error) { 
      toast.error("Erro de conexão.", { id: loadingToast }); 
    } finally { setLoading(false); }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-orange-200 dark:border-orange-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-orange-500/5 overflow-hidden">
      <div className="p-8 border-b border-orange-100 dark:border-orange-500/20 flex items-center justify-between bg-orange-50/50 dark:bg-orange-900/10">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-500/30">
            <img src="/Frenet.svg" className="w-8 h-8 object-contain" alt="Frenet" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-orange-900 dark:text-orange-100 tracking-tight">Frenet Logística</h2>
            <p className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium mt-1">Cálculo de frete no checkout do portal.</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
      </div>

      <div className="p-8 max-w-3xl">
        <form onSubmit={salvarFrenet} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Identificação Interna</label>
            <input type="text" required value={formFrenet.nome_integracao} onChange={e => setFormFrenet({...formFrenet, nome_integracao: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Chave (E-mail)</label>
              <input type="text" required value={formFrenet.chave_frenet} onChange={e => setFormFrenet({...formFrenet, chave_frenet: e.target.value})} placeholder="mkt@rafany.com.br" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl text-sm outline-none focus:border-orange-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Senha</label>
              <input type="password" required value={formFrenet.senha_frenet} onChange={e => setFormFrenet({...formFrenet, senha_frenet: e.target.value})} placeholder="vZ3yi+RoZ..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-orange-500 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Token</label>
            <input type="text" required value={formFrenet.token_frenet} onChange={e => setFormFrenet({...formFrenet, token_frenet: e.target.value})} placeholder="26F6D137R95BER..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-orange-500 transition-all" />
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50">
              <Truck size={18} /> {loading ? "Salvando..." : "Salvar e Ativar Transportadoras"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}