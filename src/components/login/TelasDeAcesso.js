"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck, MailWarning, MonitorX, ShieldCheck } from "lucide-react";
import { getHubUrl, getHeaders } from "@/components/utils/api";

const TAMANHO_MINIMO_SENHA = 8;
const SEGUNDOS_PARA_REENVIAR = 60;
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

// A chave do componente é o desafio: um código novo limpa o campo e reinicia a contagem
export function TelaDoCodigo({ desafio, erro, ocupado, aoConfirmar, aoReenviar, aoVoltar }) {
  const [codigo, setCodigo] = useState("");
  const [confiar, setConfiar] = useState(false);
  const [espera, setEspera] = useState(desafio.email_enviado ? SEGUNDOS_PARA_REENVIAR : 0);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const relogio = setTimeout(() => setEspera(espera - 1), 1000);
    return () => clearTimeout(relogio);
  }, [espera]);

  const enviado = desafio.email_enviado;
  const Icone = enviado ? MailCheck : MailWarning;

  return (
    <div role="dialog" aria-modal="true" aria-label="Código de acesso" className={FUNDO}>
      <form onSubmit={(evento) => { evento.preventDefault(); aoConfirmar({ codigo, confiar }); }} className={CAIXA}>
        <Icone size={26} className={enviado ? "text-purple-500" : "text-amber-500"} aria-hidden />
        <h2 className="mt-3 text-lg font-bold tracking-tight">{enviado ? "Confirme que é você" : "O e-mail não foi enviado"}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{desafio.message}</p>

        <label htmlFor="codigo-de-acesso" className="mt-4 block text-sm font-medium">{enviado ? "Código de 6 dígitos" : "Código de liberação"}</label>
        <input
          id="codigo-de-acesso"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          title="Digite os 6 dígitos"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          className={`${CAMPO} mt-1.5 text-center text-lg font-semibold tracking-[0.4em]`}
        />

        <label className="mt-4 flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={confiar} onChange={(e) => setConfiar(e.target.checked)} className="mt-0.5 size-4 accent-purple-600" />
          <span>
            <span className="font-medium">Confiar neste computador</span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">Não pede o código por 30 dias. Não marque em computador de uso compartilhado.</span>
          </span>
        </label>

        {erro && <p role="alert" className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">{erro}</p>}

        <button type="submit" disabled={ocupado || codigo.length !== 6} className={`${BOTAO} mt-5`}>
          {ocupado ? <Loader2 size={18} className="animate-spin" /> : "Confirmar e entrar"}
        </button>

        <div className="mt-3 flex items-center justify-between text-sm font-semibold">
          <button type="button" onClick={aoVoltar} className="text-zinc-500 dark:text-zinc-400">Voltar</button>
          <button type="button" disabled={ocupado || espera > 0} onClick={aoReenviar} className="text-purple-600 dark:text-purple-400 disabled:text-zinc-400 dark:disabled:text-zinc-600">
            {espera > 0 ? `Reenviar em ${espera}s` : "Reenviar código"}
          </button>
        </div>
      </form>
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
