"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle, Copy, KeyRound, LockOpen, MonitorX, Pencil, Plus, ShieldCheck, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import { api, Avatar, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, ROTULO, Segmentado, VIDRO } from "@/components/vendedores/ui";

const ABAS = [
  { id: "usuarios", rotulo: "Usuários", icone: Users },
  { id: "terminais", rotulo: "Terminais", icone: MonitorX },
  { id: "atividade", rotulo: "Atividades", icone: ShieldCheck },
];

const FORMULARIO_VAZIO = { nome: "", cargo: "", email: "", senha: "", perfil: "Televendas", permissoes: [], vendedor_id: "" };

const NOME_DA_ACAO = {
  login: "Entrou no sistema", usuario_criado: "Criou usuário", usuario_editado: "Editou usuário",
  usuario_bloqueado: "Bloqueou usuário", usuario_desbloqueado: "Desbloqueou usuário", senha_resetada: "Gerou link de senha",
  senha_trocada: "Trocou a senha", senha_definida: "Criou a senha", sessao_derrubada: "Desconectou um terminal",
  acesso_liberado: "Liberou o acesso por código", codigo_nao_enviado: "Código por e-mail não enviado",
  computador_confiavel: "Confiou em um computador", computador_revogado: "Removeu computador confiável",
};

// A lista do select é desenhada pelo sistema: sem isso, o tema escuro mostra texto claro em fundo branco
const SELETOR = `${CAMPO} dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-[#1c1c1f] dark:[&>option]:text-zinc-100`;

const dataHora = (valor) => (valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Nunca");

function ModalLink({ link, emailEnviado, aoFechar }) {
  const copiar = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado.");
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Link de acesso" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-md">
      <div className={`${VIDRO} !bg-white dark:!bg-[#121214] w-full max-w-lg p-6`}>
        <h2 className="text-lg font-bold tracking-tight">Link de acesso criado</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{emailEnviado ? "Enviamos o link por e-mail. Você também pode copiar abaixo." : "Não foi possível enviar o e-mail. Copie o link e envie à pessoa."}</p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-3">
          <code className="min-w-0 flex-1 break-all text-xs">{link}</code>
          <button type="button" onClick={copiar} aria-label="Copiar link" className="shrink-0 p-2 rounded-xl hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"><Copy size={16} /></button>
        </div>
        <button type="button" onClick={aoFechar} className={`${BOTAO_PRIMARIO} w-full mt-5`}>Fechar</button>
      </div>
    </div>
  );
}

function ModalLiberacao({ liberacao, aoFechar }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Código de liberação" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-md">
      <div className={`${VIDRO} !bg-white dark:!bg-[#121214] w-full max-w-md p-6`}>
        <h2 className="text-lg font-bold tracking-tight">Código de liberação de {liberacao.nome}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Confirme que é a própria pessoa, por telefone ou pessoalmente, e passe este código. Ele vale por {liberacao.minutos} minutos e só funciona no computador em que ela acertou a senha.</p>
        <p className="mt-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-4 text-center text-3xl font-bold tracking-[0.3em] tabular-nums">{liberacao.codigo}</p>
        <button type="button" onClick={aoFechar} className={`${BOTAO_PRIMARIO} w-full mt-5`}>Fechar</button>
      </div>
    </div>
  );
}

function ModalUsuario({ editando, opcoes, aoFechar, aoSalvar }) {
  const [form, setForm] = useState(() => (editando ? { ...FORMULARIO_VAZIO, ...editando, cargo: editando.cargo || "", vendedor_id: editando.vendedor_id || "" } : { ...FORMULARIO_VAZIO, permissoes: opcoes.perfis.Televendas }));
  const [salvando, setSalvando] = useState(false);
  const ehAdministrador = form.perfil === "Administrador";
  const alterar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const escolherPerfil = (perfil) => setForm((atual) => ({ ...atual, perfil, permissoes: opcoes.perfis[perfil] || [] }));

  const alternarPermissao = (slug) => setForm((atual) => ({
    ...atual,
    perfil: "Personalizado",
    permissoes: atual.permissoes.includes(slug) ? atual.permissoes.filter((item) => item !== slug) : [...atual.permissoes, slug],
  }));

  const salvar = async (evento) => {
    evento.preventDefault();
    setSalvando(true);
    try {
      const dados = await api(editando ? `/usuarios/${editando.id}` : "/usuarios", { metodo: editando ? "PUT" : "POST", corpo: form });
      if (dados.success) aoSalvar(dados);
      else toast.error(dados.message || "Não foi possível salvar.");
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  const opcoesDePermissao = [...opcoes.recursos, ...opcoes.modulos];

  return (
    <div role="dialog" aria-modal="true" aria-label={editando ? "Editar usuário" : "Novo usuário"} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-md">
      <form onSubmit={salvar} className={`${VIDRO} !bg-white dark:!bg-[#121214] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.07]">
          <h2 className="text-lg font-bold tracking-tight">{editando ? "Editar usuário" : "Novo usuário"}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center"><X size={17} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nome" className={ROTULO}>Nome completo</label>
              <input id="nome" required value={form.nome} onChange={(e) => alterar("nome", e.target.value)} className={CAMPO} />
            </div>
            <div>
              <label htmlFor="cargo" className={ROTULO}>Função ou cargo</label>
              <input id="cargo" value={form.cargo} onChange={(e) => alterar("cargo", e.target.value)} className={CAMPO} />
            </div>
            <div>
              <label htmlFor="email" className={ROTULO}>E-mail</label>
              <input id="email" type="email" required disabled={Boolean(editando)} value={form.email} onChange={(e) => alterar("email", e.target.value)} className={`${CAMPO} disabled:opacity-50`} />
            </div>
            {!editando && (
              <div>
                <label htmlFor="senha" className={ROTULO}>Senha temporária (opcional)</label>
                <input id="senha" type="password" autoComplete="new-password" placeholder="Em branco: gera um link" value={form.senha} onChange={(e) => alterar("senha", e.target.value)} className={CAMPO} />
              </div>
            )}
            <div>
              <label htmlFor="perfil" className={ROTULO}>Perfil de acesso</label>
              <select id="perfil" disabled={editando?.principal} value={form.perfil} onChange={(e) => escolherPerfil(e.target.value)} className={`${SELETOR} disabled:opacity-50`}>
                {Object.keys(opcoes.perfis).map((perfil) => <option key={perfil} value={perfil}>{perfil}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="vendedor" className={ROTULO}>Vendedor vinculado</label>
              <select id="vendedor" value={form.vendedor_id} onChange={(e) => alterar("vendedor_id", e.target.value)} className={SELETOR}>
                <option value="">Nenhum</option>
                {opcoes.vendedores.map((vendedor) => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={ROTULO}>Permissões</legend>
            {ehAdministrador ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">O Administrador acessa tudo o que a licença libera.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {opcoesDePermissao.map(({ slug, nome }) => (
                  <label key={slug} className="flex items-center gap-3 min-h-11 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-sm cursor-pointer">
                    <input type="checkbox" checked={form.permissoes.includes(slug)} onChange={() => alternarPermissao(slug)} className="w-4 h-4 accent-purple-600" />
                    {nome}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-black/[0.06] dark:border-white/[0.07]">
          <button type="button" onClick={aoFechar} className={BOTAO_SECUNDARIO}>Cancelar</button>
          <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>{editando ? "Salvar" : "Criar usuário"}</button>
        </div>
      </form>
    </div>
  );
}

function AbaUsuarios({ opcoes }) {
  const [usuarios, setUsuarios] = useState(null);
  const [modal, setModal] = useState(null);
  const [linkGerado, setLinkGerado] = useState(null);
  const [liberacao, setLiberacao] = useState(null);

  const carregar = useCallback(async () => {
    const dados = await api("/usuarios");
    if (dados.success) setUsuarios(dados.usuarios);
    else toast.error(dados.message || "Erro ao carregar os usuários.");
  }, []);

  useEffect(() => { carregar().catch(() => toast.error("Erro de conexão.")); }, [carregar]);

  const aoSalvar = (dados) => {
    toast.success(dados.message);
    setModal(null);
    if (dados.link) setLinkGerado(dados);
    carregar();
  };

  const alternarBloqueio = async (usuario) => {
    const status = usuario.status === "ativo" ? "bloqueado" : "ativo";
    const dados = await api(`/usuarios/${usuario.id}/status`, { metodo: "PUT", corpo: { status } });
    if (dados.success) { toast.success(dados.message); carregar(); } else toast.error(dados.message);
  };

  const resetarSenha = async (usuario) => {
    const dados = await api(`/usuarios/${usuario.id}/resetar-senha`, { metodo: "POST", corpo: {} });
    if (dados.success) setLinkGerado(dados); else toast.error(dados.message);
  };

  const liberarAcesso = async (usuario) => {
    const dados = await api(`/usuarios/${usuario.id}/liberar-acesso`, { metodo: "POST", corpo: {} });
    if (dados.success) setLiberacao({ ...dados, nome: usuario.nome }); else toast.error(dados.message);
  };

  if (!usuarios) return <Carregando />;

  return (
    <>
      <div className="flex justify-end">
        <button type="button" onClick={() => setModal({})} className={BOTAO_PRIMARIO}><Plus size={16} /> Novo usuário</button>
      </div>

      <ul className={`${VIDRO} divide-y divide-black/[0.06] dark:divide-white/[0.06] overflow-hidden`}>
        {usuarios.map((usuario) => (
          <li key={usuario.id} className="flex flex-wrap items-center gap-3 p-4">
            <Avatar nome={usuario.nome} tamanho={40} />
            <div className="min-w-[180px] flex-1">
              <p className="font-semibold truncate">{usuario.nome} {usuario.status !== "ativo" && <span className="ml-1 text-xs font-semibold text-rose-600 dark:text-rose-400">Bloqueado</span>}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{usuario.email}</p>
            </div>
            <div className="min-w-[140px]">
              <p className="text-sm font-medium">{usuario.perfil}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Último acesso: {dataHora(usuario.ultimo_acesso)}</p>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => setModal({ editando: usuario })} aria-label={`Editar ${usuario.nome}`} title="Editar" className="p-2 rounded-lg text-zinc-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"><Pencil size={16} /></button>
              <button type="button" onClick={() => resetarSenha(usuario)} aria-label={`Resetar a senha de ${usuario.nome}`} title="Resetar senha" className="p-2 rounded-lg text-zinc-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"><KeyRound size={16} /></button>
              <button type="button" onClick={() => liberarAcesso(usuario)} aria-label={`Gerar código de liberação para ${usuario.nome}`} title="Liberar acesso sem e-mail" className="p-2 rounded-lg text-zinc-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"><LockOpen size={16} /></button>
              {!usuario.principal && (
                <button type="button" onClick={() => alternarBloqueio(usuario)} aria-label={`${usuario.status === "ativo" ? "Bloquear" : "Desbloquear"} ${usuario.nome}`} title={usuario.status === "ativo" ? "Bloquear" : "Desbloquear"} className="p-2 rounded-lg text-zinc-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
                  {usuario.status === "ativo" ? <Ban size={16} /> : <CheckCircle size={16} />}
                </button>
              )}
            </div>
          </li>
        ))}
        {usuarios.length === 0 && <li className="p-10 text-center text-sm text-zinc-500">Nenhum usuário cadastrado.</li>}
      </ul>

      {modal && <ModalUsuario editando={modal.editando} opcoes={opcoes} aoFechar={() => setModal(null)} aoSalvar={aoSalvar} />}
      {linkGerado && <ModalLink link={linkGerado.link} emailEnviado={linkGerado.emailEnviado} aoFechar={() => setLinkGerado(null)} />}
      {liberacao && <ModalLiberacao liberacao={liberacao} aoFechar={() => setLiberacao(null)} />}
    </>
  );
}

function AbaTerminais() {
  const [dados, setDados] = useState(null);

  const carregar = useCallback(async () => {
    const resposta = await api("/usuarios/sessoes");
    if (resposta.success) setDados(resposta);
  }, []);

  useEffect(() => { carregar().catch(() => toast.error("Erro de conexão.")); }, [carregar]);

  const desconectar = async (id) => {
    const resposta = await api(`/usuarios/sessoes/${id}`, { metodo: "DELETE" });
    if (resposta.success) { toast.success(resposta.message); carregar(); } else toast.error(resposta.message);
  };

  if (!dados) return <Carregando />;

  return (
    <div className={`${VIDRO} overflow-hidden`}>
      <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.06]">{dados.sessoes.length} de {dados.terminais} terminais em uso</p>
      <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
        {dados.sessoes.map((sessao) => (
          <li key={sessao.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium truncate">{sessao.nome}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Conectado desde {dataHora(sessao.criado_em)}</p>
            </div>
            <button type="button" onClick={() => desconectar(sessao.id)} className="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400">Desconectar</button>
          </li>
        ))}
        {dados.sessoes.length === 0 && <li className="p-10 text-center text-sm text-zinc-500">Nenhum terminal conectado.</li>}
      </ul>
    </div>
  );
}

function AbaAtividade() {
  const [atividades, setAtividades] = useState(null);

  useEffect(() => {
    api("/usuarios/auditoria").then((dados) => { if (dados.success) setAtividades(dados.atividades); }).catch(() => toast.error("Erro de conexão."));
  }, []);

  if (!atividades) return <Carregando />;

  return (
    <ul className={`${VIDRO} divide-y divide-black/[0.06] dark:divide-white/[0.06] overflow-hidden`}>
      {atividades.map((item) => (
        <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 p-4 text-sm">
          <span className="min-w-0"><strong className="font-semibold">{item.usuario_nome}</strong> · {NOME_DA_ACAO[item.acao] || item.acao}{item.alvo && item.acao !== "sessao_derrubada" ? `: ${item.alvo}` : ""}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">{dataHora(item.criado_em)}</span>
        </li>
      ))}
      {atividades.length === 0 && <li className="p-10 text-center text-sm text-zinc-500">Nenhuma atividade registrada.</li>}
    </ul>
  );
}

export default function GestaoUsuarios() {
  const [aba, setAba] = useState("usuarios");
  const [opcoes, setOpcoes] = useState(null);

  useEffect(() => {
    api("/usuarios/opcoes").then((dados) => {
      if (dados.success) setOpcoes(dados);
      else toast.error(dados.message || "Sem acesso a esta tela.");
    }).catch(() => toast.error("Erro de conexão."));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Quem acessa o Raizan Core e o que cada pessoa pode ver.</p>
        <Segmentado opcoes={ABAS} valor={aba} onChange={setAba} />
      </div>

      {!opcoes ? <Carregando /> : aba === "usuarios" ? <AbaUsuarios opcoes={opcoes} /> : aba === "terminais" ? <AbaTerminais /> : <AbaAtividade />}
    </div>
  );
}
