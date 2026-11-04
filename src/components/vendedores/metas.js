"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Layers, Pencil, Plus, Target } from "lucide-react";
import toast from "react-hot-toast";
import { ModalReplicar } from "@/components/vendedores/EquipeMetas";
import { nomeDoMes } from "@/components/vendedores/SeletorMes";
import {
  api, BarraProgresso, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio, lerMoeda,
  mascaraMoeda, moeda, Modal, ROTULO, Segmentado, valorParaMascara, VIDRO
} from "@/components/vendedores/ui";

function CampoValor({ valor, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">R$</span>
      <input inputMode="numeric" placeholder="0,00" value={valor} onChange={(e) => onChange(mascaraMoeda(e.target.value))} className={`${CAMPO} pl-10 tabular-nums`} />
    </div>
  );
}

function ModalNovaMeta({ vendedor, competencia, marcasDisponiveis, onFechar, onSalvo }) {
  const [tipo, setTipo] = useState("Geral");
  const [marca, setMarca] = useState("");
  const [valor, setValor] = useState("");
  const [paraTodos, setParaTodos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (lerMoeda(valor) <= 0) return toast.error("Digite o valor da meta.");
    if (tipo === "Marca" && !marca) return toast.error("Selecione a marca.");

    setSalvando(true);
    try {
      const data = await api("/metas/criar", {
        metodo: "POST",
        corpo: { vendedor_id: vendedor.id, tipo, marca: tipo === "Marca" ? marca : null, valor_alvo: lerMoeda(valor), replicar_todos: paraTodos, ...competencia }
      });
      if (!data.success) {
        toast.error(data.message || "Erro ao salvar.");
        setSalvando(false);
        return;
      }
      toast.success(paraTodos ? "Meta aplicada para toda a equipe." : "Meta cadastrada.");
      onSalvo();
    } catch (erro) {
      toast.error("Falha de conexão.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo={`Meta de ${nomeDoMes(competencia)}`}
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>Salvar meta</button>
      </>}
    >
      <div className="space-y-4">
        <Segmentado opcoes={[{ id: "Geral", rotulo: "Geral" }, { id: "Marca", rotulo: "Por marca" }]} valor={tipo} onChange={setTipo} />
        {tipo === "Marca" && (
          <div>
            <label className={ROTULO}>Marca</label>
            <select value={marca} onChange={(e) => setMarca(e.target.value)} className={CAMPO}>
              <option value="">Selecione</option>
              {marcasDisponiveis.map((m) => <option key={m.id ?? m.nome} value={m.nome}>{m.nome}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={ROTULO}>Valor</label>
          <CampoValor valor={valor} onChange={setValor} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={paraTodos} onChange={(e) => setParaTodos(e.target.checked)} className="w-4 h-4 accent-purple-600" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Aplicar para toda a equipe</span>
        </label>
      </div>
    </Modal>
  );
}

function ModalEditarMeta({ meta, onFechar, onSalvo }) {
  const [valor, setValor] = useState(valorParaMascara(meta.alvo));
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (lerMoeda(valor) <= 0) return toast.error("Digite o novo valor.");
    setSalvando(true);
    try {
      const data = await api("/metas/editar", { metodo: "PUT", corpo: { meta_id: meta.id, valor_alvo: lerMoeda(valor) } });
      if (!data.success) throw new Error();
      toast.success("Meta atualizada.");
      onSalvo();
    } catch (erro) {
      toast.error("Não foi possível atualizar a meta.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo="Editar meta"
      descricao={meta.tipo === "Geral" ? "Meta geral" : meta.nome}
      largura="max-w-sm"
      onFechar={onFechar}
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>Salvar</button>
      </>}
    >
      <label className={ROTULO}>Valor</label>
      <CampoValor valor={valor} onChange={setValor} />
    </Modal>
  );
}

export default function TabMetas({ vendedor, competencia }) {
  const { mes, ano } = competencia;
  const [metas, setMetas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null);
  const ultimaBusca = useRef(0);

  // Trocar de mês rápido não pode deixar as metas de um mês na tela de outro
  const carregar = useCallback(async () => {
    const busca = ++ultimaBusca.current;
    setCarregando(true);
    try {
      const data = await api(`/metas?vendedor_id=${vendedor.id}&mes=${mes}&ano=${ano}`);
      if (busca !== ultimaBusca.current) return;
      if (!data.success) throw new Error();
      setMetas(data.metas || []);
    } catch (erro) {
      if (busca !== ultimaBusca.current) return;
      setMetas([]);
      toast.error("Erro ao carregar as metas do mês.");
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  }, [vendedor.id, mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    api("/marcas").then((data) => { if (data.success) setMarcas(data.marcas || []); }).catch(() => {});
  }, []);

  const aoSalvar = () => { setModal(null); carregar(); };
  const marcasDisponiveis = marcas.filter((marca) => !metas.some((meta) => meta.tipo === "Marca" && meta.nome === marca.nome));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => setModal({ tipo: "replicar" })} className={BOTAO_SECUNDARIO}><Copy size={15} /> Replicar mês anterior</button>
        <button type="button" onClick={() => setModal({ tipo: "nova" })} className={BOTAO_PRIMARIO}><Plus size={16} /> Nova meta</button>
      </div>

      {carregando && metas.length === 0 ? (
        <Carregando texto="Buscando metas..." />
      ) : metas.length === 0 ? (
        <div className={VIDRO}>
          <EstadoVazio icone={Target} titulo={`Sem metas em ${nomeDoMes(competencia)}`} texto="Crie uma nova meta ou replique as do mês anterior." />
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${carregando ? "opacity-50" : ""}`}>
          {metas.map((meta) => {
            const percentual = meta.alvo > 0 ? (meta.realizado / meta.alvo) * 100 : 0;
            const Icone = meta.tipo === "Geral" ? Target : Layers;
            return (
              <article key={meta.id} className={`${VIDRO} p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-[13px] flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400"><Icone size={18} /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">{meta.tipo === "Geral" ? "Meta geral" : "Marca"}</p>
                      <h3 className="font-semibold tracking-tight truncate">{meta.tipo === "Geral" ? "Faturamento" : meta.nome}</h3>
                    </div>
                  </div>
                  <button type="button" onClick={() => setModal({ tipo: "editar", meta })} aria-label={`Editar meta ${meta.nome}`} className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"><Pencil size={14} /></button>
                </div>
                <div className="flex items-baseline justify-between gap-3 mt-5 mb-2">
                  <p className="text-[22px] leading-none font-semibold tracking-tight tabular-nums truncate">{moeda(meta.realizado)}</p>
                  <p className={`text-sm font-semibold tabular-nums ${percentual >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>{percentual.toFixed(1)}%</p>
                </div>
                <BarraProgresso percentual={percentual} />
                <p className="text-xs text-zinc-500 mt-2 tabular-nums">Meta de {moeda(meta.alvo)}</p>
              </article>
            );
          })}
        </div>
      )}

      {modal?.tipo === "nova" && <ModalNovaMeta vendedor={vendedor} competencia={competencia} marcasDisponiveis={marcasDisponiveis} onFechar={() => setModal(null)} onSalvo={aoSalvar} />}
      {modal?.tipo === "editar" && <ModalEditarMeta meta={modal.meta} onFechar={() => setModal(null)} onSalvo={aoSalvar} />}
      {modal?.tipo === "replicar" && <ModalReplicar competencia={competencia} vendedor={vendedor} onFechar={() => setModal(null)} onReplicado={aoSalvar} />}
    </div>
  );
}
