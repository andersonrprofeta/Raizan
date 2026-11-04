"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Crown, Plus, Share2, StopCircle, Trash2, Trophy, X } from "lucide-react";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import {
  api, Avatar, BarraProgresso, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio,
  lerMoeda, mascaraMoeda, moeda, Modal, ROTULO, Segmentado, VIDRO
} from "@/components/vendedores/ui";

const dataDaValidade = (texto) => {
  const partes = String(texto || "").split("/");
  return partes.length === 3 ? new Date(`${partes[2]}-${partes[1]}-${partes[0]}`).getTime() : 0;
};

function ModalNovaCampanha({ marcas, onFechar, onCriada }) {
  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [validade, setValidade] = useState("");
  const [faixas, setFaixas] = useState([{ id: 1, meta: "", premio: "" }]);
  const [salvando, setSalvando] = useState(false);

  const mudarFaixa = (id, campo, valor) => setFaixas(faixas.map((f) => (f.id === id ? { ...f, [campo]: mascaraMoeda(valor) } : f)));

  const salvar = async () => {
    if (!nome || !validade || !faixas[0].meta) return toast.error("Preencha o nome, a data e ao menos uma faixa.");
    setSalvando(true);
    try {
      const corpo = { nome, marca, validade, faixas: faixas.map((f) => ({ meta: lerMoeda(f.meta), premio: lerMoeda(f.premio) })) };
      const data = await api("/metas/campanhas/criar", { metodo: "POST", corpo });
      if (!data.success) {
        toast.error(data.message || "Erro ao criar a campanha.");
        setSalvando(false);
        return;
      }
      toast.success("Campanha ativada.");
      onCriada();
    } catch (erro) {
      toast.error("Falha de conexão.");
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo="Nova campanha"
      descricao="Vale para toda a equipe e aparece no Raizan Seller."
      onFechar={onFechar}
      largura="max-w-xl"
      rodape={<>
        <button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando} className={`${BOTAO_PRIMARIO} flex-1`}>Ativar campanha</button>
      </>}
    >
      <div className="space-y-4">
        <div>
          <label className={ROTULO}>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Explosão NUEV" className={CAMPO} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={ROTULO}>Marca</label>
            <select value={marca} onChange={(e) => setMarca(e.target.value)} className={CAMPO}>
              <option value="">Todas as marcas</option>
              {marcas.map((m) => <option key={m.id ?? m.nome} value={m.nome}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={ROTULO}>Termina em</label>
            <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} className={CAMPO} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`${ROTULO} mb-0`}>Faixas de prêmio</span>
            <button type="button" onClick={() => setFaixas([...faixas, { id: Date.now(), meta: "", premio: "" }])} className="text-sm font-semibold text-purple-600 dark:text-purple-400">Adicionar faixa</button>
          </div>
          <div className="space-y-2">
            {faixas.map((faixa) => (
              <div key={faixa.id} className="flex items-center gap-2">
                <input inputMode="numeric" placeholder="Vendeu acima de (R$)" value={faixa.meta} onChange={(e) => mudarFaixa(faixa.id, "meta", e.target.value)} className={`${CAMPO} tabular-nums`} />
                <input inputMode="numeric" placeholder="Ganha (R$)" value={faixa.premio} onChange={(e) => mudarFaixa(faixa.id, "premio", e.target.value)} className={`${CAMPO} tabular-nums`} />
                {faixas.length > 1 && (
                  <button type="button" onClick={() => setFaixas(faixas.filter((f) => f.id !== faixa.id))} aria-label="Remover faixa" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors"><X size={15} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CartaoCampanha({ campanha, onCompartilhar, onExcluir, onEncerrar }) {
  const lider = campanha.ranking?.[0];
  const maiorValor = lider?.valor || 1;

  return (
    <article className={`${VIDRO} overflow-hidden`}>
      <div id={`campanha-card-${campanha.id}`} className="relative p-6 text-white bg-gradient-to-br from-[#2e1065] via-[#3b0764] to-[#0b0b10]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-white/70">
              <Calendar size={13} /> Até {campanha.validade}{campanha.marca ? ` · ${campanha.marca}` : ""}
            </p>
            <h3 className="mt-1.5 text-2xl font-semibold tracking-tight truncate">{campanha.nome}</h3>
          </div>
          <div className="flex gap-1.5 shrink-0" data-html2canvas-ignore="true">
            <button type="button" onClick={onCompartilhar} aria-label="Gerar imagem" title="Gerar imagem" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"><Share2 size={15} /></button>
            <button type="button" onClick={onExcluir} aria-label="Excluir campanha" title="Excluir" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-rose-500/40 transition-colors"><Trash2 size={15} /></button>
          </div>
        </div>

        {campanha.faixas?.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {campanha.faixas.map((faixa, indice) => (
              <div key={faixa.id ?? indice} className="rounded-2xl bg-white/[0.08] px-4 py-3 min-w-0">
                <p className="text-xs text-white/60 tabular-nums truncate">Acima de {moeda(faixa.meta)}</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-amber-300 truncate">Ganha {moeda(faixa.premio)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Ranking</h4>
          <button type="button" onClick={onEncerrar} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><StopCircle size={15} /> Encerrar</button>
        </div>
        <div className="space-y-3">
          {(campanha.ranking || []).slice(0, 5).map((posicao) => (
            <div key={posicao.id ?? posicao.pos} className="flex items-center gap-3">
              <span className={`w-5 text-center text-sm font-semibold tabular-nums ${posicao.pos === 1 ? "text-amber-500" : "text-zinc-400"}`}>{posicao.pos}</span>
              <Avatar nome={posicao.nome} foto={posicao.foto} tamanho={30} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-3 mb-1 text-sm">
                  <span className="font-medium truncate">{posicao.nome}</span>
                  <span className="text-zinc-500 tabular-nums whitespace-nowrap">{moeda(posicao.valor)}</span>
                </div>
                <BarraProgresso percentual={(posicao.valor / maiorValor) * 100} altura={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [visao, setVisao] = useState("ativas");
  const [criando, setCriando] = useState(false);
  const [encerrar, setEncerrar] = useState(null);
  const [excluir, setExcluir] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const [dataCampanhas, dataMarcas] = await Promise.all([api("/metas/campanhas"), api("/marcas")]);
      if (dataCampanhas.success) setCampanhas(dataCampanhas.campanhas || []);
      if (dataMarcas.success) setMarcas(dataMarcas.marcas || []);
    } catch (erro) {
      toast.error("Erro ao carregar as campanhas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const confirmarEncerrar = async () => {
    try {
      const data = await api("/metas/campanhas/encerrar", { metodo: "PUT", corpo: { campanha_id: encerrar.id } });
      if (!data.success) throw new Error();
      toast.success("Campanha encerrada.");
      setEncerrar(null);
      carregar();
    } catch (erro) { toast.error("Não foi possível encerrar."); }
  };

  const confirmarExcluir = async () => {
    try {
      const data = await api(`/metas/campanhas/${excluir.id}`, { metodo: "DELETE" });
      if (!data.success) throw new Error();
      toast.success("Campanha excluída.");
      setExcluir(null);
      carregar();
    } catch (erro) { toast.error("Não foi possível excluir."); }
  };

  const compartilhar = async (campanha) => {
    const cartao = document.getElementById(`campanha-card-${campanha.id}`);
    if (!cartao) return;
    const aviso = toast.loading("Gerando imagem...");
    try {
      const imagem = await toPng(cartao, { pixelRatio: 2, filter: (no) => no?.getAttribute?.("data-html2canvas-ignore") !== "true" });
      const link = document.createElement("a");
      link.download = `Campanha_${campanha.nome.replace(/\s+/g, "_")}.png`;
      link.href = imagem;
      link.click();
      toast.success("Imagem gerada.", { id: aviso });
    } catch (erro) { toast.error("Erro ao gerar a imagem.", { id: aviso }); }
  };

  if (carregando) return <Carregando texto="Buscando campanhas..." />;

  const ativas = campanhas.filter((c) => c.status !== "encerrada");
  const encerradas = campanhas.filter((c) => c.status === "encerrada").sort((a, b) => dataDaValidade(b.validade) - dataDaValidade(a.validade));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Segmentado
          valor={visao}
          onChange={setVisao}
          opcoes={[{ id: "ativas", rotulo: `Ativas (${ativas.length})` }, { id: "historico", rotulo: `Encerradas (${encerradas.length})` }]}
        />
        <button type="button" onClick={() => setCriando(true)} className={BOTAO_PRIMARIO}><Plus size={16} /> Nova campanha</button>
      </div>

      {visao === "ativas" ? (
        ativas.length === 0 ? (
          <div className={VIDRO}>
            <EstadoVazio icone={Trophy} titulo="Nenhuma campanha ativa" texto="Crie uma campanha para mobilizar a equipe." />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {ativas.map((campanha) => (
              <CartaoCampanha
                key={campanha.id}
                campanha={campanha}
                onCompartilhar={() => compartilhar(campanha)}
                onExcluir={() => setExcluir(campanha)}
                onEncerrar={() => setEncerrar(campanha)}
              />
            ))}
          </div>
        )
      ) : encerradas.length === 0 ? (
        <div className={VIDRO}><EstadoVazio icone={Trophy} titulo="Nenhuma campanha encerrada" /></div>
      ) : (
        <div className={`${VIDRO} divide-y divide-black/[0.05] dark:divide-white/[0.05] overflow-hidden`}>
          {encerradas.map((campanha) => {
            const vencedor = campanha.ranking?.[0];
            return (
              <div key={campanha.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{campanha.nome}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Encerrada em {campanha.validade}</p>
                </div>
                {vencedor && (
                  <div className="text-right min-w-0">
                    <p className="flex items-center justify-end gap-1.5 text-sm font-semibold truncate"><Crown size={14} className="text-amber-500 shrink-0" /> {vencedor.nome}</p>
                    <p className="text-xs text-zinc-500 tabular-nums">{moeda(vencedor.valor)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {criando && <ModalNovaCampanha marcas={marcas} onFechar={() => setCriando(false)} onCriada={() => { setCriando(false); carregar(); }} />}

      {encerrar && (
        <Modal
          titulo="Encerrar campanha?"
          descricao="Ela sai do ranking ao vivo e vai para as encerradas, com o primeiro colocado como vencedor."
          largura="max-w-sm"
          onFechar={() => setEncerrar(null)}
          rodape={<>
            <button type="button" onClick={() => setEncerrar(null)} className={`${BOTAO_SECUNDARIO} flex-1`}>Voltar</button>
            <button type="button" onClick={confirmarEncerrar} className={`${BOTAO_PRIMARIO} flex-1`}>Encerrar</button>
          </>}
        />
      )}

      {excluir && (
        <Modal
          titulo="Excluir campanha?"
          descricao="Apaga a campanha e as faixas de prêmio. Essa ação não tem volta."
          largura="max-w-sm"
          onFechar={() => setExcluir(null)}
          rodape={<>
            <button type="button" onClick={() => setExcluir(null)} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
            <button type="button" onClick={confirmarExcluir} className="flex-1 inline-flex items-center justify-center h-11 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all active:scale-95">Excluir</button>
          </>}
        />
      )}
    </div>
  );
}
