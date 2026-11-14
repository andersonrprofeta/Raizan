import { Inter } from "next/font/google";
import PortalShell from "@/components/portal/PortalShell";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Portal B2B",
  description: "Compre, acompanhe seus pedidos e veja seu financeiro",
};

export default function LayoutDoPortal({ children }) {
  return (
    <div className={inter.className} style={{ colorScheme: "light" }}>
      <PortalShell>{children}</PortalShell>
    </div>
  );
}
