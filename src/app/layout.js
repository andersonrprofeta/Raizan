import "./globals.css";
import { Toaster } from 'react-hot-toast';
import WorkspaceExterno from "@/components/WorkspaceExterno"; // 🟢 Cortina comprada!

// 🟢 Provedor com caminho relativo (se Providers estiver na mesma pasta app)
import Providers from "./Providers"; 

export const metadata = {
  title: "Portal Raizan Core",
  description: "Dashboard ERP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
          
          {children}

          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#e4e4e7',
                border: '1px solid #27272a',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
              error: { iconTheme: { primary: '#f43f5e', secondary: '#18181b' } },
            }} 
          />

          {/* 🟢 CORTINA PENDURADA! Agora ela vai escutar o clique lá no Header! */}
          <WorkspaceExterno />

        </Providers>
      </body>
    </html>
  );
}