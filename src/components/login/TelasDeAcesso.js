"use client";

import { useState } from "react";
import { Loader2, MonitorX, ShieldCheck } from "lucide-react";
import { getHubUrl, getHeaders } from "@/components/utils/api";

const TAMANHO_MINIMO_SENHA = 8;
const FUNDO = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md";
const CAIXA = "w-full max-w-md rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121214] p-6 text-zinc-900 dark:text-zinc-100";
const CAMPO = "w-full h-11 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-transparent focus:border-purple-500/50 text-sm outline-none transition-all";
const BOTAO = "w-full h-11 rounded-full text-sm font-semibold text-white bg-gradient-to-b from-purple-500 to-purple-600 disabled:opacity-50 flex items-center justify-center gap-2";

export function ModalTerminais({ limite, ocupado, aoDerrubar, aoFechar }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Terminais em uso" className={FUNDO}>
      <div className={CAIXA}>
        <MonitorX size={26} className="text-amber-500" aria-hidden />
        <h2 className="mt-3 text-lg font-bold tracking-tight">Terminais em uso</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{limite.message}</p>

        {limite.sessoes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {limite.sessoes.map((sessao) => (
              <li key={sessao.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-2.5">
                <span className="min-w-0 truncate text-sm font-medium">{sessao.nome}</span>
                <button type="button" disabled={ocupado} onClick={() => aoDerrubar(sessao.id)} className="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400 disabled:opacity-50">Desconectar</button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={aoFechar} className="mt-5 w-full h-11 rounded-full text-sm font-semibold bg-black/[0.05] dark:bg-white/[0.08]">Voltar</button>
      </div>
    </div>
  );
}

export function TrocarSenha({ senhaAtual, aoConcluir }) {
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (evento) => {
    evento.preventDefault();
    setErro("");
    if (senhaNova.length < TAMANHO_MINIMO_SENHA) return setErro(`Use ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
    if (senhaNova !== confirmacao) return setErro("As senhas não são iguais.");

    setSalvando(true);
    try {
      const res = await fetch(`${getHubUrl()}/api/hub/usuarios/trocar-senha`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ senha_atual: senhaAtual, senha_nova: senhaNova })
      });
      const dados = await res.json();
      if (dados.success) aoConcluir();
      else setErro(dados.message || "Não foi possível trocar a senha.");
    } catch (e) {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Crie sua senha" className={FUNDO}>
      <form onSubmit={salvar} className={CAIXA}>
        <ShieldCheck size={26} className="text-purple-500" aria-hidden />
        <h2 className="mt-3 text-lg font-bold tracking-tight">Crie sua senha</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Essa senha temporária só vale para o primeiro acesso.</p>

        <div className="mt-4 space-y-3">
          <input type="password" required autoFocus aria-label="Nova senha" placeholder="Nova senha" autoComplete="new-password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} className={CAMPO} />
          <input type="password" required aria-label="Confirmar a nova senha" placeholder="Confirmar a nova senha" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className={CAMPO} />
        </div>
        {erro && <p role="alert" className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">{erro}</p>}

        <button type="submit" disabled={salvando} className={`${BOTAO} mt-5`}>
          {salvando ? <Loader2 size={18} className="animate-spin" /> : "Salvar e entrar"}
        </button>
      </form>
    </div>
  );
}
