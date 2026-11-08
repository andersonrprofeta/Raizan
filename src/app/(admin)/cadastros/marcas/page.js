"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Package, Plus, Search, Tag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getHeaders, getHubUrl } from "@/components/utils/api";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, EstadoVazio, Kpi, Modal, ROTULO, Segmentado, VIDRO } from "@/components/vendedores/ui";

const ENDERECO = `${getHubUrl()}/api/hub/marcas`;
const TAMANHO_MAXIMO = 300 * 1024;

const FILTROS = [
  { id: "todas", rotulo: "Todas" },
  { id: "com_logo", rotulo: "Com logo" },
  { id: "sem_logo", rotulo: "Sem logo" },
  { id: "inativas", rotulo: "Inativas" },
];

const iniciais = (nome) => String(nome || "?").trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function chamar(caminho, { metodo = "GET", corpo } = {}) {
  const resposta = await fetch(`${ENDERECO}${caminho}`, { method: metodo, headers: getHeaders(), body: corpo ? JSON.stringify(corpo) : undefined });
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok || !json.success) throw new Error(json.message || "Não foi possível concluir.");
  return json;
}

function LogoDaMarca({ marca, tamanho = 56 }) {
  const estilo = { width: tamanho, height: tamanho, borderRadius: tamanho * 0.3 };
  if (marca.logo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={marca.logo_url} alt={marca.nome} style={estilo} className="shrink-0 bg-white object-contain p-1.5 ring-1 ring-black/[0.06] dark:ring-white/10" />;
  }
  return (
    <div style={{ ...estilo, fontSize: tamanho * 0.32 }} className="flex shrink-0 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 font-semibold text-zinc-500 ring-1 ring-black/[0.04] dark:from-white/[0.08] dark:to-white/[0.03] dark:text-zinc-400 dark:ring-white/10">
      {iniciais(marca.nome)}
    </div>
  );
}

// Escolher a logo: só WEBP até 300 KB. A conferência é feita aqui e de novo na API.
function EnviarLogo({ url, onChange }) {
  const entrada = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const enviar = async (arquivo) => {
    if (!arquivo) return;
    if (arquivo.type !== "image/webp" && !arquivo.name.toLowerCase().endsWith(".webp")) return toast.error("A logo precisa ser .webp.");
    if (arquivo.size > TAMANHO_MAXIMO) return toast.error(`A logo tem ${kb(arquivo.size)}. O máximo é 300 KB.`);
    setEnviando(true);
    try {
      const dados = new FormData();
      dados.append("logo", arquivo);
      const { "Content-Type": _tipo, ...cabecalhos } = getHeaders();
      const resposta = await fetch(`${ENDERECO}/logo`, { method: "POST", headers: cabecalhos, body: dados });
      const json = await resposta.json();
      if (!json.success) throw new Error(json.message);
      onChange(json.url);
    } catch (erro) {
      toast.error(erro.message || "Não foi possível enviar a logo.");
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  return (
    <div>
      <span className={ROTULO}>Logo da marca</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); enviar(e.dataTransfer.files?.[0]); }}
        className={`flex items-center gap-4 rounded-2xl border border-dashed p-4 transition-colors ${arrastando ? "border-purple-500 bg-purple-500/5" : "border-black/[0.12] dark:border-white/[0.12]"}`}
      >
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] dark:bg-white/[0.06] dark:ring-white/10">
          {enviando ? <Loader2 size={20} className="animate-spin text-purple-500" />
            // eslint-disable-next-line @next/next/no-img-element
            : url ? <img src={url} alt="Logo" className="h-full w-full object-contain p-2" />
            : <ImagePlus size={22} className="text-zinc-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => entrada.current?.click()} disabled={enviando} className="h-9 rounded-full bg-black/[0.05] px-4 text-sm font-semibold text-zinc-700 hover:bg-black/[0.08] disabled:opacity-50 dark:bg-white/[0.08] dark:text-zinc-200">{url ? "Trocar" : "Escolher arquivo"}</button>
            {url && <button type="button" onClick={() => onChange("")} className="h-9 rounded-full px-3 text-sm font-semibold text-zinc-500 hover:text-rose-600">Remover</button>}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">Somente <strong>.webp</strong>, até <strong>300 KB</strong>. Ideal: quadrada, 400 × 400 px, fundo transparente. Arraste o arquivo aqui ou clique em escolher.</p>
        </div>
        <input ref={entrada} type="file" accept="image/webp,.webp" className="hidden" onChange={(e) => enviar(e.target.files?.[0])} />
      </div>
    </div>
  );
}

function FormularioMarca({ marca, onFechar, onSalvo }) {
  const nova = !marca.id;
  const [dados, setDados] = useState({ nome: marca.nome || "", descricao: marca.descricao || "", logo_url: marca.logo_url || "", status: marca.status || "ativo" });
  const [salvando, setSalvando] = useState(false);
  const mudar = (mudanca) => setDados((atuais) => ({ ...atuais, ...mudanca }));

  const salvar = async () => {
    if (nova && !dados.nome.trim()) return toast.error("Digite o nome da marca.");
    setSalvando(true);
    try {
      if (nova) await chamar("", { metodo: "POST", corpo: dados });
      else await chamar(`/${marca.id}`, { metodo: "PUT", corpo: { descricao: dados.descricao, logo_url: dados.logo_url, status: dados.status } });
      toast.success(nova ? "Marca cadastrada!" : "Marca atualizada!");
      onSalvo();
    } catch (erro) {
      toast.error(erro.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    const aviso = marca.produtos ? `A marca ${marca.nome} tem ${marca.produtos} produto(s). Os produtos continuam com o nome da marca. Excluir mesmo assim?` : `Excluir a marca ${marca.nome}?`;
    if (!window.confirm(aviso)) return;
    setSalvando(true);
    try {
      await chamar(`/${marca.id}`, { metodo: "DELETE" });
      toast.success("Marca excluída.");
      onSalvo();
    } catch (erro) {
      toast.error(erro.message);
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo={nova ? "Nova marca" : marca.nome}
      descricao={nova ? "A logo aparece na loja virtual, na lista de marcas." : `${marca.produtos || 0} produto(s) com esta marca`}
      onFechar={onFechar}
      largura="max-w-lg"
      rodape={(
        <>
          {!nova && <button type="button" onClick={excluir} disabled={salvando} aria-label="Excluir marca" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-40"><Trash2 size={18} /></button>}
          <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
          <button type="button" onClick={salvar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>{salvando ? <Loader2 size={16} className="animate-spin" /> : null} Salvar</button>
        </>
      )}
    >
      <div className="space-y-5 pb-2">
        <label className="block">
          <span className={ROTULO}>Nome</span>
          <input value={dados.nome} onChange={(e) => mudar({ nome: e.target.value })} disabled={!nova} maxLength={100} placeholder="Ex.: Payot" className={`${CAMPO} disabled:opacity-60`} autoFocus={nova} />
          {!nova && <span className="mt-1.5 block text-xs text-zinc-500">O nome vem do cadastro dos produtos (ERP), por isso não muda aqui.</span>}
        </label>
        <EnviarLogo url={dados.logo_url} onChange={(logo_url) => mudar({ logo_url })} />
        <label className="block">
          <span className={ROTULO}>Descrição (opcional)</span>
          <textarea value={dados.descricao} onChange={(e) => mudar({ descricao: e.target.value })} maxLength={300} rows={3} placeholder="Uma frase sobre a marca" className={`${CAMPO} h-auto resize-none py-3`} />
        </label>
        {!nova && (
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.04]">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Marca ativa</p>
              <p className="text-xs text-zinc-500">Inativa fica guardada, só sai das listas de escolha.</p>
            </div>
            <button type="button" role="switch" aria-checked={dados.status !== "inativo"} aria-label="Marca ativa" onClick={() => mudar({ status: dados.status === "inativo" ? "ativo" : "inativo" })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${dados.status !== "inativo" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}>
              <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${dados.status !== "inativo" ? "translate-x-5" : ""}`} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function MarcasPage() {
  const [marcas, setMarcas] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [aberta, setAberta] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const json = await chamar("");
      setMarcas(json.marcas);
    } catch (erro) {
      toast.error(erro.message);
      setMarcas([]);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (marcas || []).filter((marca) => {
      if (termo && !String(marca.nome).toLowerCase().includes(termo)) return false;
      if (filtro === "com_logo") return Boolean(marca.logo_url);
      if (filtro === "sem_logo") return !marca.logo_url;
      if (filtro === "inativas") return marca.status === "inativo";
      return true;
    });
  }, [marcas, busca, filtro]);

  const totais = useMemo(() => ({
    marcas: marcas?.length || 0,
    comLogo: (marcas || []).filter((marca) => marca.logo_url).length,
    produtos: (marcas || []).reduce((soma, marca) => soma + (marca.produtos || 0), 0),
  }), [marcas]);

  return (
    <CascaPagina>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">Marcas</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">As marcas dos seus produtos, com a logo que aparece na loja virtual.</p>
        </div>
        <button type="button" onClick={() => setAberta({})} className={BOTAO_PRIMARIO}><Plus size={16} /> Nova marca</button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Kpi rotulo="Marcas" valor={totais.marcas} />
        <Kpi rotulo="Com logo" valor={totais.comLogo} detalhe={totais.marcas ? `${Math.round((totais.comLogo / totais.marcas) * 100)}% das marcas` : null} />
        <Kpi rotulo="Produtos" valor={totais.produtos.toLocaleString("pt-BR")} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar marca" aria-label="Buscar marca" className={`${CAMPO} pl-10`} />
        </div>
        <Segmentado opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
      </div>

      {!marcas ? (
        <div className={VIDRO}><Carregando texto="Carregando marcas..." /></div>
      ) : visiveis.length === 0 ? (
        <div className={VIDRO}>
          <EstadoVazio icone={Tag} titulo={marcas.length ? "Nenhuma marca encontrada" : "Nenhuma marca ainda"} texto={marcas.length ? "Tente outra busca ou outro filtro." : "Cadastre a primeira ou sincronize com o ERP."}>
            {!marcas.length && <button type="button" onClick={() => setAberta({})} className={BOTAO_PRIMARIO}><Plus size={16} /> Nova marca</button>}
          </EstadoVazio>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiveis.map((marca) => (
            <button key={marca.id} type="button" onClick={() => setAberta(marca)} className={`${VIDRO} group flex items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.35)] ${marca.status === "inativo" ? "opacity-60" : ""}`}>
              <LogoDaMarca marca={marca} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-zinc-900 dark:text-white">{marca.nome}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500"><Package size={12} /> {marca.produtos || 0} produto(s)</span>
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {!marca.logo_url && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Sem logo</span>}
                  {marca.status === "inativo" && <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">Inativa</span>}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {aberta && <FormularioMarca marca={aberta} onFechar={() => setAberta(null)} onSalvo={() => { setAberta(null); carregar(); }} />}
    </CascaPagina>
  );
}
