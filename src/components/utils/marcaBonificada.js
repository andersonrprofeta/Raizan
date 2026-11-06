const normalizar = (texto) => String(texto ?? "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Cada empresa define o começo do nome em Parâmetros de sistema. Vazio: nenhuma marca é bonificada.
export function marcaBonificada(marca, prefixo) {
  const inicio = normalizar(prefixo);
  return inicio !== "" && normalizar(marca).startsWith(inicio);
}
