"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { descobrirPortalDoEndereco } from "@/components/login/MolduraLogin";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const escolherPrimeiraTela = async () => {
      // Quem já entrou no painel neste computador vai direto para ele
      if (localStorage.getItem("@raizan:license")) return router.replace("/resumo");

      // Lojista que já entrou no portal neste navegador vai direto para o portal
      if (!window.electronAPI && localStorage.getItem("raizan_user")) return router.replace("/b2b-inicio");

      // O app instalado é sempre o painel da empresa
      if (window.electronAPI) return router.replace("/login");

      // No navegador, o endereço diz quem está chegando: portal B2B registrado vai para o portal;
      // endereço sem portal (quem só usa o painel ou o módulo de sites) vai para o login do painel.
      // Se a API não responder, mantém o caminho de antes (portal) para não travar os lojistas.
      const portal = await descobrirPortalDoEndereco();
      router.replace(portal === "nao" ? "/login" : "/login-b2b");
    };
    escolherPrimeiraTela();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-purple-500/25 border-t-purple-500 animate-spin" aria-label="Carregando" />
    </div>
  );
}
