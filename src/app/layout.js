import "./globals.css";
import ToasterRaizan from "@/components/ToasterRaizan";
import WorkspaceExterno from "@/components/WorkspaceExterno"; // 🟢 Cortina comprada!
import TituloDaAba from "@/components/TituloDaAba";

// 🟢 Provedor com caminho relativo (se Providers estiver na mesma pasta app)
import Providers from "./Providers"; 

export const metadata = {
  title: "Raizan Core",
  description: "ERP, loja virtual, portal B2B, compras, logística, sites e app de vendas num só lugar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <TituloDaAba />
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
          
          {children}

          <ToasterRaizan />

          {/* 🟢 CORTINA PENDURADA! Agora ela vai escutar o clique lá no Header! */}
          <WorkspaceExterno />

        </Providers>
      </body>
    </html>
  );
}