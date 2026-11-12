"use client";

// Cadastro de transportadoras: nativo do Core (criar, editar, bloquear, inativar, classificar, SLA)
// e importação do ERP (só os cadastros com a tag de transportadora).

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Ban, Building2, CheckCircle2, CloudDownload, Loader2, Mail, MapPin, Pencil, Phone, Plus, Power, Search, Sparkles, Truck, X } from "lucide-react";
import { api, BOTAO_SECUNDARIO, CAMPO, Carregando, EstadoVazio, Modal, ROTULO, Segmentado, VIDRO, moeda } from "@/components/vendedores/ui";
import { BOTAO, CLASSIFICACOES, MODAIS, SITUACAO, Selo, diaCurto, formatarCnpj, nomeDaTransportadora } from "@/components/transportadora/ui";

const FILTROS = [
  { id: "ativa", rotulo: "Ativas" },
  { id: "bloqueada", rotulo: "Bloqueadas" },
  { id: "inativa", rotulo: "Inativas" },
  { id: "", rotulo: "Todas" },
];

const VAZIO = {
  razao_social: "", nome_fantasia: "", cnpj: "", inscricao_estadual: "", rntrc: "", email: "", site: "", telefone: "", whatsapp: "", contato_principal: "",
  cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", modal: "rodoviario", classificacao: "",
  prazo_medio_entrega: "", meta_sla: "", percentual_avaria: "", percentual_extravio: "", valor_frete_minimo: "", valor_frete_por_kg: "", valor_frete_por_m3: "",
  aceita_coleta: true, possui_rastreamento: false, possui_api: false, possui_cte: false, possui_mdfe: false, observacao: "",
};

const soDigitos = (valor) => String(valor || "").replace(/\D/g, "");
const telefoneBonito = (valor) => {
  const n = soDigitos(valor);
  if (n.length === 11) return n.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (n.length === 10) return n.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return valor || "";
};

// CNPJ: BrasilAPI (gratuita) e, se ela falhar, a pública do CNPJ.ws. Devolve só o que interessa ao cadastro.
async function consultarCnpj(cnpj) {
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (r.ok) {
      const d = await r.json();
      return {
        razao_social: d.razao_social, nome_fantasia: d.nome_fantasia, email: d.email, telefone: soDigitos(d.ddd_telefone_1),
        cep: soDigitos(d.cep), endereco: [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(" "), numero: d.numero, complemento: d.complemento,
        bairro: d.bairro, cidade: d.municipio, uf: d.uf, situacao_receita: d.descricao_situacao_cadastral,
      };
    }
    if (r.status === 404) return { naoExiste: true };
  } catch (erro) { /* tenta a próxima */ }
  try {
    const r = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    if (!r.ok) return null;
    const d = await r.json();
    const e = d.estabelecimento || {};
    return {
      razao_social: d.razao_social, nome_fantasia: e.nome_fantasia, email: e.email, telefone: soDigitos(`${e.ddd1 || ""}${e.telefone1 || ""}`),
      cep: soDigitos(e.cep), endereco: [e.tipo_logradouro, e.logradouro].filter(Boolean).join(" "), numero: e.numero, complemento: e.complemento,
      bairro: e.bairro, cidade: e.cidade?.nome, uf: e.estado?.sigla, situacao_receita: e.situacao_cadastral,
      inscricao_estadual: (e.inscricoes_estaduais || []).find((i) => i.ativo)?.inscricao_estadual,
    };
  } catch (erro) {
    return null;
  }
}

function Interruptor({ rotulo, ligado, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => onChange(!ligado)} className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-3.5 py-2.5 text-left text-sm font-medium hover:border-purple-300 transition-colors">
      {rotulo}
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${ligado ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${ligado ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function Secao({ titulo, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function FormularioTransportadora({ transportadora, onFechar, onSalvo }) {
  const editando = Boolean(transportadora);
  const [form, setForm] = useState(() => {
    if (!transportadora) return VAZIO;
    const atual = { ...VAZIO };
    Object.keys(VAZIO).forEach((chave) => { if (transportadora[chave] !== null && transportadora[chave] !== undefined) atual[chave] = transportadora[chave]; });
    return atual;
  });
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [receita, setReceita] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const ultimoCnpj = useRef(soDigitos(transportadora?.cnpj));

  const mudar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const preencherPeloCnpj = async (cnpj) => {
    setBuscandoCnpj(true);
    const dados = await consultarCnpj(cnpj);
    setBuscandoCnpj(false);
    if (!dados) { toast.error("Não foi possível consultar o CNPJ agora. Preencha à mão."); return; }
    if (dados.naoExiste) { toast.error("CNPJ não encontrado na Receita."); return; }
    setReceita(dados.situacao_receita || null);
    setForm((atual) => {
      const novo = { ...atual };
      // Só completa o que está vazio: nada digitado é apagado
      for (const [campo, valor] of Object.entries(dados)) {
        if (campo in VAZIO && valor && !String(atual[campo] || "").trim()) novo[campo] = String(valor);
      }
      return novo;
    });
    toast.success("Dados da Receita preenchidos.");
  };

  const aoDigitarCnpj = (valor) => {
    const digitos = soDigitos(valor).slice(0, 14);
    mudar("cnpj", digitos);
    if (digitos.length === 14 && digitos !== ultimoCnpj.current) {
      ultimoCnpj.current = digitos;
      preencherPeloCnpj(digitos);
    }
  };

  const aoDigitarCep = async (valor) => {
    const digitos = soDigitos(valor).slice(0, 8);
    mudar("cep", digitos);
    if (digitos.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const d = await r.json();
      if (d.erro) { toast.error("CEP não encontrado."); return; }
      setForm((atual) => ({ ...atual, endereco: d.logradouro || atual.endereco, bairro: d.bairro || atual.bairro, cidade: d.localidade || atual.cidade, uf: d.uf || atual.uf }));
    } catch (erro) { /* segue à mão */ }
  };

  const salvar = async () => {
    if (!String(form.razao_social).trim()) { toast.error("Informe a razão social."); return; }
    setSalvando(true);
    try {
      const r = editando
        ? await api(`/logistica/transportadoras/${transportadora.id}`, { metodo: "PUT", corpo: form })
        : await api("/logistica/transportadoras", { metodo: "POST", corpo: form });
      if (!r.success) { toast.error(r.message); return; }
      toast.success(r.message);
      onSalvo(r.id || transportadora.id);
    } catch (erro) { toast.error("Sem conexão com o servidor."); } finally { setSalvando(false); }
  };

  const campo = (nome, rotulo, extra = {}) => (
    <div className={extra.classe || ""}>
      <label className={ROTULO} htmlFor={`t-${nome}`}>{rotulo}</label>
      <input id={`t-${nome}`} value={form[nome] ?? ""} maxLength={extra.max} inputMode={extra.numerico ? "decimal" : undefined} placeholder={extra.dica}
        onChange={(e) => mudar(nome, extra.maiusculo ? e.target.value.toUpperCase() : e.target.value)} className={CAMPO} />
    </div>
  );

  return (
    <Modal titulo={editando ? nomeDaTransportadora(transportadora) : "Nova transportadora"} descricao={editando && transportadora.origem_integracao !== "core" ? "Importada da integração. Situação, SLA e dados comerciais ficam no Core." : "Digite o CNPJ e o resto vem da Receita."} largura="max-w-3xl" onFechar={onFechar}
      rodape={<><button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1 sm:flex-none`}>Voltar</button><span className="hidden sm:block flex-1" /><button type="button" disabled={salvando} onClick={salvar} className={`${BOTAO} flex-1 sm:flex-none`}>{salvando && <Loader2 size={15} className="animate-spin" />}{editando ? "Salvar" : "Cadastrar"}</button></>}>
      <div className="space-y-7 pb-2">
        <Secao titulo="Identificação">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="col-span-2 sm:col-span-3">
              <label className={ROTULO} htmlFor="t-cnpj">CNPJ</label>
              <div className="relative">
                <input id="t-cnpj" value={formatarCnpj(form.cnpj)} onChange={(e) => aoDigitarCnpj(e.target.value)} inputMode="numeric" placeholder="00.000.000/0000-00" className={`${CAMPO} pr-11`} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-500">{buscandoCnpj ? <Loader2 size={16} className="animate-spin" /> : soDigitos(form.cnpj).length === 14 ? <Sparkles size={16} /> : null}</span>
              </div>
              {receita && <p className={`mt-1.5 text-xs font-medium ${/ativa/i.test(receita) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>Receita: {receita}</p>}
            </div>
            {campo("inscricao_estadual", "Inscrição estadual", { classe: "sm:col-span-2", max: 30 })}
            {campo("rntrc", "RNTRC (ANTT)", { max: 20 })}
            {campo("razao_social", "Razão social", { classe: "col-span-2 sm:col-span-4", max: 190 })}
            {campo("nome_fantasia", "Nome fantasia", { classe: "col-span-2", max: 190 })}
          </div>
        </Secao>

        <Secao titulo="Contato">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {campo("contato_principal", "Contato principal", { classe: "col-span-2", max: 120 })}
            {campo("telefone", "Telefone", { classe: "sm:col-span-2", max: 30 })}
            {campo("whatsapp", "WhatsApp", { classe: "sm:col-span-2", max: 30 })}
            {campo("email", "E-mail", { classe: "col-span-2 sm:col-span-3", max: 190 })}
            {campo("site", "Site", { classe: "col-span-2 sm:col-span-3", max: 190 })}
          </div>
        </Secao>

        <Secao titulo="Endereço">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <label className={ROTULO} htmlFor="t-cep">CEP</label>
              <input id="t-cep" value={form.cep} onChange={(e) => aoDigitarCep(e.target.value)} inputMode="numeric" className={CAMPO} />
            </div>
            {campo("endereco", "Endereço", { classe: "col-span-2 sm:col-span-4", max: 190 })}
            {campo("numero", "Número", { max: 20 })}
            {campo("complemento", "Complemento", { classe: "sm:col-span-2", max: 120 })}
            {campo("bairro", "Bairro", { classe: "col-span-2 sm:col-span-3", max: 120 })}
            {campo("cidade", "Cidade", { classe: "col-span-2 sm:col-span-4", max: 120 })}
            {campo("uf", "UF", { max: 2, maiusculo: true })}
          </div>
        </Secao>

        <Secao titulo="Operação">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ROTULO} htmlFor="t-modal">Modal</label>
              <select id="t-modal" value={form.modal || ""} onChange={(e) => mudar("modal", e.target.value)} className={CAMPO}>
                <option value="">Não informado</option>
                {Object.entries(MODAIS).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
              </select>
            </div>
            <div>
              <label className={ROTULO} htmlFor="t-classe">Classificação</label>
              <select id="t-classe" value={form.classificacao || ""} onChange={(e) => mudar("classificacao", e.target.value)} className={CAMPO}>
                <option value="">Sem classificação</option>
                {Object.entries(CLASSIFICACOES).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Interruptor rotulo="Aceita coleta no nosso endereço" ligado={Boolean(form.aceita_coleta)} onChange={(v) => mudar("aceita_coleta", v)} />
            <Interruptor rotulo="Tem rastreamento" ligado={Boolean(form.possui_rastreamento)} onChange={(v) => mudar("possui_rastreamento", v)} />
            <Interruptor rotulo="Tem API de integração" ligado={Boolean(form.possui_api)} onChange={(v) => mudar("possui_api", v)} />
            <Interruptor rotulo="Emite CT-e" ligado={Boolean(form.possui_cte)} onChange={(v) => mudar("possui_cte", v)} />
            <Interruptor rotulo="Emite MDF-e" ligado={Boolean(form.possui_mdfe)} onChange={(v) => mudar("possui_mdfe", v)} />
          </div>
        </Secao>

        <Secao titulo="SLA e dados comerciais">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {campo("prazo_medio_entrega", "Prazo médio (dias)", { numerico: true })}
            {campo("meta_sla", "Meta de SLA (%)", { numerico: true, dica: "95" })}
            {campo("percentual_avaria", "Avaria (%)", { numerico: true })}
            {campo("percentual_extravio", "Extravio (%)", { numerico: true })}
            {campo("valor_frete_minimo", "Frete mínimo (R$)", { numerico: true })}
            {campo("valor_frete_por_kg", "Frete por kg (R$)", { numerico: true })}
            {campo("valor_frete_por_m3", "Frete por m³ (R$)", { numerico: true })}
          </div>
          <p className="text-xs text-zinc-500">O prazo médio vale quando não há regra de rota para o destino (Parâmetros de sistema &gt; Logística).</p>
        </Secao>

        <div>
          <label className={ROTULO} htmlFor="t-obs">Observação</label>
          <textarea id="t-obs" rows={2} value={form.observacao || ""} onChange={(e) => mudar("observacao", e.target.value)} maxLength={2000} className={`${CAMPO} h-auto py-3`} />
        </div>
      </div>
    </Modal>
  );
}

function ModalSituacao({ transportadora, situacao, onFechar, onFeito }) {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const textos = {
    bloqueada: { titulo: "Bloquear transportadora?", texto: "Não pode receber romaneio novo. As cargas já coletadas seguem normalmente.", botao: "Bloquear" },
    inativa: { titulo: "Inativar transportadora?", texto: "Some das escolhas do romaneio. O histórico continua guardado.", botao: "Inativar" },
    ativa: { titulo: "Ativar transportadora?", texto: "Volta a poder receber romaneios.", botao: "Ativar" },
  }[situacao];
  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await api(`/logistica/transportadoras/${transportadora.id}/situacao`, { metodo: "POST", corpo: { situacao, motivo } });
      if (!r.success) { toast.error(r.message); return; }
      toast.success(r.message);
      onFeito();
    } catch (erro) { toast.error("Sem conexão com o servidor."); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo={textos.titulo} descricao={`${nomeDaTransportadora(transportadora)} · ${textos.texto}`} onFechar={onFechar}
      rodape={<><button type="button" onClick={onFechar} className={`${BOTAO_SECUNDARIO} flex-1`}>Voltar</button><button type="button" disabled={enviando} onClick={enviar} className={`${situacao === "ativa" ? BOTAO : "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-40"} flex-1`}>{enviando && <Loader2 size={15} className="animate-spin" />}{textos.botao}</button></>}>
      {situacao === "bloqueada" ? (
        <div className="pb-2">
          <label className={ROTULO} htmlFor="s-motivo">Motivo do bloqueio</label>
          <input id="s-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} placeholder="Ex.: avarias seguidas" className={CAMPO} />
        </div>
      ) : <div />}
    </Modal>
  );
}

function CartaoTransportadora({ t, onEditar, onSituacao }) {
  const sla = t.percentual_sla;
  const abaixoDaMeta = sla !== null && t.meta_sla !== null && sla < t.meta_sla;
  return (
    <article className={`${VIDRO} group flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-28px_rgba(124,58,237,0.5)] ${t.situacao !== "ativa" ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"><Truck size={19} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold tracking-tight">{nomeDaTransportadora(t)}</h3>
          <p className="truncate text-xs text-zinc-500">{t.cnpj ? formatarCnpj(t.cnpj) : "Sem CNPJ"}{t.cidade ? ` · ${t.cidade}/${t.uf || ""}` : ""}</p>
        </div>
        <Selo mapa={SITUACAO} valor={t.situacao} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {t.origem_integracao !== "core" && <span className="inline-flex h-6 items-center rounded-lg bg-sky-500/10 px-2 text-[10.5px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">{t.origem_integracao}</span>}
        {t.classificacao && <span className="inline-flex h-6 items-center rounded-lg bg-purple-500/10 px-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300">{CLASSIFICACOES[t.classificacao]}</span>}
        {t.modal && <span className="inline-flex h-6 items-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] px-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">{MODAIS[t.modal]}</span>}
        {t.possui_cte && <span className="inline-flex h-6 items-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] px-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">CT-e</span>}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/[0.025] dark:bg-white/[0.035] p-3 text-center">
        <div><dt className="text-[10.5px] text-zinc-500">SLA</dt><dd className={`text-lg font-semibold tabular-nums ${abaixoDaMeta ? "text-rose-600 dark:text-rose-400" : ""}`}>{sla === null ? "—" : `${Math.round(sla)}%`}</dd></div>
        <div><dt className="text-[10.5px] text-zinc-500">Coletas</dt><dd className="text-lg font-semibold tabular-nums">{t.total_coletas}</dd></div>
        <div><dt className="text-[10.5px] text-zinc-500">Atrasos</dt><dd className={`text-lg font-semibold tabular-nums ${t.entregas_em_atraso ? "text-amber-600" : ""}`}>{t.entregas_em_atraso}</dd></div>
      </dl>
      <div className="mt-3 space-y-1 text-xs text-zinc-500">
        {t.prazo_medio_entrega !== null && <p>Prazo médio {t.prazo_medio_entrega} {t.prazo_medio_entrega === 1 ? "dia" : "dias"}{t.meta_sla !== null ? ` · meta de SLA ${t.meta_sla}%` : ""}</p>}
        {t.valor_frete_minimo !== null && <p>Frete mínimo {moeda(t.valor_frete_minimo)}{t.valor_frete_por_kg !== null ? ` · ${moeda(t.valor_frete_por_kg)}/kg` : ""}</p>}
        {(t.telefone || t.whatsapp) && <p className="flex items-center gap-1.5"><Phone size={12} />{telefoneBonito(t.whatsapp || t.telefone)}{t.contato_principal ? ` · ${t.contato_principal}` : ""}</p>}
        {t.email && <p className="flex items-center gap-1.5 truncate"><Mail size={12} />{t.email}</p>}
        {t.ultima_coleta && <p className="flex items-center gap-1.5"><MapPin size={12} />Última coleta {diaCurto(t.ultima_coleta)}</p>}
        {t.situacao === "bloqueada" && t.motivo_bloqueio && <p className="text-rose-600 dark:text-rose-400">Bloqueada: {t.motivo_bloqueio}</p>}
      </div>
      <div className="mt-auto flex items-center gap-1 pt-4">
        <button type="button" onClick={() => onEditar(t)} className={`${BOTAO_SECUNDARIO} h-9 px-4`}><Pencil size={14} />Editar</button>
        <span className="flex-1" />
        {t.situacao === "ativa" ? (
          <>
            <button type="button" onClick={() => onSituacao(t, "bloqueada")} title="Bloquear" aria-label={`Bloquear ${nomeDaTransportadora(t)}`} className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"><Ban size={16} /></button>
            <button type="button" onClick={() => onSituacao(t, "inativa")} title="Inativar" aria-label={`Inativar ${nomeDaTransportadora(t)}`} className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-black/[0.05] hover:text-zinc-700 dark:hover:text-zinc-200"><Power size={16} /></button>
          </>
        ) : (
          <button type="button" onClick={() => onSituacao(t, "ativa")} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-500/10"><CheckCircle2 size={15} />Ativar</button>
        )}
      </div>
    </article>
  );
}

export function Transportadoras({ versao, onMudou }) {
  const [lista, setLista] = useState(null);
  const [contagem, setContagem] = useState({});
  const [situacao, setSituacao] = useState("ativa");
  const [busca, setBusca] = useState("");
  const [formulario, setFormulario] = useState(null);
  const [mudarSituacao, setMudarSituacao] = useState(null);
  const [importando, setImportando] = useState(false);
  const pedidoAtual = useRef(0);

  const carregar = useCallback(async () => {
    const numero = ++pedidoAtual.current;
    const parametros = new URLSearchParams(Object.entries({ situacao, busca: busca.trim() }).filter(([, v]) => v));
    try {
      const r = await api(`/logistica/transportadoras?${parametros}`);
      if (numero !== pedidoAtual.current) return;
      if (!r.success) { toast.error(r.message); setLista([]); return; }
      setLista(r.transportadoras);
      setContagem(r.contagem || {});
    } catch (erro) { if (numero === pedidoAtual.current) { toast.error("Sem conexão com o servidor."); setLista([]); } }
  }, [situacao, busca]);

  useEffect(() => {
    const espera = setTimeout(carregar, busca ? 280 : 0);
    return () => clearTimeout(espera);
  }, [carregar, busca, versao]);

  const importar = async () => {
    setImportando(true);
    const aviso = toast.loading("Buscando transportadoras na integração...");
    try {
      const r = await api("/logistica/transportadoras/sincronizar", { metodo: "POST" });
      if (r.success) { toast.success(r.message, { id: aviso, duration: 8000 }); carregar(); onMudou?.(); } else toast.error(r.message, { id: aviso, duration: 8000 });
    } catch (erro) { toast.error("Sem conexão com o servidor.", { id: aviso }); } finally { setImportando(false); }
  };

  const opcoes = FILTROS.map((f) => ({ ...f, rotulo: f.id && contagem[f.id] ? `${f.rotulo} · ${contagem[f.id]}` : f.rotulo }));
  const terminou = () => { setFormulario(null); setMudarSituacao(null); carregar(); onMudou?.(); };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1"><Segmentado opcoes={opcoes} valor={situacao} onChange={setSituacao} /></div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-0 basis-full sm:basis-auto sm:w-64 sm:flex-none">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, CNPJ ou cidade" aria-label="Buscar transportadoras" className={`${CAMPO} pl-10 pr-9`} />
            {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"><X size={14} /></button>}
          </div>
          <button type="button" onClick={importar} disabled={importando} className={BOTAO_SECUNDARIO}>{importando ? <Loader2 size={16} className="animate-spin" /> : <CloudDownload size={16} />}Importar do ERP</button>
          <button type="button" onClick={() => setFormulario({})} className={BOTAO}><Plus size={16} />Nova transportadora</button>
        </div>
      </div>

      {lista === null ? <div className={VIDRO}><Carregando texto="Carregando transportadoras..." /></div> : lista.length === 0 ? (
        <div className={VIDRO}>
          <EstadoVazio icone={Building2} titulo={busca ? "Nada encontrado" : "Nenhuma transportadora aqui"} texto={busca ? "Nenhuma transportadora com essa busca." : "Cadastre direto no Core ou importe do ERP. Do Omie entram só os cadastros com a tag Transportadora."}>
            {!busca && <button type="button" onClick={() => setFormulario({})} className={BOTAO}><Plus size={16} />Nova transportadora</button>}
          </EstadoVazio>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => <CartaoTransportadora key={t.id} t={t} onEditar={(x) => setFormulario({ transportadora: x })} onSituacao={(x, s) => setMudarSituacao({ transportadora: x, situacao: s })} />)}
        </div>
      )}

      {formulario && <FormularioTransportadora transportadora={formulario.transportadora} onFechar={() => setFormulario(null)} onSalvo={terminou} />}
      {mudarSituacao && <ModalSituacao {...mudarSituacao} onFechar={() => setMudarSituacao(null)} onFeito={terminou} />}
    </div>
  );
}
