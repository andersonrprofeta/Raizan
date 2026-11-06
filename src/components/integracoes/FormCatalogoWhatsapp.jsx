import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { getHeaders, getHubUrl } from "@/components/utils/api";

const CAMPO = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white";

export default function FormCatalogoWhatsapp({ siteInicial = "", onCancel, onSuccess }) {
  const [nomeLoja, setNomeLoja] = useState("");
  const [site, setSite] = useState(siteInicial);
  const [salvando, setSalvando] = useState(false);

  const instalar = async (evento) => {
    evento.preventDefault();
    setSalvando(true);
    try {
      const resposta = await fetch(`${getHubUrl()}/api/hub/catalogo-whatsapp/config`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ nome_loja: nomeLoja, site }),
      });
      const dados = await resposta.json();
      if (dados.success) {
        toast.success("Catálogo WhatsApp instalado!");
        onSuccess();
      } else {
        toast.error(dados.message || "Não foi possível instalar.");
      }
    } catch {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div onClick={(evento) => evento.stopPropagation()} className="overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-2xl animate-in fade-in slide-in-from-right-4 dark:border-emerald-500/30 dark:bg-[#0c0c0e]">
      <div className="relative flex items-center justify-between gap-4 overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-6 sm:p-8 dark:border-emerald-500/20 dark:from-emerald-900/20 dark:to-teal-900/10">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
            <ShoppingBag size={26} aria-hidden />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Catálogo WhatsApp</h2>
            <p className="mt-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">Seus produtos atualizados na Meta por um único link.</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="relative shrink-0 rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:text-white">Cancelar</button>
      </div>

      <form onSubmit={instalar} className="max-w-3xl space-y-6 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="catalogo-loja" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nome da loja</label>
            <input id="catalogo-loja" required value={nomeLoja} onChange={(evento) => setNomeLoja(evento.target.value)} placeholder="Minha Distribuidora" className={CAMPO} />
          </div>
          <div className="space-y-2">
            <label htmlFor="catalogo-site" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Site da loja</label>
            <input id="catalogo-site" required value={site} onChange={(evento) => setSite(evento.target.value)} placeholder="www.sualoja.com.br" className={CAMPO} />
          </div>
        </div>

        <p className="rounded-2xl bg-black/[0.03] p-4 text-sm leading-relaxed text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">
          A Meta exige um site para cada produto. O nome da loja entra como marca quando o produto não tiver uma. Depois de instalar, você recebe o link para colar no Gerenciador de Comércio.
        </p>

        <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <button type="submit" disabled={salvando} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 sm:w-auto">
            {salvando && <Loader2 size={18} className="animate-spin" />}
            Instalar catálogo
          </button>
        </div>
      </form>
    </div>
  );
}
