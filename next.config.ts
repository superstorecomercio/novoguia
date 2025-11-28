import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração do Turbopack (Next.js 16 usa Turbopack por padrão)
  turbopack: {
    // Define o root do projeto para evitar warning sobre múltiplos lockfiles
    root: __dirname,
  },
  // Evita problemas com trailing slashes nas APIs
  trailingSlash: false,
  // Excluir pasta painel do build (subprojeto separado)
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Configuração para Sharp (necessário para processamento de imagens na Vercel)
  // A Vercel instala automaticamente o Sharp, mas precisamos garantir que está configurado
  serverExternalPackages: ['sharp'],
  // Suprimir warnings de módulos opcionais não instalados
  webpack: (config, { isServer }) => {
    // Ignorar módulos opcionais de email que podem não estar instalados
    // Isso evita erros durante a compilação quando os pacotes não estão instalados
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'resend': false,
      '@sendgrid/mail': false,
      'nodemailer': false,
    };
    
    // Ignorar warnings de módulos não encontrados durante a análise estática
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/(resend|@sendgrid\/mail|nodemailer)/,
      },
      {
        message: /Module not found: Can't resolve '(resend|@sendgrid\/mail|nodemailer)'/,
      },
      /Module not found: Can't resolve 'resend'/,
      /Module not found: Can't resolve '@sendgrid\/mail'/,
      /Module not found: Can't resolve 'nodemailer'/,
      /Can't resolve 'resend'/,
      /Can't resolve '@sendgrid\/mail'/,
      /Can't resolve 'nodemailer'/,
      // Padrões adicionais para diferentes formatos de mensagem
      /Failed to resolve module.*resend/,
      /Failed to resolve module.*@sendgrid\/mail/,
      /Failed to resolve module.*nodemailer/,
      // Padrões específicos do Turbopack
      /\.\/lib\/email\/(resend|sendgrid|nodemailer)/,
      // Ignorar erros da pasta painel (subprojeto separado, agora na raiz)
      /^painel\//,
      /tw-animate-css/,
      /@vercel\/analytics/,
      /^ai$/,
    ];
    
    return config;
  },
  // Suprimir warnings do Turbopack
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
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
