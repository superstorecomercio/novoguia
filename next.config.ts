import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Define o root do Turbopack para o diretório do projeto
  turbopack: {
    root: __dirname,
  },
  // Evita problemas com trailing slashes nas APIs
  trailingSlash: false,
  // Excluir pasta painel do build (subprojeto separado)
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vuipgfgakfajyvkhjkwh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
