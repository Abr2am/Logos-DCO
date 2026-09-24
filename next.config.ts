import type { NextConfig } from 'next';

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
};

export default nextConfig;
