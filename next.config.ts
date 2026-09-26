import type { NextConfig } from 'next';

import { securityHeaders } from './lib/security/headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      /*
       * ⚠️ Cette limite n'a plus rien à voir avec la taille des ressources.
       *
       * Depuis l'upload direct (24/09/2026), le fichier va du navigateur à
       * Storage : les Server Actions ne transportent plus que des
       * métadonnées — quelques kilo-octets. La limite redescend donc à la
       * valeur par défaut, ce qui RÉDUIT la surface exposée : une requête
       * volumineuse est rejetée d'emblée.
       *
       * La taille maximale d'une ressource vit dans `lib/files/formats.ts`,
       * et n'a plus de contrepartie ici.
       */
      bodySizeLimit: '1mb',
    },
  },

  /*
   * En-têtes de sécurité, sur toutes les routes — pages, routes techniques et
   * ressources statiques. La politique est construite dans
   * `lib/security/headers.ts`, où elle est documentée et testée.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          development: process.env.NODE_ENV === 'development',
        }),
      },
    ];
  },
};

export default nextConfig;
