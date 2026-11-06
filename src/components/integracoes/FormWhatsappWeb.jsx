import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { salvarAppIntegrado } from "@/components/apps/appsIntegrados";

const PASSOS = [
  "Conecte aqui para liberar o WhatsApp nas Aplicações, no topo do sistema.",
  "Abra o WhatsApp pelas Aplicações e escaneie o QR Code com o celular.",
  "Pronto: a conversa fica aberta enquanto você trabalha no Raizan Core.",
];

export default function FormWhatsappWeb({ onCancel, onSuccess }) {
  const [salvando, setSalvando] = useState(false);

  const conectar = async () => {
    setSalvando(true);
    try {
      await salvarAppIntegrado("whatsapp", { conectado_em: new Date().toISOString() });
      toast.success("WhatsApp conectado!");
      onSuccess();
    } catch {
      toast.error("Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div onClick={(evento) => evento.stopPropagation()} className="overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-2xl animate-in fade-in slide-in-from-right-4 dark:border-emerald-500/30 dark:bg-[#0c0c0e]">
      <div className="relative flex items-center justify-between gap-4 overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-6 sm:p-8 dark:border-emerald-500/20 dark:from-emerald-900/20 dark:to-teal-900/10">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white p-2.5 shadow-lg shadow-emerald-500/20 ring-1 ring-black/5">
            <img src="/whatsapp.svg" alt="" className="h-full w-full object-contain" />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">WhatsApp Web</h2>
            <p className="mt-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">Suas conversas dentro do Raizan Core.</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="relative shrink-0 rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:text-white">Cancelar</button>
      </div>

      <div className="max-w-3xl space-y-6 p-6 sm:p-8">
        <ol className="space-y-3">
          {PASSOS.map((passo, indice) => (
            <li key={passo} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-700 dark:text-emerald-300">{indice + 1}</span>
              {passo}
            </li>
          ))}
        </ol>

        <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <button type="button" onClick={conectar} disabled={salvando} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 sm:w-auto">
            {salvando && <Loader2 size={18} className="animate-spin" />}
            Conectar WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
