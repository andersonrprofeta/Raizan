import "./globals.css";
import { Toaster } from 'react-hot-toast';

// 1. Importe o ChatWidget aqui no topo
import ChatWidget from "@/components/ChatWidget";

// 🟢 AQUI ESTÁ A CORREÇÃO: Faltou importar o provedor!
import Providers from "./Providers"; 

export const metadata = {
  title: "Hub de integrações Raizan Core",
  description: "Dashboard ERP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      {/* 🟢 Removi o bg-zinc-950 fixo daqui, pois o global.css + next-themes vão controlar as cores agora! */}
      <body className="antialiased">
        
        {/* 🟢 O Providers tem que abraçar TUDO */}
        <Providers>
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
          
          {/* A página entra AQUI (agora só tem uma vez!) */}
          {children}

          {/* Coloque o ChatWidget aqui, para ele flutuar em todas as páginas! */}
          {/*<ChatWidget />*/}

          {/* Injetor de Toasts */}
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#18181b', // zinc-900
                color: '#e4e4e7',      // zinc-200
                border: '1px solid #27272a', // zinc-800
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
              error: { iconTheme: { primary: '#f43f5e', secondary: '#18181b' } },
            }} 
          />
        </Providers>

      </body>
    </html>
  );
}