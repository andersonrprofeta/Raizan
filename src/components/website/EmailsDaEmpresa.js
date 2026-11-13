"use client";

// E-mails da empresa (caixas na Hostinger que a Raizan ligou a este cliente).
// Aqui o cliente vê as caixas, troca a senha e apaga. Criar caixa NÃO existe aqui: é só pela Raizan.
// Se nenhum domínio estiver ligado, ou a função não estiver ativa, o bloco nem aparece.

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Mail, RefreshCw, Trash2 } from "lucide-react";
import { BOTAO_PRIMARIO, CAMPO, Modal, ROTULO } from "@/components/vendedores/ui";
import { apagarEmail, lerEmails, trocarSenhaEmail } from "./dados";
import { Bloco, Esqueleto, Etiqueta } from "./comum";

const REGRA_DA_SENHA = "De 8 a 50 caracteres, com letra maiúscula, letra minúscula, número e um símbolo (por exemplo ! ou @).";
const senhaValida = (s) => s.length >= 8 && s.length <= 50 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s) && /[^A-Za-z0-9]/.test(s);
const tamanho = (mb) => (mb == null ? "—" : mb >= 1024 ? `${(mb / 1024).toFixed(1).replace(".", ",")} GB` : `${mb} MB`);

function Uso({ caixa }) {
  if (caixa.usado_mb == null || !caixa.limite_mb) return null;
  const pct = Math.min(100, Math.round((caixa.usado_mb / caixa.limite_mb) * 100));
  const cheio = pct >= 90;
  return (
    <div className="mt-2 max-w-xs">
      <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
        <div className={`h-full rounded-full ${cheio ? "bg-rose-500" : "bg-purple-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-1 text-[11px] ${cheio ? "text-rose-600 dark:text-rose-400" : "text-zinc-500"}`}>
        {tamanho(caixa.usado_mb)} de {tamanho(caixa.limite_mb)}{cheio ? " · quase cheia" : ""}
      </p>
    </div>
  );
}

function TrocarSenha({ caixa, onFechar }) {
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!senhaValida(senha)) return void toast.error(REGRA_DA_SENHA);
    if (senha !== repetir) return void toast.error("As duas senhas não são iguais.");
    setOcupado(true);
    const r = await trocarSenhaEmail(caixa.id, senha);
    setOcupado(false);
    if (r.estado !== "ok") return void toast.error(r.mensagem || "Não foi possível trocar a senha.");
    toast.success("Senha trocada.");
    onFechar();
  };

  return (
    <Modal titulo="Trocar senha" descricao={caixa.endereco} onFechar={onFechar}>
      <form onSubmit={enviar} className="space-y-4 pb-4">
        <div>
          <label htmlFor="email-senha" className={ROTULO}>Nova senha</label>
          <input id="email-senha" type="password" autoFocus autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label htmlFor="email-repetir" className={ROTULO}>Repita a nova senha</label>
          <input id="email-repetir" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} className={CAMPO} />
        </div>
        <p className="text-xs text-zinc-500">{REGRA_DA_SENHA} Quem usa esta caixa no celular ou no Outlook vai precisar da senha nova.</p>
        <button type="submit" disabled={ocupado} className={`${BOTAO_PRIMARIO} w-full`}>
          {ocupado ? <RefreshCw size={16} className="animate-spin" /> : <KeyRound size={16} />} Trocar senha
        </button>
      </form>
    </Modal>
  );
}

function ApagarCaixa({ caixa, onFechar, onApagada }) {
  const [confirmacao, setConfirmacao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const confere = confirmacao.trim().toLowerCase() === String(caixa.endereco).toLowerCase();

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!confere) return void toast.error("Digite o endereço exatamente como aparece.");
    setOcupado(true);
    const r = await apagarEmail(caixa.id, confirmacao.trim());
    setOcupado(false);
    if (r.estado !== "ok") return void toast.error(r.mensagem || "Não foi possível apagar.");
    toast.success("Caixa apagada.");
    onApagada();
  };

  return (
    <Modal titulo="Apagar caixa de e-mail" descricao={caixa.endereco} onFechar={onFechar}>
      <form onSubmit={enviar} className="space-y-4 pb-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          A caixa para de receber e-mails e as mensagens dela deixam de aparecer. Se foi engano, fale com a Raizan: dá para recuperar por um tempo.
        </p>
        <div>
          <label htmlFor="email-confirmar" className={ROTULO}>Digite <strong className="break-all">{caixa.endereco}</strong> para confirmar</label>
          <input id="email-confirmar" autoComplete="off" autoFocus value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className={CAMPO} />
        </div>
        <button type="submit" disabled={ocupado || !confere} className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
          {ocupado ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />} Apagar caixa
        </button>
      </form>
    </Modal>
  );
}

export default function EmailsDaEmpresa() {
  const [resposta, setResposta] = useState(null);
  const [trocando, setTrocando] = useState(null);
  const [apagando, setApagando] = useState(null);

  const carregar = useCallback(async () => {
    setResposta(await lerEmails());
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  if (!resposta) return <Esqueleto altura={180} />;
  // Função não ativada, sem permissão ou nenhum domínio ligado: o bloco não aparece
  if (resposta.estado === "indisponivel" || resposta.estado === "sem_permissao") return null;
  const dominios = resposta.estado === "ok" ? resposta.dados.dominios || [] : [];
  if (resposta.estado === "ok" && !dominios.length) return null;

  return (
    <Bloco
      titulo="E-mails"
      icone={Mail}
      cor="amber"
      acao={<button type="button" aria-label="Atualizar e-mails" onClick={() => { setResposta(null); carregar(); }} className="p-2 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-white"><RefreshCw size={15} /></button>}
    >
      {resposta.estado === "erro" ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{resposta.mensagem}</p>
      ) : (
        <div className="space-y-6">
          {dominios.map((d) => (
            <div key={d.order_id}>
              <p className="text-[13px] font-medium text-zinc-500 mb-2 break-all">@{d.dominio} · {d.caixas.length} {d.caixas.length === 1 ? "caixa" : "caixas"}</p>
              {d.erro && <p className="text-sm text-rose-600 dark:text-rose-400 mb-2">{d.erro}</p>}
              {!d.erro && !d.caixas.length && <p className="text-sm text-zinc-500">Nenhuma caixa neste domínio.</p>}
              <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                {d.caixas.map((c) => (
                  <li key={c.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-[12rem] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white break-all">{c.endereco}</p>
                        {c.situacao !== "ativa" && <Etiqueta tom="ambar" ponto>Suspensa</Etiqueta>}
                      </div>
                      {c.situacao !== "ativa" && <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Fale com a Raizan para reativar{c.motivo ? ` (motivo: ${c.motivo})` : ""}.</p>}
                      <Uso caixa={c} />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setTrocando(c)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"><KeyRound size={14} /> Trocar senha</button>
                      <button type="button" onClick={() => setApagando(c)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-rose-500/25 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/[0.07]"><Trash2 size={14} /> Apagar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-zinc-500">Precisa de uma caixa nova? Peça à Raizan.</p>
        </div>
      )}

      {trocando && <TrocarSenha caixa={trocando} onFechar={() => setTrocando(null)} />}
      {apagando && <ApagarCaixa caixa={apagando} onFechar={() => setApagando(null)} onApagada={() => { setApagando(null); carregar(); }} />}
    </Bloco>
  );
}
