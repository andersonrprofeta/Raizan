"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // 🚀 O motor de rotas oficial do Next.js

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. O Guarda olha no cofre se a máquina já tem uma Licença de Admin salva
    const hasAdminLicense = localStorage.getItem("@raizan:license");

    if (hasAdminLicense) {
      // 2. Já que você criou a pasta como "resumo", apontamos pra cá!
      router.push("/resumo"); 
    } else {
      // 3. O nome exato da sua pasta do B2B
      router.push("/login-b2b");
    }
  }, [router]);

  // Coloquei um texto piscando, assim você sabe que a tela não travou, ela só está pensando!
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <span className="text-zinc-500 text-sm animate-pulse font-medium">
        Carregando ambiente seguro...
      </span>
    </div>
  );
}