// SÓ PARA DESENVOLVIMENTO. Este arquivo nunca entra no build de produção (ver dados.js).
// Liga no navegador do `next dev` com: localStorage.setItem("@raizan:website-simulado", "1")
// Os nomes são fictícios e servem só para conferir o visual e os estados das telas.

import { diaISO } from "./comum";

let semente = 7;
const aleatorio = () => {
  semente = (semente * 16807) % 2147483647;
  return (semente - 1) / 2147483646;
};
const entre = (min, max) => Math.floor(min + aleatorio() * (max - min + 1));

const agora = Date.now();
const atras = (minutos) => new Date(agora - minutos * 60000).toISOString();
const emDias = (dias) => diaISO(new Date(agora + dias * 86400000));

const SITES = [
  {
    id: "site_exemplo_1", nome: "Site Institucional Exemplo", dominio: "exemplo.com.br", dominios_adicionais: ["www.exemplo.com.br"],
    status_conexao: "conectado", coleta_ativa: true, api_ok: true, ultima_comunicacao: atras(3), ultimo_evento: atras(3),
    instalado_em: "2026-10-02T14:10:00Z", chave_prefixo: "rzs_pub_4f9a", tem_chave: true, plataforma: "Next.js",
  },
  {
    id: "site_exemplo_2", nome: "Loja Exemplo", dominio: "loja-exemplo.com.br", dominios_adicionais: [],
    status_conexao: "aguardando", coleta_ativa: false, api_ok: true, ultima_comunicacao: null, ultimo_evento: null,
    instalado_em: "2026-11-10T09:00:00Z", chave_prefixo: null, tem_chave: false, plataforma: "WordPress",
  },
];

const PRIMEIROS = ["Mariana", "Carlos", "Fernanda", "João", "Patrícia", "Ricardo", "Aline", "Bruno", "", "Luciana", "Eduardo", "Camila"];
const SOBRENOMES = ["Souza", "Almeida", "Pereira", "Lima", "Costa", "Ribeiro", "Gomes", "Martins"];
const EMPRESAS = ["Clínica Vida Plena", "Distribuidora Norte", "Hospital São Lucas", "", "Farmácia Bem Estar", "Laboratório Alfa", "Agro Campo Verde"];
const FORMULARIOS = [
  { formulario: "Fale conosco", tipo: "contato" },
  { formulario: "Solicitar orçamento", tipo: "orcamento" },
  { formulario: "Pré-cadastro comercial", tipo: "pre_cadastro" },
  { formulario: "Trabalhe conosco", tipo: "curriculo" },
];
const STATUS = ["novo", "novo", "novo", "atendimento", "negociacao", "convertido", "arquivado"];
const RESPONSAVEIS = [{ id: 1, nome: "Ana Paula" }, { id: 2, nome: "Rafael Torres" }, { id: 3, nome: "Juliana Mota" }];

function camposDoFormulario(tipo, contato) {
  const base = [
    { chave: "nome", rotulo: "Nome", valor: contato.nome || null },
    { chave: "email", rotulo: "E-mail", valor: contato.email },
    { chave: "telefone", rotulo: "Telefone", valor: contato.telefone },
  ];
  if (tipo === "contato") return [...base, { chave: "mensagem", rotulo: "Mensagem", valor: "Gostaria de saber mais sobre os produtos e prazos de entrega para a minha região." }];
  if (tipo === "orcamento") {
    return [...base,
      { chave: "empresa", rotulo: "Empresa", valor: contato.empresa || null },
      { chave: "produtos", rotulo: "Produtos de interesse", valor: ["Luvas nitrílicas", "Seringas 5ml", "Álcool 70%"] },
      { chave: "quantidade", rotulo: "Quantidade estimada", valor: "500 caixas/mês" },
      { chave: "prazo", rotulo: "Prazo desejado", valor: "Até 15 dias" },
      { chave: "aceita_contato_whatsapp", rotulo: "Aceita contato por WhatsApp", valor: true },
      { chave: "mensagem", rotulo: "Observações", valor: "Precisamos de nota fiscal com entrega fracionada." },
    ];
  }
  if (tipo === "pre_cadastro") {
    return [...base,
      { chave: "razao_social", rotulo: "Razão social", valor: `${contato.empresa || "Empresa"} LTDA` },
      { chave: "nome_fantasia", rotulo: "Nome fantasia", valor: contato.empresa || null },
      { chave: "cnpj", rotulo: "CNPJ", valor: "00.000.000/0001-00" },
      { chave: "responsavel", rotulo: "Responsável", valor: contato.nome || null },
      { chave: "whatsapp", rotulo: "WhatsApp", valor: contato.telefone },
      { chave: "cep", rotulo: "CEP", valor: "77000-000" },
      { chave: "endereco", rotulo: "Endereço", valor: "Avenida Exemplo, 1000" },
      { chave: "bairro", rotulo: "Bairro", valor: "Centro" },
      { chave: "cidade", rotulo: "Cidade", valor: "Palmas" },
      { chave: "estado", rotulo: "Estado", valor: "TO" },
      { chave: "segmento", rotulo: "Segmento", valor: "Hospitalar" },
      { chave: "porte", rotulo: "Porte", valor: "Médio" },
      { chave: "funcionarios", rotulo: "Funcionários", valor: 48 },
      { chave: "produtos_interesse", rotulo: "Produtos de interesse", valor: ["Descartáveis", "Antissépticos", "EPIs"] },
      { chave: "volume_compra", rotulo: "Volume de compra mensal", valor: "R$ 20 mil a R$ 50 mil" },
      { chave: "fornecedor_atual", rotulo: "Fornecedor atual", valor: "Não informado" },
      { chave: "forma_pagamento", rotulo: "Forma de pagamento preferida", valor: "Boleto 28 dias" },
      { chave: "inscricao_estadual", rotulo: "Inscrição estadual", valor: "Isento" },
      { chave: "site", rotulo: "Site da empresa", valor: "https://empresa-exemplo.com.br" },
      { chave: "como_conheceu", rotulo: "Como nos conheceu", valor: "Google" },
      { chave: "horario_contato", rotulo: "Melhor horário para contato", valor: "Manhã" },
      { chave: "endereco_entrega", rotulo: "Endereço de entrega", valor: { rua: "Rua das Flores, 20", cidade: "Palmas", uf: "TO" } },
      { chave: "lgpd", rotulo: "Aceite LGPD", valor: true },
      { chave: "observacoes", rotulo: "Observações", valor: "Temos três unidades e queremos centralizar as compras." },
    ];
  }
  return [...base,
    { chave: "cargo", rotulo: "Cargo pretendido", valor: "Auxiliar de logística" },
    { chave: "curriculo", rotulo: "Currículo", valor: "curriculo.pdf" },
    { chave: "linkedin", rotulo: "LinkedIn", valor: null },
  ];
}

let interacoes = Array.from({ length: 26 }, (_, i) => {
  const primeiro = PRIMEIROS[i % PRIMEIROS.length];
  const nome = primeiro ? `${primeiro} ${SOBRENOMES[i % SOBRENOMES.length]}` : "";
  const empresa = EMPRESAS[i % EMPRESAS.length];
  const form = FORMULARIOS[i % FORMULARIOS.length];
  const status = STATUS[i % STATUS.length];
  const site = SITES[i % 5 === 4 ? 1 : 0];
  const contato = {
    nome,
    empresa,
    email: primeiro ? `${primeiro.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@exemplo.com.br` : null,
    telefone: i % 6 === 5 ? null : `6399${String(1000000 + i * 7919).slice(-7)}`,
  };
  const campos = camposDoFormulario(form.tipo, contato);
  return {
    id: `int_${1000 + i}`,
    nome: nome || null,
    empresa: empresa || null,
    email: contato.email,
    telefone: contato.telefone,
    documento: form.tipo === "pre_cadastro" ? "00.000.000/0001-00" : null,
    formulario: form.formulario,
    tipo: form.tipo,
    site_id: site.id,
    site_nome: site.nome,
    dominio: site.dominio,
    recebido_em: atras(i * 190 + entre(5, 60)),
    status,
    responsavel: status === "novo" ? null : RESPONSAVEIS[i % RESPONSAVEIS.length],
    nova: status === "novo" && i < 5,
    origem: ["Google", "Instagram", "Direto", "WhatsApp", "Indicação"][i % 5],
    pagina_url: `https://${site.dominio}/${["contato", "orcamento", "seja-cliente", "trabalhe-conosco"][i % 4]}`,
    campanha: i % 3 === 0 ? { utm_source: "google", utm_medium: "cpc", utm_campaign: "linha-hospitalar" } : null,
    campos,
    navegacao: i % 2 === 0 ? [
      { pagina: "/", quando: atras(i * 190 + 70) },
      { pagina: "/produtos/descartaveis", quando: atras(i * 190 + 66) },
      { pagina: `/${["contato", "orcamento", "seja-cliente", "trabalhe-conosco"][i % 4]}`, quando: atras(i * 190 + 62) },
    ] : [],
    historico: [{ quando: atras(i * 190 + 5), quem: "Raizan Insight", acao: "Formulário recebido" }],
    observacoes: [],
  };
});

function resumoDasInteracoes(lista) {
  const conta = (s) => lista.filter((i) => i.status === s).length;
  return { total: lista.length, novo: conta("novo"), atendimento: conta("atendimento"), negociacao: conta("negociacao"), convertido: conta("convertido"), arquivado: conta("arquivado") };
}

function analytics(params) {
  const de = params.get("de") || diaISO(new Date(agora - 29 * 86400000));
  const ate = params.get("ate") || diaISO(new Date());
  const site = params.get("site_id");
  const dias = [];
  for (let d = new Date(`${de}T12:00:00`); diaISO(d) <= ate; d.setDate(d.getDate() + 1)) dias.push(diaISO(d));
  semente = 11 + dias.length + (site === "site_exemplo_2" ? 5 : 0);
  if (site === "site_exemplo_2") return { success: true, sem_dados: true, por_dia: [], paginas: [], origens: [], regioes: [], categorias: [], atividades: [], resumo: null };

  const por_dia = dias.map((dia) => {
    const visitas = entre(60, 210);
    return { data: dia, visitas, visitantes: Math.round(visitas * 0.72), formularios: entre(0, 6), conversoes: entre(0, 3) };
  });
  const soma = (campo) => por_dia.reduce((acc, d) => acc + d[campo], 0);
  const visitas = soma("visitas");
  const formularios = soma("formularios");
  return {
    success: true,
    resumo: {
      visitantes: soma("visitantes"), visitas, sessoes: Math.round(visitas * 1.08), novos_visitantes: Math.round(soma("visitantes") * 0.64),
      recorrentes: Math.round(soma("visitantes") * 0.36), paginas_vistas: Math.round(visitas * 2.7), engajamento_medio_seg: 94,
      formularios, whatsapp: Math.round(visitas * 0.031), telefone: Math.round(visitas * 0.008), email: Math.round(visitas * 0.005),
      conversao_pct: visitas ? (formularios / Math.round(visitas * 1.08)) * 100 : 0,
      conversao_definicao: "Sessões com formulário enviado ÷ total de sessões",
    },
    por_dia,
    paginas: [
      { caminho: "/", titulo: "Início", visualizacoes: Math.round(visitas * 0.9) },
      { caminho: "/distribuicao-hospitalar", titulo: "Distribuição hospitalar", visualizacoes: Math.round(visitas * 0.42) },
      { caminho: "/produtos/descartaveis", titulo: "Descartáveis", visualizacoes: Math.round(visitas * 0.31) },
      { caminho: "/sobre", titulo: "Sobre nós", visualizacoes: Math.round(visitas * 0.18) },
      { caminho: "/contato", titulo: "Contato", visualizacoes: Math.round(visitas * 0.14) },
      { caminho: "/produtos/veterinarios", titulo: "Produtos veterinários", visualizacoes: Math.round(visitas * 0.11) },
    ],
    origens: [
      { origem: "Google (orgânico)", sessoes: Math.round(visitas * 0.46) },
      { origem: "Direto", sessoes: Math.round(visitas * 0.24) },
      { origem: "Instagram", sessoes: Math.round(visitas * 0.14) },
      { origem: "Google Ads", sessoes: Math.round(visitas * 0.1) },
      { origem: "Outros", sessoes: Math.round(visitas * 0.06) },
    ],
    regioes: [
      { regiao: "Tocantins", uf: "TO", visitas: Math.round(visitas * 0.38) },
      { regiao: "Goiás", uf: "GO", visitas: Math.round(visitas * 0.21) },
      { regiao: "São Paulo", uf: "SP", visitas: Math.round(visitas * 0.14) },
      { regiao: "Pará", uf: "PA", visitas: Math.round(visitas * 0.09) },
      { regiao: "Distrito Federal", uf: "DF", visitas: Math.round(visitas * 0.06) },
    ],
    categorias: [
      { tipo: "form_submit", rotulo: "Formulários enviados", total: formularios },
      { tipo: "whatsapp_click", rotulo: "Cliques no WhatsApp", total: Math.round(visitas * 0.031) },
      { tipo: "phone_click", rotulo: "Cliques no telefone", total: Math.round(visitas * 0.008) },
      { tipo: "email_click", rotulo: "Cliques no e-mail", total: Math.round(visitas * 0.005) },
      { tipo: "file_download", rotulo: "Downloads", total: Math.round(visitas * 0.012) },
      { tipo: "cta_click", rotulo: "Cliques em botões de ação", total: Math.round(visitas * 0.06) },
    ],
    formularios: [
      { formulario: "Solicitar orçamento", visualizacoes: 410, inicios: 96, envios: Math.round(formularios * 0.5) },
      { formulario: "Fale conosco", visualizacoes: 380, inicios: 61, envios: Math.round(formularios * 0.3) },
      { formulario: "Pré-cadastro comercial", visualizacoes: 140, inicios: 30, envios: Math.round(formularios * 0.2) },
    ],
    atividades: [
      { tipo: "form_submit", quando: atras(4), descricao: "Novo formulário: Solicitar orçamento", interacao_id: "int_1000" },
      { tipo: "whatsapp_click", quando: atras(11), descricao: "Clique no WhatsApp em /distribuicao-hospitalar" },
      { tipo: "page_view", quando: atras(17), descricao: "Acesso à página Distribuição hospitalar" },
      { tipo: "session_start", quando: atras(23), descricao: "Novo visitante vindo do Google" },
      { tipo: "conversion", quando: atras(65), descricao: "Conversão registrada: Pré-cadastro comercial", interacao_id: "int_1002" },
      { tipo: "phone_click", quando: atras(130), descricao: "Clique no telefone em /contato" },
    ],
  };
}

// Serviços pagos à Raizan (formato de GET /servicos)
function servicoSimulado(id, tipo, tipo_rotulo, descricao, site_id, valor, ciclo, dias, situacao, suspende, alerta) {
  const vence = emDias(dias);
  const carencia = new Date(Date.parse(`${vence}T12:00:00Z`) + 20 * 86400000).toISOString().slice(0, 10);
  return {
    id, tipo, tipo_rotulo, descricao, site_id, site: site_id === "site_exemplo_1" ? "exemplo.com.br" : site_id ? "loja-exemplo.com.br" : null,
    valor, ciclo, vence_em: vence, dias_para_vencer: dias, carencia_dias: 20, carencia_ate: carencia, suspende_o_site: suspende,
    situacao, status: "ativo",
    alerta: alerta ? { ...alerta, chave: `cobranca:${id}:${vence}:${alerta.marco}` } : null,
    cobranca_aberta: dias <= 30 ? { id: id * 10, valor, vencimento: vence } : null,
  };
}

const SERVICOS = [
  servicoSimulado(1, "licenca_site", "Licença do site", "Licença do site", "site_exemplo_1", 1200, "anual", 18, "active", true, { marco: "30", nivel: "info", texto: "Licença do site vence em 18 dias." }),
  servicoSimulado(2, "dominio", "Domínio", "Domínio exemplo.com.br", "site_exemplo_1", 40, "anual", 4, "payment_pending", false, { marco: "5", nivel: "atencao", texto: "Domínio exemplo.com.br vence em 4 dias." }),
  servicoSimulado(3, "hospedagem", "Hospedagem", "Hospedagem", "site_exemplo_2", 600, "anual", -6, "grace_period", true, { marco: "carencia", nivel: "erro", texto: "Hospedagem: venceu. O site pode sair do ar em 14 dias." }),
  servicoSimulado(4, "email", "E-mail", "E-mail profissional (5 contas)", null, 25, "mensal", 75, "active", false, null),
];

const PAGAMENTOS = [
  { id: 31, servico: "Licença do site", referente_a: emDias(-347), valor: 1100, pago_em: `${emDias(-349)} 14:02:00`, forma: "pix" },
  { id: 30, servico: "E-mail profissional (5 contas)", referente_a: emDias(-15), valor: 25, pago_em: `${emDias(-16)} 09:30:00`, forma: "credit_card" },
];

const ok = (dados) => ({ estado: "ok", dados: { success: true, ...dados } });
const espera = () => new Promise((r) => setTimeout(r, 350));

export async function responderSimulado(caminho, { metodo, corpo }) {
  await espera();
  const [rota, query = ""] = caminho.split("?");
  const params = new URLSearchParams(query);
  const partes = rota.split("/").filter(Boolean);

  if (rota === "/sites" && metodo === "GET") return ok({ sites: SITES, responsaveis: RESPONSAVEIS });
  if (partes[0] === "sites" && partes[2] === "chave" && metodo === "POST") return ok({ chave: `rzs_pub_${Math.random().toString(16).slice(2, 10)}`, segredo_exibido_uma_vez: true });
  if (partes[0] === "sites" && partes[2] === "testar") return ok({ recebido_em: new Date().toISOString() });
  if (partes[0] === "sites") return ok({});

  if (rota === "/analytics") return ok(analytics(params));

  if (rota === "/interacoes") {
    const busca = (params.get("busca") || "").toLowerCase();
    let lista = interacoes.filter((i) => (!params.get("site_id") || i.site_id === params.get("site_id")));
    const resumo = resumoDasInteracoes(lista);
    if (params.get("status")) lista = lista.filter((i) => i.status === params.get("status"));
    if (params.get("tipo")) lista = lista.filter((i) => i.tipo === params.get("tipo"));
    if (params.get("origem")) lista = lista.filter((i) => i.origem === params.get("origem"));
    if (params.get("responsavel")) lista = lista.filter((i) => String(i.responsavel?.id || "") === params.get("responsavel"));
    if (busca) lista = lista.filter((i) => [i.nome, i.email, i.telefone, i.empresa, i.documento].some((v) => String(v || "").toLowerCase().includes(busca)));
    return ok({ resumo, itens: lista.map(({ campos, navegacao, historico, observacoes, ...resto }) => resto), responsaveis: RESPONSAVEIS, formularios: FORMULARIOS });
  }

  if (partes[0] === "interacoes" && partes[1]) {
    const item = interacoes.find((i) => i.id === partes[1]);
    if (!item) return { estado: "erro", mensagem: "Interação não encontrada." };
    if (metodo === "PATCH") {
      if (corpo.status) item.historico.unshift({ quando: new Date().toISOString(), quem: "Você", acao: `Status alterado para ${corpo.status}` });
      if (corpo.responsavel_id !== undefined) {
        item.responsavel = RESPONSAVEIS.find((r) => r.id === Number(corpo.responsavel_id)) || null;
        item.historico.unshift({ quando: new Date().toISOString(), quem: "Você", acao: `Responsável: ${item.responsavel?.nome || "nenhum"}` });
      }
      Object.assign(item, corpo.status ? { status: corpo.status } : {}, { nova: false });
      return ok({ interacao: item });
    }
    if (partes[2] === "observacoes") {
      item.observacoes.unshift({ quando: new Date().toISOString(), quem: "Você", texto: corpo.texto });
      return ok({ interacao: item });
    }
    item.nova = false;
    return ok({ interacao: item });
  }

  if (rota === "/painel") {
    const dias = Number(params.get("dias")) === 30 ? 30 : 7;
    const hoje = new Date();
    const por_dia = Array.from({ length: dias }, (_, i) => {
      const d = new Date(hoje.getTime() - (dias - 1 - i) * 86400000);
      return { data: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, visitas: 40 + ((i * 37) % 55), formularios: (i * 7) % 4 };
    });
    const soma = (campo) => por_dia.reduce((t, d) => t + d[campo], 0);
    const novos = interacoes.filter((i) => i.status === "novo");
    return ok({
      dias,
      sites: SITES.map((s) => ({ id: s.id, nome: s.nome, dominio: s.dominio, status_conexao: s.status_conexao })),
      atual: { visitas: soma("visitas"), visitantes: Math.round(soma("visitas") * 0.62), formularios: soma("formularios"), contatos_diretos: Math.round(soma("visitas") * 0.08) },
      anterior: { visitas: Math.round(soma("visitas") * 0.86), visitantes: Math.round(soma("visitas") * 0.58), formularios: soma("formularios") + 3, contatos_diretos: Math.round(soma("visitas") * 0.07) },
      por_dia,
      contatos: { novos: novos.length, nao_lidos: novos.filter((i) => i.nova).length },
    });
  }

  if (rota === "/avisos") {
    const novos = interacoes.filter((i) => i.status === "novo");
    return ok({
      nao_lidas: novos.filter((i) => i.nova).length,
      itens: novos.slice(0, 10).map((i) => ({
        chave: `site:${i.id}`, tipo: "site", id: i.id, nome: i.nome || i.empresa || i.email || "Visitante do site",
        formulario: i.formulario, site_id: i.site_id, site_nome: i.site_nome, recebido_em: i.recebido_em, nova: i.nova,
      })),
    });
  }

  if (rota === "/servicos") return ok({ pagamento_disponivel: true, servicos: SERVICOS, pagamentos: PAGAMENTOS });
  if (partes[0] === "servicos" && partes[3] === "pagar") {
    if (corpo?.metodo === "checkout") return ok({ metodo: "checkout", url: "https://www.mercadopago.com.br/" });
    return ok({ metodo: "pix", pix: { qr_code: "00020126580014br.gov.bcb.pix0136simulado-raizan-0000-0000-000000000000520400005303986540540.005802BR5906RAIZAN6009SAO PAULO62070503***6304ABCD", qr_code_base64: null, expira_em: `${emDias(0)} 23:59:00` } });
  }
  if (partes[0] === "servicos" && partes[3] === "verificar") return ok({ pago: false });
  return { estado: "indisponivel" };
}
