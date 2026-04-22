/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uerpagaucgqoytcgwgdg.supabase.co",
      },
    ],
  },
};

export default nextConfig;
