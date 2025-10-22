/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "@heroicons/react"],
  },
};

export default nextConfig;
