import "./globals.css";
import { Toaster } from 'react-hot-toast';

// 1. Importe o ChatWidget aqui no topo
import ChatWidget from "@/components/ChatWidget";

export const metadata = {
  title: "Raizan Core",
  description: "Dashboard ERP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="bg-zinc-950 text-white antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
        
        {/* A página entra AQUI */}
        {children}

        {/* 2. Coloque o ChatWidget aqui, para ele flutuar em todas as páginas! */}
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
      </body>
    </html>
  );
}