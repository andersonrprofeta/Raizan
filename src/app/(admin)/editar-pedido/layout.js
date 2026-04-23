// src/app/(admin)/editar-pedido/[id]/layout.js

// 1. Aqui fica a parte do Servidor que o Next.js exige
export function generateStaticParams() {
    return [];
  }
  
  // 2. Ele simplesmente repassa o visual para o seu page.js
  export default function EditarPedidoLayout({ children }) {
    return children;
  }