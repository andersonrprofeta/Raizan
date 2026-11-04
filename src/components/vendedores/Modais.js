"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Modal, ROTULO } from "@/components/vendedores/ui";

function CampoSenha({ valor, onChange, placeholder }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <input
        type={visivel ? "text" : "password"}
        autoComplete="new-password"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={`${CAMPO} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisivel(!visivel)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        {visivel ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function ModalSenha({ vendedor, onFechar, onSalvo }) {
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (senha.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");
    setSalvando(true);
    try {
      const data = await api(`/vendedores/${vendedor.id}/senha`, { metodo: "PUT", corpo: { senha } });
      if (!data.success) throw new Error();
      toast.success(`Senha de ${vendedor.nome} atualizada.`);
      onSalvo();
    } catch (erro) {
      toast.error("Não foi possível salvar a senha.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo={vendedor.tem_senha ? "Trocar senha" : "Liberar acesso ao app"}
      descricao={`Senha que ${vendedor.nome} usa para entrar no Raizan Seller.`}
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando || !vendedor.email} className={`${BOTAO_PRIMARIO} flex-1`}>Salvar senha</button>
      </>}
    >
      <div className="space-y-4">
        <div>
          <span className={ROTULO}>Login</span>
          <p className="h-11 px-4 flex items-center rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] text-sm text-zinc-500 truncate">
            {vendedor.email || "Cadastre o e-mail antes de liberar o acesso"}
          </p>
        </div>
        <div>
          <label className={ROTULO}>Nova senha</label>
          <CampoSenha valor={senha} onChange={setSenha} placeholder="Mínimo 6 caracteres" />
        </div>
      </div>
    </Modal>
  );
}

export function ModalBloqueio({ vendedor, onFechar, onSalvo }) {
  const [salvando, setSalvando] = useState(false);
  const bloqueado = vendedor.status_app === "bloqueado";

  const confirmar = async () => {
    setSalvando(true);
    try {
      const data = await api(`/vendedores/${vendedor.id}/status`, { metodo: "PUT", corpo: { status_app: bloqueado ? "ativo" : "bloqueado" } });
      if (!data.success) throw new Error();
      toast.success(bloqueado ? "Acesso liberado." : "Acesso bloqueado.");
      onSalvo();
    } catch (erro) {
      toast.error("Não foi possível alterar o acesso.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo={bloqueado ? "Liberar acesso?" : "Bloquear acesso?"}
      descricao={bloqueado ? `${vendedor.nome} volta a entrar no Raizan Seller.` : `${vendedor.nome} deixa de entrar no Raizan Seller.`}
      onFechar={onFechar}
      largura="max-w-sm"
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button
          type="button"
          onClick={confirmar}
          disabled={salvando}
          className={bloqueado ? `${BOTAO_PRIMARIO} flex-1` : "flex-1 inline-flex items-center justify-center h-11 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-40"}
        >
          {bloqueado ? "Liberar" : "Bloquear"}
        </button>
      </>}
    />
  );
}

// Sem vendedor cadastra um novo; com vendedor, edita nome e e-mail
export function ModalVendedor({ vendedor, onFechar, onSalvo }) {
  const editando = Boolean(vendedor);
  const [nome, setNome] = useState(vendedor?.nome || "");
  const [email, setEmail] = useState(vendedor?.email || "");
  const [comissao, setComissao] = useState("5");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (nome.trim().length < 2) return toast.error("Informe o nome do vendedor.");
    if (!email.includes("@")) return toast.error("Informe um e-mail válido.");
    if (senha && senha.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");

    setSalvando(true);
    try {
      const data = editando
        ? await api(`/vendedores/${vendedor.id}`, { metodo: "PUT", corpo: { nome, email } })
        : await api("/vendedores", { metodo: "POST", corpo: { nome, email, senha, comissao: Number(comissao.replace(",", ".")) || 0 } });

      if (!data.success) {
        toast.error(data.message || "Não foi possível salvar.");
        setSalvando(false);
        return;
      }
      toast.success(editando ? "Cadastro atualizado." : "Vendedor cadastrado.");
      onSalvo();
    } catch (erro) {
      toast.error("Falha de conexão.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo={editando ? "Editar vendedor" : "Novo vendedor"}
      descricao={editando ? "Cadastro feito no painel, fora do ERP." : "Para quem não está no ERP. Ele entra na equipe e pode usar o Raizan Seller."}
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>{editando ? "Salvar" : "Cadastrar"}</button>
      </>}
    >
      <div className="space-y-4">
        <div>
          <label className={ROTULO}>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className={CAMPO} autoFocus />
        </div>
        <div>
          <label className={ROTULO}>E-mail (login do app)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendedor@email.com" className={CAMPO} />
        </div>
        {!editando && (
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div>
              <label className={ROTULO}>Comissão (%)</label>
              <input inputMode="decimal" value={comissao} onChange={(e) => setComissao(e.target.value.replace(/[^0-9.,]/g, ""))} className={CAMPO} />
            </div>
            <div>
              <label className={ROTULO}>Senha do app (opcional)</label>
              <CampoSenha valor={senha} onChange={setSenha} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
