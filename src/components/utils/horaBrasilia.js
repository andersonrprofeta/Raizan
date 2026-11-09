// Horários sempre no fuso de Brasília, não importa o fuso do computador de quem olha.
// Texto "2026-11-09 09:22:28" (como a API grava) é mostrado do jeito que está: já é a hora de Brasília.
// Data com fuso (ISO com "Z" ou objeto Date) é convertida para Brasília.

const FUSO = "America/Sao_Paulo";
// Texto sem fuso: "2026-11-09 09:22:28", "2026-11-09T09:22" ou só o dia "2026-11-30"
const GRAVADA = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function partes(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const texto = String(valor);
  const gravada = typeof valor === "string" ? texto.match(GRAVADA) : null;
  if (gravada) {
    const [, ano, mes, dia, hora = "00", minuto = "00", segundo = "00"] = gravada;
    return { ano, mes, dia, hora, minuto, segundo };
  }
  const data = valor instanceof Date ? valor : new Date(texto);
  if (Number.isNaN(data.getTime())) return null;
  const pedacos = Object.fromEntries(new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(data).map(({ type, value }) => [type, value]));
  return { ano: pedacos.year, mes: pedacos.month, dia: pedacos.day, hora: pedacos.hour, minuto: pedacos.minute, segundo: pedacos.second };
}

// "09/11/2026, 09:22:28"
export function dataHoraBrasilia(valor, vazio = "Não informado") {
  const p = partes(valor);
  return p ? `${p.dia}/${p.mes}/${p.ano}, ${p.hora}:${p.minuto}:${p.segundo}` : vazio;
}

// "09:22"
export function horaBrasilia(valor, vazio = "") {
  const p = partes(valor);
  return p ? `${p.hora}:${p.minuto}` : vazio;
}

// Agora, em Brasília, no formato que a API grava: "2026-11-09 09:22:28"
export const agoraEmBrasilia = () => new Date().toLocaleString("sv-SE", { timeZone: FUSO });

// "09/11/2026, 09:22" (sem segundos)
export function dataHoraCurtaBrasilia(valor, vazio = "Não informado") {
  const p = partes(valor);
  return p ? `${p.dia}/${p.mes}/${p.ano}, ${p.hora}:${p.minuto}` : vazio;
}

// "09/11/2026"
export function dataBrasilia(valor, vazio = "") {
  const p = partes(valor);
  return p ? `${p.dia}/${p.mes}/${p.ano}` : vazio;
}

// "09 nov"
export function diaMesBrasilia(valor, vazio = "") {
  const p = partes(valor);
  return p ? `${p.dia} ${MESES[Number(p.mes) - 1]}` : vazio;
}

// O dia em Brasília, "2026-11-30": serve para comparar datas sem erro de fuso
export function diaDe(valor) {
  const p = partes(valor);
  return p ? `${p.ano}-${p.mes}-${p.dia}` : null;
}

export const hojeEmBrasilia = () => agoraEmBrasilia().slice(0, 10);

// O momento exato (em milissegundos) de um horário de Brasília. Brasília é UTC-3 o ano todo.
export function instanteDe(valor) {
  const p = partes(valor);
  if (!p) return NaN;
  return Date.UTC(Number(p.ano), Number(p.mes) - 1, Number(p.dia), Number(p.hora) + 3, Number(p.minuto), Number(p.segundo));
}

// Oferta/promoção vale do primeiro ao último dia inteiros, no dia de Brasília
export function valeHoje(inicio, fim, hoje = hojeEmBrasilia()) {
  const primeiro = diaDe(inicio);
  const ultimo = diaDe(fim);
  return (!primeiro || primeiro <= hoje) && (!ultimo || hoje <= ultimo);
}
