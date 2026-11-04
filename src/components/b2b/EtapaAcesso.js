"use client";

import { useState } from "react";
import { ArrowLeft, Check, Lock, Mail } from "lucide-react";
import { getHubUrl } from "@/components/utils/api";

const TAMANHO_MINIMO_SENHA = 8;

const CAMPO =
  "w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 " +
  "rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all";

const BOTAO =
  "mt-2 w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white font-semibold " +
  "py-3.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

const TEXTOS = {
  criar: { titulo: "Crie sua senha", subtitulo: "Esse foi seu primeiro acesso. Escolha uma senha só sua para continuar." },
  redefinir: { titulo: "Nova senha", subtitulo: "Escolha a senha que vai usar daqui em diante." },
  esqueci: { titulo: "Esqueceu a senha?", subtitulo: "Enviamos um link para o seu e-mail, válido por 1 hora." }
};

async function enviar(caminho, corpo, cabecalhos = {}) {
  const resposta = await fetch(`${getHubUrl()}/api/auth/b2b/${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...cabecalhos },
    body: JSON.stringify(corpo)
  });
  return resposta.json();
}

function Campo({ Icone, rotulo, ...entrada }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
        {rotulo}
        <div className="relative mt-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icone size={18} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <input {...entrada} required className={`${CAMPO} font-normal`} />
        </div>
      </label>
    </div>
  );
}

// Criar senha no primeiro acesso, pedir o link de recuperação e usar o link recebido
export default function EtapaAcesso({ etapa, token, codigo, emailInicial, onConcluir, onVoltar }) {
  const [email, setEmail] = useState(emailInicial || "");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);

  const pedirLink = async () => {
    const tenantId = localStorage.getItem("@raizan:b2b_tenant_id");
    await enviar("esqueci-senha", { email }, { "x-tenant-id": tenantId });
    setEmailEnviado(true);
  };

  const salvarSenha = async () => {
    if (senha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    const data = etapa === "criar"
      ? await enviar("criar-senha", { novaSenha: senha }, { Authorization: `Bearer ${token}` })
      : await enviar("redefinir-senha", { codigo, novaSenha: senha });

    if (data.success) onConcluir(data);
    else setErro(data.message || "Não foi possível salvar a senha.");
  };

  const aoEnviar = async (e) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await (etapa === "esqueci" ? pedirLink() : salvarSenha());
    } catch (falha) {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const { titulo, subtitulo } = TEXTOS[etapa];

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">{titulo}</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{subtitulo}</p>
      </div>

      {erro && (
        <p role="alert" className="mb-5 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded-xl px-4 py-3">{erro}</p>
      )}

      {emailEnviado ? (
        <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-emerald-500/10 rounded-xl px-4 py-3 flex items-start gap-2">
          <Check size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          Se o e-mail estiver cadastrado, o link chega em instantes. Confira também o spam.
        </div>
      ) : (
        <form onSubmit={aoEnviar} className="flex flex-col gap-5">
          {etapa === "esqueci" ? (
            <Campo Icone={Mail} rotulo="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com.br" autoComplete="email" />
          ) : (
            <>
              <Campo Icone={Lock} rotulo="Nova senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={`Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`} minLength={TAMANHO_MINIMO_SENHA} autoComplete="new-password" />
              <Campo Icone={Lock} rotulo="Confirme a senha" type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder="Digite de novo" minLength={TAMANHO_MINIMO_SENHA} autoComplete="new-password" />
            </>
          )}

          <button type="submit" disabled={enviando} className={BOTAO}>
            {enviando
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : etapa === "esqueci" ? "Enviar link" : "Salvar senha"}
          </button>
        </form>
      )}

      {etapa !== "criar" && (
        <button type="button" onClick={onVoltar} className="mt-6 flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          <ArrowLeft size={15} /> Voltar para o login
        </button>
      )}
    </>
  );
}
