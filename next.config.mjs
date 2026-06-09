/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
