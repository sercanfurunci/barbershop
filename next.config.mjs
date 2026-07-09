/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg", "cloudinary"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "X-XSS-Protection",         value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key:   "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // ponytail: unsafe-eval only in dev (Next HMR needs it). Prod drops it.
              process.env.NODE_ENV === "production"
                ? "script-src 'self' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://api.qrserver.com https://*.tile.openstreetmap.org",
              "connect-src 'self' https://nominatim.openstreetmap.org",
              "frame-src https://www.google.com https://maps.google.com",
              "frame-ancestors 'none'",
              "worker-src blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
