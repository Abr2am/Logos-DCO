import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      /*
       * Les dépôts passent par une Server Action, afin que la validation du
       * fichier reste ENTIÈREMENT côté serveur. La limite par défaut est de
       * 1 Mo ; elle doit couvrir `MAX_UPLOAD_BYTES` (10 Mo) plus la surcharge
       * du multipart.
       *
       * ⚠️ Ces deux valeurs vont de pair : voir `lib/files/formats.ts`.
       */
      bodySizeLimit: '11mb',
    },
  },
};

export default nextConfig;
