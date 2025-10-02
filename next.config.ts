import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  rewrites: async () => {
    return [{
      source: '/sak/:saksmappe',
      destination: '/case/:saksmappe',
    }, {
      source: '/%C3%A1%C5%A1%C5%A1i/:saksmappe',
      destination: '/case/:saksmappe',
    }, {
      source: '/sak/:saksmappe/journalpost/:journalpost',
      destination: '/case/:saksmappe/record/:journalpost',
    }, {
      source: '/%C3%A1%C5%A1%C5%A1i/:saksmappe/journalapoasta/:journalpost',
      destination: '/case/:saksmappe/record/:journalpost',
    }]
  }
};

export default nextConfig;
