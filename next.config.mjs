/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Identificador do build, usado pelo aviso de "nova versão disponível".
    // Na Vercel muda a cada deploy; localmente muda a cada build/dev server.
    NEXT_PUBLIC_APP_VERSION:
      process.env.VERCEL_DEPLOYMENT_ID ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      Date.now().toString(36),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
