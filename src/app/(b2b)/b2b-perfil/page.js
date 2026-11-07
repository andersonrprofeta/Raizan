"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, ChevronRight, ClipboardList, FileText, Loader2, LogOut, MapPin, Pencil, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { useCadastro } from "@/components/portal/dados";
import { chamarApi, lerUsuario, salvarUsuario, sair } from "@/components/portal/sessao";
import { Avatar, documento as formatarDocumento } from "@/components/portal/MenuDaConta";
import { Botao, Cartao, ESTILO, Esqueleto, Folha, moeda, nomeCurto } from "@/components/portal/ui";

const ENDERECO_VAZIO = { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" };
const UF_NO_FIM_DA_CIDADE = /[-(/]\s*([a-zA-Z]{2})\s*[)]?$/;

// O ERP costuma mandar a cidade como "Goiânia (GO)"
function separarCidadeEUf(cidade = "", uf = "") {
  const encontrado = cidade.match(UF_NO_FIM_DA_CIDADE);
  if (!encontrado) return { cidade, estado: uf.toUpperCase() };
  return { cidade: cidade.replace(UF_NO_FIM_DA_CIDADE, "").trim(), estado: (uf || encontrado[1]).toUpperCase() };
}

const mascaraCep = (valor) => valor.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
const mascaraTelefone = (valor) => valor.replace(/\D/g, "").slice(0, 11).replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");

function Campo({ rotulo, className = "", ...entrada }) {
  return (
    <label className={`block text-sm font-medium text-zinc-700 ${className}`}>
      {rotulo}
      <input {...entrada} className="mt-1.5 h-12 w-full rounded-xl border border-black/10 bg-white px-3.5 text-base font-normal text-zinc-900 outline-none focus:border-violet-500" />
    </label>
  );
}

function FormularioDeEndereco({ inicial, telefoneInicial, onFechar, onSalvo }) {
  const [endereco, setEndereco] = useState(inicial);
  const [telefone, setTelefone] = useState(telefoneInicial);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const mudar = (campo, valor) => setEndereco((atual) => ({ ...atual, [campo]: valor }));

  const digitarCep = async (valor) => {
    const cep = mascaraCep(valor);
    mudar("cep", cep);
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) return;

    setBuscandoCep(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const dados = await resposta.json();
      if (dados.erro) toast.error("CEP não encontrado.");
      else {
        setEndereco((atual) => ({ ...atual, logradouro: dados.logradouro, bairro: dados.bairro, cidade: dados.localidade, estado: dados.uf.toUpperCase() }));
        document.getElementById("campo-numero")?.focus();
      }
    } catch (erro) {
      toast.error("Não foi possível buscar o CEP. Preencha o endereço à mão.");
    }
    setBuscandoCep(false);
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    const usuario = lerUsuario();
    setSalvando(true);
    try {
      const resposta = await chamarApi("/api/hub/clientes/b2b-atualizar", {
        metodo: "POST",
        corpo: { nome: usuario.nome, email: usuario.email, cpf_cnpj: usuario.cnpj, telefone, endereco },
      });
      if (resposta.success) {
        salvarUsuario({ ...usuario, telefone, endereco });
        toast.success("Endereço salvo");
        onSalvo({ telefone, endereco });
      } else toast.error(resposta.message || "Não foi possível salvar.");
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    }
    setSalvando(false);
  };

  return (
    <Folha aberta onFechar={onFechar} titulo="Endereço de entrega" rodape={<Botao type="submit" form="formulario-endereco" className="w-full" carregando={salvando}>Salvar</Botao>}>
      <form id="formulario-endereco" onSubmit={salvar} className="grid grid-cols-6 gap-3">
        <Campo className="col-span-6" rotulo="Celular ou WhatsApp" type="tel" inputMode="tel" autoComplete="tel" required placeholder="(00) 00000-0000" value={telefone} onChange={(evento) => setTelefone(mascaraTelefone(evento.target.value))} />
        <div className="relative col-span-6">
          <Campo rotulo="CEP" inputMode="numeric" autoComplete="postal-code" required placeholder="00000-000" value={endereco.cep} onChange={(evento) => digitarCep(evento.target.value)} />
          {buscandoCep && <Loader2 size={18} className="absolute right-3.5 top-[42px] animate-spin text-violet-600" />}
        </div>
        <Campo className="col-span-6" rotulo="Rua ou avenida" required value={endereco.logradouro} onChange={(evento) => mudar("logradouro", evento.target.value)} />
        <Campo id="campo-numero" className="col-span-2" rotulo="Número" required value={endereco.numero} onChange={(evento) => mudar("numero", evento.target.value)} />
        <Campo className="col-span-4" rotulo="Complemento" value={endereco.complemento} onChange={(evento) => mudar("complemento", evento.target.value)} />
        <Campo className="col-span-6" rotulo="Bairro" required value={endereco.bairro} onChange={(evento) => mudar("bairro", evento.target.value)} />
        <Campo className="col-span-4" rotulo="Cidade" required value={endereco.cidade} onChange={(evento) => mudar("cidade", evento.target.value)} />
        <Campo className="col-span-2" rotulo="UF" required maxLength={2} value={endereco.estado} onChange={(evento) => mudar("estado", evento.target.value.toUpperCase())} />
      </form>
    </Folha>
  );
}

function Atalho({ href, Icone, children, detalhe }) {
  return (
    <Link href={href} className="flex min-h-[60px] items-center gap-3 px-4 transition-colors hover:bg-black/[0.02]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-black/[0.04] text-zinc-600"><Icone size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-zinc-900">{children}</span>
        {detalhe && <span className="block text-xs text-zinc-500">{detalhe}</span>}
      </span>
      <ChevronRight size={18} className="text-zinc-300" />
    </Link>
  );
}

function Dado({ rotulo, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-[13px] text-zinc-500">{rotulo}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-zinc-900 sm:text-right">{children}</dd>
    </div>
  );
}

export default function Conta() {
  const [usuario] = useState(lerUsuario);
  const { dados: cadastro, recarregar } = useCadastro();
  const [perfil, setPerfil] = useState(null);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await chamarApi(`/api/hub/clientes/b2b-perfil?cnpj=${usuario.cnpj}`);
        const endereco = dados.endereco || {};
        setPerfil({
          telefone: dados.telefone || "",
          endereco: { ...ENDERECO_VAZIO, ...endereco, ...separarCidadeEUf(endereco.cidade, endereco.estado || endereco.uf) },
        });
      } catch (erro) {
        setPerfil({ telefone: "", endereco: ENDERECO_VAZIO });
      }
    };
    carregar();
  }, [usuario.cnpj]);

  const endereco = perfil?.endereco;
  const limite = cadastro?.limite || 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-zinc-950 p-5 text-white md:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-600/40 blur-[80px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar nome={usuario.nome} grande />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{nomeCurto(usuario.nome, 5)}</h1>
            <p className="mt-0.5 text-sm tabular-nums text-zinc-400">{formatarDocumento(usuario.cnpj)}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 sm:self-center">
            <BadgeCheck size={15} /> Conta verificada
          </span>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-5">
          <Cartao className="px-5 pb-2 pt-5">
            <h2 className="flex items-center gap-2.5 text-base font-bold text-zinc-900">
              <span className={`${ESTILO.tile} flex h-8 w-8 items-center justify-center rounded-[10px]`}><Building2 size={16} /></span>
              Dados da empresa
            </h2>
            <dl className="mt-2 divide-y divide-black/5">
              <Dado rotulo="Razão social">{String(usuario.nome || "").replace(/^[\d.\-/\s]+/, "")}</Dado>
              <Dado rotulo="Documento"><span className="tabular-nums">{formatarDocumento(usuario.cnpj)}</span></Dado>
              <Dado rotulo="E-mail de acesso">{usuario.email}</Dado>
            </dl>
            <p className="pb-3 text-xs text-zinc-400">Para mudar estes dados, fale com seu representante.</p>
          </Cartao>

          <Cartao className="p-5">
            <div id="endereco" className="flex scroll-mt-28 items-start justify-between gap-3">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-zinc-900">
                <span className={`${ESTILO.tile} flex h-8 w-8 items-center justify-center rounded-[10px]`}><MapPin size={16} /></span>
                Endereço de entrega
              </h2>
              <button type="button" disabled={!perfil} onClick={() => setEditando(true)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3.5 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50">
                <Pencil size={14} /> {endereco?.cep ? "Editar" : "Preencher"}
              </button>
            </div>
            {!perfil && <Esqueleto className="mt-4 h-16 w-full" />}
            {perfil && (endereco.cep ? (
              <div className="mt-4 rounded-2xl bg-black/[0.03] p-4 text-sm leading-relaxed text-zinc-700">
                <p className="font-semibold text-zinc-900">{endereco.logradouro}, {endereco.numero}{endereco.complemento ? ` - ${endereco.complemento}` : ""}</p>
                <p>{endereco.bairro} · {endereco.cidade} - {endereco.estado} · CEP {endereco.cep}</p>
                {perfil.telefone && <p className="tabular-nums">Contato {perfil.telefone}</p>}
              </div>
            ) : <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">Falta preencher para receber pedidos.</p>)}
          </Cartao>
        </div>

        <div className="space-y-5">
          <Cartao className="p-5">
            <p className="text-[13px] text-zinc-500">Disponível para comprar</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">{limite > 0 ? moeda(Math.max(0, limite - (cadastro?.emAberto || 0))) : "Sob consulta"}</p>
            {limite > 0 && <p className="mt-1 text-xs text-zinc-500">Limite de {moeda(limite)} · {moeda(cadastro?.emAberto)} em aberto</p>}
          </Cartao>

          <Cartao className="divide-y divide-black/5 overflow-hidden">
            <Atalho href="/b2b-historico" Icone={ClipboardList} detalhe="Acompanhe e repita pedidos">Pedidos</Atalho>
            <Atalho href="/b2b-financeiro" Icone={Wallet} detalhe="Compras e contas em aberto">Financeiro</Atalho>
            <Atalho href="/b2b-xml" Icone={FileText} detalhe="Baixe notas e boletos">Notas e boletos</Atalho>
            <button type="button" onClick={sair} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center"><LogOut size={17} /></span>
              Sair da conta
            </button>
          </Cartao>
        </div>
      </div>

      {editando && (
        <FormularioDeEndereco
          inicial={endereco}
          telefoneInicial={perfil.telefone}
          onFechar={() => setEditando(false)}
          onSalvo={(novoPerfil) => {
            setPerfil(novoPerfil);
            setEditando(false);
            recarregar();
          }}
        />
      )}
    </div>
  );
}
