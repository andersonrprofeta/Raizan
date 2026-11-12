"use client";

// Montagem do romaneio: transportadora, motorista, veículo e o peso/volumes de cada pedido.
// Jeito rápido (doca): o conferente chega com a pilha de mapas de separação e vai digitando o nº do pedido,
// o nº da NF-e ou bipando a chave do DANFE + Enter. Cada pedido entra na lista e os volumes vão somando.
// "Gerar romaneio" registra AGORA a coleta de todos os pedidos (hora da coleta).

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, CornerDownLeft, Loader2, Save, ScanLine, Truck, X } from "lucide-react";
import { api, BOTAO_SECUNDARIO, CAMPO, Modal, ROTULO, moeda } from "@/components/vendedores/ui";
import { BOTAO, nomeDaTransportadora, numeroNfe, peso } from "@/components/transportadora/ui";

const maisComum = (lista) => {
  const contagem = new Map();
  lista.forEach((id) => id && contagem.set(id, (contagem.get(id) || 0) + 1));
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
};
const numeroDigitado = (texto) => {
  if (texto === "" || texto === null || texto === undefined) return null;
  const n = Number(String(texto).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const paraLista = (e) => ({ ...e, peso_texto: e.peso_bruto ?? "", volumes_texto: e.volumes ?? "" });
const semZeros = (texto) => String(texto ?? "").replace(/\D/g, "").replace(/^0+/, "");

// O mesmo pedido digitado de novo (pelo nº do pedido, da NF-e ou pela chave) não entra duas vezes
function jaNaLista(lista, codigo) {
  const limpo = String(codigo).trim();
  const digitos = limpo.replace(/\D/g, "");
  const nfeDaChave = digitos.length === 44 ? String(Number(digitos.slice(25, 34))) : null;
  return lista.find((e) =>
    (digitos.length === 44 && e.nfe_chave === digitos)
    || (e.numero_pedido && String(e.numero_pedido) === limpo)
    || (e.nfe_numero && semZeros(e.nfe_numero) === (nfeDaChave || semZeros(limpo)) && semZeros(limpo) !== "")
  );
}

// Bipe curto: o conferente olha para a pilha de papéis, não para a tela
function bipar(ok) {
  try {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    const contexto = new Contexto();
    const oscilador = contexto.createOscillator();
    const volume = contexto.createGain();
    oscilador.frequency.value = ok ? 880 : 220;
    volume.gain.value = 0.06;
    oscilador.connect(volume).connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + (ok ? 0.08 : 0.25));
    oscilador.onended = () => contexto.close();
  } catch (erro) { /* sem som, segue */ }
}

export function ModalRomaneio({ expedicoes = [], romaneio = null, transportadoras, onFechar, onSalvo }) {
  const editando = Boolean(romaneio);
  const [lista, setLista] = useState(() => expedicoes.map(paraLista));
  const [form, setForm] = useState({
    transportadora_id: romaneio?.transportadora_id || maisComum(expedicoes.map((e) => e.transportadora_id)),
    motorista: romaneio?.motorista || "", motorista_documento: romaneio?.motorista_documento || "",
    veiculo: romaneio?.veiculo || "", placa: romaneio?.placa || "", uf_placa: romaneio?.uf_placa || "", observacao: romaneio?.observacao || "",
  });
  const [salvando, setSalvando] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [procurando, setProcurando] = useState(false);
  const [leitura, setLeitura] = useState(null); // { tipo: 'ok' | 'erro', texto } da última leitura
  const [opcoes, setOpcoes] = useState(null); // mais de um pedido com o mesmo número
  const [destaque, setDestaque] = useState(null);
  const leitor = useRef(null);

  useEffect(() => { leitor.current?.focus(); }, []);

  const ativas = transportadoras.filter((t) => t.situacao === "ativa" || t.id === Number(form.transportadora_id));
  const totais = useMemo(() => lista.reduce((t, e) => ({
    peso: t.peso + (numeroDigitado(e.peso_texto) || 0), volumes: t.volumes + (numeroDigitado(e.volumes_texto) || 0), valor: t.valor + e.valor_total,
  }), { peso: 0, volumes: 0, valor: 0 }), [lista]);
  const outrasTransportadoras = lista.filter((e) => e.transportadora_id && form.transportadora_id && e.transportadora_id !== Number(form.transportadora_id)).length;
  const semVolumes = lista.filter((e) => !numeroDigitado(e.volumes_texto)).length;

  const mudar = (id, campo, valor) => setLista((atual) => atual.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));

  const incluir = (e) => {
    setLista((atual) => (atual.some((x) => x.id === e.id) ? atual : [paraLista(e), ...atual]));
    setForm((f) => (f.transportadora_id || !e.transportadora_id ? f : { ...f, transportadora_id: e.transportadora_id }));
    setDestaque(e.id);
    setOpcoes(null);
    setLeitura({ tipo: "ok", texto: `Pedido ${e.numero_pedido || e.id} · ${e.cliente_nome || "Cliente"} · ${e.volumes ? `${e.volumes} vol.` : "sem volumes (digite abaixo)"}` });
    bipar(true);
  };

  const ler = async () => {
    const digitado = codigo.trim();
    if (!digitado || procurando) return;
    const repetido = jaNaLista(lista, digitado);
    if (repetido) {
      setLeitura({ tipo: "erro", texto: `Pedido ${repetido.numero_pedido || repetido.id} já está na lista.` });
      setDestaque(repetido.id);
      setCodigo("");
      bipar(false);
      return;
    }
    setProcurando(true);
    try {
      const r = await api(`/logistica/expedicoes/localizar?codigo=${encodeURIComponent(digitado)}`);
      if (r.opcoes) {
        const novas = r.opcoes.filter((e) => !lista.some((x) => x.id === e.id));
        if (novas.length === 1) incluir(novas[0]);
        else { setOpcoes(novas); setLeitura({ tipo: "erro", texto: r.message }); bipar(false); }
      } else if (r.success && r.expedicao) {
        incluir(r.expedicao);
      } else {
        setLeitura({ tipo: "erro", texto: r.message || "Pedido não encontrado." });
        bipar(false);
      }
    } catch (erro) {
      setLeitura({ tipo: "erro", texto: "Sem conexão com o servidor." });
    } finally {
      setProcurando(false);
      setCodigo("");
      leitor.current?.focus();
    }
  };

  const enviar = async (soSalvar) => {
    if (!form.transportadora_id) { toast.error("Escolha a transportadora."); return; }
    if (lista.length === 0) { toast.error("O romaneio precisa de ao menos um pedido."); leitor.current?.focus(); return; }
    setSalvando(soSalvar ? "salvar" : "gerar");
    // A lista mostra o último lido no topo; o romaneio guarda na ordem em que foram lidos
    const naOrdem = [...lista].reverse();
    const corpo = {
      ...form,
      transportadora_id: Number(form.transportadora_id),
      expedicoes: naOrdem.map((e) => e.id),
      itens: naOrdem.map((e) => ({ expedicao_id: e.id, peso_bruto: numeroDigitado(e.peso_texto), volumes: numeroDigitado(e.volumes_texto) })),
    };
    try {
      let r;
      if (!editando) r = await api("/logistica/romaneios", { metodo: "POST", corpo: { ...corpo, so_salvar: soSalvar } });
      else {
        r = await api(`/logistica/romaneios/${romaneio.id}`, { metodo: "PUT", corpo });
        if (r.success && !soSalvar) r = await api(`/logistica/romaneios/${romaneio.id}/gerar`, { metodo: "POST" });
      }
      if (!r.success) { toast.error(r.message || "Não foi possível salvar o romaneio."); return; }
      toast.success(r.message);
      onSalvo(r.id || romaneio?.id);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setSalvando(null);
    }
  };

  const campo = (nome, rotulo, extra = {}) => (
    <div className={extra.classe || ""}>
      <label className={ROTULO} htmlFor={`m-${nome}`}>{rotulo}</label>
      <input id={`m-${nome}`} value={form[nome]} maxLength={extra.max} placeholder={extra.dica}
        onChange={(ev) => setForm({ ...form, [nome]: extra.maiusculo ? ev.target.value.toUpperCase() : ev.target.value })} className={CAMPO} />
    </div>
  );

  return (
    <Modal
      titulo={editando ? `Romaneio nº ${romaneio.numero}` : "Novo romaneio"}
      descricao="Digite o nº do pedido ou da NF-e (ou bipe a chave do DANFE) e aperte Enter."
      largura="max-w-3xl"
      onFechar={onFechar}
      rodape={(
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <p className="flex-1 text-xs text-zinc-500">Gerar registra agora a <b>hora da coleta</b> de todos os pedidos e calcula a previsão de entrega.</p>
          <button type="button" disabled={Boolean(salvando)} onClick={() => enviar(true)} className={BOTAO_SECUNDARIO}>{salvando === "salvar" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Salvar em montagem</button>
          <button type="button" disabled={Boolean(salvando)} onClick={() => enviar(false)} className={BOTAO}>{salvando === "gerar" ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}Gerar romaneio</button>
        </div>
      )}
    >
      <div className="space-y-5 pb-2">
        {/* Leitor: digita ou bipa + Enter */}
        <div className="rounded-[22px] border border-purple-500/20 bg-gradient-to-b from-purple-500/[0.08] to-purple-500/[0.02] p-3 sm:p-4">
          <div className="flex items-stretch gap-2">
            <div className="relative min-w-0 flex-1">
              <ScanLine size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
              <input
                ref={leitor}
                value={codigo}
                onChange={(ev) => setCodigo(ev.target.value)}
                onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); ler(); } }}
                placeholder="Nº do pedido, da NF-e ou chave"
                aria-label="Número do pedido, da NF-e ou chave para incluir no romaneio"
                autoComplete="off"
                inputMode="text"
                className={`${CAMPO} !h-14 pl-12 text-lg font-semibold tracking-wide`}
              />
            </div>
            <button type="button" onClick={ler} disabled={!codigo.trim() || procurando} aria-label="Incluir" className={`${BOTAO} !h-14 !px-5`}>
              {procurando ? <Loader2 size={18} className="animate-spin" /> : <CornerDownLeft size={18} />}
              <span className="hidden sm:inline">Incluir</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[[lista.length, lista.length === 1 ? "pedido" : "pedidos"], [totais.volumes, "volumes"], [peso(totais.peso), "peso"]].map(([valor, rotulo]) => (
              <div key={rotulo} className="rounded-2xl bg-white/70 dark:bg-white/[0.05] px-2 py-2 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                <p className="text-xl sm:text-2xl font-semibold tabular-nums tracking-tight">{valor}</p>
                <p className="text-[11px] text-zinc-500">{rotulo}</p>
              </div>
            ))}
          </div>

          {leitura && (
            <p role="status" className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-medium ${leitura.tipo === "ok" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"}`}>
              {leitura.tipo === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              <span className="min-w-0">{leitura.texto}</span>
            </p>
          )}
          {opcoes?.length > 0 && (
            <ul className="mt-2 divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden rounded-xl bg-white/80 dark:bg-white/[0.04] ring-1 ring-black/[0.05] dark:ring-white/[0.08]">
              {opcoes.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => incluir(e)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-purple-500/[0.06]">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">Pedido {e.numero_pedido || e.id} · {e.cliente_nome || "Cliente"}</span>
                      <span className="block text-xs text-zinc-500">{numeroNfe(e) ? `NF-e ${numeroNfe(e)} · ` : ""}{e.cidade || ""}{e.uf ? `/${e.uf}` : ""}</span>
                    </span>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Incluir</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-6">
            <label className={ROTULO} htmlFor="m-transportadora">Transportadora</label>
            <select id="m-transportadora" value={form.transportadora_id} onChange={(ev) => setForm({ ...form, transportadora_id: ev.target.value })} className={CAMPO}>
              <option value="">Escolha</option>
              {ativas.map((t) => <option key={t.id} value={t.id}>{nomeDaTransportadora(t)}{t.cidade ? ` · ${t.cidade}/${t.uf || ""}` : ""}</option>)}
            </select>
            {outrasTransportadoras > 0 && <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">{outrasTransportadoras} {outrasTransportadoras === 1 ? "pedido estava" : "pedidos estavam"} com outra transportadora e vai para esta.</p>}
          </div>
          {campo("motorista", "Motorista", { classe: "col-span-2 sm:col-span-4", max: 120 })}
          {campo("motorista_documento", "CPF ou CNH", { classe: "col-span-2", max: 20 })}
          {campo("veiculo", "Veículo", { classe: "col-span-2 sm:col-span-3", max: 80, dica: "Ex.: VW Delivery 11.180" })}
          {campo("placa", "Placa", { classe: "sm:col-span-2", max: 8, maiusculo: true, dica: "ABC1D23" })}
          {campo("uf_placa", "UF", { max: 2, maiusculo: true })}
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
          {lista.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <ScanLine size={28} className="text-purple-400" />
              <p className="font-semibold">Nenhum pedido ainda</p>
              <p className="max-w-sm text-sm text-zinc-500">Pegue a pilha de mapas de separação conferidos e vá digitando o número de cada pedido. O último lido aparece no topo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-zinc-500 bg-black/[0.02] dark:bg-white/[0.03]">
                    <th className="text-left font-semibold px-4 py-2.5">Pedido</th>
                    <th className="text-left font-semibold px-3 py-2.5">Destino</th>
                    <th className="text-right font-semibold px-3 py-2.5 w-24">Peso (kg)</th>
                    <th className="text-right font-semibold px-3 py-2.5 w-20">Volumes</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                  {lista.map((e) => (
                    <tr key={e.id} className={`transition-colors duration-700 ${destaque === e.id ? "bg-purple-500/[0.08]" : ""}`}>
                      <td className="px-4 py-2 min-w-[180px]">
                        <p className="font-medium truncate">{e.numero_pedido ? `Pedido ${e.numero_pedido}` : "NF-e"} · {e.cliente_nome || ""}</p>
                        <p className="text-[11px] text-zinc-500">{numeroNfe(e) ? `NF-e ${numeroNfe(e)} · ` : ""}{moeda(e.valor_total)}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-zinc-600 dark:text-zinc-300">{e.cidade || "?"}{e.uf ? `/${e.uf}` : ""}</td>
                      <td className="px-3 py-2"><input inputMode="decimal" aria-label={`Peso do pedido ${e.numero_pedido || e.id}`} value={e.peso_texto} onChange={(ev) => mudar(e.id, "peso_texto", ev.target.value)} className={`${CAMPO} !h-9 !px-3 text-right`} /></td>
                      <td className="px-3 py-2"><input inputMode="numeric" aria-label={`Volumes do pedido ${e.numero_pedido || e.id}`} value={e.volumes_texto} onChange={(ev) => mudar(e.id, "volumes_texto", ev.target.value.replace(/\D/g, ""))} className={`${CAMPO} !h-9 !px-3 text-right ${numeroDigitado(e.volumes_texto) ? "" : "ring-2 ring-amber-500/40"}`} /></td>
                      <td className="pr-3"><button type="button" onClick={() => setLista((atual) => atual.filter((x) => x.id !== e.id))} aria-label="Tirar do romaneio" className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"><X size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {semVolumes > 0 && <p className="-mt-3 text-xs text-amber-700 dark:text-amber-400">{semVolumes} {semVolumes === 1 ? "pedido está" : "pedidos estão"} sem volumes. Os volumes vêm da conferência do checkout; se faltar, digite na linha.</p>}
        <p className="-mt-3 text-xs text-zinc-500">Valor das notas: <b className="tabular-nums">{moeda(totais.valor)}</b></p>

        <div>
          <label className={ROTULO} htmlFor="m-obs">Observação para o motorista</label>
          <textarea id="m-obs" rows={2} value={form.observacao} onChange={(ev) => setForm({ ...form, observacao: ev.target.value })} maxLength={2000} className={`${CAMPO} h-auto py-3`} />
        </div>
      </div>
    </Modal>
  );
}
