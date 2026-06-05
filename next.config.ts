import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  poweredByHeader: false,
  rewrites: async () => {
    return [{
      source: '/sak/:saksmappe',
      destination: '/case/:saksmappe',
    }, {
      source: '/%C3%A1%C5%A1%C5%A1i/:saksmappe',
      destination: '/case/:saksmappe',
    }, {
      source: '/sak/:saksmappe/journalpost/:journalpost',
      destination: '/case/:saksmappe/journalpost/:journalpost',
    }, {
      source: '/%C3%A1%C5%A1%C5%A1i/:saksmappe/journalpost/:journalpost',
      destination: '/case/:saksmappe/journalpost/:journalpost',
    }]
  }
};

export default nextConfig;
