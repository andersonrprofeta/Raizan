"use client";

// Montagem do romaneio: transportadora, motorista, veículo e o peso/volumes de cada pedido.
// "Gerar romaneio" registra AGORA a coleta de todos os pedidos (hora da coleta).

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Save, Truck, X } from "lucide-react";
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

export function ModalRomaneio({ expedicoes, romaneio = null, transportadoras, onFechar, onSalvo }) {
  const editando = Boolean(romaneio);
  const [lista, setLista] = useState(() => expedicoes.map((e) => ({ ...e, peso_texto: e.peso_bruto ?? "", volumes_texto: e.volumes ?? "" })));
  const [form, setForm] = useState({
    transportadora_id: romaneio?.transportadora_id || maisComum(expedicoes.map((e) => e.transportadora_id)),
    motorista: romaneio?.motorista || "", motorista_documento: romaneio?.motorista_documento || "",
    veiculo: romaneio?.veiculo || "", placa: romaneio?.placa || "", uf_placa: romaneio?.uf_placa || "", observacao: romaneio?.observacao || "",
  });
  const [salvando, setSalvando] = useState(null);

  const ativas = transportadoras.filter((t) => t.situacao === "ativa" || t.id === Number(form.transportadora_id));
  const totais = useMemo(() => lista.reduce((t, e) => ({
    peso: t.peso + (numeroDigitado(e.peso_texto) || 0), volumes: t.volumes + (numeroDigitado(e.volumes_texto) || 0), valor: t.valor + e.valor_total,
  }), { peso: 0, volumes: 0, valor: 0 }), [lista]);
  const outrasTransportadoras = lista.filter((e) => e.transportadora_id && form.transportadora_id && e.transportadora_id !== Number(form.transportadora_id)).length;

  const mudar = (id, campo, valor) => setLista((atual) => atual.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));

  const enviar = async (soSalvar) => {
    if (!form.transportadora_id) { toast.error("Escolha a transportadora."); return; }
    if (lista.length === 0) { toast.error("O romaneio precisa de ao menos um pedido."); return; }
    setSalvando(soSalvar ? "salvar" : "gerar");
    const corpo = {
      ...form,
      transportadora_id: Number(form.transportadora_id),
      expedicoes: lista.map((e) => e.id),
      itens: lista.map((e) => ({ expedicao_id: e.id, peso_bruto: numeroDigitado(e.peso_texto), volumes: numeroDigitado(e.volumes_texto) })),
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
      descricao={`${lista.length} ${lista.length === 1 ? "pedido" : "pedidos"} · ${peso(totais.peso)} · ${totais.volumes} vol. · ${moeda(totais.valor)}`}
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
                  <tr key={e.id}>
                    <td className="px-4 py-2 min-w-[180px]">
                      <p className="font-medium truncate">{e.numero_pedido ? `Pedido ${e.numero_pedido}` : "NF-e"} · {e.cliente_nome || ""}</p>
                      <p className="text-[11px] text-zinc-500">{numeroNfe(e) ? `NF-e ${numeroNfe(e)} · ` : ""}{moeda(e.valor_total)}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-zinc-600 dark:text-zinc-300">{e.cidade || "?"}{e.uf ? `/${e.uf}` : ""}</td>
                    <td className="px-3 py-2"><input inputMode="decimal" aria-label={`Peso do pedido ${e.numero_pedido || e.id}`} value={e.peso_texto} onChange={(ev) => mudar(e.id, "peso_texto", ev.target.value)} className={`${CAMPO} h-9 px-3 text-right`} /></td>
                    <td className="px-3 py-2"><input inputMode="numeric" aria-label={`Volumes do pedido ${e.numero_pedido || e.id}`} value={e.volumes_texto} onChange={(ev) => mudar(e.id, "volumes_texto", ev.target.value.replace(/\D/g, ""))} className={`${CAMPO} h-9 px-3 text-right`} /></td>
                    <td className="pr-3"><button type="button" onClick={() => setLista((atual) => atual.filter((x) => x.id !== e.id))} aria-label="Tirar do romaneio" className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"><X size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <label className={ROTULO} htmlFor="m-obs">Observação para o motorista</label>
          <textarea id="m-obs" rows={2} value={form.observacao} onChange={(ev) => setForm({ ...form, observacao: ev.target.value })} maxLength={2000} className={`${CAMPO} h-auto py-3`} />
        </div>
      </div>
    </Modal>
  );
}
