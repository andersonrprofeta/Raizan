"use client";

// Cartão "Meu site" no catálogo de Cadastros > Integrações.
// Peça isolada: só aparece com o módulo "website" liberado na licença e com permissão de integrações.
// O cartão em si é o mesmo do catálogo (vem por props), então o visual não muda.

import { useEffect, useState } from "react";
import { temPermissao } from "@/components/utils/sessaoCore";

export default function CartaoMeuSite({ Cartao, icone }) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    try {
      const modulos = JSON.parse(localStorage.getItem("@raizan:modulos") || "[]");
      setVisivel(Array.isArray(modulos) && modulos.includes("website") && temPermissao("website"));
    } catch (e) {
      setVisivel(false);
    }
  }, []);
  if (!visivel) return null;
  return (
    <Cartao
      cor="emerald" selo="Módulo"
      icone={icone}
      titulo="Meu site" descricao="Visitas, formulários e serviços do seu site."
      textoBotao="Abrir"
      onClick={(e) => { e.stopPropagation(); window.location.href = "/website"; }}
    />
  );
}
