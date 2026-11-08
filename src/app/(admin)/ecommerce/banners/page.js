"use client";

import { useEffect } from "react";

// Esta tela agora fica em Parâmetros de sistema > E-commerce. O endereço antigo só leva até lá.
export default function Redirecionar() {
  useEffect(() => { window.location.replace("/configuracoes?guia=ecommerce&aba=banners"); }, []);
  return null;
}
