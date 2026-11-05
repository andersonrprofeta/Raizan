"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, CheckCircle, ChevronLeft, DollarSign, Key, Pencil, Target, Trash2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import TabComissoes from "@/components/vendedores/comissao";
import TabMetas from "@/components/vendedores/metas";
import TabDesempenho from "@/components/vendedores/relatorio";
import { ModalBloqueio, ModalExcluir, ModalSenha, ModalVendedor } from "@/components/vendedores/Modais";
import SeletorMes, { mesDeHoje } from "@/components/vendedores/SeletorMes";
import { api, Avatar, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, Carregando, CascaPagina, Segmentado, StatusAcesso, VIDRO } from "@/components/vendedores/ui";

const ABAS = [
  { id: "desempenho", rotulo: "Desempenho", icone: TrendingUp },
  { id: "metas", rotulo: "Metas", icone: Target },
  { id: "comissoes", rotulo: "Comissões", icone: DollarSign }
];

function PaginaVendedor() {
  const router = useRouter();
  const id = useSearchParams().get("id");

  const [vendedor, setVendedor] = useState(null);
  const [competencia, setCompetencia] = useState(mesDeHoje);
  const [aba, setAba] = useState("desempenho");
  const [abasAbertas, setAbasAbertas] = useState(["desempenho"]);
  const [modal, setModal] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const data = await api("/vendedores");
      const encontrado = (data.vendedores || []).find((v) => String(v.id) === String(id));
      if (!encontrado) throw new Error();
      setVendedor(encontrado);
    } catch (erro) {
      toast.error("Vendedor não encontrado.");
      router.push("/cadastros/vendedores");
    }
  }, [id, router]);

  useEffect(() => { carregar(); }, [carregar]);

  // Aba já aberta só fica escondida: voltar a ela não busca tudo de novo
  const trocarAba = (novaAba) => {
    setAba(novaAba);
    setAbasAbertas((abertas) => (abertas.includes(novaAba) ? abertas : [...abertas, novaAba]));
  };

  const aoSalvar = () => { setModal(null); carregar(); };

  if (!vendedor) return <Carregando texto="Abrindo vendedor..." />;

  const bloqueado = vendedor.status_app === "bloqueado";

  return (
    <>
      <Link href="/cadastros/vendedores" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <ChevronLeft size={16} /> Vendedores
      </Link>

      <section className={`${VIDRO} p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5`}>
        <div className="flex items-center gap-4 min-w-0">
          <Avatar nome={vendedor.nome} foto={vendedor.foto} tamanho={68} />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] leading-tight font-bold tracking-tight truncate">{vendedor.nome}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <StatusAcesso vendedor={vendedor} />
              <span className="text-xs text-zinc-500 truncate">{vendedor.email || "Sem e-mail"}</span>
              <span className="text-xs text-zinc-400 tabular-nums">{vendedor.manual ? "Cadastro manual" : `ERP ${vendedor.codigo_erp}`}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {vendedor.manual && (
            <button type="button" onClick={() => setModal("editar")} className={BOTAO_SECUNDARIO}><Pencil size={15} /> Editar</button>
          )}
          <button type="button" onClick={() => setModal("senha")} className={vendedor.tem_senha ? BOTAO_SECUNDARIO : BOTAO_PRIMARIO}>
            <Key size={15} /> {vendedor.tem_senha ? "Trocar senha" : "Liberar acesso"}
          </button>
          {Boolean(vendedor.tem_senha) && (
            <button type="button" onClick={() => setModal("bloqueio")} className={BOTAO_SECUNDARIO}>
              {bloqueado ? <><CheckCircle size={15} /> Liberar</> : <><Ban size={15} /> Bloquear</>}
            </button>
          )}
          <button type="button" onClick={() => setModal("excluir")} className={`${BOTAO_SECUNDARIO} !text-rose-600 dark:!text-rose-400`}><Trash2 size={15} /> Excluir</button>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Segmentado opcoes={ABAS} valor={aba} onChange={trocarAba} />
        <SeletorMes valor={competencia} onChange={setCompetencia} permitirFuturo={aba === "metas"} />
      </div>

      {abasAbertas.includes("desempenho") && <div hidden={aba !== "desempenho"}><TabDesempenho vendedor={vendedor} competencia={competencia} /></div>}
      {abasAbertas.includes("metas") && <div hidden={aba !== "metas"}><TabMetas vendedor={vendedor} competencia={competencia} /></div>}
      {abasAbertas.includes("comissoes") && <div hidden={aba !== "comissoes"}><TabComissoes vendedor={vendedor} competencia={competencia} /></div>}

      {modal === "senha" && <ModalSenha vendedor={vendedor} onFechar={() => setModal(null)} onSalvo={aoSalvar} />}
      {modal === "bloqueio" && <ModalBloqueio vendedor={vendedor} onFechar={() => setModal(null)} onSalvo={aoSalvar} />}
      {modal === "editar" && <ModalVendedor vendedor={vendedor} onFechar={() => setModal(null)} onSalvo={aoSalvar} />}
      {modal === "excluir" && <ModalExcluir vendedor={vendedor} onFechar={() => setModal(null)} onExcluido={() => router.push("/cadastros/vendedores")} />}
    </>
  );
}

export default function DetalhesVendedorPage() {
  return (
    <CascaPagina>
      <Suspense fallback={<Carregando texto="Abrindo vendedor..." />}>
        <PaginaVendedor />
      </Suspense>
    </CascaPagina>
  );
}
