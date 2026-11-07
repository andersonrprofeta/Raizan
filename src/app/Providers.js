"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";

const TELAS_DO_PORTAL = /^\/(b2b-|login-b2b)/;

export default function Providers({ children }) {
  const caminho = usePathname();

  // attribute="class" é o que diz pro Tailwind funcionar
  // defaultTheme="dark" mantém o "modo trevas" como padrão inicial!
  // O Portal B2B é sempre claro, sem mexer na escolha de tema do painel
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme={TELAS_DO_PORTAL.test(caminho) ? "light" : undefined}>
      {children}
    </ThemeProvider>
  );
}
