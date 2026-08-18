import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import toast from 'react-hot-toast';

export default function FormMercadoPago({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formMP, setFormMP] = useState({
    nome_integracao: "Mercado Pago Oficial",
    access_token: "",
    public_key: "",
    disponivel_b2b: true,
    disponivel_raizan: false,
    tenant_id: ""
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        setFormMP(prev => ({ ...prev, tenant_id: JSON.parse(storedUser).tenant_id }));
      }
    }
  }, []);

  const salvarMercadoPago = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Configurando Mercado Pago...");
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/mercadopago", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "x-tenant-id": formMP.tenant_id },
        body: JSON.stringify(formMP)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Mercado Pago configurado com sucesso!", { id: loadingToast });
        onSuccess(); 
      } else { 
        toast.error(data.message || "Erro ao salvar credenciais.", { id: loadingToast }); 
      }
    } catch (error) { 
      toast.error("Erro de conexão com a Nuvem Raizan.", { id: loadingToast }); 
    } finally { setLoading(false); }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-sky-200 dark:border-sky-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-sky-500/5 overflow-hidden">
      <div className="p-8 border-b border-sky-100 dark:border-sky-500/20 flex items-center justify-between bg-sky-50/50 dark:bg-sky-900/10">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-sky-100 dark:border-sky-500/30">
            <img src="/Mercadopago.svg" className="w-8 h-8 object-contain" alt="MP" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-sky-900 dark:text-sky-100 tracking-tight">Mercado Pago</h2>
            <p className="text-sm text-sky-600/80 dark:text-sky-400/80 font-medium mt-1">Configuração de checkout transparente.</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">Cancelar Configuração</button>
      </div>

      <div className="p-8 max-w-3xl">
        <form onSubmit={salvarMercadoPago} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Identificação Interna</label>
            <input type="text" required value={formMP.nome_integracao} onChange={e => setFormMP({...formMP, nome_integracao: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Access Token (Produção)</label>
              <input type="password" required value={formMP.access_token} onChange={e => setFormMP({...formMP, access_token: e.target.value})} placeholder="APP_USR-..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-sky-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Public Key (Produção)</label>
              <input type="text" required value={formMP.public_key} onChange={e => setFormMP({...formMP, public_key: e.target.value})} placeholder="APP_USR-..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-sky-500 transition-all" />
            </div>
          </div>

          <div className="pt-6 pb-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Disponibilizar este meio de pagamento em:</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formMP.disponivel_b2b ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'}`}>
                  {formMP.disponivel_b2b && <CheckCircle2 size={14} />}
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Portal B2B (Lojistas)</span>
                <input type="checkbox" className="hidden" checked={formMP.disponivel_b2b} onChange={(e) => setFormMP({...formMP, disponivel_b2b: e.target.checked})} />
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formMP.disponivel_raizan ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'}`}>
                  {formMP.disponivel_raizan && <CheckCircle2 size={14} />}
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Raizan Commerce (Varejo)</span>
                <input type="checkbox" className="hidden" checked={formMP.disponivel_raizan} onChange={(e) => setFormMP({...formMP, disponivel_raizan: e.target.checked})} />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-8">
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50">
              <CreditCard size={18} /> {loading ? "Salvando..." : "Salvar e Ativar Módulo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}