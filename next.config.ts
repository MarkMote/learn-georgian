import type { NextConfig } from "next";

// This app has moved to kvela.app. Every URL here (learn-georgian.markmote.com
// and learn-georgian.vercel.app) permanently redirects there, so visitors and
// search engines land on the current course.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/alphabet/:path*", destination: "https://kvela.app/georgian-alphabet", permanent: true },
      { source: "/alphabet", destination: "https://kvela.app/georgian-alphabet", permanent: true },
      { source: "/:path*", destination: "https://kvela.app/", permanent: true },
    ];
  },
};

export default nextConfig;
