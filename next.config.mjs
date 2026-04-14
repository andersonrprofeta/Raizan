/** @type {import('next').NextConfig} */
const nextConfig = {
 // output: 'export',
  images: { unoptimized: true },
  trailingSlash: true // <--- Ensina o Next.js a criar as pastas certinho pro Electron
};

export default nextConfig;