"use client";

// Notas da SEFAZ (DF-e): certificado A1 da empresa e as NF-es emitidas contra o CNPJ.
// A SEFAZ só deixa perguntar de novo depois de 1 hora quando não há novidade; por isso as notas chegam em rodadas.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, FileKey2, Loader2, RefreshCw, ShieldCheck, Trash2, Upload } from "lucide-react";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Modal, ROTULO, moeda } from "@/components/vendedores/ui";
import { diaCurto } from "@/components/compras/ui";

const lerArquivoBase64 = (arquivo) => new Promise((resolve, reject) => {
  const leitor = new FileReader();
  leitor.onload = () => resolve(String(leitor.result).replace(/^data:[^,]*,/, ""));
  leitor.onerror = reject;
  leitor.readAsDataURL(arquivo);
});
const horaCurta = (valor) => (valor ? `${diaCurto(valor)} ${String(valor).slice(11, 16)}` : "—");

function situacaoDaNota(nota) {
  if (nota.situacao === "cancelada") return { rotulo: "Cancelada pelo emitente", classe: "text-zinc-500 bg-black/[0.04] dark:bg-white/[0.06]" };
  if (nota.compra_id) return { rotulo: "Na Central", classe: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" };
  if (nota.ciencia_em) return { rotulo: "Aguardando XML", classe: "text-sky-700 dark:text-sky-400 bg-sky-500/10" };
  return { rotulo: "Aguardando ciência", classe: "text-amber-700 dark:text-amber-400 bg-amber-500/10" };
}

function FormularioCertificado({ ufs, onSalvo, onCancelar }) {
  const [arquivo, setArquivo] = useState(null);
  const [senha, setSenha] = useState("");
  const [uf, setUf] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (evento) => {
    evento.preventDefault();
    if (!arquivo || !uf) { toast.error("Escolha o arquivo do certificado e a UF."); return; }
    setSalvando(true);
    try {
      const resposta = await api("/fiscal/dfe/certificado", { metodo: "POST", corpo: { pfx: await lerArquivoBase64(arquivo), senha, uf } });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível guardar o certificado."); return; }
      toast.success(resposta.message);
      setSenha("");
      onSalvo();
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div>
        <label className={ROTULO} htmlFor="dfe-arquivo">Certificado A1 (.pfx ou .p12)</label>
        <input id="dfe-arquivo" type="file" accept=".pfx,.p12,application/x-pkcs12" onChange={(e) => setArquivo(e.target.files?.[0] || null)} className={`${CAMPO} pt-2.5 file:mr-3 file:border-0 file:bg-transparent file:font-semibold file:text-purple-600`} />
      </div>
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <div>
          <label className={ROTULO} htmlFor="dfe-senha">Senha do certificado</label>
          <input id="dfe-senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label className={ROTULO} htmlFor="dfe-uf">UF</label>
          <select id="dfe-uf" value={uf} onChange={(e) => setUf(e.target.value)} className={CAMPO}>
            <option value="">—</option>
            {ufs.map((sigla) => <option key={sigla} value={sigla}>{sigla}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-zinc-500 flex gap-1.5"><ShieldCheck size={14} className="shrink-0 text-emerald-600" />O arquivo e a senha ficam cifrados no servidor e nunca voltam para a tela. Só são usados para falar com a SEFAZ.</p>
      <div className="flex justify-end gap-2">
        {onCancelar && <button type="button" onClick={onCancelar} className={BOTAO_SECUNDARIO}>Cancelar</button>}
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>{salvando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Guardar certificado</button>
      </div>
    </form>
  );
}

export function SefazDfe({ onFechar, onNotasNovas }) {
  const [dados, setDados] = useState(null);
  const [trocando, setTrocando] = useState(false);
  const [consultando, setConsultando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await api("/fiscal/dfe");
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível carregar."); setDados({ ufs: [], notas: [] }); return; }
      setDados(resposta);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
      setDados({ ufs: [], notas: [] });
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const consultar = async () => {
    setConsultando(true);
    try {
      const resposta = await api("/fiscal/dfe/consultar", { metodo: "POST" });
      if (resposta.success) { toast.success(resposta.message); if (resposta.notas) onNotasNovas?.(); }
      else toast(resposta.message || "Não foi possível consultar agora.", { icon: "⏳" });
      carregar();
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setConsultando(false);
    }
  };

  const remover = async () => {
    if (!window.confirm("Remover o certificado? As notas da SEFAZ param de chegar até um novo ser enviado.")) return;
    const resposta = await api("/fiscal/dfe/certificado", { metodo: "DELETE" });
    if (resposta.success) toast.success(resposta.message); else toast.error(resposta.message || "Não foi possível remover.");
    carregar();
  };

  const certificado = dados?.certificado?.ativo ? dados.certificado : null;
  const venceEmDias = certificado?.validade ? Math.floor((new Date(certificado.validade) - Date.now()) / 86400000) : null;

  return (
    <Modal titulo="Notas da SEFAZ" descricao="As NF-es emitidas para o CNPJ da empresa chegam sozinhas na Central de Compras." onFechar={onFechar} largura="max-w-3xl">
      {!dados ? <div className="py-10 flex justify-center text-zinc-400"><Loader2 className="animate-spin" /></div> : (
        <div className="space-y-6">
          {!certificado || trocando ? (
            <FormularioCertificado ufs={dados.ufs || []} onSalvo={() => { setTrocando(false); carregar(); }} onCancelar={trocando ? () => setTrocando(false) : null} />
          ) : (
            <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><FileKey2 size={18} /></span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{certificado.titular || "Certificado A1"}</p>
                    <p className="text-xs text-zinc-500">CNPJ {certificado.cnpj} · {certificado.uf} · vence em {diaCurto(certificado.validade)}</p>
                    {venceEmDias !== null && venceEmDias <= 30 && <p className="text-xs font-semibold text-rose-600 mt-1">Faltam {venceEmDias} dias para o certificado vencer. Envie o novo antes disso.</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTrocando(true)} className={`${BOTAO_SECUNDARIO} h-9 px-4`}>Trocar</button>
                  <button type="button" onClick={remover} aria-label="Remover certificado" className="h-9 w-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10"><Trash2 size={15} /></button>
                </div>
              </div>
              <dl className="grid sm:grid-cols-3 gap-3 text-sm">
                <div><dt className="text-[11px] text-zinc-500">Última consulta</dt><dd className="font-medium">{horaCurta(certificado.ultima_consulta)}</dd></div>
                <div><dt className="text-[11px] text-zinc-500">Próxima consulta</dt><dd className="font-medium flex items-center gap-1"><Clock size={13} className="text-zinc-400" />{horaCurta(certificado.proxima_consulta)}</dd></div>
                <div><dt className="text-[11px] text-zinc-500">Resposta da SEFAZ</dt><dd className="font-medium truncate" title={certificado.ultimo_status || ""}>{certificado.ultimo_status || "Ainda não consultado"}</dd></div>
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">A SEFAZ libera uma nova consulta 1 hora depois de responder que não há novidade.</p>
                <button type="button" onClick={consultar} disabled={consultando} className={`${BOTAO_SECUNDARIO} h-9 px-4`}><RefreshCw size={14} className={consultando ? "animate-spin" : ""} />Consultar agora</button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-2">Últimas notas recebidas</h3>
            {dados.notas.length === 0 ? <p className="text-sm text-zinc-500 py-6 text-center">Nenhuma nota recebida pela SEFAZ ainda.</p> : (
              <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {dados.notas.map((nota) => {
                  const situacao = situacaoDaNota(nota);
                  return (
                    <li key={nota.chave_nfe} className="py-2.5 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{nota.emitente || nota.emitente_documento}</p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate">{nota.chave_nfe}</p>
                      </div>
                      <span className="text-xs text-zinc-500 tabular-nums hidden sm:block">{diaCurto(nota.emissao)}</span>
                      <span className="text-sm font-semibold tabular-nums">{moeda(nota.valor)}</span>
                      {nota.compra_id
                        ? <Link href={`/compras/pedidos/documento?id=${nota.compra_id}`} className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold ${situacao.classe}`}><CheckCircle2 size={12} />{situacao.rotulo}</Link>
                        : <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap ${situacao.classe}`}>{situacao.rotulo}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
