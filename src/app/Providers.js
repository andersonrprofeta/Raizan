"use client";

import { ThemeProvider } from "next-themes";

export default function Providers({ children }) {
  // attribute="class" é o que diz pro Tailwind funcionar
  // defaultTheme="dark" mantém o "modo trevas" como padrão inicial!
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}