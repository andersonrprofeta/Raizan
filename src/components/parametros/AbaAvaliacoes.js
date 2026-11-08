import { useCallback, useEffect, useState } from "react";
import { BellRing, Eye, EyeOff, Loader2, MessageSquareText, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Grupo, LinhaSwitch } from "@/components/parametros/ui";
import { getHeaders, getHubUrl } from "@/components/utils/api";
import { Segmentado, VIDRO } from "@/components/vendedores/ui";

const ENDERECO = `${getHubUrl()}/api/hub/ecommerce`;

const FILTROS = [
  { id: "todas", rotulo: "Todas" },
  { id: "publicadas", rotulo: "Publicadas" },
  { id: "ocultas", rotulo: "Ocultas" },
];

const dataCurta = (valor) => (valor ? new Date(valor).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "");

function Estrelas({ nota, tamanho = 14 }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={tamanho} className={n <= Math.round(nota) ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600"} />)}
    </span>
  );
}

function Moderacao() {
  const [filtro, setFiltro] = useState("todas");
  const [dados, setDados] = useState(null);
  const [mexendo, setMexendo] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch(`${ENDERECO}/avaliacoes?status=${filtro}`, { headers: getHeaders() });
      const json = await resposta.json();
      if (!json.success) throw new Error(json.message);
      setDados(json);
    } catch (erro) {
      setDados({ avaliacoes: [], resumo: null, erro: erro.message || "Não foi possível carregar." });
    }
  }, [filtro]);

  useEffect(() => { setDados(null); carregar(); }, [carregar]);

  const agir = async (avaliacao, metodo, corpo) => {
    setMexendo(avaliacao.id);
    try {
      const resposta = await fetch(`${ENDERECO}/avaliacoes/${avaliacao.id}`, { method: metodo, headers: { ...getHeaders(), "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined });
      const json = await resposta.json();
      if (!json.success) throw new Error(json.message);
      toast.success(metodo === "DELETE" ? "Avaliação excluída." : corpo.visivel ? "Avaliação publicada." : "Avaliação escondida.");
      await carregar();
    } catch (erro) {
      toast.error(erro.message || "Não foi possível salvar.");
    } finally {
      setMexendo(null);
    }
  };

  const excluir = (avaliacao) => {
    if (window.confirm(`Excluir a avaliação de ${avaliacao.nome}? Não dá para desfazer.`)) agir(avaliacao, "DELETE");
  };

  return (
    <section className={`${VIDRO} p-5 sm:p-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Avaliações recebidas</h3>
          {dados?.resumo ? (
            <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
              <Estrelas nota={dados.resumo.media} tamanho={12} /> {dados.resumo.media.toLocaleString("pt-BR")} de média · {dados.resumo.total} no total{dados.resumo.ocultas ? ` · ${dados.resumo.ocultas} oculta(s)` : ""}
            </p>
          ) : null}
        </div>
        <Segmentado opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
      </div>

      <div className="mt-5 space-y-3">
        {!dados ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-purple-500" /></div>
        ) : dados.erro ? (
          <p className="py-8 text-center text-sm text-zinc-500">{dados.erro}</p>
        ) : dados.avaliacoes.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04] text-zinc-400 dark:bg-white/[0.06]"><MessageSquareText size={22} /></span>
            <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nenhuma avaliação aqui</p>
            <p className="mt-1 text-xs text-zinc-500">Quando um cliente avaliar um produto na loja, ela aparece nesta lista.</p>
          </div>
        ) : dados.avaliacoes.map((avaliacao) => (
          <article key={avaliacao.id} className={`rounded-2xl border p-4 transition-opacity ${avaliacao.visivel ? "border-black/[0.06] dark:border-white/[0.08]" : "border-dashed border-black/[0.12] opacity-70 dark:border-white/[0.12]"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-zinc-400">{avaliacao.produto}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Estrelas nota={avaliacao.nota} />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{avaliacao.titulo}</span>
                  {!avaliacao.visivel && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Oculta</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {mexendo === avaliacao.id ? <Loader2 size={16} className="m-2 animate-spin text-zinc-400" /> : (
                  <>
                    <button type="button" onClick={() => agir(avaliacao, "PUT", { visivel: !avaliacao.visivel })} aria-label={avaliacao.visivel ? "Esconder avaliação" : "Publicar avaliação"} title={avaliacao.visivel ? "Esconder" : "Publicar"} className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
                      {avaliacao.visivel ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button type="button" onClick={() => excluir(avaliacao)} aria-label="Excluir avaliação" title="Excluir" className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {avaliacao.comentario ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{avaliacao.comentario}</p> : null}
            <p className="mt-2 text-xs text-zinc-400">{avaliacao.nome}{avaliacao.cliente ? " · cliente com conta" : " · sem conta"} · {dataCurta(avaliacao.data)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function EsperandoEstoque() {
  const [produtos, setProdutos] = useState(null);
  useEffect(() => {
    fetch(`${ENDERECO}/avise-me`, { headers: getHeaders() })
      .then((resposta) => resposta.json())
      .then((json) => setProdutos(json.success ? json.produtos : []))
      .catch(() => setProdutos([]));
  }, []);
  if (!produtos?.length) return null;
  return (
    <section className={`${VIDRO} p-5 sm:p-6`}>
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100"><BellRing size={17} className="text-purple-500" /> Clientes esperando estoque</h3>
      <p className="mt-1 text-xs text-zinc-500">Pediram o aviso de chegada. O e-mail sai sozinho quando o estoque voltar.</p>
      <ul className="mt-4 divide-y divide-black/[0.05] dark:divide-white/[0.06]">
        {produtos.slice(0, 20).map((produto) => (
          <li key={produto.sku} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0 truncate text-zinc-800 dark:text-zinc-200">{produto.produto}</span>
            <span className="shrink-0 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">{produto.esperando} {produto.esperando === 1 ? "pessoa" : "pessoas"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AbaAvaliacoes({ ecommerce, alterar }) {
  return (
    <div className="space-y-5">
      <Grupo titulo="Avaliações dos produtos" texto="Estrelas e comentários na página do produto e nos cards da loja.">
        <LinhaSwitch titulo="Receber avaliações" texto="Desligado, a loja não mostra estrelas nem o formulário." ligado={ecommerce.avaliacoes_ativas} onChange={(valor) => alterar({ avaliacoes_ativas: valor })} />
        <LinhaSwitch titulo="Só de clientes com conta" texto="Quem não entrou na conta vê as avaliações, mas não pode escrever." desativado={!ecommerce.avaliacoes_ativas} ligado={ecommerce.avaliacoes_so_clientes} onChange={(valor) => alterar({ avaliacoes_so_clientes: valor })} />
        <LinhaSwitch titulo="Aprovar antes de publicar" texto="A avaliação nova chega oculta e só aparece na loja depois que você publicar aqui embaixo." desativado={!ecommerce.avaliacoes_ativas} ligado={ecommerce.avaliacoes_moderar} onChange={(valor) => alterar({ avaliacoes_moderar: valor })} />
      </Grupo>
      <Moderacao />
      <EsperandoEstoque />
    </div>
  );
}
