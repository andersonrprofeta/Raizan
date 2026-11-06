import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { PROVEDORES_EMAIL } from "@/components/apps/aplicacoes";
import { normalizarEndereco, salvarAppIntegrado } from "@/components/apps/appsIntegrados";

export default function FormEmailBusiness({ atual, onCancel, onSuccess }) {
  const [provedor, setProvedor] = useState(atual?.provedor || "hostinger");
  const [endereco, setEndereco] = useState(atual?.provedor === "outro" ? atual.url : "");
  const [salvando, setSalvando] = useState(false);
  const outro = provedor === "outro";

  const salvar = async (evento) => {
    evento.preventDefault();
    const escolhido = PROVEDORES_EMAIL.find((item) => item.id === provedor);
    const url = outro ? normalizarEndereco(endereco) : escolhido.url;
    if (!url) return void toast.error("Informe um endereço válido, como webmail.suaempresa.com.br");

    setSalvando(true);
    try {
      await salvarAppIntegrado("email", { provedor, nome: outro ? new URL(url).hostname : escolhido.nome, url });
      toast.success("E-mail Business conectado!");
      onSuccess();
    } catch {
      toast.error("Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div onClick={(evento) => evento.stopPropagation()} className="overflow-hidden rounded-[28px] border border-purple-200 bg-white shadow-2xl animate-in fade-in slide-in-from-right-4 dark:border-purple-500/30 dark:bg-[#0c0c0e]">
      <div className="relative flex items-center justify-between gap-4 overflow-hidden border-b border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50/40 p-6 sm:p-8 dark:border-purple-500/20 dark:from-purple-900/25 dark:to-indigo-900/10">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
            <Mail size={26} aria-hidden />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">E-mail Business</h2>
            <p className="mt-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">Sua caixa de entrada dentro do Raizan Core.</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="relative shrink-0 rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:text-white">Cancelar</button>
      </div>

      <form onSubmit={salvar} className="max-w-3xl space-y-6 p-6 sm:p-8">
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">Qual é o seu provedor de e-mail?</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PROVEDORES_EMAIL.map((item) => {
              const marcado = provedor === item.id;
              return (
                <button key={item.id} type="button" role="radio" aria-checked={marcado} onClick={() => setProvedor(item.id)} className={`flex h-14 items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition-colors ${marcado ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-200" : "border-black/[0.08] text-zinc-600 hover:border-purple-300 dark:border-white/10 dark:text-zinc-300 dark:hover:border-purple-500/40"}`}>
                  {item.nome}
                  {marcado && <Check size={17} aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>

        {outro && (
          <div className="space-y-2">
            <label htmlFor="endereco-webmail" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Endereço do webmail</label>
            <input id="endereco-webmail" autoFocus value={endereco} onChange={(evento) => setEndereco(evento.target.value)} placeholder="webmail.suaempresa.com.br" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-purple-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" />
          </div>
        )}

        <p className="rounded-2xl bg-black/[0.03] p-4 text-sm leading-relaxed text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">
          Você entra com seu e-mail e sua senha na própria tela do provedor. O Raizan Core não pede nem guarda a sua senha.
        </p>

        <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <button type="submit" disabled={salvando} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 sm:w-auto">
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <Mail size={17} aria-hidden />}
            {atual ? "Salvar alterações" : "Conectar e-mail"}
          </button>
        </div>
      </form>
    </div>
  );
}
