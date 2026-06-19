/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Legacy routes from the old static PWA → keep installed apps / bookmarks alive.
  async redirects() {
    return [
      { source: "/inicio", destination: "/", permanent: false },
      { source: "/recompensas", destination: "/app/recompensas", permanent: false },
    ];
  },
};

export default nextConfig;
